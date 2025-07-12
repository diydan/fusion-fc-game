<template>
  <TresCanvas
    ref="canvasRef"
    class="tres-canvas"
    :shadows="true"
    :alpha="true"
    :antialias="true"
    :power-preference="POWER_PREFERENCE"
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
    <!-- Post-processing effects - disabled due to compatibility issues -->
    <!-- 
    <Suspense>
      <EffectComposerPmndrs>
        <BloomPmndrs
          v-if="bloomEnabled"
          :intensity="bloomIntensity" 
          :luminance-threshold="0.1"
          :luminance-smoothing="0.3"
          :mipmap-blur="true"
        />
        <DepthOfFieldPmndrs
          v-if="dofEnabled" 
          :focus-distance="dofFocus" 
          :focus-range="dofAperture" 
          :bokeh-scale="dofMaxBlur" 
        />
      </EffectComposerPmndrs>
    </Suspense>
    -->
    
    <slot />
  </TresCanvas>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, withDefaults } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { ACESFilmicToneMapping, SRGBColorSpace, PCFSoftShadowMap } from 'three'
import { EffectComposerPmndrs, BloomPmndrs, DepthOfFieldPmndrs } from '@tresjs/post-processing'

interface Props {
  POWER_PREFERENCE: 'high-performance' | 'low-power' | 'default'
  bloomEnabled: boolean
  bloomIntensity: number
  dofEnabled: boolean
  dofFocus: number
  dofAperture: number
  dofMaxBlur: number
}

interface Emits {
  (e: 'sceneCreated', event: any): void
  (e: 'sceneReady', event: any): void
  (e: 'sceneRender', event: any): void
  (e: 'camera-position-changed', position: [number, number, number]): void
}

const props = withDefaults(defineProps<Props>(), {})
const emit = defineEmits<Emits>()

const canvasRef = ref()

const onSceneCreated = (event: any) => {
  emit('sceneCreated', event)
  console.log('✨ TresJS Scene created with post-processing support')
}

const onSceneReady = (event: any) => {
  emit('sceneReady', event)
  console.log('✨ TresJS Scene ready')
}

let frameCount = 0

const onBeforeRender = (state: { scene: any, camera: any, renderer: any }) => {
  frameCount++
  
  // Debug: Always log first few frames to verify this function is running
  if (frameCount <= 5) {
    console.log(`🎬 onBeforeRender called (frame ${frameCount})`, state.camera.position)
  }
  
  // Emit camera position every 10 frames (6 times per second at 60fps) for responsive UI updates
  if (frameCount % 10 === 0) {
    const camera = state.camera
    const currentPosition: [number, number, number] = [
      camera.position.x,
      camera.position.y,
      camera.position.z
    ]
    
    // Debug: Log every 60 frames (1 second at 60fps)
    if (frameCount % 60 === 0) {
      console.log('📹 Emitting camera position:', currentPosition)
    }
    
    emit('camera-position-changed', currentPosition)
  }
}
</script>

<style scoped>
.tres-canvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
  margin-top: 100px;
}
</style>
