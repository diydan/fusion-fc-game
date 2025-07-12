<template>
  <TresCanvas 
    v-bind="canvasProps"
    @render="onRender"
    @created="onCreated">
    
    <!-- Camera with mobile-optimized settings -->
    <TresPerspectiveCamera
      :position="cameraPosition"
      :fov="mobileFov"
      :near="0.1"
      :far="mobileDrawDistance"
      ref="camera" />

    <!-- Enhanced Lighting System -->
    <TresAmbientLight :intensity="ambientIntensity" :color="ambientColor" />
    
    <!-- Main directional light -->
    <TresDirectionalLight
      v-if="enableMainLight"
      :position="mainLightPosition"
      :intensity="lightIntensity"
      :color="mainLightColor"
      :cast-shadow="enableShadows && qualityLevel !== 'low'" />
    
    <!-- Secondary fill light for better illumination -->
    <TresDirectionalLight
      v-if="qualityLevel === 'high'"
      :position="fillLightPosition"
      :intensity="fillLightIntensity"
      :color="fillLightColor" />

    <!-- Stadium Ground -->
    <TresMesh 
      :position="[0, -0.001, 0]" 
      :rotation="[-Math.PI / 2, 0, 0]"
      :receive-shadow="enableShadows && qualityLevel !== 'low'">
      <TresPlaneGeometry :args="groundSize" />
      <TresMeshStandardMaterial 
        :color="groundColor"
        :metalness="0.0"
        :roughness="0.9"
        :transparent="false" />
    </TresMesh>
    
    <!-- Grass texture overlay (high quality only) -->
    <TresMesh
      v-if="qualityLevel === 'high' && showGrassTexture"
      :position="[0, 0.002, 0]"
      :rotation="[-Math.PI / 2, 0, 0]">
      <TresPlaneGeometry :args="[15, 15]" />
      <TresMeshLambertMaterial 
        :color="grassColor"
        :transparent="true"
        :opacity="0.7" />
    </TresMesh>

    <!-- Character Group with animations -->
    <TresGroup 
      :position="characterGroupPosition"
      :scale="characterScale"
      :rotation="characterRotation"
      ref="characterGroup">
      <!-- Character will be loaded here -->
    </TresGroup>

    <!-- Enhanced Ball with physics simulation -->
    <TresGroup
      v-if="showBall"
      :position="ballPosition"
      :rotation="ballRotation"
      ref="ballGroup">
      <TresMesh
        :cast-shadow="enableShadows && qualityLevel !== 'low'">
        <TresSphereGeometry :args="[ballRadius, ballGeometry.widthSegments, ballGeometry.heightSegments]" />
        <TresMeshStandardMaterial
          :color="ballColor"
          :metalness="ballMetalness"
          :roughness="ballRoughness" />
      </TresMesh>
      
      <!-- Ball glow effect for high quality -->
      <TresMesh v-if="qualityLevel === 'high'">
        <TresSphereGeometry :args="[ballRadius * 1.1, 16, 12]" />
        <TresMeshBasicMaterial
          :color="ballGlowColor"
          :transparent="true"
          :opacity="0.1" />
      </TresMesh>
    </TresGroup>

    <!-- Advanced Fog System -->
    <TresFogExp2
      v-if="fogEnabled && fogType === 'exponential' && qualityLevel !== 'low'"
      :color="fogColor"
      :density="fogDensity" />
    <TresFog
      v-if="fogEnabled && fogType === 'linear' && qualityLevel !== 'low'"
      :color="fogColor"
      :near="fogNear"
      :far="fogFar" />
      
    <!-- Stadium Elements (medium+ quality) -->
    <TresGroup v-if="qualityLevel !== 'low' && showStadiumElements">
      <!-- Goal posts -->
      <TresMesh :position="[0, 1, -8]">
        <TresBoxGeometry :args="[0.1, 2, 0.1]" />
        <TresMeshStandardMaterial color="#ffffff" />
      </TresMesh>
      <TresMesh :position="[0, 1, 8]">
        <TresBoxGeometry :args="[0.1, 2, 0.1]" />
        <TresMeshStandardMaterial color="#ffffff" />
      </TresMesh>
    </TresGroup>
  </TresCanvas>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { FBXLoader } from 'three-stdlib'
import * as THREE from 'three'

