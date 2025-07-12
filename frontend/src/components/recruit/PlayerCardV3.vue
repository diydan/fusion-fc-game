<template>
  <v-card 
    class="player-card" 
    :class="{ 'selected': isSelected }"
    @click="$emit('click')"
    elevation="4"
    hover
  >
    <!-- Tier Badge -->
    <div class="tier-badge" :class="tierClass">
      {{ player.tier.toUpperCase() }}
    </div>

    <!-- Card Header -->
    <div class="card-header">
      <div class="overall-rating">{{ player.overall }}</div>
      <div class="position">{{ player.position }}</div>
    </div>

    <!-- Player Avatar with Radar Chart -->
    <div class="radar-section">
      <PlayerRadarChart 
        :stats="player.stats" 
        :size="180"
        :backgroundColor="radarColors.bg"
        :borderColor="radarColors.border"
        gridColor="rgba(255, 255, 255, 0.1)"
        textColor="rgba(255, 255, 255, 0.7)"
      />
      <!-- Bot Badge -->
      <div v-if="player.bot" class="bot-badge">
        <v-icon size="16">mdi-robot</v-icon>
      </div>
    </div>

    <!-- Player Info -->
    <div class="player-info">
      <h3 class="player-name">{{ player.name }}</h3>
      <div class="player-details">
        <span class="nationality">{{ player.nationality }}</span>
      </div>
    </div>

    <!-- Attribute Bars -->
    <div class="attributes-section">
      <div class="attribute-item" v-for="stat in mainStats" :key="stat.key">
        <span class="attr-label">{{ stat.label }}</span>
        <div class="attr-bar">
          <div 
            class="attr-fill" 
            :style="`width: ${player.stats[stat.key]}%`"
          ></div>
        </div>
        <span class="attr-value">{{ player.stats[stat.key] }}</span>
      </div>
    </div>

    <!-- Price -->
    <div class="price-section">
      <span class="price">{{ formattedPrice }}</span>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <v-btn
        size="small"
        :color="isSelected ? 'primary' : 'grey'"
        variant="outlined"
        @click.stop="$emit('compare')"
      >
        <v-icon size="16">mdi-compare</v-icon>
      </v-btn>
      <v-btn
        size="small"
        color="info"
        variant="outlined"
        @click.stop="$emit('select-bot')"
        v-if="!player.bot"
      >
        <v-icon size="16">mdi-robot</v-icon>
      </v-btn>
      <v-btn
        size="small"
        color="success"
        variant="outlined"
        @click.stop="$emit('recruit')"
      >
        <v-icon size="16">mdi-account-plus</v-icon>
      </v-btn>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import PlayerRadarChart from './PlayerRadarChart.vue'

const props = defineProps({
  player: {
    type: Object,
    required: true
  },
  isSelected: {
    type: Boolean,
    default: false
  }
})

// Main stats to show
const mainStats = [
  { key: 'pace', label: 'PAC' },
  { key: 'shooting', label: 'SHO' },
  { key: 'passing', label: 'PAS' },
  { key: 'defense', label: 'DEF' },
  { key: 'physical', label: 'PHY' },
  { key: 'dribbling', label: 'DRI' }
]

const formattedPrice = computed(() => {
  const price = props.player.price
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(1)}M`
  } else if (price >= 1000) {
    return `$${(price / 1000).toFixed(0)}K`
  }
  return `$${price}`
})

const tierClass = computed(() => {
  const tierClasses = {
    amateur: 'tier-amateur',
    'semi-pro': 'tier-semi-pro',
    pro: 'tier-pro',
    elite: 'tier-elite'
  }
  return tierClasses[props.player.tier] || 'tier-amateur'
})

const radarColors = computed(() => {
  const tierColors = {
    elite: { bg: 'rgba(139, 92, 246, 0.2)', border: 'rgba(139, 92, 246, 0.8)' },
    pro: { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.8)' },
    'semi-pro': { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.8)' },
    amateur: { bg: 'rgba(107, 114, 128, 0.2)', border: 'rgba(107, 114, 128, 0.8)' }
  }
  return tierColors[props.player.tier] || tierColors.amateur
})

defineEmits(['click', 'compare', 'recruit', 'select-bot'])
</script>

<style scoped>
.player-card {
  position: relative;
  background: linear-gradient(135deg, #1e293b, #334155);
  border: 2px solid #475569;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  color: white;
  min-height: 480px;
  display: flex;
  flex-direction: column;
}

.player-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  border-color: #3b82f6;
}

.player-card.selected {
  border-color: #10b981;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
}

.tier-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: bold;
  z-index: 2;
}

.tier-amateur {
  background: #6b7280;
  color: white;
}

.tier-semi-pro {
  background: #10b981;
  color: white;
}

.tier-pro {
  background: #3b82f6;
  color: white;
}

.tier-elite {
  background: #8b5cf6;
  color: white;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px 8px;
}

.overall-rating {
  font-size: 2rem;
  font-weight: bold;
  color: #fbbf24;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.position {
  font-size: 1rem;
  font-weight: bold;
  color: #e5e7eb;
  background: rgba(0, 0, 0, 0.3);
  padding: 4px 8px;
  border-radius: 8px;
}

.radar-section {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 0;
  position: relative;
  height: 200px;
}

.bot-badge {
  position: absolute;
  bottom: 10px;
  right: 50%;
  transform: translateX(50%);
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  z-index: 2;
}

.player-info {
  text-align: center;
  padding: 0 16px 8px;
}

.player-name {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 4px;
  color: white;
}

.player-details {
  font-size: 0.8rem;
  color: #d1d5db;
}

.attributes-section {
  padding: 0 16px 12px;
  flex: 1;
}

.attribute-item {
  display: grid;
  grid-template-columns: 35px 1fr 35px;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.attr-label {
  font-size: 0.7rem;
  color: #9ca3af;
  font-weight: 600;
  text-align: center;
}

.attr-bar {
  width: 100%;
  height: 6px;
  background: rgba(100, 116, 139, 0.3);
  border-radius: 3px;
  overflow: hidden;
}

.attr-fill {
  height: 100%;
  background: linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #10b981 100%);
  transition: width 0.3s ease;
}

.attr-value {
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
  text-align: center;
}

.price-section {
  text-align: center;
  margin-bottom: 12px;
  padding: 0 16px;
}

.price {
  font-size: 1.2rem;
  font-weight: bold;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  padding: 4px 12px;
  border-radius: 8px;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.action-buttons {
  display: flex;
  justify-content: space-around;
  padding: 0 16px 16px;
  gap: 8px;
}

/* Animation for card entrance */
.player-card {
  animation: cardEntrance 0.5s ease-out;
}

@keyframes cardEntrance {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 600px) {
  .player-card {
    min-height: 440px;
  }
  
  .overall-rating {
    font-size: 1.5rem;
  }
  
  .player-name {
    font-size: 1rem;
  }
  
  .radar-section {
    height: 160px;
  }
  
  .attribute-item {
    grid-template-columns: 30px 1fr 30px;
    gap: 6px;
  }
}

/* Portrait orientation optimization */
@media (orientation: portrait) {
  .player-card {
    max-width: 360px;
    margin: 0 auto;
  }
}
</style>