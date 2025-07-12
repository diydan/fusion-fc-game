<template>
  <v-card class="comparison-card" elevation="3">
    <!-- Player Header -->
    <div class="player-header">
      <v-avatar size="60">
        <v-img :src="player.avatar || '/default-player.png'" />
      </v-avatar>
      <div class="player-basic-info">
        <h4 class="player-name">{{ player.name }}</h4>
        <div class="player-details">
          <v-chip size="small" :color="getPositionColor(player.position)">
            {{ player.position }}
          </v-chip>
          <v-chip size="small" :color="getTierColor(player.tier)" class="ml-2">
            {{ player.tier.toUpperCase() }}
          </v-chip>
        </div>
        <div class="player-meta mt-2">
          <span class="nationality">{{ player.nationality }}</span>
          <span class="mx-2">•</span>
          <span class="age">{{ player.age }}y</span>
        </div>
      </div>
      <v-btn
        icon="mdi-close"
        size="small"
        variant="text"
        @click="$emit('remove', player.id)"
        class="remove-btn"
      />
    </div>

    <!-- Overall Rating -->
    <div class="overall-section">
      <div class="overall-rating">{{ player.overall }}</div>
      <div class="overall-label">Overall</div>
    </div>

    <!-- Core Stats Grid -->
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-label">PAC</div>
        <div class="stat-value">{{ player.stats.pace }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">SHO</div>
        <div class="stat-value">{{ player.stats.shooting }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">PAS</div>
        <div class="stat-value">{{ player.stats.passing }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">DEF</div>
        <div class="stat-value">{{ player.stats.defense }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">PHY</div>
        <div class="stat-value">{{ player.stats.physical }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">DRI</div>
        <div class="stat-value">{{ player.stats.dribbling || 75 }}</div>
      </div>
    </div>

    <!-- Additional Stats -->
    <v-divider class="my-3" />
    <div class="additional-stats">
      <div class="stat-row">
        <span class="stat-label">Mental</span>
        <span class="stat-value">{{ player.stats.mental || 70 }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Technical</span>
        <span class="stat-value">{{ player.stats.technical || 72 }}</span>
      </div>
    </div>

    <!-- Price Section -->
    <v-divider class="my-3" />
    <div class="price-section">
      <div class="price-label">Transfer Value</div>
      <div class="price-value">{{ formattedPrice }}</div>
    </div>

    <!-- Action Button -->
    <div class="action-section">
      <v-btn
        color="success"
        variant="outlined"
        size="small"
        block
        @click="$emit('recruit', player)"
      >
        <v-icon start>mdi-account-plus</v-icon>
        Recruit Player
      </v-btn>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  player: {
    type: Object,
    required: true
  }
})

const formattedPrice = computed(() => {
  const price = props.player.price
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(1)}M`
  } else if (price >= 1000) {
    return `$${(price / 1000).toFixed(0)}K`
  }
  return `$${price}`
})

const getPositionColor = (position) => {
  const colors = {
    GK: 'yellow',
    CB: 'red',
    LB: 'blue',
    RB: 'blue',
    CDM: 'green',
    CM: 'green',
    CAM: 'orange',
    LW: 'purple',
    RW: 'purple',
    ST: 'pink'
  }
  return colors[position] || 'grey'
}

const getTierColor = (tier) => {
  const colors = {
    amateur: 'grey',
    'semi-pro': 'green',
    pro: 'blue',
    elite: 'purple'
  }
  return colors[tier] || 'grey'
}

defineEmits(['remove', 'recruit'])
</script>

<style scoped>
.comparison-card {
  background: linear-gradient(145deg, #ffffff, #f8fafc);
  border-radius: 16px;
  border: 2px solid #e2e8f0;
  overflow: hidden;
  transition: all 0.3s ease;
  min-height: 400px;
}

.comparison-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
}

.player-header {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  position: relative;
}

.player-basic-info {
  flex: 1;
  margin-left: 12px;
}

.player-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 6px;
}

.player-details {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.player-meta {
  font-size: 0.875rem;
  color: #64748b;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
}

.overall-section {
  text-align: center;
  padding: 16px;
  background: linear-gradient(135deg, #1e293b, #334155);
  color: white;
}

.overall-rating {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.overall-label {
  font-size: 0.875rem;
  font-weight: 500;
  opacity: 0.9;
  margin-top: 4px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
}

.stat-item {
  text-align: center;
  background: white;
  padding: 12px 8px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.stat-item:hover {
  border-color: #3b82f6;
  transform: translateY(-1px);
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

.additional-stats {
  padding: 0 16px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 0.875rem;
}

.stat-row .stat-label {
  color: #64748b;
  font-weight: 500;
}

.stat-row .stat-value {
  color: #1e293b;
  font-weight: 600;
}

.price-section {
  padding: 12px 16px;
  text-align: center;
  background: #f8fafc;
}

.price-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 4px;
}

.price-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #059669;
}

.action-section {
  padding: 12px 16px 16px;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .overall-rating {
    font-size: 2rem;
  }
  
  .player-name {
    font-size: 1rem;
  }
}
</style>