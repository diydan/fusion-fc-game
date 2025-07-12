<template>
  <div class="recruit-page">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">🎯 Player Recruitment</h1>
      <p class="page-subtitle">Scout and recruit players from around the world</p>
    </div>

    <!-- Filters and Controls -->
    <v-card class="filters-card mb-6">
      <v-card-title>
        <v-icon class="mr-2">mdi-filter</v-icon>
        Filters & Search
      </v-card-title>
      <v-card-text>
        <v-row>
          <!-- Search -->
          <v-col cols="12" md="3">
            <v-text-field
              v-model="searchQuery"
              label="Search players..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>

          <!-- Tier Filter -->
          <v-col cols="6" md="2">
            <v-select
              v-model="selectedTier"
              :items="tierOptions"
              label="Tier"
              variant="outlined"
              density="compact"
              hide-details
            />
          </v-col>

          <!-- Position Filter -->
          <v-col cols="6" md="2">
            <v-select
              v-model="selectedPosition"
              :items="positionOptions"
              label="Position"
              variant="outlined"
              density="compact"
              hide-details
            />
          </v-col>

          <!-- Price Range -->
          <v-col cols="12" md="3">
            <v-range-slider
              v-model="priceRange"
              :min="2000"
              :max="2000000"
              :step="1000"
              label="Price Range"
              density="compact"
              hide-details
            >
              <template v-slot:prepend>
                <span class="text-caption">{{ formatPrice(priceRange[0]) }}</span>
              </template>
              <template v-slot:append>
                <span class="text-caption">{{ formatPrice(priceRange[1]) }}</span>
              </template>
            </v-range-slider>
          </v-col>

          <!-- View Toggle -->
          <v-col cols="12" md="2">
            <v-btn-toggle
              v-model="viewMode"
              variant="outlined"
              density="compact"
              mandatory
              divided
            >
              <v-btn value="table" icon="mdi-table" />
              <v-btn value="cards" icon="mdi-view-grid" />
            </v-btn-toggle>
          </v-col>
        </v-row>

        <!-- Stat Filters -->
        <v-row class="mt-2">
          <v-col cols="12">
            <v-expansion-panels variant="accordion">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon class="mr-2">mdi-chart-bar</v-icon>
                  Advanced Stat Filters
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row>
                    <v-col v-for="stat in statFilters" :key="stat.key" cols="6" md="3">
                      <div class="stat-filter">
                        <label class="stat-label">{{ stat.label }}</label>
                        <v-range-slider
                          v-model="stat.range"
                          :min="0"
                          :max="100"
                          :step="1"
                          density="compact"
                          hide-details
                        />
                        <div class="stat-values">
                          <span>{{ stat.range[0] }}</span>
                          <span>{{ stat.range[1] }}</span>
                        </div>
                      </div>
                    </v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Comparison Panel -->
    <v-card v-if="selectedPlayers.length > 0" class="comparison-card mb-6">
      <v-card-title>
        <v-icon class="mr-2">mdi-compare</v-icon>
        Player Comparison ({{ selectedPlayers.length }}/3)
        <v-spacer />
        <v-btn 
          color="error" 
          variant="outlined" 
          size="small"
          @click="clearComparison"
        >
          Clear All
        </v-btn>
      </v-card-title>
      <v-card-text>
        <div class="comparison-grid">
          <div v-for="player in selectedPlayers" :key="player.id" class="comparison-item">
            <PlayerComparisonCard 
              :player="player" 
              @remove="removeFromComparison"
            />
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Results -->
    <v-card>
      <v-card-title>
        <v-icon class="mr-2">mdi-account-group</v-icon>
        Available Players ({{ filteredPlayers.length }})
        <v-spacer />
        <v-btn
          color="primary"
          variant="outlined"
          @click="generateMorePlayers"
          :loading="generatingPlayers"
        >
          <v-icon class="mr-2">mdi-refresh</v-icon>
          Generate More
        </v-btn>
      </v-card-title>

      <!-- Table View -->
      <div v-if="viewMode === 'table'">
        <v-data-table
          :headers="tableHeaders"
          :items="filteredPlayers"
          :loading="loading"
          item-value="id"
          class="players-table"
          @click:row="openPlayerModal"
        >
          <!-- Name with avatar -->
          <template v-slot:item.name="{ item }">
            <div class="player-name-cell">
              <v-avatar size="32" class="mr-3">
                <v-img :src="item.avatar || '/default-player.png'" />
              </v-avatar>
              <div>
                <div class="font-weight-medium">{{ item.name }}</div>
                <div class="text-caption text-grey">{{ item.nationality }}</div>
              </div>
            </div>
          </template>

          <!-- Position -->
          <template v-slot:item.position="{ item }">
            <v-chip :color="getPositionColor(item.position)" size="small">
              {{ item.position }}
            </v-chip>
          </template>

          <!-- Tier -->
          <template v-slot:item.tier="{ item }">
            <v-chip :color="getTierColor(item.tier)" size="small">
              {{ item.tier.toUpperCase() }}
            </v-chip>
          </template>

          <!-- Overall -->
          <template v-slot:item.overall="{ item }">
            <div class="overall-cell">
              <span class="overall-value">{{ item.overall }}</span>
              <v-progress-linear
                :model-value="item.overall"
                :color="getOverallColor(item.overall)"
                height="4"
                class="mt-1"
              />
            </div>
          </template>

          <!-- Stats -->
          <template v-slot:item.pace="{ item }">
            <StatBar :value="item.stats.pace" />
          </template>
          <template v-slot:item.shooting="{ item }">
            <StatBar :value="item.stats.shooting" />
          </template>
          <template v-slot:item.passing="{ item }">
            <StatBar :value="item.stats.passing" />
          </template>
          <template v-slot:item.defense="{ item }">
            <StatBar :value="item.stats.defense" />
          </template>
          <template v-slot:item.physical="{ item }">
            <StatBar :value="item.stats.physical" />
          </template>

          <!-- Price -->
          <template v-slot:item.price="{ item }">
            <div class="price-cell">
              <span class="price-value">{{ formatPrice(item.price) }}</span>
            </div>
          </template>

          <!-- Actions -->
          <template v-slot:item.actions="{ item }">
            <div class="action-buttons">
              <v-btn
                size="small"
                variant="outlined"
                @click.stop="toggleComparison(item)"
                :color="selectedPlayers.some(p => p.id === item.id) ? 'primary' : 'grey'"
              >
                <v-icon>mdi-compare</v-icon>
              </v-btn>
              <v-btn
                size="small"
                color="success"
                variant="outlined"
                @click.stop="recruitPlayer(item)"
                class="ml-2"
              >
                <v-icon>mdi-account-plus</v-icon>
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </div>

      <!-- Cards View -->
      <div v-else class="cards-view">
        <v-row>
          <v-col
            v-for="player in filteredPlayers"
            :key="player.id"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <PlayerCard
              :player="player"
              @click="openPlayerModal(player)"
              @compare="toggleComparison(player)"
              @recruit="recruitPlayer(player)"
              :is-selected="selectedPlayers.some(p => p.id === player.id)"
            />
          </v-col>
        </v-row>
      </div>
    </v-card>

    <!-- Player Detail Modal -->
    <PlayerDetailModal
      v-model="showPlayerModal"
      :player="selectedPlayerDetail"
      @recruit="recruitPlayer"
      @compare="toggleComparison"
      :is-selected="selectedPlayers.some(p => p?.id === selectedPlayerDetail?.id)"
    />

    <!-- Recruit Confirmation Dialog -->
    <v-dialog v-model="showRecruitDialog" max-width="500">
      <v-card>
        <v-card-title>Confirm Recruitment</v-card-title>
        <v-card-text>
          <div v-if="playerToRecruit">
            <p>Are you sure you want to recruit <strong>{{ playerToRecruit.name }}</strong>?</p>
            <div class="recruitment-summary">
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-currency-usd</v-icon>
                </template>
                <v-list-item-title>Price: {{ formatPrice(playerToRecruit.price) }}</v-list-item-title>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-star</v-icon>
                </template>
                <v-list-item-title>Overall: {{ playerToRecruit.overall }}</v-list-item-title>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-shield</v-icon>
                </template>
                <v-list-item-title>Tier: {{ playerToRecruit.tier?.toUpperCase() }}</v-list-item-title>
              </v-list-item>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showRecruitDialog = false">Cancel</v-btn>
          <v-btn color="success" @click="confirmRecruitment">Recruit Player</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PlayerCard from '@/components/recruit/PlayerCard.vue'
