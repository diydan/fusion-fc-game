<template>
  <v-card flat>
    <v-card-title class="text-center">
      <h2 class="text-h4">Welcome to Fusion FC!</h2>
    </v-card-title>
    
    <v-card-subtitle class="text-center text-body-1 mb-4">
      We've generated a unique team just for you
    </v-card-subtitle>

    <v-card-text>
      <!-- Team Preview with Inline Editing -->
      <v-card :loading="loading" :elevation="2" class="team-card">
        <v-card-text class="text-center">
          <!-- Logo Display with Edit Button -->
          <div class="logo-container mb-4 position-relative">
            <v-skeleton-loader
              v-if="loading && !currentTeam.logo"
              type="avatar"
              :height="200"
              :width="200"
              class="mx-auto rounded-circle"
            />
            <v-img
              v-else-if="currentTeam.logo"
              :src="currentTeam.logo"
              :height="200"
              :width="200"
              class="mx-auto team-logo rounded-circle"
              contain
            >
              <template v-slot:placeholder>
                <v-row class="fill-height ma-0" align="center" justify="center">
                  <v-progress-circular indeterminate color="primary" />
                </v-row>
              </template>
            </v-img>
            <div v-else class="fallback-logo rounded-circle" :style="fallbackLogoStyle">
              <v-icon size="80" color="white">mdi-soccer</v-icon>
            </div>
            
            <!-- Logo Navigation -->
            <div v-if="!loading && logoHistory.length > 1" class="logo-navigation">
              <v-btn
                icon
                size="small"
                color="primary"
                class="logo-nav-btn logo-nav-left"
                @click="navigateLogo('prev')"
                :disabled="logoHistoryIndex <= 0"
              >
                <v-icon size="small">mdi-chevron-left</v-icon>
                <v-tooltip activator="parent" location="top">Previous Logo</v-tooltip>
              </v-btn>
              
              <v-btn
                icon
                size="small"
                color="primary"
                class="logo-nav-btn logo-nav-right"
                @click="navigateLogo('next')"
                :disabled="logoHistoryIndex >= logoHistory.length - 1"
              >
                <v-icon size="small">mdi-chevron-right</v-icon>
                <v-tooltip activator="parent" location="top">Next Logo</v-tooltip>
              </v-btn>
            </div>

            <!-- Change Logo Button -->
            <v-btn
              v-if="!loading"
              icon
              size="small"
              color="primary"
              class="logo-edit-btn"
              @click="showLogoDialog = true"
              :disabled="generatingLogo"
            >
              <v-icon size="small">mdi-pencil</v-icon>
              <v-tooltip activator="parent" location="top">Edit Logo</v-tooltip>
            </v-btn>
          </div>

          <!-- Team Name with Edit -->
          <div class="d-flex align-center justify-center mb-4">
            <h2 v-if="!editingName" class="text-h4 font-weight-bold">
              {{ currentTeam.name || 'Your Team' }}
            </h2>
            <v-text-field
              v-else
              v-model="tempTeamName"
              variant="outlined"
              density="compact"
              hide-details
              single-line
              autofocus
              @keyup.enter="saveName"
              @blur="saveName"
              class="team-name-input"
            />
            <v-btn
              icon
              size="small"
              variant="text"
              @click="editName"
              class="ml-2"
            >
              <v-icon size="small">{{ editingName ? 'mdi-check' : 'mdi-pencil' }}</v-icon>
            </v-btn>
          </div>

          <!-- Manager Section -->
          <v-card v-if="displayManager" variant="outlined" class="mb-4 manager-card">
            <v-card-text class="text-center">
              <v-avatar size="80" class="mb-2">
                <v-img 
                  :src="displayManager.avatar" 
                  :alt="displayManager.name"
                  cover
                >
                  <template v-slot:placeholder>
                    <v-progress-circular indeterminate color="primary" />
                  </template>
                </v-img>
              </v-avatar>
              <h3 class="text-h6 mb-1">{{ displayManager.name }}</h3>
              <p class="text-caption text-medium-emphasis mb-2">Amateur Manager</p>
              <div class="d-flex justify-center align-center mb-2">
                <v-chip size="small" color="primary" variant="outlined" class="me-2">
                  0 XP
                </v-chip>
                <v-chip size="small" color="success" variant="outlined" class="me-2">
                  0% influence
                </v-chip>
                <v-chip size="small" color="warning" variant="outlined">
                  $100K budget
                </v-chip>
              </div>
              <p class="text-caption">Ambitious • Learning, Development</p>
            </v-card-text>
          </v-card>

          <!-- Stadium Info -->
          <v-card v-if="currentTeam.stadium" variant="outlined" class="mb-4 stadium-card">
            <v-card-text class="text-center">
              <v-icon size="40" color="primary" class="mb-2">mdi-stadium</v-icon>
              <h3 class="text-h6 mb-1">{{ currentTeam.stadium.name }}</h3>
              <div class="d-flex justify-center align-center">
                <v-chip size="small" variant="outlined" class="me-2">
                  <v-icon start size="small">mdi-account-group</v-icon>
                  {{ currentTeam.stadium.capacity.toLocaleString() }}
                </v-chip>
                <v-chip size="small" variant="outlined">
                  <v-icon start size="small">mdi-star</v-icon>
                  {{ currentTeam.stadium.atmosphere }}% atmosphere
                </v-chip>
              </div>
            </v-card-text>
          </v-card>

          <!-- Team Colors with Inline Edit -->
          <div class="color-display mb-4">
            <v-row justify="center">
              <v-col cols="auto">
                <div class="text-center">
                  <v-menu>
                    <template v-slot:activator="{ props }">
                      <v-btn
                        v-bind="props"
                        :color="currentTeam.colors?.primary"
                        size="large"
                        icon
                        elevation="2"
                      >
                        <v-icon>mdi-palette</v-icon>
                      </v-btn>
                    </template>
                    <v-card>
                      <v-card-text>
                        <p class="text-subtitle-2 mb-2">Select Home Color</p>
                        <div class="color-grid">
                          <v-btn
                            v-for="color in teamColors"
                            :key="color.hex"
                            :color="color.hex"
                            size="small"
                            icon
                            @click="updateColor('primary', color)"
                            class="ma-1"
                          >
                            <v-icon v-if="currentTeam.colors?.primary === color.hex" size="small">mdi-check</v-icon>
                          </v-btn>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-menu>
                </div>
              </v-col>
              
              <v-col cols="auto">
                <div class="text-center">
                  <v-menu>
                    <template v-slot:activator="{ props }">
                      <v-btn
                        v-bind="props"
                        :color="currentTeam.colors?.secondary"
                        size="large"
                        icon
                        elevation="2"
                      >
                        <v-icon>mdi-palette</v-icon>
                      </v-btn>
                    </template>
                    <v-card>
                      <v-card-text>
                        <p class="text-subtitle-2 mb-2">Select Away Color</p>
                        <div class="color-grid">
                          <v-btn
                            v-for="color in teamColors"
                            :key="color.hex"
                            :color="color.hex"
                            size="small"
                            icon
                            @click="updateColor('secondary', color)"
                            class="ma-1"
                            :disabled="color.hex === currentTeam.colors?.primary"
                          >
                            <v-icon v-if="currentTeam.colors?.secondary === color.hex" size="small">mdi-check</v-icon>
                          </v-btn>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-menu>
                </div>
              </v-col>
            </v-row>
          </div>

          <!-- Loading Message -->
          <v-fade-transition>
            <p v-if="loading" class="text-body-2 text-medium-emphasis mt-3">
              <v-icon size="small" class="mr-1">mdi-robot</v-icon>
              {{ loadingMessage }}
            </p>
          </v-fade-transition>
        </v-card-text>
      </v-card>

      <!-- Action Buttons -->
      <v-row class="mt-6" justify="center">
        <v-col cols="6" sm="4">
          <game-button
            v-if="props.prev"
            block
            variant="text"
            size="large"
            label="Back"
            prepend-icon="mdi-arrow-left"
            @click="props.prev"
            click-sound="pop"
            class="back-button"
          />
          <game-button
            v-else
            block
            color="primary"
            size="large"
            label="Random"
            prepend-icon="mdi-dice-6"
            @click="regenerateTeam"
            :loading="loading"
            :disabled="regenerateCount >= maxRegenerations"
            click-sound="coin"
          />
        </v-col>
        
        <v-col cols="6" sm="4">
          <game-button
            block
            color="success"
            size="large"
            label="Next"
            append-icon="mdi-arrow-right"
            @click="acceptTeam"
            :disabled="loading || !currentTeam.logo"
            click-sound="success"
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
    
    <!-- Logo Generation Dialog -->
    <v-dialog v-model="showLogoDialog" max-width="500" :persistent="generatingLogo">
      <v-card>
        <v-card-title>{{ generatingLogo ? 'Generating Your Logo...' : 'Generate New Logo' }}</v-card-title>
        <v-card-text>
          <template v-if="!generatingLogo">
            <v-textarea
              v-model="logoPrompt"
              label="Describe your ideal logo (optional)"
              placeholder="e.g., fierce dragon, minimalist shield, abstract tech pattern"
              rows="3"
              variant="outlined"
              density="comfortable"
              hint="Leave empty for an AI-generated design based on your team name and colors"
              persistent-hint
            />
          </template>
          <template v-else>
            <div class="text-center py-8">
              <v-progress-circular
                :size="80"
                :width="8"
                color="primary"
                indeterminate
                class="mb-4"
              >
                <template v-slot:default>
                  <v-icon size="large">mdi-robot</v-icon>
                </template>
              </v-progress-circular>
              <p class="text-h6 mb-2">Creating your unique team logo...</p>
              <p class="text-body-2 text-medium-emphasis">
                Our AI designer is crafting a logo that represents {{ currentTeam.name }}
              </p>
              <v-chip class="mt-4" size="small" variant="outlined">
                <v-icon start size="small">mdi-timer-sand</v-icon>
                This may take up to 20 seconds
              </v-chip>
              <v-fade-transition>
                <div v-if="logoGenerationTime > 5" class="mt-4">
                  <v-progress-linear
                    :model-value="(logoGenerationTime / 20) * 100"
                    color="primary"
                    height="4"
                    rounded
                  />
                  <p class="text-caption mt-2 text-medium-emphasis">
                    {{ logoGenerationMessages[Math.min(Math.floor(logoGenerationTime / 5), logoGenerationMessages.length - 1)] }}
                  </p>
                </div>
              </v-fade-transition>
            </div>
          </template>
        </v-card-text>
        <v-card-actions v-if="!generatingLogo">
          <v-spacer />
          <game-button
            variant="text"
            size="large"
            label="Cancel"
            @click="showLogoDialog = false"
            click-sound="pop"
          />
          <game-button
            color="primary"
            size="large"
            label="Generate"
            prepend-icon="mdi-robot"
            @click="generateNewLogo"
            :loading="generatingLogo"
            click-sound="coin"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import TeamPreview from './TeamPreview.vue';
