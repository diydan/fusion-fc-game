<template>
  <div class="football-simulation">
    <v-card class="mb-6">
      <v-card-title>Football Simulation Controls</v-card-title>
      <v-card-text>
        <div class="d-flex ga-4 flex-wrap mb-4">
          <v-btn 
            @click="initGame" 
            color="primary" 
            prepend-icon="mdi-play"
            :loading="loading.init"
            :disabled="loading.any"
          >
            Init Game
          </v-btn>
          
          <v-btn 
            @click="playTick" 
            color="secondary" 
            prepend-icon="mdi-step-forward"
            :loading="loading.tick"
            :disabled="!sessionId || loading.any"
          >
            Play Tick
          </v-btn>
          
          <v-btn 
            @click="autoLoop" 
            color="success" 
            prepend-icon="mdi-fast-forward"
            :loading="loading.loop"
            :disabled="!sessionId || loading.any"
          >
            Auto Loop (x20)
          </v-btn>
          
          <v-btn 
            @click="startSecondHalf" 
            color="info" 
            prepend-icon="mdi-restart"
            :loading="loading.secondHalf"
            :disabled="!sessionId || loading.any"
          >
            Start 2nd Half
          </v-btn>
          
          <v-btn 
            @click="getState" 
            color="warning" 
            prepend-icon="mdi-information"
            :loading="loading.state"
            :disabled="!sessionId || loading.any"
          >
            Get State
          </v-btn>
        </div>
        
        <div v-if="sessionId" class="mb-4">
          <v-chip color="primary" size="small">
            <v-icon start>mdi-identifier</v-icon>
            Session ID: {{ sessionId }}
          </v-chip>
        </div>
        
        <div v-if="error" class="mb-4">
          <v-alert type="error" variant="outlined" closable @click:close="error = null">
            {{ error }}
          </v-alert>
        </div>
      </v-card-text>
    </v-card>

    <v-card v-if="matchDetails">
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Match Details</span>
        <v-btn-toggle v-model="viewMode" variant="outlined" density="compact">
          <v-btn value="table" size="small">
            <v-icon>mdi-table</v-icon>
            Table
          </v-btn>
          <v-btn value="json" size="small">
            <v-icon>mdi-code-json</v-icon>
            JSON
          </v-btn>
        </v-btn-toggle>
      </v-card-title>
      
      <v-card-text>
        <div v-if="viewMode === 'table'">
          <v-row>
            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title class="text-h6">Game Status</v-card-title>
                <v-card-text>
                  <v-table density="compact">
                    <tbody>
                      <tr v-if="matchDetails.kickOffTime">
                        <td class="font-weight-bold">Kick Off Time</td>
                        <td>{{ matchDetails.kickOffTime }}</td>
                      </tr>
                      <tr v-if="matchDetails.gameTime">
                        <td class="font-weight-bold">Game Time</td>
                        <td>{{ matchDetails.gameTime }}</td>
                      </tr>
                      <tr v-if="matchDetails.half">
                        <td class="font-weight-bold">Half</td>
                        <td>{{ matchDetails.half }}</td>
                      </tr>
                      <tr v-if="matchDetails.gamePhase">
                        <td class="font-weight-bold">Game Phase</td>
                        <td>{{ matchDetails.gamePhase }}</td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-card-text>
              </v-card>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title class="text-h6">Score</v-card-title>
                <v-card-text>
                  <div v-if="matchDetails.score" class="text-center">
                    <div class="d-flex justify-center align-center ga-4">
                      <div class="text-center">
                        <div class="text-h4 font-weight-bold">{{ matchDetails.score.home || 0 }}</div>
                        <div class="text-caption">Home</div>
                      </div>
                      <div class="text-h5 font-weight-bold">-</div>
                      <div class="text-center">
                        <div class="text-h4 font-weight-bold">{{ matchDetails.score.away || 0 }}</div>
                        <div class="text-caption">Away</div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-center text-body-2 text-medium-emphasis">
                    No score data available
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          
          <v-row v-if="matchDetails.homeTeam || matchDetails.awayTeam">
            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title class="text-h6">Home Team</v-card-title>
                <v-card-text>
                  <div v-if="matchDetails.homeTeam">
                    <div class="font-weight-bold">{{ matchDetails.homeTeam.name || 'Home Team' }}</div>
                    <div v-if="matchDetails.homeTeam.rating" class="text-caption">
                      Rating: {{ matchDetails.homeTeam.rating }}
                    </div>
                  </div>
                  <div v-else class="text-body-2 text-medium-emphasis">
                    No home team data
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title class="text-h6">Away Team</v-card-title>
                <v-card-text>
                  <div v-if="matchDetails.awayTeam">
                    <div class="font-weight-bold">{{ matchDetails.awayTeam.name || 'Away Team' }}</div>
                    <div v-if="matchDetails.awayTeam.rating" class="text-caption">
                      Rating: {{ matchDetails.awayTeam.rating }}
                    </div>
                  </div>
                  <div v-else class="text-body-2 text-medium-emphasis">
                    No away team data
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          
          <v-row v-if="matchDetails.ball">
            <v-col cols="12">
              <v-card variant="outlined">
                <v-card-title class="text-h6">Ball Position</v-card-title>
                <v-card-text>
                  <v-table density="compact">
                    <tbody>
                      <tr v-if="matchDetails.ball.position">
                        <td class="font-weight-bold">Position</td>
                        <td>X: {{ matchDetails.ball.position.x }}, Y: {{ matchDetails.ball.position.y }}</td>
                      </tr>
                      <tr v-if="matchDetails.ball.owner">
                        <td class="font-weight-bold">Owner</td>
                        <td>{{ matchDetails.ball.owner }}</td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>
        
        <div v-else>
          <v-sheet class="pa-4" color="grey-lighten-5">
            <pre class="json-viewer">{{ JSON.stringify(matchDetails, null, 2) }}</pre>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Log Panel -->
    <LogPanel 
      :logs="logger.logs.value"
      @clear-logs="logger.clearLogs"
      :auto-expand="true"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useToast } from '@/composables/useToast'
