<template>
  <v-card 
    class="player-card-v2" 
    :class="{ 
      'selected': isSelected,
      'expanded': isExpanded,
      [`tier-${player.tier}`]: true
    }"
    elevation="6"
  >
    <!-- Card Header -->
    <div class="card-header" @click="toggleExpanded">
      <div class="header-left">
        <div class="overall-badge">
          <span class="overall-value">{{ player.overall }}</span>
          <span class="overall-label">OVR</span>
        </div>
        <div class="player-info">
          <h3 class="player-name">{{ player.name }}</h3>
          <div class="player-meta">
            <v-chip size="x-small" :color="positionColor" class="position-chip">
              {{ player.position }}
            </v-chip>
            <span class="nationality">{{ player.nationality }}</span>
            <span class="age">{{ player.age }}y</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="tier-indicator" :class="`tier-${player.tier}`">
          {{ player.tier.toUpperCase() }}
        </div>
        <v-icon :icon="isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
      </div>
    </div>

    <!-- Collapsed View: Basic Stats -->
    <div v-if="!isExpanded" class="collapsed-content">
      <!-- Radar Chart Section -->
      <div class="radar-section-collapsed">
        <PlayerRadarChart 
          :stats="player.stats" 
          :size="180"
          :backgroundColor="radarColors.bg"
          :borderColor="radarColors.border"
          gridColor="rgba(255, 255, 255, 0.1)"
          textColor="rgba(255, 255, 255, 0.7)"
        />
      </div>
      
      <!-- Stats Bars -->
      <div class="stats-bars">
        <div class="stat-row" v-for="stat in mainStats" :key="stat.key">
          <span class="stat-label">{{ stat.label }}</span>
          <div class="stat-bar">
            <div 
              class="stat-fill" 
              :style="`width: ${player.stats[stat.key]}%`"
              :class="getStatClass(player.stats[stat.key])"
            ></div>
          </div>
          <span class="stat-value">{{ player.stats[stat.key] }}</span>
        </div>
      </div>
      
      <!-- Actions Row -->
      <div class="actions-row">
        <div class="price-tag">
          <v-icon size="small">mdi-currency-usd</v-icon>
          <span>{{ formattedPrice }}</span>
        </div>
        <div class="action-buttons">
          <v-btn
            size="small"
            icon="mdi-compare"
            variant="text"
            @click.stop="$emit('compare')"
            :color="isSelected ? 'primary' : 'default'"
          />
          <v-btn
            size="small"
            :icon="isFavorite ? 'mdi-heart' : 'mdi-heart-outline'"
            variant="text"
            @click.stop="$emit('favorite')"
            :color="isFavorite ? 'error' : 'default'"
          />
          <v-btn
            size="small"
            color="success"
            variant="tonal"
            @click.stop="$emit('recruit')"
          >
            Recruit
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Expanded View: Detailed Stats -->
    <v-expand-transition>
      <div v-if="isExpanded" class="expanded-content">
        <!-- Radar Chart Section -->
        <div class="radar-section">
          <h4 class="section-title">Performance Overview</h4>
          <div class="radar-container">
            <PlayerRadarChart 
              :stats="player.stats" 
              :size="200"
              :backgroundColor="radarColors.bg"
              :borderColor="radarColors.border"
            />
          </div>
        </div>

        <!-- Detailed Attributes -->
        <div class="attributes-section">
          <v-tabs v-model="activeTab" density="compact" color="primary">
            <v-tab value="physical">Physical</v-tab>
            <v-tab value="technical">Technical</v-tab>
            <v-tab value="mental">Mental</v-tab>
          </v-tabs>

          <v-tabs-window v-model="activeTab">
            <!-- Physical Attributes -->
            <v-tabs-window-item value="physical">
              <div class="attributes-list">
                <div v-for="attr in physicalAttributes" :key="attr.key" class="attribute-row">
                  <span class="attr-name">{{ attr.label }}</span>
                  <div class="attr-bar">
                    <div 
                      class="attr-fill" 
                      :style="`width: ${getAttributeValue(attr.key)}%`"
                      :class="getAttributeClass(getAttributeValue(attr.key))"
                    ></div>
                  </div>
                  <span class="attr-value">{{ getAttributeValue(attr.key) }}</span>
                </div>
              </div>
            </v-tabs-window-item>

            <!-- Technical Attributes -->
            <v-tabs-window-item value="technical">
              <div class="attributes-list">
                <div v-for="attr in technicalAttributes" :key="attr.key" class="attribute-row">
                  <span class="attr-name">{{ attr.label }}</span>
                  <div class="attr-bar">
                    <div 
                      class="attr-fill" 
                      :style="`width: ${getAttributeValue(attr.key)}%`"
                      :class="getAttributeClass(getAttributeValue(attr.key))"
                    ></div>
                  </div>
                  <span class="attr-value">{{ getAttributeValue(attr.key) }}</span>
                </div>
              </div>
            </v-tabs-window-item>

            <!-- Mental Attributes -->
            <v-tabs-window-item value="mental">
              <div class="attributes-list">
                <div v-for="attr in mentalAttributes" :key="attr.key" class="attribute-row">
                  <span class="attr-name">{{ attr.label }}</span>
                  <div class="attr-bar">
                    <div 
                      class="attr-fill" 
                      :style="`width: ${getAttributeValue(attr.key)}%`"
                      :class="getAttributeClass(getAttributeValue(attr.key))"
                    ></div>
                  </div>
                  <span class="attr-value">{{ getAttributeValue(attr.key) }}</span>
                </div>
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </div>

        <!-- Action Footer -->
        <div class="expanded-actions">
          <v-btn
            variant="outlined"
            size="small"
            @click="showRadarFullscreen = true"
          >
            <v-icon start>mdi-chart-line</v-icon>
            Full Analysis
          </v-btn>
          <v-btn
            color="primary"
            variant="outlined"
            size="small"
            @click.stop="$emit('compare')"
          >
            <v-icon start>mdi-compare</v-icon>
            Compare
          </v-btn>
          <v-btn
            color="success"
            size="small"
            @click.stop="$emit('recruit')"
          >
            <v-icon start>mdi-account-plus</v-icon>
            Recruit Now
          </v-btn>
        </div>
      </div>
    </v-expand-transition>

    <!-- Fullscreen Radar Dialog -->
    <v-dialog v-model="showRadarFullscreen" max-width="600">
      <v-card>
        <v-card-title>
          <span>{{ player.name }} - Full Analysis</span>
          <v-spacer></v-spacer>
          <v-btn icon @click="showRadarFullscreen = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <div class="fullscreen-radar">
            <PlayerRadarChart 
              :stats="player.stats" 
              :size="400"
              :backgroundColor="radarColors.bg"
              :borderColor="radarColors.border"
            />
          </div>
          <div class="overall-stats-summary">
            <div class="summary-item" v-for="stat in mainStats" :key="stat.key">
              <span class="summary-label">{{ stat.label }}</span>
              <v-progress-linear
                :model-value="player.stats[stat.key]"
                height="20"
                :color="getStatColor(player.stats[stat.key])"
              >
                <template v-slot:default>
                  <strong>{{ player.stats[stat.key] }}</strong>
                </template>
              </v-progress-linear>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import PlayerRadarChart from './PlayerRadarChart.vue'

