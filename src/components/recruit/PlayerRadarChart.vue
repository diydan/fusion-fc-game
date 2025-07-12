<template>
  <div class="radar-chart">
    <svg :width="size" :height="size" class="radar-svg">
      <!-- Background grid -->
      <g class="grid">
        <!-- Concentric circles -->
        <circle
          v-for="level in 5"
          :key="level"
          :cx="centerX"
          :cy="centerY"
          :r="(level * radius) / 5"
          fill="none"
          :stroke="gridColor"
          stroke-width="1"
          opacity="0.3"
        />
        
        <!-- Axis lines -->
        <line
          v-for="(stat, index) in statKeys"
          :key="stat"
          :x1="centerX"
          :y1="centerY"
          :x2="getAxisPoint(index).x"
          :y2="getAxisPoint(index).y"
          :stroke="gridColor"
          stroke-width="1"
          opacity="0.5"
        />
      </g>

      <!-- Stat area -->
      <polygon
        :points="statPolygonPoints"
        :fill="fillColor"
        :stroke="strokeColor"
        stroke-width="2"
        fill-opacity="0.3"
      />

      <!-- Stat points -->
      <circle
        v-for="(point, index) in statPoints"
        :key="index"
        :cx="point.x"
        :cy="point.y"
        r="3"
        :fill="strokeColor"
      />

      <!-- Stat labels -->
      <text
        v-for="(stat, index) in statKeys"
        :key="stat"
        :x="getLabelPoint(index).x"
        :y="getLabelPoint(index).y"
        :text-anchor="getLabelAnchor(index)"
        :class="labelClass"
        font-size="10"
        font-weight="bold"
      >
        {{ getStatLabel(stat) }}
      </text>

      <!-- Stat values -->
      <text
        v-for="(point, index) in statPoints"
        :key="`value-${index}`"
        :x="point.x"
        :y="point.y - 8"
        text-anchor="middle"
        :class="valueClass"
        font-size="9"
        font-weight="600"
      >
        {{ Object.values(normalizedStats)[index] }}
      </text>
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  stats: {
    type: Object,
    required: true,
    default: () => ({
      pace: 70,
      shooting: 70,
      passing: 70,
      defense: 70,
      physical: 70,
      dribbling: 70
    })
  },
  size: {
    type: Number,
    default: 160
  },
  fillColor: {
    type: String,
    default: 'rgba(59, 130, 246, 0.5)'
  },
  strokeColor: {
    type: String,
    default: '#3b82f6'
  },
  gridColor: {
    type: String,
    default: '#6b7280'
  },
  labelClass: {
    type: String,
    default: 'stat-label'
  },
  valueClass: {
    type: String,
    default: 'stat-value'
  }
})

const centerX = computed(() => props.size / 2)
const centerY = computed(() => props.size / 2)
const radius = computed(() => (props.size / 2) - 30)

const statKeys = computed(() => {
  const primaryStats = ['pace', 'shooting', 'passing', 'defense', 'physical', 'dribbling']
  return primaryStats.filter(stat => props.stats.hasOwnProperty(stat))
})

const normalizedStats = computed(() => {
  const normalized = {}
  statKeys.value.forEach(stat => {
    normalized[stat] = Math.min(100, Math.max(0, props.stats[stat] || 0))
  })
  return normalized
})

const getAngle = (index) => {
  return (index * 2 * Math.PI) / statKeys.value.length - Math.PI / 2
}

const getAxisPoint = (index) => {
  const angle = getAngle(index)
  return {
    x: centerX.value + radius.value * Math.cos(angle),
    y: centerY.value + radius.value * Math.sin(angle)
  }
}

const getLabelPoint = (index) => {
  const angle = getAngle(index)
  const labelRadius = radius.value + 15
  return {
    x: centerX.value + labelRadius * Math.cos(angle),
    y: centerY.value + labelRadius * Math.sin(angle) + 3
  }
}

const getLabelAnchor = (index) => {
  const angle = getAngle(index)
  const x = Math.cos(angle)
  if (x > 0.1) return 'start'
  if (x < -0.1) return 'end'
  return 'middle'
}

const getStatLabel = (stat) => {
  const labels = {
    pace: 'PAC',
    shooting: 'SHO',
    passing: 'PAS',
    defense: 'DEF',
    physical: 'PHY',
    dribbling: 'DRI',
    mental: 'MEN',
    technical: 'TEC'
  }
  return labels[stat] || stat.toUpperCase().slice(0, 3)
}

const statPoints = computed(() => {
  return statKeys.value.map((stat, index) => {
    const angle = getAngle(index)
    const value = normalizedStats.value[stat]
    const pointRadius = (value / 100) * radius.value
    return {
      x: centerX.value + pointRadius * Math.cos(angle),
      y: centerY.value + pointRadius * Math.sin(angle)
    }
  })
})

const statPolygonPoints = computed(() => {
  return statPoints.value.map(point => `${point.x},${point.y}`).join(' ')
})
</script>

<style scoped>
.radar-chart {
  display: flex;
  justify-content: center;
  align-items: center;
}

.radar-svg {
  overflow: visible;
}

.stat-label {
  fill: var(--v-theme-on-surface);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.stat-value {
  fill: var(--v-theme-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Dark theme adjustments */
@media (prefers-color-scheme: dark) {
  .stat-label {
    fill: #e5e7eb;
  }
}
</style>