// Props
interface Props {
  qualityLevel: 'low' | 'medium' | 'high'
  cameraFov: number
  cameraBlur: number
  bloomEnabled: boolean
  bloomIntensity: number
  fogEnabled: boolean
  lightIntensity: number
  enableShadows: boolean
  characterScale: number
  currentAnimation: string
  isMobile: boolean
  showStadiumElements?: boolean
  showGrassTexture?: boolean
  ballPhysicsEnabled?: boolean
  fogType?: 'linear' | 'exponential'
}

const props = withDefaults(defineProps<Props>(), {
  qualityLevel: 'medium',
  cameraFov: 75,
  cameraBlur: 0,
  bloomEnabled: true,
  bloomIntensity: 0.5,
  fogEnabled: true,
  lightIntensity: 1,
  enableShadows: true,
  characterScale: 1,
  currentAnimation: 'idle',
  isMobile: false,
  showStadiumElements: true,
  showGrassTexture: true,
  ballPhysicsEnabled: true,
  fogType: 'exponential'
})

// Emits
const emit = defineEmits<{
  fpsUpdate: [fps: number]
  sceneReady: []
  triggerShake: []
}>()

// Enhanced Refs
const camera = ref()
const characterGroup = ref()
const ballGroup = ref()
const scene = ref()
const renderer = ref()
const loadedCharacterModel = ref<THREE.Group | null>(null)

// Animation state
const currentAnimation = ref(props.currentAnimation)

// Performance monitoring
const frameCount = ref(0)
const lastTime = ref(Date.now())
const fps = ref(60)

// Scene settings based on quality (simplified for mobile)
const canvasProps = computed(() => {
  const baseProps = {
    alpha: false,
    depth: true,
    stencil: false,
    antialias: props.qualityLevel === 'high',
    powerPreference: props.isMobile ? 'low-power' : 'high-performance'
  }
  
  // Only add advanced props if not on mobile or quality is high
  if (!props.isMobile && props.qualityLevel === 'high') {
    return {
      ...baseProps,
      logarithmicDepthBuffer: false,
      precision: 'highp'
    }
  }
  
  return baseProps
})

// Mobile-optimized camera settings
const mobileFov = computed(() => {
  if (props.isMobile) {
    // Wider FOV on mobile for better view
    return Math.min(props.cameraFov + 10, 120)
  }
  return props.cameraFov
})

const mobileDrawDistance = computed(() => {
  switch (props.qualityLevel) {
    case 'low': return 20
    case 'medium': return 50
    case 'high': return 100
    default: return 50
  }
})

const maxDistance = computed(() => {
  return props.isMobile ? 15 : 20
})

// Touch controls
const enablePan = computed(() => !props.isMobile) // Disable pan on mobile
const enableZoom = computed(() => true)

// Enhanced Lighting System
const ambientIntensity = computed(() => {
  switch (props.qualityLevel) {
    case 'low': return 0.9
    case 'medium': return 0.7
    case 'high': return 0.5
    default: return 0.7
  }
})

const ambientColor = computed(() => '#ffffff')
const enableMainLight = computed(() => props.qualityLevel !== 'low')

// Main lighting
const mainLightPosition = computed<[number, number, number]>(() => [15, 20, 10])
const mainLightColor = computed(() => '#ffeaa7')

// Fill lighting for better illumination
const fillLightPosition = computed<[number, number, number]>(() => [-10, 15, -5])
const fillLightIntensity = computed(() => props.lightIntensity * 0.3)
const fillLightColor = computed(() => '#74b9ff')

// Geometry quality
const ballGeometry = computed(() => {
  switch (props.qualityLevel) {
    case 'low': return { widthSegments: 8, heightSegments: 6 }
    case 'medium': return { widthSegments: 16, heightSegments: 12 }
    case 'high': return { widthSegments: 32, heightSegments: 24 }
    default: return { widthSegments: 16, heightSegments: 12 }
  }
})

const groundSize = computed<[number, number]>(() => {
  switch (props.qualityLevel) {
    case 'low': return [10, 10]
    case 'medium': return [20, 20]
    case 'high': return [30, 30]
    default: return [20, 20]
  }
})

// Scene objects and positioning
const cameraPosition = ref<[number, number, number]>([0, 5, 10])
const characterGroupPosition = computed<[number, number, number]>(() => [0, 0, 0])
const characterRotation = ref<[number, number, number]>([0, 0, 0])

