<template>
  <div class="game-controls">
    <div class="control-group">
      <button 
        @click="$emit('toggle-play')" 
        :class="['control-btn', 'play-btn', { playing: isPlaying }]"
      >
        <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
        {{ isPlaying ? 'Pause' : 'Play' }}
      </button>
      
      <button 
        @click="$emit('reset')" 
        class="control-btn reset-btn"
        :disabled="isPlaying"
      >
        <i class="fas fa-undo"></i>
        Reset
      </button>
    </div>

    <div class="control-group">
      <label class="control-label">
        <i class="fas fa-tachometer-alt"></i>
        Speed
      </label>
      <div class="speed-controls">
        <button 
          v-for="speed in speeds" 
          :key="speed"
          @click="$emit('set-speed', speed)"
          :class="['speed-btn', { active: gameSpeed === speed }]"
        >
          {{ speed }}x
        </button>
      </div>
    </div>

    <div class="control-group">
      <button 
        @click="$emit('toggle-sound')" 
        :class="['control-btn', 'sound-btn', { muted: !soundEnabled }]"
      >
        <i :class="soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute'"></i>
      </button>
      
      <button 
        @click="$emit('toggle-fullscreen')" 
        class="control-btn fullscreen-btn"
      >
        <i class="fas fa-expand"></i>
      </button>
    </div>

    <div class="control-group camera-controls" v-if="cameraMode">
      <label class="control-label">
        <i class="fas fa-video"></i>
        Camera
      </label>
      <div class="camera-buttons">
        <button 
          v-for="mode in cameraModes" 
          :key="mode.value"
          @click="$emit('set-camera', mode.value)"
          :class="['camera-btn', { active: cameraMode === mode.value }]"
          :title="mode.label"
        >
          <i :class="mode.icon"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isPlaying: {
    type: Boolean,
    default: false
  },
  gameSpeed: {
    type: Number,
    default: 1
  },
  soundEnabled: {
    type: Boolean,
    default: true
  },
  cameraMode: {
    type: String,
    default: null
  }
})

defineEmits([
  'toggle-play',
  'reset',
  'set-speed',
  'toggle-sound',
  'toggle-fullscreen',
  'set-camera'
])

const speeds = [0.5, 1, 2, 3]

const cameraModes = [
  { value: 'tactical', label: 'Tactical View', icon: 'fas fa-chess-board' },
  { value: 'follow', label: 'Follow Ball', icon: 'fas fa-futbol' },
  { value: 'broadcast', label: 'Broadcast', icon: 'fas fa-tv' },
  { value: 'player', label: 'Player View', icon: 'fas fa-user' }
]
</script>

<style scoped>
.game-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-label {
  font-size: 12px;
  color: #888;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.control-label i {
  font-size: 14px;
}

.control-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.control-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-btn i {
  font-size: 16px;
}

.play-btn.playing {
  background: #f39c12;
  border-color: #f39c12;
  color: #1a1a1a;
}

.reset-btn:hover:not(:disabled) {
  background: #e74c3c;
  border-color: #e74c3c;
}

.sound-btn.muted {
  opacity: 0.6;
}

.sound-btn,
.fullscreen-btn {
  padding: 8px 12px;
}

.speed-controls {
  display: flex;
  gap: 4px;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px;
  border-radius: 6px;
}

.speed-btn {
  padding: 4px 12px;
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  border-radius: 4px;
  transition: all 0.2s;
}

.speed-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.speed-btn.active {
  background: #3498db;
  color: white;
}

.camera-controls {
  margin-left: auto;
}

.camera-buttons {
  display: flex;
  gap: 4px;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px;
  border-radius: 6px;
}

.camera-btn {
  padding: 6px 10px;
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 14px;
  border-radius: 4px;
  transition: all 0.2s;
}

.camera-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.camera-btn.active {
  background: #9b59b6;
  color: white;
}

@media (max-width: 768px) {
  .game-controls {
    padding: 8px 12px;
    gap: 12px;
  }
  
  .control-btn {
    padding: 6px 12px;
    font-size: 12px;
  }
  
  .control-btn i {
    font-size: 14px;
  }
  
  .control-label {
    display: none;
  }
}
</style>