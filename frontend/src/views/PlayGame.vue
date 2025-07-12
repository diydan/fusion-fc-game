<template>
  <v-container fluid class="play-game-container">
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <div>
              <h2>Fusion FC Game</h2>
              <p class="text-subtitle-1">{{ matchType }}</p>
            </div>
            <v-btn
              icon="mdi-close"
              @click="exitGame"
              variant="text"
            />
          </v-card-title>
          
          <v-card-text>
            <GameCanvas
              :home-team-name="homeTeam.name"
              :away-team-name="awayTeam.name"
              :home-formation="homeTeam.formation"
              :away-formation="awayTeam.formation"
              :home-tactic="homeTeam.tactic"
              :away-tactic="awayTeam.tactic"
              @game-over="handleGameOver"
              @update-stats="updateGameStats"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Team Selection Dialog -->
    <v-dialog v-model="showTeamSelection" persistent max-width="800px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Game Setup</span>
        </v-card-title>
        
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12" md="6">
                <h3 class="mb-3">Home Team</h3>
                <v-select
                  v-model="homeTeam.formation"
                  :items="formations"
                  label="Formation"
                  item-title="label"
                  item-value="value"
                />
                <v-select
                  v-model="homeTeam.tactic"
                  :items="tactics"
                  label="Tactic"
                  item-title="label"
                  item-value="value"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <h3 class="mb-3">Away Team</h3>
                <v-select
                  v-model="awayTeam.formation"
                  :items="formations"
                  label="Formation"
                  item-title="label"
                  item-value="value"
                />
                <v-select
                  v-model="awayTeam.tactic"
                  :items="tactics"
                  label="Tactic"
                  item-title="label"
                  item-value="value"
                />
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="startGame"
          >
            Start Game
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useUserStore } from '@/stores/user'
import GameCanvas from '@/game/components/GameCanvas.vue'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()
const userStore = useUserStore()

// Game state
const showTeamSelection = ref(true)
const matchType = ref('Quick Match')

// Team configurations
const homeTeam = ref({
  name: 'My Team',
  formation: '1-2-1-1',
  tactic: 'balanced'
})

const awayTeam = ref({
  name: 'Opponent',
  formation: '1-2-1-1',
  tactic: 'balanced'
})

// Game options
const formations = [
  { label: '1-2-1-1 (Balanced)', value: '1-2-1-1' },
  { label: '1-1-2-1 (Midfield)', value: '1-1-2-1' },
  { label: '1-3-1 (Defensive)', value: '1-3-1' },
  { label: '1-2-2 (Attacking)', value: '1-2-2' }
]

const tactics = [
  { label: 'Balanced', value: 'balanced' },
  { label: 'Rotation in Attack', value: 'rotation' },
  { label: 'Flying Keeper', value: 'flying-keeper' },
  { label: 'Pass and Move', value: 'pass-move' },
  { label: 'Defensive', value: 'defensive' },
  { label: 'Counter-Attack', value: 'counter' },
  { label: 'High Press', value: 'high-press' },
  { label: 'Wing Play', value: 'wing-play' },
  { label: 'Pivot Play', value: 'pivot' }
]

// Start the game
const startGame = () => {
  showTeamSelection.value = false
  
  // If this is from a match ID, load match data
  if (route.params.matchId) {
    loadMatchData(route.params.matchId)
  }
}

// Load match data from Firebase
const loadMatchData = async (matchId) => {
  try {
    const matchData = await gameStore.getMatch(matchId)
    if (matchData) {
      matchType.value = matchData.type || 'Online Match'
      // Set team configurations from match data
      if (matchData.homeTeam) {
        homeTeam.value = { ...homeTeam.value, ...matchData.homeTeam }
      }
      if (matchData.awayTeam) {
        awayTeam.value = { ...awayTeam.value, ...matchData.awayTeam }
      }
    }
  } catch (error) {
    console.error('Failed to load match data:', error)
  }
}

// Handle game over
const handleGameOver = (result) => {
  console.log('Game Over:', result)
  
  // Save match result if online match
  if (route.params.matchId) {
    gameStore.updateMatchResult(route.params.matchId, result)
  }
  
  // Show result dialog or navigate back
  setTimeout(() => {
    router.push('/my-games')
  }, 3000)
}

// Update game statistics
const updateGameStats = (stats) => {
  // Update real-time stats if needed
  if (route.params.matchId) {
    gameStore.updateMatchStats(route.params.matchId, stats)
  }
}

// Exit game
const exitGame = () => {
  if (confirm('Are you sure you want to exit the game?')) {
    router.push('/my-games')
  }
}

// Initialize
onMounted(() => {
  // Load user's team data
  if (userStore.userData?.team) {
    homeTeam.value.name = userStore.userData.team.name || 'My Team'
  }
})
</script>

<style scoped>
.play-game-container {
  padding: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #121212;
}

.v-card {
  background-color: #1e1e1e;
  width: 100%;
  max-width: 1200px;
}

.v-card-text {
  padding: 0;
}

:deep(.game-canvas-container) {
  background-color: transparent;
  border-radius: 0;
}

@media (max-width: 768px) {
  .play-game-container {
    padding: 0;
  }
  
  .v-card {
    height: 100vh;
    max-width: 100%;
    border-radius: 0;
  }
}
</style>