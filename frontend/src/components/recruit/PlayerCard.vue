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

    <!-- Player Avatar -->
    <div class="player-avatar">
      <v-avatar size="80">
        <v-img :src="player.avatar || '/default-player.png'" />
      </v-avatar>
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
        <span class="age">Age {{ player.age }}</span>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-section">
      <div class="stat-row">
        <div class="stat-item">
          <span class="stat-label">PAC</span>
          <span class="stat-value">{{ player.stats.pace }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">SHO</span>
          <span class="stat-value">{{ player.stats.shooting }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">PAS</span>
          <span class="stat-value">{{ player.stats.passing }}</span>
        </div>
      </div>
      <div class="stat-row">
        <div class="stat-item">
          <span class="stat-label">DEF</span>
          <span class="stat-value">{{ player.stats.defense }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">PHY</span>
          <span class="stat-value">{{ player.stats.physical }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">DRI</span>
          <span class="stat-value">{{ player.stats.dribbling || 75 }}</span>
        </div>
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

    <!-- Radar Chart Overlay -->
    <div v-if="showRadar" class="radar-overlay">
      <PlayerRadarChart :stats="player.stats" />
    </div>
  </v-card>
</template>

<script setup>
import { computed, ref } from 'vue'
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

const showRadar = ref(false)

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
  min-height: 320px;
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

.player-avatar {
  display: flex;
  justify-content: center;
  margin: 8px 0;
  position: relative;
}

.bot-badge {
  position: absolute;
  bottom: 0;
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
}

.player-info {
  text-align: center;
  padding: 0 16px 12px;
}

.player-name {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 4px;
  color: white;
}

.player-details {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #d1d5db;
}

.stats-section {
  padding: 0 16px;
  margin-bottom: 12px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-label {
  font-size: 0.7rem;
  color: #9ca3af;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 1rem;
  font-weight: bold;
  color: white;
}

.price-section {
  text-align: center;
  margin-bottom: 12px;
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

.radar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
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
    min-height: 280px;
  }
  
  .overall-rating {
    font-size: 1.5rem;
  }
  
  .player-name {
    font-size: 1rem;
  }
  
  .stat-item {
    margin: 0 2px;
  }
}
</style>
