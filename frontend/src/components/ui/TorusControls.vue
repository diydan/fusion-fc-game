<template>
  <div class="torus-controls">
    <h3>🍩 Torus Controls</h3>
    
    <!-- Color Picker -->
    <div class="control-group">
      <label>Torus Color</label>
      <div class="color-picker">
        <input 
          type="color" 
          v-model="torusColor" 
          @input="updateTorusColor"
          class="color-input"
        />
        <span class="color-value">{{ torusColor }}</span>
      </div>
    </div>

    <!-- Existing controls -->
    <div class="control-group">
      <label>Radius: {{ radius.toFixed(2) }}</label>
      <input 
        type="range" 
        v-model="radius" 
        min="0.1" 
        max="2" 
        step="0.1"
        @input="updateTorusSettings"
      />
    </div>
    
    <div class="control-group">
      <label>Tube: {{ tube.toFixed(2) }}</label>
      <input 
        type="range" 
        v-model="tube" 
        min="0.05" 
        max="0.5" 
        step="0.05"
        @input="updateTorusSettings"
      />
    </div>
    
    <div class="control-group">
      <label>Position X: {{ position.x.toFixed(2) }}</label>
      <input 
        type="range" 
        v-model="position.x" 
        min="-5" 
        max="5" 
        step="0.1"
        @input="updateTorusSettings"
      />
    </div>
    
    <div class="control-group">
      <label>Position Y: {{ position.y.toFixed(2) }}</label>
      <input 
        type="range" 
        v-model="position.y" 
        min="-5" 
        max="5" 
        step="0.1"
        @input="updateTorusSettings"
      />
    </div>
    
    <div class="control-group">
      <label>Position Z: {{ position.z.toFixed(2) }}</label>
      <input 
        type="range" 
        v-model="position.z" 
        min="0" 
        max="20" 
        step="0.1"
        @input="updateTorusSettings"
      />
    </div>
    
    <div class="control-group">
      <label>Rotation X: {{ rotation.x.toFixed(1) }}°</label>
      <input 
        type="range" 
        v-model="rotation.x" 
        min="-180" 
        max="180" 
        step="1"
        @input="updateTorusSettings"
      />
    </div>
    
    <div class="control-group">
      <label>Rotation Y: {{ rotation.y.toFixed(1) }}°</label>
      <input 
        type="range" 
        v-model="rotation.y" 
        min="-180" 
        max="180" 
        step="1"
        @input="updateTorusSettings"
      />
    </div>
    
    <div class="control-group">
      <label>Rotation Z: {{ rotation.z.toFixed(1) }}°</label>
      <input 
        type="range" 
        v-model="rotation.z" 
        min="-180" 
        max="180" 
        step="1"
        @input="updateTorusSettings"
      />
    </div>
    
    <div class="control-group">
      <label>Brightness: {{ brightness.toFixed(2) }}</label>
      <input 
        type="range" 
        v-model="brightness" 
        min="0" 
        max="2" 
        step="0.1"
        @input="updateTorusSettings"
      />
    </div>
    <button @click="addTorus" class="add-torus-btn">🍩 Add Torus</button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import * as THREE from 'three'

const props = defineProps<{
  initialSettings?: {
    radius?: number
    tube?: number
    position?: { x: number; y: number; z: number }
    rotation?: { x: number; y: number; z: number }
    brightness?: number
    color?: string
  }
}>()

const emit = defineEmits<{
  (e: 'update', settings: {
    radius: number
    tube: number
    position: { x: number; y: number; z: number }
    rotation: { x: number; y: number; z: number }
    brightness: number
    color: THREE.Color
  }): void
}>()

// Initialize with default values or props
const radius = ref(props.initialSettings?.radius ?? 0.6)
const tube = ref(props.initialSettings?.tube ?? 0.1)
const position = ref(props.initialSettings?.position ?? { x: 0, y: -2, z: 10 })
const rotation = ref(props.initialSettings?.rotation ?? { x: 0, y: 0, z: 0 })
const brightness = ref(props.initialSettings?.brightness ?? 0.5)
const torusColor = ref(props.initialSettings?.color ?? '#ff0000')

const updateTorusSettings = () => {
  emit('update', {
    radius: radius.value,
    tube: tube.value,
    position: { ...position.value },
    rotation: { ...rotation.value },
    brightness: brightness.value,
    color: new THREE.Color(torusColor.value)
  })
}

const updateTorusColor = () => {
  updateTorusSettings()
}

// Watch for prop changes
watch(() => props.initialSettings, (newSettings) => {
  if (newSettings) {
    radius.value = newSettings.radius ?? radius.value
    tube.value = newSettings.tube ?? tube.value
    position.value = newSettings.position ?? position.value
    rotation.value = newSettings.rotation ?? rotation.value
    brightness.value = newSettings.brightness ?? brightness.value
    torusColor.value = newSettings.color ?? torusColor.value
  }
}, { deep: true })

const addTorus = () => {
  console.log('addTorus', torusColor.value)
  emit('update', {
    radius: radius.value,
    tube: tube.value,
    position: position.value,
    rotation: rotation.value,
    brightness: brightness.value,
    color: new THREE.Color(torusColor.value)
  })
}
</script>

<style scoped>
.torus-controls {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  padding: 20px;
  border-radius: 10px;
  color: white;
  font-family: Arial, sans-serif;
  z-index: 1000;
  max-width: 300px;
  max-height: 90vh;
  overflow-y: auto;
}

.control-group {
  margin-bottom: 15px;
  padding: 5px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
}

.control-group label {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
  color: #4CAF50;
}

.control-group input[type="range"] {
  width: 100%;
  margin: 5px 0;
  background: #333;
  height: 5px;
  border-radius: 5px;
  outline: none;
  -webkit-appearance: none;
}

.control-group input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 15px;
  height: 15px;
  background: #4CAF50;
  border-radius: 50%;
  cursor: pointer;
}

.add-torus-btn {
  width: 100%;
  padding: 10px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 10px;
}

.add-torus-btn:hover {
  background: #45a049;
}

h3 {
  margin: 0 0 20px 0;
  text-align: center;
  color: #4CAF50;
  font-size: 18px;
  font-weight: bold;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.color-input {
  width: 50px;
  height: 30px;
  padding: 0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.color-value {
  font-family: monospace;
  font-size: 0.9rem;
  color: #ccc;
}
</style> 