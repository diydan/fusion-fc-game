<template>
  <v-card flat>
    <v-card-title class="text-center">
      <h2 class="text-h4 mb-2">🎉 Congratulations!</h2>
      <p class="text-h6 font-weight-regular">You've been hired as a new manager to Fusion FC</p>
    </v-card-title>
    
    <v-card-subtitle class="text-center text-body-1 mb-4">
      Let's set up your manager profile
    </v-card-subtitle>

    <v-card-text>
      <v-form ref="form" v-model="valid" @submit.prevent="submitManager">
        <!-- Manager Name (Wallet Address) -->
        <v-text-field
          v-model="managerName"
          label="Manager ID (Wallet Address)"
          placeholder="Your wallet address"
          variant="outlined"
          density="comfortable"
          readonly
          :rules="nameRules"
          class="mb-4"
          prepend-inner-icon="mdi-wallet"
          hint="Your unique manager identifier from your wallet"
          persistent-hint
        />

        <!-- Email (for wallet users) -->
        <v-text-field
          v-if="needsEmail"
          v-model="email"
          label="Email Address"
          placeholder="your@email.com"
          type="email"
          variant="outlined"
          density="comfortable"
          :rules="emailRules"
          class="mb-4"
          prepend-inner-icon="mdi-email"
          hint="We'll use this to send important updates"
          persistent-hint
        />

        <!-- Manager Bio -->
        <v-textarea
          v-model="managerBio"
          label="Manager Bio"
          placeholder="Tell us about your football management style..."
          variant="outlined"
          density="comfortable"
          rows="3"
          :rules="bioRules"
          class="mb-4"
          prepend-inner-icon="mdi-account-edit"
          hint="Describe your management philosophy and experience"
          persistent-hint
        >
          <template v-slot:append-inner>
            <v-btn
              icon
              size="small"
              variant="text"
              @click="generateRandomBio"
              :disabled="generatingBio"
            >
              <v-icon size="small">{{ generatingBio ? 'mdi-loading mdi-spin' : 'mdi-dice-6' }}</v-icon>
              <v-tooltip activator="parent" location="top">Generate Random Bio</v-tooltip>
            </v-btn>
          </template>
        </v-textarea>

        <!-- Avatar Selection -->
        <div class="mb-6">
          <p class="text-subtitle-2 mb-3">Manager Avatar</p>
          
          <v-row>
            <!-- Current Avatar -->
            <v-col cols="12" sm="4" class="text-center">
              <v-avatar size="120" class="mb-2">
                <v-img 
                  v-if="currentAvatar" 
                  :src="currentAvatar"
                  :alt="managerName"
                />
                <v-icon v-else size="80">mdi-account-circle</v-icon>
              </v-avatar>
              <p class="text-caption">Current Avatar</p>
            </v-col>

            <!-- Avatar Options -->
            <v-col cols="12" sm="8">
              <v-list density="compact">
                <!-- Use existing avatar -->
                <v-list-item
                  v-if="existingAvatar"
                  @click="useExistingAvatar"
                  :active="avatarSource === 'existing'"
                >
                  <template v-slot:prepend>
                    <v-icon>mdi-check-circle</v-icon>
                  </template>
                  <v-list-item-title>Use {{ authMethod }} avatar</v-list-item-title>
                </v-list-item>


                <!-- Generate AI avatar -->
                <v-list-item
                  @click="generateAIAvatar"
                  :active="avatarSource === 'ai-generated'"
                  :disabled="generatingAvatar || !managerName"
                >
                  <template v-slot:prepend>
                    <v-icon>{{ generatingAvatar ? 'mdi-loading mdi-spin' : 'mdi-face-man' }}</v-icon>
                  </template>
                  <v-list-item-title>
                    {{ generatingAvatar ? 'Generating...' : 'Generate AI manager portrait' }}
                  </v-list-item-title>
                </v-list-item>

                <!-- Upload custom -->
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon>mdi-upload</v-icon>
                  </template>
                  <v-list-item-title>
                    <v-file-input
                      v-model="avatarFile"
                      label="Upload custom avatar"
                      density="compact"
                      variant="outlined"
                      accept="image/*"
                      prepend-icon=""
                      hide-details
                      @update:model-value="handleAvatarUpload"
                    />
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </div>

        <!-- Team Preview (hidden - will be shown after manager setup) -->

        <!-- Navigation Buttons -->
        <v-row justify="center">
          <v-col cols="12" sm="6">
            <game-button
              block
              color="success"
              size="large"
              label="Next"
              append-icon="mdi-arrow-right"
              type="submit"
              :disabled="!valid || !managerName || !managerBio"
              click-sound="success"
            />
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useUserStore } from '@/stores/user';
import TeamPreview from './TeamPreview.vue';
import GameButton from '@/components/GameButton.vue';
import { generateTeamLogoWithProxy } from '@/services/logo-generator-proxy';
import { generateRandomTeam } from '@/services/team-generator';
import { generateTeamLogo } from '@/services/logo-generator';

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

