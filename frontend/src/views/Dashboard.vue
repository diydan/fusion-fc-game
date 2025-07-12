<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 text-md-h3 font-weight-bold mb-6">Dashboard</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-text class="text-center py-8">
            <v-icon size="64" color="primary" class="mb-4">mdi-view-dashboard</v-icon>
            <p class="text-h6">Welcome to Fusion FC</p>
            <p class="text-body-2 text-medium-emphasis mt-2 mb-6">Your dashboard content goes here</p>
            
            <div class="d-flex justify-center ga-4 flex-wrap">
              <GameButton
                color="primary"
                prepend-icon="mdi-play"
                label="Start Playing"
                to="/my-games"
                click-sound="coin"
              />
              <GameButton
                color="secondary"
                prepend-icon="mdi-account-group"
                label="View Team"
                to="/my-team"
                click-sound="pop"
              />
              <GameButton
                color="info"
                label="View 3D Buttons"
                to="/buttons"
                click-sound="whoosh"
              />
              <GameButton
                color="warning"
                prepend-icon="mdi-volume-high"
                label="Test Sounds"
                to="/sound-test"
                click-sound="coin"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import GameButton from '@/components/GameButton.vue'
</script>