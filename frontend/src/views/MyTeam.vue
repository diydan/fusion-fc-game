<template>
  <v-container @click="handleContainerClick">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 text-md-h3 font-weight-bold mb-6">My Team</h1>
      </v-col>
    </v-row>

    <!-- Manager Info Card -->
    <v-row>
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Manager Profile</v-card-title>
          <v-card-text>
            <div class="text-center mb-4">
              <v-avatar size="80" class="mb-2">
                <v-img 
                  v-if="managerProfile?.avatar" 
                  :src="managerProfile.avatar"
                  :alt="managerProfile.name"
                />
                <v-icon v-else size="40">mdi-account-circle</v-icon>
              </v-avatar>
              <h3 class="text-h6">{{ managerProfile?.name || 'Manager' }}</h3>
              <v-chip 
                color="primary" 
                variant="outlined" 
                size="small"
                class="mt-1"
              >
                {{ managerProfile?.rank || 'Amateur' }} Manager
              </v-chip>
            </div>
            
            <v-list density="compact">
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-currency-usd</v-icon>
                </template>
                <v-list-item-title>Budget</v-list-item-title>
                <v-list-item-subtitle>${{ formatBudget(managerProfile?.recruitmentBudget) }}</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-star</v-icon>
                </template>
                <v-list-item-title>Reputation</v-list-item-title>
                <v-list-item-subtitle>{{ managerProfile?.reputation || 'Amateur' }}</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-star-outline</v-icon>
                </template>
                <v-list-item-title>Experience</v-list-item-title>
                <v-list-item-subtitle>{{ managerProfile?.experience || 0 }} XP</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Team Scout/Recruitment Section -->
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="me-2">mdi-account-search</v-icon>
            Player Recruitment
          </v-card-title>
          <v-card-text>
            <v-alert type="info" variant="tonal" class="mb-4">
              <template v-slot:prepend>
                <v-icon>mdi-information</v-icon>
              </template>
              Scout players from major football leagues worldwide. More leagues and detailed scouting coming soon!
            </v-alert>

            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="selectedCountry"
                  :items="countries"
                  item-title="name"
                  item-value="code"
                  label="Select Country"
                  variant="outlined"
                  prepend-inner-icon="mdi-flag"
                  @update:model-value="onCountryChange"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <span class="me-2">{{ item.raw.flag }}</span>
                      </template>
                    </v-list-item>
                  </template>
                  
                  <template v-slot:selection="{ item }">
                    <span class="me-2">{{ item.raw.flag }}</span>
                    {{ item.raw.name }}
                  </template>
                </v-select>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="selectedTeam"
                  :items="availableTeams"
                  :loading="loadingTeams"
                  :disabled="!selectedCountry"
                  item-title="name"
                  item-value="id"
                  label="Select Team"
                  variant="outlined"
                  prepend-inner-icon="mdi-shield"
                  clearable
                >
                  <template v-slot:no-data>
                    <v-list-item>
                      <v-list-item-title>
                        {{ selectedCountry ? 'Loading teams...' : 'Select a country first' }}
                      </v-list-item-title>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
            </v-row>


            <!-- Coming Soon Features -->
            <v-divider class="my-4" />
            <h3 class="text-h6 mb-3">Coming Soon</h3>
            <v-chip-group>
              <v-chip variant="outlined" size="small">
                <v-icon start size="small">mdi-account-plus</v-icon>
                Player Contracts
              </v-chip>
              <v-chip variant="outlined" size="small">
                <v-icon start size="small">mdi-soccer-field</v-icon>
                Squad Management
              </v-chip>
              <v-chip variant="outlined" size="small">
                <v-icon start size="small">mdi-chart-line</v-icon>
                Player Stats
              </v-chip>
              <v-chip variant="outlined" size="small">
                <v-icon start size="small">mdi-swap-horizontal</v-icon>
                Transfers
              </v-chip>
            </v-chip-group>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Current Squad Section -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon class="me-2">mdi-account-group</v-icon>
              Squad
            </div>
            <v-btn
              color="primary"
              variant="outlined"
              prepend-icon="mdi-account-plus"
              @click="goToRecruitPage"
              size="small"
            >
              Recruit
            </v-btn>
          </v-card-title>
          <v-card-text>
            <!-- No Players State -->
            <v-alert 
              v-if="squad.length === 0"
              type="warning" 
              variant="tonal" 
              class="text-center"
            >
              <template v-slot:prepend>
                <v-icon>mdi-account-plus</v-icon>
              </template>
              <p class="text-h6 mb-2">No Players Recruited Yet</p>
              <p class="text-body-2">Use your ${{ formatBudget(managerProfile?.recruitmentBudget) }} budget to scout and recruit players from around the world!</p>
            </v-alert>

            <!-- Squad List -->
            <div v-else>
              <v-row>
                <v-col 
                  v-for="player in squad" 
                  :key="player.id"
                  cols="12" 
                  sm="6" 
                  md="4"
                  lg="3"
                >
                  <div class="player-card-wrapper" :class="{ 'card-selected': selectedPlayers.includes(player.id) }">
                    <PlayerCardV3
                      :player="player"
                      :is-selected="selectedPlayers.includes(player.id)"
                      @click.stop="togglePlayerSelection(player.id)"
                      @compare="togglePlayerSelection(player.id)"
                      @recruit="handlePlayerAction(player)"
                      @select-bot="selectBotForPlayer(player)"
                    />
                  </div>
                  
                  <!-- Condition Warning for Damaged Players -->
                  <v-alert
                    v-if="player.condition && player.condition < 30"
                    type="error"
                    density="compact"
                    variant="tonal"
                    class="mt-2"
                  >
                    <v-icon size="small">mdi-alert</v-icon>
                    Low condition - Consider sending to junk yard
                    <v-btn
                      color="error"
                      variant="text"
                      size="x-small"
                      class="ml-2"
                      @click="sendToJunkYard(player)"
                    >
                      Send to Junk Yard
                    </v-btn>
                  </v-alert>
                </v-col>
              </v-row>

              <!-- Junk Yard Alert -->
              <v-alert 
                v-if="hasJunkYardPlayers"
                type="error" 
                variant="tonal" 
                class="mt-4"
              >
                <template v-slot:prepend>
                  <v-icon>mdi-alert</v-icon>
                </template>
                <strong>Warning:</strong> You have players with very low condition (&lt;30%). 
                Consider sending them to the junk yard to free up squad space.
              </v-alert>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import PlayerCardV3 from '@/components/recruit/PlayerCardV3.vue'