// Ball system
const ballPosition = ref<[number, number, number]>([0, 0.15, 0])
const ballRotation = ref<[number, number, number]>([0, 0, 0])
const ballRadius = computed(() => props.qualityLevel === 'low' ? 0.08 : 0.1)
const showBall = ref(true)

// Ball materials
const ballColor = computed(() => '#ffffff')
const ballMetalness = computed(() => 0.1)
const ballRoughness = computed(() => 0.2)
const ballGlowColor = computed(() => '#74b9ff')

// Enhanced Materials and Environment
const groundColor = computed(() => {
  switch (props.qualityLevel) {
    case 'low': return '#2d5a0d'
    case 'medium': return '#256e26'
    case 'high': return '#1e7e34'
    default: return '#256e26'
  }
})

const grassColor = computed(() => '#4caf50')
const showGrassTexture = computed(() => props.showGrassTexture && props.qualityLevel === 'high')

// Advanced Fog System
const fogColor = computed(() => {
  switch (props.qualityLevel) {
    case 'low': return '#e3f2fd'
    case 'medium': return '#bbdefb'
    case 'high': return '#90caf9'
    default: return '#bbdefb'
  }
})

const fogType = computed(() => props.fogType)
const fogDensity = computed(() => {
  switch (props.qualityLevel) {
    case 'low': return 0.01
    case 'medium': return 0.008
    case 'high': return 0.005
    default: return 0.008
  }
})

const fogNear = computed(() => props.isMobile ? 5 : 10)
const fogFar = computed(() => mobileDrawDistance.value * 0.7)

// Stadium elements
const showStadiumElements = computed(() => props.showStadiumElements && props.qualityLevel !== 'low')

// Post-processing
const enablePostProcessing = computed(() => {
  return props.qualityLevel === 'high' && !props.isMobile
})

// Performance monitoring
const updateFPS = () => {
  frameCount.value++
  const now = Date.now()
  
  if (now - lastTime.value >= 1000) {
    fps.value = Math.round((frameCount.value * 1000) / (now - lastTime.value))
    emit('fpsUpdate', fps.value)
    
    frameCount.value = 0
    lastTime.value = now
  }
}

// Scene event handlers
const onRender = () => {
  updateFPS()
}

const onCreated = (scene: any) => {
  console.log('📱 Mobile scene created')
  
  // Configure renderer for mobile
  if (scene.renderer) {
    const renderer = scene.renderer
    
    try {
      // Mobile-specific optimizations
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      
      // Only enable shadows if supported and quality allows
      if (props.enableShadows && props.qualityLevel !== 'low' && renderer.shadowMap) {
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFShadowMap
      }
      
      renderer.outputColorSpace = THREE.SRGBColorSpace
      
      // Power efficiency
      if (renderer.info) {
        renderer.info.autoReset = false
      }
    } catch (error) {
      console.warn('⚠️ Some renderer features not available:', error)
    }
  }
  
  emit('sceneReady')
}

// Enhanced Character Model Loading with FBX
const loadCharacterModel = async () => {
  console.log('🤖 Loading 3D bot character model...')
  
  try {
    // Clear existing character
    if (characterGroup.value) {
      characterGroup.value.clear()
    }
    
    const loader = new FBXLoader()
    
    // Choose model based on quality level
    const modelPath = getModelPath()
    console.log('📂 Loading model from:', modelPath)
    
    // Load the FBX model
    const characterModel = await loader.loadAsync(modelPath)
    
    // Apply mobile-optimized settings
    setupCharacterModel(characterModel)
    
    // Add to scene
    if (characterGroup.value) {
      characterGroup.value.add(characterModel)
      console.log('✅ 3D character model loaded successfully')
      
      // Store reference for animations
      loadedCharacterModel.value = characterModel
    }
    
  } catch (error) {
    console.error('❌ Failed to load 3D character model:', error)
    // Fallback to simple geometry if FBX loading fails
    loadFallbackCharacter()
  }
}

const getModelPath = () => {
  // Choose model based on quality for performance
  switch (props.qualityLevel) {
    case 'low':
      return '/bot1/original-bot1.fbx' // Simpler model
    case 'medium':
      return '/bot1/original-bot1.fbx'
    case 'high':
      return '/bot1/original-bot1.fbx' // Detailed model
    default:
      return '/bot1/original-bot1.fbx'
  }
}