const userStore = useUserStore();

// Random bio snippets for manager profiles
const BIO_SNIPPETS = [
  "Tactical genius with a passion for attacking football and developing young talent through innovative training methods.",
  "Experienced leader who believes in building team chemistry and fostering a winning mentality both on and off the pitch.",
  "Strategic thinker focused on possession-based football with emphasis on quick passing and high-pressing defensive systems.",
  "Motivational coach known for adapting tactics to opponent weaknesses while maximizing each player's individual strengths.",
  "Results-driven manager with expertise in player development and creating cohesive team dynamics under pressure.",
  "Innovative tactician who combines traditional football wisdom with modern data analytics to gain competitive advantages.",
  "Inspirational leader committed to fair play, disciplined training, and building championship-caliber teams through dedication.",
  "Versatile coach experienced in multiple formations, specializing in counter-attacking football and set-piece excellence.",
  "Player-focused manager who prioritizes mental health, fitness optimization, and creating supportive team environments.",
  "Championship-minded strategist with proven ability to identify talent and transform underperforming teams into winners."
];

// Form state
const form = ref(null);
const valid = ref(false);
const managerName = ref('');
const email = ref('');
const managerBio = ref('');
const avatarFile = ref(null);
const avatarSource = ref('existing');
const currentAvatar = ref(null);
const generatingAvatar = ref(false);
const generatingBio = ref(false);

// Pre-generation for next step
const preGeneratingTeam = ref(false);
const preGeneratedTeam = ref(null);

// Computed
const needsEmail = computed(() => {
  return userStore.authMethod === 'metamask' && !userStore.currentUser?.email;
});

const authMethod = computed(() => {
  const methods = {
    google: 'Google',
    email: 'Email',
    metamask: 'MetaMask'
  };
  return methods[userStore.authMethod] || 'Account';
});

const existingAvatar = computed(() => {
  return userStore.currentUser?.photoURL || userStore.avatarUrl;
});

// Validation rules
const nameRules = [
  v => !!v || 'Manager ID is required',
  v => v.length >= 10 || 'Manager ID must be at least 10 characters',
  v => v.length <= 100 || 'Manager ID must be less than 100 characters'
];

const emailRules = [
  v => !!v || 'Email is required',
  v => /.+@.+\..+/.test(v) || 'Email must be valid'
];

const bioRules = [
  v => !!v || 'Bio is required',
  v => v.length >= 20 || 'Bio must be at least 20 characters',
  v => v.length <= 500 || 'Bio must be less than 500 characters'
];

// Methods
const useExistingAvatar = () => {
  avatarSource.value = 'existing';
  currentAvatar.value = existingAvatar.value;
};

const generateRandomBio = () => {
  generatingBio.value = true;
  
  // Simulate a brief loading time for better UX
  setTimeout(() => {
    const randomIndex = Math.floor(Math.random() * BIO_SNIPPETS.length);
    managerBio.value = BIO_SNIPPETS[randomIndex];
    generatingBio.value = false;
  }, 500);
};

const handleAvatarUpload = (file) => {
  if (!file) return;
  
  avatarSource.value = 'uploaded';
  const reader = new FileReader();
  reader.onload = (e) => {
    currentAvatar.value = e.target.result;
  };
  reader.readAsDataURL(file);
};