import PlayerDetailModal from '@/components/recruit/PlayerDetailModal.vue'
import PlayerComparisonCard from '@/components/recruit/PlayerComparisonCard.vue'
import StatBar from '@/components/recruit/StatBar.vue'

// Data
const loading = ref(false)
const generatingPlayers = ref(false)
const players = ref([])
const selectedPlayers = ref([])
const searchQuery = ref('')
const selectedTier = ref('all')
const selectedPosition = ref('all')
const priceRange = ref([2000, 2000000])
const viewMode = ref('table')
const showPlayerModal = ref(false)
const selectedPlayerDetail = ref(null)
const showRecruitDialog = ref(false)
const playerToRecruit = ref(null)

// Filter options
const tierOptions = [
  { title: 'All Tiers', value: 'all' },
  { title: 'Amateur', value: 'amateur' },
  { title: 'Semi-Pro', value: 'semi-pro' },
  { title: 'Professional', value: 'pro' },
  { title: 'Elite', value: 'elite' }
]

const positionOptions = [
  { title: 'All Positions', value: 'all' },
  { title: 'Goalkeeper (GK)', value: 'GK' },
  { title: 'Center Back (CB)', value: 'CB' },
  { title: 'Left Back (LB)', value: 'LB' },
  { title: 'Right Back (RB)', value: 'RB' },
  { title: 'Defensive Mid (CDM)', value: 'CDM' },
  { title: 'Central Mid (CM)', value: 'CM' },
  { title: 'Attacking Mid (CAM)', value: 'CAM' },
  { title: 'Left Wing (LW)', value: 'LW' },
  { title: 'Right Wing (RW)', value: 'RW' },
  { title: 'Striker (ST)', value: 'ST' }
]