const setupCharacterModel = (model: THREE.Group) => {
  // Scale appropriately for mobile scene
  const scale = props.qualityLevel === 'low' ? 0.015 : 0.02
  model.scale.setScalar(scale)
  
  // Position the model
  model.position.set(0, 0, 0)
  
  // Configure materials and shadows
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Enable shadows if supported
      child.castShadow = props.enableShadows && props.qualityLevel !== 'low'
      child.receiveShadow = props.enableShadows && props.qualityLevel !== 'low'
      
      // Optimize materials for mobile
      if (child.material) {
        optimizeMaterialForMobile(child.material)
      }
    }
  })
  
  console.log('⚙️ Character model configured for mobile')
}

const optimizeMaterialForMobile = (material: THREE.Material | THREE.Material[]) => {
  const materials = Array.isArray(material) ? material : [material]
  
  materials.forEach(mat => {
    if (mat instanceof THREE.MeshStandardMaterial) {
      // Optimize for mobile performance
      switch (props.qualityLevel) {
        case 'low':
          mat.metalness = 0
          mat.roughness = 1
          break
        case 'medium':
          mat.metalness = Math.min(mat.metalness, 0.3)
          mat.roughness = Math.max(mat.roughness, 0.7)
          break
        case 'high':
          // Keep original values for high quality
          break
      }
    }
  })
}

const loadFallbackCharacter = () => {
  console.log('🔄 Loading fallback character geometry')
  
  const geometry = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8)
  const material = new THREE.MeshStandardMaterial({
    color: '#4a90e2',
    metalness: 0.1,
    roughness: 0.8
  })
  
  const fallbackCharacter = new THREE.Mesh(geometry, material)
  fallbackCharacter.position.set(0, 0.6, 0)
  fallbackCharacter.castShadow = props.enableShadows
  fallbackCharacter.receiveShadow = props.enableShadows
  
  if (characterGroup.value) {
    characterGroup.value.add(fallbackCharacter)
    console.log('✅ Fallback character loaded')
  }
}

// Enhanced Character Animations
const animateCharacter = () => {
  if (!characterGroup.value) return
  
  const time = Date.now() * 0.001
  
  // If we have a loaded 3D model, animate it more realistically
  if (loadedCharacterModel.value) {
    animateLoadedCharacter(time)
  } else {
    // Fallback animation for simple geometry
    animateSimpleCharacter(time)
  }
}

const animateLoadedCharacter = (time: number) => {
  if (!loadedCharacterModel.value) return
  
  switch (props.currentAnimation) {
    case 'idle':
      // Subtle breathing and swaying
      loadedCharacterModel.value.rotation.y = Math.sin(time * 0.5) * 0.05
      loadedCharacterModel.value.position.y = Math.sin(time * 2) * 0.01
      break
    case 'running':
      // Running in place with forward movement
      loadedCharacterModel.value.position.z = Math.sin(time * 2) * 0.3
      loadedCharacterModel.value.rotation.y = Math.sin(time * 4) * 0.1
      loadedCharacterModel.value.position.y = Math.abs(Math.sin(time * 8)) * 0.05
      break
    case 'kicking':
      // Kicking motion
      loadedCharacterModel.value.rotation.x = Math.sin(time * 8) * 0.2
      loadedCharacterModel.value.position.y = Math.max(0, Math.sin(time * 6) * 0.1)
      animateBallKick(time)
      break
    case 'celebrating':
      // Victory celebration
      loadedCharacterModel.value.rotation.y = time * 1.5
      loadedCharacterModel.value.position.y = Math.abs(Math.sin(time * 3)) * 0.2
      loadedCharacterModel.value.scale.setScalar(0.02 + Math.sin(time * 4) * 0.002)
      break
  }
}

