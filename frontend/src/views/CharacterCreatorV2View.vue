<template>
  <div class="select-bot-view">
    <!-- 3D Scene -->
    <CharacterCreatorV2Scene 
      ref="sceneRef"
      :hide-player-selection="false"
      @scene-ready="onSceneReady"
    />

    <!-- Minimal UI Overlay -->
    <div class="ui-overlay">
      <!-- Back Button -->
      <v-btn
        icon
        class="back-button"
        @click="$router.back()"
      >
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import CharacterCreatorV2Scene from '@/components/CharacterCreatorV2Scene.vue'

const router = useRouter()
const sceneRef = ref()

const onSceneReady = () => {
  console.log('3D Scene is ready!')
}
</script>

<style scoped>
.select-bot-view {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #000;
}

.ui-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.header-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  padding: 16px 24px;
  pointer-events: auto;
}

.page-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  margin: 0;
}

.bot-panel {
  pointer-events: auto;
  background: rgba(33, 33, 33, 0.95) !important;
  backdrop-filter: blur(10px);
}

.fab-button {
  position: absolute;
  bottom: 24px;
  right: 24px;
  pointer-events: auto;
}

.back-button {
  position: absolute;
  top: 16px;
  left: 16px;
  pointer-events: auto;
  background: rgba(0, 0, 0, 0.5);
}

@media (max-width: 600px) {
  .header-bar {
    padding: 12px 16px;
  }
  
  .page-title {
    font-size: 1.2rem;
  }
}
</style>