const router = useRouter()
const userStore = useUserStore()

// State
const selectedCountry = ref('')
const selectedTeam = ref('')
const loadingTeams = ref(false)
const scouting = ref(false)
const selectedPlayers = ref([])

// Sample squad data with PlayerCardV3 format
const squad = ref([
  {
    id: 1,
    name: 'Marcus Silva',
    position: 'FW',
    nationality: 'Brazil',
    overall: 85,
    condition: 85,
    tier: 'pro',
    price: 2500000,
    stats: {
      pace: 82,
      shooting: 78,
      passing: 75,
      defense: 45,
      physical: 75,
      dribbling: 80
    },
    bot: null
  },
  {
    id: 2,
    name: 'David Chen',
    position: 'MF',
    nationality: 'China',
    overall: 72,
    condition: 25,
    tier: 'semi-pro',
    price: 800000,
    stats: {
      pace: 70,
      shooting: 60,
      passing: 75,
      defense: 68,
      physical: 68,
      dribbling: 72
    },
    bot: { name: 'DanBot', model: '/bot1/soccer_player.fbx' }
  },
  {
    id: 3,
    name: 'Alex Rodriguez',
    position: 'DF',
    nationality: 'Spain',
    overall: 78,
    condition: 60,
    tier: 'pro',
    price: 1500000,
    stats: {
      pace: 65,
      shooting: 45,
      passing: 70,
      defense: 85,
      physical: 85,
      dribbling: 60
    },
    bot: null
  }
])

