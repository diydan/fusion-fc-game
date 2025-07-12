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
                <span class="font-weight-medium">{{ formatBalance(item.balance, item.decimals) }}</span>
              </template>
              
              <template v-slot:item.value="{ item }">
                <span v-if="item.usdValue" class="text-success font-weight-medium">
                  ${{ item.usdValue.toFixed(2) }}
                </span>
                <span v-else class="text-medium-emphasis">--</span>
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
                  <p class="text-caption text-medium-emphasis">
                    Connect your wallet and ensure you're on the Chiliz network
                  </p>
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
              <v-list-item-subtitle>{{ formatBalance(selectedToken.balance, selectedToken.decimals) }} {{ selectedToken.symbol }}</v-list-item-subtitle>
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

// Computed
const walletConnected = computed(() => {
  return walletAddress.value !== ''
})

// Table headers
const tokenHeaders = [
  { title: 'Token', key: 'symbol', align: 'start' },
  { title: 'Name', key: 'name', align: 'start' },
  { title: 'Balance', key: 'balance', align: 'end' },
  { title: 'USD Value', key: 'value', align: 'end' },
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
    tokens.value = walletSummary.tokens.map(token => ({
      ...token,
      usdValue: calculateUsdValue(token.symbol, parseFloat(token.formattedBalance))
    }))
    
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
  if (typeof balance === 'string' && balance.includes('.')) {
    // Already formatted
    return parseFloat(balance).toLocaleString()
  }
  
  const divisor = Math.pow(10, decimals)
  const formatted = (parseInt(balance) / divisor).toFixed(2)
  return parseFloat(formatted).toLocaleString()
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
  
  // Check if wallet is already connected
  if (userStore.userProfile?.walletAddress) {
    try {
      walletAddress.value = userStore.userProfile.walletAddress
      await chilizWallet.initialize()
      networkInfo.value = await chilizWallet.getNetworkInfo()
      
      if (networkInfo.value.isChiliz) {
        currentNetwork.value = `Chiliz ${networkInfo.value.networkType}`
        await refreshTokens()
      } else {
        showSnackbar('Switch to Chiliz network to view tokens', 'info')
      }
    } catch (error) {
      console.error('Failed to initialize wallet:', error)
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
</style>