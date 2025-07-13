<template>
  <BaseCharacterScene ref="baseScene" :show-hints="true">
    <template #content>
      <!-- Dance mode overlay -->
      <div class="dance-overlay">
        <!-- Global Music Player at top -->
        <GlobalMusicFooter
          :audio-state="audioState"
          @toggle="toggleBackgroundMusic"
          @stop="stopMusic"
          @next-track="nextTrack"
          @previous-track="previousTrack"
          @toggle-lyrics="() => audioState.showLyrics = !audioState.showLyrics"
        />

        <!-- Beat indicator floating element -->
        <div class="floating-beat-indicator">
          <div 
            v-for="i in 4" 
            :key="i"
            class="beat-dot"
            :class="{ active: currentBeat === i }">
          </div>
        </div>

        <!-- Effects overlay -->
        <div class="dance-effects">
          <transition name="pulse">
            <div v-if="showPulse" class="pulse-effect"></div>
          </transition>
          
          <!-- Particle effects would go here -->
          <div class="particles-container" ref="particlesContainer"></div>
        </div>

        <!-- Exit button -->
        <v-btn
          icon
          size="large"
          class="exit-btn"
          @click="exitDanceMode">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
    </template>
  </BaseCharacterScene>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import BaseCharacterScene from '@/components/BaseCharacterScene.vue'
import GlobalMusicFooter from '@/components/ui/GlobalMusicFooter.vue'
import { useAudio } from '@/composables/useAudio'

const router = useRouter()
const baseScene = ref()

// Audio
const { audioState, toggleBackgroundMusic, stopMusic, nextTrack, previousTrack } = useAudio()

// Dance state
const currentBeat = ref(0)
const showPulse = ref(false)

// Beat tracking
let beatInterval: number | null = null

const triggerPulse = () => {
  showPulse.value = true
  setTimeout(() => {
    showPulse.value = false
  }, 500)
}

const exitDanceMode = () => {
  router.push('/character-creator')
}

// Beat tracking for visual sync
const startBeatTracking = () => {
  const bpm = 120 // Example BPM
  const beatDuration = 60000 / bpm // milliseconds per beat
  
  beatInterval = setInterval(() => {
    currentBeat.value = (currentBeat.value % 4) + 1
    
    // Pulse on every 4th beat
    if (currentBeat.value === 1) {
      triggerPulse()
    }
  }, beatDuration)
}

const stopBeatTracking = () => {
  if (beatInterval) {
    clearInterval(beatInterval)
    beatInterval = null
  }
}

onMounted(() => {
  startBeatTracking()
})

onUnmounted(() => {
  stopBeatTracking()
})
</script>

<style scoped>
.dance-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.floating-beat-indicator {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.beat-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: all 0.2s ease;
}

.beat-dot.active {
  background: var(--v-primary-base);
  transform: scale(1.8);
  box-shadow: 0 0 30px var(--v-primary-base);
}

.dance-effects {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.pulse-effect {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100vw;
  height: 100vh;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
}

.particles-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.exit-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  pointer-events: auto;
  background: rgba(0, 0, 0, 0.6) !important;
  backdrop-filter: blur(10px);
}

/* Transitions */
.pulse-enter-active, .pulse-leave-active {
  transition: opacity 0.5s ease;
}

.pulse-enter-from, .pulse-leave-to {
  opacity: 0;
}

/* Mobile adjustments */
@media (max-width: 600px) {
  .floating-beat-indicator {
    bottom: 1rem;
    padding: 0.75rem 1.5rem;
    gap: 0.75rem;
  }
  
  .beat-dot {
    width: 12px;
    height: 12px;
  }
}
</style>