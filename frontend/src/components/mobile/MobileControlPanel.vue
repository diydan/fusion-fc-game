<template>
  <div class="mobile-control-panel">
    <!-- Main Action Buttons -->
    <div class="main-actions">
      <button
        @click="$emit('open-powerup-selector')"
        :disabled="!isReady"
        class="action-btn powerup-select-btn"
      >
        <div class="btn-icon">⚡</div>
        <div class="btn-label">Choose Power Ups</div>
      </button>

      <button
        @click="$emit('shoot-coin')"
        :disabled="isStrikeSequenceActive || !isReady"
        class="action-btn charge-btn"
      >
        <div class="btn-icon">🚀</div>
        <div class="btn-label">Charge</div>
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
  'open-powerup-selector': []
  'shoot-coin': []
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
  width: 140px;
  height: 56px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: none;
  border-radius: 12px;
  border: none;
  position: relative;
  color: white;
  cursor: pointer;
  transform: translateY(-4px);
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), 
              box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-6px);
}

.action-btn:active:not(:disabled) {
  transform: translateY(-2px);
  transition: transform 0.08s cubic-bezier(0.4, 0, 0.2, 1), 
              box-shadow 0.08s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-btn:disabled {
  transform: translateY(0);
  opacity: 0.6;
  cursor: not-allowed;
}

.powerup-select-btn {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  box-shadow:
    0 4px 0 0 #FF8C00,
    0 5px 0 0 #FF8C00,
    0 6px 0 0 #FF8C00,
    0 7px 0 0 #FF8C00,
    0 8px 0 0 #FF8C00,
    0 8px 8px rgba(255, 140, 0, 0.4),
    0 8px 16px rgba(255, 140, 0, 0.3);
}

.powerup-select-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #FFE033, #FFB347);
  box-shadow:
    0 6px 0 0 #FF8C00,
    0 7px 0 0 #FF8C00,
    0 8px 0 0 #FF8C00,
    0 9px 0 0 #FF8C00,
    0 10px 0 0 #FF8C00,
    0 10px 10px rgba(255, 140, 0, 0.4),
    0 10px 20px rgba(255, 140, 0, 0.3);
}

.powerup-select-btn:active:not(:disabled) {
  box-shadow:
    0 2px 0 0 #FF8C00,
    0 3px 0 0 #FF8C00,
    0 4px 0 0 #FF8C00,
    0 4px 4px rgba(255, 140, 0, 0.4),
    0 4px 8px rgba(255, 140, 0, 0.3);
}

.charge-btn {
  background: linear-gradient(135deg, #10B981, #34D399);
  box-shadow:
    0 4px 0 0 #059669,
    0 5px 0 0 #059669,
    0 6px 0 0 #059669,
    0 7px 0 0 #059669,
    0 8px 0 0 #059669,
    0 8px 8px rgba(5, 150, 105, 0.4),
    0 8px 16px rgba(5, 150, 105, 0.3);
}

.charge-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #34D399, #6EE7B7);
  animation: pulse 1s ease-in-out infinite;
  box-shadow:
    0 6px 0 0 #059669,
    0 7px 0 0 #059669,
    0 8px 0 0 #059669,
    0 9px 0 0 #059669,
    0 10px 0 0 #059669,
    0 10px 10px rgba(5, 150, 105, 0.4),
    0 10px 20px rgba(5, 150, 105, 0.3);
}

.charge-btn:active:not(:disabled) {
  box-shadow:
    0 2px 0 0 #059669,
    0 3px 0 0 #059669,
    0 4px 0 0 #059669,
    0 4px 4px rgba(5, 150, 105, 0.4),
    0 4px 8px rgba(5, 150, 105, 0.3);
}

.charge-btn:active:not(:disabled) {
  animation: none;
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
    width: 120px;
    height: 48px;
    border-radius: 10px;
  }

  .btn-icon {
    font-size: 20px;
  }

  .btn-label {
    font-size: 9px;
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

}
</style>
