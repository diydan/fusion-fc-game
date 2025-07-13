<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 text-md-h3 font-weight-bold mb-6">Settings</h1>
      </v-col>
    </v-row>

    <v-row>
      <!-- Account Settings -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon start>mdi-account-circle</v-icon>
            Account Settings
          </v-card-title>
          
          <v-card-text>
            <!-- Current Authentication Methods -->
            <div class="mb-6">
              <p class="text-subtitle-2 mb-3">Current Authentication Methods</p>
              
              <v-chip-group>
                <v-chip v-if="providers.email" color="success" variant="tonal">
                  <v-icon start size="small">mdi-email</v-icon>
                  Email & Password
                </v-chip>
                <v-chip v-if="providers.google" color="info" variant="tonal">
                  <v-icon start size="small">mdi-google</v-icon>
                  Google
                </v-chip>
                <v-chip v-if="providers.metamask" color="primary" variant="tonal">
                  <v-icon start size="small">mdi-ethereum</v-icon>
                  MetaMask
                </v-chip>
              </v-chip-group>
            </div>

            <!-- Link Additional Methods -->
            <div class="mb-6">
              <p class="text-subtitle-2 mb-3">Link Additional Methods</p>
              
              <!-- Link Email/Password -->
              <v-card v-if="!providers.email" variant="outlined" class="mb-3">
                <v-card-text>
                  <div class="d-flex align-center justify-space-between">
                    <div>
                      <p class="text-body-1 font-weight-medium">
                        <v-icon start size="small">mdi-email</v-icon>
                        Email & Password
                      </p>
                      <p class="text-caption text-medium-emphasis">Add email and password login</p>
                    </div>
                    <GameButton
                      color="primary"
                      size="small"
                      label="Add"
                      @click="showEmailDialog = true"
                      click-sound="pop"
                    />
                  </div>
                </v-card-text>
              </v-card>

              <!-- Link Google -->
              <v-card v-if="!providers.google" variant="outlined" class="mb-3">
                <v-card-text>
                  <div class="d-flex align-center justify-space-between">
                    <div>
                      <p class="text-body-1 font-weight-medium">
                        <v-icon start size="small">mdi-google</v-icon>
                        Google Account
                      </p>
                      <p class="text-caption text-medium-emphasis">Link your Google account</p>
                    </div>
                    <GameButton
                      color="info"
                      size="small"
                      label="Link"
                      @click="handleLinkGoogle"
                      :loading="loading.google"
                      click-sound="pop"
                    />
                  </div>
                </v-card-text>
              </v-card>

              <!-- Link MetaMask -->
              <v-card v-if="!providers.metamask" variant="outlined" class="mb-3">
                <v-card-text>
                  <div class="d-flex align-center justify-space-between">
                    <div>
                      <p class="text-body-1 font-weight-medium">
                        <v-icon start size="small">mdi-ethereum</v-icon>
                        MetaMask Wallet
                      </p>
                      <p class="text-caption text-medium-emphasis">Link your MetaMask wallet</p>
                    </div>
                    <GameButton
                      color="primary"
                      size="small"
                      label="Connect"
                      @click="handleLinkMetaMask"
                      :loading="loading.metamask"
                      click-sound="coin"
                    />
                  </div>
                </v-card-text>
              </v-card>
            </div>

            <!-- Account Info -->
            <div>
              <p class="text-subtitle-2 mb-3">Account Information</p>
              <v-list density="compact">
                <v-list-item v-if="userStore.currentUser?.email">
                  <template v-slot:prepend>
                    <v-icon size="small">mdi-email</v-icon>
                  </template>
                  <v-list-item-title>{{ userStore.currentUser.email }}</v-list-item-title>
                </v-list-item>
                <v-list-item v-if="userStore.userProfile?.walletAddress">
                  <template v-slot:prepend>
                    <v-icon size="small">mdi-ethereum</v-icon>
                  </template>
                  <v-list-item-title>
                    {{ userStore.userProfile.walletAddress.slice(0, 6) }}...{{ userStore.userProfile.walletAddress.slice(-4) }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Preferences -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon start>mdi-tune</v-icon>
            Preferences
          </v-card-title>
          <v-card-text>
            <v-switch
              v-model="soundEnabled"
              label="Sound Effects"
              color="primary"
              hide-details
              class="mb-4"
            />
            <v-switch
              v-model="notificationsEnabled"
              label="Notifications"
              color="primary"
              hide-details
              class="mb-4"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- Account Reset -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon start>mdi-delete-forever</v-icon>
            Reset Account
          </v-card-title>
          <v-card-text>

            
            <GameButton
              color="error"
              variant="outlined"
              label="Reset Account"
              prepend-icon="mdi-delete-forever"
              @click="showResetDialog = true"
              click-sound="error"
              block
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Success/Error Alerts -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="top"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>

    <!-- Email/Password Dialog -->
    <v-dialog v-model="showEmailDialog" max-width="500">
      <v-card>
        <v-card-title>Add Email & Password</v-card-title>
        <v-card-text>
          <v-form ref="emailForm" v-model="emailFormValid">
            <v-text-field
              v-model="newEmail"
              label="Email"
              type="email"
              variant="outlined"
              density="comfortable"
              :rules="emailRules"
              class="mb-3"
            />
            <v-text-field
              v-model="newPassword"
              label="Password"
              :type="showPassword ? 'text' : 'password'"
              variant="outlined"
              density="comfortable"
              :rules="passwordRules"
              :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
              @click:append-inner="showPassword = !showPassword"
              class="mb-3"
            />
            <v-text-field
              v-model="confirmPassword"
              label="Confirm Password"
              :type="showPassword ? 'text' : 'password'"
              variant="outlined"
              density="comfortable"
              :rules="confirmPasswordRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <GameButton
            variant="text"
            label="Cancel"
            @click="closeEmailDialog"
            click-sound="pop"
          />
          <GameButton
            color="primary"
            label="Add Email"
            :disabled="!emailFormValid"
            :loading="loading.email"
            @click="handleLinkEmail"
            click-sound="success"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Reset Account Dialog -->
    <v-dialog v-model="showResetDialog" max-width="500">
      <v-card>
        <v-card-title class="text-error">
          <v-icon start>mdi-alert-circle</v-icon>
          Confirm Account Reset
        </v-card-title>
        <v-card-text>
          <v-alert
            type="error"
            variant="tonal"
            class="mb-4"
          >
            <v-alert-title>Final Warning</v-alert-title>
            You are about to permanently delete ALL your game progress. This includes your manager profile, team, players, achievements, and all game data.
          </v-alert>
          
          <p class="text-body-1 mb-4">
            To confirm this action, please type <strong>"DELETE MY ACCOUNT"</strong> below:
          </p>
          
          <v-text-field
            v-model="resetConfirmation"
            label="Type DELETE MY ACCOUNT to confirm"
            variant="outlined"
            density="comfortable"
            :error="resetConfirmation !== '' && resetConfirmation !== 'DELETE MY ACCOUNT'"
            :error-messages="resetConfirmation !== '' && resetConfirmation !== 'DELETE MY ACCOUNT' ? 'Please type exactly: DELETE MY ACCOUNT' : ''"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <GameButton
            variant="text"
            label="Cancel"
            @click="closeResetDialog"
            click-sound="pop"
          />
          <GameButton
            color="error"
            label="Delete Everything"
            :disabled="resetConfirmation !== 'DELETE MY ACCOUNT'"
            :loading="loading.reset"
            @click="handleResetAccount"
            click-sound="error"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import GameButton from '@/components/GameButton.vue';
import { 
  linkEmailPassword, 
  linkGoogleAccount, 
  linkMetaMaskWallet,
  getUserProviders 
} from '@/services/auth/account-linking';

const userStore = useUserStore();
const router = useRouter();

// State
const providers = ref({
  email: false,
  google: false,
  metamask: false
});

const loading = ref({
  email: false,
  google: false,
  metamask: false,
  reset: false
});

const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
});

