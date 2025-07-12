<template>
  <v-card class="player-detail-modal">
    <v-card-title>
      <v-avatar size="56">
        <v-img :src="player?.avatar || '/default-player.png'" />
      </v-avatar>
      <div class="ml-4">
        <h3 class="player-name">{{ player?.name }}</h3>
        <p class="player-position">
          {{ player?.position }} - <span class="player-tier">{{ player?.tier.toUpperCase() }}</span>
        </p>
      </div>
      <v-spacer />
      <v-btn icon @click="close">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" sm="6">
          <div v-for="(stat, key) in player?.stats" :key="key" class="player-stat">
            <label>{{ key.toUpperCase() }}</label>
            <StatBar :value="stat" />
          </div>
        </v-col>
        <v-col cols="12" sm="6">
          <v-divider vertical></v-divider>
          <div class="player-info">
            <div class="info-item">
              <span class="info-label">Price:</span> {{ formattedPrice }}
            </div>
            <div class="info-item">
              <span class="info-label">Age:</span> {{ player?.age }}
            </div>
            <div class="info-item">
              <span class="info-label">Nationality:</span> {{ player?.nationality }}
            </div>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-actions>
      <v-btn
        color="primary"
        :disabled="isSelected"
        @click="$emit('compare', player)"
      >
        Compare
      </v-btn>
      <v-btn color="success" @click="$emit('recruit', player)">Recruit Player</v-btn>
      <v-spacer />
      <v-btn text @click="close">Cancel</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { computed } from 'vue';
import StatBar from './StatBar.vue';

const props = defineProps({
  player: {
    type: Object,
    default: () => null,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
});

const formattedPrice = computed(() => {
  const price = props.player?.price || 0;
  if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
  if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
  return `$${price}`;
});

const close = () => {
  props.player = null;
}
</script>

<style scoped>
.player-detail-modal {
  width: 100%;
  max-width: 700px;
}

.player-name {
  font-size: 1.5rem;
  font-weight: bold;
}

.player-position {
  font-size: 1rem;
  color: var(--v-theme-on-surface-variant);
}

.player-tier {
  font-weight: bold;
  color: var(--v-theme-primary);
}

.player-stat {
  margin-bottom: 8px;
}

.player-info {
  padding: 16px;
  background: var(--v-theme-surface-variant);
  border-radius: 8px;
}

.info-item {
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.info-label {
  font-weight: bold;
  color: var(--v-theme-on-surface-variant);
}

.v-card-actions {
  justify-content: space-between;
}
</style>

