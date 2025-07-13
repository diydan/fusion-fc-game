import * as THREE from 'three'
import type { SceneRefs } from '@/types/scene'

// Create a shared glow material
const glowMaterial = new THREE.MeshStandardMaterial({
  emissive: new THREE.Color(0x00ffff),
  emissiveIntensity: 0.5,
  transparent: true,
  opacity: 1
})

// Create a shared glow light
const glowLight = new THREE.PointLight(0x00ffff, 2, 5)

export function useCoinPhysics(sceneRefs: SceneRefs, cameraPositionRef: any, triggerPowerUpFlash?: (target: 'character' | 'torus') => void, playCoinSpin?: () => void, playCoinHitTorusSound?: () => void, playPowerUpAnimation?: () => void, playVictorySound?: () => void, onCoinCollected?: () => void) {
  const shootCoin = () => {
    if (playCoinSpin) {
      playCoinSpin();
    }
    
    // Play power-up animation when coin is shot
    if (playPowerUpAnimation) {
      playPowerUpAnimation();
    }

    // Get character's position
    const characterPosition = new THREE.Vector3()
    if (sceneRefs.model) {
      sceneRefs.model.getWorldPosition(characterPosition)
      // Adjust Y position to target torso
      characterPosition.y += 1.0 // Adjust this value to target the torso
    } else {
      return
    }

    // Get camera and calculate screen center in world space
    const camera = sceneRefs.camera
    if (!camera) {
      return
    }

    // Calculate the absolute dead center of the screen in world coordinates
    // This uses the camera's view matrix to find the exact center point
    const screenCenter = new THREE.Vector3(0, 0, 0) // Screen center in normalized device coordinates
    screenCenter.unproject(camera) // Convert to world coordinates

    // Move the center position slightly forward from the camera to avoid clipping
    const cameraDirection = new THREE.Vector3()
    camera.getWorldDirection(cameraDirection)
    const deadCenterPosition = screenCenter.clone().add(cameraDirection.multiplyScalar(0.5))

    // Calculate direction from dead center to target
    const direction = new THREE.Vector3()
    direction.subVectors(characterPosition, deadCenterPosition).normalize()
    // Calculate distance to target
    const distanceToTarget = deadCenterPosition.distanceTo(characterPosition)
    // Create coin geometry and material
    const coinGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.005, 32)
    const coinMaterial = new THREE.MeshStandardMaterial({
      color: 0xC0C0C0, // Silver color
      metalness: 1,
      roughness: 0.7,
      envMapIntensity: 0.2,
      emissive: new THREE.Color(0xC0C0C0),
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 1
    })
    
    const coin = new THREE.Mesh(coinGeometry, coinMaterial)
    coin.castShadow = true
    coin.receiveShadow = false
    
    // Add coin to scene
    sceneRefs.scene?.add(coin)
    // Calculate initial velocity based on distance and direction
    const baseSpeed = 12 // Base speed for the coin
    const distanceFactor = Math.min(distanceToTarget * 0.5, 15) // Scale speed with distance, but cap it
    const initialVelocity = direction.clone().multiplyScalar(baseSpeed + distanceFactor)
    
    // Add upward velocity based on distance
    const upwardFactor = Math.min(distanceToTarget * 0.2, 10) // Scale upward velocity with distance
    initialVelocity.y += upwardFactor
    
    // Animate coin
    coin.position.copy(deadCenterPosition) // Set initial position of the coin at dead center of screen

    const currentCoinVelocity = initialVelocity.clone()
    let lastTime = Date.now()
    const coinSpawnTime = Date.now()
    const coinMaxLifetime = 7000 // Max lifetime in milliseconds (7 seconds)
    let comboFlashTriggeredByHit = false;

    // Heat-seeking parameters (tune these)
    const maxCoinSpeed = 18 
    const maxSteeringForce = 100
    const gravity = new THREE.Vector3(0, -4.8, 0)

    const animate = () => {
      const currentTime = Date.now()
      const deltaTime = (currentTime - lastTime) / 1000.0 // deltaTime in seconds
      lastTime = currentTime

      const torus = sceneRefs.torus
      // Ensure torus and its matrixWorld are available
      const currentTargetPosition = (torus && torus.matrixWorld) ? new THREE.Vector3().setFromMatrixPosition(torus.matrixWorld) : null

      if (currentTargetPosition) {
        // Calculate desired velocity
        const desiredVelocity = new THREE.Vector3().subVectors(currentTargetPosition, coin.position)
        desiredVelocity.normalize().multiplyScalar(maxCoinSpeed)

        // Calculate steering force
        const steeringForce = new THREE.Vector3().subVectors(desiredVelocity, currentCoinVelocity)
        steeringForce.clampLength(0, maxSteeringForce * deltaTime) // Limit the steering force (now per-frame effective force)

        // Apply steering force to current velocity
        currentCoinVelocity.add(steeringForce) // deltaTime is already incorporated into steeringForce
        currentCoinVelocity.clampLength(0, maxCoinSpeed) // Cap speed
      }

      // Apply gravity
      currentCoinVelocity.add(gravity.clone().multiplyScalar(deltaTime))

      // Update coin position
      coin.position.add(currentCoinVelocity.clone().multiplyScalar(deltaTime))

      // Rotate coin
      coin.rotation.x += 0.3
      coin.rotation.y += 0.2 // Add some Y rotation for more dynamic spin
      coin.rotation.z += 0.3

      // Collision and lifetime checks
      const coinPosition = coin.position.clone()
      const elapsedLifetime = Date.now() - coinSpawnTime

      // Check distance to character (using the initial character position for simplicity)
      const distanceToCharacter = coinPosition.distanceTo(characterPosition) 
      const hitCharacter = distanceToCharacter < 1.0 // Increased collision radius for character
      
      // Debug: Log collision detection details
      if (distanceToCharacter < 3.0) { // Log when coin is getting close
        // Collision check debugging removed
      }

      // Check for collision with torus
      const torusRadius = 0.8 // Adjusted torus collision radius, tune as needed
      const distanceToTorus = currentTargetPosition ? coinPosition.distanceTo(currentTargetPosition) : Infinity
      const hitTorus = currentTargetPosition && distanceToTorus < torusRadius
      
      let shouldRemoveCoin = false
      let hitTargetType = 'missed'

      if (hitTorus) {
        shouldRemoveCoin = true
        hitTargetType = 'torus'
        if (triggerPowerUpFlash) {
          triggerPowerUpFlash('character');
          triggerPowerUpFlash('torus');
          comboFlashTriggeredByHit = true;
        }
        if (playCoinHitTorusSound) {
          playCoinHitTorusSound();
        }
        if (playVictorySound) {
          setTimeout(() => {
            playVictorySound();
          }, 2000); // 2 second delay
        }
        if (onCoinCollected) {
          onCoinCollected();
        }
      } else if (hitCharacter) {
        shouldRemoveCoin = true
        hitTargetType = 'character'
        if (triggerPowerUpFlash) {
          triggerPowerUpFlash('character');
        }
        if (playPowerUpAnimation) {
          playPowerUpAnimation();
        }
        if (playVictorySound) {
          setTimeout(() => {
            playVictorySound();
          }, 2000); // 2 second delay
        }
        if (onCoinCollected) {
          onCoinCollected();
        }
      } else if (elapsedLifetime > coinMaxLifetime) {
        shouldRemoveCoin = true
        hitTargetType = 'lifetime_exceeded'
        } else if (coin.position.y < -10) { // Remove if it falls too far
        shouldRemoveCoin = true;
        hitTargetType = 'out_of_bounds';
        }

      if (shouldRemoveCoin) {
        sceneRefs.scene?.remove(coin)
        coin.geometry.dispose()
        if (Array.isArray(coin.material)) {
          coin.material.forEach(m => m.dispose());
        } else {
          (coin.material as THREE.Material).dispose();
        }
        return // Stop animation for this coin
      }

      requestAnimationFrame(animate)
    }

    animate()

    // Fallback timeout for combo flash
    setTimeout(() => {
      if (!comboFlashTriggeredByHit && triggerPowerUpFlash && sceneRefs.torus) {
        triggerPowerUpFlash('character');
        triggerPowerUpFlash('torus');
      }
    }, 2000);

  }

  return {
    shootCoin
  }
} 