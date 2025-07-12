<template>
  <v-dialog v-model="dialog" max-width="1200px" persistent>
    <v-card class="bot-selection-modal">
      <v-card-title class="text-h4 font-weight-bold text-center pa-6">
        <v-icon left size="x-large" color="primary">mdi-robot</v-icon>
        Select Your Bot
      </v-card-title>

      <v-card-text>
        <v-container>
          <v-row>
            <!-- Bot Preview Section -->
            <v-col cols="12" md="6">
              <div class="bot-preview-container">
                <div class="preview-3d">
                  <v-img
                    v-if="selectedBot"
                    :src="selectedBot.model"
                    height="400"
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
                <div v-if="selectedBot" class="bot-info mt-4">
                  <h3 class="text-h5">{{ selectedBot.name }}</h3>
                  <p class="text-subtitle-1">{{ selectedBot.type }}</p>
                  <div class="bot-stats mt-3">
                    <v-row dense>
                      <v-col cols="6" v-for="stat in selectedBot.stats" :key="stat.name">
                        <div class="stat-item">
                          <span class="stat-label">{{ stat.name }}</span>
                          <v-progress-linear 
                            :model-value="stat.value" 
                            :color="stat.color"
                            height="20"
                            rounded
                          >
                            <template v-slot:default>
                              {{ stat.value }}%
                            </template>
                          </v-progress-linear>
                        </div>
                      </v-col>
                    </v-row>
                  </div>
                </div>
              </div>
            </v-col>

            <!-- Bot Selection Grid -->
            <v-col cols="12" md="6">
              <v-container fluid>
                <v-row>
                  <v-col
                    v-for="bot in availableBots"
                    :key="bot.id"
                    cols="6"
                    sm="4"
                  >
                    <bot-card
                      :bot="bot"
                      :selected="selectedBot?.id === bot.id"
                      @select="selectBot(bot)"
                    />
                  </v-col>
                </v-row>
              </v-container>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions class="pa-6">
        <v-spacer></v-spacer>
        <v-btn
          variant="outlined"
          size="large"
          @click="cancel"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          size="large"
          :disabled="!selectedBot"
          @click="confirm"
        >
          <v-icon left>mdi-check</v-icon>
          Confirm Selection
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import BotCard from './BotCard.vue'

const props = defineProps({
  modelValue: Boolean,
  player: Object
})

const emit = defineEmits(['update:modelValue', 'select'])

const dialog = ref(props.modelValue)
const selectedBot = ref(null)

// Available bots data
const availableBots = ref([
  {
    id: 'bot1',
    name: 'Striker Bot',
    type: 'Offensive',
    model: '/assets/bots/bot1_original.png',
    texture: '/assets/bots/bot1_shorts.png',
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
    texture: '/assets/bots/bot2-head.png',
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
    texture: '/assets/bots/bot1_original.png',
    stats: [
      { name: 'Speed', value: 80, color: 'blue' },
      { name: 'Power', value: 80, color: 'red' },
      { name: 'Control', value: 85, color: 'green' },
      { name: 'Defense', value: 75, color: 'orange' }
    ]
  }
])


// Handle bot selection
const selectBot = (bot) => {
  selectedBot.value = bot
}

// Handle dialog actions
const cancel = () => {
  dialog.value = false
  emit('update:modelValue', false)
}

const confirm = () => {
  if (selectedBot.value) {
    emit('select', selectedBot.value)
    dialog.value = false
    emit('update:modelValue', false)
  }
}

// Watchers
watch(() => props.modelValue, (newVal) => {
  dialog.value = newVal
  if (newVal && availableBots.value.length > 0) {
    selectBot(availableBots.value[0])
  }
})

watch(dialog, (newVal) => {
  emit('update:modelValue', newVal)
})

</script>

<style scoped>
.bot-selection-modal {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
}

.bot-preview-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.preview-3d {
  width: 100%;
  height: 400px;
  background: radial-gradient(ellipse at center, #0f3460 0%, #16213e 100%);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
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

.bot-info {
  text-align: center;
}

.bot-stats {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
}

.stat-item {
  margin-bottom: 8px;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.8;
  display: block;
  margin-bottom: 4px;
}

:deep(.v-progress-linear) {
  font-weight: bold;
}
</style>