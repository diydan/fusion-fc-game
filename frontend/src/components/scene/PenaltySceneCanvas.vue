<template>
  <TresCanvas
    ref="canvasRef"
    class="penalty-canvas"
    :shadows="true"
    :alpha="true"
    :antialias="true"
    :power-preference="powerPreference"
    :dpr="[1, 2]"
    :physicallyCorrectLights="true"
    :toneMapping="ACESFilmicToneMapping"
    :toneMappingExposure="1.0"
    :outputColorSpace="SRGBColorSpace"
    :gl="{ 
      preserveDrawingBuffer: true,
      shadowMapEnabled: true,
      shadowMapType: PCFSoftShadowMap
    }"
    @created="onSceneCreated"
    @ready="onSceneReady"
    @before-render="onBeforeRender"
  >
    <!-- Scene Setup -->
    <TresPerspectiveCamera
      ref="cameraRef"
      :position="cameraPosition"
      :fov="cameraFov"
      :aspect="1"
      :near="0.1"
      :far="100"
      :look-at="[0, 0, 0]"
    />

    <!-- Lighting -->
    <TresAmbientLight :intensity="0.4" />
    <TresDirectionalLight
      :position="[10, 10, 5]"
      :intensity="1"
      :cast-shadow="true"
      :shadow-mapSize-width="2048"
      :shadow-mapSize-height="2048"
      :shadow-camera-near="0.1"
      :shadow-camera-far="50"
      :shadow-camera-left="-20"
      :shadow-camera-right="20"
      :shadow-camera-top="20"
      :shadow-camera-bottom="-20"
    />

    <!-- Stadium Environment -->
    <TresMesh :position="[0, -0.5, 0]" :receive-shadow="true">
      <TresPlaneGeometry :args="[50, 50]" />
      <TresMeshStandardMaterial color="#228B22" />
    </TresMesh>

    <!-- Goal -->
    <TresGroup :position="goalPosition">
      <!-- Goal Posts -->
      <TresMesh :position="[-3.66, 1.2, 0]" :cast-shadow="true">
        <TresCylinderGeometry :args="[0.05, 0.05, 2.4]" />
        <TresMeshStandardMaterial color="#ffffff" />
      </TresMesh>
      <TresMesh :position="[3.66, 1.2, 0]" :cast-shadow="true">
        <TresCylinderGeometry :args="[0.05, 0.05, 2.4]" />
        <TresMeshStandardMaterial color="#ffffff" />
      </TresMesh>
      <!-- Crossbar -->
      <TresMesh :position="[0, 2.4, 0]" :cast-shadow="true" :rotation="[0, 0, Math.PI / 2]">
        <TresCylinderGeometry :args="[0.05, 0.05, 7.32]" />
        <TresMeshStandardMaterial color="#ffffff" />
      </TresMesh>
      <!-- Goal Net -->
      <TresMesh :position="[0, 1.2, -0.5]">
        <TresBoxGeometry :args="[7.32, 2.4, 0.01]" />
        <TresMeshStandardMaterial 
          color="#ffffff" 
          :transparent="true" 
          :opacity="0.3"
          :wireframe="true"
        />
      </TresMesh>
    </TresGroup>

    <!-- Ball -->
    <TresMesh 
      ref="ballRef"
      :position="ballPosition" 
      :cast-shadow="true"
      :scale="ballScale"
    >
      <TresSphereGeometry :args="[0.11, 32, 32]" />
      <TresMeshStandardMaterial color="#ffffff" />
    </TresMesh>

    <!-- Goalkeeper -->
    <TresMesh 
      ref="keeperRef"
      :position="keeperPosition" 
      :cast-shadow="true"
    >
      <TresCapsuleGeometry :args="[0.3, 1.6, 4, 8]" />
      <TresMeshStandardMaterial color="#FF6B00" />
    </TresMesh>

    <!-- Player -->
    <TresMesh 
      :position="playerPosition" 
      :cast-shadow="true"
    >
      <TresCapsuleGeometry :args="[0.3, 1.6, 4, 8]" />
      <TresMeshStandardMaterial color="#0066CC" />
    </TresMesh>

    <!-- Stadium Atmosphere -->
    <TresMesh :position="[0, 0, -15]">
      <TresPlaneGeometry :args="[30, 20]" />
      <TresMeshStandardMaterial color="#1a1a1a" />
    </TresMesh>
  </TresCanvas>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { ACESFilmicToneMapping, SRGBColorSpace, PCFSoftShadowMap, Vector3 } from 'three'

