<template>
  <div class="select-bot-view">
    <!-- 3D Scene -->
    <SelectBotScene 
      ref="sceneRef"
      :hide-player-selection="false"
      @scene-ready="onSceneReady"
    />

    <!-- UI Overlay -->
    <div class="ui-overlay">
      <!-- Header -->
      <div class="header-bar">
        <h1 class="page-title">
          <v-icon class="mr-2">mdi-robot</v-icon>
          Bot Selection Center
        </h1>
      </div>

      <!-- Bot Selection Panel -->
      <v-navigation-drawer
        v-model="showBotPanel"
        location="right"
        temporary
        width="400"
        class="bot-panel"
      >
        <v-card flat height="100%">
          <v-card-title>
            <v-icon class="mr-2">mdi-robot-outline</v-icon>
            Available Bots
          </v-card-title>
          
          <v-card-text>
            <!-- Search -->
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              label="Search bots..."
              variant="outlined"
              density="compact"
              clearable
              hide-details
              class="mb-4"
            />

            <!-- Bot List -->
            <v-list>
              <v-list-item
                v-for="bot in filteredBots"
                :key="bot.id"
                @click="selectBot(bot)"
                :active="selectedBot?.id === bot.id"
              >
                <template v-slot:prepend>
                  <v-avatar>
                    <v-img :src="bot.model" />
                  </v-avatar>
                </template>
                
                <v-list-item-title>{{ bot.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ bot.type }}</v-list-item-subtitle>
                
                <template v-slot:append>
                  <v-chip size="small" :color="bot.type === 'Offensive' ? 'red' : bot.type === 'Defensive' ? 'blue' : 'green'">
                    {{ bot.stats[0].value }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-navigation-drawer>

      <!-- Floating Action Button -->
      <v-btn
        fab
        color="primary"
        class="fab-button"
        @click="showBotPanel = !showBotPanel"
      >
        <v-icon>mdi-robot</v-icon>
      </v-btn>

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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import SelectBotScene from '@/components/SelectBotScene.vue'

const router = useRouter()
const sceneRef = ref()

// State
const showBotPanel = ref(false)
const selectedBot = ref(null)
const searchQuery = ref('')

// Available bots data
const availableBots = ref([
  {
    id: 'bot1',
    name: 'Striker Bot',
    type: 'Offensive',
    model: '/assets/bots/bot1_original.png',
    modelPath: '/bot1/bot1.fbx',
    stats: [
      { name: 'Speed', value: 85, color: 'blue' },
      { name: 'Power', value: 90, color: 'red' },
      { name: 'Control', value: 75, color: 'green' },
      { name: 'Defense', value: 60, color: 'orange' }
    ]
  },
  {
    id: 'bot2',
    name: 'Guardian Bot',
    type: 'Defensive',
    model: '/assets/bots/bot2.jpg',
    modelPath: '/bot1/bot2-head.fbx',
    stats: [
      { name: 'Speed', value: 70, color: 'blue' },
      { name: 'Power', value: 75, color: 'red' },
      { name: 'Control', value: 80, color: 'green' },
      { name: 'Defense', value: 95, color: 'orange' }
    ]
  },
  {
    id: 'bot3',
    name: 'Midfield Maestro',
    type: 'Balanced',
    model: '/assets/bots/bot1_original.png',
    modelPath: '/bot1/offensive idle.fbx',
    stats: [
      { name: 'Speed', value: 80, color: 'blue' },
      { name: 'Power', value: 80, color: 'red' },
      { name: 'Control', value: 85, color: 'green' },
      { name: 'Defense', value: 75, color: 'orange' }
    ]
  }
])

// Computed
const filteredBots = computed(() => {
  if (!searchQuery.value) return availableBots.value
  
  return availableBots.value.filter(bot => 
    bot.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// Methods
const selectBot = (bot) => {
  selectedBot.value = bot
  // Load the bot model in the 3D scene
  if (sceneRef.value && bot.modelPath) {
    // The SelectBotScene will handle loading the model
    console.log('Selected bot:', bot.name)
  }
}

const onSceneReady = () => {
  console.log('3D Scene is ready!')
  // Select first bot by default
  if (availableBots.value.length > 0) {
    selectBot(availableBots.value[0])
  }
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