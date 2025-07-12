<template>
  <div class="select-bot-page">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">
        <v-icon class="mr-2">mdi-robot</v-icon>
        Bot Selection Center
      </h1>
      <p class="page-subtitle">Choose and customize your robot players</p>
    </div>

    <!-- Main Content -->
    <v-container fluid>
      <v-row>
        <!-- Bot Selection Grid -->
        <v-col cols="12" lg="8">
          <v-card class="pa-4">
            <v-card-title>
              <v-icon class="mr-2">mdi-robot-outline</v-icon>
              Available Bots
            </v-card-title>
            
            <v-card-text>
              <!-- Filter Controls -->
              <v-row class="mb-4">
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="searchQuery"
                    prepend-inner-icon="mdi-magnify"
                    label="Search bots..."
                    variant="outlined"
                    density="compact"
                    clearable
                    hide-details
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="selectedType"
                    :items="botTypes"
                    label="Bot Type"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </v-col>
              </v-row>

              <!-- Bot Grid -->
              <v-row>
                <v-col
                  v-for="bot in filteredBots"
                  :key="bot.id"
                  cols="12"
                  sm="6"
                  md="4"
                >
                  <bot-card
                    :bot="bot"
                    :selected="selectedBot?.id === bot.id"
                    @select="selectBot(bot)"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Bot Preview and Details -->
        <v-col cols="12" lg="4">
          <v-card class="sticky-preview">
            <v-card-title>
              <v-icon class="mr-2">mdi-eye</v-icon>
              Bot Preview
            </v-card-title>
            
            <v-card-text>
              <div class="bot-preview-container">
                <v-img
                  v-if="selectedBot"
                  :src="selectedBot.model"
                  height="300"
                  contain
                  class="bot-preview-image"
                >
                  <template v-slot:placeholder>
                    <v-row
                      class="fill-height ma-0"
                      align="center"
                      justify="center"
                    >
                      <v-progress-circular
                        indeterminate
                        color="primary"
                      ></v-progress-circular>
                    </v-row>
                  </template>
                </v-img>
                <div v-else class="preview-placeholder">
                  <v-icon size="100" color="grey">mdi-robot</v-icon>
                  <p class="text-h6 mt-4">Select a bot to preview</p>
                </div>
              </div>

              <!-- Bot Details -->
              <div v-if="selectedBot" class="bot-details mt-4">
                <h3 class="text-h5 mb-2">{{ selectedBot.name }}</h3>
                <v-chip color="primary" size="small" class="mb-3">
                  {{ selectedBot.type }}
                </v-chip>

                <div class="bot-stats">
                  <h4 class="text-subtitle-2 mb-2">Stats</h4>
                  <div v-for="stat in selectedBot.stats" :key="stat.name" class="stat-item mb-2">
                    <div class="d-flex justify-space-between align-center mb-1">
                      <span class="stat-label">{{ stat.name }}</span>
                      <span class="stat-value">{{ stat.value }}</span>
                    </div>
                    <v-progress-linear
                      :model-value="stat.value"
                      :color="stat.color"
                      height="20"
                      rounded
                    />
                  </div>
                </div>

                <!-- Actions -->
                <div class="mt-4">
                  <v-btn
                    color="primary"
                    block
                    size="large"
                    @click="customizeBot"
                  >
                    <v-icon left>mdi-palette</v-icon>
                    Customize Bot
                  </v-btn>
                  <v-btn
                    color="success"
                    block
                    size="large"
                    class="mt-2"
                    @click="assignToTeam"
                  >
                    <v-icon left>mdi-account-plus</v-icon>
                    Assign to Team
                  </v-btn>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Bot Collection Stats -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-card>
            <v-card-title>
              <v-icon class="mr-2">mdi-chart-box</v-icon>
              Your Bot Collection
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="6" md="3">
                  <div class="text-center">
                    <div class="text-h3 font-weight-bold primary--text">{{ userBots.length }}</div>
                    <div class="text-subtitle-2">Total Bots</div>
                  </div>
                </v-col>
                <v-col cols="6" md="3">
                  <div class="text-center">
                    <div class="text-h3 font-weight-bold success--text">{{ assignedBots }}</div>
                    <div class="text-subtitle-2">Assigned</div>
                  </div>
                </v-col>
                <v-col cols="6" md="3">
                  <div class="text-center">
                    <div class="text-h3 font-weight-bold warning--text">{{ customizedBots }}</div>
                    <div class="text-subtitle-2">Customized</div>
                  </div>
                </v-col>
                <v-col cols="6" md="3">
                  <div class="text-center">
                    <div class="text-h3 font-weight-bold info--text">{{ availableBots.length }}</div>
                    <div class="text-subtitle-2">Available</div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Customization Dialog -->
    <v-dialog v-model="showCustomizeDialog" max-width="600">
      <v-card>
        <v-card-title>Customize {{ selectedBot?.name }}</v-card-title>
        <v-card-text>
          <v-color-picker
            v-model="customColor"
            mode="hex"
            :modes="['hex', 'rgb']"
            class="ma-auto"
          />
          <v-text-field
            v-model="customName"
            label="Custom Name"
            variant="outlined"
            class="mt-4"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showCustomizeDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveCustomization">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BotCard from '@/components/bots/BotCard.vue'