import GameButton from '@/components/GameButton.vue';
import { generateRandomTeam } from '@/services/team-generator';
import { generateTeamLogo, generateFallbackLogo } from '@/services/logo-generator';
import { TEAM_COLORS } from '@/config/team-colors';

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  next: {
    type: Function,
    required: true
  },
  prev: {
    type: Function,
    required: false
  }
});

// State
const currentTeam = ref({});
const loading = ref(false);
const loadingMessage = ref('Generating your team...');
const error = ref(null);
const regenerateCount = ref(0);
const maxRegenerations = 5;

// Inline editing states
const editingName = ref(false);
const tempTeamName = ref('');
const showLogoDialog = ref(false);
const logoPrompt = ref('');
const generatingLogo = ref(false);

// Logo history for back/forward navigation
const logoHistory = ref([]);
const logoHistoryIndex = ref(-1);

// Logo generation UI state
const logoGenerationTime = ref(0);
const logoGenerationTimer = ref(null);
const logoGenerationMessages = [
  "Analyzing team colors and style...",
  "Designing unique elements...",
  "Refining the details...",
  "Finalizing your masterpiece..."
];

// Team colors
const teamColors = ref(TEAM_COLORS);

// Computed property for manager display
const displayManager = computed(() => {
  // Use manager data from step 1 if available
  if (props.data.manager) {
    return {
      name: props.data.manager.name,
      avatar: props.data.manager.avatar,
      bio: props.data.manager.bio
    };
  }
  // Otherwise use generated manager from current team
  if (currentTeam.value.manager) {
    return {
      name: currentTeam.value.manager.name,
      avatar: currentTeam.value.manager.avatar?.url,
      bio: currentTeam.value.manager.bio
    };
  }
  return null;
});

