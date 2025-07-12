<template>
  <v-card flat>
    <v-card-title class="text-center">
      <h2 class="text-h4">Manager Profile</h2>
    </v-card-title>
    
    <v-card-subtitle class="text-center text-body-1 mb-4">
      Tell us about yourself
    </v-card-subtitle>

    <v-card-text>
      <v-form ref="form" v-model="valid" @submit.prevent="submitManager">
        <!-- Manager Name -->
        <v-text-field
          v-model="managerName"
          label="Manager Name"
          placeholder="Enter your name"
          variant="outlined"
          density="comfortable"
          :rules="nameRules"
          class="mb-4"
          prepend-inner-icon="mdi-account"
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

                <!-- Generate default -->
                <v-list-item
                  @click="generateDefaultAvatar"
                  :active="avatarSource === 'generated'"
                >
                  <template v-slot:prepend>
                    <v-icon>mdi-robot</v-icon>
                  </template>
                  <v-list-item-title>Generate avatar from initials</v-list-item-title>
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

        <!-- Team Preview -->
        <team-preview
          :team="data.team"
          :manager-name="managerName"
          :logo-size="120"
          :show-jerseys="false"
          :elevation="0"
          class="mb-4"
        />

        <!-- Navigation Buttons -->
        <v-row>
          <v-col cols="6">
            <game-button
              block
              variant="outlined"
              label="Back"
              prepend-icon="mdi-arrow-left"
              @click="goBack"
              click-sound="pop"
            />
          </v-col>
          <v-col cols="6">
            <game-button
              block
              color="primary"
              label="Continue"
              append-icon="mdi-arrow-right"
              type="submit"
              :disabled="!valid || !managerName"
              click-sound="success"
            />
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import TeamPreview from './TeamPreview.vue';
import GameButton from '@/components/GameButton.vue';

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

// Form state
const form = ref(null);
const valid = ref(false);
const managerName = ref('');
const email = ref('');
const avatarFile = ref(null);
const avatarSource = ref('existing');
const currentAvatar = ref(null);

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
  v => !!v || 'Manager name is required',
  v => v.length >= 2 || 'Name must be at least 2 characters',
  v => v.length <= 50 || 'Name must be less than 50 characters'
];

const emailRules = [
  v => !!v || 'Email is required',
  v => /.+@.+\..+/.test(v) || 'Email must be valid'
];

// Methods
const useExistingAvatar = () => {
  avatarSource.value = 'existing';
  currentAvatar.value = existingAvatar.value;
};

const generateDefaultAvatar = () => {
  if (!managerName.value) return;
  
  avatarSource.value = 'generated';
  const initials = managerName.value
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  // Create SVG avatar
  const svg = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="${props.data.team.colors.primary}" />
      <text x="100" y="120" font-family="Arial, sans-serif" font-size="80" font-weight="bold" 
            text-anchor="middle" fill="white">
        ${initials}
      </text>
    </svg>
  `;
  
  currentAvatar.value = `data:image/svg+xml;base64,${btoa(svg)}`;
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

const submitManager = () => {
  if (!form.value.validate()) return;
  
  props.next({
    manager: {
      name: managerName.value,
      avatar: currentAvatar.value,
      avatarSource: avatarSource.value,
      avatarFile: avatarFile.value,
      email: email.value
    }
  });
};

const goBack = () => {
  props.prev();
};

// Initialize
onMounted(() => {
  // Pre-fill with existing data
  if (props.data.manager?.name) {
    managerName.value = props.data.manager.name;
    email.value = props.data.manager.email || '';
    currentAvatar.value = props.data.manager.avatar;
  } else {
    // Use existing user data
    managerName.value = userStore.displayName || '';
    email.value = userStore.currentUser?.email || '';
    if (existingAvatar.value) {
      useExistingAvatar();
    }
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