const animateSimpleCharacter = (time: number) => {
  // Fallback animations for simple geometry
  switch (props.currentAnimation) {
    case 'idle':
      characterRotation.value = [0, Math.sin(time * 0.5) * 0.1, 0]
      characterGroupPosition.value = [0, Math.sin(time * 1.5) * 0.02, 0]
      break
    case 'running':
      characterGroupPosition.value = [0, Math.abs(Math.sin(time * 8)) * 0.1, Math.sin(time * 2) * 0.5]
      characterRotation.value = [0, Math.sin(time * 4) * 0.3, Math.sin(time * 6) * 0.05]
      break
    case 'kicking':
      characterRotation.value = [Math.sin(time * 12) * 0.4, 0, 0]
      characterGroupPosition.value = [0, Math.max(0, Math.sin(time * 8) * 0.2), 0]
      animateBallKick(time)
      break
    case 'celebrating':
      characterRotation.value = [0, time * 2, 0]
      characterGroupPosition.value = [0, Math.abs(Math.sin(time * 4)) * 0.3, 0]
      break
  }
}

// Enhanced Ball Physics
const animateBallKick = (time: number) => {
  if (!props.ballPhysicsEnabled || !showBall.value) return
  
  const kickPhase = (time * 3) % (Math.PI * 2)
  ballPosition.value = [
    Math.sin(kickPhase) * 2,
    Math.max(0.15, Math.abs(Math.sin(kickPhase * 2)) * 1.5),
    Math.cos(kickPhase) * 1.5
  ]
  ballRotation.value = [kickPhase * 2, kickPhase * 3, kickPhase]
}

const animateBall = () => {
  if (!props.ballPhysicsEnabled || props.currentAnimation === 'kicking') return
  
  const time = Date.now() * 0.001
  ballRotation.value = [time * 0.5, time * 0.3, 0]
}

// Enhanced Animation Loop with Performance Monitoring
let animationId: number | null = null
let lastAnimationTime = 0
const targetFPS = computed(() => {
  switch (props.qualityLevel) {
    case 'low': return 30
    case 'medium': return 45
    case 'high': return 60
    default: return 45
  }
})

const startAnimationLoop = () => {
  const animate = (currentTime: number) => {
    const deltaTime = currentTime - lastAnimationTime
    const frameInterval = 1000 / targetFPS.value
    
    if (deltaTime >= frameInterval) {
      animateCharacter()
      animateBall()
      lastAnimationTime = currentTime - (deltaTime % frameInterval)
    }
    
    animationId = requestAnimationFrame(animate)
  }
  animationId = requestAnimationFrame(animate)
}

const stopAnimationLoop = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

// Quality level changes
watch(() => props.qualityLevel, (newQuality) => {
  console.log('📱 Quality changed to:', newQuality)
  
  // Reload character if needed
  if (characterGroup.value) {
    characterGroup.value.clear()
    loadCharacterModel()
  }
}, { immediate: false })

// Lifecycle
onMounted(() => {
  console.log('📱 Mobile scene component mounted')
  loadCharacterModel()
  startAnimationLoop()
})

onBeforeUnmount(() => {
  console.log('📱 Mobile scene component unmounting')
  stopAnimationLoop()
})

// Touch gesture handling
const handlePinchZoom = (scale: number) => {
  if (controls.value) {
    const currentDistance = controls.value.getDistance()
    const newDistance = currentDistance / scale
    controls.value.dollyTo(newDistance, true)
  }
}

// Enhanced Expose methods for parent component
defineExpose({
  handlePinchZoom,
  triggerAction: () => {
    console.log('🎬 Action triggered in enhanced mobile scene')
    // Trigger a special animation sequence
    if (props.currentAnimation !== 'kicking') {
      currentAnimation.value = 'kicking'
      setTimeout(() => {
        currentAnimation.value = 'celebrating'
        emit('triggerShake')
      }, 1000)
    }
  },
  resetScene: () => {
    console.log('🔄 Resetting enhanced mobile scene')
    // Reset character
    characterRotation.value = [0, 0, 0]
    characterGroupPosition.value = [0, 0, 0]
    
    // Reset ball
    ballPosition.value = [0, 0.15, 0]
    ballRotation.value = [0, 0, 0]
    
    // Reset camera
    cameraPosition.value = [0, 5, 10]
  },
  updateQuality: (newQuality: string) => {
    console.log('🎮 Updating scene quality to:', newQuality)
    if (characterGroup.value) {
      loadCharacterModel()
    }
  },
  getSceneStats: () => {
    return {
      fps: fps.value,
      triangles: characterGroup.value?.children.length || 0,
      quality: props.qualityLevel,
      animations: props.currentAnimation
    }
  }
})
</script>

<style scoped>
/* Ensure full coverage */
canvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
  touch-action: none;
}

/* Prevent context menu on long press */
canvas {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>