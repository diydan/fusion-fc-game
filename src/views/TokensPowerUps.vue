<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 text-md-h3 font-weight-bold mb-6">Tokens & PowerUps</h1>
        <p class="text-body-1 text-medium-emphasis mb-8">
          View your Chiliz wallet tokens and available game PowerUps
        </p>
      </v-col>
    </v-row>

    <!-- Wallet Connection Status -->
    <v-row>
      <v-col cols="12">
        <v-card class="mb-6">
          <v-card-title>
            <v-icon start>mdi-ethereum</v-icon>
            Wallet Status
          </v-card-title>
          <v-card-text>
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
              <GameButton
                color="primary"
                size="small"
                label="Refresh"
                prepend-icon="mdi-refresh"
                @click="refreshTokens"
                :loading="loading"
                click-sound="pop"
              />
            </div>
            <div v-else class="d-flex align-center">
              <v-chip color="warning" variant="tonal" class="me-3">
                <v-icon start size="small">mdi-alert-circle</v-icon>
                Not Connected
              </v-chip>
              <GameButton
                color="primary"
                label="Connect Wallet"
                prepend-icon="mdi-wallet-plus"
                @click="connectWallet"
                :loading="connecting"
                click-sound="coin"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Network Info -->
    <v-row v-if="walletConnected">
      <v-col cols="12" md="6">
        <v-card class="mb-6">
          <v-card-title>Network Information</v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon size="small">mdi-web</v-icon>
                </template>
                <v-list-item-title>{{ currentNetwork }}</v-list-item-title>
                <v-list-item-subtitle>Network</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon size="small">mdi-currency-eth</v-icon>
                </template>
                <v-list-item-title>{{ nativeBalance }} CHZ</v-list-item-title>
                <v-list-item-subtitle>Native Balance</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card class="mb-6">
          <v-card-title>Quick Stats</v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon size="small">mdi-coins</v-icon>
                </template>
                <v-list-item-title>{{ tokens.length }}</v-list-item-title>
                <v-list-item-subtitle>Total Tokens</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon size="small">mdi-lightning-bolt</v-icon>
                </template>
                <v-list-item-title>{{ powerUps.length }}</v-list-item-title>
                <v-list-item-subtitle>Active PowerUps</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tokens Table -->
    <v-row v-if="walletConnected">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon start>mdi-coins</v-icon>
            Token Holdings
            <v-spacer />
            <v-chip v-if="loading" color="info" variant="tonal" size="small">
              <v-icon start size="x-small">mdi-loading</v-icon>
              Loading...
            </v-chip>
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="tokenHeaders"
              :items="tokens"
              :loading="loading"
              class="elevation-0"
              item-value="address"
            >
              <template v-slot:item.symbol="{ item }">
                <div class="d-flex align-center">
                  <v-avatar size="24" class="me-2" color="primary">
                    <span class="text-caption font-weight-bold">{{ item.symbol.charAt(0) }}</span>
                  </v-avatar>
                  {{ item.symbol }}
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
      </v-col>
    </v-row>

    <!-- PowerUps Table -->
    <v-row v-if="walletConnected" class="mt-6">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon start>mdi-lightning-bolt</v-icon>
            Game PowerUps
          </v-card-title>
          <v-card-text>
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
                <GameButton
                  v-if="item.status === 'available'"
                  color="primary"
                  size="small"
                  label="Activate"
                  @click="activatePowerUp(item)"
                  click-sound="success"
                />
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
      </v-col>
    </v-row>

    <!-- Teams Matrix Section -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card class="glass-card">
          <v-card-title>
            <h2 class="text-h5 mb-0">⚽ Teams Matrix</h2>
          </v-card-title>
          <v-card-text>
            <!-- Simple teams matrix table - placeholder for full implementation -->
            <v-alert type="info" variant="tonal" class="mb-4">
              <template v-slot:prepend>
                <v-icon>mdi-information</v-icon>
              </template>
              Teams Matrix showing stats and bonus tokens coming soon! View your current tokens above.
            </v-alert>
            
            <!-- Sample teams display -->
            <v-row>
              <v-col cols="12" md="6" lg="3" v-for="team in sampleTeams" :key="team.token">
                <v-card variant="outlined" class="text-center pa-4">
                  <v-avatar size="48" class="mb-2">
                    <v-img :src="team.logo" :alt="team.name"></v-img>
                  </v-avatar>
                  <h4 class="text-subtitle-1 mb-1">{{ team.name }}</h4>
                  <v-chip size="small" color="primary" variant="outlined" class="mb-2">
                    {{ team.token }}
                  </v-chip>
                  <p class="text-caption text-medium-emphasis">Overall: {{ team.overall }}</p>
                </v-card>
              </v-col>
            </v-row>
            
            <!-- Bonus Tokens Section -->
            <v-card class="mt-6" variant="outlined">
              <v-card-text class="pa-6">
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
              </v-card-text>
            </v-card>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

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
          <GameButton
            variant="text"
            label="Close"
            @click="tokenDialog = false"
            click-sound="pop"
          />
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

// Sample teams data for preview
const sampleTeams = ref([
  {
    name: 'Paris Saint-Germain',
    token: '$PSG',
    logo: 'https://www.socios.com/wp-content/uploads/2024/01/Token-PSG.svg',
    overall: 90
  },
  {
    name: 'FC Barcelona',
    token: '$BAR',
    logo: 'https://www.socios.com/wp-content/uploads/2024/01/Token-FCB.svg',
    overall: 89
  },
  {
    name: 'Manchester City',
    token: '$CITY',
    logo: 'https://www.socios.com/wp-content/uploads/2024/01/Token-CITY.svg',
    overall: 88
  },
  {
    name: 'Juventus',
    token: '$JUV',
    logo: 'https://www.socios.com/wp-content/uploads/2024/01/Token-JUV.svg',
    overall: 83
  }
])

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
.font-mono {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.8em;
}

.glass-card {
  background: rgba(255, 255, 255, 0.95) !important;
  border-radius: 15px !important;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1) !important;
  backdrop-filter: blur(10px);
}

/* Bonus Tokens Section */
.bonus-card {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  padding: 24px;
  text-align: center;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.bonus-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.bonus-icon {
  font-size: 3em;
  margin-bottom: 12px;
}

.bonus-card h4 {
  color: #2c3e50;
  font-size: 1.3em;
  margin-bottom: 8px;
}

.bonus-value {
  font-size: 1.1em;
  font-weight: 600;
  color: #27ae60;
  padding: 8px;
  background: rgba(39, 174, 96, 0.1);
  border-radius: 8px;
}
</style>