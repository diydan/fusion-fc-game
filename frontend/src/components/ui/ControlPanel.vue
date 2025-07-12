<template>
  <div class="ui-overlay">
    <h2 class="text-lg font-bold">⚽ Clean Soccer Scene</h2>
    <!-- Loading Status -->
    <div v-if="!isReady" class="text-yellow-400">
      {{ loadingStatus }}
    </div>
    
    <!-- Main Action Buttons -->
    <div v-if="isReady" class="space-y-2">
      <button 
        @click="$emit('triggerStrike')"
        :disabled="isStrikeSequenceActive"
        class="w-full px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white rounded transition-all"
      >
        {{ isStrikeSequenceActive ? '🏃 Strike in Progress...' : '⚽ Trigger Strike Sequence' }}
      </button>
      
      <button 
        @click="$emit('toggleMusic')"
        class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-all"
      >
        {{ isMusicPlaying ? '⏹️ Stop Music' : '▶️ Play Music' }}
      </button>
      
      <button 
        @click="$emit('shootCoin')"
        class="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded transition-all"
      >
        🪙 Shoot Coin
      </button>
      
      <button 
        @click="$emit('triggerDance')"
        class="w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition-all"
      >
        💃 Play Dance Animation
      </button>
      
      <button 
        @click="$emit('resetCharacter')"
        class="w-full px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded transition-all"
      >
        🔄 Reset Character Position
      </button>
      
      <button 
        @click="onAddTorus"
        class="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded transition-all"
      >
        🍩 Add Torus
      </button>
      
      <div v-if="showTorusControls" class="mt-4 p-4 bg-gray-800 rounded-lg">
        <TorusControls @update="onTorusUpdate" />
      </div>
     
    </div>

    <!-- Position Display -->
    <PositionDisplay 
      v-if="isReady"
      :camera-position="cameraPosition"
      :character-position="characterPosition"
      :ball-position="ballPosition"
    />

    <!-- Advanced Controls -->
    <div v-if="isReady" class="space-y-3 border-t border-gray-600 pt-3">
      <h4 class="text-sm font-medium text-blue-300">🎨 Visual Settings</h4>
      
      <!-- Collapsible Section Toggle Buttons -->
      <div class="grid grid-cols-2 gap-0 text-xs">
        <button 
          @click="showPresets = !showPresets"
          class="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          :class="{ 'bg-blue-600': showPresets }"
        >
          {{ showPresets ? '▼' : '▶' }} Presets
        </button>
        <button 
          @click="showLighting = !showLighting"
          class="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          :class="{ 'bg-blue-600': showLighting }"
        >
          {{ showLighting ? '▼' : '▶' }} Lighting
        </button>
        <button 
          @click="showMaterials = !showMaterials"
          class="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          :class="{ 'bg-blue-600': showMaterials }"
        >
          {{ showMaterials ? '▼' : '▶' }} Materials
        </button>
        <button 
          @click="showScene = !showScene"
          class="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          :class="{ 'bg-blue-600': showScene }"
        >
          {{ showScene ? '▼' : '▶' }} Scene
        </button>
        <button 
          @click="showVideo = !showVideo"
          class="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          :class="{ 'bg-blue-600': showVideo }"
        >
          {{ showVideo ? '▼' : '▶' }} Video
        </button>
        <button 
          @click="showCamera = !showCamera"
          class="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          :class="{ 'bg-blue-600': showCamera }"
        >
          {{ showCamera ? '▼' : '▶' }} Camera
        </button>
      </div>
      
      <!-- Presets -->
      <div v-if="showPresets" class="space-y-2">
        <label class="block text-xs text-gray-300">Presets:</label>
        <div class="grid grid-cols-2 gap-1">
          <button 
            v-for="(preset, name) in presets" 
            :key="name"
            @click="$emit('applyPreset', name)"
            class="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            {{ name }}
          </button>
        </div>
      </div>

      <!-- Lighting Controls -->
      <div v-if="showLighting">
        <LightingControls 
          :lighting-settings="lightingSettings"
          @update="$emit('updateLighting', $event)"
        />
      </div>

      <!-- Material Controls -->
      <div v-if="showMaterials">
        <MaterialControls 
          :material-settings="materialSettings"
          @update="$emit('updateMaterial', $event)"
        />
      </div>

      <!-- Scene Controls -->
      <div v-if="showScene" class="space-y-1">
        <label class="flex items-center justify-between text-xs">
          <span>Scene Y Offset: {{ sceneOffsetY.toFixed(2) }}</span>
        </label>
        <input 
          type="range" 
          min="-2" 
          max="2" 
          step="0.01" 
          :value="sceneOffsetY"
          @input="$emit('updateSceneOffset', parseFloat(($event.target as HTMLInputElement).value))"
          class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
        />
      </div>

      <div class="space-y-1">
        <label class="flex items-center justify-between text-xs">
          <span>Character Scale: {{ characterScale.toFixed(3) }}</span>
        </label>
        <input 
          type="range" 
          min="0.005" 
          max="0.02" 
          step="0.0005" 
          :value="characterScale"
          @input="$emit('updateCharacterScale', parseFloat(($event.target as HTMLInputElement).value))"
          class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
        />
      </div>
      
      <label class="flex items-center space-x-2 cursor-pointer">
        <input 
          type="checkbox" 
          :checked="showGrass"
          @change="$emit('toggleGrass', ($event.target as HTMLInputElement).checked)"
          class="w-3 h-3"
        />
        <span class="text-xs">Show Shadow Plane</span>
      </label>

      <label class="flex items-center space-x-2 cursor-pointer">
        <input 
          type="checkbox" 
          :checked="showGrassTexture"
          @change="$emit('toggleGrassTexture', ($event.target as HTMLInputElement).checked)"
          class="w-3 h-3"
        />
        <span class="text-xs">Show Grass Texture</span>
      </label>

      <label class="flex items-center space-x-2 cursor-pointer">
        <input 
          type="checkbox" 
          :checked="showCenterCircle"
          @change="$emit('toggleCenterCircle', ($event.target as HTMLInputElement).checked)"
          class="w-3 h-3"
        />
        <span class="text-xs">Show Center Circle</span>
      </label>

      <label class="flex items-center space-x-2 cursor-pointer">
        <input 
          type="checkbox" 
          :checked="showFieldLines"
          @change="$emit('toggleFieldLines', ($event.target as HTMLInputElement).checked)"
          class="w-3 h-3"
        />
        <span class="text-xs">Show Field Lines</span>
      </label>
      

      <!-- Video Controls -->
      <div v-if="showVideo" class="space-y-2">
        <h4 class="text-xs font-medium text-cyan-300">🎬 Video</h4>
        
        <div class="space-y-1">
          <label class="flex items-center justify-between text-xs">
            <span>Video Y Position: {{ videoOffsetY }}px</span>
          </label>
          <input 
            type="range" 
            min="-200" 
            max="200" 
            step="5" 
            :value="videoOffsetY"
            @input="$emit('updateVideoOffset', parseInt(($event.target as HTMLInputElement).value))"
            class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
          />
        </div>
        
        <div class="space-y-1">
          <label class="flex items-center justify-between text-xs">
            <span>Video Blur: {{ videoBlur }}px</span>
          </label>
          <input 
            type="range" 
            min="0" 
            max="10" 
            step="0.5" 
            :value="videoBlur"
            @input="$emit('updateVideoBlur', parseFloat(($event.target as HTMLInputElement).value))"
            class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
          />
        </div>
      </div>

      <!-- Camera Controls -->
      <div v-if="showCamera" class="space-y-2">
        <h4 class="text-xs font-medium text-purple-300">📷 Camera</h4>
        <div class="space-y-1">
          <label class="flex items-center justify-between text-xs">
            <span>Camera FOV: {{ typeof cameraFov === 'number' ? cameraFov.toFixed(0) : 'N/A' }}°</span>
          </label>
          <input 
            type="range" 
            min="20" 
            max="120" 
            step="1" 
            :value="cameraFov"
            @input="$emit('updateCameraFov', parseFloat(($event.target as HTMLInputElement).value))"
            class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
          />
        </div>

        <div class="space-y-1">
          <label class="flex items-center justify-between text-xs">
            <span>Camera Blur: {{ typeof cameraBlur === 'number' ? cameraBlur.toFixed(1) : 'N/A' }}px</span>
          </label>
          <input 
            type="range" 
            min="0" 
            max="10" 
            step="0.1" 
            :value="cameraBlur"
            @input="$emit('updateCameraBlur', parseFloat(($event.target as HTMLInputElement).value))"
            class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
          />
        </div>

        <label class="flex items-center gap-2 text-xs">
          <input 
            type="checkbox" 
            :checked="bloomEnabled"
            @change="$emit('toggleBloom', ($event.target as HTMLInputElement).checked)"
            class="w-3 h-3"
          />
          <span>Enable Bloom Effect</span>
        </label>

        <div v-if="bloomEnabled" class="space-y-1">
          <label class="flex items-center justify-between text-xs">
            <span>Bloom Intensity: {{ typeof cameraBloom === 'number' ? cameraBloom.toFixed(1) : 'N/A' }}</span>
          </label>
          <input 
            type="range" 
            min="0" 
            max="3" 
            step="0.1" 
            :value="cameraBloom"
            @input="$emit('updateCameraBloom', parseFloat(($event.target as HTMLInputElement).value))"
            class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
          />
        </div>

        <label class="flex items-center gap-2 text-xs">
          <input 
            type="checkbox" 
            :checked="dofEnabled"
            @change="$emit('toggleDof', ($event.target as HTMLInputElement).checked)"
            class="w-3 h-3"
          />
          <span>Enable Depth of Field</span>
        </label>

        <div v-if="dofEnabled" class="space-y-1">
          <label class="flex items-center justify-between text-xs">
            <span>Focus Area Size: {{ typeof dofFocus === 'number' ? dofFocus.toFixed(0) : 'N/A' }}%</span>
          </label>
          <input 
            type="range" 
            min="10" 
            max="80" 
            step="5" 
            :value="dofFocus"
            @input="$emit('updateDofFocus', parseFloat(($event.target as HTMLInputElement).value))"
            class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
          />
        </div>

        <div v-if="dofEnabled" class="space-y-1">
          <label class="flex items-center justify-between text-xs">
            <span>Blur Intensity: {{ typeof dofMaxBlur === 'number' ? dofMaxBlur.toFixed(1) : 'N/A' }}</span>
          </label>
          <input 
            type="range" 
            min="0.5" 
            max="5" 
            step="0.1" 
            :value="dofMaxBlur"
            @input="$emit('updateDofMaxBlur', parseFloat(($event.target as HTMLInputElement).value))"
            class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
          />
        </div>

        <div v-if="dofEnabled" class="space-y-1">
          <label class="flex items-center justify-between text-xs">
            <span>Focus Shape: {{ typeof dofAperture === 'number' ? (dofAperture > 0.5 ? 'Oval' : 'Circle') : 'N/A' }}</span>
          </label>
          <input 
            type="range" 
            min="0.1" 
            max="2" 
            step="0.1" 
            :value="dofAperture"
            @input="$emit('updateDofAperture', parseFloat(($event.target as HTMLInputElement).value))"
            class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
          />
        </div>

        <div v-if="dofEnabled" class="space-y-1">
          <label class="flex items-center justify-between text-xs">
            <span>Focus X Position: {{ typeof dofCenterX === 'number' ? dofCenterX.toFixed(0) : 'N/A' }}%</span>
          </label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            step="5" 
            :value="dofCenterX"
            @input="$emit('updateDofCenterX', parseFloat(($event.target as HTMLInputElement).value))"
            class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
          />
        </div>

        <div v-if="dofEnabled" class="space-y-1">
          <label class="flex items-center justify-between text-xs">
            <span>Focus Y Position: {{ typeof dofCenterY === 'number' ? dofCenterY.toFixed(0) : 'N/A' }}%</span>
          </label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            step="5" 
            :value="dofCenterY"
            @input="$emit('updateDofCenterY', parseFloat(($event.target as HTMLInputElement).value))"
            class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
          />
        </div>

        <!-- Fog Controls -->
        <label class="flex items-center gap-2 text-xs">
          <input 
            type="checkbox" 
            :checked="fogEnabled"
            @change="$emit('toggleFog', ($event.target as HTMLInputElement).checked)"
            class="w-3 h-3"
          />
          <span>Enable Fog</span>
        </label>

        <div v-if="fogEnabled" class="space-y-1">
          <label class="flex items-center justify-between text-xs">
            <span>Fog Type: {{ fogType === 'linear' ? 'Linear' : 'Exponential' }}</span>
          </label>
          <select 
            :value="fogType"
            @change="$emit('updateFogType', ($event.target as HTMLSelectElement).value)"
            class="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded"
          >
            <option value="linear">Linear Fog</option>
            <option value="exponential">Exponential Fog</option>
          </select>
        </div>

        <div v-if="fogEnabled && fogType === 'linear'" class="space-y-1">
          <label class="flex items-center justify-between text-xs">
            <span>Fog Near: {{ typeof fogNear === 'number' ? fogNear.toFixed(0) : 'N/A' }}</span>
          </label>
          <input 
            type="range" 
            min="0.1" 
            max="50" 
            step="0.5" 
            :value="fogNear"
            @input="$emit('updateFogNear', parseFloat(($event.target as HTMLInputElement).value))"
            class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
          />
        </div>

        <div v-if="fogEnabled && fogType === 'linear'" class="space-y-1">
          <label class="flex items-center justify-between text-xs">
            <span>Fog Far: {{ typeof fogFar === 'number' ? fogFar.toFixed(0) : 'N/A' }}</span>
          </label>
          <input 
            type="range" 
            min="10" 
            max="200" 
            step="5" 
            :value="fogFar"
            @input="$emit('updateFogFar', parseFloat(($event.target as HTMLInputElement).value))"
            class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
          />
        </div>

        <div v-if="fogEnabled && fogType === 'exponential'" class="space-y-1">
          <label class="flex items-center justify-between text-xs">
            <span>Fog Density: {{ typeof fogDensity === 'number' ? fogDensity.toFixed(3) : 'N/A' }}</span>
          </label>
          <input 
            type="range" 
            min="0.001" 
            max="0.1" 
            step="0.001" 
            :value="fogDensity"
            @input="$emit('updateFogDensity', parseFloat(($event.target as HTMLInputElement).value))"
            class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
          />
        </div>

        <div v-if="fogEnabled" class="space-y-1">
          <label class="flex items-center justify-between text-xs">
            <span>Fog Color</span>
          </label>
          <div class="flex gap-1">
            <input 
              type="color" 
              :value="fogColor"
              @input="$emit('updateFogColor', ($event.target as HTMLInputElement).value)"
              class="w-full h-6 rounded border border-gray-600"
            />
            <button 
              @click="$emit('updateFogColor', '#87CEEB')"
              class="px-2 py-1 text-xs bg-sky-400 rounded"
              title="Sky Blue"
            >Sky</button>
            <button 
              @click="$emit('updateFogColor', '#696969')"
              class="px-2 py-1 text-xs bg-gray-500 rounded"
              title="Misty Gray"
            >Mist</button>
          </div>
        </div>

        <div v-if="fogEnabled" class="space-y-1">
          <label class="flex items-center justify-between text-xs">
            <span>Fog Intensity: {{ typeof fogOpacity === 'number' ? fogOpacity.toFixed(2) : 'N/A' }}</span>
          </label>
          <input 
            type="range" 
            min="0.1" 
            max="1" 
            step="0.05" 
            :value="fogOpacity"
            @input="$emit('updateFogOpacity', parseFloat(($event.target as HTMLInputElement).value))"
            class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
          />
        </div>
      </div>

      <!-- Settings Export -->
      <div class="space-y-2">
        <h4 class="text-xs font-medium text-orange-300">⚙️ Settings</h4>
        <button 
          @click="$emit('exportSettings')"
          class="w-full px-2 py-1 text-xs bg-orange-600 hover:bg-orange-500 text-white rounded transition-colors"
        >
          Export Settings to Console
        </button>
      </div>
    </div>

    <!-- Current Animation Info -->
    <div v-if="currentAnimation" class="text-xs opacity-75 border-t border-gray-600 pt-2">
      Playing: {{ currentAnimation.name }}<br>
      Duration: {{ currentAnimation.duration?.toFixed(1) }}s
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PositionDisplay from './PositionDisplay.vue'
import LightingControls from './LightingControls.vue'
import MaterialControls from './MaterialControls.vue'
import TorusControls from './TorusControls.vue'
import type { LightingSettings, MaterialSettings, PresetCollection } from '@/types/scene'

