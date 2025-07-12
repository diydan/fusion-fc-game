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
              <v-btn @click="joinQueue" color="primary" prepend-icon="mdi-account-group">Join Queue (mock)</v-btn>
              <v-btn @click="validateGameState" color="secondary" prepend-icon="mdi-check-circle">Validate Sample State</v-btn>
              <v-btn @click="handleDisconnect" color="error" prepend-icon="mdi-account-off">Simulate Disconnect</v-btn>
              <v-btn @click="completeMatch" color="success" prepend-icon="mdi-trophy">Complete Match (pick winner)</v-btn>
            </div>
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
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import FootballSimulation from '@/components/FootballSimulation.vue'
import * as multiplayerService from '@/services/multiplayer'

const tab = ref('football')
const showLogConsole = ref(false)
const logMessages = ref('')
const gameState = ref(null)
const isInLoop = ref(false)
const matchId = ref(null)
const userStore = useUserStore()

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
    
    const { success, queueId, data } = await multiplayerService.joinMatchmakingQueue({
      userId: userStore.currentUser.uid,
      displayName: userStore.displayName,
      teamId: 'demo_team_' + userStore.currentUser.uid
    })
    
    log('RESPONSE: Successfully joined matchmaking queue')
    log(`RESPONSE: Queue ID: ${queueId}`)
    log(`RESPONSE: ${JSON.stringify(data, null, 2)}`)
    
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

