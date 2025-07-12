<template>
  <v-card flat>
    <v-card-title class="text-center">
      <h2 class="text-h4">Welcome to Fusion FC!</h2>
    </v-card-title>
    
    <v-card-subtitle class="text-center text-body-1 mb-4">
      We've generated a unique team just for you
    </v-card-subtitle>

    <v-card-text>
      <!-- Team Preview -->
      <team-preview
        :team="currentTeam"
        :loading="loading"
        :loading-message="loadingMessage"
        class="mb-6"
      />

      <!-- Action Buttons -->
      <v-row class="mt-6">
        <v-col cols="12" sm="4">
          <game-button
            block
            color="success"
            size="large"
            label="Love it!"
            prepend-icon="mdi-heart"
            @click="acceptTeam"
            :disabled="loading || !currentTeam.logo"
            click-sound="success"
          />
        </v-col>
        
        <v-col cols="12" sm="4">
          <game-button
            block
            color="primary"
            size="large"
            label="Regenerate"
            prepend-icon="mdi-refresh"
            @click="regenerateTeam"
            :loading="loading"
            :disabled="regenerateCount >= maxRegenerations"
            click-sound="coin"
          />
        </v-col>
        
        <v-col cols="12" sm="4">
          <game-button
            block
            variant="outlined"
            size="large"
            label="Customize"
            prepend-icon="mdi-pencil"
            @click="customizeTeam"
            :disabled="loading || !currentTeam.logo"
            click-sound="pop"
          />
        </v-col>
      </v-row>

      <!-- Regeneration Counter -->
      <p v-if="regenerateCount > 0" class="text-center text-caption mt-3">
        Regenerations: {{ regenerateCount }} / {{ maxRegenerations }}
      </p>

      <!-- Error Alert -->
      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        class="mt-4"
        closable
        @click:close="error = null"
      >
        {{ error }}
        <template v-if="currentTeam.logo === null">
          <br>
          <v-btn
            size="small"
            variant="outlined"
            class="mt-2"
            @click="useFallbackLogo"
          >
            Use Default Logo
          </v-btn>
        </template>
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import TeamPreview from './TeamPreview.vue';
import GameButton from '@/components/GameButton.vue';
import { generateRandomTeam } from '@/services/team-generator';
import { generateTeamLogo, generateFallbackLogo } from '@/services/logo-generator';

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  next: {
    type: Function,
    required: true
  }
});

// State
const currentTeam = ref({});
const loading = ref(false);
const loadingMessage = ref('Generating your team...');
const error = ref(null);
const regenerateCount = ref(0);
const maxRegenerations = 5;

// Generate initial team on mount
onMounted(() => {
  generateInitialTeam();
});

// Methods
const generateInitialTeam = async () => {
  loading.value = true;
  error.value = null;
  loadingMessage.value = 'Creating team name and colors...';
  
  try {
    // Generate random team
    const randomTeam = generateRandomTeam();
    currentTeam.value = {
      ...randomTeam,
      logo: null,
      tempLogo: null
    };
    
    // Generate logo
    loadingMessage.value = 'Designing team logo...';
    const { tempLogoUrl, prompt, error: logoError } = await generateTeamLogo(
      randomTeam.name,
      randomTeam.colors
    );
    
    if (logoError) {
      throw new Error(logoError);
    }
    
    currentTeam.value.tempLogo = tempLogoUrl;
    currentTeam.value.logo = tempLogoUrl; // For preview
    currentTeam.value.logoPrompt = prompt;
    
  } catch (err) {
    console.error('Team generation error:', err);
    error.value = 'Failed to generate logo. You can try again or use a default logo.';
  } finally {
    loading.value = false;
    loadingMessage.value = '';
  }
};

const regenerateTeam = async () => {
  regenerateCount.value++;
  await generateInitialTeam();
};

const acceptTeam = () => {
  props.next({
    team: currentTeam.value,
    regenerateCount: regenerateCount.value
  });
};

const customizeTeam = () => {
  // Skip to step 3 for customization
  props.next({
    team: currentTeam.value,
    regenerateCount: regenerateCount.value,
    skipToCustomize: true
  });
};

const useFallbackLogo = () => {
  const fallback = generateFallbackLogo(currentTeam.value.name, currentTeam.value.colors);
  currentTeam.value.logo = fallback.tempLogoUrl;
  currentTeam.value.tempLogo = fallback.tempLogoUrl;
  currentTeam.value.isFallback = true;
  error.value = null;
};
</script>

<style scoped>
:deep(.v-card) {
  background-color: rgba(var(--v-theme-surface), 0.9);
}
</style>