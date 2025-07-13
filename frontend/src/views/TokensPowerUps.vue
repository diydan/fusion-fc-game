<template>
  <div class="page-background">
    <v-container fluid class="pa-4">
    <div class="page-header mb-8">
      <h1 class="page-title">Tokens & PowerUps</h1>
      <p class="page-subtitle">View your Chiliz wallet tokens and available game PowerUps</p>
    </div>

    <!-- Wallet Connection Status -->
    <v-card class="wallet-status-card mb-6" elevation="0">
      <v-card-text class="pa-4">
            <div v-if="walletConnected" class="d-flex align-center">
              <v-chip color="success" variant="tonal" class="me-3">
                <v-icon start size="small">mdi-check-circle</v-icon>
                Connected
              </v-chip>
              <span class="text-caption">{{ truncateAddress(walletAddress, 6) }}</span>
              <v-btn 
                icon="mdi-content-copy" 
                size="x-small" 
                variant="text" 
                @click="copyAddress"
                class="ml-2"
              />
              <v-spacer />
              <v-btn
                color="primary"
                size="small"
                prepend-icon="mdi-refresh"
                @click="refreshTokens"
                :loading="loading"
              >
                Refresh
              </v-btn>
            </div>
            <div v-else class="d-flex align-center">
              <v-chip color="warning" variant="tonal" class="me-3">
                <v-icon start size="small">mdi-alert-circle</v-icon>
                Not Connected
              </v-chip>
              <v-btn
                color="primary"
                prepend-icon="mdi-wallet-plus"
                @click="connectWallet"
                :loading="connecting"
              >
                Connect Wallet
              </v-btn>
            </div>
      </v-card-text>
    </v-card>

    <!-- Network Info -->
    <v-row v-if="walletConnected" class="mb-6">
      <v-col cols="12" md="4">
        <div class="stat-card">
          <v-icon size="24" color="primary">mdi-web</v-icon>
          <div class="stat-value">{{ currentNetwork }}</div>
          <div class="stat-label">Network</div>
        </div>
      </v-col>
      <v-col cols="12" md="4">
        <div class="stat-card">
          <v-icon size="24" color="primary">mdi-currency-eth</v-icon>
          <div class="stat-value">{{ nativeBalance }} CHZ</div>
          <div class="stat-label">Native Balance</div>
        </div>
      </v-col>
      <v-col cols="12" md="4">
        <div class="stat-card">
          <v-icon size="24" color="primary">mdi-coins</v-icon>
          <div class="stat-value">{{ tokens.length }}</div>
          <div class="stat-label">Tokens Held</div>
        </div>
      </v-col>
    </v-row>

    <!-- Tokens Table -->
    <v-card v-if="walletConnected" class="content-card mb-6" elevation="0">
      <div class="section-header">
        <h2 class="section-title">Token Holdings</h2>
        <v-chip v-if="loading" variant="flat" size="small">
          <v-icon start size="x-small">mdi-loading</v-icon>
          Loading...
        </v-chip>
      </div>
      <v-card-text class="pa-0">
            <v-data-table
              :headers="tokenHeaders"
              :items="tokens"
              :loading="loading"
              class="elevation-0"
              item-value="address"
            >
              <template v-slot:item.symbol="{ item }">
                <div class="d-flex align-center">
                  <v-avatar size="32" class="me-3">
                    <v-img 
                      v-if="item.logoURI || getTokenLogo(item.symbol)" 
                      :src="item.logoURI || getTokenLogo(item.symbol)"
                      :alt="item.symbol"
                    >
                      <template v-slot:placeholder>
                        <div class="token-placeholder">{{ item.symbol.charAt(0) }}</div>
                      </template>
                    </v-img>
                    <div v-else class="token-placeholder">{{ item.symbol.charAt(0) }}</div>
                  </v-avatar>
                  <div>
                    <div class="font-weight-medium">{{ item.symbol }}</div>
                    <div class="text-caption text-medium-emphasis">{{ item.name }}</div>
                  </div>
                </div>
              </template>
              
              <template v-slot:item.balance="{ item }">
                <span class="font-weight-medium">{{ item.formattedBalance || formatBalance(item.balance, item.decimals) }} {{ item.symbol }}</span>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  @click="viewTokenDetails(item)"
                >
                  <v-icon>mdi-eye</v-icon>
                </v-btn>
              </template>

              <template v-slot:no-data>
                <div class="text-center py-8">
                  <v-icon size="48" color="medium-emphasis" class="mb-4">mdi-coins</v-icon>
                  <p class="text-body-1 text-medium-emphasis mb-2">No tokens found</p>
                  <p class="text-caption text-medium-emphasis mb-2">
                    Connect your wallet and ensure you're on the Chiliz network
                  </p>
                  <p class="text-caption text-medium-emphasis" v-if="walletConnected">
                    Wallet: {{ truncateAddress(walletAddress, 6) }} on {{ currentNetwork }}
                  </p>
                  <v-btn 
                    variant="outlined" 
                    size="small" 
                    class="mt-2"
                    @click="debugTokenFetch"
                  >
                    Debug Token Fetch
                  </v-btn>
                </div>
              </template>
            </v-data-table>
      </v-card-text>
    </v-card>

    <!-- PowerUps Table -->
    <v-card v-if="walletConnected" class="content-card mb-6" elevation="0">
      <div class="section-header">
        <h2 class="section-title">Game PowerUps</h2>
      </div>
      <v-card-text class="pa-0">
            <v-data-table
              :headers="powerUpHeaders"
              :items="powerUps"
              :loading="loading"
              class="elevation-0"
              item-value="id"
            >
              <template v-slot:item.name="{ item }">
                <div class="d-flex align-center">
                  <v-icon :color="item.rarity === 'legendary' ? 'warning' : item.rarity === 'rare' ? 'info' : 'success'" class="me-2">
                    {{ item.icon }}
                  </v-icon>
                  {{ item.name }}
                </div>
              </template>
              
              <template v-slot:item.rarity="{ item }">
                <v-chip 
                  :color="item.rarity === 'legendary' ? 'warning' : item.rarity === 'rare' ? 'info' : 'success'"
                  variant="tonal"
                  size="small"
                >
                  {{ item.rarity }}
                </v-chip>
              </template>
              
              <template v-slot:item.status="{ item }">
                <v-chip 
                  :color="item.status === 'active' ? 'success' : 'surface'"
                  variant="tonal"
                  size="small"
                >
                  {{ item.status }}
                </v-chip>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn
                  v-if="item.status === 'available'"
                  color="primary"
                  size="small"
                  @click="activatePowerUp(item)"
                >
                  Activate
                </v-btn>
                <v-btn
                  v-else
                  icon
                  size="small"
                  variant="text"
                  @click="viewPowerUpDetails(item)"
                >
                  <v-icon>mdi-eye</v-icon>
                </v-btn>
              </template>

              <template v-slot:no-data>
                <div class="text-center py-8">
                  <v-icon size="48" color="medium-emphasis" class="mb-4">mdi-lightning-bolt-outline</v-icon>
                  <p class="text-body-1 text-medium-emphasis mb-2">No PowerUps available</p>
                  <p class="text-caption text-medium-emphasis">
                    PowerUps will appear here when you collect them in-game
                  </p>
                </div>
              </template>
            </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Teams Matrix Section -->
    <v-card class="content-card mb-6" elevation="0">
      <div class="section-header">
        <h2 class="section-title">Teams Matrix</h2>
      </div>
      <v-card-text>
            <v-tabs v-model="matrixView" centered grow class="mb-6 view-toggle">
              <v-tab value="table" class="view-btn">📊 Table View</v-tab>
              <v-tab value="chart" class="view-btn">📈 Chart View</v-tab>
            </v-tabs>

            <v-window v-model="matrixView">
              <!-- Table View -->
              <v-window-item value="table">
                <v-row class="controls mb-4">
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="teamFilter"
                      label="Filter by Team"
                      placeholder="Type team name..."
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-select
                      v-model="countryFilter"
                      :items="countryOptions"
                      label="Filter by Country"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-select
                      v-model="attributeSort"
                      :items="sortOptions"
                      item-title="title"
                      item-value="value"
                      label="Sort by Attribute"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-select>
                  </v-col>
                </v-row>

                <div class="legend mb-4">
                  <div v-for="legend in ratingLegend" :key="legend.label" class="legend-item">
                    <div class="legend-color" :class="legend.class"></div>
                    <span>{{ legend.label }}</span>
                  </div>
                </div>

                <div class="table-container">
                  <v-table fixed-header class="teams-table">
                    <thead>
                      <tr>
                        <th class="team-header sortable" @click="handleSort('team')">
                          Team
                          <span class="sort-indicator">
                            <v-icon v-if="sortColumn === 'team' && sortDirection === 'asc'" size="x-small">mdi-chevron-up</v-icon>
                            <v-icon v-else-if="sortColumn === 'team' && sortDirection === 'desc'" size="x-small">mdi-chevron-down</v-icon>
                          </span>
                        </th>
                        <th class="country-header sortable" @click="handleSort('country')">
                          Country
                          <span class="sort-indicator">
                            <v-icon v-if="sortColumn === 'country' && sortDirection === 'asc'" size="x-small">mdi-chevron-up</v-icon>
                            <v-icon v-else-if="sortColumn === 'country' && sortDirection === 'desc'" size="x-small">mdi-chevron-down</v-icon>
                          </span>
                        </th>
                        <th class="sortable" @click="handleSort('overall')">
                          Overall
                          <span class="sort-indicator">
                            <v-icon v-if="sortColumn === 'overall' && sortDirection === 'asc'" size="x-small">mdi-chevron-up</v-icon>
                            <v-icon v-else-if="sortColumn === 'overall' && sortDirection === 'desc'" size="x-small">mdi-chevron-down</v-icon>
                          </span>
                        </th>
                        <th class="category-header"><span>Core Attributes</span></th>
                        <th class="sortable" @click="handleSort('attack')">
                          Attack
                          <span class="sort-indicator">
                            <v-icon v-if="sortColumn === 'attack' && sortDirection === 'asc'" size="x-small">mdi-chevron-up</v-icon>
                            <v-icon v-else-if="sortColumn === 'attack' && sortDirection === 'desc'" size="x-small">mdi-chevron-down</v-icon>
                          </span>
                        </th>
                        <th class="sortable" @click="handleSort('speed')">
                          Speed
                          <span class="sort-indicator">
                            <v-icon v-if="sortColumn === 'speed' && sortDirection === 'asc'" size="x-small">mdi-chevron-up</v-icon>
                            <v-icon v-else-if="sortColumn === 'speed' && sortDirection === 'desc'" size="x-small">mdi-chevron-down</v-icon>
                          </span>
                        </th>
                        <th class="sortable" @click="handleSort('skill')">
                          Skill
                          <span class="sort-indicator">
                            <v-icon v-if="sortColumn === 'skill' && sortDirection === 'asc'" size="x-small">mdi-chevron-up</v-icon>
                            <v-icon v-else-if="sortColumn === 'skill' && sortDirection === 'desc'" size="x-small">mdi-chevron-down</v-icon>
                          </span>
                        </th>
                        <th class="sortable" @click="handleSort('defense')">
                          Defense
                          <span class="sort-indicator">
                            <v-icon v-if="sortColumn === 'defense' && sortDirection === 'asc'" size="x-small">mdi-chevron-up</v-icon>
                            <v-icon v-else-if="sortColumn === 'defense' && sortDirection === 'desc'" size="x-small">mdi-chevron-down</v-icon>
                          </span>
                        </th>
                        <th class="sortable" @click="handleSort('physical')">
                          Physical
                          <span class="sort-indicator">
                            <v-icon v-if="sortColumn === 'physical' && sortDirection === 'asc'" size="x-small">mdi-chevron-up</v-icon>
                            <v-icon v-else-if="sortColumn === 'physical' && sortDirection === 'desc'" size="x-small">mdi-chevron-down</v-icon>
                          </span>
                        </th>
                        <th class="sortable" @click="handleSort('mental')">
                          Mental
                          <span class="sort-indicator">
                            <v-icon v-if="sortColumn === 'mental' && sortDirection === 'asc'" size="x-small">mdi-chevron-up</v-icon>
                            <v-icon v-else-if="sortColumn === 'mental' && sortDirection === 'desc'" size="x-small">mdi-chevron-down</v-icon>
                          </span>
                        </th>
                        <th class="sortable" @click="handleSort('aggression')">
                          Aggression
                          <span class="sort-indicator">
                            <v-icon v-if="sortColumn === 'aggression' && sortDirection === 'asc'" size="x-small">mdi-chevron-up</v-icon>
                            <v-icon v-else-if="sortColumn === 'aggression' && sortDirection === 'desc'" size="x-small">mdi-chevron-down</v-icon>
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="team in filteredAndSortedTeams" :key="team.token">
                        <td class="team-cell" @click="showTeamDetails(team)">
                          <div class="team-info">
                            <v-avatar size="32">
                              <v-img :src="team.logo" :alt="team.team"></v-img>
                            </v-avatar>
                            <div class="team-details">
                              <div class="team-name">{{ team.team }}</div>
                              <div class="team-meta">
                                <span>{{ team.token }}</span>
                                <span class="mx-1">•</span>
                                <span>{{ team.league }}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td class="country-cell">
                          <v-img :src="team.flag" :alt="team.country" class="country-flag-large"></v-img>
                        </td>
                        <td><span class="rating" :class="getRatingClass(team.overall)">{{ team.overall }}</span></td>
                        <td class="category-separator"></td>
                        <td><span class="rating" :class="getRatingClass(team.attack)">{{ team.attack }}</span></td>
                        <td><span class="rating" :class="getRatingClass(team.speed)">{{ team.speed }}</span></td>
                        <td><span class="rating" :class="getRatingClass(team.skill)">{{ team.skill }}</span></td>
                        <td><span class="rating" :class="getRatingClass(team.defense)">{{ team.defense }}</span></td>
                        <td><span class="rating" :class="getRatingClass(team.physical)">{{ team.physical }}</span></td>
                        <td><span class="rating" :class="getRatingClass(team.mental)">{{ team.mental }}</span></td>
                        <td><span class="rating" :class="getRatingClass(team.aggression)">{{ team.aggression }}</span></td>
                      </tr>
                    </tbody>
                  </v-table>
                </div>
              </v-window-item>

              <!-- Chart View -->
              <v-window-item value="chart">
                <v-row class="chart-controls mb-4">
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="chartTeamFilter"
                      :items="chartFilterOptions"
                      item-title="title"
                      item-value="value"
                      label="Show Teams"
                      variant="outlined"
                      density="compact"
                      hide-details
                    ></v-select>
                  </v-col>
                </v-row>
                <div class="chart-container">
                  <h3 class="chart-title">Team Comparison - 6 Core Dimensions</h3>
                  <canvas ref="teamsRadarChartCanvas" width="800" height="600"></canvas>
                  <div ref="chartLegendContainer" class="chart-legend"></div>
                </div>
              </v-window-item>
            </v-window>
            
            <!-- Bonus Tokens Section -->
            <div class="bonus-tokens-section mt-6">
                <h3 class="text-center mb-4">⚡ Performance Boost Tokens</h3>
                <p class="text-center text-grey mb-6">Each token provides 1% bonus to specific attributes (max 100% total)</p>
                
                <v-row>
                  <v-col cols="12" md="3">
                    <v-card class="bonus-card">
                      <div class="bonus-icon d-flex align-center justify-center">
                        <img src="https://www.socios.com/wp-content/uploads/2024/01/Token-AM.svg" alt="Aston Martin" style="max-width: 70px; height: auto" class="mr-1">
                        <img src="https://www.socios.com/wp-content/uploads/2024/01/Token-ROUSH.svg" alt="Roush" style="max-width: 70px; height: auto">
                      </div>
                      <h4>Motorsport Tokens</h4>
                      <div class="bonus-value mt-3">+1% Speed</div>
                    </v-card>
                  </v-col>
                  
                  <v-col cols="12" md="3">
                    <v-card class="bonus-card">
                      <div class="bonus-icon d-flex align-center justify-center">
                        <img src="https://www.socios.com/wp-content/uploads/2024/01/Token-SHARKS.svg" alt="Sharks" style="max-width: 70px; height: auto" class="mr-1">
                        <img src="https://www.socios.com/wp-content/uploads/2024/01/Token-SFP.svg" alt="SF Pioneers" style="max-width: 70px; height: auto">
                      </div>
                      <h4>Rugby Tokens</h4>
                      <div class="bonus-value mt-3">+1% Physical</div>
                    </v-card>
                  </v-col>
                  
                  <v-col cols="12" md="3">
                    <v-card class="bonus-card">
                      <div class="bonus-icon d-flex align-center justify-center flex-wrap">
                        <img src="https://www.socios.com/wp-content/uploads/2024/01/Token-OG.svg" alt="OG" style="max-width: 70px; height: auto" class="ma-1">
                        <img src="https://www.socios.com/wp-content/uploads/2024/01/Token-TH.svg" alt="Talon" style="max-width: 70px; height: auto" class="ma-1">
                        <img src="https://www.socios.com/wp-content/uploads/2024/01/Token-ALL.svg" alt="Alliance" style="max-width: 70px; height: auto" class="ma-1">
                        <img src="https://www.socios.com/wp-content/uploads/2024/01/Token-MIBR.svg" alt="MIBR" style="max-width: 70px; height: auto" class="ma-1">
                      </div>
                      <h4>Esports Tokens</h4>
                      <div class="bonus-value mt-3">+1% Mental</div>
                    </v-card>
                  </v-col>
                  
                  <v-col cols="12" md="3">
                    <v-card class="bonus-card">
                      <div class="bonus-icon d-flex align-center justify-center">
                        <img src="https://www.socios.com/wp-content/uploads/2024/01/Token-UFC.svg" alt="UFC" style="max-width: 70px; height: auto" class="mr-2">
                        <img src="https://www.socios.com/wp-content/uploads/2024/01/Token-PFL.svg" alt="PFL" style="max-width: 70px; height: auto">
                      </div>
                      <h4>UFC & PFL Tokens</h4>
                      <div class="bonus-value mt-3">+1% Aggression</div>
                    </v-card>
                  </v-col>
                </v-row>
            </div>
          </v-card-text>
    </v-card>

    <!-- Token Details Dialog -->
    <v-dialog v-model="tokenDialog" max-width="500">
      <v-card v-if="selectedToken">
        <v-card-title>{{ selectedToken.name }} ({{ selectedToken.symbol }})</v-card-title>
        <v-card-text>
          <v-list density="compact">
            <v-list-item>
              <v-list-item-title>Contract Address</v-list-item-title>
              <v-list-item-subtitle class="font-mono">{{ selectedToken.address }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>Balance</v-list-item-title>
              <v-list-item-subtitle>{{ selectedToken.formattedBalance || formatBalance(selectedToken.balance, selectedToken.decimals) }} {{ selectedToken.symbol }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>Raw Balance</v-list-item-title>
              <v-list-item-subtitle class="font-mono">{{ selectedToken.balance }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>Decimals</v-list-item-title>
              <v-list-item-subtitle>{{ selectedToken.decimals }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item v-if="selectedToken.usdValue">
              <v-list-item-title>USD Value</v-list-item-title>
              <v-list-item-subtitle>${{ selectedToken.usdValue.toFixed(2) }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="tokenDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="top"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import GameButton from '@/components/GameButton.vue'
import { 
  chilizWallet, 
  formatTokenBalance, 
  truncateAddress, 
  getTokenIcon, 
  generateMockPowerUps 
} from '@/services/chiliz-wallet.js'

const userStore = useUserStore()

// State
const loading = ref(false)
const connecting = ref(false)
const tokens = ref([])
const powerUps = ref([])
const walletAddress = ref('')
const currentNetwork = ref('Chiliz Spicy Testnet')
const nativeBalance = ref('0.00')
const tokenDialog = ref(false)
const selectedToken = ref(null)
const networkInfo = ref(null)

const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

// Teams Matrix state
const matrixView = ref('table')
const teamFilter = ref('')
const countryFilter = ref(null)
const attributeSort = ref(null)
const sortColumn = ref(null)
const sortDirection = ref('desc')
const chartTeamFilter = ref('top10')
const teamsRadarChartCanvas = ref(null)
const chartLegendContainer = ref(null)
const selectedTeam = ref(null)
const isModalVisible = ref(false)

// Sample teams data for preview
const sampleTeams = ref([
  {
    team: 'Paris Saint-Germain',
    token: '$PSG',
    country: 'France',
    league: 'Ligue 1',
    logo: 'https://www.socios.com/wp-content/uploads/2024/01/Token-PSG.svg',
    flag: 'https://flagicons.lipis.dev/flags/4x3/fr.svg',
    overall: 90,
    attack: 89,
    speed: 87,
    skill: 89,
    defense: 68,
    physical: 81,
    mental: 89,
    aggression: 84
  },
  {
    team: 'FC Barcelona',
    token: '$BAR',
    country: 'Spain',
    league: 'La Liga',
    logo: 'https://www.socios.com/wp-content/uploads/2024/01/Token-FCB.svg',
    flag: 'https://flagicons.lipis.dev/flags/4x3/es.svg',
    overall: 89,
    attack: 87,
    speed: 87,
    skill: 90,
    defense: 73,
    physical: 82,
    mental: 90,
    aggression: 75
  },
  {
    team: 'Manchester City',
    token: '$CITY',
    country: 'England',
    league: 'Premier League',
    logo: 'https://www.socios.com/wp-content/uploads/2024/01/Token-CITY.svg',
    flag: 'https://flagicons.lipis.dev/flags/4x3/gb-eng.svg',
    overall: 88,
    attack: 89,
    speed: 86,
    skill: 91,
    defense: 85,
    physical: 84,
    mental: 90,
    aggression: 80
  },
  {
    team: 'Juventus',
    token: '$JUV',
    country: 'Italy',
    league: 'Serie A',
    logo: 'https://www.socios.com/wp-content/uploads/2024/01/Token-JUV.svg',
    flag: 'https://flagicons.lipis.dev/flags/4x3/it.svg',
    overall: 83,
    attack: 81,
    speed: 75,
    skill: 81,
    defense: 87,
    physical: 82,
    mental: 84,
    aggression: 84
  }
])

// Teams Matrix computed and options
const filteredAndSortedTeams = computed(() => {
  let data = sampleTeams.value

  if (teamFilter.value) {
    const filter = teamFilter.value.toLowerCase()
    data = data.filter(team => 
      team.team.toLowerCase().includes(filter) || 
      team.token.toLowerCase().includes(filter)
    )
  }

  if (countryFilter.value) {
    data = data.filter(team => team.country === countryFilter.value)
  }

  if (sortColumn.value) {
    data = [...data].sort((a, b) => {
      const aVal = a[sortColumn.value]
      const bVal = b[sortColumn.value]
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection.value === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      
      return sortDirection.value === 'asc' 
        ? aVal - bVal
        : bVal - aVal
    })
  } else if (attributeSort.value) {
    data = [...data].sort((a, b) => b[attributeSort.value] - a[attributeSort.value])
  }

  return data
})

const countryOptions = computed(() => {
  const countries = [...new Set(sampleTeams.value.map(t => t.country))]
  return countries.sort()
})

const sortOptions = [
  { title: 'Overall Rating', value: 'overall' },
  { title: 'Attack', value: 'attack' },
  { title: 'Speed', value: 'speed' },
  { title: 'Skill', value: 'skill' },
  { title: 'Defense', value: 'defense' },
  { title: 'Physical', value: 'physical' },
  { title: 'Mental', value: 'mental' },
  { title: 'Aggression', value: 'aggression' }
]

const chartFilterOptions = [
  { title: 'All Teams', value: 'all' },
  { title: 'Top 10 Teams', value: 'top10' },
  { title: 'Elite Teams (85+)', value: 'elite' },
  { title: 'English Teams', value: 'england' },
  { title: 'Spanish Teams', value: 'spain' },
  { title: 'Italian Teams', value: 'italy' }
]

const ratingLegend = [
  { label: '90-100 (Elite)', class: 'rating-90-100' },
  { label: '80-89 (Very Good)', class: 'rating-80-89' },
  { label: '70-79 (Good)', class: 'rating-70-79' },
  { label: '60-69 (Average)', class: 'rating-60-69' },
  { label: '50-59 (Below Average)', class: 'rating-50-59' }
]

// Computed
const walletConnected = computed(() => {
  return walletAddress.value !== ''
})

// Table headers
const tokenHeaders = [
  { title: 'Token', key: 'symbol', align: 'start' },
  { title: 'Name', key: 'name', align: 'start' },
  { title: 'Balance', key: 'balance', align: 'end' },
  { title: 'Actions', key: 'actions', align: 'center', sortable: false }
]

const powerUpHeaders = [
  { title: 'PowerUp', key: 'name', align: 'start' },
  { title: 'Type', key: 'type', align: 'start' },
  { title: 'Rarity', key: 'rarity', align: 'center' },
  { title: 'Status', key: 'status', align: 'center' },
  { title: 'Actions', key: 'actions', align: 'center', sortable: false }
]

// Methods
const connectWallet = async () => {
  connecting.value = true
  try {
    const address = await chilizWallet.connectWallet()
    walletAddress.value = address
    
    // Save wallet address to user profile
    await userStore.updateUserProfile({
      walletAddress: address,
      lastWalletConnection: new Date().toISOString()
    })
    
    // Switch to Chiliz network
    await chilizWallet.switchToChilizNetwork('testnet')
    
    // Get network info
    networkInfo.value = await chilizWallet.getNetworkInfo()
    currentNetwork.value = networkInfo.value.isChiliz 
      ? `Chiliz ${networkInfo.value.networkType}` 
      : networkInfo.value.name
    
    await refreshTokens()
    showSnackbar('Wallet connected successfully!', 'success')
  } catch (error) {
    console.error('Failed to connect wallet:', error)
    showSnackbar(error.message || 'Failed to connect wallet', 'error')
  } finally {
    connecting.value = false
  }
}

const refreshTokens = async () => {
  if (!walletAddress.value) return
  
  loading.value = true
  try {
    // Get wallet summary with real token data
    const walletSummary = await chilizWallet.getWalletSummary(walletAddress.value)
    
    // Update native balance
    nativeBalance.value = parseFloat(walletSummary.nativeBalance).toFixed(4)
    
    // Update network info
    currentNetwork.value = walletSummary.network === 'mainnet' 
      ? 'Chiliz Mainnet' 
      : 'Chiliz Spicy Testnet'
    
    // Format tokens for the table
    console.log('Raw wallet tokens:', walletSummary.tokens)
    tokens.value = walletSummary.tokens.map(token => {
      console.log('Token:', token.symbol, 'Balance:', token.balance, 'FormattedBalance:', token.formattedBalance, 'Decimals:', token.decimals)
      return { ...token }
    })
    
    // Generate PowerUps based on token holdings
    powerUps.value = generateMockPowerUps(walletSummary.tokens)
    
    showSnackbar('Tokens refreshed successfully!', 'success')
  } catch (error) {
    console.error('Failed to refresh tokens:', error)
    showSnackbar('Failed to refresh token data', 'error')
  } finally {
    loading.value = false
  }
}

// Mock USD value calculation (in real app, fetch from price API)
const calculateUsdValue = (symbol, balance) => {
  const mockPrices = {
    CHZ: 0.12,
    PSG: 1.85,
    BAR: 2.10,
    JUV: 1.95,
    ATM: 1.75
  }
  
  const price = mockPrices[symbol] || 0
  return balance * price
}

const formatBalance = (balance, decimals) => {
  // If balance is already a formatted string (like from formattedBalance)
  if (typeof balance === 'string' && balance.includes('.')) {
    const num = parseFloat(balance)
    return num < 1 ? num.toFixed(4) : num.toLocaleString()
  }
  
  // If balance is a raw number string from the contract
  if (typeof balance === 'string' && !isNaN(balance)) {
    const divisor = Math.pow(10, decimals || 18)
    const formatted = parseFloat(balance) / divisor
    return formatted < 1 ? formatted.toFixed(4) : formatted.toLocaleString()
  }
  
  // Fallback for any other format
  return '0'
}

const viewTokenDetails = (token) => {
  selectedToken.value = token
  tokenDialog.value = true
}

const viewPowerUpDetails = (powerUp) => {
  showSnackbar(`${powerUp.name}: ${powerUp.description}`, 'info')
}

const activatePowerUp = (powerUp) => {
  powerUp.status = 'active'
  showSnackbar(`${powerUp.name} activated!`, 'success')
}

const copyAddress = async () => {
  try {
    await navigator.clipboard.writeText(walletAddress.value)
    showSnackbar('Address copied to clipboard!', 'success')
  } catch (error) {
    console.error('Failed to copy address:', error)
    showSnackbar('Failed to copy address', 'error')
  }
}

const debugTokenFetch = async () => {
  console.log('=== DEBUG TOKEN FETCH ===')
  console.log('Wallet Address:', walletAddress.value)
  console.log('Current Network:', currentNetwork.value)
  console.log('Network Info:', networkInfo.value)
  
  try {
    // Try direct balance check for known tokens
    const testTokens = [
      '0x677F7e16C7Dd57be1D4C8aD1244883214953DC47', // CHZ
      '0x1234567890123456789012345678901234567890'  // Test token
    ]
    
    for (const tokenAddr of testTokens) {
      try {
        const balance = await chilizWallet.getTokenBalance(tokenAddr, walletAddress.value)
        console.log(`Token ${tokenAddr} balance:`, balance)
      } catch (error) {
        console.log(`Token ${tokenAddr} error:`, error.message)
      }
    }
    
    // Try explorer API
    const explorerTokens = await chilizWallet.getTokensFromExplorer(walletAddress.value)
    console.log('Explorer tokens:', explorerTokens)
    
    showSnackbar('Debug info logged to console', 'info')
  } catch (error) {
    console.error('Debug error:', error)
    showSnackbar('Debug failed - check console', 'error')
  }
}

const showSnackbar = (text, color = 'success') => {
  snackbar.value = { show: true, text, color }
}

const getTokenLogo = (symbol) => {
  const tokenLogos = {
    'CHZ': 'https://assets.coingecko.com/coins/images/8834/small/CHZ_Token_updated.png',
    'PSG': 'https://www.socios.com/wp-content/uploads/2024/01/Token-PSG.svg',
    'BAR': 'https://www.socios.com/wp-content/uploads/2024/01/Token-FCB.svg',
    'CITY': 'https://www.socios.com/wp-content/uploads/2024/01/Token-CITY.svg',
    'JUV': 'https://www.socios.com/wp-content/uploads/2024/01/Token-JUV.svg',
    'ATM': 'https://www.socios.com/wp-content/uploads/2024/01/Token-ATM.svg',
    'INTER': 'https://www.socios.com/wp-content/uploads/2024/01/Token-INTER.svg',
    'MILAN': 'https://www.socios.com/wp-content/uploads/2024/01/Token-AC.svg',
    'AFC': 'https://www.socios.com/wp-content/uploads/2024/01/Token-AFC.svg',
    'ASR': 'https://www.socios.com/wp-content/uploads/2024/01/Token-ASR.svg',
    'GAL': 'https://www.socios.com/wp-content/uploads/2024/01/Token-GAL.svg',
    'OG': 'https://www.socios.com/wp-content/uploads/2024/01/Token-OG.svg',
    'ALL': 'https://www.socios.com/wp-content/uploads/2024/01/Token-ALL.svg',
    'TH': 'https://www.socios.com/wp-content/uploads/2024/01/Token-TH.svg',
    'UFC': 'https://www.socios.com/wp-content/uploads/2024/01/Token-UFC.svg',
    'PFL': 'https://www.socios.com/wp-content/uploads/2024/01/Token-PFL.svg'
  }
  return tokenLogos[symbol.toUpperCase()] || null
}

// Teams Matrix methods
const getRatingClass = (rating) => {
  if (rating >= 90) return 'rating-90-100'
  if (rating >= 80) return 'rating-80-89'
  if (rating >= 70) return 'rating-70-79'
  if (rating >= 60) return 'rating-60-69'
  return 'rating-50-59'
}

const handleSort = (column) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'desc'
  }
}

const showTeamDetails = (team) => {
  selectedTeam.value = team
  isModalVisible.value = true
}

// Lifecycle
onMounted(async () => {
  // Set up wallet event listeners
  chilizWallet.onAccountChange(async (accounts) => {
    if (accounts.length > 0) {
      walletAddress.value = accounts[0]
      await refreshTokens()
    } else {
      walletAddress.value = ''
      tokens.value = []
      powerUps.value = []
    }
  })
  
  chilizWallet.onNetworkChange(async () => {
    if (walletAddress.value) {
      networkInfo.value = await chilizWallet.getNetworkInfo()
      currentNetwork.value = networkInfo.value.isChiliz 
        ? `Chiliz ${networkInfo.value.networkType}` 
        : networkInfo.value.name
      
      if (networkInfo.value.isChiliz) {
        await refreshTokens()
      } else {
        showSnackbar('Please switch to Chiliz network to view tokens', 'warning')
      }
    }
  })
  
  // Check if wallet is already connected from user profile
  if (userStore.userProfile?.walletAddress) {
    try {
      walletAddress.value = userStore.userProfile.walletAddress
      console.log('Loading wallet from user profile:', walletAddress.value)
      
      // Try to initialize wallet connection if MetaMask is available
      if (typeof window.ethereum !== 'undefined') {
        // Check if the stored address matches current MetaMask account
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.includes(walletAddress.value)) {
          await chilizWallet.initialize()
          networkInfo.value = await chilizWallet.getNetworkInfo()
          
          if (networkInfo.value.isChiliz) {
            currentNetwork.value = `Chiliz ${networkInfo.value.networkType}`
            await refreshTokens()
            showSnackbar('Wallet automatically connected', 'success')
          } else {
            showSnackbar('Switch to Chiliz network to view tokens', 'info')
          }
        } else {
          showSnackbar('Connect MetaMask to view tokens', 'info')
        }
      } else {
        showSnackbar('MetaMask not detected', 'warning')
      }
    } catch (error) {
      console.error('Failed to initialize wallet:', error)
      showSnackbar('Failed to connect to stored wallet', 'warning')
    }
  }
})

onUnmounted(() => {
  chilizWallet.removeListeners()
})
</script>

<style scoped>

.page-header {
  text-align: center;
  padding: 2rem 0;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

/* Simplified Card Designs */
.wallet-status-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.content-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.section-header {
  padding: 1.5rem 1.5rem 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 1.375rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
}

/* Stat Cards */
.stat-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.2s ease;
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0.5rem 0;
}

.stat-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

/* Token Logo Styles */
.token-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-weight: 600;
  font-size: 1rem;
}

/* Simplified Buttons */
.v-btn {
  text-transform: none;
  font-weight: 500;
  border-radius: 8px;
}

/* Status Chips */
.v-chip {
  border-radius: 6px;
}

/* Data Tables */
.v-data-table {
  background: transparent !important;
}

.v-data-table :deep(.v-table__wrapper) {
  background: transparent;
}

.v-data-table :deep(thead tr th) {
  background: rgba(255, 255, 255, 0.05) !important;
  color: rgba(255, 255, 255, 0.9) !important;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.v-data-table :deep(tbody tr td) {
  color: rgba(255, 255, 255, 0.9) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
  padding: 1rem !important;
}

.v-data-table :deep(tbody tr:hover) {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

/* List Items */
.v-list-item-title {
  color: #ffffff !important;
}

.v-list-item-subtitle {
  color: #ffffff !important;
}

/* Bonus Tokens Section */
.bonus-tokens-section {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2rem;
}

/* Bonus Cards */
.bonus-card {
  background: rgba(255, 255, 255, 0.08);
  padding: 1.5rem;
  text-align: center;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.bonus-card:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.2);
}

.bonus-card h4 {
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.bonus-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #10b981;
  padding: 0.375rem 0.75rem;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(16, 185, 129, 0.2);
  display: inline-block;
}

.font-mono {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 0.875rem;
}

/* Teams Matrix Styles */
.view-toggle .v-tab {
  text-transform: none;
  font-weight: 500;
  border-radius: 8px;
  margin: 0 4px;
}

.table-container {
  overflow-x: auto;
  border-radius: 8px;
  margin-top: 1rem;
}

.teams-table {
  min-width: 1000px;
  background: transparent;
}

.teams-table th {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  font-size: 0.875rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem 0.75rem;
}

.teams-table th.sortable {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.teams-table th.sortable:hover {
  background: rgba(255, 255, 255, 0.08);
}

.teams-table td {
  padding: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
}

.teams-table tr:hover td {
  background-color: rgba(255, 255, 255, 0.05);
}

.team-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.team-details {
  flex: 1;
}

.team-name {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 0.25rem;
}

.team-meta {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

.country-flag-large {
  width: 24px;
  height: 18px;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.rating {
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  color: white;
}

.rating-90-100 { background: #059669; }
.rating-80-89 { background: #d97706; }
.rating-70-79 { background: #dc6803; }
.rating-60-69 { background: #dc2626; }
.rating-50-59 { background: #6b7280; }

.legend {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin: 1rem 0;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 3px;
}

.chart-container {
  background: rgba(255, 255, 255, 0.03);
  padding: 2rem;
  border-radius: 8px;
  margin: 1rem 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.chart-title {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-align: center;
}
</style>