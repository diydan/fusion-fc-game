<template>
  <div class="dance-container">
    <!-- 3D Scene Container -->
    <div 
      class="scene-container" 
      :class="{ 'screen-shake-active': isScreenShaking }">
      
      <!-- Mobile optimized background -->
      <div class="background-video-container">
        <video 
          ref="backgroundVideo"
          autoplay
          loop 
          muted 
          playsinline
          poster="/textures/stadium_bg.jpg"
          class="background-video">
          <source src="/video/stadium.mp4" type="video/mp4" />
        </video>
      </div>

      <!-- 3D Scene Canvas without UI elements, locked camera, and dance bot -->
      <MobileSelectBotScene 
        ref="sceneCanvas" 
        :hide-ui-elements="true"
        :lock-camera="true"
        :show-dance-bot="true"
      />

      <!-- Effects overlay -->
      <div class="dance-effects">
        <transition name="pulse">
          <div v-if="showPulse" class="pulse-effect"></div>
        </transition>
      </div>


    </div>

    <!-- Karaoke Lyrics Display -->
    <div class="karaoke-display" v-if="audioState.showLyrics">
      <div class="lyrics-container">
        <!-- Previous Lyric -->
        <transition name="lyric-fade">
          <div v-if="audioState.previousLyric" class="lyric-line previous">
            {{ audioState.previousLyric }}
          </div>
        </transition>
        
        <!-- Current Lyric with Karaoke Effect -->
        <div class="lyric-line current">
          <div v-if="audioState.currentWords && audioState.currentWords.length > 0" class="karaoke-lyrics">
            <span
              v-for="(wordData, index) in audioState.currentWords"
              :key="index"
              class="karaoke-word"
              :class="{
                'highlighted': wordData.isHighlighted,
                'completed': wordData.isCompleted,
                'upcoming': !wordData.isHighlighted && !wordData.isCompleted
              }">
              {{ wordData.word }}{{ index < audioState.currentWords.length - 1 ? ' ' : '' }}
            </span>
          </div>
          <div v-else class="lyric-text">
            {{ audioState.currentLyric || '' }}
          </div>
        </div>
        
        <!-- Next Lyric -->
        <transition name="lyric-fade">
          <div v-if="audioState.nextLyric" class="lyric-line next">
            {{ audioState.nextLyric }}
          </div>
        </transition>
      </div>
    </div>

    <!-- Global Music Player at bottom -->
    <div class="music-player-footer">
      <GlobalMusicFooter
        :audio-state="audioState"
        @toggle="toggleBackgroundMusic"
        @stop="stopMusic"
        @next-track="nextTrack"
        @previous-track="previousTrack"
        @toggle-lyrics="() => audioState.showLyrics = !audioState.showLyrics"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import MobileSelectBotScene from '@/components/MobileSelectBotScene.vue'
import GlobalMusicFooter from '@/components/ui/GlobalMusicFooter.vue'
import { useAudio } from '@/composables/useAudio'

const router = useRouter()
const sceneCanvas = ref()

// Audio
const { audioState, toggleBackgroundMusic, stopMusic, nextTrack, previousTrack } = useAudio()

// Scene state
const isScreenShaking = ref(false)
const showPulse = ref(false)

// Dance state
const currentBeat = ref(0)

// Beat tracking
let beatInterval: number | null = null

const triggerPulse = () => {
  showPulse.value = true
  setTimeout(() => {
    showPulse.value = false
  }, 500)
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
  // Enable lyrics by default on dance page
  audioState.showLyrics = true
  // Auto-play music on page load immediately
  toggleBackgroundMusic()
})

onUnmounted(() => {
  stopBeatTracking()
})
</script>

<style scoped>
.dance-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
}

.scene-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
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
  transform: translate(-50%, -50%);
  z-index: -1;
}

.music-player-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

/* Override GlobalMusicFooter's top positioning */
.music-player-footer :deep(.global-music-footer) {
  top: auto !important;
  bottom: 0 !important;
  border-bottom: none !important;
  border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
}

/* Hide only lyrics in the music footer on dance page, keep song title */
.music-player-footer :deep(.lyrics-stack),
.music-player-footer :deep(.karaoke-lyrics) {
  display: none !important;
}

/* Show track info in lyrics center */
.music-player-footer :deep(.lyrics-center) {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}

.music-player-footer :deep(.track-info) {
  display: block !important;
}

.music-player-footer :deep(.track-name) {
  display: block !important;
  color: white !important;
  font-size: 1rem !important;
}

/* Also override mobile positioning */
@media (max-width: 768px) {
  .music-player-footer :deep(.global-music-footer) {
    right: 0 !important;
    left: 0 !important;
    width: 100% !important;
    max-width: none !important;
    border-radius: 0 !important;
  }
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


/* Transitions */
.pulse-enter-active, .pulse-leave-active {
  transition: opacity 0.5s ease;
}

.pulse-enter-from, .pulse-leave-to {
  opacity: 0;
}

/* Karaoke Display Styles */
.karaoke-display {
  position: fixed;
  bottom: 60px; /* Position above music player - moved down 20px */
  left: 0;
  right: 0;
  z-index: 90;
  pointer-events: none;
}

.lyrics-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
}

.lyric-line {
  text-align: center;
  width: 100%;
  max-width: 800px;
  transition: all 0.3s ease;
}

.lyric-line.previous {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 400;
}

.lyric-line.current {
  font-size: 2rem;
  color: white;
  font-weight: 600;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.8);
}

.lyric-line.next {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 400;
}

/* Karaoke Word Animation */
.karaoke-lyrics {
  display: inline-block;
  line-height: 1.4;
}

.karaoke-word {
  display: inline;
  transition: all 0.3s ease;
  position: relative;
}

.karaoke-word.completed {
  color: #10b981;
  text-shadow: 0 0 20px rgba(16, 185, 129, 0.8);
}

.karaoke-word.highlighted {
  color: #60a5fa;
  text-shadow: 0 0 30px rgba(96, 165, 250, 1);
  transform: scale(1.1);
  display: inline-block;
}

.karaoke-word.upcoming {
  color: rgba(255, 255, 255, 0.6);
}

/* Lyric transitions */
.lyric-fade-enter-active,
.lyric-fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.lyric-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.lyric-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .karaoke-display {
    bottom: 80px; /* Adjust for mobile music player height - moved down 20px */
  }
  
  .lyrics-container {
    padding: 1rem;
    gap: 0.75rem;
  }
  
  .lyric-line.previous,
  .lyric-line.next {
    font-size: 1rem;
  }
  
  .lyric-line.current {
    font-size: 1.5rem;
  }
}

/* Character Labels */
.character-labels {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.character-label {
  position: absolute;
  transform: translate(-50%, -100%);
  padding: 6px 16px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
}

.label-text {
  color: white;
  font-size: 14px;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
}

/* Position labels above each character */
.main-character-label {
  top: 35%;
  left: 25%;
}

.jamie-bot-label {
  top: 40%;
  left: 35%;
}

.cansu-bot-label {
  top: 35%;
  left: 55%;
}

/* Mobile label adjustments */
@media (max-width: 768px) {
  .character-label {
    padding: 4px 12px;
  }
  
  .label-text {
    font-size: 12px;
  }
  
  .main-character-label {
    top: 38%;
    left: 20%;
  }
  
  .jamie-bot-label {
    top: 42%;
    left: 40%;
  }
  
  .cansu-bot-label {
    top: 38%;
    left: 60%;
  }
}

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