// Generate initial team on mount
onMounted(() => {
  generateInitialTeam();
});

// Cleanup on unmount
onUnmounted(() => {
  if (logoGenerationTimer.value) {
    clearInterval(logoGenerationTimer.value);
  }
});

// Methods
const generateInitialTeam = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    // Check if we have pre-generated team data from manager page
    if (props.data.preGeneratedTeam) {
      console.log('✅ Using pre-generated team data - instant load!');
      loadingMessage.value = 'Loading your team...';
      
      currentTeam.value = props.data.preGeneratedTeam;
      
      // Add to logo history if we have a logo
      if (currentTeam.value.logo) {
        addToLogoHistory({
          url: currentTeam.value.logo,
          prompt: currentTeam.value.logoPrompt,
          teamName: currentTeam.value.name,
          colors: currentTeam.value.colors
        });
      }
      
      // Simulate brief loading for UX (so it doesn't feel too instant)
      setTimeout(() => {
        loading.value = false;
        loadingMessage.value = '';
      }, 300);
      
    } else {
      // Fallback to normal generation if no pre-generated data
      console.log('⏳ No pre-generated data, generating team normally...');
      loadingMessage.value = 'Creating team name and colors...';
      
      // Generate random team
      const randomTeam = generateRandomTeam();
      
      // If we have manager data from step 1, use it
      if (props.data.manager) {
        randomTeam.manager = {
          name: props.data.manager.name,
          bio: props.data.manager.bio,
          avatar: {
            url: props.data.manager.avatar,
            source: props.data.manager.avatarSource
          },
          rank: 'Amateur',
          experience: 0,
          reputation: 'Amateur',
          personality: 'Ambitious',
          specialties: ['Learning', 'Development'],
          recruitmentBudget: 100000
        };
      }
      
      currentTeam.value = {
        ...randomTeam,
        logo: null,
        tempLogo: null
      };
      
      // Start logo generation early (don't wait for it)
      generateLogoAsync(randomTeam.name, randomTeam.colors);
    }
    
  } catch (err) {
    console.error('Team generation error:', err);
    error.value = 'Failed to generate team. Please try again.';
    loading.value = false;
  }
};

