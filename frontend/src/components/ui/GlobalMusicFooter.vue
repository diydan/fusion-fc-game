<template>
  <div class="global-music-footer">
    <!-- Main Footer Content -->
    <div class="footer-content">
      <!-- Left: Equalizer -->
      <div class="equalizer-section">
        <div class="equalizer-mini">
          <div
            v-for="(bar, index) in audioState.equalizerBars"
            :key="index"
            class="eq-bar"
            :style="{ height: `${Math.max(bar * 100, 20)}%` }"
          ></div>
        </div>
      </div>

      <!-- Center: Karaoke Lyrics with Previous/Next (Hidden on Mobile) -->
      <div class="lyrics-center desktop-only">
        <div class="lyrics-stack">
          <!-- Previous Lyric -->
          <div v-if="audioState.previousLyric" class="lyric-line previous">
            {{ audioState.previousLyric }}
          </div>

          <!-- Current Lyric with Karaoke -->
          <div class="lyric-line current">
            <div v-if="audioState.currentWords && audioState.currentWords.length > 0" class="karaoke-lyrics">
              <span
                v-for="(wordData, index) in audioState.currentWords"
                :key="index"
                class="karaoke-word"
                :class="{
                  'highlighted': wordData.isHighlighted,
                  'upcoming': index > audioState.currentWordIndex,
                  'completed': index < audioState.currentWordIndex
                }"
              >
                {{ wordData.word }}{{ index < audioState.currentWords.length - 1 ? ' ' : '' }}
              </span>
            </div>
            <div v-else-if="audioState.currentLyric" class="current-lyric">
              {{ audioState.currentLyric }}
            </div>
            <div v-else class="track-info">
              <div class="track-name">{{ audioState.trackName || 'Playing...' }}</div>
              <div class="track-counter">{{ audioState.currentTrackIndex + 1 }} / {{ audioState.availableTracks.length }}</div>
            </div>
          </div>

          <!-- Next Lyric -->
          <div v-if="audioState.nextLyric" class="lyric-line next">
            {{ audioState.nextLyric }}
          </div>
        </div>
      </div>

      <!-- Right: Control Buttons -->
      <div class="control-section">
        <v-btn
          icon
          size="x-small"
          variant="text"
          @click="$emit('previousTrack')"
          class="control-btn">
          <v-icon size="small">mdi-skip-previous</v-icon>
        </v-btn>

        <v-btn
          icon
          size="small"
          color="primary"
          @click="$emit('toggle')"
          class="control-btn-main">
          <v-icon>{{ audioState.isMusicPlaying ? 'mdi-pause' : 'mdi-play' }}</v-icon>
        </v-btn>

        <v-btn
          icon
          size="x-small"
          variant="text"
          @click="$emit('nextTrack')"
          class="control-btn">
          <v-icon size="small">mdi-skip-next</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- Progress Bar at Bottom with Seek Functionality -->
    <div
      class="music-progress-bar"
      @click="handleSeekClick"
      @mousedown="handleSeekStart"
      @touchstart="handleSeekStart"
    >
      <div class="music-progress" :style="{ width: `${audioState.progress || 0}%` }"></div>
      <div class="seek-handle" :style="{ left: `${audioState.progress || 0}%` }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AudioState } from '@/types/scene'

interface Props {
  audioState: AudioState
}

interface Emits {
  (e: 'toggle'): void
  (e: 'nextTrack'): void
  (e: 'previousTrack'): void
  (e: 'toggleLyrics'): void
  (e: 'seek', position: number): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<style scoped>
.global-music-footer {
  position: fixed;
  top: 40px;
  left: 0;
  right: 0;
  background: rgba(18, 18, 18, 0.95);
  backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1100;
  color: white;
}

/* Hide lyrics on mobile */
.desktop-only {
  display: block;
}

/* Mobile styles - move to top right corner */
@media (max-width: 768px) {
  .global-music-footer {
    top: 10px;
    right: 10px;
    left: auto;
    width: auto;
    max-width: 200px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* Hide lyrics and song info on mobile */
  .desktop-only {
    display: none;
  }

  /* Adjust footer content for mobile */
  .footer-content {
    padding: 6px 12px;
    min-height: auto;
    gap: 8px;
  }

  /* Hide equalizer on mobile to save space */
  .equalizer-section {
    display: none;
  }

  /* Make control buttons smaller on mobile */
  .control-section {
    gap: 4px;
  }

  /* Hide progress bar on mobile */
  .music-progress-bar {
    display: none;
  }
}

.music-progress-bar {
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  position: relative;
}

.music-progress {
  height: 100%;
  background: linear-gradient(90deg, #1976d2, #42a5f5);
  transition: width 0.3s ease;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  min-height: 64px;
  gap: 16px;
}

.equalizer-section {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
}

.lyrics-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 0 16px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 200px);
}

.lyrics-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  gap: 1px;
  line-height: 1.1;
}

