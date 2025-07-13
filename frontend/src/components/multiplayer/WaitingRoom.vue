<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card class="elevation-4">
          <v-card-title class="text-h4 text-center py-6">
            <v-icon large left>mdi-sword-cross</v-icon>
            H2H Matchmaking
          </v-card-title>
          
          <v-card-text>
            <!-- Queue Status -->
            <v-alert
              :type="inQueue ? 'info' : 'success'"
              :icon="inQueue ? 'mdi-timer-sand' : 'mdi-play-circle'"
              prominent
              class="mb-6"
            >
              <div class="d-flex align-center">
                <div>
                  <div class="text-h6">{{ queueStatus }}</div>
                  <div v-if="estimatedWaitTime" class="text-body-2 mt-1">
                    Estimated wait: {{ estimatedWaitTime }}
                  </div>
                </div>
                <v-spacer />
                <v-progress-circular
                  v-if="inQueue"
                  indeterminate
                  color="white"
                  size="32"
                />
              </div>
            </v-alert>
            
            <!-- Player Info Cards -->
            <v-row class="mb-6">
              <v-col cols="12" md="6">
                <v-card outlined>
                  <v-card-title class="text-h6">
                    <v-icon left>mdi-account</v-icon>
                    Your Profile
                  </v-card-title>
                  <v-card-text>
                    <v-list dense>
                      <v-list-item>
                        <v-list-item-content>
                          <v-list-item-title>Manager</v-list-item-title>
                          <v-list-item-subtitle>{{ userStore.profile?.displayName || 'Anonymous' }}</v-list-item-subtitle>
                        </v-list-item-content>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-content>
                          <v-list-item-title>Rating</v-list-item-title>
                          <v-list-item-subtitle>
                            <v-chip small :color="getRatingColor(userStore.profile?.rating)">
                              {{ userStore.profile?.rating || 1200 }}
                            </v-chip>
                          </v-list-item-subtitle>
                        </v-list-item-content>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-content>
                          <v-list-item-title>Record</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ userStore.profile?.stats?.matchesWon || 0 }}W - 
                            {{ (userStore.profile?.stats?.matchesPlayed || 0) - (userStore.profile?.stats?.matchesWon || 0) }}L
                          </v-list-item-subtitle>
                        </v-list-item-content>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-card outlined>
                  <v-card-title class="text-h6">
                    <v-icon left>mdi-account-group</v-icon>
                    Queue Info
                  </v-card-title>
                  <v-card-text>
                    <v-list dense>
                      <v-list-item>
                        <v-list-item-content>
                          <v-list-item-title>Players in Queue</v-list-item-title>
                          <v-list-item-subtitle>
                            <v-chip small color="primary">
                              {{ queuedPlayers.length }}
                            </v-chip>
                          </v-list-item-subtitle>
                        </v-list-item-content>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-content>
                          <v-list-item-title>Search Range</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ (userStore.profile?.rating || 1200) - 200 }} - {{ (userStore.profile?.rating || 1200) + 200 }}
                          </v-list-item-subtitle>
                        </v-list-item-content>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
            
            <!-- Match Found Dialog -->
            <v-dialog
              v-model="matchFound"
              persistent
              max-width="500"
            >
              <v-card>
                <v-card-title class="text-h5 text-center py-4">
                  <v-icon large color="success" class="mr-2">mdi-check-circle</v-icon>
                  Match Found!
                </v-card-title>
                <v-card-text class="text-center">
                  <v-avatar size="80" class="mb-4">
                    <v-icon size="60">mdi-account</v-icon>
                  </v-avatar>
                  <h3 class="text-h6 mb-2">{{ opponent?.displayName }}</h3>
                  <v-chip :color="getRatingColor(opponent?.rating)">
                    Rating: {{ opponent?.rating }}
                  </v-chip>
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn
                    color="error"
                    text
                    @click="declineMatch"
                  >
                    Decline
                  </v-btn>
                  <v-btn
                    color="success"
                    depressed
                    :loading="acceptingMatch"
                    @click="acceptMatch"
                  >
                    Accept Match
                  </v-btn>
                  <v-spacer />
                </v-card-actions>
              </v-card>
            </v-dialog>
            
            <!-- Active Matches List -->
            <v-card outlined class="mt-6">
              <v-card-title class="text-h6">
                <v-icon left>mdi-soccer-field</v-icon>
                Live Matches
              </v-card-title>
              <v-card-text>
                <v-list v-if="activeMatches.length > 0" three-line>
                  <v-list-item
                    v-for="match in activeMatches"
                    :key="match.id"
                    @click="spectateMatch(match.id)"
                  >
                    <v-list-item-avatar>
                      <v-icon>mdi-soccer</v-icon>
                    </v-list-item-avatar>
                    <v-list-item-content>
                      <v-list-item-title>
                        {{ match.players[0].displayName }} vs {{ match.players[1].displayName }}
                      </v-list-item-title>
                      <v-list-item-subtitle>
                        Started {{ formatTime(match.startedAt) }}
                      </v-list-item-subtitle>
                    </v-list-item-content>
                    <v-list-item-action>
                      <v-btn icon small>
                        <v-icon>mdi-eye</v-icon>
                      </v-btn>
                    </v-list-item-action>
                  </v-list-item>
                </v-list>
                <div v-else class="text-center py-4 text--secondary">
                  No active matches at the moment
                </div>
              </v-card-text>
            </v-card>
          </v-card-text>
          
          <v-card-actions class="pa-6">
            <v-btn
              text
              @click="$router.push('/dashboard')"
              class="back-button"
            >
              <v-icon left>mdi-arrow-left</v-icon>
              Back
            </v-btn>
            <v-spacer />
            <v-btn
              v-if="!inQueue"
              color="primary"
              large
              depressed
              @click="joinQueue"
              :disabled="!userStore.profile"
            >
              <v-icon left>mdi-play</v-icon>
              Find Match
            </v-btn>
            <v-btn
              v-else
              color="error"
              large
              outlined
              @click="leaveQueue"
            >
              <v-icon left>mdi-close</v-icon>
              Cancel Search
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { 
  joinMatchmakingQueue, 
  leaveMatchmakingQueue,
  findOpponent,
  subscribeToQueue,
  getActiveH2HMatches,
  setPlayerReady
} from '@/services/firebase/matchmaking'

