<template>
  <v-card class="mx-auto pa-6" max-width="420">
    <v-card-title class="text-h5 text-center">
      {{ isSignUp ? 'Create Account' : 'Sign In' }}
    </v-card-title>

    <v-card-text>
      <!-- Social Login Buttons -->
      <GameButton
        block
        color="info"
        prepend-icon="mdi-google"
        label="Continue with Google"
        class="mb-4"
        @click="handleGoogleLogin"
        :loading="loading"
        click-sound="pop"
      />

      <GameButton
        block
        color="primary"
        prepend-icon="mdi-ethereum"
        label="Connect MetaMask"
        class="mb-4"
        @click="handleMetaMaskLogin"
        :loading="loading"
        click-sound="coin"
      />

      <v-divider class="my-6">
        <span class="text-caption">OR</span>
      </v-divider>

      <!-- Email/Password Form -->
      <v-form ref="form" v-model="valid" @submit.prevent="handleEmailAuth">
        <v-text-field
          v-model="email"
          label="Email"
          type="email"
          variant="outlined"
          density="comfortable"
          :rules="emailRules"
          class="mb-3"
        />

        <v-text-field
          v-if="isSignUp"
          v-model="displayName"
          label="Display Name"
          variant="outlined"
          density="comfortable"
          :rules="nameRules"
          class="mb-3"
        />

        <v-text-field
          v-model="password"
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
          v-if="isSignUp"
          v-model="confirmPassword"
          label="Confirm Password"
          :type="showPassword ? 'text' : 'password'"
          variant="outlined"
          density="comfortable"
          :rules="confirmPasswordRules"
          class="mb-4"
        />

        <GameButton
          block
          color="primary"
          :label="isSignUp ? 'Sign Up' : 'Sign In'"
          type="submit"
          :loading="loading"
          :disabled="!valid"
          click-sound="success"
        />
      </v-form>

      <!-- Toggle Sign Up/Sign In -->
      <div class="text-center mt-6">
        <span class="text-body-2">
          {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
        </span>
        <GameButton
          variant="text"
          color="secondary"
          size="small"
          :label="isSignUp ? 'Sign In' : 'Sign Up'"
          @click="isSignUp = !isSignUp"
          click-sound="whoosh"
        />
      </div>

      <!-- Forgot Password -->
      <div v-if="!isSignUp" class="text-center mt-4">
        <GameButton
          variant="text"
          color="info"
          size="small"
          label="Forgot Password?"
          @click="showResetDialog = true"
          click-sound="pop"
        />
      </div>

      <!-- Error Message -->
      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        class="mt-4"
        closable
        @click:close="error = null"
      >
        {{ error }}
      </v-alert>
    </v-card-text>

    <!-- Password Reset Dialog -->
    <v-dialog v-model="showResetDialog" max-width="400">
      <v-card>
        <v-card-title>Reset Password</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="resetEmail"
            label="Email"
            type="email"
            variant="outlined"
            density="comfortable"
            :rules="emailRules"
          />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <GameButton variant="text" label="Cancel" @click="showResetDialog = false" click-sound="pop" class="me-2" />
          <GameButton color="primary" label="Send Reset Email" @click="handlePasswordReset" click-sound="success" />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { signInWithGoogle } from '@/services/auth/google';
import { signInWithEmail, signUpWithEmail, resetPassword } from '@/services/auth/email';
import GameButton from '@/components/GameButton.vue';
import { signInWithMetaMask } from '@/services/auth/metamask';

const router = useRouter();
const userStore = useUserStore();

// Form state
const form = ref(null);
const valid = ref(false);
const loading = ref(false);
const error = ref(null);
const showPassword = ref(false);
const isSignUp = ref(false);
const showResetDialog = ref(false);

// Form fields
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const displayName = ref('');
const resetEmail = ref('');

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
  v => v === password.value || 'Passwords must match'
];

const nameRules = [
  v => !!v || 'Display name is required',
  v => v.length >= 2 || 'Name must be at least 2 characters'
];

// Handlers
const handleEmailAuth = async () => {
  if (!form.value.validate()) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    if (isSignUp.value) {
      const { user, error: signUpError } = await signUpWithEmail(
        email.value, 
        password.value, 
        displayName.value
      );
      
      if (signUpError) throw new Error(signUpError);
      
      // Success message
      error.value = 'Account created! Please check your email to verify your account.';
    } else {
      const { user, error: signInError } = await signInWithEmail(email.value, password.value);
      
      if (signInError) throw new Error(signInError);
      
      // Navigate to dashboard
      router.push('/dashboard');
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const handleGoogleLogin = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const { user, error: googleError } = await signInWithGoogle();
    
    if (googleError) throw new Error(googleError);
    
    // Navigate to dashboard
    router.push('/dashboard');
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const handleMetaMaskLogin = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const { user, address, error: metamaskError } = await signInWithMetaMask();
    
    if (metamaskError) throw new Error(metamaskError);
    
    // The user is now automatically handled by Firebase Auth
    // Just navigate to dashboard
    router.push('/dashboard');
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const handlePasswordReset = async () => {
  if (!resetEmail.value || !/.+@.+\..+/.test(resetEmail.value)) {
    error.value = 'Please enter a valid email';
    return;
  }
  
  loading.value = true;
  
  try {
    const { error: resetError } = await resetPassword(resetEmail.value);
    
    if (resetError) throw new Error(resetError);
    
    showResetDialog.value = false;
    error.value = 'Password reset email sent! Check your inbox.';
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>