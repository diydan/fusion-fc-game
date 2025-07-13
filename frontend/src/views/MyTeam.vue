<template>
  <v-container @click="handleContainerClick">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 text-md-h3 font-weight-bold mb-6">My Team</h1>
      </v-col>
    </v-row>

    <!-- Current Squad Section -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between ma-2">
            <div class="d-flex align-center">
              <v-icon class="me-2">mdi-account-group</v-icon>
              Squad
            </div>
            <v-btn
              color="green"
              variant="elevated"
              prepend-icon="mdi-account-plus"
              @click="goToRecruitPage"
              size="large"
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
              <v-row class="mt-2">
                <v-col
                  v-for="player in squad"
                  :key="player.id"
                  cols="12"
                  sm="6"
                  md="4"
                  lg="4"
                >
                  <div class="player-card-wrapper" :class="{ 'card-selected': selectedPlayers.includes(player.id) }">
                    <PlayerCardV3
                      :player="player"
                      :is-selected="selectedPlayers.includes(player.id)"
                      @click.stop="togglePlayerSelection(player.id)"
                      @compare="togglePlayerSelection(player.id)"
                      @recruit="handlePlayerAction(player)"
                      @select-bot="selectBotForPlayer(player)"
                      @add-powerups="goToCharacterCreator(player)"
                    />
                  </div>
                  

                </v-col>
              </v-row>


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
    name: 'Root',
    position: 'FW',
    nationality: 'Brazil',
    overall: 60,
    condition: 85,
    tier: 'amateur',
    price: 180000,
    stats: {
      pace: 58,
      shooting: 62,
      passing: 55,
      defense: 35,
      physical: 60,
      dribbling: 65
    },
    bot: null
  },
  {
    id: 2,
    name: 'Sage',
    position: 'MF',
    nationality: 'China',
    overall: 58,
    condition: 75,
    tier: 'amateur',
    price: 160000,
    stats: {
      pace: 55,
      shooting: 50,
      passing: 68,
      defense: 58,
      physical: 55,
      dribbling: 60
    },
    bot: { name: 'DanBot', model: '/bot1/soccer_player.fbx' }
  },
  {
    id: 3,
    name: 'Stone',
    position: 'DF',
    nationality: 'Spain',
    overall: 62,
    condition: 80,
    tier: 'amateur',
    price: 170000,
    stats: {
      pace: 50,
      shooting: 35,
      passing: 58,
      defense: 70,
      physical: 68,
      dribbling: 45
    },
    bot: null
  },
  {
    id: 4,
    name: 'Reed',
    position: 'GK',
    nationality: 'England',
    overall: 58,
    condition: 75,
    tier: 'amateur',
    price: 150000,
    stats: {
      pace: 45,
      shooting: 25,
      passing: 55,
      defense: 70,
      physical: 65,
      dribbling: 35
    },
    bot: null
  },
  {
    id: 5,
    name: 'Moss',
    position: 'MF',
    nationality: 'Mexico',
    overall: 56,
    condition: 80,
    tier: 'amateur',
    price: 140000,
    stats: {
      pace: 60,
      shooting: 48,
      passing: 62,
      defense: 52,
      physical: 55,
      dribbling: 58
    },
    bot: null
  },
  {
    id: 6,
    name: 'Bark',
    position: 'DF',
    nationality: 'France',
    overall: 55,
    condition: 70,
    tier: 'amateur',
    price: 120000,
    stats: {
      pace: 50,
      shooting: 30,
      passing: 52,
      defense: 68,
      physical: 70,
      dribbling: 40
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

// Go to character creator for powerups
const goToCharacterCreator = (player) => {
  console.log('Adding powerups for player:', player)
  router.push('/character-creator')
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