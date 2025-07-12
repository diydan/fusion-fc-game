<template>
  <div class="space-y-2">
    <h4 class="text-xs font-medium text-yellow-300">💡 Lighting</h4>
    
    <div class="space-y-1">
      <label class="flex items-center justify-between text-xs">
        <span>Key Light: {{ lightingSettings.keyLightIntensity.toFixed(1) }}</span>
      </label>
      <input 
        type="range" 
        min="0" 
        max="3" 
        step="0.1" 
        :value="lightingSettings.keyLightIntensity"
        @input="updateSetting('keyLightIntensity', parseFloat(($event.target as HTMLInputElement).value))"
        class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
      />
    </div>
    
    <div class="space-y-1">
      <label class="flex items-center justify-between text-xs">
        <span>Fill Light: {{ lightingSettings.fillLightIntensity.toFixed(1) }}</span>
      </label>
      <input 
        type="range" 
        min="0" 
        max="3" 
        step="0.1" 
        :value="lightingSettings.fillLightIntensity"
        @input="updateSetting('fillLightIntensity', parseFloat(($event.target as HTMLInputElement).value))"
        class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
      />
    </div>

    <div class="space-y-1">
      <label class="flex items-center justify-between text-xs">
        <span>Fill Light 2: {{ lightingSettings.fillLight2Intensity.toFixed(1) }}</span>
      </label>
      <input 
        type="range" 
        min="0" 
        max="3" 
        step="0.1" 
        :value="lightingSettings.fillLight2Intensity"
        @input="updateSetting('fillLight2Intensity', parseFloat(($event.target as HTMLInputElement).value))"
        class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
      />
    </div>

    <div class="space-y-1">
      <label class="flex items-center justify-between text-xs">
        <span>Front Light: {{ lightingSettings.frontLightIntensity.toFixed(1) }}</span>
      </label>
      <input 
        type="range" 
        min="0" 
        max="2" 
        step="0.1" 
        :value="lightingSettings.frontLightIntensity"
        @input="updateSetting('frontLightIntensity', parseFloat(($event.target as HTMLInputElement).value))"
        class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
      />
    </div>
    
    <div class="space-y-1">
      <label class="flex items-center justify-between text-xs">
        <span>Rim Light: {{ lightingSettings.rimLightIntensity.toFixed(1) }}</span>
      </label>
      <input 
        type="range" 
        min="0" 
        max="4" 
        step="0.1" 
        :value="lightingSettings.rimLightIntensity"
        @input="updateSetting('rimLightIntensity', parseFloat(($event.target as HTMLInputElement).value))"
        class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
      />
    </div>
    
    <div class="space-y-1">
      <label class="flex items-center justify-between text-xs">
        <span>Ambient: {{ lightingSettings.ambientIntensity.toFixed(1) }}</span>
      </label>
      <input 
        type="range" 
        min="0" 
        max="2" 
        step="0.1" 
        :value="lightingSettings.ambientIntensity"
        @input="updateSetting('ambientIntensity', parseFloat(($event.target as HTMLInputElement).value))"
        class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
      />
    </div>
    
    <label class="flex items-center space-x-2 cursor-pointer">
      <input 
        type="checkbox" 
        :checked="lightingSettings.shadowEnabled"
        @change="updateSetting('shadowEnabled', ($event.target as HTMLInputElement).checked)"
        class="w-3 h-3"
      />
      <span class="text-xs">Shadows</span>
    </label>
  </div>
</template>

<script setup lang="ts">
import type { LightingSettings } from '@/types/scene'

interface Props {
  lightingSettings: LightingSettings
}

interface Emits {
  (e: 'update', settings: Partial<LightingSettings>): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const updateSetting = (key: keyof LightingSettings, value: number | boolean) => {
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
