<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 text-md-h3 font-weight-bold mb-6">Game Button Component</h1>
        <p class="text-body-1 text-medium-emphasis mb-8">
          Reusable 3D buttons with built-in sound effects for a gamified experience
        </p>
      </v-col>
    </v-row>

    <!-- Sound Controls -->
    <v-row>
      <v-col cols="12">
        <v-card class="mb-6">
          <v-card-title>Sound Controls</v-card-title>
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" md="6">
                <v-switch
                  v-model="soundEnabled"
                  label="Enable Sound Effects"
                  color="primary"
                  @change="toggleSound"
                ></v-switch>
              </v-col>
              <v-col cols="12" md="6">
                <v-slider
                  v-model="volume"
                  label="Volume"
                  :min="0"
                  :max="100"
                  :disabled="!soundEnabled"
                  thumb-label
                  @update:model-value="updateVolume"
                ></v-slider>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Primary 3D Buttons -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>GameButton Component Examples</v-card-title>
          <v-card-text>
            <h3 class="mb-4">Color Variations with Different Sounds</h3>
            <div class="d-flex flex-wrap ga-4 mb-6">
              <GameButton
                color="primary"
                label="Primary"
                click-sound="button-click"
              />
              <GameButton
                color="secondary"
                label="Secondary"
                click-sound="pop"
              />
              <GameButton
                color="success"
                label="Success"
                click-sound="success"
              />
              <GameButton
                color="error"
                label="Error"
                click-sound="error"
              />
              <GameButton
                color="warning"
                label="Warning"
                click-sound="coin"
              />
              <GameButton
                color="info"
                label="Info"
                click-sound="whoosh"
              />
            </div>

            <h3 class="mb-4">With Icons</h3>
            <div class="d-flex flex-wrap ga-4 mb-6">
              <GameButton
                color="primary"
                prepend-icon="mdi-play"
                label="Play Game"
                click-sound="coin"
              />
              <GameButton
                color="success"
                prepend-icon="mdi-check"
                label="Complete"
                click-sound="success"
              />
              <GameButton
                color="secondary"
                append-icon="mdi-arrow-right"
                label="Continue"
                click-sound="pop"
              />
              <GameButton
                color="info"
                prepend-icon="mdi-download"
                label="Download"
                click-sound="pop"
              />
            </div>

            <h3 class="mb-4">Size Variations</h3>
            <div class="d-flex flex-wrap ga-4 align-center mb-6">
              <v-btn class="v-btn--elevated-3d bg-primary v-btn--size-small">
                Small
              </v-btn>
              <v-btn class="v-btn--elevated-3d bg-primary">
                Default
              </v-btn>
              <v-btn class="v-btn--elevated-3d bg-primary v-btn--size-large">
                Large
              </v-btn>
            </div>

            <h3 class="mb-4">Icon Buttons</h3>
            <div class="d-flex flex-wrap ga-4 mb-6">
              <v-btn class="v-btn--elevated-3d bg-primary v-btn--icon">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
              <v-btn class="v-btn--elevated-3d bg-secondary v-btn--icon">
                <v-icon>mdi-heart</v-icon>
              </v-btn>
              <v-btn class="v-btn--elevated-3d bg-success v-btn--icon">
                <v-icon>mdi-check</v-icon>
              </v-btn>
              <v-btn class="v-btn--elevated-3d bg-error v-btn--icon">
                <v-icon>mdi-close</v-icon>
              </v-btn>
              <v-btn class="v-btn--elevated-3d bg-warning v-btn--icon">
                <v-icon>mdi-star</v-icon>
              </v-btn>
              <v-btn class="v-btn--elevated-3d bg-info v-btn--icon">
                <v-icon>mdi-information</v-icon>
              </v-btn>
            </div>

            <h3 class="mb-4">Gradient & Special Effects</h3>
            <div class="d-flex flex-wrap ga-4 mb-6">
              <v-btn class="v-btn--gradient-3d">
                Gradient Button
              </v-btn>
              <v-btn class="v-btn--fab-3d bg-primary">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
              <v-btn class="v-btn--fab-3d bg-secondary v-btn--size-small">
                <v-icon>mdi-heart</v-icon>
              </v-btn>
              <v-btn class="v-btn--fab-3d bg-success v-btn--size-large">
                <v-icon>mdi-check</v-icon>
              </v-btn>
            </div>

            <h3 class="mb-4">Disabled State</h3>
            <div class="d-flex flex-wrap ga-4 mb-6">
              <v-btn class="v-btn--elevated-3d bg-primary" disabled>
                Disabled
              </v-btn>
              <v-btn class="v-btn--elevated-3d bg-secondary" disabled prepend-icon="mdi-lock">
                Locked
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Regular Vuetify Buttons with Enhanced Hover -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card>
          <v-card-title>Enhanced Regular Buttons</v-card-title>
          <v-card-text>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Regular Vuetify buttons now have subtle hover and active effects
            </p>
            <div class="d-flex flex-wrap ga-4">
              <v-btn color="primary">Primary</v-btn>
              <v-btn color="secondary">Secondary</v-btn>
              <v-btn color="success">Success</v-btn>
              <v-btn variant="outlined" color="primary">Outlined</v-btn>
              <v-btn variant="tonal" color="primary">Tonal</v-btn>
              <v-btn variant="text" color="primary">Text</v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Usage Example -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card>
          <v-card-title>Usage Example</v-card-title>
          <v-card-text>
            <v-alert type="info" class="mb-4">
              To use the 3D buttons, add the class <code>v-btn--elevated-3d</code> along with a background color class like <code>bg-primary</code>
            </v-alert>
            <pre class="pa-4 bg-surface-variant rounded"><code>&lt;v-btn class="v-btn--elevated-3d bg-primary"&gt;
  3D Button
&lt;/v-btn&gt;

&lt;v-btn class="v-btn--elevated-3d bg-success" prepend-icon="mdi-check"&gt;
  With Icon
&lt;/v-btn&gt;

&lt;v-btn class="v-btn--fab-3d bg-secondary"&gt;
  &lt;v-icon&gt;mdi-heart&lt;/v-icon&gt;
&lt;/v-btn&gt;</code></pre>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import GameButton from '@/components/GameButton.vue'
import { useGameSound } from '@/composables/useGameSound'

const { 
  soundEnabled: globalSoundEnabled, 
  masterVolume,
  toggleSound: toggleGlobalSound,
  setMasterVolume,
  preloadSounds
} = useGameSound()

const soundEnabled = ref(globalSoundEnabled.value)
const volume = ref(masterVolume.value * 100)

const toggleSound = () => {
  soundEnabled.value = toggleGlobalSound()
}

const updateVolume = (value) => {
  setMasterVolume(value / 100)
}

onMounted(() => {
  // Preload common button sounds
  preloadSounds(['button-click', 'pop', 'success', 'error', 'coin', 'whoosh'])
})
</script>

<style scoped>
code {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
}

pre code {
  background-color: transparent;
  padding: 0;
  color: #F1F5F9;
}
</style>