interface Props {
  qualityLevel: 'low' | 'medium' | 'high'
  cameraFov: number
  goalPosition: [number, number, number]
  ballPosition: [number, number, number]
  playerPosition: [number, number, number]
  isMobile: boolean
  isShooting: boolean
  shotDirection: [number, number]
}

interface Emits {
  (e: 'fps-update', fps: number): void
  (e: 'scene-ready'): void
  (e: 'goal-scored'): void
  (e: 'goal-missed'): void
  (e: 'keeper-save'): void
}

const props = withDefaults(defineProps<Props>(), {
  qualityLevel: 'medium',
  cameraFov: 75,
  goalPosition: () => [0, 0, -10],
  ballPosition: () => [0, 0.11, 5],
  playerPosition: () => [0, 0, 8],
  isMobile: false,
  isShooting: false,
  shotDirection: () => [0, 0]
})

const emit = defineEmits<Emits>()

// Refs
const canvasRef = ref()
const cameraRef = ref()
const ballRef = ref()
const keeperRef = ref()

// State
const isAnimating = ref(false)
const animationProgress = ref(0)
const ballScale = ref(1)
const keeperPosition = ref<[number, number, number]>([0, 0, -9.5])

// Computed
const powerPreference = computed(() => {
  if (props.qualityLevel === 'high') return 'high-performance'
  if (props.qualityLevel === 'low') return 'low-power'
  return 'default'
})

const cameraPosition = computed<[number, number, number]>(() => {
  if (props.isMobile) {
    return [0, 2, 12]
  }
  return [0, 3, 15]
})

// Animation variables
let ballStartPos: Vector3
let ballTargetPos: Vector3
let ballTrajectory: Vector3[]
let shotStartTime = 0
const shotDuration = 2000 // 2 seconds
let fpsCounter = 0
let lastFpsTime = 0

// Methods
const onSceneCreated = (event: any) => {
  console.log('⚽ Penalty scene created')
}

const onSceneReady = (event: any) => {
  console.log('⚽ Penalty scene ready')
  emit('scene-ready')
}

const onBeforeRender = (state: { scene: any, camera: any, renderer: any }) => {
  // FPS tracking
  fpsCounter++
  const now = Date.now()
  if (now - lastFpsTime >= 1000) {
    emit('fps-update', fpsCounter)
    fpsCounter = 0
    lastFpsTime = now
  }

  // Ball animation
  if (isAnimating.value) {
    const elapsed = now - shotStartTime
    const progress = Math.min(elapsed / shotDuration, 1)
    
    if (progress >= 1) {
      // Animation complete
      isAnimating.value = false
      checkShotResult()
    } else {
      // Update ball position
      animateBall(progress)
      animateKeeper(progress)
    }
  }
}

const executeShot = (direction: [number, number], power: number) => {
  if (isAnimating.value) return

  console.log('⚽ Executing shot:', { direction, power })
  
  // Calculate shot trajectory
  const ballStart = new Vector3(...props.ballPosition)
  const goalCenter = new Vector3(...props.goalPosition)
  
  // Apply shot direction and power
  const shotTarget = goalCenter.clone()
  shotTarget.x += direction[0] * 3 // Max 3 units horizontally
  shotTarget.y += Math.abs(direction[1]) * 2 // Max 2 units vertically
  shotTarget.z = goalCenter.z

  // Add some randomness based on power
  const powerFactor = power / 100
  const accuracy = Math.max(0.3, 1 - (powerFactor - 0.7) * 2) // Sweet spot around 70% power
  
  if (accuracy < 0.8) {
    shotTarget.x += (Math.random() - 0.5) * 2 * (1 - accuracy)
    shotTarget.y += (Math.random() - 0.5) * 1 * (1 - accuracy)
  }

  ballStartPos = ballStart
  ballTargetPos = shotTarget
  
  // Create trajectory with arc
  ballTrajectory = []
  const steps = 20
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const pos = ballStartPos.clone().lerp(ballTargetPos, t)
    
    // Add arc (parabolic trajectory)
    pos.y += Math.sin(t * Math.PI) * 2 * powerFactor
    
    ballTrajectory.push(pos)
  }

  // Start animation
  isAnimating.value = true
  shotStartTime = Date.now()
  
  // Animate keeper
  animateKeeperDive(direction, power)
}

