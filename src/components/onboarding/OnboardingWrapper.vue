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
            <slot name="step3" :next="nextStep" :prev="prevStep" :data="onboardingData" />
          </template>
          
          <template v-slot:item.4>
            <slot name="step4" :complete="completeOnboarding" :prev="prevStep" :data="onboardingData" />
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
  regenerateCount: 0
});

// Stepper configuration
const stepperItems = computed(() => [
  {
    title: 'Team Preview',
    subtitle: 'Your generated team'
  },
  {
    title: 'Manager Setup',
    subtitle: 'Your profile'
  },
  {
    title: 'Customize',
    subtitle: 'Make it yours'
  },
  {
    title: 'Complete',
    subtitle: 'Ready to play!'
  }
]);

// Methods
const nextStep = (data = {}) => {
  // Update onboarding data
  Object.assign(onboardingData.value, data);
  
  // Play sound
  soundStore.playSound('pop');
  
  // Move to next step
  if (currentStep.value < 4) {
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

// Expose data and methods for parent component
defineExpose({
  onboardingData,
  currentStep
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