<template>
  <div class="mobile-control-panel">
    <!-- Main Action Buttons -->
    <div class="main-actions">
      <button
        @click="$emit('trigger-strike')"
        :disabled="isStrikeSequenceActive || !isReady"
        class="action-btn strike-btn"
        :class="{ active: isStrikeSequenceActive }"
      >
        <div class="btn-icon">⚽</div>
        <div class="btn-label">Strike</div>
      </button>

      <button
        @click="$emit('trigger-strike2')"
        :disabled="isStrikeSequenceActive || !isReady"
        class="action-btn strike2-btn"
      >
        <div class="btn-icon">🥅</div>
        <div class="btn-label">Goal</div>
      </button>

      <button
        @click="$emit('shoot-coin')"
        :disabled="isStrikeSequenceActive || !isReady"
        class="action-btn coin-btn"
      >
        <div class="btn-icon">🪙</div>
        <div class="btn-label">PowerUp</div>
      </button>

      <button
        @click="$emit('trigger-dance')"
        :disabled="isStrikeSequenceActive || !isReady"
        class="action-btn dance-btn"
      >
        <div class="btn-icon">💃</div>
        <div class="btn-label">Dance</div>
      </button>

      <button
        @click="$emit('reset-character')"
        :disabled="!isReady"
        class="action-btn reset-btn"
      >
        <div class="btn-icon">🔄</div>
        <div class="btn-label">Reset</div>
      </button>

      <button
        @click="$emit('rotate-and-drop')"
        :disabled="isStrikeSequenceActive || !isReady"
        class="action-btn rotate-btn"
      >
        <div class="btn-icon">↩️</div>
        <div class="btn-label">Turn</div>
      </button>
    </div>

    <!-- Secondary Actions -->
    <div class="secondary-actions">
      <button 
        @click="$emit('toggle-settings')"
        class="secondary-btn settings-btn"
      >
        <div class="btn-icon">⚙️</div>
      </button>
    </div>

    <!-- Status Indicator -->
    <div class="status-indicator" :class="statusClass">
      <div class="status-dot"></div>
      <div class="status-text">{{ statusText }}</div>
    </div>

    <!-- Animation Status -->
    <div v-if="currentAnimation && isReady" class="animation-status">
      <div class="animation-label">{{ currentAnimation }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  isReady: boolean
  loadingStatus: string
  isStrikeSequenceActive: boolean
  currentAnimation?: string
}

const props = withDefaults(defineProps<Props>(), {
  currentAnimation: 'Idle'
})

const emit = defineEmits<{
  'trigger-strike': []
  'trigger-strike2': []
  'shoot-coin': []
  'trigger-dance': []
  'reset-character': []
  'toggle-settings': []
  'rotate-and-drop': []
}>()

const statusClass = computed(() => {
  if (!props.isReady) return 'loading'
  if (props.isStrikeSequenceActive) return 'active'
  return 'ready'
})

const statusText = computed(() => {
  if (!props.isReady) return props.loadingStatus
  if (props.isStrikeSequenceActive) return 'In Action'
  return 'Ready'
})
</script>

<style scoped>
.mobile-control-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1200;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  gap: 8px;
  padding: 12px 20px 20px 20px;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.3);
  width: 100%;
  box-sizing: border-box;
}

.main-actions {
  display: flex;
  gap: 16px;
  align-items: center;
  flex: 1;
  justify-content: center;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.action-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
}

.action-btn:active:not(:disabled) {
  transform: translateY(0);
  background: rgba(255, 255, 255, 0.3);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.05);
}

.strike-btn.active {
  background: linear-gradient(135deg, #FF6B6B, #FF5722);
  border-color: #FF5722;
  animation: pulse 1s ease-in-out infinite;
}

.strike2-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #4CAF50, #2E7D32);
  border-color: #2E7D32;
}

.coin-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  border-color: #FFD700;
}

.dance-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #9C27B0, #E91E63);
  border-color: #E91E63;
}

.reset-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2196F3, #03A9F4);
  border-color: #03A9F4;
}

.rotate-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #00BCD4, #00ACC1);
  border-color: #00ACC1;
}

.btn-icon {
  font-size: 22px;
  line-height: 1;
  margin-bottom: 2px;
}

.btn-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1;
}

.secondary-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  position: absolute;
  right: 20px;
}

.secondary-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.secondary-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.secondary-btn:active {
  background: rgba(255, 255, 255, 0.2);
}

.settings-btn:hover {
  background: linear-gradient(135deg, #607D8B, #90A4AE);
  border-color: #607D8B;
}

.secondary-btn .btn-icon {
  font-size: 20px;
}

.status-indicator {
  display: none; /* Hidden in bottom menu layout to save space */
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: background-color 0.3s ease;
}

.status-indicator.loading .status-dot {
  background: #FF9800;
  animation: pulse 1.5s ease-in-out infinite;
}

.status-indicator.ready .status-dot {
  background: #4CAF50;
}

.status-indicator.active .status-dot {
  background: #2196F3;
  animation: pulse 1s ease-in-out infinite;
}

.status-text {
  font-size: 10px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.animation-status {
  display: none; /* Hidden in top bar layout to save space */
}

.animation-label {
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}

/* Touch-friendly improvements for smaller screens */
@media (max-width: 480px) {
  .mobile-control-panel {
    padding: 10px 16px 16px 16px;
  }

  .main-actions {
    gap: 8px;
  }

  .action-btn {
    width: 48px;
    height: 48px;
    border-radius: 12px;
  }

  .btn-icon {
    font-size: 20px;
  }

  .btn-label {
    font-size: 9px;
  }

  .secondary-btn {
    width: 44px;
    height: 44px;
    border-radius: 10px;
  }

  .secondary-btn .btn-icon {
    font-size: 18px;
  }

  .secondary-actions {
    right: 16px;
  }
}

/* Landscape orientation adjustments */
@media (orientation: landscape) and (max-height: 500px) {
  .mobile-control-panel {
    padding: 8px 16px 12px 16px;
  }

  .action-btn {
    width: 48px;
    height: 48px;
  }

  .btn-icon {
    font-size: 18px;
  }

  .btn-label {
    font-size: 8px;
  }

  .secondary-btn {
    width: 40px;
    height: 40px;
  }

  .secondary-btn .btn-icon {
    font-size: 16px;
  }
}
</style>
