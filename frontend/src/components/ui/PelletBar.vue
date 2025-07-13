<template>
  <div class="pellet-bar-container">
    <div class="pellet-bar-label">
      <div class="label-left">
        <span class="label-text">{{ currentPack?.tokenSymbol || 'PowerUp' }} Ammo</span>
      </div>
      <span class="pellet-count">{{ currentPellets }}/{{ maxPellets }}</span>
    </div>
    <div class="pellet-bar">
      <div 
        v-for="(pellet, index) in maxPellets" 
        :key="index"
        class="pellet-segment"
        :class="{ 
          'filled': index < currentPellets,
          'depleting': index === currentPellets - 1 && isDepletingAnimation
        }"
        :style="{ 
          backgroundColor: index < currentPellets ? (currentPack?.color || '#FFD700') : 'rgba(255, 255, 255, 0.1)',
          boxShadow: index < currentPellets ? `0 2px 8px ${currentPack?.color || '#FFD700'}40` : 'none'
        }"
      >
        <div class="pellet-glow"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { PelletPack } from './PelletPackSelector.vue'

interface Props {
  currentPellets: number
  maxPellets?: number
  tokenBalance?: number
  currentPack?: PelletPack | null
}

const props = withDefaults(defineProps<Props>(), {
  maxPellets: 10,
  tokenBalance: 0,
  currentPack: null
})

const emit = defineEmits<{
  'pelletDepleted': []
  'openSelector': []
}>()

const isDepletingAnimation = ref(false)

// Watch for pellet changes to trigger depletion animation
watch(() => props.currentPellets, (newVal, oldVal) => {
  if (newVal < oldVal) {
    isDepletingAnimation.value = true
    setTimeout(() => {
      isDepletingAnimation.value = false
    }, 300)
  }
})
</script>

<style scoped>
.pellet-bar-container {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1100;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 12px 20px;
  min-width: 300px;
  transition: all 0.3s ease;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .pellet-bar-container {
    top: 80px;
    min-width: 250px;
    padding: 10px 16px;
  }
}

.pellet-bar-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  color: white;
}

.label-left {
  display: flex;
  align-items: center;
  gap: 4px;
}


.label-text {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.9);
}

.pellet-count {
  font-size: 14px;
  font-weight: 700;
  color: #FFD700;
}

.pellet-bar {
  display: flex;
  gap: 3px;
  height: 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 3px;
  position: relative;
  overflow: hidden;
}

.pellet-segment {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* Dynamic coloring handled by inline styles */

.pellet-segment.filled::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 2s infinite;
}

.pellet-segment.depleting {
  animation: deplete 0.3s ease-out;
}

.pellet-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  height: 80%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.pellet-segment.filled .pellet-glow {
  opacity: 0.5;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 200%; }
}


@keyframes deplete {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: scale(0.8);
    opacity: 0;
  }
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .pellet-bar-container {
    min-width: 200px;
    padding: 8px 12px;
  }
  
  .pellet-bar {
    height: 20px;
    gap: 2px;
  }
  
  .label-text {
    font-size: 11px;
  }
  
  .pellet-count {
    font-size: 12px;
  }
}
</style>