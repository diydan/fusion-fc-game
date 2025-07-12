<template>
  <div class="spectate-view">
    <v-container v-if="!match" fluid class="fill-height">
      <v-row align="center" justify="center">
        <v-col cols="12" class="text-center">
          <v-progress-circular indeterminate size="64" color="primary" />
          <h2 class="mt-4">Loading match...</h2>
        </v-col>
      </v-row>
    </v-container>
    
    <div v-else class="spectate-container">
      <!-- Spectator HUD -->
      <div class="spectator-hud">
        <v-card class="spectator-banner elevation-4">
          <v-card-text class="pa-2 d-flex align-center">
            <v-icon class="mr-2">mdi-eye</v-icon>
            <span class="font-weight-bold">SPECTATOR MODE</span>
            <v-spacer />
            <v-btn
              icon
              small
              @click="$router.push('/matchmaking')"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-text>
        </v-card>
      </div>
      
      <!-- Game View (reuse H2H component in spectator mode) -->
      <H2HGameView 
        :is-spectator="true"
        :spectator-match="match"
      />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { subscribeToMatch } from '@/services/firebase/matchmaking'
import H2HGameView from './H2HGameView.vue'

export default {
  name: 'SpectateView',
  
  components: {
    H2HGameView
  },
  
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    const match = ref(null)
    const matchUnsubscribe = ref(null)
    
    onMounted(() => {
      const matchId = route.params.matchId
      
      matchUnsubscribe.value = subscribeToMatch(matchId, (matchData) => {
        match.value = matchData
        
        if (!matchData || matchData.status === 'completed') {
          router.push('/matchmaking')
        }
      })
    })
    
    onUnmounted(() => {
      if (matchUnsubscribe.value) {
        matchUnsubscribe.value()
      }
    })
    
    return {
      match
    }
  }
}
</script>

<style scoped>
.spectate-view {
  width: 100%;
  height: 100vh;
  position: relative;
  background-color: #000;
}

.spectate-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.spectator-hud {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  pointer-events: none;
}

.spectator-banner {
  background: rgba(255, 255, 255, 0.9);
  pointer-events: auto;
}
</style>