// Email form
const showEmailDialog = ref(false);
const emailForm = ref(null);
const emailFormValid = ref(false);
const newEmail = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);

// Reset form
const showResetDialog = ref(false);
const resetConfirmation = ref('');

// Preferences
const soundEnabled = ref(true);
const notificationsEnabled = ref(true);
const theme = ref('dark');

// Validation rules
const emailRules = [
  v => !!v || 'Email is required',
  v => /.+@.+\..+/.test(v) || 'Email must be valid'
];

const passwordRules = [
  v => !!v || 'Password is required',
  v => v.length >= 6 || 'Password must be at least 6 characters'
];

const confirmPasswordRules = [
  v => !!v || 'Please confirm your password',
  v => v === newPassword.value || 'Passwords must match'
];

// Methods
const loadProviders = async () => {
  if (userStore.currentUser) {
    const userProviders = await getUserProviders(userStore.currentUser.uid);
    providers.value = {
      email: userProviders.email || false,
      google: userProviders.google || false,
      metamask: userProviders.metamask || false
    };
    
    // Also check current auth method
    if (userStore.authMethod === 'email') providers.value.email = true;
    if (userStore.authMethod === 'google') providers.value.google = true;
    if (userStore.authMethod === 'metamask') providers.value.metamask = true;
  }
};

