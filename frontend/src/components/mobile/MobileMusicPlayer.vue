<template>
  <div class="mobile-music-player">
    <!-- Compact Player with Lyrics -->
    <div class="compact-player">
      <button
        @click="$emit('toggle')"
        class="play-btn"
        :class="{ active: audioState.isMusicPlaying }"
      >
        <div class="play-icon">{{ audioState.isMusicPlaying ? '⏸' : '▶' }}</div>
      </button>

      <!-- Center Lyrics Section with Karaoke -->
      <div v-if="audioState.isMusicPlaying" class="lyrics-center">
        <div v-if="audioState.currentWords.length > 0" class="karaoke-lyrics">
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
          <div class="track-title">{{ audioState.trackName || 'Unknown Track' }}</div>
        </div>
      </div>

      <!-- Right Side Controls -->
      <div v-if="audioState.isMusicPlaying" class="player-controls">
        <button @click="$emit('previous-track')" class="control-btn" title="Previous Track">
          <div class="control-icon">⏮</div>
        </button>
        <button @click="$emit('next-track')" class="control-btn" title="Next Track">
          <div class="control-icon">⏭</div>
        </button>
        <div class="equalizer">
          <div class="bar" v-for="i in 3" :key="i"></div>
        </div>
      </div>
    </div>

    <!-- Progress Bar at Bottom -->
    <div v-if="audioState.isMusicPlaying" class="progress-container">
      <div class="progress-bar" :style="{ width: `${audioState.progress}%` }"></div>
      <div class="time-display">
        <span class="current-time">{{ formatTime(audioState.musicCurrentTime) }}</span>
        <span class="duration">{{ formatTime(audioState.musicDuration) }}</span>
      </div>
    </div>


  </div>
</template>

<script setup lang="ts">
import type { AudioState } from '@/types/scene'

interface Props {
  audioState: AudioState
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'toggle': []
  'stop': []
  'next-track': []
  'previous-track': []
}>()

// Format time in MM:SS format
const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.mobile-music-player {
  position: fixed;
  top: 40px;
  left: 0;
  right: 0;
  z-index: 1100;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Compact Player */
.compact-player {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: #010224;
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.3);
  width: 100%;
  justify-content: space-between;
}

.play-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  touch-action: manipulation;
  flex-shrink: 0;
}

.play-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.05);
}

.play-btn.active {
  background: linear-gradient(135deg, #4CAF50, #8BC34A);
  border-color: #4CAF50;
  box-shadow: 0 0 12px rgba(76, 175, 80, 0.4);
}

.play-icon {
  font-size: 18px;
  line-height: 1;
}

/* Center Lyrics Section */
.lyrics-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 0 16px;
}

/* Karaoke Word Highlighting */
.karaoke-lyrics {
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  line-height: 1.4;
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
  text-align: center;
}

.track-title {
  font-size: 14px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

/* Player Controls */
.player-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.05);
}

.control-icon {
  font-size: 14px;
  line-height: 1;
}

.equalizer {
  display: flex;
  align-items: end;
  gap: 2px;
  height: 16px;
  flex-shrink: 0;
}

.equalizer .bar {
  width: 3px;
  background: #4CAF50;
  border-radius: 1px;
  animation: bounce 1.5s infinite ease-in-out;
}

.equalizer .bar:nth-child(1) { animation-delay: 0s; }
.equalizer .bar:nth-child(2) { animation-delay: 0.2s; }
.equalizer .bar:nth-child(3) { animation-delay: 0.4s; }









@keyframes bounce {
  0%, 100% {
    height: 4px;
  }
  50% {
    height: 100%;
  }
}

/* Touch-friendly adjustments */
@media (max-width: 480px) {
  .compact-player {
    padding: 10px 16px;
    gap: 8px;
  }

  .play-btn {
    width: 40px;
    height: 40px;
  }

  .play-icon {
    font-size: 16px;
  }

  .karaoke-lyrics {
    font-size: 14px;
  }

  .current-lyric {
    font-size: 14px;
  }

  .track-title {
    font-size: 13px;
  }

  .control-btn {
    width: 28px;
    height: 28px;
  }

  .control-icon {
    font-size: 12px;
  }

  .lyrics-center {
    padding: 0 12px;
  }
}

/* Landscape orientation */
@media (orientation: landscape) and (max-height: 500px) {
  .compact-player {
    padding: 8px 16px;
  }

  .karaoke-lyrics {
    font-size: 14px;
  }

  .current-lyric {
    font-size: 14px;
  }

  .control-btn {
    width: 28px;
    height: 28px;
  }
}
</style>