// Stat filters
const statFilters = ref([
  { key: 'pace', label: 'Pace', range: [0, 100] },
  { key: 'shooting', label: 'Shooting', range: [0, 100] },
  { key: 'passing', label: 'Passing', range: [0, 100] },
  { key: 'defense', label: 'Defense', range: [0, 100] },
  { key: 'physical', label: 'Physical', range: [0, 100] },
  { key: 'dribbling', label: 'Dribbling', range: [0, 100] },
  { key: 'mental', label: 'Mental', range: [0, 100] },
  { key: 'technical', label: 'Technical', range: [0, 100] }
])

// Table headers
const tableHeaders = [
  { title: 'Player', key: 'name', sortable: true, width: 200 },
  { title: 'Position', key: 'position', sortable: true, width: 100 },
  { title: 'Tier', key: 'tier', sortable: true, width: 100 },
  { title: 'Overall', key: 'overall', sortable: true, width: 100 },
  { title: 'Age', key: 'age', sortable: true, width: 80 },
  { title: 'PAC', key: 'pace', sortable: true, width: 80 },
  { title: 'SHO', key: 'shooting', sortable: true, width: 80 },
  { title: 'PAS', key: 'passing', sortable: true, width: 80 },
  { title: 'DEF', key: 'defense', sortable: true, width: 80 },
  { title: 'PHY', key: 'physical', sortable: true, width: 80 },
  { title: 'Price', key: 'price', sortable: true, width: 120 },
  { title: 'Actions', key: 'actions', sortable: false, width: 120 }
]

// Computed
const filteredPlayers = computed(() => {
  let filtered = players.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(player =>
      player.name.toLowerCase().includes(query) ||
      player.nationality.toLowerCase().includes(query) ||
      player.position.toLowerCase().includes(query)
    )
  }

  // Tier filter
  if (selectedTier.value && selectedTier.value !== 'all') {
    filtered = filtered.filter(player => player.tier === selectedTier.value)
  }

  // Position filter
  if (selectedPosition.value && selectedPosition.value !== 'all') {
    filtered = filtered.filter(player => player.position === selectedPosition.value)
  }

  // Price range filter
  filtered = filtered.filter(player =>
    player.price >= priceRange.value[0] && player.price <= priceRange.value[1]
  )

  // Stat filters
  statFilters.value.forEach(filter => {
    if (filter.range[0] > 0 || filter.range[1] < 100) {
      filtered = filtered.filter(player => {
        const statValue = player.stats[filter.key] || 0
        return statValue >= filter.range[0] && statValue <= filter.range[1]
      })
    }
  })

  return filtered
})

