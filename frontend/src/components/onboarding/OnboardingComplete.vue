<template>
  <v-card flat>
    <v-card-text class="text-center">
      <!-- Success Animation -->
      <v-icon
        size="120"
        color="success"
        class="mb-4 success-icon"
      >
        mdi-check-circle
      </v-icon>

      <h2 class="text-h3 font-weight-bold mb-2">Welcome to Fusion FC!</h2>
      
      <p class="text-h6 text-medium-emphasis mb-6">
        Your team is ready to dominate the field
      </p>

      <!-- Final Team Display -->
      <team-preview
        :team="data.team"
        :manager-name="data.manager?.name"
        :elevation="4"
        class="mb-6 final-team-card"
      />

      <!-- Quick Stats -->
      <v-row class="mb-6">
        <v-col cols="12" sm="4">
          <div class="stat-card pa-4">
            <v-icon size="40" color="primary" class="mb-2">mdi-trophy</v-icon>
            <p class="text-h6 mb-0">0</p>
            <p class="text-caption">Matches Won</p>
          </div>
        </v-col>
        <v-col cols="12" sm="4">
          <div class="stat-card pa-4">
            <v-icon size="40" color="info" class="mb-2">mdi-account-group</v-icon>
            <p class="text-h6 mb-0">0</p>
            <p class="text-caption">Players</p>
          </div>
        </v-col>
        <v-col cols="12" sm="4">
          <div class="stat-card pa-4">
            <v-icon size="40" color="warning" class="mb-2">mdi-star</v-icon>
            <p class="text-h6 mb-0">1</p>
            <p class="text-caption">League Rank</p>
          </div>
        </v-col>
      </v-row>

      <!-- Action Buttons -->
      <v-row>
        <v-col cols="12" sm="6">
          <game-button
            block
            size="large"
            variant="text"
            label="Back"
            prepend-icon="mdi-arrow-left"
            @click="goBack"
            click-sound="pop"
            class="back-button"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <game-button
            block
            size="large"
            color="success"
            label="Enter Game"
            append-icon="mdi-arrow-right"
            @click="enterGame"
            click-sound="success"
          />
        </v-col>
      </v-row>

      <!-- Tips -->
      <v-alert
        type="info"
        variant="tonal"
        class="mt-6"
        icon="mdi-lightbulb"
      >
        <strong>Pro Tip:</strong> Start by recruiting players to build your dream team!
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { onMounted } from 'vue';
import TeamPreview from './TeamPreview.vue';
import GameButton from '@/components/GameButton.vue';
import { useSoundStore } from '@/stores/sound';
import confetti from 'canvas-confetti';

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  complete: {
    type: Function,
    required: true
  },
  prev: {
    type: Function,
    required: true
  }
});

const soundStore = useSoundStore();

// Methods
const enterGame = () => {
  props.complete();
};

const goBack = () => {
  props.prev();
};

const viewTeam = () => {
  // This will navigate to team page after completion
  props.complete();
};

// Celebration on mount
onMounted(() => {
  // Play success sound
  soundStore.playSound('success');
  
  // Trigger confetti
  setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: [props.data.team.colors.primary, props.data.team.colors.secondary]
    });
  }, 500);
});
</script>

<style scoped>
:deep(.v-card) {
  background-color: rgba(var(--v-theme-surface), 0.95);
}

.success-icon {
  animation: bounce 0.5s ease-out;
}

@keyframes bounce {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.final-team-card {
  transform: scale(1);
  transition: transform 0.3s ease;
}

.final-team-card:hover {
  transform: scale(1.02);
}

.stat-card {
  background-color: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 12px;
  text-align: center;
  transition: all 0.3s ease;
}

.stat-card:hover {
  background-color: rgba(var(--v-theme-surface-variant), 0.8);
  transform: translateY(-2px);
}

/* Back button styling */
.back-button {
  color: white !important;
  opacity: 0.9;
}

.back-button:hover {
  opacity: 1;
  text-decoration: underline;
}

.back-button :deep(.v-btn__content) {
  font-weight: normal;
}
</style>