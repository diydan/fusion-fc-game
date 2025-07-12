<template>
  <v-card
    :class="['bot-card', { 'selected': selected }]"
    :elevation="selected ? 12 : 4"
    @click="$emit('select')"
    rounded="lg"
  >
    <v-img
      :src="bot.model"
      height="150"
      cover
      class="bot-image"
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
      
      <div class="bot-overlay">
        <v-chip
          v-if="selected"
          color="primary"
          class="selected-chip"
          prepend-icon="mdi-check-circle"
        >
          Selected
        </v-chip>
      </div>
    </v-img>

    <v-card-text class="text-center pa-3">
      <h4 class="text-h6 mb-1">{{ bot.name }}</h4>
      <p class="text-caption text-medium-emphasis mb-2">{{ bot.type }}</p>
      
      <div class="mini-stats">
        <v-row dense no-gutters>
          <v-col 
            v-for="(stat, index) in bot.stats.slice(0, 2)" 
            :key="index"
            cols="6"
          >
            <div class="stat-mini">
              <span class="stat-value">{{ stat.value }}</span>
              <span class="stat-name">{{ stat.name.substring(0, 3) }}</span>
            </div>
          </v-col>
        </v-row>
      </div>
    </v-card-text>

    <v-card-actions class="pa-0">
      <v-btn
        variant="flat"
        color="primary"
        block
        :text="selected ? 'Selected' : 'Select'"
        :disabled="selected"
        @click.stop="$emit('select')"
      />
    </v-card-actions>
  </v-card>
</template>

<script setup>
defineProps({
  bot: {
    type: Object,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  }
})

defineEmits(['select'])
</script>

<style scoped>
.bot-card {
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  color: white;
  overflow: hidden;
}

.bot-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.bot-card.selected {
  border: 2px solid var(--v-primary-base);
  transform: scale(1.05);
}

.bot-image {
  position: relative;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.bot-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 8px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 50%);
}

.selected-chip {
  font-weight: bold;
}

.mini-stats {
  margin-top: 8px;
}

.stat-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin: 0 2px;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #ffd700;
}

.stat-name {
  font-size: 0.7rem;
  text-transform: uppercase;
  opacity: 0.8;
}

:deep(.v-btn) {
  letter-spacing: 0.5px;
  font-weight: 600;
}
</style>