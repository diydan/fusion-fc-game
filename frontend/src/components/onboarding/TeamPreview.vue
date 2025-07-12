<template>
  <v-card :loading="loading" :elevation="elevation">
    <v-card-text class="text-center">
      <!-- Logo Display -->
      <div class="logo-container mb-4">
        <v-skeleton-loader
          v-if="loading && !team.logo"
          type="avatar"
          :height="logoSize"
          :width="logoSize"
          class="mx-auto"
        />
        <v-img
          v-else-if="team.logo"
          :src="team.logo"
          :height="logoSize"
          :width="logoSize"
          class="mx-auto team-logo"
          contain
        >
          <template v-slot:placeholder>
            <v-row class="fill-height ma-0" align="center" justify="center">
              <v-progress-circular indeterminate color="primary" />
            </v-row>
          </template>
        </v-img>
        <div v-else class="fallback-logo" :style="fallbackLogoStyle">
          <v-icon size="80" color="white">mdi-soccer</v-icon>
        </div>
      </div>

      <!-- Team Name -->
      <h2 class="text-h4 font-weight-bold mb-2">{{ team.name || 'Your Team' }}</h2>
      
      <!-- Manager Name -->
      <p v-if="managerName" class="text-subtitle-1 text-medium-emphasis mb-4">
        Manager: {{ managerName }}
      </p>

      <!-- Team Colors -->
      <div class="color-display mb-4">
        <v-chip-group>
          <v-chip
            :color="team.colors?.primary"
            text-color="white"
            class="mx-1"
          >
            <v-icon start>mdi-palette</v-icon>
            {{ team.colors?.primaryName || 'Primary' }}
          </v-chip>
          <v-chip
            :color="team.colors?.secondary"
            text-color="white"
            class="mx-1"
          >
            <v-icon start>mdi-palette</v-icon>
            {{ team.colors?.secondaryName || 'Secondary' }}
          </v-chip>
        </v-chip-group>
      </div>

      <!-- Jersey Preview -->
      <v-row v-if="showJerseys" class="jersey-preview">
        <v-col cols="6">
          <div class="jersey-container">
            <div class="jersey home-jersey" :style="homeJerseyStyle">
              <v-icon color="white" size="40">mdi-tshirt-crew</v-icon>
            </div>
            <p class="text-caption mt-1">Home</p>
          </div>
        </v-col>
        <v-col cols="6">
          <div class="jersey-container">
            <div class="jersey away-jersey" :style="awayJerseyStyle">
              <v-icon size="40" :color="awayTextColor">mdi-tshirt-crew</v-icon>
            </div>
            <p class="text-caption mt-1">Away</p>
          </div>
        </v-col>
      </v-row>

      <!-- Loading Message -->
      <v-fade-transition>
        <p v-if="loading" class="text-body-2 text-medium-emphasis mt-3">
          <v-icon size="small" class="mr-1">mdi-robot</v-icon>
          {{ loadingMessage }}
        </p>
      </v-fade-transition>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue';
import { getContrastingTextColor } from '@/config/team-colors';

const props = defineProps({
  team: {
    type: Object,
    required: true,
    default: () => ({})
  },
  managerName: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingMessage: {
    type: String,
    default: 'Generating your team...'
  },
  logoSize: {
    type: Number,
    default: 200
  },
  elevation: {
    type: Number,
    default: 2
  },
  showJerseys: {
    type: Boolean,
    default: true
  }
});

// Computed styles
const fallbackLogoStyle = computed(() => ({
  width: `${props.logoSize}px`,
  height: `${props.logoSize}px`,
  background: `linear-gradient(135deg, ${props.team.colors?.primary || '#00D4FF'} 0%, ${props.team.colors?.secondary || '#9D00FF'} 100%)`,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto'
}));

const homeJerseyStyle = computed(() => ({
  backgroundColor: props.team.colors?.primary || '#00D4FF'
}));

const awayJerseyStyle = computed(() => ({
  backgroundColor: props.team.colors?.secondary || '#9D00FF'
}));

const awayTextColor = computed(() => {
  return getContrastingTextColor(props.team.colors?.secondary || '#9D00FF');
});
</script>

<style scoped>
.logo-container {
  position: relative;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.team-logo {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.team-logo:hover {
  transform: scale(1.05);
}

.fallback-logo {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.jersey-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.jersey {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.jersey:hover {
  transform: translateY(-2px);
}

.color-display {
  display: flex;
  justify-content: center;
  gap: 8px;
}
</style>