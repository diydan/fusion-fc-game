<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 text-md-h3 font-weight-bold mb-6">Demo Page</h1>
      </v-col>
    </v-row>

    <v-tabs v-model="tab" class="mb-6">
      <v-tab value="football">Football Sim</v-tab>
      <v-tab value="multiplayer">Multiplayer H2H</v-tab>
    </v-tabs>

    <v-tabs-window v-model="tab" class="mb-6">
      <v-tabs-window-item value="football">
        <FootballSimulation />
      </v-tabs-window-item>

      <v-tabs-window-item value="multiplayer">
        <v-card>
          <v-card-title>Multiplayer Head-to-Head</v-card-title>
          <v-card-text>
            <div class="d-flex ga-4 flex-wrap">
              <v-btn @click="joinQueue" color="primary" prepend-icon="mdi-account-group">Join Queue</v-btn>
              <v-btn @click="sendGameUpdate" color="info" prepend-icon="mdi-sync" :disabled="!matchId">Send Game Update</v-btn>
              <v-btn @click="validateGameState" color="secondary" prepend-icon="mdi-check-circle">Validate Sample State</v-btn>
              <v-btn @click="handleDisconnect" color="error" prepend-icon="mdi-account-off">Simulate Disconnect</v-btn>
              <v-btn @click="completeMatch" color="success" prepend-icon="mdi-trophy">Complete Match (pick winner)</v-btn>
            </div>
            
            <v-alert v-if="currentMatch" type="info" class="mt-4">
              <div><strong>Match Status:</strong> {{ currentMatch.status }}</div>
              <div v-if="gameState">
                <strong>Game State:</strong> Score {{ gameState.score?.home || 0 }} - {{ gameState.score?.away || 0 }}, 
                Time: {{ Math.floor((gameState.time || 0) / 60) }}:{{ String((gameState.time || 0) % 60).padStart(2, '0') }}
              </div>
            </v-alert>
          </v-card-text>
        </v-card>
      </v-tabs-window-item>
    </v-tabs-window>

    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Log Console</span>
        <v-btn @click="toggleLog" :color="showLogConsole ? 'success' : 'primary'" size="small">
          <v-icon>{{ showLogConsole ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
          {{ showLogConsole ? 'Hide' : 'Show' }} Log
        </v-btn>
      </v-card-title>
      <v-expand-transition>
        <div v-if="showLogConsole">
          <v-card-text>
            <v-sheet class="pa-4" color="grey-lighten-5">
              <pre class="text-caption">{{ logMessages || 'No logs yet...' }}</pre>
            </v-sheet>
          </v-card-text>
        </div>
      </v-expand-transition>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import FootballSimulation from '@/components/FootballSimulation.vue'
import * as multiplayerService from '@/services/multiplayer'
import { joinMatchmakingQueue, subscribeToMatch } from '@/services/firebase/matchmaking'
import { updateGameState, subscribeToGameState } from '@/services/firebase/gameSync'

const tab = ref('football')
const showLogConsole = ref(false)
const logMessages = ref('')
const gameState = ref(null)
const isInLoop = ref(false)
const matchId = ref(null)
const userStore = useUserStore()
const matchSubscription = ref(null)
const gameStateSubscription = ref(null)
const currentMatch = ref(null)

// Logging helper
const log = (message) => {
  const timestamp = new Date().toLocaleTimeString()
  logMessages.value += `[${timestamp}] ${message}\n`
}

// Football Simulation is now handled by the FootballSimulation component

// Multiplayer H2H methods
const joinQueue = async () => {
  try {
    log('REQUEST: Joining matchmaking queue...')
    
    if (!userStore.isAuthenticated) {
      throw new Error('User must be authenticated')
    }
    
    // Use the Firebase matchmaking service as per README
    const userProfile = {
      displayName: userStore.displayName || 'Anonymous',
      rating: 1200, // Default rating as per README
      activeTeamId: 'demo_team_' + userStore.currentUser.uid
    }
    
    const { success, error } = await joinMatchmakingQueue(
      userStore.currentUser.uid,
      userProfile
    )
    
    if (success) {
      log('RESPONSE: Successfully joined matchmaking queue')
      log(`RESPONSE: User ${userStore.currentUser.uid} is now in queue`)
      
      // Start listening for match assignment
      listenForMatchAssignment()
    } else {
      throw new Error(error)
    }
    
  } catch (error) {
    log(`ERROR: Failed to join queue - ${error.message}`)
  }
}

const validateGameState = async () => {
  try {
    log('REQUEST: Validating sample game state...')
    
    if (!userStore.isAuthenticated) {
      throw new Error('User must be authenticated')
    }
    
    // Create a sample game state for validation
    const sampleGameState = {
      score: { home: 2, away: 1 },
      time: 2700, // 45 minutes in seconds
      players: {
        [userStore.currentUser.uid]: {
          position: { x: 10, y: 0, z: 5 },
          connected: true
        }
      }
    }
    
    // Use the actual matchId if available, otherwise use a demo ID
    const currentMatchId = matchId.value || 'demo_match_' + Date.now()
    
    const { success, data } = await multiplayerService.validateGameState(currentMatchId, sampleGameState)
    
    log(`RESPONSE: Game state validation ${data.valid ? 'passed' : 'failed'}`)
    log(`RESPONSE: ${JSON.stringify(data, null, 2)}`)
    
  } catch (error) {
    log(`ERROR: Failed to validate game state - ${error.message}`)
  }
}

const handleDisconnect = async () => {
  try {
    log('REQUEST: Simulating player disconnect...')
    
    if (!userStore.isAuthenticated) {
      throw new Error('User must be authenticated')
    }
    
    // Use the actual matchId if available, otherwise use a demo ID
    const currentMatchId = matchId.value || 'demo_match_' + Date.now()
    
    const { success, data } = await multiplayerService.handleDisconnect(currentMatchId)
    
    log('RESPONSE: Disconnect handled successfully')
    log(`RESPONSE: ${JSON.stringify(data, null, 2)}`)
    
  } catch (error) {
    log(`ERROR: Failed to handle disconnect - ${error.message}`)
  }
}

const completeMatch = async () => {
  try {
    log('REQUEST: Manually completing match...')
    
    if (!userStore.isAuthenticated) {
      throw new Error('User must be authenticated')
    }
    
    // Create a demo match first if we don't have one
    let currentMatchId = matchId.value
    if (!currentMatchId) {
      currentMatchId = 'demo_match_' + Date.now()
      matchId.value = currentMatchId
      
      // Create a demo match document
      const { success, matchId: createdMatchId } = await multiplayerService.createDemoMatch({
        id: userStore.currentUser.uid,
        displayName: userStore.displayName,
        rating: 1200,
        teamId: 'demo_team_' + userStore.currentUser.uid,
        ready: true
      }, {
        id: 'demo_opponent',
        displayName: 'Demo Opponent',
        rating: 1180,
        teamId: 'demo_team_opponent',
        ready: true
      })
      
      currentMatchId = createdMatchId
      
      log('RESPONSE: Created demo match for completion')
    }
    
    const { success, data } = await multiplayerService.completeMatch(currentMatchId, userStore.currentUser.uid)
    
    log('RESPONSE: Match completed successfully')
    log(`RESPONSE: ELO Updates - Winner: ${data.ratings.winner}, Loser: ${data.ratings.loser}`)
    log(`RESPONSE: ${JSON.stringify(data, null, 2)}`)
    
  } catch (error) {
    log(`ERROR: Failed to complete match - ${error.message}`)
  }
}

// Listen for match assignment after joining queue
const listenForMatchAssignment = () => {
  // This would typically involve listening to the matchmaking collection
  // For demo purposes, we'll simulate finding a match after a delay
  log('INFO: Waiting for match assignment...')
  
  setTimeout(() => {
    // Simulate match found
    const simulatedMatchId = 'demo_match_' + Date.now()
    matchId.value = simulatedMatchId
    log(`INFO: Match found! Match ID: ${simulatedMatchId}`)
    
    // Subscribe to match updates
    subscribeToMatchUpdates(simulatedMatchId)
  }, 3000)
}

// Subscribe to match updates
const subscribeToMatchUpdates = (matchId) => {
  log(`INFO: Subscribing to match ${matchId} updates...`)
  
  if (matchSubscription.value) {
    matchSubscription.value() // Unsubscribe from previous
  }
  
  matchSubscription.value = subscribeToMatch(matchId, (match) => {
    currentMatch.value = match
    log(`INFO: Match status update: ${match?.status || 'unknown'}`)
    
    if (match?.status === 'starting' || match?.status === 'active') {
      // Start game state synchronization
      startGameStateSync(matchId)
    }
  })
}

// Start game state synchronization
const startGameStateSync = (matchId) => {
  log('INFO: Starting game state synchronization...')
  
  if (gameStateSubscription.value) {
    gameStateSubscription.value() // Unsubscribe from previous
  }
  
  // Subscribe to game state updates
  gameStateSubscription.value = subscribeToGameState(matchId, (state) => {
    if (state) {
      gameState.value = state
      log(`INFO: Game state updated - Score: ${state.score?.home || 0} - ${state.score?.away || 0}`)
    }
  })
  
  // Simulate sending game state updates
  simulateGamePlay(matchId)
}

// Simulate game play with state updates
const simulateGamePlay = async (matchId) => {
  log('INFO: Starting simulated game play...')
  
  // Initial game state
  const initialState = {
    ball: { position: { x: 0, y: 0, z: 0 }, velocity: { x: 0, y: 0, z: 0 } },
    players: {
      [userStore.currentUser.uid]: {
        position: { x: -10, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        stamina: 100,
        connected: true
      }
    },
    score: { home: 0, away: 0 },
    time: 0,
    period: 'first'
  }
  
  const { success, error } = await updateGameState(matchId, initialState, userStore.currentUser.uid)
  
  if (success) {
    log('INFO: Initial game state sent successfully')
  } else {
    log(`ERROR: Failed to send game state - ${error}`)
  }
}

// Send a game state update
const sendGameUpdate = async () => {
  try {
    if (!matchId.value) {
      throw new Error('No active match')
    }
    
    log('REQUEST: Sending game state update...')
    
    // Simulate game progression
    const currentTime = gameState.value?.time || 0
    const currentScore = gameState.value?.score || { home: 0, away: 0 }
    
    // Random events
    const events = ['move', 'pass', 'shoot', 'goal']
    const event = events[Math.floor(Math.random() * events.length)]
    
    // Update score if goal
    if (event === 'goal') {
      if (Math.random() > 0.5) {
        currentScore.home += 1
      } else {
        currentScore.away += 1
      }
      log(`INFO: GOAL! Score is now ${currentScore.home} - ${currentScore.away}`)
    }
    
    const updatedState = {
      ...gameState.value,
      ball: { 
        position: { 
          x: Math.random() * 20 - 10, 
          y: 0, 
          z: Math.random() * 10 - 5 
        }, 
        velocity: { x: 0, y: 0, z: 0 } 
      },
      players: {
        [userStore.currentUser.uid]: {
          position: { 
            x: Math.random() * 20 - 10, 
            y: 0, 
            z: Math.random() * 10 - 5 
          },
          rotation: { x: 0, y: Math.random() * Math.PI * 2, z: 0 },
          stamina: Math.max(0, (gameState.value?.players?.[userStore.currentUser.uid]?.stamina || 100) - 1),
          connected: true
        }
      },
      score: currentScore,
      time: currentTime + 1,
      period: currentTime < 2700 ? 'first' : 'second'
    }
    
    const { success, error } = await updateGameState(matchId.value, updatedState, userStore.currentUser.uid)
    
    if (success) {
      log(`RESPONSE: Game state updated - Event: ${event}`)
    } else {
      throw new Error(error)
    }
    
  } catch (error) {
    log(`ERROR: Failed to send game update - ${error.message}`)
  }
}

// Clean up subscriptions on unmount
onUnmounted(() => {
  if (matchSubscription.value) {
    matchSubscription.value()
  }
  if (gameStateSubscription.value) {
    gameStateSubscription.value()
  }
})

// Utility functions
const toggleLog = () => {
  showLogConsole.value = !showLogConsole.value
}
</script>

<style scoped>
.v-btn {
  margin: 4px;
}

pre {
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
</style>

