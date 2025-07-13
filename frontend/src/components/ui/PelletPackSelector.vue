<template>
  <div class="pellet-pack-selector">
    <div class="selector-header">
      <span class="header-text">Select Ammo Type</span>
      <v-btn
        icon
        size="x-small"
        variant="text"
        @click="$emit('close')"
        class="close-btn"
      >
        <v-icon size="small">mdi-close</v-icon>
      </v-btn>
    </div>
    
    <div class="pellet-packs">
      <div
        v-for="pack in availablePacks"
        :key="pack.tokenSymbol"
        class="pellet-pack"
        :class="{ 
          'selected': selectedPack?.tokenSymbol === pack.tokenSymbol,
          'depleted': pack.currentPellets === 0
        }"
        @click="selectPack(pack)"
      >
        <div class="pack-icon">
          <img 
            v-if="pack.logoURI" 
            :src="pack.logoURI" 
            :alt="pack.tokenSymbol"
            class="token-logo"
          />
          <div v-else class="token-placeholder">
            {{ pack.tokenSymbol.charAt(0) }}
          </div>
        </div>
        
        <div class="pack-info">
          <div class="pack-name">{{ pack.tokenSymbol }}</div>
          <div class="pack-balance">{{ pack.tokenBalance }} tokens</div>
        </div>
        
        <div class="pack-pellets">
          <div class="pellet-mini-bar">
            <div 
              v-for="i in pack.maxPellets" 
              :key="i"
              class="mini-pellet"
              :class="{ 'filled': i <= pack.currentPellets }"
              :style="{ backgroundColor: i <= pack.currentPellets ? pack.color : 'rgba(255,255,255,0.1)' }"
            ></div>
          </div>
          <div class="pellet-count">{{ pack.currentPellets }}/{{ pack.maxPellets }}</div>
        </div>
        
        <div v-if="pack.powerMultiplier > 1" class="power-badge">
          {{ pack.powerMultiplier }}x Power
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

export interface PelletPack {
  tokenSymbol: string
  tokenBalance: number
  currentPellets: number
  maxPellets: number
  color: string
  logoURI?: string
  powerMultiplier: number
  refillCost: number
}

interface Props {
  availablePacks: PelletPack[]
  selectedPack: PelletPack | null
}

defineProps<Props>()

const emit = defineEmits<{
  'select': [pack: PelletPack]
  'close': []
}>()

const selectPack = (pack: PelletPack) => {
  if (pack.currentPellets > 0) {
    emit('select', pack)
  }
}
</script>

<style scoped>
.pellet-pack-selector {
  position: fixed;
  top: 150px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1200;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 20px;
  min-width: 400px;
  max-width: 600px;
  max-height: 70vh;
  overflow-y: auto;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-text {
  font-size: 18px;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.close-btn {
  color: rgba(255, 255, 255, 0.7);
}

.pellet-packs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pellet-pack {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 16px;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.pellet-pack:hover:not(.depleted) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.pellet-pack.selected {
  background: rgba(255, 255, 255, 0.15);
  border-color: #FFD700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
}

.pellet-pack.depleted {
  opacity: 0.5;
  cursor: not-allowed;
}

.pack-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.token-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 50%;
}

.token-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: white;
}

.pack-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pack-name {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.pack-balance {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.pack-pellets {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.pellet-mini-bar {
  display: flex;
  gap: 2px;
  padding: 4px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
}

.mini-pellet {
  width: 8px;
  height: 16px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.mini-pellet.filled {
  box-shadow: 0 0 4px currentColor;
}

.pellet-count {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
}

.power-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: linear-gradient(135deg, #FF6B6B, #FF5722);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .pellet-pack-selector {
    min-width: 320px;
    max-width: calc(100vw - 32px);
    top: 120px;
    padding: 16px;
  }
  
  .pellet-pack {
    grid-template-columns: auto 1fr auto;
    gap: 12px;
    padding: 12px;
  }
  
  .pack-pellets {
    grid-column: 1 / -1;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }
  
  .pack-icon {
    width: 40px;
    height: 40px;
  }
  
  .pack-name {
    font-size: 14px;
  }
}

/* Scrollbar styling */
.pellet-pack-selector::-webkit-scrollbar {
  width: 6px;
}

.pellet-pack-selector::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.pellet-pack-selector::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.pellet-pack-selector::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>