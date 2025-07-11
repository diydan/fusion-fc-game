<template>
  <v-container fluid class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" class="text-center">
        <v-icon size="120" color="primary" class="mb-4">mdi-soccer-field</v-icon>
        
        <h1 class="text-h2 mb-4">404</h1>
        
        <p class="text-h5 mb-6 text-medium-emphasis">
          Oops! This page is out of bounds
        </p>
        
        <p class="text-body-1 mb-8 text-medium-emphasis">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <v-btn
          color="primary"
          size="large"
          to="/"
          prepend-icon="mdi-home"
        >
          Back to Dashboard
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.fill-height {
  min-height: calc(100vh - 64px);
}
</style>