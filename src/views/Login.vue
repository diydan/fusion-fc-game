<template>
  <v-container fluid class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <div class="text-center mb-8">
          <v-icon size="80" color="primary">mdi-soccer</v-icon>
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
</template>

<script setup>
import LoginForm from '@/components/auth/LoginForm.vue'
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
  background: linear-gradient(135deg, #121212 0%, #1E1E1E 100%);
}
</style>