const generateLogoAsync = async (teamName, teamColors, customPrompt = null) => {
  loadingMessage.value = 'Designing team logo...';
  
  try {
    const { tempLogoUrl, prompt, error: logoError } = await generateTeamLogo(
      teamName,
      teamColors,
      customPrompt
    );
    
    if (logoError) {
      throw new Error(logoError);
    }
    
    // Add to logo history
    addToLogoHistory({
      url: tempLogoUrl,
      prompt: prompt,
      teamName: teamName,
      colors: teamColors
    });
    
    currentTeam.value.tempLogo = tempLogoUrl;
    currentTeam.value.logo = tempLogoUrl;
    currentTeam.value.logoPrompt = prompt;
    
  } catch (err) {
    console.error('Logo generation error:', err);
    error.value = 'Failed to generate logo. You can try again or use a default logo.';
  } finally {
    loading.value = false;
    loadingMessage.value = '';
  }
};

const regenerateTeam = async () => {
  regenerateCount.value++;
  // Clear logo history when regenerating a completely new team
  logoHistory.value = [];
  logoHistoryIndex.value = -1;
  
  // When regenerating, we want to keep the manager data from step 1
  loading.value = true;
  error.value = null;
  loadingMessage.value = 'Creating team name and colors...';
  
  try {
    // Generate new random team
    const randomTeam = generateRandomTeam();
    
    // If we have manager data from step 1, preserve it
    if (props.data.manager) {
      randomTeam.manager = {
        name: props.data.manager.name,
        bio: props.data.manager.bio,
        avatar: {
          url: props.data.manager.avatar,
          source: props.data.manager.avatarSource
        },
        rank: 'Amateur',
        experience: 0,
        reputation: 'Amateur',
        personality: 'Ambitious',
        specialties: ['Learning', 'Development'],
        recruitmentBudget: 100000
      };
    }
    
    currentTeam.value = {
      ...randomTeam,
      logo: null,
      tempLogo: null
    };
    
    // Start logo generation
    generateLogoAsync(randomTeam.name, randomTeam.colors);
    
  } catch (err) {
    console.error('Team generation error:', err);
    error.value = 'Failed to generate team. Please try again.';
    loading.value = false;
  }
};

