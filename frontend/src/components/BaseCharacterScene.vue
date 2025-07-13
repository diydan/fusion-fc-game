<template>
  <v-app>
    <v-main>
      <!-- 3D Scene Container -->
      <div 
        class="scene-container" 
        :class="{ 'screen-shake-active': isScreenShaking }"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd">
        
        <!-- Mobile optimized background -->
        <div 
          v-if="!isMobile || qualityLevel !== 'low'"
          class="background-video-container">
          <video 
            ref="backgroundVideo"
            :autoplay="!isMobile"
            loop 
            muted 
            playsinline
            :poster="isMobile ? '/textures/stadium_bg_mobile.jpg' : '/textures/stadium_bg.jpg'"
            class="background-video"
            :style="getBackgroundStyle()">
            <source 
              :src="isMobile ? '/video/stadium_mobile.mp4' : '/video/stadium.mp4'" 
              type="video/mp4" />
          </video>
        </div>

        <!-- Fallback background for low quality -->
        <div 
          v-else
          class="background-fallback"
          :style="{ backgroundImage: 'url(/textures/stadium_bg_mobile.jpg)' }">
        </div>

        <!-- 3D Scene Canvas -->
        <MobileSelectBotScene ref="sceneCanvas" />

        <!-- Touch Control Hints -->
        <div v-if="showTouchHints" class="touch-hints">
          <v-card 
            class="pa-4 ma-4 glass-effect" 
            rounded="lg"
            @click="showTouchHints = false">
            <v-card-text class="text-center">
              <v-icon size="large" class="mb-2">mdi-gesture-swipe</v-icon>
              <div class="text-body-2 mb-2">Touch Controls</div>
              <div class="text-caption">
                • Single touch: Rotate camera<br>
                • Two fingers: Zoom in/out<br>
                • Tap: Interact with scene
              </div>
              <v-btn 
                size="small" 
                color="primary" 
                class="mt-2"
                @click="showTouchHints = false">
                Got it!
              </v-btn>
            </v-card-text>
          </v-card>
        </div>

        <!-- Custom Content Slot -->
        <slot name="content" />
      </div>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, provide } from 'vue'
import { useDisplay } from 'vuetify'
import MobileSelectBotScene from "@/components/MobileSelectBotScene.vue"
import { useAudio } from '@/composables/useAudio'

// Props
interface Props {
  showHints?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showHints: true
})

// Vuetify composables
const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

// UI State
const showTouchHints = ref(props.showHints)

// Performance tracking
const fps = ref(60)

// Quality settings
const qualityLevel = ref('medium')
const qualityOptions = [
  { title: 'Low (Best Performance)', value: 'low' },
  { title: 'Medium (Balanced)', value: 'medium' },
  { title: 'High (Best Quality)', value: 'high' }
]

// Scene state
const isScreenShaking = ref(false)

// Audio system
const { audioState, toggleBackgroundMusic } = useAudio()

// Scene reference
const sceneCanvas = ref()

// Touch handling
const touchState = ref({
  startX: 0,
  startY: 0,
  startDistance: 0,
  isMultiTouch: false
})

const handleTouchStart = (event: TouchEvent) => {
  if (event.touches.length === 1) {
    touchState.value.startX = event.touches[0].clientX
    touchState.value.startY = event.touches[0].clientY
    touchState.value.isMultiTouch = false
  } else if (event.touches.length === 2) {
    const dx = event.touches[0].clientX - event.touches[1].clientX
    const dy = event.touches[0].clientY - event.touches[1].clientY
    touchState.value.startDistance = Math.sqrt(dx * dx + dy * dy)
    touchState.value.isMultiTouch = true
  }
  
  // Hide touch hints after first interaction
  if (showTouchHints.value) {
    setTimeout(() => { showTouchHints.value = false }, 3000)
  }
}

const handleTouchMove = (event: TouchEvent) => {
  event.preventDefault() // Prevent scrolling
  
  if (touchState.value.isMultiTouch && event.touches.length === 2) {
    // Handle pinch-to-zoom
    const dx = event.touches[0].clientX - event.touches[1].clientX
    const dy = event.touches[0].clientY - event.touches[1].clientY
    const currentDistance = Math.sqrt(dx * dx + dy * dy)
    
    const scale = currentDistance / touchState.value.startDistance
    // Could emit this to the 3D scene for camera zoom
  }
}

const handleTouchEnd = (event: TouchEvent) => {
  touchState.value.isMultiTouch = false
}

// Background style for mobile optimization
const getBackgroundStyle = () => {
  return {
    transform: 'translate(-50%, -50%)',
    opacity: isMobile.value && qualityLevel.value === 'low' ? 0.5 : 0.8
  }
}

// Screen shake effect
const triggerScreenShake = () => {
  isScreenShaking.value = true
  setTimeout(() => {
    isScreenShaking.value = false
  }, 500)
}

// Set initial quality based on device
onMounted(() => {
  if (isMobile.value) {
    qualityLevel.value = 'medium'
    showTouchHints.value = props.showHints
  } else {
    qualityLevel.value = 'high'
    showTouchHints.value = false
  }
})

// Provide common functionality to child components
provide('baseScene', {
  triggerScreenShake,
  qualityLevel,
  isScreenShaking,
  sceneCanvas
})

// Expose for parent components
defineExpose({
  triggerScreenShake,
  sceneCanvas
})
</script>

<style scoped>
.scene-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  transition: transform 0.1s ease-out;
}

.scene-container.screen-shake-active {
  animation: screenShake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes screenShake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-2px, 0, 0); }
  40%, 60% { transform: translate3d(2px, 0, 0); }
}

.background-video-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.background-video {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
}

.background-fallback {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: -1;
}

.touch-hints {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: auto;
  z-index: 200;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Touch-friendly sizing */
@media (max-width: 600px) {
  .v-btn {
    min-height: 48px !important;
  }
}

/* Prevent pull-to-refresh and other iOS behaviors */
.scene-container {
  touch-action: none;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: none;
}

/* Hide scrollbars on mobile */
::-webkit-scrollbar {
  display: none;
}

.scene-container {
  height: 100vh;
}
</style>