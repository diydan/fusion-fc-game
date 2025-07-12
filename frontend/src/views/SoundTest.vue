<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 text-md-h3 font-weight-bold mb-6">Sound System Test</h1>
        <p class="text-body-1 text-medium-emphasis mb-8">
          Test the synthetic sound system
        </p>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>Sound Status</v-card-title>
          <v-card-text>
            <v-alert 
              :type="soundEnabled ? 'success' : 'warning'"
              :text="soundEnabled ? 'Sound is enabled' : 'Sound is disabled'"
              class="mb-4"
            />
            
            <v-row>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="soundEnabled"
                  label="Enable Sounds"
                  color="primary"
                  @update:model-value="handleSoundToggle"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-slider
                  v-model="volume"
                  label="Master Volume"
                  :min="0"
                  :max="100"
                  :disabled="!soundEnabled"
                  thumb-label
                  @update:model-value="handleVolumeChange"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>Test Different Sound Types</v-card-title>
          <v-card-text>
            <div class="d-flex flex-wrap ga-4">
              <GameButton
                v-for="sound in soundTypes"
                :key="sound.name"
                :color="sound.color"
                :label="sound.label"
                :click-sound="sound.name"
                :prepend-icon="sound.icon"
                @sound-played="handleSoundPlayed"
              />
            </div>
            
            <v-divider class="my-4" />
            
            <h4 class="mb-3">Direct Sound Test (Without Button)</h4>
            <div class="d-flex flex-wrap ga-2">
              <v-chip 
                v-for="sound in soundTypes"
                :key="`chip-${sound.name}`"
                :color="sound.color"
                @click="testDirectSound(sound.name)"
                class="cursor-pointer"
              >
                {{ sound.label }}
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>Sound Event Log</v-card-title>
          <v-card-text>
            <v-list dense>
              <v-list-item
                v-for="(event, index) in soundEvents"
                :key="index"
                :title="`${event.type}: ${event.sound}`"
                :subtitle="event.timestamp"
              >
                <template v-slot:prepend>
                  <v-icon :color="event.success ? 'success' : 'error'">
                    {{ event.success ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                  </v-icon>
                </template>
              </v-list-item>
            </v-list>
            <p v-if="soundEvents.length === 0" class="text-center text-medium-emphasis">
              No sounds played yet
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGameSound } from '@/composables/useGameSound'

const {
  soundEnabled: globalSoundEnabled,
  masterVolume,
  playSound,
  toggleSound,
  setMasterVolume,
  preloadSounds
} = useGameSound()

const soundEnabled = ref(globalSoundEnabled.value)
const volume = ref(masterVolume.value * 100)
const soundEvents = ref([])

const soundTypes = [
  { name: 'button-click', label: 'Click', color: 'primary', icon: 'mdi-mouse' },
  { name: 'pop', label: 'Pop', color: 'secondary', icon: 'mdi-balloon' },
  { name: 'coin', label: 'Coin', color: 'warning', icon: 'mdi-cash' },
  { name: 'success', label: 'Success', color: 'success', icon: 'mdi-check' },
  { name: 'error', label: 'Error', color: 'error', icon: 'mdi-alert' },
  { name: 'whoosh', label: 'Whoosh', color: 'info', icon: 'mdi-weather-windy' }
]

const handleSoundToggle = (value) => {
  soundEnabled.value = value
  toggleSound()
  logEvent('toggle', value ? 'enabled' : 'disabled', true)
}

const handleVolumeChange = (value) => {
  setMasterVolume(value / 100)
  logEvent('volume', `${value}%`, true)
}

const handleSoundPlayed = (event) => {
  logEvent('button', event.sound, true)
}

const testDirectSound = async (soundName) => {
  try {
    await playSound(soundName)
    logEvent('direct', soundName, true)
  } catch (error) {
    logEvent('direct', soundName, false, error.message)
  }
}

const logEvent = (type, sound, success = true, error = null) => {
  soundEvents.value.unshift({
    type,
    sound,
    success,
    error,
    timestamp: new Date().toLocaleTimeString()
  })
  
  // Keep only last 10 events
  if (soundEvents.value.length > 10) {
    soundEvents.value.pop()
  }
}

onMounted(() => {
  // Test that sounds are preloaded
  console.log('Preloading sounds...')
  preloadSounds(['button-click', 'pop', 'coin', 'success', 'error', 'whoosh'])
  
  // Check Web Audio API support
  if (window.AudioContext || window.webkitAudioContext) {
    console.log('✅ Web Audio API is supported')
  } else {
    console.warn('❌ Web Audio API is not supported')
  }
})
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>