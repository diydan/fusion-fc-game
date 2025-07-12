<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 text-md-h3 font-weight-bold mb-6">My Games</h1>
      </v-col>
    </v-row>

    <!-- Quick Play Section -->
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-soccer</v-icon>
            Quick Play
          </v-card-title>
          <v-card-text>
            <p class="text-body-2 mb-4">
              Jump into a quick match against AI with your current team setup.
            </p>
            <v-btn
              color="primary"
              block
              size="large"
              @click="startQuickMatch"
            >
              <v-icon start>mdi-play</v-icon>
              Play Now
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-trophy</v-icon>
            Tournament Mode
          </v-card-title>
          <v-card-text>
            <p class="text-body-2 mb-4">
              Compete in tournaments and climb the leaderboards.
            </p>
            <v-btn
              color="secondary"
              block
              size="large"
              disabled
            >
              <v-icon start>mdi-lock</v-icon>
              Coming Soon
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Active Games Section -->
    <v-row class="mt-4">
      <v-col cols="12">
        <h2 class="text-h5 mb-4">Active Games</h2>
      </v-col>
    </v-row>

    <v-row v-if="activeGames.length > 0">
      <v-col
        v-for="game in activeGames"
        :key="game.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card>
          <v-card-title class="d-flex justify-space-between">
            <span>{{ game.homeTeam }} vs {{ game.awayTeam }}</span>
            <v-chip
              :color="getStatusColor(game.status)"
              size="small"
            >
              {{ game.status }}
            </v-chip>
          </v-card-title>
          <v-card-text>
            <p class="text-body-2">
              Started: {{ formatDate(game.createdAt) }}
            </p>
            <p class="text-h6 mt-2">
              Score: {{ game.homeScore }} - {{ game.awayScore }}
            </p>
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="primary"
              variant="text"
              @click="continueGame(game.id)"
            >
              Continue
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
              color="error"
              variant="text"
              @click="deleteGame(game.id)"
            >
              Delete
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col cols="12">
        <v-card>
          <v-card-text class="text-center py-8">
            <v-icon size="64" color="grey" class="mb-4">mdi-gamepad-off</v-icon>
            <p class="text-h6">No Active Games</p>
            <p class="text-body-2 text-medium-emphasis mt-2">
              Start a new game to see it here!
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Game History Section -->
    <v-row class="mt-4">
      <v-col cols="12">
        <h2 class="text-h5 mb-4">Recent Matches</h2>
      </v-col>
    </v-row>

    <v-row v-if="recentMatches.length > 0">
      <v-col cols="12">
        <v-list>
          <v-list-item
            v-for="match in recentMatches"
            :key="match.id"
            class="mb-2"
          >
            <template v-slot:prepend>
              <v-icon
                :color="getResultColor(match.result)"
              >
                {{ getResultIcon(match.result) }}
              </v-icon>
            </template>
            
            <v-list-item-title>
              {{ match.homeTeam }} {{ match.homeScore }} - {{ match.awayScore }} {{ match.awayTeam }}
            </v-list-item-title>
            
            <v-list-item-subtitle>
              {{ formatDate(match.completedAt) }}
            </v-list-item-subtitle>
            
            <template v-slot:append>
              <v-chip
                :color="getResultColor(match.result)"
                size="small"
              >
                {{ match.result }}
              </v-chip>
            </template>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col cols="12">
        <v-card>
          <v-card-text class="text-center py-8">
            <v-icon size="64" color="grey" class="mb-4">mdi-history</v-icon>
            <p class="text-h6">No Match History</p>
            <p class="text-body-2 text-medium-emphasis mt-2">
              Complete some matches to see your history!
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const gameStore = useGameStore()
const userStore = useUserStore()

// Game data
const activeGames = ref([])
const recentMatches = ref([])

// Start a quick match
const startQuickMatch = () => {
  router.push('/play-game')
}

// Continue an existing game
const continueGame = (gameId) => {
  router.push(`/play-game/${gameId}`)
}

// Delete a game
const deleteGame = async (gameId) => {
  if (confirm('Are you sure you want to delete this game?')) {
    try {
      await gameStore.deleteMatch(gameId)
      activeGames.value = activeGames.value.filter(g => g.id !== gameId)
    } catch (error) {
      console.error('Failed to delete game:', error)
    }
  }
}

// Helper functions
const getStatusColor = (status) => {
  switch (status) {
    case 'in-progress': return 'success'
    case 'paused': return 'warning'
    default: return 'grey'
  }
}

const getResultColor = (result) => {
  switch (result) {
    case 'Win': return 'success'
    case 'Loss': return 'error'
    case 'Draw': return 'warning'
    default: return 'grey'
  }
}

const getResultIcon = (result) => {
  switch (result) {
    case 'Win': return 'mdi-trophy'
    case 'Loss': return 'mdi-close-circle'
    case 'Draw': return 'mdi-equal'
    default: return 'mdi-soccer'
  }
}

const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown'
  const date = new Date(timestamp)
  return date.toLocaleString()
}

// Load user's games
const loadGames = async () => {
  try {
    // For now, using mock data
    // In production, this would fetch from Firebase
    activeGames.value = []
    recentMatches.value = []
  } catch (error) {
    console.error('Failed to load games:', error)
  }
}

onMounted(() => {
  loadGames()
})
</script>