<template>
  <div class="radar-chart-container">
    <canvas 
      ref="canvasRef" 
      :width="size" 
      :height="size"
      class="radar-canvas"
    ></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  stats: {
    type: Object,
    required: true
  },
  size: {
    type: Number,
    default: 200
  },
  backgroundColor: {
    type: String,
    default: 'rgba(59, 130, 246, 0.1)'
  },
  borderColor: {
    type: String,
    default: 'rgba(59, 130, 246, 0.8)'
  },
  gridColor: {
    type: String,
    default: 'rgba(255, 255, 255, 0.3)'
  },
  textColor: {
    type: String,
    default: 'rgba(255, 255, 255, 0.9)'
  }
})

const canvasRef = ref(null)

const statLabels = [
  { key: 'pace', label: 'PAC', short: 'P' },
  { key: 'shooting', label: 'SHO', short: 'S' },
  { key: 'passing', label: 'PAS', short: 'Pa' },
  { key: 'defense', label: 'DEF', short: 'D' },
  { key: 'physical', label: 'PHY', short: 'Ph' },
  { key: 'dribbling', label: 'DRI', short: 'Dr' }
]

const drawRadarChart = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const centerX = props.size / 2
  const centerY = props.size / 2
  const radius = Math.min(centerX, centerY) - 40

  // Clear canvas
  ctx.clearRect(0, 0, props.size, props.size)

  // Number of stats (sides of polygon)
  const numSides = statLabels.length
  const angleStep = (2 * Math.PI) / numSides

  // Draw grid lines (concentric polygons)
  ctx.strokeStyle = props.gridColor
  ctx.lineWidth = 1
  
  for (let level = 1; level <= 5; level++) {
    const levelRadius = (radius * level) / 5
    ctx.beginPath()
    
    for (let i = 0; i < numSides; i++) {
      const angle = i * angleStep - Math.PI / 2
      const x = centerX + levelRadius * Math.cos(angle)
      const y = centerY + levelRadius * Math.sin(angle)
      
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    
    ctx.closePath()
    ctx.stroke()
  }

  // Draw axis lines
  ctx.strokeStyle = props.gridColor
  ctx.lineWidth = 1
  
  for (let i = 0; i < numSides; i++) {
    const angle = i * angleStep - Math.PI / 2
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)
    
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  // Draw labels
  ctx.fillStyle = props.textColor
  ctx.font = `${Math.max(10, props.size / 20)}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  for (let i = 0; i < numSides; i++) {
    const angle = i * angleStep - Math.PI / 2
    const labelRadius = radius + 20
    const x = centerX + labelRadius * Math.cos(angle)
    const y = centerY + labelRadius * Math.sin(angle)
    
    const statInfo = statLabels[i]
    const label = props.size < 150 ? statInfo.short : statInfo.label
    ctx.fillText(label, x, y)
  }

  // Draw data polygon
  ctx.fillStyle = props.backgroundColor
  ctx.strokeStyle = props.borderColor
  ctx.lineWidth = 2
  ctx.beginPath()

  for (let i = 0; i < numSides; i++) {
    const statKey = statLabels[i].key
    const statValue = props.stats[statKey] || 0
    const normalizedValue = Math.max(0, Math.min(100, statValue)) / 100
    const statRadius = radius * normalizedValue
    
    const angle = i * angleStep - Math.PI / 2
    const x = centerX + statRadius * Math.cos(angle)
    const y = centerY + statRadius * Math.sin(angle)
    
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }

  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Draw data points
  ctx.fillStyle = props.borderColor
  for (let i = 0; i < numSides; i++) {
    const statKey = statLabels[i].key
    const statValue = props.stats[statKey] || 0
    const normalizedValue = Math.max(0, Math.min(100, statValue)) / 100
    const statRadius = radius * normalizedValue
    
    const angle = i * angleStep - Math.PI / 2
    const x = centerX + statRadius * Math.cos(angle)
    const y = centerY + statRadius * Math.sin(angle)
    
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, 2 * Math.PI)
    ctx.fill()
  }

  // Draw stat values near data points
  ctx.fillStyle = props.textColor
  ctx.font = `${Math.max(8, props.size / 25)}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let i = 0; i < numSides; i++) {
    const statKey = statLabels[i].key
    const statValue = props.stats[statKey] || 0
    const normalizedValue = Math.max(0, Math.min(100, statValue)) / 100
    const statRadius = radius * normalizedValue
    
    const angle = i * angleStep - Math.PI / 2
    const x = centerX + statRadius * Math.cos(angle)
    const y = centerY + statRadius * Math.sin(angle)
    
    // Offset text slightly towards center for better readability
    const textOffsetRadius = Math.max(15, statRadius - 15)
    const textX = centerX + textOffsetRadius * Math.cos(angle)
    const textY = centerY + textOffsetRadius * Math.sin(angle)
    
    if (statValue > 10) { // Only show values if they're significant
      ctx.fillText(statValue.toString(), textX, textY)
    }
  }
}

onMounted(() => {
  drawRadarChart()
})

watch(() => props.stats, () => {
  drawRadarChart()
}, { deep: true })

watch(() => props.size, () => {
  drawRadarChart()
})
</script>

<style scoped>
.radar-chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.radar-canvas {
  max-width: 100%;
  max-height: 100%;
}
</style>