// Computed
const managerProfile = computed(() => userStore.userProfile?.managerProfile)

const hasJunkYardPlayers = computed(() => {
  return squad.value.some(player => player.condition < 30)
})

// Major football leagues and their teams
const countries = ref([
  {
    code: 'EN',
    name: 'England',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    league: 'Premier League'
  },
  {
    code: 'ES',
    name: 'Spain',
    flag: '🇪🇸',
    league: 'La Liga'
  },
  {
    code: 'IT',
    name: 'Italy',
    flag: '🇮🇹',
    league: 'Serie A'
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    league: 'Bundesliga'
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    league: 'Ligue 1'
  },
  {
    code: 'NL',
    name: 'Netherlands',
    flag: '🇳🇱',
    league: 'Eredivisie'
  },
  {
    code: 'PT',
    name: 'Portugal',
    flag: '🇵🇹',
    league: 'Primeira Liga'
  },
  {
    code: 'BR',
    name: 'Brazil',
    flag: '🇧🇷',
    league: 'Serie A'
  }
])

const teams = ref({
  EN: [
    { id: 'arsenal', name: 'Arsenal', logo: null },
    { id: 'chelsea', name: 'Chelsea', logo: null },
    { id: 'liverpool', name: 'Liverpool', logo: null },
    { id: 'man-city', name: 'Manchester City', logo: null },
    { id: 'man-utd', name: 'Manchester United', logo: null },
    { id: 'tottenham', name: 'Tottenham', logo: null },
    { id: 'newcastle', name: 'Newcastle United', logo: null },
    { id: 'brighton', name: 'Brighton', logo: null }
  ],
  ES: [
    { id: 'real-madrid', name: 'Real Madrid', logo: null },
    { id: 'barcelona', name: 'FC Barcelona', logo: null },
    { id: 'atletico', name: 'Atlético Madrid', logo: null },
    { id: 'sevilla', name: 'Sevilla', logo: null },
    { id: 'valencia', name: 'Valencia', logo: null },
    { id: 'villarreal', name: 'Villarreal', logo: null }
  ],
  IT: [
    { id: 'juventus', name: 'Juventus', logo: null },
    { id: 'ac-milan', name: 'AC Milan', logo: null },
    { id: 'inter', name: 'Inter Milan', logo: null },
    { id: 'napoli', name: 'Napoli', logo: null },
    { id: 'roma', name: 'AS Roma', logo: null },
    { id: 'lazio', name: 'Lazio', logo: null }
  ],
  DE: [
    { id: 'bayern', name: 'Bayern Munich', logo: null },
    { id: 'dortmund', name: 'Borussia Dortmund', logo: null },
    { id: 'leipzig', name: 'RB Leipzig', logo: null },
    { id: 'leverkusen', name: 'Bayer Leverkusen', logo: null },
    { id: 'frankfurt', name: 'Eintracht Frankfurt', logo: null }
  ],
  FR: [
    { id: 'psg', name: 'Paris Saint-Germain', logo: null },
    { id: 'marseille', name: 'Olympique Marseille', logo: null },
    { id: 'lyon', name: 'Olympique Lyon', logo: null },
    { id: 'monaco', name: 'AS Monaco', logo: null },
    { id: 'lille', name: 'Lille', logo: null }
  ],
  NL: [
    { id: 'ajax', name: 'Ajax', logo: null },
    { id: 'psv', name: 'PSV Eindhoven', logo: null },
    { id: 'feyenoord', name: 'Feyenoord', logo: null }
  ],
  PT: [
    { id: 'porto', name: 'FC Porto', logo: null },
    { id: 'benfica', name: 'SL Benfica', logo: null },
    { id: 'sporting', name: 'Sporting CP', logo: null }
  ],
  BR: [
    { id: 'flamengo', name: 'Flamengo', logo: null },
    { id: 'palmeiras', name: 'Palmeiras', logo: null },
    { id: 'santos', name: 'Santos', logo: null },
    { id: 'corinthians', name: 'Corinthians', logo: null }
  ]
})