export default {
  name: 'WaitingRoom',
  
  setup() {
    const router = useRouter()
    const userStore = useUserStore()
    
    // State
    const inQueue = ref(false)
    const matchFound = ref(false)
    const acceptingMatch = ref(false)
    const queuedPlayers = ref([])
    const activeMatches = ref([])
    const currentMatch = ref(null)
    const opponent = ref(null)
    const searchInterval = ref(null)
    const queueUnsubscribe = ref(null)
    
    // Computed
    const queueStatus = computed(() => {
      if (!inQueue.value) return 'Ready to find a match'
      if (matchFound.value) return 'Opponent found!'
      return `Searching for opponent... (${queuedPlayers.value.length} in queue)`
    })
    
    const estimatedWaitTime = computed(() => {
      if (!inQueue.value || queuedPlayers.value.length === 0) return null
      
      const avgWaitSeconds = 30
      const queuePosition = queuedPlayers.value.length
      const estimated = Math.max(10, avgWaitSeconds * Math.log(queuePosition + 1))
      
      if (estimated < 60) return `${Math.round(estimated)} seconds`
      return `${Math.round(estimated / 60)} minutes`
    })
    
    // Methods
    const getRatingColor = (rating) => {
      if (!rating) return 'grey'
      if (rating < 1000) return 'brown'
      if (rating < 1200) return 'grey'
      if (rating < 1400) return 'green'
      if (rating < 1600) return 'blue'
      if (rating < 1800) return 'purple'
      return 'orange'
    }
    
    const joinQueue = async () => {
      if (!userStore.user) return
      
      inQueue.value = true
      const result = await joinMatchmakingQueue(userStore.user.uid, userStore.profile)
      
      if (result.error) {
        console.error('Failed to join queue:', result.error)
        inQueue.value = false
        return
      }
      
      startMatchmaking()
    }
    
    const leaveQueue = async () => {
      if (!userStore.user) return
      
      inQueue.value = false
      stopMatchmaking()
      
      await leaveMatchmakingQueue(userStore.user.uid)
    }
    
    const startMatchmaking = () => {
      searchInterval.value = setInterval(async () => {
        if (!userStore.user || !inQueue.value) return
        
        const result = await findOpponent(userStore.user.uid, userStore.profile?.rating || 1200)
        
        if (result.match) {
          matchFound.value = true
          currentMatch.value = result.match
          
          const opponentPlayer = result.match.players.find(p => p.id !== userStore.user.uid)
          opponent.value = opponentPlayer
          
          stopMatchmaking()
        }
      }, 3000)
    }
    
    const stopMatchmaking = () => {
      if (searchInterval.value) {
        clearInterval(searchInterval.value)
        searchInterval.value = null
      }
    }
    
    const acceptMatch = async () => {
      if (!currentMatch.value || !userStore.user) return
      
      acceptingMatch.value = true
      
      const result = await setPlayerReady(currentMatch.value.id, userStore.user.uid, true)
      
      if (!result.error) {
        router.push(`/game/h2h/${currentMatch.value.id}`)
      }
      
      acceptingMatch.value = false
    }
    
    const declineMatch = async () => {
      matchFound.value = false
      currentMatch.value = null
      opponent.value = null
      
      await leaveQueue()
    }
    
    const spectateMatch = (matchId) => {
      router.push(`/game/spectate/${matchId}`)
    }
    
    const formatTime = (timestamp) => {
      if (!timestamp) return ''
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      const now = new Date()
      const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60)
      
      if (diff < 1) return 'Just now'
      if (diff < 60) return `${diff} minutes ago`
      return `${Math.floor(diff / 60)} hours ago`
    }
    
    const loadActiveMatches = async () => {
      const result = await getActiveH2HMatches(5)
      if (!result.error) {
        activeMatches.value = result.matches
      }
    }
    
    // Lifecycle
    onMounted(() => {
      queueUnsubscribe.value = subscribeToQueue((players) => {
        queuedPlayers.value = players
      })
      
      loadActiveMatches()
      const matchInterval = setInterval(loadActiveMatches, 10000)
      
      onUnmounted(() => {
        if (inQueue.value) {
          leaveQueue()
        }
        stopMatchmaking()
        if (queueUnsubscribe.value) {
          queueUnsubscribe.value()
        }
        clearInterval(matchInterval)
      })
    })
    
    return {
      // State
      inQueue,
      matchFound,
      acceptingMatch,
      queuedPlayers,
      activeMatches,
      opponent,
      
      // Computed
      queueStatus,
      estimatedWaitTime,
      
      // Store
      userStore,
      
      // Methods
      getRatingColor,
      joinQueue,
      leaveQueue,
      acceptMatch,
      declineMatch,
      spectateMatch,
      formatTime
    }
  }
}
</script>