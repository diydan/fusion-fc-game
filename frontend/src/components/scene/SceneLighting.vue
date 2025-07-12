<template>
  <!-- Key Light - Main shadow casting light -->
  <TresDirectionalLight 
    :position="[9, 10, 18]" 
    :intensity="lightingSettings.keyLightIntensity"
    :cast-shadow="lightingSettings.shadowEnabled"
    color="#ffffff"
    :shadow-camera-near="0.1"
    :shadow-camera-far="50"
    :shadow-camera-left="-20"
    :shadow-camera-right="20"
    :shadow-camera-top="20"
    :shadow-camera-bottom="-20"
    :shadow-mapSize-width="2048"
    :shadow-mapSize-height="2048"
    :shadow-bias="-0.0005"
    :shadow-radius="2"
    :shadow-blurSamples="15"
  />

  <!-- Fill Light -->
  <TresDirectionalLight 
    :position="[0, 5, 10]" 
    :intensity="lightingSettings.fillLight2Intensity"
    :cast-shadow="false"
    color="#e0e0ff"
  />
  
  <!-- Ambient Light -->
  <TresAmbientLight 
    :intensity="lightingSettings.ambientIntensity * 1.0" 
    color="#f0f0f0"
  />
</template>

<script setup lang="ts">
import type { LightingSettings } from '@/types/scene'

interface Props {
  lightingSettings: LightingSettings
}

defineProps<Props>()
</script>
