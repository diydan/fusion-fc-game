<template>
  <v-container fluid class="fill-height pa-0">
    <floating-orbs />
    
    <v-row align="center" justify="center" class="fill-height">
      <v-col cols="12" sm="10" md="8" lg="6" xl="5">
        <!-- Progress Stepper -->
        <v-stepper
          v-model="currentStep"
          :items="stepperItems"
          :mobile="mobile"
          flat
          hide-actions
          class="mb-6"
        >
          <template v-slot:item.1>
            <slot name="step1" :next="nextStep" :data="onboardingData" />
          </template>
          
          <template v-slot:item.2>
            <slot name="step2" :next="nextStep" :prev="prevStep" :data="onboardingData" />
          </template>
          
          <template v-slot:item.3>
            <slot name="step3" :complete="completeOnboarding" :prev="prevStep" :data="onboardingData" />
          </template>
          
        </v-stepper>
      </v-col>
    </v-row>

    <!-- Loading Overlay -->
    <v-overlay
      v-model="saving"
      persistent
      class="align-center justify-center"
    >
      <v-progress-circular
        indeterminate
        size="64"
        color="primary"
        class="mb-4"
      />
      <p class="text-h6">Creating your team...</p>
    </v-overlay>

    <!-- Error Snackbar -->
    <v-snackbar
      v-model="showError"
      :timeout="5000"
      color="error"
      location="top"
    >
      {{ errorMessage }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="showError = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useDisplay } from 'vuetify';
import { useSoundStore } from '@/stores/sound';
import { generateRandomTeam } from '@/services/team-generator';
import { generateTeamLogo } from '@/services/logo-generator';

const emit = defineEmits(['complete', 'step-change']);

const props = defineProps({
  initialStep: {
    type: Number,
    default: 1
  }
});

const { mobile } = useDisplay();
const soundStore = useSoundStore();

// State
const currentStep = ref(props.initialStep);
const saving = ref(false);
const showError = ref(false);
const errorMessage = ref('');

// Onboarding data that persists between steps
const onboardingData = ref({
  team: {
    name: '',
    colors: {
      primary: '',
      secondary: '',
      primaryName: '',
      secondaryName: ''
    },
    logo: null,
    tempLogo: null,
    logoPrompt: ''
  },
  manager: {
    name: '',
    avatar: null,
    email: ''
  },
  location: null,
  customLogoPrompt: '',
  regenerateCount: 0,
  preGeneratedTeam: null
});

// Stepper configuration
const stepperItems = computed(() => [
  {
    title: 'Team Generation',
    subtitle: 'Your team awaits'
  },
  {
    title: 'Manager Setup',
    subtitle: 'Your profile'
  },
  {
    title: 'Ready to Recruit',
    subtitle: 'Build your squad!'
  }
]);

// Methods
const nextStep = (data = {}) => {
  // Update onboarding data
  Object.assign(onboardingData.value, data);
  
  // If we have pre-generated team data from the step, use it instead of wrapper's
  if (data.preGeneratedTeam) {
    onboardingData.value.preGeneratedTeam = data.preGeneratedTeam;
  }
  
  // Play sound
  soundStore.playSound('pop');
  
  // Move to next step
  if (currentStep.value < 3) {
    currentStep.value++;
    emit('step-change', currentStep.value);
  }
};

const prevStep = () => {
  // Play sound
  soundStore.playSound('pop');
  
  // Move to previous step
  if (currentStep.value > 1) {
    currentStep.value--;
    emit('step-change', currentStep.value);
  }
};

const completeOnboarding = async () => {
  saving.value = true;
  
  try {
    // Play success sound
    soundStore.playSound('success');
    
    // Emit complete event with all data
    emit('complete', onboardingData.value);
  } catch (error) {
    console.error('Onboarding error:', error);
    errorMessage.value = error.message || 'Failed to complete onboarding';
    showError.value = true;
    saving.value = false;
  }
};

// Pre-generate team data in the background as soon as onboarding starts
const preGenerateTeamData = async () => {
  console.log('🚀 Pre-generating team data in background immediately...');
  
  try {
    // Generate the basic team structure
    const randomTeam = generateRandomTeam();
    
    // Store it temporarily
    onboardingData.value.preGeneratedTeam = {
      ...randomTeam,
      logo: null,
      tempLogo: null
    };
    
    console.log('✅ Basic team data pre-generated:', randomTeam.name);
    
    // Start logo generation in the background (don't await)
    generateTeamLogoAsync(randomTeam);
    
  } catch (error) {
    console.error('Team pre-generation error:', error);
    // Don't throw - this is background work
  }
};

// Generate logo asynchronously in the background
const generateTeamLogoAsync = async (team) => {
  console.log('🎨 Starting background logo generation for:', team.name);
  
  try {
    const { tempLogoUrl, prompt, error: logoError } = await generateTeamLogo(
      team.name,
      team.colors
    );
    
    if (logoError) {
      console.warn('Logo pre-generation failed:', logoError);
      return;
    }
    
    // Update the pre-generated team data if it still exists
    if (onboardingData.value.preGeneratedTeam && 
        onboardingData.value.preGeneratedTeam.name === team.name) {
      onboardingData.value.preGeneratedTeam.logo = tempLogoUrl;
      onboardingData.value.preGeneratedTeam.tempLogo = tempLogoUrl;
      onboardingData.value.preGeneratedTeam.logoPrompt = prompt;
      console.log('✅ Logo pre-generated successfully for:', team.name);
    }
  } catch (error) {
    console.error('Logo generation error:', error);
    // Don't throw - this is background work
  }
};

// Start pre-generation on mount
onMounted(() => {
  // Start pre-generation immediately
  preGenerateTeamData();
});

// Expose data and methods for parent component
defineExpose({
  onboardingData,
  currentStep,
  nextStep,
  prevStep,
  completeOnboarding
});
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}

:deep(.v-stepper) {
  background-color: transparent !important;
}

:deep(.v-stepper-header) {
  box-shadow: none !important;
  margin-bottom: 32px;
}

:deep(.v-stepper-item) {
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

:deep(.v-stepper-item--selected) {
  opacity: 1;
}

:deep(.v-stepper-item__avatar) {
  background-color: rgba(var(--v-theme-primary), 0.2) !important;
}

:deep(.v-stepper-item--selected .v-stepper-item__avatar) {
  background-color: rgb(var(--v-theme-primary)) !important;
}
</style>