const handleLinkEmail = async () => {
  if (!emailForm.value.validate()) return;
  
  loading.value.email = true;
  
  try {
    const { error } = await linkEmailPassword(newEmail.value, newPassword.value);
    
    if (error) throw new Error(error);
    
    providers.value.email = true;
    showSnackbar('Email and password added successfully!', 'success');
    closeEmailDialog();
  } catch (error) {
    showSnackbar(error.message, 'error');
  } finally {
    loading.value.email = false;
  }
};

const handleLinkGoogle = async () => {
  loading.value.google = true;
  
  try {
    const { error } = await linkGoogleAccount();
    
    if (error) throw new Error(error);
    
    providers.value.google = true;
    showSnackbar('Google account linked successfully!', 'success');
  } catch (error) {
    showSnackbar(error.message, 'error');
  } finally {
    loading.value.google = false;
  }
};

const handleLinkMetaMask = async () => {
  loading.value.metamask = true;
  
  try {
    const { error } = await linkMetaMaskWallet();
    
    if (error) throw new Error(error);
    
    providers.value.metamask = true;
    showSnackbar('MetaMask wallet linked successfully!', 'success');
    await userStore.fetchUserProfile(userStore.currentUser.uid);
  } catch (error) {
    showSnackbar(error.message, 'error');
  } finally {
    loading.value.metamask = false;
  }
};

const closeEmailDialog = () => {
  showEmailDialog.value = false;
  newEmail.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
  showPassword.value = false;
};

const handleResetAccount = async () => {
  if (resetConfirmation.value !== 'DELETE MY ACCOUNT') {
    return;
  }

  loading.value.reset = true;

  try {
    // Reset onboarding status and clear all user data
    await userStore.resetAccount();
    
    showSnackbar('Account reset successfully! Redirecting to onboarding...', 'success');
    
    // Close dialog
    closeResetDialog();
    
    // Force navigation to onboarding
    // Use replace to avoid back button issues
    await router.replace('/onboarding');
    
  } catch (error) {
    console.error('Failed to reset account:', error);
    showSnackbar('Failed to reset account. Please try again.', 'error');
  } finally {
    loading.value.reset = false;
  }
};

const closeResetDialog = () => {
  showResetDialog.value = false;
  resetConfirmation.value = '';
};

const showSnackbar = (text, color = 'success') => {
  snackbar.value = { show: true, text, color };
};

// Lifecycle
onMounted(() => {
  loadProviders();
});
</script>