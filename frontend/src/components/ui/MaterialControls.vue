<template>
  <div class="space-y-2">
    <h4 class="text-xs font-medium text-purple-300">✨ Materials</h4>
    
    <div class="space-y-1">
      <label class="flex items-center justify-between text-xs">
        <span>Metalness: {{ materialSettings.metalness.toFixed(1) }}</span>
      </label>
      <input 
        type="range" 
        min="0" 
        max="1" 
        step="0.1" 
        :value="materialSettings.metalness"
        @input="updateSetting('metalness', parseFloat(($event.target as HTMLInputElement).value))"
        class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
      />
    </div>
    
    <div class="space-y-1">
      <label class="flex items-center justify-between text-xs">
        <span>Roughness: {{ materialSettings.roughness.toFixed(1) }}</span>
      </label>
      <input 
        type="range" 
        min="0" 
        max="1" 
        step="0.1" 
        :value="materialSettings.roughness"
        @input="updateSetting('roughness', parseFloat(($event.target as HTMLInputElement).value))"
        class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
      />
    </div>
    
    <div class="space-y-1">
      <label class="flex items-center justify-between text-xs">
        <span>Emissive: {{ materialSettings.emissiveIntensity.toFixed(2) }}</span>
      </label>
      <input 
        type="range" 
        min="0" 
        max="0.5" 
        step="0.01" 
        :value="materialSettings.emissiveIntensity"
        @input="updateSetting('emissiveIntensity', parseFloat(($event.target as HTMLInputElement).value))"
        class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
      />
    </div>
    
    <div class="space-y-1">
      <label class="flex items-center justify-between text-xs">
        <span>Env Map: {{ materialSettings.envMapIntensity.toFixed(1) }}</span>
      </label>
      <input 
        type="range" 
        min="0" 
        max="1.5" 
        step="0.1" 
        :value="materialSettings.envMapIntensity"
        @input="updateSetting('envMapIntensity', parseFloat(($event.target as HTMLInputElement).value))"
        class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
      />
    </div>
    
    <div class="space-y-1">
      <label class="flex items-center justify-between text-xs">
        <span>Brightness: {{ materialSettings.brightness.toFixed(1) }}</span>
      </label>
      <input 
        type="range" 
        min="0.5" 
        max="2.0" 
        step="0.1" 
        :value="materialSettings.brightness"
        @input="updateSetting('brightness', parseFloat(($event.target as HTMLInputElement).value))"
        class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MaterialSettings } from '@/types/scene'

interface Props {
  materialSettings: MaterialSettings
}

interface Emits {
  (e: 'update', settings: Partial<MaterialSettings>): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const updateSetting = (key: keyof MaterialSettings, value: number) => {
  emit('update', { [key]: value })
}
</script>

<style scoped>
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 12px;
  width: 12px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid #1e40af;
}

.slider::-moz-range-thumb {
  height: 12px;
  width: 12px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid #1e40af;
}
</style>
