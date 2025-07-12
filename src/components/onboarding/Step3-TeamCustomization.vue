<template>
  <v-card flat>
    <v-card-title class="text-center">
      <h2 class="text-h4">Customize Your Team</h2>
    </v-card-title>
    
    <v-card-subtitle class="text-center text-body-1 mb-4">
      Make it uniquely yours
    </v-card-subtitle>

    <v-card-text>
      <!-- Team Name -->
      <v-text-field
        v-model="teamName"
        label="Team Name"
        variant="outlined"
        density="comfortable"
        :rules="nameRules"
        class="mb-4"
        prepend-inner-icon="mdi-soccer"
        @blur="validateAndFormatName"
      />

      <!-- Color Selection -->
      <div class="mb-6">
        <p class="text-subtitle-2 mb-3">Team Colors</p>
        
        <!-- Primary Color -->
        <p class="text-body-2 mb-2">Primary Color</p>
        <v-row class="mb-4">
          <v-col
            v-for="(color, index) in colorPalette"
            :key="`primary-${index}`"
            cols="3"
            sm="2"
            md="1.5"
          >
            <v-btn
              :color="color.hex"
              icon
              size="large"
              :variant="primaryColor === color.hex ? 'flat' : 'tonal'"
              @click="selectPrimaryColor(color)"
            >
              <v-icon v-if="primaryColor === color.hex">mdi-check</v-icon>
            </v-btn>
          </v-col>
        </v-row>

        <!-- Secondary Color -->
        <p class="text-body-2 mb-2">Secondary Color</p>
        <v-row class="mb-4">
          <v-col
            v-for="(color, index) in availableSecondaryColors"
            :key="`secondary-${index}`"
            cols="3"
            sm="2"
            md="1.5"
          >
            <v-btn
              :color="color.hex"
              icon
              size="large"
              :variant="secondaryColor === color.hex ? 'flat' : 'tonal'"
              @click="selectSecondaryColor(color)"
            >
              <v-icon v-if="secondaryColor === color.hex">mdi-check</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </div>

      <!-- Logo Options -->
      <v-expansion-panels>
        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon start>mdi-palette-advanced</v-icon>
            Advanced Logo Options
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-textarea
              v-model="customLogoPrompt"
              label="Describe your ideal logo"
              placeholder="e.g., fierce robot dragon breathing digital fire, minimalist style"
              rows="3"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
            <game-button
              color="primary"
              variant="tonal"
              size="large"
              label="Generate Custom Logo"
              prepend-icon="mdi-robot"
              @click="generateCustomLogo"
              :loading="generatingLogo"
              :disabled="!teamName || !primaryColor || !secondaryColor"
              click-sound="coin"
            />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <!-- Team Preview -->
      <div class="mt-6">
        <team-preview
          :team="currentTeam"
          :manager-name="data.manager?.name"
          :loading="generatingLogo"
          :loading-message="'Generating new logo...'"
        />
      </div>

      <!-- Navigation Buttons -->
      <v-row class="mt-6">
        <v-col cols="6">
          <game-button
            block
            variant="outlined"
            size="large"
            label="Back"
            prepend-icon="mdi-arrow-left"
            @click="goBack"
            click-sound="pop"
          />
        </v-col>
        <v-col cols="6">
          <game-button
            block
            color="success"
            size="large"
            label="Next"
            append-icon="mdi-arrow-right"
            @click="saveCustomization"
            :disabled="!teamName || !primaryColor || !secondaryColor"
            click-sound="success"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import TeamPreview from './TeamPreview.vue';
import GameButton from '@/components/GameButton.vue';
import { TEAM_COLORS, getColorByHex } from '@/config/team-colors';
import { validateTeamName, formatTeamName } from '@/services/team-generator';
import { generateTeamLogo } from '@/services/logo-generator';
import { useSoundStore } from '@/stores/sound';

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
    required: true
  }
});

const soundStore = useSoundStore();