const availableTeams = computed(() => {
  if (!selectedCountry.value) return []
  return teams.value[selectedCountry.value] || []
})

// Methods
const formatBudget = (amount) => {
  if (!amount) return '0K'
  return (amount / 1000).toFixed(0) + 'K'
}

const onCountryChange = () => {
  selectedTeam.value = ''
  loadingTeams.value = true
  
  // Simulate loading delay
  setTimeout(() => {
    loadingTeams.value = false
  }, 500)
}

const scoutPlayers = async () => {
  scouting.value = true
  
  try {
    // Simulate scouting process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // TODO: Implement actual player scouting logic
    console.log('Scouting players from:', selectedTeam.value)
    
    // Show success message or navigate to results
    // This would integrate with the recruitment system
    
  } catch (error) {
    console.error('Scouting error:', error)
  } finally {
    scouting.value = false
  }
}

const getPlayerConditionColor = (condition) => {
  if (condition >= 70) return 'success'
  if (condition >= 50) return 'warning'
  if (condition >= 30) return 'orange'
  return 'error'
}

const sendToJunkYard = (player) => {
  if (confirm(`Send ${player.name} to the junk yard? This action cannot be undone.`)) {
    // Remove player from squad
    const index = squad.value.findIndex(p => p.id === player.id)
    if (index > -1) {
      squad.value.splice(index, 1)
      console.log(`${player.name} has been sent to the junk yard`)
      
      // TODO: Update database and possibly give small compensation
      // TODO: Add to junk yard tracking/statistics
    }
  }
}

const goToRecruitPage = () => {
  router.push('/recruit')
}

// Toggle player selection for comparison
const togglePlayerSelection = (playerId) => {
  const index = selectedPlayers.value.indexOf(playerId)
  if (index > -1) {
    selectedPlayers.value.splice(index, 1)
  } else {
    // Clear other selections and select only this player
    selectedPlayers.value = [playerId]
  }
}

// Handle clicking outside of cards
const handleContainerClick = (event) => {
  // If clicking on the container background (not on a card)
  if (event.target === event.currentTarget || 
      event.target.closest('.v-container') && 
      !event.target.closest('.player-card-wrapper')) {
    selectedPlayers.value = []
  }
}

// Handle player action (could be trade, sell, etc)
const handlePlayerAction = (player) => {
  console.log('Player action:', player)
  // TODO: Implement player management actions
}

// Select bot for player
const selectBotForPlayer = (player) => {
  console.log('Select bot for player:', player)
  router.push(`/character-creator?playerId=${player.id}`)
}

// Lifecycle
onMounted(() => {
  // Load user profile if not already loaded
  if (!userStore.userProfile && userStore.currentUser) {
    userStore.fetchUserProfile(userStore.currentUser.uid)
  }
})
</script>

<style scoped>
.player-damaged {
  border-color: rgb(var(--v-theme-error)) !important;
  background-color: rgba(var(--v-theme-error), 0.05) !important;
}

.player-damaged :deep(.v-card-text) {
  opacity: 0.8;
}

/* Player card wrapper for proper z-index management */
.player-card-wrapper {
  position: relative;
  z-index: 1;
  transition: z-index 0.2s ease;
}

.player-card-wrapper:hover {
  z-index: 100;
}

.player-card-wrapper.card-selected {
  z-index: 200;
}

/* Ensure the player card itself uses the wrapper's z-index */
.player-card-wrapper :deep(.player-card) {
  position: relative;
}

/* Ensure alerts don't overlap cards */
.v-alert {
  position: relative;
  z-index: 0;
}

/* Manager profile and other sections should stay below selected cards */
.v-card {
  position: relative;
  z-index: 1;
}

/* Squad section should allow cards to overlap when selected */
.v-row {
  position: relative;
}

/* Prevent container from creating stacking context that limits z-index */
.v-container {
  position: relative;
}
</style>