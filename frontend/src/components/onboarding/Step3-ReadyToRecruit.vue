<template>
  <v-card flat>
    <v-card-title class="text-center">
      <h2 class="text-h4 mb-2">🎉 Congratulations, Manager!</h2>
      <p class="text-h6 font-weight-regular">You're ready to build your championship team</p>
    </v-card-title>

    <v-card-text>
      <!-- Manager Summary Card -->
      <v-card variant="outlined" class="mb-6">
        <v-card-text class="text-center">
          <v-avatar size="100" class="mb-3">
            <v-img 
              :src="managerData?.avatar" 
              :alt="managerData?.name"
              cover
            />
          </v-avatar>
          <h3 class="text-h5 mb-2">{{ managerData?.name }}</h3>
          <p class="text-body-1 text-medium-emphasis mb-3">{{ teamData?.name }}</p>
          
          <!-- Manager Status -->
          <v-chip-group class="justify-center mb-4">
            <v-chip color="primary" variant="outlined">
              <v-icon start size="small">mdi-shield-star</v-icon>
              Amateur Manager
            </v-chip>
            <v-chip color="success" variant="outlined">
              <v-icon start size="small">mdi-currency-usd</v-icon>
              $100K Budget
            </v-chip>
          </v-chip-group>

          <!-- Explanation -->
          <v-alert 
            type="info" 
            variant="tonal" 
            class="mx-auto" 
            max-width="500"
          >
            <v-alert-title class="text-body-1">Your Journey Begins!</v-alert-title>
            <div class="text-body-2">
              <p class="mb-2">
                As an <strong>Amateur Manager</strong>, you start with a <strong>$100K recruitment budget</strong>.
              </p>
              <p>
                Prove yourself on the field by winning matches and tournaments to increase your rank and unlock bigger budgets!
              </p>
            </div>
          </v-alert>

          <!-- Team Logo Preview -->
          <div v-if="teamData?.logo" class="mt-4">
            <v-img
              :src="teamData.logo"
              :height="120"
              :width="120"
              class="mx-auto team-logo rounded-circle"
              contain
            />
          </div>
        </v-card-text>
      </v-card>

      <!-- Action Button -->
      <v-row justify="center">
        <v-col cols="12" sm="8" md="6">
          <game-button
            block
            color="success"
            size="x-large"
            label="Start Recruiting Your Team"
            prepend-icon="mdi-robot"
            append-icon="mdi-arrow-right"
            @click="startRecruiting"
            click-sound="success"
            class="py-6"
          />
          <p class="text-center text-caption mt-3 text-medium-emphasis">
            Build the best robot team you can with your $100K budget!
          </p>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue';
import GameButton from '@/components/GameButton.vue';

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

// Computed properties
const managerData = computed(() => props.data.manager);
const teamData = computed(() => props.data.team);

// Methods
const startRecruiting = () => {
  // Complete onboarding and navigate to recruit page
  props.complete();
};
</script>

<style scoped>
:deep(.v-card) {
  background-color: rgba(var(--v-theme-surface), 0.9);
}

.team-logo {
  border: 3px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}
</style>