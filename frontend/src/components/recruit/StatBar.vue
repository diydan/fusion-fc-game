<template>
  <div class="stat-bar">
    <div 
      class="stat-fill" 
      :style="{ width: `${value}%` }"
      :class="getStatClass(value)"
    ></div>
    <span class="stat-value">{{ value }}</span>
  </div>
</template>

<script setup>
const props = defineProps({
  value: {
    type: Number,
    required: true,
    default: 0
  }
})

const getStatClass = (value) => {
  if (value >= 90) return 'excellent'
  if (value >= 80) return 'very-good'
  if (value >= 70) return 'good'
  if (value >= 60) return 'average'
  return 'poor'
}
</script>

<style scoped>
.stat-bar {
  position: relative;
  width: 60px;
  height: 20px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  border-radius: 10px;
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
  position: relative;
  z-index: 1;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}
</style>