const generateAIAvatar = async () => {
  if (!managerName.value || generatingAvatar.value) return;
  
  generatingAvatar.value = true;
  avatarSource.value = 'ai-generated';
  
  try {
    const { tempLogoUrl, error } = await generateTeamLogoWithProxy(
      managerName.value,
      { primary: '#1976D2', secondary: '#424242' }, // Default colors for manager
      'professional football manager profile picture, realistic portrait, business attire, confident expression'
    );
    
    if (error) {
      throw new Error(error);
    }
    
    currentAvatar.value = tempLogoUrl;
  } catch (err) {
    console.error('Avatar generation error:', err);
    // Fallback to initials if AI generation fails
    generateDefaultAvatar();
  } finally {
    generatingAvatar.value = false;
  }
};

const submitManager = () => {
  if (!form.value.validate()) return;
  
  props.next({
    manager: {
      name: managerName.value,
      bio: managerBio.value,
      avatar: currentAvatar.value,
      avatarSource: avatarSource.value,
      avatarFile: avatarFile.value,
      email: email.value
    },
    // Include pre-generated team data if available
    preGeneratedTeam: preGeneratedTeam.value
  });
};

// Pre-generate team data in background when form is valid
const preGenerateTeamData = async () => {
  if (preGeneratingTeam.value || preGeneratedTeam.value) return;
  
  console.log('🚀 Pre-generating team data in background...');
  preGeneratingTeam.value = true;
  
  try {
    // Generate the basic team structure
    const randomTeam = generateRandomTeam();
    
    // Add manager data to team context
    const teamWithManager = {
      ...randomTeam,
      manager: {
        name: managerName.value,
        bio: managerBio.value,
        avatar: {
          url: currentAvatar.value,
          source: avatarSource.value
        },
        // Starting manager stats
        experience: 0, // Zero XP as default
        reputation: 'Amateur', // Amateur rank as default
        personality: 'Ambitious', // Default personality for new managers
        specialties: ['Learning', 'Development'] // Default specialties for new managers
      },
      stadium: {
        name: `${randomTeam.location || 'City'} Stadium`,
        capacity: Math.floor(Math.random() * 50000) + 20000, // 20k-70k capacity
        atmosphere: Math.floor(Math.random() * 20) + 80 // 80-100% atmosphere
      },
      logo: null,
      tempLogo: null
    };
    
    // Start logo generation (this is the slow part)
    try {
      const { tempLogoUrl, prompt, error: logoError } = await generateTeamLogo(
        randomTeam.name,
        randomTeam.colors
      );
      
      if (!logoError && tempLogoUrl) {
        teamWithManager.logo = tempLogoUrl;
        teamWithManager.tempLogo = tempLogoUrl;
        teamWithManager.logoPrompt = prompt;
        console.log('✅ Team logo pre-generated successfully');
      }
    } catch (logoError) {
      console.warn('Logo pre-generation failed:', logoError);
      // Will generate fallback on team page
    }
    
    preGeneratedTeam.value = teamWithManager;
    console.log('✅ Team data pre-generation complete');
    
  } catch (error) {
    console.error('Team pre-generation error:', error);
  } finally {
    preGeneratingTeam.value = false;
  }
};

const goBack = () => {
  props.prev();
};

// Watch for form completion to trigger pre-generation
watch([managerName, managerBio, currentAvatar], ([name, bio, avatar]) => {
  // Trigger pre-generation when we have the essential data
  if (name && bio && avatar && name.length >= 2 && bio.length >= 20) {
    // Debounce to avoid multiple triggers
    setTimeout(() => {
      preGenerateTeamData();
    }, 1000);
  }
}, { immediate: false });

// Initialize
onMounted(() => {
  // Pre-fill with existing data
  if (props.data.manager?.name) {
    managerName.value = props.data.manager.name;
    managerBio.value = props.data.manager.bio || '';
    email.value = props.data.manager.email || '';
    currentAvatar.value = props.data.manager.avatar;
  } else {
    // Use wallet address as manager name (required field)
    if (userStore.authMethod === 'metamask' && userStore.walletAddress) {
      managerName.value = userStore.walletAddress;
    } else if (userStore.currentUser?.uid) {
      // For non-wallet users, use their UID as the manager ID
      managerName.value = userStore.currentUser.uid;
    }
    
    email.value = userStore.currentUser?.email || '';
    if (existingAvatar.value) {
      useExistingAvatar();
    }
    
    // Generate a random bio on first load
    generateRandomBio();
  }
});
</script>

<style scoped>
:deep(.v-card) {
  background-color: rgba(var(--v-theme-surface), 0.9);
}

.v-avatar {
  border: 3px solid rgb(var(--v-theme-primary));
}
</style>