interface Props {
  isReady: boolean
  loadingStatus: string
  isStrikeSequenceActive: boolean
  isMusicPlaying: boolean
  cameraPosition: [number, number, number]
  characterPosition: [number, number, number]
  ballPosition: [number, number, number]
  presets: PresetCollection
  lightingSettings: LightingSettings
  materialSettings: MaterialSettings
  sceneOffsetY: number
  characterScale: number
  showGrass: boolean
  showGrassTexture: boolean
  showCenterCircle: boolean
  showFieldLines: boolean
  videoOffsetY: number
  videoBlur: number
  cameraBlur: number
  cameraFov: number
  cameraBloom: number
  bloomEnabled: boolean
  dofEnabled: boolean
  dofFocus: number
  dofAperture: number
  dofMaxBlur: number
  dofCenterX: number
  dofCenterY: number
  fogEnabled: boolean
  fogType: string
  fogNear: number
  fogFar: number
  fogDensity: number
  fogColor: string
  fogOpacity: number
  currentAnimation: { name: string; duration: number } | null
}

interface Emits {
  (e: 'triggerStrike'): void
  (e: 'toggleMusic'): void
  (e: 'shootCoin'): void
  (e: 'addTorus'): void
  (e: 'applyPreset', name: string): void
  (e: 'updateLighting', settings: Partial<LightingSettings>): void
  (e: 'updateMaterial', settings: Partial<MaterialSettings>): void
  (e: 'updateSceneOffset', value: number): void
  (e: 'updateCharacterScale', value: number): void
  (e: 'toggleGrass', value: boolean): void
  (e: 'toggleGrassTexture', value: boolean): void
  (e: 'toggleCenterCircle', value: boolean): void
  (e: 'toggleFieldLines', value: boolean): void
  (e: 'updateVideoOffset', value: number): void
  (e: 'updateVideoBlur', value: number): void
  (e: 'updateCameraBlur', value: number): void
  (e: 'updateCameraFov', value: number): void
  (e: 'updateCameraBloom', value: number): void
  (e: 'toggleBloom', value: boolean): void
  (e: 'toggleDof', value: boolean): void
  (e: 'updateDofFocus', value: number): void
  (e: 'updateDofAperture', value: number): void
  (e: 'updateDofMaxBlur', value: number): void
  (e: 'updateDofCenterX', value: number): void
  (e: 'updateDofCenterY', value: number): void
  (e: 'toggleFog', value: boolean): void
  (e: 'updateFogType', value: string): void
  (e: 'updateFogNear', value: number): void
  (e: 'updateFogFar', value: number): void
  (e: 'updateFogDensity', value: number): void
  (e: 'updateFogColor', value: string): void
  (e: 'updateFogOpacity', value: number): void
  (e: 'exportSettings'): void
  (e: 'triggerDance'): void
  (e: 'updateTorus', settings: { 
    radius: number, 
    tube: number, 
    position: { x: number, y: number, z: number },
    rotation: { x: number, y: number, z: number },
    brightness?: number 
  }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const showTorusControls = ref(false)

// Collapsible section states
const showPresets = ref(false)
const showLighting = ref(false)
const showMaterials = ref(false)
const showScene = ref(false)
const showVideo = ref(false)
const showCamera = ref(false)

const onTorusUpdate = (settings: { 
  radius: number, 
  tube: number, 
  position: { x: number, y: number, z: number },
  rotation: { x: number, y: number, z: number },
  brightness?: number 
}) => {
  // Add default color values if not provided
  const updatedSettings = {
    ...settings,
    color: { r: 0.34, g: 0.84, b: 1 }, // Default cyan color
    emissionColor: { r: 0.34, g: 0.84, b: 1 }, // Default cyan color
    brightness: settings.brightness || 0.5
  }
  emit('updateTorus', updatedSettings)
}

// Show torus controls when torus is added
const onAddTorus = () => {
  showTorusControls.value = true
  emit('addTorus')
}
</script>

<style scoped>
.ui-overlay {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 1rem;
  border-radius: 0.5rem;
  backdrop-filter: blur(10px);
  z-index: 10;
  max-width: 320px;
}

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
