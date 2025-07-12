<template>
  <div class="mobile-color-slider">
    <div class="color-label">{{ label }}</div>
    <div class="color-slider-container">
      <div 
        class="color-preview" 
        :style="{ backgroundColor: currentColor }"
        @click="showPicker = !showPicker"
      ></div>
      
      <input
        type="range"
        v-model="hue"
        min="0"
        max="360"
        step="1"
        class="hue-slider"
        @input="updateColor"
      />
      
      <!-- Mobile Color Picker Popup -->
      <div v-if="showPicker" class="color-picker-popup" @click.self="showPicker = false">
        <div class="color-picker-content">
          <div class="picker-header">
            <h4>{{ label }} Color</h4>
            <button @click="showPicker = false" class="close-btn">×</button>
          </div>
          
          <div class="color-wheel">
            <div 
              v-for="color in colorPresets" 
              :key="color.hue"
              class="color-option"
              :style="{ backgroundColor: color.color }"
              @click="selectPreset(color.hue)"
              :class="{ active: Math.abs(hue - color.hue) < 10 }"
            ></div>
          </div>
          
          <div class="hue-control">
            <label>Hue: {{ hue }}°</label>
            <input
              type="range"
              v-model="hue"
              min="0"
              max="360"
              step="1"
              class="mobile-hue-slider"
              @input="updateColor"
            />
          </div>
          
          <div class="saturation-control">
            <label>Saturation: {{ saturation }}%</label>
            <input
              type="range"
              v-model="saturation"
              min="20"
              max="100"
              step="5"
              class="mobile-saturation-slider"
              @input="updateColor"
            />
          </div>
          
          <div class="lightness-control">
            <label>Lightness: {{ lightness }}%</label>
            <input
              type="range"
              v-model="lightness"
              min="30"
              max="80"
              step="5"
              class="mobile-lightness-slider"
              @input="updateColor"
            />
          </div>
          
          <div class="color-preview-large" :style="{ backgroundColor: currentColor }">
            <div class="color-text">{{ currentColor }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

interface Props {
  label: string
  initialHue?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialHue: 218
})

const emit = defineEmits<{
  'update:color': [color: string]
}>()

const hue = ref(props.initialHue)
const saturation = ref(70)
const lightness = ref(50)
const showPicker = ref(false)

const currentColor = computed(() => {
  return `hsl(${hue.value}, ${saturation.value}%, ${lightness.value}%)`
})

const colorPresets = computed(() => [
  { hue: 0, color: 'hsl(0, 70%, 50%)' },      // Red
  { hue: 30, color: 'hsl(30, 70%, 50%)' },    // Orange
  { hue: 60, color: 'hsl(60, 70%, 50%)' },    // Yellow
  { hue: 120, color: 'hsl(120, 70%, 50%)' },  // Green
  { hue: 180, color: 'hsl(180, 70%, 50%)' },  // Cyan
  { hue: 210, color: 'hsl(210, 70%, 50%)' },  // Light Blue
  { hue: 240, color: 'hsl(240, 70%, 50%)' },  // Blue
  { hue: 270, color: 'hsl(270, 70%, 50%)' },  // Purple
  { hue: 300, color: 'hsl(300, 70%, 50%)' },  // Magenta
  { hue: 330, color: 'hsl(330, 70%, 50%)' },  // Pink
])

const updateColor = () => {
  emit('update:color', currentColor.value)
}

const selectPreset = (presetHue: number) => {
  hue.value = presetHue
  updateColor()
}

// Watch for external hue changes
watch(() => props.initialHue, (newHue) => {
  hue.value = newHue
})

// Emit initial color on mount
onMounted(() => {
  updateColor()
})
</script>

<style scoped>
.mobile-color-slider {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.color-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
}

.color-slider-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.color-preview {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.color-preview:hover {
  border-color: rgba(255, 255, 255, 0.6);
  transform: scale(1.05);
}

.hue-slider {
  flex: 1;
  height: 8px;
  background: linear-gradient(
    to right,
    hsl(0, 70%, 50%),
    hsl(30, 70%, 50%),
    hsl(60, 70%, 50%),
    hsl(120, 70%, 50%),
    hsl(180, 70%, 50%),
    hsl(240, 70%, 50%),
    hsl(300, 70%, 50%),
    hsl(360, 70%, 50%)
  );
  border-radius: 4px;
  outline: none;
  -webkit-appearance: none;
  cursor: pointer;
}

.hue-slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  background: white;
  border: 2px solid #333;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.hue-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: white;
  border: 2px solid #333;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.color-picker-popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.color-picker-content {
  background: rgba(30, 30, 30, 0.95);
  border-radius: 16px;
  padding: 24px;
  margin: 20px;
  max-width: 360px;
  width: calc(100% - 40px);
  max-height: 80vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  color: white;
}

.picker-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.color-wheel {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 20px;
}

.color-option {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.color-option:hover {
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.color-option.active {
  border-color: white;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
}

.hue-control,
.saturation-control,
.lightness-control {
  margin-bottom: 16px;
}

.hue-control label,
.saturation-control label,
.lightness-control label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 8px;
}

.mobile-hue-slider,
.mobile-saturation-slider,
.mobile-lightness-slider {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  outline: none;
  -webkit-appearance: none;
  cursor: pointer;
}

.mobile-hue-slider {
  background: linear-gradient(
    to right,
    hsl(0, 70%, 50%),
    hsl(60, 70%, 50%),
    hsl(120, 70%, 50%),
    hsl(180, 70%, 50%),
    hsl(240, 70%, 50%),
    hsl(300, 70%, 50%),
    hsl(360, 70%, 50%)
  );
}

.mobile-saturation-slider {
  background: linear-gradient(
    to right,
    hsl(var(--current-hue, 218), 20%, 50%),
    hsl(var(--current-hue, 218), 100%, 50%)
  );
}

.mobile-lightness-slider {
  background: linear-gradient(
    to right,
    hsl(var(--current-hue, 218), 70%, 20%),
    hsl(var(--current-hue, 218), 70%, 50%),
    hsl(var(--current-hue, 218), 70%, 80%)
  );
}

.mobile-hue-slider::-webkit-slider-thumb,
.mobile-saturation-slider::-webkit-slider-thumb,
.mobile-lightness-slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  background: white;
  border: 2px solid #333;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.mobile-hue-slider::-moz-range-thumb,
.mobile-saturation-slider::-moz-range-thumb,
.mobile-lightness-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: white;
  border: 2px solid #333;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.color-preview-large {
  height: 60px;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.color-text {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(0, 0, 0, 0.5);
  padding: 4px 8px;
  border-radius: 6px;
  backdrop-filter: blur(4px);
}

/* Touch-friendly adjustments */
@media (max-width: 600px) {
  .color-picker-content {
    margin: 16px;
    padding: 20px;
  }
  
  .color-wheel {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .color-option {
    width: 44px;
    height: 44px;
  }
  
  .mobile-hue-slider,
  .mobile-saturation-slider,
  .mobile-lightness-slider {
    height: 12px;
  }
  
  .mobile-hue-slider::-webkit-slider-thumb,
  .mobile-saturation-slider::-webkit-slider-thumb,
  .mobile-lightness-slider::-webkit-slider-thumb {
    width: 24px;
    height: 24px;
  }
}
</style>