const props = defineProps({
  player: {
    type: Object,
    required: true
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  isFavorite: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'compare', 'recruit', 'favorite'])

// State
const isExpanded = ref(false)
const activeTab = ref('physical')
const showRadarFullscreen = ref(false)

// Main stats to show in collapsed view
const mainStats = [
  { key: 'pace', label: 'PAC' },
  { key: 'shooting', label: 'SHO' },
  { key: 'passing', label: 'PAS' },
  { key: 'defense', label: 'DEF' },
  { key: 'physical', label: 'PHY' },
  { key: 'dribbling', label: 'DRI' }
]

// Attribute definitions
const physicalAttributes = [
  { key: 'pace', label: 'Pace' },
  { key: 'acceleration', label: 'Acceleration' },
  { key: 'sprintSpeed', label: 'Sprint Speed' },
  { key: 'agility', label: 'Agility' },
  { key: 'balance', label: 'Balance' },
  { key: 'jumping', label: 'Jumping' },
  { key: 'stamina', label: 'Stamina' },
  { key: 'strength', label: 'Strength' },
  { key: 'reactions', label: 'Reactions' }
]

const technicalAttributes = [
  { key: 'finishing', label: 'Finishing' },
  { key: 'shotPower', label: 'Shot Power' },
  { key: 'longShots', label: 'Long Shots' },
  { key: 'positioning', label: 'Positioning' },
  { key: 'volleys', label: 'Volleys' },
  { key: 'penalties', label: 'Penalties' },
  { key: 'heading', label: 'Heading' },
  { key: 'passing', label: 'Passing' },
  { key: 'crossing', label: 'Crossing' },
  { key: 'dribbling', label: 'Dribbling' },
  { key: 'ballControl', label: 'Ball Control' },
  { key: 'freeKick', label: 'Free Kick' },
  { key: 'curve', label: 'Curve' }
]

const mentalAttributes = [
  { key: 'vision', label: 'Vision' },
  { key: 'composure', label: 'Composure' },
  { key: 'concentration', label: 'Concentration' },
  { key: 'anticipation', label: 'Anticipation' },
  { key: 'decisions', label: 'Decisions' },
  { key: 'determination', label: 'Determination' },
  { key: 'leadership', label: 'Leadership' },
  { key: 'workRate', label: 'Work Rate' },
  { key: 'teamwork', label: 'Teamwork' },
  { key: 'aggression', label: 'Aggression' },
  { key: 'bravery', label: 'Bravery' }
]

// Computed
const formattedPrice = computed(() => {
  const price = props.player.price
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}M`
  } else if (price >= 1000) {
    return `${(price / 1000).toFixed(0)}K`
  }
  return price.toString()
})

const positionColor = computed(() => {
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
  return colors[props.player.position] || 'grey'
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

// Methods
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    emit('click')
  }
}

const getAttributeValue = (key) => {
  // Generate realistic attribute values based on overall rating
  const baseValue = props.player.stats[key] || props.player.overall
  const variance = Math.floor(Math.random() * 10) - 5
  return Math.max(40, Math.min(99, baseValue + variance))
}

const getAttributeClass = (value) => {
  if (value >= 85) return 'attr-elite'
  if (value >= 75) return 'attr-good'
  if (value >= 65) return 'attr-average'
  return 'attr-poor'
}

const getStatColor = (value) => {
  if (value >= 85) return 'success'
  if (value >= 75) return 'primary'
  if (value >= 65) return 'warning'
  return 'error'
}

const getStatClass = (value) => {
  if (value >= 85) return 'stat-elite'
  if (value >= 75) return 'stat-good'
  if (value >= 65) return 'stat-average'
  return 'stat-poor'
}
</script>

<style scoped>
.player-card-v2 {
  background: linear-gradient(145deg, #1a1f2e, #0f1419);
  border: 2px solid transparent;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  color: white;
}

.player-card-v2:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.player-card-v2.selected {
  border-color: #10b981;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
}

/* Tier-specific borders */
.player-card-v2.tier-elite {
  border-color: #8b5cf6;
}

.player-card-v2.tier-pro {
  border-color: #3b82f6;
}

.player-card-v2.tier-semi-pro {
  border-color: #10b981;
}

.player-card-v2.tier-amateur {
  border-color: #6b7280;
}

/* Card Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.overall-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
}

.overall-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a1f2e;
}

.overall-label {
  font-size: 0.6rem;
  font-weight: 600;
  color: #1a1f2e;
}

.player-info {
  flex: 1;
}

.player-name {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.player-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #94a3b8;
}

.position-chip {
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tier-indicator {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}

.tier-indicator.tier-elite {
  background: #8b5cf6;
}

.tier-indicator.tier-pro {
  background: #3b82f6;
}

.tier-indicator.tier-semi-pro {
  background: #10b981;
}

.tier-indicator.tier-amateur {
  background: #6b7280;
}

/* Collapsed Content */
.collapsed-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Radar Section in Collapsed View */
.radar-section-collapsed {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
  background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.03) 0%, transparent 70%);
  border-radius: 16px;
  position: relative;
}

.radar-section-collapsed::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  padding: 1px;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.1) 0%, 
    transparent 50%, 
    rgba(255, 255, 255, 0.05) 100%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}

/* Stats Bars Section */
.stats-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-row {
  display: grid;
  grid-template-columns: 35px 1fr 35px;
  align-items: center;
  gap: 10px;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-align: left;
}

.stat-bar {
  width: 100%;
  height: 8px;
  background: rgba(100, 116, 139, 0.2);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.stat-fill {
  height: 100%;
  transition: width 0.3s ease;
  position: relative;
}

.stat-fill.stat-elite {
  background: linear-gradient(90deg, #10b981, #059669);
}

.stat-fill.stat-good {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
}

.stat-fill.stat-average {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.stat-fill.stat-poor {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.stat-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.stat-value {
  font-size: 0.8rem;
  font-weight: 700;
  color: #e2e8f0;
  text-align: right;
}

/* Actions Row */
.actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.price-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 1.1rem;
  font-weight: 700;
  color: #10b981;
  text-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Expanded Content */
.expanded-content {
  padding: 0 16px 16px;
}

.radar-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 12px;
  text-align: center;
}

.radar-container {
  display: flex;
  justify-content: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
}

.attributes-section {
  margin-bottom: 16px;
}

.attributes-list {
  padding: 16px 0;
}

.attribute-row {
  display: grid;
  grid-template-columns: 120px 1fr 40px;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.attr-name {
  font-size: 0.8rem;
  color: #94a3b8;
}

.attr-bar {
  width: 100%;
  height: 6px;
  background: rgba(100, 116, 139, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.attr-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.attr-fill.attr-elite {
  background: linear-gradient(90deg, #10b981, #059669);
}

.attr-fill.attr-good {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
}

.attr-fill.attr-average {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.attr-fill.attr-poor {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.attr-value {
  font-size: 0.8rem;
  font-weight: 600;
  text-align: right;
}

.expanded-actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* Fullscreen Radar */
.fullscreen-radar {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  margin-bottom: 24px;
}

.overall-stats-summary {
  display: grid;
  gap: 12px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
}

/* Responsive */
@media (max-width: 768px) {
  .player-card-v2 {
    max-width: 400px;
    margin: 0 auto;
  }
  
  .radar-section-collapsed {
    padding: 16px;
  }
  
  /* Increase radar size on tablets */
  .radar-section-collapsed canvas {
    transform: scale(1.1);
  }
}

@media (max-width: 600px) {
  .overall-badge {
    width: 50px;
    height: 50px;
  }
  
  .overall-value {
    font-size: 1.25rem;
  }
  
  .player-name {
    font-size: 1rem;
  }
  
  .stat-row {
    grid-template-columns: 30px 1fr 30px;
    gap: 8px;
  }
  
  .attribute-row {
    grid-template-columns: 90px 1fr 30px;
    gap: 8px;
  }
  
  .expanded-actions {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .action-buttons {
    gap: 2px;
  }
}

/* Portrait orientation optimization */
@media (orientation: portrait) {
  .player-card-v2 {
    max-width: 420px;
  }
  
  .collapsed-content {
    gap: 20px;
  }
  
  .radar-section-collapsed {
    padding: 20px 16px;
    min-height: 220px;
  }
  
  .stats-bars {
    gap: 10px;
  }
  
  .stat-bar {
    height: 10px;
  }
  
  .stat-label {
    font-size: 0.8rem;
  }
  
  .stat-value {
    font-size: 0.9rem;
  }
}
</style>