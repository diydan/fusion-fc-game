import { ref, reactive, type Ref } from 'vue'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import type { BallState, CharacterMovement, SceneRefs } from '@/types/scene'

export function useBallPhysics(sceneRefs: SceneRefs, BALL_RADIUS: number, cameraPositionRef?: Ref<[number, number, number]>) {
  // Ball state - use current camera position if available, otherwise fallback to default
  const initialPosition = cameraPositionRef?.value || [-0.6490851683359558, 0.8801653969308788, 5.645342799355584]
  
  const ballState = reactive<BallState>({
    position: [...initialPosition] as [number, number, number],
    rotation: [0, 0, 0],
    velocity: { x: 0, y: 0, z: 0 },
    hidden: false,
    rollingFromCamera: false,
    scriptedAnimationActive: false
  })
  
  // Add a flag to track when ball should be completely stationary
  const ballStationary = false

  // Character movement state
  const characterMovement = reactive<CharacterMovement>({
    isRunningOff: false,
    runStartTime: 0,
    startPosition: [0, 0, 0],
    runSpeed: 5.0
  })

  // Load ball model - using OBJ model with PBR textures from /props/Ball/
  const loadBallModel = async () => {
    try {
      // Load textures first
      const textureLoader = new THREE.TextureLoader()
      
      // Load PBR textures for black parts
      const blackBaseColor = textureLoader.load('/props/Ball/Ball_Black_s_BaseColor.png')
      const blackNormal = textureLoader.load('/props/Ball/Ball_Black_s_Normal.png')
      const blackRoughness = textureLoader.load('/props/Ball/Ball_Black_s_Roughness.png')
      const blackMetallic = textureLoader.load('/props/Ball/Ball_Black_s_Metallic.png')
      const blackHeight = textureLoader.load('/props/Ball/Ball_Black_s_Height.png')
      
      // Load PBR textures for white parts
      const whiteBaseColor = textureLoader.load('/props/Ball/Ball_White_s_BaseColor.png')
      const whiteNormal = textureLoader.load('/props/Ball/Ball_White_s_Normal.png')
      const whiteRoughness = textureLoader.load('/props/Ball/Ball_White_s_Roughness.png')
      const whiteMetallic = textureLoader.load('/props/Ball/Ball_White_s_Metallic.png')
      const whiteHeight = textureLoader.load('/props/Ball/Ball_White_s_Height.png')
      
      // Configure texture settings
      const configureTexture = (texture: THREE.Texture) => {
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
      }
      
      // Configure all textures
      ;[blackBaseColor, blackNormal, blackRoughness, blackMetallic, blackHeight,
        whiteBaseColor, whiteNormal, whiteRoughness, whiteMetallic, whiteHeight].forEach(configureTexture)
      
      // Create materials
      const blackMaterial = new THREE.MeshStandardMaterial({
        map: blackBaseColor,
        normalMap: blackNormal,
        roughnessMap: blackRoughness,
        metalnessMap: blackMetallic,
        displacementMap: blackHeight,
        displacementScale: 0.01,
        roughness: 1.0,
        metalness: 0.0,
      })
      
      const whiteMaterial = new THREE.MeshStandardMaterial({
        map: whiteBaseColor,
        normalMap: whiteNormal,
        roughnessMap: whiteRoughness,
        metalnessMap: whiteMetallic,
        displacementMap: whiteHeight,
        displacementScale: 0.01,
        roughness: 1.0,
        metalness: 0.0,
      })
      
      // Load MTL file first, then OBJ
      const mtlLoader = new MTLLoader()
      mtlLoader.setPath('/props/Ball/')
      
      const materials = await mtlLoader.loadAsync('Ball.mtl')
      materials.preload()
      
      // Override materials with our PBR materials
      // The MTL file will tell us which material names to use
      const materialNames = Object.keys(materials.materials)
      // Replace materials with our PBR versions
      materialNames.forEach(name => {
        if (name.toLowerCase().includes('black')) {
          materials.materials[name] = blackMaterial
        } else if (name.toLowerCase().includes('white')) {
          materials.materials[name] = whiteMaterial
        }
      })
      
      // Load OBJ file
      const objLoader = new OBJLoader()
      objLoader.setMaterials(materials)
      objLoader.setPath('/props/Ball/')
      
      // TEMPORARY: Skip loading ball model as file is missing
      // const ballModel = await objLoader.loadAsync('Ball.obj')
      
      // Create simple sphere as fallback
      const ballGeometry = new THREE.SphereGeometry(BALL_RADIUS * 1.2, 32, 16)
      const ballModel = new THREE.Mesh(ballGeometry, whiteMaterial)
      
      // Scale and position the ball (10x smaller, then 20% bigger)
      ballModel.scale.setScalar(BALL_RADIUS * 1.2 * 1.2) // 20% bigger ball
      ballModel.position.set(0, 0, 0)
      
      // Apply shadows to all meshes
      ballModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = false
        }
      })
      
      if (sceneRefs.ballModelGroup) {
        // Clear existing children
        while (sceneRefs.ballModelGroup.children.length > 0) {
          sceneRefs.ballModelGroup.remove(sceneRefs.ballModelGroup.children[0])
        }
        
        sceneRefs.ballModelGroup.add(ballModel)
        ballState.hidden = false
        
        // Set initial position
        sceneRefs.ballModelGroup.position.set(
          ballState.position[0],
          ballState.position[1],
          ballState.position[2]
        )
        
        sceneRefs.ballModelGroup.matrixAutoUpdate = true
        sceneRefs.ballModelGroup.updateMatrix()
        
        }
      
    } catch (error) {
      }
  }

  // Update ball physics - realistic soccer ball physics
  const updateBallPhysics = (deltaTime: number) => {
    // Skip physics when scripted animation is active OR ball is stationary
    if (ballState.scriptedAnimationActive || ballStationary) {
      return
    }

    // Realistic physics constants
    const gravity = -9.81 // m/s²
    const airDensity = 1.225 // kg/m³
    const ballMass = 0.43 // kg (FIFA regulation)
    const ballRadius = BALL_RADIUS
    const ballArea = Math.PI * ballRadius * ballRadius
    const dragCoefficient = 0.47 // sphere drag coefficient
    const rollingFriction = 0.02 // grass rolling resistance
    const bounceDamping = 0.6 // energy loss on bounce
    const spinDecay = 0.98 // spin decay factor
    
    // Calculate current speed
    const speed = Math.sqrt(
      ballState.velocity.x * ballState.velocity.x + 
      ballState.velocity.y * ballState.velocity.y + 
      ballState.velocity.z * ballState.velocity.z
    )
    
    // Apply gravity
    ballState.velocity.y += gravity * deltaTime
    
    // Apply air resistance (drag force)
    if (speed > 0.1) {
      const dragForce = 0.5 * airDensity * speed * speed * dragCoefficient * ballArea
      const dragAcceleration = dragForce / ballMass
      
      // Apply drag opposite to velocity direction
      const velocityMagnitude = Math.sqrt(
        ballState.velocity.x * ballState.velocity.x + 
        ballState.velocity.y * ballState.velocity.y + 
        ballState.velocity.z * ballState.velocity.z
      )
      
      if (velocityMagnitude > 0) {
        const dragFactor = Math.min(dragAcceleration * deltaTime / velocityMagnitude, 1)
        ballState.velocity.x *= (1 - dragFactor)
        ballState.velocity.y *= (1 - dragFactor * 0.5) // Less drag on Y for realistic trajectory
        ballState.velocity.z *= (1 - dragFactor)
      }
    }
    
    // Update position based on velocity
    const newPosition = [...ballState.position]
    newPosition[0] += ballState.velocity.x * deltaTime
    newPosition[1] += ballState.velocity.y * deltaTime
    newPosition[2] += ballState.velocity.z * deltaTime
    
    // Ground collision with realistic bounce
    if (newPosition[1] <= BALL_RADIUS) {
      newPosition[1] = BALL_RADIUS
      
      // Realistic bounce with energy loss
      if (ballState.velocity.y < 0) {
        ballState.velocity.y = -ballState.velocity.y * bounceDamping
        
        // Only bounce if velocity is significant enough
        if (Math.abs(ballState.velocity.y) < 0.5) {
          ballState.velocity.y = 0
        }
      }
      
      // Apply rolling friction when on ground
      const horizontalSpeed = Math.sqrt(ballState.velocity.x * ballState.velocity.x + ballState.velocity.z * ballState.velocity.z)
      if (horizontalSpeed > 0.01) {
        const frictionForce = rollingFriction * ballMass * Math.abs(gravity)
        const frictionAcceleration = frictionForce / ballMass
        const frictionFactor = Math.min(frictionAcceleration * deltaTime / horizontalSpeed, 1)
        
        ballState.velocity.x *= (1 - frictionFactor)
        ballState.velocity.z *= (1 - frictionFactor)
      } else {
        // Stop very slow movement
        ballState.velocity.x = 0
        ballState.velocity.z = 0
      }
    } else {
      // Add small random bounces when rolling on grass (not in air)
      if (ballState.velocity.y > -0.1 && ballState.velocity.y < 0.1) {
        const horizontalSpeed = Math.sqrt(ballState.velocity.x * ballState.velocity.x + ballState.velocity.z * ballState.velocity.z)
        if (horizontalSpeed > 0.1 && Math.random() < 0.01) { // 1% chance per frame when moving
          ballState.velocity.y += Math.random() * 0.3 // Small upward impulse
        }
      }
    }
    
    // Realistic ball rotation based on rolling motion
    const horizontalVelocity = Math.sqrt(ballState.velocity.x * ballState.velocity.x + ballState.velocity.z * ballState.velocity.z)
    
    if (horizontalVelocity > 0.01) {
      // Simple rolling rotation with correct direction
      const rotationSpeed = horizontalVelocity / ballRadius * 0.3 // Scale for visual appeal
      
      // Correct rotation direction for rolling ball
      // Forward velocity (positive Z) = forward rotation (positive X)
      // Right velocity (positive X) = right rotation (negative Z)
      ballState.rotation[0] += ballState.velocity.z * deltaTime * rotationSpeed
      ballState.rotation[2] -= ballState.velocity.x * deltaTime * rotationSpeed
      
      // Add very slight random wobble for realism
      const wobble = 0.0005
      ballState.rotation[0] += (Math.random() - 0.5) * wobble * deltaTime
      ballState.rotation[2] += (Math.random() - 0.5) * wobble * deltaTime
    }
    
    // Apply spin decay
    ballState.rotation[0] *= spinDecay
    ballState.rotation[2] *= spinDecay
    
    // Update ball position
    ballState.position = [newPosition[0], newPosition[1], newPosition[2]]
    
    // Update the ball model group position and rotation
    if (sceneRefs.ballModelGroup) {
      sceneRefs.ballModelGroup.position.set(
        ballState.position[0],
        ballState.position[1],
        ballState.position[2]
      )
      sceneRefs.ballModelGroup.rotation.set(
        ballState.rotation[0],
        ballState.rotation[1],
        ballState.rotation[2]
      )
    }
  }

  // Animate ball to position - pure realistic physics simulation
  const animateBallToPosition = (targetPosition: [number, number, number], duration: number) => {
    ballState.scriptedAnimationActive = true
    const startPos = [...ballState.position]
    const targetPos = [targetPosition[0], BALL_RADIUS, targetPosition[2]]
    
    // Give ball a slight initial height for natural physics
    if (ballState.position[1] <= BALL_RADIUS + 0.01) {
      ballState.position[1] = BALL_RADIUS + 0.05 // Start slightly above ground
      }
    
    // Calculate distance and direction
    const dx = targetPos[0] - startPos[0]
    const dz = targetPos[2] - startPos[2]
    const distance = Math.sqrt(dx * dx + dz * dz)
    
    if (distance < 0.05) {
      ballState.scriptedAnimationActive = false
      return
    }
    
    // Calculate initial velocity with improved physics consideration
    const timeToTarget = duration / 1000 // seconds
    const baseSpeedNeeded = distance / timeToTarget
    
    // Reduced multiplier for better control and 10% slower movement
    const energyLossMultiplier = 1.2 // Reduced from 1.6 for less overshooting
    const speedReductionFactor = 0.7 // 20% speed reduction
    const initialSpeedNeeded = baseSpeedNeeded * energyLossMultiplier * speedReductionFactor
    
    // Add height-based velocity adjustment
    const heightDiff = targetPos[1] - startPos[1]
    const heightFactor = Math.max(0, 1 - Math.abs(heightDiff) * 0.5) // Reduce speed if height difference is significant
    
    // Set initial velocity toward target with height consideration
    const direction = { x: dx / distance, z: dz / distance }
    const adjustedSpeed = initialSpeedNeeded * heightFactor
    ballState.velocity.x = direction.x * adjustedSpeed
    ballState.velocity.z = direction.z * adjustedSpeed
    // Adjust initial Y velocity based on height difference
    ballState.velocity.y = heightDiff > 0 ? 0.15 : 0.05 // Adaptive initial lift
    
    // Realistic physics constants
    const gravity = -9.81 // m/s²
    const airDensity = 1.225 // kg/m³
    const ballMass = 0.43 // kg (FIFA regulation)
    const ballRadius = BALL_RADIUS
    const ballArea = Math.PI * ballRadius * ballRadius
    const dragCoefficient = 0.47 // sphere
    const rollingFriction = 0.02 // grass coefficient
    const bounceDamping = 0.6 // energy loss on bounce
    
    // Animation state
    const startTime = Date.now()
    let lastUpdateTime = startTime
    let isAnimating = true
    
    // Bounce tracking flags
    let firstBounceTriggered = false
    let secondBounceTriggered = false
    const firstBounceTime = startTime + (duration * 0.25) // 25% of duration
    const secondBounceTime = startTime + (duration * 0.6) // 60% of duration
    
    const simulate = () => {
      if (!isAnimating) return
      
      const currentTime = Date.now()
      const elapsed = currentTime - startTime // Calculate elapsed time
      const realDeltaTime = Math.min((currentTime - lastUpdateTime) / 1000, 0.033) // Cap at 30fps
      lastUpdateTime = currentTime
      
      // Store previous position for rotation
      const prevPos = [...ballState.position]
      
      // Calculate current speed
      const currentSpeed = Math.sqrt(
        ballState.velocity.x * ballState.velocity.x + 
        ballState.velocity.y * ballState.velocity.y + 
        ballState.velocity.z * ballState.velocity.z
      )
      
      // Apply gravity
      ballState.velocity.y += gravity * realDeltaTime
      
      // Apply air resistance (drag force: F = 0.5 * ρ * v² * Cd * A)
      if (currentSpeed > 0.1) {
        const dragForce = 0.5 * airDensity * currentSpeed * currentSpeed * dragCoefficient * ballArea
        const dragAcceleration = dragForce / ballMass
        
        if (currentSpeed > 0) {
          const dragFactor = Math.min(dragAcceleration * realDeltaTime / currentSpeed, 1)
          ballState.velocity.x *= (1 - dragFactor)
          ballState.velocity.y *= (1 - dragFactor * 0.5) // Less drag on Y
          ballState.velocity.z *= (1 - dragFactor)
        }
      }
      
      // Update position based on velocity (natural physics)
      ballState.position[0] += ballState.velocity.x * realDeltaTime
      ballState.position[1] += ballState.velocity.y * realDeltaTime  // Let gravity work naturally
      ballState.position[2] += ballState.velocity.z * realDeltaTime
      
      // Ground collision physics  
      if (ballState.position[1] <= BALL_RADIUS) {
        ballState.position[1] = BALL_RADIUS
        
        // Realistic bounce with energy loss
        if (ballState.velocity.y < -0.1) { // Only bounce if falling with some speed
          ballState.velocity.y = -ballState.velocity.y * bounceDamping
          
          // Stop very small bounces
          if (Math.abs(ballState.velocity.y) < 0.2) {
            ballState.velocity.y = 0
            }
        } else if (ballState.velocity.y < 0) {
          // Just stop downward motion for very small velocities
          ballState.velocity.y = 0
        }
        
        // Apply rolling friction when on ground
        const horizontalSpeed = Math.sqrt(ballState.velocity.x * ballState.velocity.x + ballState.velocity.z * ballState.velocity.z)
        if (horizontalSpeed > 0.01) {
          const frictionForce = rollingFriction * ballMass * Math.abs(gravity)
          const frictionAcceleration = frictionForce / ballMass
          const frictionFactor = Math.min(frictionAcceleration * realDeltaTime / horizontalSpeed, 1)
          
          ballState.velocity.x *= (1 - frictionFactor)
          ballState.velocity.z *= (1 - frictionFactor)
          
          // MINIMAL DYNAMIC CORRECTION FORCE (like wind/terrain assistance)
          // Calculate distance and direction to target
          const distanceToTarget = Math.sqrt(
            Math.pow(ballState.position[0] - targetPos[0], 2) + 
            Math.pow(ballState.position[2] - targetPos[2], 2)
          )
          
          if (distanceToTarget > 0.08) { // Only apply if not very close to target
            // Calculate direction to target
            const directionToTarget = {
              x: (targetPos[0] - ballState.position[0]) / distanceToTarget,
              z: (targetPos[2] - ballState.position[2]) / distanceToTarget
            }
            
            // Dynamic correction strength based on:
            // - How slow the ball is (more correction when slowing down)
            // - How far from target (gentle scaling with distance)
            // - Natural environmental force limits
            const speedFactor = Math.max(0, 1 - horizontalSpeed / 1.5) // More correction when slower
            const distanceFactor = Math.min(distanceToTarget / 1.0, 1) // Scale with distance
            const maxCorrectionForce = 0.064 // Reduced by 20% for slower movement (from 0.08)
            
            // Progressive correction - stronger when further from target
            const distanceThreshold = 0.5 // Distance at which correction starts reducing
            const distanceScale = Math.min(distanceToTarget / distanceThreshold, 1)
            const correctionStrength = speedFactor * distanceFactor * maxCorrectionForce * distanceScale
            
            // Apply gentle correction as acceleration (like environmental assistance)
            if (correctionStrength > 0.01) {
              ballState.velocity.x += directionToTarget.x * correctionStrength * realDeltaTime
              ballState.velocity.z += directionToTarget.z * correctionStrength * realDeltaTime
              
              // Debug: Log when significant correction is applied
              // Correction debug logging removed
            }
            
            // SIMPLE DYNAMIC ADJUSTMENT - Just gentle guidance when slow
            const timeRemaining = Math.max(0, (startTime + duration - currentTime) / 1000)
            if (timeRemaining > 1.0 && distanceToTarget > 0.2 && horizontalSpeed < 0.3) {
              // Only boost if ball is moving too slowly and far from target
              const gentleBoost = 0.05 // Very small boost
              ballState.velocity.x += directionToTarget.x * gentleBoost * realDeltaTime
              ballState.velocity.z += directionToTarget.z * gentleBoost * realDeltaTime
              
              // Gentle boost debugging removed
            }
          }
        } else {
          // Stop very slow movement
          ballState.velocity.x = 0
          ballState.velocity.z = 0
        }
        
        // Add occasional small bounces for uneven grass
        if (horizontalSpeed > 0.1 && Math.random() < 0.005) {
          ballState.velocity.y += Math.random() * 0.2
        }
      }
      
      // Realistic rolling rotation (no-slip condition: v = ωr)
      const horizontalVelocity = Math.sqrt(ballState.velocity.x * ballState.velocity.x + ballState.velocity.z * ballState.velocity.z)
      
      if (horizontalVelocity > 0.01 && ballState.position[1] <= BALL_RADIUS + 0.01) {
        // Calculate angular velocity: ω = v/r
        const angularVelocity = horizontalVelocity / ballRadius
        
        // Apply rotation based on movement direction
        ballState.rotation[0] += ballState.velocity.z * realDeltaTime * angularVelocity / horizontalVelocity
        ballState.rotation[2] -= ballState.velocity.x * realDeltaTime * angularVelocity / horizontalVelocity
        
        // Add realistic surface irregularity wobble
        const surfaceWobble = Math.min(horizontalVelocity * 0.001, 0.003)
        ballState.rotation[0] += (Math.random() - 0.5) * surfaceWobble * realDeltaTime
        ballState.rotation[2] += (Math.random() - 0.5) * surfaceWobble * realDeltaTime
      }
      
      // Apply spin decay (air resistance on rotation)
      ballState.rotation[0] *= 0.999
      ballState.rotation[2] *= 0.999
      
      // Update visual representation
      if (sceneRefs.ballModelGroup) {
        sceneRefs.ballModelGroup.position.set(
          ballState.position[0],
          ballState.position[1],
          ballState.position[2]
        )
        sceneRefs.ballModelGroup.rotation.set(
          ballState.rotation[0],
          ballState.rotation[1],
          ballState.rotation[2]
        )
      }
      
      // Physics-based stopping conditions
      const currentHorizontalSpeed = Math.sqrt(ballState.velocity.x * ballState.velocity.x + ballState.velocity.z * ballState.velocity.z)
      const elapsedMs = currentTime - startTime
      
      // PLANNED BOUNCES - Time-based triggers with debugging
      // Debug: Check bounce conditions every frame
      // Bounce condition debugging removed
      
      // First bounce with speed-based height
      if (!firstBounceTriggered && currentTime >= firstBounceTime && currentHorizontalSpeed > 0.1) {
        // Scale bounce height based on current speed
        const bounceHeight = Math.min(0.4 + (currentHorizontalSpeed * 0.1), 0.8)
        ballState.velocity.y += bounceHeight + (Math.random() * 0.2)
        firstBounceTriggered = true
      }
      
      // Second bounce with reduced height
      if (!secondBounceTriggered && currentTime >= secondBounceTime && currentHorizontalSpeed > 0.05) {
        // Smaller second bounce
        const bounceHeight = Math.min(0.2 + (currentHorizontalSpeed * 0.05), 0.4)
        ballState.velocity.y += bounceHeight + (Math.random() * 0.1)
        secondBounceTriggered = true
      }
      
      // Debug: Always log when bounce times are reached
      // Bounce debug logging removed
      
      // Enhanced stopping conditions to prevent overshooting
      const distanceToTarget = Math.sqrt(
        Math.pow(ballState.position[0] - targetPos[0], 2) + 
        Math.pow(ballState.position[2] - targetPos[2], 2)
      )
      // Stop when ball is close enough and slow, or when maximum time exceeded
      if ((distanceToTarget < 0.05 && currentHorizontalSpeed < 0.08) || 
          currentHorizontalSpeed < 0.05 || 
          elapsedMs > duration * 2) {
        isAnimating = false
        
        // Natural stop - keep final position where physics ended
        ballState.velocity.x = 0
        ballState.velocity.y = 0
        ballState.velocity.z = 0
        
        const finalDistance = Math.sqrt(
          Math.pow(ballState.position[0] - targetPos[0], 2) + 
          Math.pow(ballState.position[2] - targetPos[2], 2)
        )
        
        // Brief pause before releasing physics control
        setTimeout(() => {
          ballState.scriptedAnimationActive = false
          }, 200)
      } else {
        requestAnimationFrame(simulate)
      }
      
      // Debug logging every 400ms
      // Physics debug logging removed
    }
    
    // Start pure physics simulation
    simulate()
  }

  // Animate ball with physics
  const animateBallWithPhysics = (startPos: number[], targetPos: number[], duration: number, onComplete?: () => void) => {
    ballState.scriptedAnimationActive = true
    const startTime = Date.now()
    const gravity = 9.81

    const dx = targetPos[0] - startPos[0]
    const dy = targetPos[1] - startPos[1]
    const dz = targetPos[2] - startPos[2]
    
    const timeOfFlight = duration / 1000
    
    const vx = dx / timeOfFlight
    const vz = dz / timeOfFlight
    const vy = (dy + 0.5 * gravity * timeOfFlight * timeOfFlight) / timeOfFlight
    
    const direction = new THREE.Vector3(dx, dy, dz).normalize()
    const rotationSpeed = 1 / BALL_RADIUS

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000
      const progress = Math.min(elapsed / timeOfFlight, 1)
      
      if (progress < 1) {
        const x = startPos[0] + vx * elapsed
        const y = startPos[1] + vy * elapsed - 0.5 * gravity * elapsed * elapsed
        const z = startPos[2] + vz * elapsed
        
        ballState.position = [x, y, z]
        
        const distanceTraveled = Math.sqrt(
          Math.pow(x - startPos[0], 2) +
          Math.pow(z - startPos[2], 2)
        )
        
        const rotationX = direction.z * distanceTraveled * rotationSpeed
        const rotationZ = -direction.x * distanceTraveled * rotationSpeed
        
        ballState.rotation = [rotationX, ballState.rotation[1], rotationZ]
        
        // Update the ball model group position and rotation
        if (sceneRefs.ballModelGroup) {
          sceneRefs.ballModelGroup.position.set(
            ballState.position[0],
            ballState.position[1],
            ballState.position[2]
          )
          sceneRefs.ballModelGroup.rotation.set(
            ballState.rotation[0],
            ballState.rotation[1],
            ballState.rotation[2]
          )
        }
        
        requestAnimationFrame(animate)
      } else {
        ballState.position = [targetPos[0], targetPos[1], targetPos[2]]
        // Stop all ball movement when animation completes
        ballState.velocity.x = 0
        ballState.velocity.y = 0
        ballState.velocity.z = 0
        ballState.scriptedAnimationActive = false
        
        // Final position update
        if (sceneRefs.ballModelGroup) {
          sceneRefs.ballModelGroup.position.set(
            ballState.position[0],
            ballState.position[1],
            ballState.position[2]
          )
        }
        
        // Call completion callback if provided
        if (onComplete) {
          onComplete()
        }
      }
    }
    
    animate()
  }

  // Function to update ball position to current camera position
  const updateBallToCameraPosition = () => {
    if (cameraPositionRef?.value) {
      ballState.position = [...cameraPositionRef.value] as [number, number, number]
      
      // Update ball model position if it exists
      if (sceneRefs.ballModelGroup) {
        sceneRefs.ballModelGroup.position.set(
          ballState.position[0],
          ballState.position[1],
          ballState.position[2]
        )
      }
    }
  }

  return {
    ballState,
    characterMovement,
    loadBallModel,
    updateBallPhysics,
    animateBallToPosition,
    animateBallWithPhysics,
    updateBallToCameraPosition
  }
}
