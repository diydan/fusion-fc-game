<template>
  <div class="character-creator">
    <v-container fluid class="pa-0 fill-height">
      <v-row class="fill-height">
        <!-- 3D Scene -->
        <v-col cols="12" md="8" class="pa-0">
          <div class="scene-container">
            <TresCanvas v-bind="canvasProps">
              <!-- Lighting -->
              <TresAmbientLight :intensity="0.5" />
              <TresDirectionalLight 
                :position="[5, 5, 5]" 
                :intensity="1"
                :cast-shadow="true"
              />
              
              <!-- Camera -->
              <TresPerspectiveCamera
                :position="[0, 2, 5]"
                :fov="45"
                :look-at="[0, 0, 0]"
              />
              
              <!-- Character Model (Placeholder) -->
              <TresMesh :position="[0, 0, 0]">
                <TresCapsuleGeometry :args="[0.5, 1.5, 8, 16]" />
                <TresMeshStandardMaterial :color="characterColor" />
              </TresMesh>
              
              <!-- Ground -->
              <TresMesh :position="[0, -1.5, 0]" :rotation="[-Math.PI / 2, 0, 0]">
                <TresPlaneGeometry :args="[10, 10]" />
                <TresMeshStandardMaterial color="#1a1a1a" />
              </TresMesh>
              
              <!-- OrbitControls -->
              <OrbitControls />
            </TresCanvas>
          </div>
        </v-col>
        
        <!-- Control Panel -->
        <v-col cols="12" md="4" class="control-panel">
          <v-card flat class="pa-4 ma-2" color="surface">
            <v-card-title class="text-h5 mb-4">
              <v-icon class="mr-2">mdi-robot</v-icon>
              Character Creator
            </v-card-title>
            
            <v-card-text>
              <!-- Basic Settings -->
              <div class="mb-6">
                <h3 class="text-h6 mb-3">Basic Settings</h3>
                
                <v-text-field
                  v-model="characterName"
                  label="Character Name"
                  prepend-icon="mdi-account"
                  variant="outlined"
                  density="compact"
                  class="mb-3"
                />
                
                <v-select
                  v-model="characterType"
                  :items="characterTypes"
                  label="Character Type"
                  prepend-icon="mdi-shape"
                  variant="outlined"
                  density="compact"
                  class="mb-3"
                />
              </div>
              
              <!-- Appearance -->
              <div class="mb-6">
                <h3 class="text-h6 mb-3">Appearance</h3>
                
                <v-color-picker
                  v-model="characterColor"
                  mode="hex"
                  :modes="['hex', 'rgb']"
                  hide-inputs
                  class="mb-3"
                />
                
                <v-slider
                  v-model="characterScale"
                  label="Size"
                  :min="0.5"
                  :max="2"
                  :step="0.1"
                  thumb-label
                  prepend-icon="mdi-resize"
                  class="mb-3"
                />
              </div>
              
              <!-- Animation Controls -->
              <div class="mb-6">
                <h3 class="text-h6 mb-3">Animation</h3>
                
                <v-switch
                  v-model="autoRotate"
                  label="Auto Rotate"
                  color="primary"
                  class="mb-3"
                />
                
                <v-slider
                  v-model="rotationSpeed"
                  :disabled="!autoRotate"
                  label="Rotation Speed"
                  :min="0.1"
                  :max="5"
                  :step="0.1"
                  thumb-label
                  prepend-icon="mdi-rotate-3d-variant"
                />
              </div>
              
              <!-- Actions -->
              <v-divider class="mb-4" />
              
              <v-btn
                color="primary"
                block
                size="large"
                @click="saveCharacter"
                :loading="saving"
              >
                <v-icon left>mdi-content-save</v-icon>
                Save Character
              </v-btn>
              
              <v-btn
                variant="outlined"
                block
                size="large"
                class="mt-2"
                @click="resetCharacter"
              >
                <v-icon left>mdi-refresh</v-icon>
                Reset
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'

// Canvas configuration
const canvasProps = {
  clearColor: '#000000',
  shadows: true,
  alpha: false,
  windowSize: true,
}

// Character properties
const characterName = ref('Robot Player')
const characterType = ref('Striker')
const characterColor = ref('#3366FF')
const characterScale = ref(1)
const autoRotate = ref(true)
const rotationSpeed = ref(1)
const saving = ref(false)

// Character type options
const characterTypes = [
  'Striker',
  'Midfielder',
  'Defender',
  'Goalkeeper',
  'All-Rounder'
]

// Watch for auto-rotate changes
watch(autoRotate, (newValue) => {
  if (newValue) {
    startRotation()
  } else {
    stopRotation()
  }
})

// Animation frame
let animationId = null

const startRotation = () => {
  // Implementation for rotation animation
  // This would be connected to the 3D model rotation
}

const stopRotation = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

// Save character
const saveCharacter = async () => {
  saving.value = true
  
  // Simulate saving
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  const characterData = {
    name: characterName.value,
    type: characterType.value,
    color: characterColor.value,
    scale: characterScale.value,
    timestamp: new Date().toISOString()
  }
  
  console.log('Saving character:', characterData)
  
  // Here you would typically save to your backend or local storage
  localStorage.setItem('savedCharacter', JSON.stringify(characterData))
  
  saving.value = false
}

// Reset character to defaults
const resetCharacter = () => {
  characterName.value = 'Robot Player'
  characterType.value = 'Striker'
  characterColor.value = '#3366FF'
  characterScale.value = 1
  autoRotate.value = true
  rotationSpeed.value = 1
}
</script>

<style scoped>
.character-creator {
  height: calc(100vh - 64px);
  background: #0a0a0a;
}

.scene-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0a 100%);
}

.control-panel {
  background: rgba(9, 9, 121, 0.1);
  backdrop-filter: blur(10px);
  overflow-y: auto;
  max-height: calc(100vh - 64px);
}

.control-panel::-webkit-scrollbar {
  width: 8px;
}

.control-panel::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.control-panel::-webkit-scrollbar-thumb {
  background: rgba(51, 102, 255, 0.5);
  border-radius: 4px;
}

.control-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(51, 102, 255, 0.7);
}

@media (max-width: 959px) {
  .character-creator {
    height: calc(100vh - 120px);
  }
  
  .scene-container {
    height: 50vh;
  }
  
  .control-panel {
    max-height: 50vh;
  }
}
</style>