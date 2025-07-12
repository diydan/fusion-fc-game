<template>
  <div class="login-page">
    <v-container fluid class="fill-height pa-0">
      <v-row align="center" justify="center" class="fill-height ma-0">
        <v-col cols="12" sm="8" md="6" lg="4" xl="3" class="pa-4">
          <div class="text-center mb-8">
            <v-img
              src="/Fusion-FC-logo.png"
              :width="80"
              :height="80"
              class="mx-auto"
              contain
            />
            <h1 class="text-h3 mt-4">Fusion FC Game</h1>
            <p class="text-subtitle-1 text-medium-emphasis">
              Join the ultimate football gaming experience
            </p>
          </div>

          <login-form />

          <div class="text-center mt-6">
            <p class="text-caption text-medium-emphasis">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import LoginForm from '@/components/auth/LoginForm.vue'
</script>

<style scoped>
.login-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
  background: rgb(var(--v-theme-background));
}

.fill-height {
  min-height: 100vh;
  height: 100vh;
}

/* Ensure proper spacing and centering */
.v-container {
  max-width: none !important;
}

.v-row {
  height: 100%;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .login-page .v-col {
    padding: 1rem;
  }

  .text-h3 {
    font-size: 2rem !important;
  }
}

@media (min-width: 1920px) {
  .v-col {
    max-width: 400px;
  }
}
</style>