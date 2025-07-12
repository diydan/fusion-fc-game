<template>
  <v-card class="pa-4" max-width="500">
    <v-card-title class="d-flex align-center">
      <v-icon left color="primary">mdi-ethereum</v-icon>
      <span class="ml-2">MetaMask Wallet</span>
    </v-card-title>

    <v-card-text>
      <template v-if="!isConnected">
        <p class="text-body-1 mb-4">
          Connect your MetaMask wallet to access Web3 features
        </p>
        
        <v-btn
          block
          color="primary"
          size="large"
          @click="connectWallet"
          :loading="loading"
        >
          <v-icon left>mdi-wallet</v-icon>
          Connect MetaMask
        </v-btn>

        <v-alert
          v-if="!hasMetaMask"
          type="warning"
          variant="tonal"
          class="mt-4"
        >
          MetaMask is not installed. Please install the MetaMask extension to continue.
          <v-btn
            href="https://metamask.io/download/"
            target="_blank"
            variant="text"
            color="primary"
            class="mt-2"
          >
            Install MetaMask
          </v-btn>
        </v-alert>
      </template>

      <template v-else>
        <v-list>
          <v-list-item>
            <template v-slot:prepend>
              <v-icon color="success">mdi-check-circle</v-icon>
            </template>
            <v-list-item-title>Connected</v-list-item-title>
            <v-list-item-subtitle>{{ shortAddress }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item v-if="balance">
            <template v-slot:prepend>
              <v-icon>mdi-ethereum</v-icon>
            </template>
            <v-list-item-title>Balance</v-list-item-title>
            <v-list-item-subtitle>{{ balance }} ETH</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <template v-slot:prepend>
              <v-icon>mdi-web</v-icon>
            </template>
            <v-list-item-title>Network</v-list-item-title>
            <v-list-item-subtitle>{{ networkName }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <v-divider class="my-4" />

        <div class="mb-4" v-if="!isOnChiliz">
          <v-alert type="info" variant="tonal" class="mb-2">
            Switch to Chiliz network to interact with the game
          </v-alert>
          <v-btn-group divided block>
            <v-btn
              color="primary"
              @click="switchNetwork(false)"
              :loading="switchingNetwork"
            >
              Chiliz Mainnet
            </v-btn>
            <v-btn
              color="secondary"
              @click="switchNetwork(true)"
              :loading="switchingNetwork"
            >
              Chiliz Testnet
            </v-btn>
          </v-btn-group>
        </div>

        <div class="d-flex gap-2">
          <v-btn
            variant="outlined"
            color="primary"
            @click="copyAddress"
            :disabled="loading"
          >
            <v-icon left>mdi-content-copy</v-icon>
            Copy Address
          </v-btn>
          
          <v-spacer />
          
          <v-btn
            variant="outlined"
            color="error"
            @click="disconnectWallet"
            :disabled="loading"
          >
            Disconnect
          </v-btn>
        </div>
      </template>

      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        class="mt-4"
        closable
        @click:close="error = null"
      >
        {{ error }}
      </v-alert>

      <v-snackbar
        v-model="snackbar"
        :timeout="2000"
        color="success"
      >
        Address copied to clipboard
      </v-snackbar>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ethers } from 'ethers';
import { connectMetaMask, watchAccountChange, watchChainChange } from '@/services/auth/metamask';
import { switchToChilizNetwork, isChilizNetwork } from '@/services/auth/chiliz';

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['update:modelValue', 'connected', 'disconnected']);

// State
const loading = ref(false);
const error = ref(null);
const address = ref(null);
const balance = ref(null);
const networkName = ref('Unknown');
const chainId = ref(null);
const snackbar = ref(false);
const switchingNetwork = ref(false);

// Computed
const hasMetaMask = computed(() => typeof window.ethereum !== 'undefined');
const isConnected = computed(() => !!address.value);
const shortAddress = computed(() => {
  if (!address.value) return '';
  return `${address.value.slice(0, 6)}...${address.value.slice(-4)}`;
});
const isOnChiliz = computed(() => isChilizNetwork(chainId.value));

// Methods
const connectWallet = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const { provider, signer, address: walletAddress, error: connectError } = await connectMetaMask();
    
    if (connectError) throw new Error(connectError);
    
    address.value = walletAddress;
    emit('update:modelValue', walletAddress);
    
    // Get balance
    const balanceWei = await provider.getBalance(walletAddress);
    balance.value = ethers.formatEther(balanceWei);
    
    // Get network
    const network = await provider.getNetwork();
    chainId.value = network.chainId.toString();
    networkName.value = getNetworkName(chainId.value);
    
    emit('connected', { address: walletAddress, chainId: chainId.value });
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const disconnectWallet = () => {
  address.value = null;
  balance.value = null;
  networkName.value = 'Unknown';
  chainId.value = null;
  
  emit('update:modelValue', null);
  emit('disconnected');
};

const copyAddress = () => {
  if (address.value) {
    navigator.clipboard.writeText(address.value);
    snackbar.value = true;
  }
};

const switchNetwork = async (isTestnet) => {
  switchingNetwork.value = true;
  error.value = null;
  
  try {
    const { success, error: switchError } = await switchToChilizNetwork(isTestnet);
    
    if (switchError) throw new Error(switchError);
    
    // Re-fetch network info after switch
    if (success) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      chainId.value = network.chainId.toString();
      networkName.value = getNetworkName(chainId.value);
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    switchingNetwork.value = false;
  }
};

const getNetworkName = (chainId) => {
  const networks = {
    '1': 'Ethereum Mainnet',
    '3': 'Ropsten Testnet',
    '4': 'Rinkeby Testnet',
    '5': 'Goerli Testnet',
    '11155111': 'Sepolia Testnet',
    '137': 'Polygon Mainnet',
    '80001': 'Polygon Mumbai',
    '56': 'BSC Mainnet',
    '97': 'BSC Testnet',
    '43114': 'Avalanche Mainnet',
    '43113': 'Avalanche Testnet',
    '88888': 'Chiliz Chain',
    '88882': 'Chiliz Spicy Testnet'
  };
  
  return networks[chainId] || `Chain ID: ${chainId}`;
};

// Watchers
const handleAccountsChanged = (accounts) => {
  if (accounts.length === 0) {
    disconnectWallet();
  } else if (accounts[0] !== address.value) {
    connectWallet();
  }
};

const handleChainChanged = () => {
  // Reload to ensure consistency
  window.location.reload();
};

// Lifecycle
onMounted(() => {
  if (hasMetaMask.value) {
    watchAccountChange(handleAccountsChanged);
    watchChainChange(handleChainChanged);
    
    // Check if already connected
    if (props.modelValue) {
      address.value = props.modelValue;
    }
  }
});

onUnmounted(() => {
  if (window.ethereum) {
    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    window.ethereum.removeListener('chainChanged', handleChainChanged);
  }
});
</script>