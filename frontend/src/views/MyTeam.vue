<template>
  <v-container>
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
                  md="6" 
                  lg="4"
                >
                  <v-card 
                    :class="{ 'player-damaged': player.condition < 30 }"
                    variant="outlined"
                  >
                    <v-card-text>
                      <div class="d-flex align-center justify-space-between mb-2">
                        <div>
                          <h4 class="text-subtitle-1">{{ player.name }}</h4>
                          <p class="text-caption text-medium-emphasis">{{ player.position }}</p>
                        </div>
                        <v-avatar size="40" :color="getPlayerConditionColor(player.condition)">
                          <span class="text-caption font-weight-bold">
                            {{ player.condition }}
                          </span>
                        </v-avatar>
                      </div>

                      <v-progress-linear
                        :model-value="player.condition"
                        :color="getPlayerConditionColor(player.condition)"
                        height="6"
                        rounded
                        class="mb-2"
                      />

                      <div class="d-flex justify-space-between align-center">
                        <div class="d-flex gap-1">
                          <v-chip size="x-small" variant="outlined">
                            SPD {{ player.stats.speed }}
                          </v-chip>
                          <v-chip size="x-small" variant="outlined">
                            STR {{ player.stats.strength }}
                          </v-chip>
                        </div>
                        
                        <v-btn
                          v-if="player.condition < 30"
                          color="error"
                          variant="text"
                          size="small"
                          prepend-icon="mdi-delete"
                          @click="sendToJunkYard(player)"
                        >
                          Junk Yard
                        </v-btn>
                      </div>
                    </v-card-text>
                  </v-card>
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

const router = useRouter()
const userStore = useUserStore()

// State
const selectedCountry = ref('')
const selectedTeam = ref('')
const loadingTeams = ref(false)
const scouting = ref(false)

// Sample squad data (replace with real data from database)
const squad = ref([
  {
    id: 1,
    name: 'Marcus Silva',
    position: 'Forward',
    condition: 85,
    stats: { speed: 82, strength: 75 }
  },
  {
    id: 2,
    name: 'David Chen',
    position: 'Midfielder',
    condition: 25,
    stats: { speed: 70, strength: 68 }
  },
  {
    id: 3,
    name: 'Alex Rodriguez',
    position: 'Defender',
    condition: 60,
    stats: { speed: 65, strength: 85 }
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
</style>