const animateBall = (progress: number) => {
  if (!ballRef.value || !ballTrajectory.length) return

  const index = Math.floor(progress * (ballTrajectory.length - 1))
  const nextIndex = Math.min(index + 1, ballTrajectory.length - 1)
  const localProgress = (progress * (ballTrajectory.length - 1)) - index

  const currentPos = ballTrajectory[index]
  const nextPos = ballTrajectory[nextIndex]
  
  const interpolated = currentPos.clone().lerp(nextPos, localProgress)
  
  ballRef.value.position.set(interpolated.x, interpolated.y, interpolated.z)
  
  // Ball spin effect
  ballRef.value.rotation.x += 0.3
  ballRef.value.rotation.y += 0.2
  
  // Scale effect on impact
  if (progress > 0.8) {
    ballScale.value = 1 + (progress - 0.8) * 0.5
  }
}

const animateKeeperDive = (direction: [number, number], power: number) => {
  const keeperReactionTime = 0.3 + Math.random() * 0.2 // 0.3-0.5 seconds
  const keeperSpeed = 0.5 + Math.random() * 0.3 // Variable keeper ability
  
  setTimeout(() => {
    if (!keeperRef.value) return
    
    // Keeper dives towards shot direction
    const diveDirection = direction[0] * keeperSpeed
    const newX = Math.max(-2, Math.min(2, diveDirection))
    
    keeperPosition.value = [newX, 0, -9.5]
  }, keeperReactionTime * 1000)
}

const animateKeeper = (progress: number) => {
  if (!keeperRef.value) return
  
  // Smooth keeper movement
  const currentPos = keeperRef.value.position
  const targetPos = keeperPosition.value
  
  currentPos.x += (targetPos[0] - currentPos.x) * 0.1
  currentPos.y += (targetPos[1] - currentPos.y) * 0.1
  currentPos.z += (targetPos[2] - currentPos.z) * 0.1
}

const checkShotResult = () => {
  if (!ballRef.value) return

  const ballPos = ballRef.value.position
  const goalCenter = new Vector3(...props.goalPosition)
  
  // Check if ball is in goal area
  const isInGoal = Math.abs(ballPos.x - goalCenter.x) < 3.66 && 
                   ballPos.y > 0 && ballPos.y < 2.4 &&
                   ballPos.z <= goalCenter.z

  if (!isInGoal) {
    emit('goal-missed')
    return
  }

  // Check if keeper saved it
  const keeperPos = keeperRef.value?.position
  if (keeperPos) {
    const keeperDistance = Math.sqrt(
      Math.pow(ballPos.x - keeperPos.x, 2) + 
      Math.pow(ballPos.y - keeperPos.y, 2)
    )
    
    if (keeperDistance < 1.5) {
      emit('keeper-save')
      return
    }
  }

  emit('goal-scored')
}

const resetPenalty = () => {
  if (!ballRef.value) return
  
  ballRef.value.position.set(...props.ballPosition)
  ballScale.value = 1
  keeperPosition.value = [0, 0, -9.5]
  isAnimating.value = false
  animationProgress.value = 0
}

// Watch for shooting trigger
watch(() => props.isShooting, (newVal) => {
  if (newVal && !isAnimating.value) {
    executeShot(props.shotDirection, 50) // Default power
  }
})

// Expose methods
defineExpose({
  executeShot,
  resetPenalty
})
</script>

<style scoped>
.penalty-canvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
  position: absolute;
  top: 0;
  left: 0;
}
</style>