.lyric-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  transition: all 0.3s ease;
}

.lyric-line.previous {
  font-size: 12px;
  opacity: 0.5;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1;
  margin-bottom: 3px;
  margin-top: 2px;
}

.lyric-line.current {
  font-size: 16px;
  font-weight: 600;
  opacity: 1;
  line-height: 1;
}
can we 
.lyric-line.next {
  font-size: 12px;
  opacity: 0.5;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1;
  margin-top: 2px;
}

/* Karaoke Word Highlighting */
.karaoke-lyrics {
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.karaoke-word {
  transition: all 0.3s ease;
  display: inline;
}

.karaoke-word.completed {
  color: #10b981;
  text-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
}

.karaoke-word.highlighted {
  color: #60a5fa;
  text-shadow: 0 0 12px rgba(96, 165, 250, 0.8);
  transform: scale(1.1);
  animation: wordPulse 0.5s ease-in-out;
}

.karaoke-word.upcoming {
  color: rgba(255, 255, 255, 0.5);
  text-shadow: none;
}

@keyframes wordPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1.1); }
}

.current-lyric {
  font-size: 16px;
  font-weight: 600;
  color: #60a5fa;
  text-align: center;
  text-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  animation: lyricGlow 2s ease-in-out infinite;
}

@keyframes lyricGlow {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 1; }
}

.track-info {
  display: flex;
  align-items: center;
  flex-direction: column;
  text-align: center;
}

.track-details {
  display: flex;
  flex-direction: column;
}

.track-name {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.2;
}

.track-counter {
  font-size: 0.75rem;
  opacity: 0.7;
  line-height: 1;
}

.equalizer-mini {
  display: flex;
  align-items: end;
  gap: 2px;
  height: 20px;
}

.eq-bar {
  width: 3px;
  background: linear-gradient(to top, #1976d2, #42a5f5);
  border-radius: 1px;
  transition: height 0.1s ease;
  min-height: 4px;
}

.lyrics-inline {
  margin-top: 4px;
  max-width: 100%;
}

.lyrics-stack-inline {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.lyric-line {
  font-size: 0.7rem;
  line-height: 1.1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
}

.lyric-line.previous {
  opacity: 0.4;
  font-size: 0.65rem;
}

.lyric-line.current {
  opacity: 1;
  font-weight: 500;
  color: #42a5f5;
  font-size: 0.75rem;
}

.lyric-line.next {
  opacity: 0.6;
  font-size: 0.65rem;
}

.control-section {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
}

.control-btn {
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.control-btn:hover {
  opacity: 1;
}

.control-btn-main {
  margin: 0 4px;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .footer-content {
    padding: 6px 12px;
    min-height: 56px;
    gap: 8px;
  }

  .track-name {
    font-size: 0.8rem;
  }

  .track-counter {
    font-size: 0.7rem;
  }

  .lyrics-inline {
    margin-top: 2px;
  }

  .lyric-line {
    font-size: 0.65rem;
    max-width: 300px;
    margin-top: 0px;
    margin-bottom: 0px;
  }

  .lyric-line.current {
    font-size: 0.7rem;
  }

  .lyric-line.previous,
  .lyric-line.next {
    font-size: 0.6rem;
  }
}

/* Very small screens */
@media (max-width: 480px) {
  .footer-content {
    flex-direction: column;
    gap: 4px;
    padding: 6px 8px;
  }

  .track-section {
    order: 1;
    width: 100%;
    justify-content: space-between;
  }

  .control-section {
    order: 2;
  }

  .lyrics-inline {
    margin-top: 3px;
  }

  .lyric-line {
    max-width: 100%;
  }
}
</style>