// Methods
const formatPrice = (price) => {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(1)}M`
  } else if (price >= 1000) {
    return `$${(price / 1000).toFixed(0)}K`
  }
  return `$${price}`
}

const getPositionColor = (position) => {
  const colors = {
    GK: 'yellow',
    CB: 'red',
    LB: 'blue',
    RB: 'blue',
    CDM: 'green',
    CM: 'green',
    CAM: 'orange',
    LW: 'purple',
    RW: 'purple',
    ST: 'pink'
  }
  return colors[position] || 'grey'
}

const getTierColor = (tier) => {
  const colors = {
    amateur: 'grey',
    'semi-pro': 'green',
    pro: 'blue',
    elite: 'purple'
  }
  return colors[tier] || 'grey'
}

const getOverallColor = (overall) => {
  if (overall >= 90) return 'purple'
  if (overall >= 80) return 'blue'
  if (overall >= 70) return 'green'
  if (overall >= 60) return 'orange'
  return 'red'
}

const toggleComparison = (player) => {
  const index = selectedPlayers.value.findIndex(p => p.id === player.id)
  if (index >= 0) {
    selectedPlayers.value.splice(index, 1)
  } else if (selectedPlayers.value.length < 3) {
    selectedPlayers.value.push(player)
  }
}

const removeFromComparison = (playerId) => {
  const index = selectedPlayers.value.findIndex(p => p.id === playerId)
  if (index >= 0) {
    selectedPlayers.value.splice(index, 1)
  }
}

const clearComparison = () => {
  selectedPlayers.value = []
}

const openPlayerModal = (player) => {
  selectedPlayerDetail.value = player
  showPlayerModal.value = true
}

const recruitPlayer = (player) => {
  playerToRecruit.value = player
  showRecruitDialog.value = true
}

const confirmRecruitment = () => {
  // TODO: Implement recruitment logic
  console.log('Recruiting player:', playerToRecruit.value)
  showRecruitDialog.value = false
  playerToRecruit.value = null
}

const generateMorePlayers = async () => {
  generatingPlayers.value = true
  try {
    const newPlayers = generateRandomPlayers(20)
    players.value.push(...newPlayers)
  } finally {
    generatingPlayers.value = false
  }
}

// Generate random players
const generateRandomPlayers = (count = 50) => {
  const names = [
    'Alex Thunder', 'Marco Silva', 'Diego Santos', 'James Rodriguez', 'Kevin De Bruyne',
    'Luka Modric', 'Mason Mount', 'Phil Foden', 'Jadon Sancho', 'Marcus Rashford',
    'Vinicius Jr', 'Pedri Gonzalez', 'Gavi Paez', 'Jude Bellingham', 'Eduardo Camavinga',
    'Federico Chiesa', 'Lorenzo Pellegrini', 'Nicolo Barella', 'Alessandro Bastoni',
    'Rafael Leao', 'Victor Osimhen', 'Erling Haaland', 'Kylian Mbappe', 'Florian Wirtz',
    'Ryan Gravenberch', 'Cody Gakpo', 'Darwin Nunez', 'Luis Diaz', 'Gabriel Jesus',
    'Bukayo Saka', 'Martin Odegaard', 'Declan Rice', 'Mason Mount', 'Reece James',
    'Trent Alexander-Arnold', 'Virgil van Dijk', 'Sadio Mane', 'Mohamed Salah',
    'Robert Lewandowski', 'Thomas Muller', 'Joshua Kimmich', 'Leon Goretzka',
    'Alphonso Davies', 'Dayot Upamecano', 'Kingsley Coman', 'Serge Gnabry',
    'Timo Werner', 'Kai Havertz', 'Christopher Nkunku', 'Dani Olmo'
  ]

  const nationalities = [
    'England', 'Spain', 'France', 'Germany', 'Italy', 'Brazil', 'Argentina', 
    'Portugal', 'Netherlands', 'Belgium', 'Croatia', 'Poland', 'Denmark',
    'Sweden', 'Norway', 'Austria', 'Switzerland', 'Czech Republic', 'Mexico',
    'Colombia', 'Uruguay', 'Chile', 'Ecuador', 'Peru', 'Japan', 'South Korea'
  ]

  const positions = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST']
  const tiers = ['amateur', 'semi-pro', 'pro', 'elite']

  const generatedPlayers = []

  for (let i = 0; i < count; i++) {
    const tier = tiers[Math.floor(Math.random() * tiers.length)]
    const position = positions[Math.floor(Math.random() * positions.length)]
    
    // Generate stats based on tier and position
    const baseStats = generateStatsForTierAndPosition(tier, position)
    const overall = Math.round((baseStats.pace + baseStats.shooting + baseStats.passing + baseStats.defense + baseStats.physical) / 5)
    
    // Generate price based on overall and tier
    const price = generatePrice(overall, tier)

    generatedPlayers.push({
      id: `player_${Date.now()}_${i}`,
      name: names[Math.floor(Math.random() * names.length)] + ` ${Math.floor(Math.random() * 99) + 1}`,
      nationality: nationalities[Math.floor(Math.random() * nationalities.length)],
      position,
      tier,
      age: Math.floor(Math.random() * 15) + 18, // 18-32 years old
      overall,
      stats: {
        ...baseStats,
        dribbling: Math.floor(Math.random() * 40) + baseStats.pace - 20,
        mental: Math.floor(Math.random() * 30) + 60,
        technical: Math.floor(Math.random() * 30) + baseStats.passing - 20
      },
      price,
      avatar: null // Will use default
    })
  }

  return generatedPlayers
}

const generateStatsForTierAndPosition = (tier, position) => {
  const tierMultipliers = {
    amateur: { min: 30, max: 60 },
    'semi-pro': { min: 50, max: 75 },
    pro: { min: 65, max: 85 },
    elite: { min: 80, max: 95 }
  }

  const positionBias = {
    GK: { pace: -20, shooting: -30, passing: 0, defense: 10, physical: 5 },
    CB: { pace: -10, shooting: -20, passing: -5, defense: 20, physical: 15 },
    LB: { pace: 10, shooting: -10, passing: 5, defense: 5, physical: 0 },
    RB: { pace: 10, shooting: -10, passing: 5, defense: 5, physical: 0 },
    CDM: { pace: -5, shooting: -10, passing: 10, defense: 15, physical: 5 },
    CM: { pace: 0, shooting: 0, passing: 15, defense: 0, physical: 0 },
    CAM: { pace: 5, shooting: 10, passing: 15, defense: -10, physical: -5 },
    LW: { pace: 15, shooting: 5, passing: 5, defense: -15, physical: -5 },
    RW: { pace: 15, shooting: 5, passing: 5, defense: -15, physical: -5 },
    ST: { pace: 5, shooting: 20, passing: -5, defense: -20, physical: 10 }
  }

  const { min, max } = tierMultipliers[tier]
  const bias = positionBias[position] || {}

  return {
    pace: Math.max(0, Math.min(100, Math.floor(Math.random() * (max - min)) + min + (bias.pace || 0))),
    shooting: Math.max(0, Math.min(100, Math.floor(Math.random() * (max - min)) + min + (bias.shooting || 0))),
    passing: Math.max(0, Math.min(100, Math.floor(Math.random() * (max - min)) + min + (bias.passing || 0))),
    defense: Math.max(0, Math.min(100, Math.floor(Math.random() * (max - min)) + min + (bias.defense || 0))),
    physical: Math.max(0, Math.min(100, Math.floor(Math.random() * (max - min)) + min + (bias.physical || 0)))
  }
}

const generatePrice = (overall, tier) => {
  const tierPrices = {
    amateur: { min: 2000, max: 25000 },
    'semi-pro': { min: 20000, max: 150000 },
    pro: { min: 100000, max: 800000 },
    elite: { min: 500000, max: 2000000 }
  }

  const { min, max } = tierPrices[tier]
  const overallMultiplier = overall / 100
  const basePrice = min + (max - min) * overallMultiplier
  
  // Add some randomness
  const variation = 0.3 // ±30% variation
  const randomFactor = 1 + (Math.random() - 0.5) * variation
  
  return Math.round(basePrice * randomFactor)
}

// Initialize
onMounted(() => {
  loading.value = true
  try {
    players.value = generateRandomPlayers(100)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.recruit-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 1.2rem;
  color: var(--v-theme-on-surface-variant);
}

.filters-card {
  background: var(--v-theme-surface-variant);
}

.stat-filter {
  padding: 12px;
  background: var(--v-theme-surface);
  border-radius: 8px;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--v-theme-on-surface-variant);
  display: block;
  margin-bottom: 8px;
}

.stat-values {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--v-theme-on-surface-variant);
  margin-top: 4px;
}

.comparison-card {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.1), rgba(var(--v-theme-secondary), 0.1));
  border: 1px solid rgba(var(--v-theme-primary), 0.3);
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.player-name-cell {
  display: flex;
  align-items: center;
}

.overall-cell {
  min-width: 80px;
}

.overall-value {
  font-weight: 600;
  font-size: 1.1rem;
}

.price-cell {
  font-weight: 600;
  color: var(--v-theme-primary);
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.cards-view {
  padding: 24px;
}

.players-table :deep(.v-data-table__tr) {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.players-table :deep(.v-data-table__tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.recruitment-summary {
  margin-top: 16px;
  background: var(--v-theme-surface-variant);
  border-radius: 8px;
  padding: 8px;
}

@media (max-width: 768px) {
  .recruit-page {
    padding: 16px;
  }

  .page-title {
    font-size: 2rem;
  }

  .comparison-grid {
    grid-template-columns: 1fr;
  }
}
</style>