import { useLogger } from '@/composables/useLogger'
import LogPanel from '@/components/ui/LogPanel.vue'

// Global instances
const { apiError } = useToast()
const logger = useLogger()

// Component state
const sessionId = ref(null)
const matchDetails = ref(null)
const error = ref(null)
const viewMode = ref('table')

// Loading states
const loading = ref({
  init: false,
  tick: false,
  loop: false,
  secondHalf: false,
  state: false
})

// Computed property for any loading state
const loadingAny = computed(() => {
  return Object.values(loading.value).some(state => state)
})

loading.value.any = loadingAny

// API configuration
const API_ENDPOINTS = {
  initGame: 'https://initgame-6unsift5pq-uc.a.run.app',
  playIteration: 'https://playiteration-6unsift5pq-uc.a.run.app',
  startSecondHalf: 'https://startsecondhalf-6unsift5pq-uc.a.run.app',
  getGameState: 'https://getgamestate-6unsift5pq-uc.a.run.app'
}

// Sample teams data
const sampleTeams = {
  team1: {
    name: "Home Team",
    players: [
      { name: "Player 1", position: "GK", rating: 80 },
      { name: "Player 2", position: "DEF", rating: 75 },
      { name: "Player 3", position: "MID", rating: 78 },
      { name: "Player 4", position: "FWD", rating: 82 }
    ]
  },
  team2: {
    name: "Away Team",
    players: [
      { name: "Player 5", position: "GK", rating: 78 },
      { name: "Player 6", position: "DEF", rating: 76 },
      { name: "Player 7", position: "MID", rating: 79 },
      { name: "Player 8", position: "FWD", rating: 81 }
    ]
  }
}

// API call helper
const apiCall = async (endpoint, options = {}) => {
  try {
    // Parse endpoint and query params
    const [endpointPath, queryString] = endpoint.split('?')
    // Remove leading slash from endpoint name if present
    const endpointName = endpointPath.replace(/^\//, '')
    const baseUrl = API_ENDPOINTS[endpointName]
    
    if (!baseUrl) {
      throw new Error(`Unknown endpoint: ${endpointName}`)
    }
    
    // Construct full URL with query params if they exist
    const url = queryString ? `${baseUrl}?${queryString}` : baseUrl
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (err) {
    console.error('API call failed:', err)
    throw err
  }
}

// Initialize game
const initGame = async () => {
  loading.value.init = true
  error.value = null
  
  try {
    const response = await apiCall('/initGame', {
      method: 'POST',
      body: JSON.stringify({
        team1: sampleTeams.team1,
        team2: sampleTeams.team2,
        pitchWidth: 100,
        pitchHeight: 50
      })
    })
    
    sessionId.value = response.sessionId
    matchDetails.value = response.matchSetup
    
    console.log('Game initialized:', response)
  } catch (err) {
    logger.apiError(err, 'Initialize Game')
    apiError(`Failed to initialize game: ${err.message}`)
  } finally {
    loading.value.init = false
  }
}

// Play single tick/iteration
const playTick = async () => {
  loading.value.tick = true
  error.value = null
  
  try {
    const response = await apiCall('/playIteration', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: sessionId.value
      })
    })
    
    matchDetails.value = response.matchDetails
    
    console.log('Tick played:', response)
  } catch (err) {
    logger.apiError(err, 'Play Tick')
    apiError(`Failed to play tick: ${err.message}`)
  } finally {
    loading.value.tick = false
  }
}

// Auto loop - play 20 iterations
const autoLoop = async () => {
  loading.value.loop = true
  error.value = null
  
  try {
    for (let i = 0; i < 20; i++) {
      const response = await apiCall('/playIteration', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: sessionId.value
        })
      })
      
      matchDetails.value = response.matchDetails
      
      // Small delay between iterations for visual feedback
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log('Auto loop completed')
  } catch (err) {
    logger.apiError(err, 'Auto Loop')
    apiError(`Failed during auto loop: ${err.message}`)
  } finally {
    loading.value.loop = false
  }
}

// Start second half
const startSecondHalf = async () => {
  loading.value.secondHalf = true
  error.value = null
  
  try {
    const response = await apiCall('/startSecondHalf', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: sessionId.value
      })
    })
    
    matchDetails.value = response.matchDetails
    
    console.log('Second half started:', response)
  } catch (err) {
    logger.apiError(err, 'Start Second Half')
    apiError(`Failed to start second half: ${err.message}`)
  } finally {
    loading.value.secondHalf = false
  }
}

// Get current game state
const getState = async () => {
  loading.value.state = true
  error.value = null
  
  try {
    const response = await apiCall(`/getGameState?sessionId=${sessionId.value}`, {
      method: 'GET'
    })
    
    matchDetails.value = response.matchDetails
    
    console.log('Game state retrieved:', response)
  } catch (err) {
    logger.apiError(err, 'Get Game State')
    apiError(`Failed to get game state: ${err.message}`)
  } finally {
    loading.value.state = false
  }
}
</script>

<style scoped>
.football-simulation {
  max-width: 1200px;
  margin: 0 auto;
}

.json-viewer {
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.v-card {
  margin-bottom: 16px;
}

.v-btn {
  margin: 4px;
}
</style>
