<template>
  <div v-if="audioState.showLyrics" class="sleek-music-player">
    <!-- Progress Bar at Top -->
    <div class="progress-container">
      <div class="progress-bar" :style="{ width: `${audioState.progress}%` }"></div>
    </div>
    
    <!-- Main Player Controls Row -->
    <div class="player-row">
      <!-- Track Info and Equalizer -->
      <div class="track-info">
        <div class="track-name">{{ audioState.trackName }}</div>
        <div class="track-counter">{{ audioState.currentTrackIndex + 1 }} / {{ audioState.availableTracks.length }}</div>
        <div class="equalizer-compact">
          <div 
            v-for="(bar, index) in audioState.equalizerBars" 
            :key="index"
            class="eq-bar-mini"
            :style="{ height: `${Math.max(bar * 100, 15)}%` }"
          ></div>
        </div>
      </div>
      
      <!-- Control Buttons -->
      <div class="control-buttons">
        <button 
          @click="$emit('previousTrack')"
          class="control-btn-sleek"
          title="Previous Track"
        >
          ⏮
        </button>
        
        <button 
          @click="$emit('toggle')"
          class="control-btn-main"
          :title="audioState.isMusicPlaying ? 'Pause' : 'Play'"
        >
          {{ audioState.isMusicPlaying ? '⏸' : '▶' }}
        </button>
        
        <button 
          @click="$emit('stop')"
          class="control-btn-sleek stop"
          title="Stop"
        >
          ⏹
        </button>
        
        <button
          @click="$emit('nextTrack')"
          class="control-btn-sleek"
          title="Next Track"
        >
          ⏭
        </button>

        <button
          @click="$emit('toggleLyrics')"
          class="control-btn-sleek lyrics-toggle"
          :class="{ active: audioState.showLyrics }"
          title="Toggle Lyrics"
        >
          🎤
        </button>
      </div>
    </div>
    
    <!-- Lyrics Ticker Below Player -->
    <div v-if="audioState.isMusicPlaying && (audioState.currentLyric || audioState.previousLyric || audioState.nextLyric)" class="lyrics-ticker-below">
      <div class="ticker-content-below">
        <span class="now-playing">♪</span>
        <div class="lyrics-stack">
          <div class="lyric-line previous">{{ audioState.previousLyric }}</div>
          <div class="lyric-line current">{{ audioState.currentLyric }}</div>
          <div class="lyric-line next">{{ audioState.nextLyric }}</div>
        </div>
      </div>
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
  (e: 'stop'): void
  (e: 'nextTrack'): void
  (e: 'previousTrack'): void
  (e: 'toggleLyrics'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<style scoped>
.sleek-music-player {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  background: rgba(0, 0, 0, 0.95);
  color: white;
  padding: 1rem 1.5rem 0.75rem 1.5rem;
  border-radius: 2rem;
  backdrop-filter: blur(20px);
  z-index: 20;
  width: 420px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;
}

.progress-container {
  margin-bottom: 1rem;
  position: relative;
}

.progress-bar {
  width: 100%;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 1.5px;
  position: relative;
  cursor: pointer;
}

.player-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  margin-top: 0.5rem;
  
}

.track-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.track-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.track-counter {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 400;
}

.equalizer-compact {
  display: flex;
  align-items: flex-end;
  height: 30px;
  width: 60px;
  gap: 3px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
  padding: 2px;
}

.eq-bar-mini {
  flex: 1;
  background: linear-gradient(to top, #60a5fa, #93c5fd);
  border-radius: 2px;
  transition: height 0.1s ease-out, background 0.2s ease;
  opacity: 0.9;
  min-height: 2px;
  box-shadow: 0 0 5px rgba(96, 165, 250, 0.3);
}

.control-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: absolute;
  right: 14px;
}

.control-btn-sleek {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.control-btn-sleek:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.control-btn-main {
  background: white;
  color: black;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.2s ease;
  margin: 0 0.5rem;
}

.control-btn-main:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
}

.lyrics-ticker-below {
  margin-top: 1rem;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 1rem;
  padding: 0.8rem 1.5rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
  min-height: 80px;
  font-size: 1.1rem;
  position: relative;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lyrics-stack {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: center;
  width: 100%;
}

.lyric-line {
  white-space: nowrap;
  transition: all 0.3s ease;
  padding: 0.2rem 0;
}

.lyric-line.previous {
  font-size: 0.8rem;
  opacity: 0.5;
  transform: translateY(-2px);
}

.lyric-line.current {
  font-size: 1.1rem;
  font-weight: 500;
  opacity: 1;
  color: #60a5fa;
  text-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
}

.lyric-line.next {
  font-size: 0.8rem;
  opacity: 0.5;
  transform: translateY(2px);
}

.ticker-content-below {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  width: 100%;
}

.now-playing {
  color: #60a5fa;
  font-size: 1.3rem;
  text-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.8;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    opacity: 0.8;
    transform: scale(1);
  }
}

.stop {
  display: none;
}

.control-btn-sleek.lyrics-toggle {
  opacity: 0.6;
  transition: all 0.2s ease;
}

.control-btn-sleek.lyrics-toggle:hover {
  background: rgba(66, 165, 245, 0.2);
  color: #42a5f5;
  opacity: 1;
}

.control-btn-sleek.lyrics-toggle.active {
  background: rgba(66, 165, 245, 0.3);
  color: #42a5f5;
  opacity: 1;
}
</style>