const router = useRouter()

// State
const selectedBot = ref(null)
const searchQuery = ref('')
const selectedType = ref('All')
const showCustomizeDialog = ref(false)
const customColor = ref('#3366FF')
const customName = ref('')
const userBots = ref([])

// Bot types
const botTypes = ['All', 'Offensive', 'Defensive', 'Balanced', 'Special']

// Available bots data
const availableBots = ref([
  {
    id: 'bot1',
    name: 'Striker Bot',
    type: 'Offensive',
    model: '/assets/bots/bot1_original.png',
    texture: '/assets/bots/bot1_shorts.png',
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
    texture: '/assets/bots/bot2-head.png',
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
    texture: '/assets/bots/bot1_original.png',
    stats: [
      { name: 'Speed', value: 80, color: 'blue' },
      { name: 'Power', value: 80, color: 'red' },
      { name: 'Control', value: 85, color: 'green' },
      { name: 'Defense', value: 75, color: 'orange' }
    ]
  },
  {
    id: 'bot4',
    name: 'Speed Demon',
    type: 'Offensive',
    model: '/assets/bots/bot2.jpg',
    stats: [
      { name: 'Speed', value: 95, color: 'blue' },
      { name: 'Power', value: 70, color: 'red' },
      { name: 'Control', value: 80, color: 'green' },
      { name: 'Defense', value: 50, color: 'orange' }
    ]
  },
  {
    id: 'bot5',
    name: 'Tank Destroyer',
    type: 'Defensive',
    model: '/assets/bots/bot1_shorts.png',
    stats: [
      { name: 'Speed', value: 60, color: 'blue' },
      { name: 'Power', value: 95, color: 'red' },
      { name: 'Control', value: 70, color: 'green' },
      { name: 'Defense', value: 90, color: 'orange' }
    ]
  },
  {
    id: 'bot6',
    name: 'Trickster',
    type: 'Special',
    model: '/assets/bots/bot2-head.png',
    stats: [
      { name: 'Speed', value: 85, color: 'blue' },
      { name: 'Power', value: 65, color: 'red' },
      { name: 'Control', value: 95, color: 'green' },
      { name: 'Defense', value: 55, color: 'orange' }
    ]
  }
])

// Computed
const filteredBots = computed(() => {
  let filtered = availableBots.value
  
  if (searchQuery.value) {
    filtered = filtered.filter(bot => 
      bot.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  
  if (selectedType.value && selectedType.value !== 'All') {
    filtered = filtered.filter(bot => bot.type === selectedType.value)
  }
  
  return filtered
})

const assignedBots = computed(() => {
  return userBots.value.filter(bot => bot.assigned).length
})

const customizedBots = computed(() => {
  return userBots.value.filter(bot => bot.customized).length
})

// Methods
const selectBot = (bot) => {
  selectedBot.value = bot
}

const customizeBot = () => {
  if (selectedBot.value) {
    customName.value = selectedBot.value.name
    customColor.value = '#3366FF'
    showCustomizeDialog.value = true
  }
}

const saveCustomization = () => {
  // Save customization logic
  console.log('Saving customization:', {
    bot: selectedBot.value,
    name: customName.value,
    color: customColor.value
  })
  showCustomizeDialog.value = false
}

const assignToTeam = () => {
  if (selectedBot.value) {
    // Navigate to team management with selected bot
    router.push({
      name: 'my-team',
      query: { assignBot: selectedBot.value.id }
    })
  }
}
</script>

<style scoped>
.select-bot-page {
  min-height: calc(100vh - 64px);
  background: #0a0a0a;
}

.page-header {
  text-align: center;
  padding: 2rem 0;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.page-title {
  font-size: 2.5rem;
  font-weight: bold;
  background: linear-gradient(45deg, #3366ff, #66a3ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.5rem;
}

.sticky-preview {
  position: sticky;
  top: 80px;
}

.bot-preview-container {
  width: 100%;
  height: 300px;
  background: radial-gradient(ellipse at center, #0f3460 0%, #16213e 100%);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bot-preview-image {
  background: transparent;
}

.preview-placeholder {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
}

.bot-details {
  text-align: left;
}

.bot-stats {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
}

.stat-item {
  margin-bottom: 12px;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.8;
}

.stat-value {
  font-weight: bold;
  color: #ffd700;
}

:deep(.v-progress-linear) {
  background: rgba(255, 255, 255, 0.1);
}
</style>