<template>
  <v-card class="comparison-card" elevation="2">
    <v-card-title class="comparison-header">
      <v-avatar size="40">
        <v-img :src="player.avatar || '/default-player.png'" />
      </v-avatar>
      <div class="player-info">
        <h4 class="player-name">{{ player.name }}</h4>
        <span class="player-position">{{ player.position }} - {{ player.tier.toUpperCase() }}</span>
      </div>
      <v-btn
        icon
        size="small"
        @click="$emit('remove', player.id)"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    
    <v-card-text>
      <!-- Overall Rating -->
      <div class="overall-section">
        <div class="overall-rating">{{ player.overall }}</div>
        <span class="overall-label">Overall</span>
      </div>

      <!-- Key Stats -->
      <div class="stats-grid">
        <div v-for="(stat, key) in mainStats" :key="key" class="stat-item">
          <span class="stat-label">{{ key.toUpperCase() }}</span>
          <div class="stat-bar">
            <div 
              class="stat-fill" 
              :style="{ width: `${stat}%` }"
              :class="getStatClass(stat)"
            ></div>
          </div>
          <span class="stat-value">{{ stat }}</span>
        </div>
      </div>

      <!-- Radar Chart -->
      <div class="radar-section">
        <PlayerRadarChart :stats="player.stats" :size="120" />
      </div>

      <!-- Price -->
      <div class="price-section">
        <span class="price">{{ formattedPrice }}</span>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import PlayerRadarChart from './PlayerRadarChart.vue'

const props = defineProps({
  player: {
    type: Object,
    required: true
  }
})

const mainStats = computed(() => ({
  pace: props.player.stats.pace,
  shooting: props.player.stats.shooting,
  passing: props.player.stats.passing,
  defense: props.player.stats.defense,
  physical: props.player.stats.physical
}))

const formattedPrice = computed(() => {
  const price = props.player.price
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(1)}M`
  } else if (price >= 1000) {
    return `$${(price / 1000).toFixed(0)}K`
  }
  return `$${price}`
})

const getStatClass = (value) => {
  if (value >= 90) return 'excellent'
  if (value >= 80) return 'very-good'
  if (value >= 70) return 'good'
  if (value >= 60) return 'average'
  return 'poor'
}

defineEmits(['remove'])
</script>

<style scoped>
.comparison-card {
  background: var(--v-theme-surface);
  border: 1px solid var(--v-theme-outline);
  transition: all 0.3s ease;
}

.comparison-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.comparison-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--v-theme-surface-variant);
}

.player-info {
  flex: 1;
}

.player-name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.player-position {
  font-size: 0.85rem;
  color: var(--v-theme-on-surface-variant);
}

.overall-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  gap: 8px;
}

.overall-rating {
  font-size: 2rem;
  font-weight: bold;
  color: var(--v-theme-primary);
}

.overall-label {
  font-size: 0.9rem;
  color: var(--v-theme-on-surface-variant);
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.stat-item {
  display: grid;
  grid-template-columns: 40px 1fr 30px;
  align-items: center;
  gap: 8px;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--v-theme-on-surface-variant);
}

.stat-bar {
  height: 6px;
  background: var(--v-theme-outline);
  border-radius: 3px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.stat-fill.excellent {
  background: linear-gradient(90deg, #8b5cf6, #a855f7);
}

.stat-fill.very-good {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
}

.stat-fill.good {
  background: linear-gradient(90deg, #10b981, #059669);
}

.stat-fill.average {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.stat-fill.poor {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.stat-value {
  font-size: 0.8rem;
  font-weight: 600;
  text-align: right;
}

.radar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.price-section {
  text-align: center;
}

.price {
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--v-theme-primary);
  background: rgba(var(--v-theme-primary-rgb), 0.1);
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-primary-rgb), 0.3);
}
</style>
