<template>
  <v-app>
    <!-- Navigation drawer removed - color controls now in scene -->

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

        <!-- Original 3D Scene Canvas with camera controls enabled and hidden UI -->
        <MobileSelectBotScene
          ref="sceneCanvas"
          :lock-camera="false"
          :hide-ui-elements="true"
          :show-triangle-formation="true"
        />

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
        
      </div>
    </v-main>

  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useDisplay } from 'vuetify'
import MobileSelectBotScene from "@/components/MobileSelectBotScene.vue"
import { useAudio } from '@/composables/useAudio'
import { useWallet } from '@/composables/useWallet'

// Vuetify composables
const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

// UI State
const drawer = ref(false)
const showTouchHints = ref(true)

// Performance tracking
const fps = ref(60)

// Quality settings
const qualityLevel = ref('medium')
const qualityOptions = [
  { title: 'Low (Best Performance)', value: 'low' },
  { title: 'Medium (Balanced)', value: 'medium' },
  { title: 'High (Best Quality)', value: 'high' }
]

// Simple scene state
const isScreenShaking = ref(false)
const activePanel = ref(['performance'])

// Color controls state
const shortColorHue = ref(218) // Default blue-ish
const torusColorHue = ref(195) // Default blue-ish

// Audio system - get toggle function for play button, global footer handles full controls
const { audioState, toggleBackgroundMusic } = useAudio()

// Wallet integration (minimal usage for auto-battler)
const { tokens } = useWallet()

// Scene reference
const sceneCanvas = ref()


// Computed properties
const fpsColor = computed(() => {
  if (fps.value >= 50) return 'success'
  if (fps.value >= 30) return 'warning'
  return 'error'
})

const qualityColor = computed(() => {
  switch (qualityLevel.value) {
    case 'high': return 'success'
    case 'medium': return 'warning'
    case 'low': return 'error'
    default: return 'primary'
  }
})

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
    // You could emit this to the 3D scene for camera zoom
  }
}

const handleTouchEnd = (event: TouchEvent) => {
  touchState.value.isMultiTouch = false
}

// Simple performance monitoring
const updateFps = (newFps: number) => {
  fps.value = Math.round(newFps)
}

// Color control methods removed - now handled in scene component

// Music control - simple toggle to start/pause music, global footer handles full controls
const toggleMusic = () => {
  toggleBackgroundMusic()
}

// Simple scene interactions
const triggerAction = () => {
  // The original scene handles its own interactions
}

const resetScene = () => {
  // The original scene handles its own reset
}

const triggerScreenShake = () => {
  isScreenShaking.value = true
  setTimeout(() => {
    isScreenShaking.value = false
  }, 500)
}

const onSceneReady = () => {
  }

// Background style for mobile optimization
const getBackgroundStyle = () => {
  return {
    transform: 'translate(-50%, -50%)',
    opacity: isMobile.value && qualityLevel.value === 'low' ? 0.5 : 0.8
  }
}


// Set initial quality based on device
onMounted(async () => {
  if (isMobile.value) {
    // Start with medium quality on mobile
    qualityLevel.value = 'medium'
    // Show touch hints for mobile users
    showTouchHints.value = true
  } else {
    qualityLevel.value = 'high'
    showTouchHints.value = false
  }
  
})

// Watch for token changes and update scene
watch(tokens, (newTokens) => {
  if (sceneCanvas.value && newTokens.length > 0) {
    // Format tokens for scene
    const formattedTokens = newTokens.map(token => ({
      symbol: token.symbol,
      balance: parseFloat(token.balance),
      logoURI: token.logoURI
    }))
    
    // Update scene with token data if needed
    if (sceneCanvas.value.updateTokenBalances) {
      sceneCanvas.value.updateTokenBalances(formattedTokens)
    }
  }
}, { deep: true })
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

.mobile-ui-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
}

.status-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 8px;
  pointer-events: auto;
}

.action-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 16px;
  pointer-events: auto;
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

.mobile-drawer {
  background: rgba(33, 33, 33, 0.95) !important;
  backdrop-filter: blur(10px);
}

/* Touch-friendly sizing */
@media (max-width: 600px) {
  .v-btn {
    min-height: 48px !important;
  }
  
  .v-slider {
    margin: 8px 0 !important;
  }
  
  .v-expansion-panel-text {
    padding: 8px 16px !important;
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

/* Mobile Color Slider Styles */
.mobile-color-slider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.color-preview {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.color-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Music player is now handled by global footer */

.scene-container {
  height: 100vh;
}

</style>