// State
const teamName = ref('');
const primaryColor = ref('');
const secondaryColor = ref('');
const primaryColorName = ref('');
const secondaryColorName = ref('');
const customLogoPrompt = ref('');
const generatingLogo = ref(false);
const colorPalette = ref(TEAM_COLORS);

// Current team for preview
const currentTeam = computed(() => ({
  name: teamName.value,
  colors: {
    primary: primaryColor.value,
    secondary: secondaryColor.value,
    primaryName: primaryColorName.value,
    secondaryName: secondaryColorName.value
  },
  logo: props.data.team.logo,
  tempLogo: props.data.team.tempLogo
}));

// Filter secondary colors to avoid similar colors
const availableSecondaryColors = computed(() => {
  if (!primaryColor.value) return colorPalette.value;
  
  // Filter out the primary color and very similar colors
  return colorPalette.value.filter(color => {
    if (color.hex === primaryColor.value) return false;
    
    // Add more filtering logic here if needed
    return true;
  });
});

// Validation rules
const nameRules = [
  v => !!v || 'Team name is required',
  v => !validateTeamName(v) || validateTeamName(v)
];

// Methods
const selectPrimaryColor = (color) => {
  primaryColor.value = color.hex;
  primaryColorName.value = color.name;
  soundStore.playSound('pop');
  
  // If secondary is the same, clear it
  if (secondaryColor.value === color.hex) {
    secondaryColor.value = '';
    secondaryColorName.value = '';
  }
};

const selectSecondaryColor = (color) => {
  secondaryColor.value = color.hex;
  secondaryColorName.value = color.name;
  soundStore.playSound('pop');
};

const validateAndFormatName = () => {
  if (teamName.value) {
    teamName.value = formatTeamName(teamName.value);
  }
};

const generateCustomLogo = async () => {
  if (!teamName.value || !primaryColor.value || !secondaryColor.value) return;
  
  generatingLogo.value = true;
  
  try {
    const { tempLogoUrl, error } = await generateTeamLogo(
      teamName.value,
      {
        primary: primaryColor.value,
        secondary: secondaryColor.value,
        primaryName: primaryColorName.value,
        secondaryName: secondaryColorName.value
      },
      customLogoPrompt.value || null
    );
    
    if (error) {
      throw new Error(error);
    }
    
    // Update the logo in the parent data
    props.data.team.logo = tempLogoUrl;
    props.data.team.tempLogo = tempLogoUrl;
    props.data.team.logoPrompt = customLogoPrompt.value;
    
    soundStore.playSound('success');
  } catch (error) {
    console.error('Logo generation error:', error);
    // Show error to user
  } finally {
    generatingLogo.value = false;
  }
};

const saveCustomization = () => {
  props.next({
    team: {
      ...props.data.team,
      name: teamName.value,
      colors: {
        primary: primaryColor.value,
        secondary: secondaryColor.value,
        primaryName: primaryColorName.value,
        secondaryName: secondaryColorName.value
      }
    },
    customLogoPrompt: customLogoPrompt.value
  });
};

const goBack = () => {
  // If we came from step 1 (skip to customize), go back to step 1
  if (props.data.skipToCustomize) {
    // Reset to step 1
    props.prev();
    props.prev();
  } else {
    props.prev();
  }
};

// Initialize
onMounted(() => {
  // Pre-fill with existing team data
  const team = props.data.team;
  if (team) {
    teamName.value = team.name || '';
    primaryColor.value = team.colors?.primary || '';
    secondaryColor.value = team.colors?.secondary || '';
    primaryColorName.value = team.colors?.primaryName || '';
    secondaryColorName.value = team.colors?.secondaryName || '';
  }
});
</script>

<style scoped>
:deep(.v-card) {
  background-color: rgba(var(--v-theme-surface), 0.9);
}

.v-btn[size="large"] {
  width: 48px;
  height: 48px;
}
</style>