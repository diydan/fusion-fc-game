<template>
  <div class="h2h-game-view">
    <!-- Loading State -->
    <v-container v-if="loading" fluid class="fill-height">
      <v-row align="center" justify="center">
        <v-col cols="12" class="text-center">
          <v-progress-circular
            indeterminate
            size="64"
            color="primary"
            class="mb-4"
          />
          <h2>{{ loadingMessage }}</h2>
        </v-col>
      </v-row>
    </v-container>
    
    <!-- Game Container -->
    <div v-else-if="match && gameReady" class="game-container">
      <!-- Game HUD -->
      <div class="game-hud">
        <!-- Score Board -->
        <v-card class="score-board elevation-4">
          <v-card-text class="pa-2">
            <div class="d-flex align-center justify-space-between">
              <!-- Home Team -->
              <div class="team-info text-center">
                <v-avatar size="32" class="mb-1">
                  <v-icon>mdi-account</v-icon>
                </v-avatar>
                <div class="text-body-2 font-weight-bold">{{ homePlayer.displayName }}</div>
                <div class="text-h4 font-weight-bold">{{ gameState?.score?.home || 0 }}</div>
              </div>
              
              <!-- Match Info -->
              <div class="match-info text-center">
                <div class="text-h6 font-weight-bold">
                  {{ formatGameTime(gameState?.time || 0) }}
                </div>
                <div class="text-caption">{{ gameState?.period || 'First Half' }}</div>
                <v-chip 
                  v-if="gameState?.paused" 
                  x-small 
                  color="warning"
                  class="mt-1"
                >
                  PAUSED
                </v-chip>
              </div>
              
              <!-- Away Team -->
              <div class="team-info text-center">
                <v-avatar size="32" class="mb-1">
                  <v-icon>mdi-account</v-icon>
                </v-avatar>
                <div class="text-body-2 font-weight-bold">{{ awayPlayer.displayName }}</div>
                <div class="text-h4 font-weight-bold">{{ gameState?.score?.away || 0 }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
        
        <!-- Game Controls -->
        <div class="game-controls">
          <v-btn
            icon
            small
            @click="togglePause"
          >
            <v-icon>{{ isPaused ? 'mdi-play' : 'mdi-pause' }}</v-icon>
          </v-btn>
          <v-btn
            icon
            small
            @click="toggleSound"
          >
            <v-icon>{{ isMuted ? 'mdi-volume-off' : 'mdi-volume-high' }}</v-icon>
          </v-btn>
          <v-btn
            icon
            small
            color="error"
            @click="showExitDialog = true"
          >
            <v-icon>mdi-exit-to-app</v-icon>
          </v-btn>
        </div>
      </div>
      
      <!-- Game Canvas -->
      <GameCanvas 
        ref="gameCanvas"
        :home-team="homeTeam"
        :away-team="awayTeam"
        :is-multiplayer="true"
        :player-side="playerSide"
        @game-update="handleGameUpdate"
        @game-action="handleGameAction"
      />
    </div>
    
    <!-- Exit Dialog -->
    <v-dialog v-model="showExitDialog" max-width="400">
      <v-card>
        <v-card-title>Leave Match?</v-card-title>
        <v-card-text>
          Are you sure you want to leave this match? This will count as a loss.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="showExitDialog = false">Cancel</v-btn>
          <v-btn color="error" text @click="exitMatch">Leave Match</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import GameCanvas from '@/game/components/GameCanvas.vue'
import { 
  subscribeToMatch, 
  setPlayerReady,
  completeMatch
} from '@/services/firebase/matchmaking'
import {
  subscribeToGameState,
  updateGameState,
  sendGameAction,
  submitTeamLineup
} from '@/services/firebase/gameSync'
import { getUser } from '@/services/database'

export default {
  name: 'H2HGameView',
  
  components: {
    GameCanvas
  },
  
  setup() {
    const route = useRoute()
    const router = useRouter()
    const userStore = useUserStore()
    
    // Refs
    const gameCanvas = ref(null)
    
    // State
    const loading = ref(true)
    const match = ref(null)
    const gameState = ref(null)
    const gameReady = ref(false)
    const showExitDialog = ref(false)
    const isPaused = ref(false)
    const isMuted = ref(false)
    const homeTeam = ref(null)
    const awayTeam = ref(null)
    
    // Subscriptions
    const matchUnsubscribe = ref(null)
    const gameStateUnsubscribe = ref(null)
    
    // Computed
    const matchId = computed(() => route.params.matchId)
    
    const homePlayer = computed(() => {
      if (!match.value) return { displayName: 'Home' }
      return match.value.players[0]
    })
    
    const awayPlayer = computed(() => {
      if (!match.value) return { displayName: 'Away' }
      return match.value.players[1]
    })
    
    const playerSide = computed(() => {
      if (!match.value || !userStore.user) return 'home'
      return match.value.players[0].id === userStore.user.uid ? 'home' : 'away'
    })
    
    const isHomePlayer = computed(() => {
      return userStore.user?.uid === homePlayer.value.id
    })
    
    const loadingMessage = computed(() => {
      if (!match.value) return 'Loading match...'
      if (match.value.status === 'waiting') return 'Waiting for opponent...'
      if (match.value.status === 'starting') return 'Starting match...'
      return 'Initializing game...'
    })
    
    // Methods
    const formatGameTime = (seconds) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    
    const handleGameUpdate = async (update) => {
      if (!userStore.user) return
      await updateGameState(matchId.value, update, userStore.user.uid)
    }
    
    const handleGameAction = async (action) => {
      await sendGameAction(matchId.value, action)
    }
    
    const togglePause = async () => {
      isPaused.value = !isPaused.value
      if (gameCanvas.value) {
        gameCanvas.value.setPaused(isPaused.value)
      }
    }
    
    const toggleSound = () => {
      isMuted.value = !isMuted.value
      if (gameCanvas.value) {
        gameCanvas.value.setMuted(isMuted.value)
      }
    }
    
    const exitMatch = async () => {
      if (match.value && match.value.status === 'active') {
        // Forfeit the match
        const winnerId = match.value.players.find(p => p.id !== userStore.user.uid).id
        await completeMatch(matchId.value, winnerId)
      }
      router.push('/dashboard')
    }
    
    const loadTeamData = async (playerId) => {
      const { data: userData } = await getUser(playerId)
      if (userData && userData.activeTeamId) {
        // TODO: Load team data from teams collection
        return {
          id: userData.activeTeamId,
          name: userData.displayName + "'s Team",
          formation: '1-2-1',
          players: [] // TODO: Load actual squad
        }
      }
      return null
    }
    
    const initializeMatch = async () => {
      loading.value = true
      
      // Subscribe to match updates
      matchUnsubscribe.value = subscribeToMatch(matchId.value, async (matchData) => {
        match.value = matchData
        
        if (!matchData) {
          router.push('/dashboard')
          return
        }
        
        // Handle match status changes
        if (matchData.status === 'starting' && !gameReady.value) {
          // Load team data for both players
          homeTeam.value = await loadTeamData(matchData.players[0].id)
          awayTeam.value = await loadTeamData(matchData.players[1].id)
          
          gameReady.value = true
          loading.value = false
          
          // Subscribe to game state
          gameStateUnsubscribe.value = subscribeToGameState(matchId.value, (state) => {
            gameState.value = state
          })
          
          // Submit team lineup
          if (userStore.user) {
            const myTeam = isHomePlayer.value ? homeTeam.value : awayTeam.value
            if (myTeam) {
              await submitTeamLineup(matchId.value, userStore.user.uid, {
                formation: myTeam.formation,
                players: myTeam.players
              })
            }
          }
        }
        
        // Mark player as ready if not already
        if (matchData.status === 'waiting' && userStore.user) {
          const player = matchData.players.find(p => p.id === userStore.user.uid)
          if (player && !player.ready) {
            await setPlayerReady(matchId.value, userStore.user.uid, true)
          }
        }
        
        // Handle match completion
        if (matchData.status === 'completed') {
          // Show result and redirect
          setTimeout(() => {
            router.push('/dashboard')
          }, 5000)
        }
      })
      
      loading.value = false
    }
    
    // Lifecycle
    onMounted(() => {
      initializeMatch()
    })
    
    onUnmounted(() => {
      if (matchUnsubscribe.value) {
        matchUnsubscribe.value()
      }
      if (gameStateUnsubscribe.value) {
        gameStateUnsubscribe.value()
      }
    })
    
    return {
      // Refs
      gameCanvas,
      
      // State
      loading,
      match,
      gameState,
      gameReady,
      showExitDialog,
      isPaused,
      isMuted,
      homeTeam,
      awayTeam,
      
      // Computed
      homePlayer,
      awayPlayer,
      playerSide,
      isHomePlayer,
      loadingMessage,
      
      // Methods
      formatGameTime,
      handleGameUpdate,
      handleGameAction,
      togglePause,
      toggleSound,
      exitMatch
    }
  }
}
</script>

<style scoped>
.h2h-game-view {
  width: 100%;
  height: 100vh;
  position: relative;
  background-color: #000;
}

.game-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.game-hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  padding: 16px;
  pointer-events: none;
}

.score-board {
  max-width: 600px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  pointer-events: auto;
}

.team-info {
  flex: 1;
}

.match-info {
  flex: 0 0 auto;
  min-width: 120px;
}

.game-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  gap: 8px;
  pointer-events: auto;
}
</style>