<template>
  <div class="color-slider-container">
    <label>{{ label }}</label>
    <input
      type="range"
      min="0"
      max="360"
      v-model="hueValue"
      @input="updateColor"
      class="color-slider"
    />
    <div class="color-preview" :style="{ backgroundColor: `hsl(${hueValue}, 100%, 50%)` }"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{
  initialHue?: number
  label: string
}>()

const emit = defineEmits<{
  (e: 'update:color', color: string): void
}>()

const hueValue = ref(props.initialHue || 0)

const updateColor = () => {
  const color = `hsl(${hueValue.value}, 100%, 50%)`
  console.log(`🎨 ColorSlider (${props.label}) emitting color:`, color)
  emit('update:color', color)
}

watch(() => props.initialHue, (newValue) => {
  if (newValue !== undefined) {
    hueValue.value = newValue
  }
})

// Emit initial color on mount
onMounted(() => {
  updateColor()
})
</script>

<style scoped>
.color-slider-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.color-slider {
  flex: 1;
  height: 8px;
  -webkit-appearance: none;
  background: linear-gradient(to right, 
    hsl(0, 100%, 50%),
    hsl(60, 100%, 50%),
    hsl(120, 100%, 50%),
    hsl(180, 100%, 50%),
    hsl(240, 100%, 50%),
    hsl(300, 100%, 50%),
    hsl(360, 100%, 50%)
  );
  border-radius: 4px;
  outline: none;
}

.color-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #333;
}

.color-preview {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

label {
  color: white;
  font-size: 0.9rem;
  min-width: 80px;
}
</style>