const acceptTeam = () => {
  props.next({
    team: currentTeam.value,
    regenerateCount: regenerateCount.value
  });
};

const useFallbackLogo = () => {
  const fallback = generateFallbackLogo(currentTeam.value.name, currentTeam.value.colors);
  currentTeam.value.logo = fallback.tempLogoUrl;
  currentTeam.value.tempLogo = fallback.tempLogoUrl;
  currentTeam.value.isFallback = true;
  error.value = null;
};

// Inline editing methods
const editName = () => {
  if (editingName.value) {
    saveName();
  } else {
    tempTeamName.value = currentTeam.value.name;
    editingName.value = true;
  }
};

const saveName = () => {
  if (tempTeamName.value.trim()) {
    currentTeam.value.name = tempTeamName.value.trim();
  }
  editingName.value = false;
};

const updateColor = (type, color) => {
  if (type === 'primary') {
    currentTeam.value.colors.primary = color.hex;
    currentTeam.value.colors.primaryName = color.name;
  } else if (type === 'secondary') {
    currentTeam.value.colors.secondary = color.hex;
    currentTeam.value.colors.secondaryName = color.name;
  }
};

const generateNewLogo = async () => {
  generatingLogo.value = true;
  error.value = null;
  logoGenerationTime.value = 0;
  
  // Start the timer
  logoGenerationTimer.value = setInterval(() => {
    logoGenerationTime.value += 0.1;
  }, 100);
  
  try {
    const customPrompt = logoPrompt.value.trim() || null;
    const { tempLogoUrl, prompt, error: logoError } = await generateTeamLogo(
      currentTeam.value.name,
      currentTeam.value.colors,
      customPrompt
    );
    
    if (logoError) {
      throw new Error(logoError);
    }
    
    // Add to logo history
    addToLogoHistory({
      url: tempLogoUrl,
      prompt: prompt,
      teamName: currentTeam.value.name,
      colors: currentTeam.value.colors
    });
    
    currentTeam.value.tempLogo = tempLogoUrl;
    currentTeam.value.logo = tempLogoUrl;
    currentTeam.value.logoPrompt = prompt;
    showLogoDialog.value = false;
    logoPrompt.value = '';
  } catch (err) {
    console.error('Logo generation error:', err);
    error.value = 'Failed to generate logo. Please try again.';
    showLogoDialog.value = false;
  } finally {
    generatingLogo.value = false;
    // Clear the timer
    if (logoGenerationTimer.value) {
      clearInterval(logoGenerationTimer.value);
      logoGenerationTimer.value = null;
    }
    logoGenerationTime.value = 0;
  }
};

// Logo history management
const addToLogoHistory = (logoData) => {
  // Remove any logos after current index (when navigating and adding new)
  if (logoHistoryIndex.value < logoHistory.value.length - 1) {
    logoHistory.value = logoHistory.value.slice(0, logoHistoryIndex.value + 1);
  }
  
  logoHistory.value.push(logoData);
  logoHistoryIndex.value = logoHistory.value.length - 1;
  
  // Limit history to 10 logos to prevent memory issues
  if (logoHistory.value.length > 10) {
    logoHistory.value.shift();
    logoHistoryIndex.value = logoHistory.value.length - 1;
  }
};

const navigateLogo = (direction) => {
  if (direction === 'prev' && logoHistoryIndex.value > 0) {
    logoHistoryIndex.value--;
  } else if (direction === 'next' && logoHistoryIndex.value < logoHistory.value.length - 1) {
    logoHistoryIndex.value++;
  }
  
  const currentLogo = logoHistory.value[logoHistoryIndex.value];
  if (currentLogo) {
    currentTeam.value.logo = currentLogo.url;
    currentTeam.value.tempLogo = currentLogo.url;
    currentTeam.value.logoPrompt = currentLogo.prompt;
  }
};

// Computed properties
const fallbackLogoStyle = computed(() => {
  if (!currentTeam.value.colors) return {};
  return {
    background: `linear-gradient(135deg, ${currentTeam.value.colors.primary} 0%, ${currentTeam.value.colors.secondary} 100%)`,
    width: '200px',
    height: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto'
  };
});
</script>

<style scoped>
:deep(.v-card) {
  background-color: rgba(var(--v-theme-surface), 0.9);
}

.team-card {
  border: 2px solid rgba(var(--v-theme-primary), 0.3);
  transition: all 0.3s ease;
}

.team-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.logo-container {
  position: relative;
  display: inline-block;
}

.team-logo {
  border: 3px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.fallback-logo {
  border: 3px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.logo-edit-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: rgba(var(--v-theme-surface), 0.95) !important;
  border: 1px solid rgba(var(--v-theme-primary), 0.5);
}

.logo-navigation {
  position: absolute;
  top: 50%;
  width: 100%;
  transform: translateY(-50%);
  pointer-events: none;
}

.logo-nav-btn {
  position: absolute;
  background-color: rgba(var(--v-theme-surface), 0.95) !important;
  border: 1px solid rgba(var(--v-theme-primary), 0.5);
  pointer-events: auto;
  transition: all 0.2s ease;
}

.logo-nav-btn:hover {
  background-color: rgba(var(--v-theme-primary), 0.2) !important;
  transform: scale(1.1);
}

.logo-nav-left {
  left: -15px;
}

.logo-nav-right {
  right: -15px;
}

.team-name-input {
  max-width: 300px;
}

.team-name-input :deep(.v-field) {
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  max-width: 200px;
}

.color-display v-btn {
  transition: all 0.2s ease;
}

.color-display v-btn:hover {
  transform: scale(1.1);
}

.manager-card {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05) 0%, rgba(var(--v-theme-secondary), 0.05) 100%);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  transition: all 0.3s ease;
}

.manager-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.1);
}

.stadium-card {
  background: linear-gradient(135deg, rgba(var(--v-theme-success), 0.05) 0%, rgba(var(--v-theme-info), 0.05) 100%);
  border: 1px solid rgba(var(--v-theme-success), 0.2);
  transition: all 0.3s ease;
}

.stadium-card:hover {
  border-color: rgba(var(--v-theme-success), 0.4);
  box-shadow: 0 4px 12px rgba(var(--v-theme-success), 0.1);
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