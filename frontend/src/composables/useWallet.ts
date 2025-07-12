import { ref, computed } from 'vue'

/**
 * Wallet Composable for Chiliz Blockchain Integration
 * 
 * Supports both MetaMask and Socios wallet connections
 * Provides functionality to:
 * - Connect/disconnect wallets
 * - Fetch token balances
 * - Fetch NFTs
 * - Interact with Chiliz Chain
 */

// Chiliz Chain configuration
export const CHILIZ_CHAIN_CONFIG = {
  chainId: '0x15B38', // 88888 in hex (Chiliz Chain mainnet)
  chainName: 'Chiliz Chain',
  rpcUrls: ['https://rpc.ankr.com/chiliz'],
  nativeCurrency: {
    name: 'CHZ',
    symbol: 'CHZ',
    decimals: 18,
  },
  blockExplorerUrls: ['https://scan.chiliz.com/'],
}

// Chiliz Chain Spicy Testnet configuration
export const CHILIZ_SPICY_CONFIG = {
  chainId: '0x15B32', // 88882 in hex (Chiliz Spicy testnet)
  chainName: 'Chiliz Spicy Testnet',
  rpcUrls: ['https://spicy-rpc.chiliz.com/'],
  nativeCurrency: {
    name: 'CHZ',
    symbol: 'CHZ',
    decimals: 18,
  },
  blockExplorerUrls: ['https://testnet.chiliscan.com/'],
}

// Test environment detection
export const isTestEnvironment = (): boolean => {
  return process.env.NODE_ENV === 'development' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname.includes('test') ||
         window.location.search.includes('testnet=true')
}

export interface WalletState {
  isConnected: boolean
  account: string | null
  chainId: string | null
  balance: string | null
  walletType: 'metamask' | 'socios' | null
}

export interface Token {
  address: string
  name: string
  symbol: string
  decimals: number
  balance: string
  stakedBalance?: string
  isStaked: boolean
  stakingRewards?: string
  logoURI?: string
  apr?: number // Annual percentage rate if staked
}

export interface NFT {
  tokenId: string
  name: string
  description?: string
  image: string
  collection: string
  contractAddress: string
  isStaked: boolean
  stakedAt?: string // ISO date string when staked
  stakingRewards?: string
  rarityRank?: number
}

export function useWallet() {
  // ===== REACTIVE STATE =====
  
  const walletState = ref<WalletState>({
    isConnected: false,
    account: null,
    chainId: null,
    balance: null,
    walletType: null,
  })
  
  const tokens = ref<Token[]>([])
  const nfts = ref<NFT[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const stakingPools = ref<any[]>([]) // Available staking pools
  const stakingPositions = ref<any[]>([]) // User's staking positions
  
  // ===== COMPUTED PROPERTIES =====
  
  const isOnChilizChain = computed(() => {
    return walletState.value.chainId === CHILIZ_CHAIN_CONFIG.chainId || 
           walletState.value.chainId === CHILIZ_SPICY_CONFIG.chainId
  })
  
  const isTestnet = computed(() => {
    return walletState.value.chainId === CHILIZ_SPICY_CONFIG.chainId
  })
  
  const formattedBalance = computed(() => {
    if (!walletState.value.balance) return '0'
    return parseFloat(walletState.value.balance).toFixed(4)
  })
  
  const shortAddress = computed(() => {
    if (!walletState.value.account) return ''
    const addr = walletState.value.account
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  })
  
  const totalStakedValue = computed(() => {
    return tokens.value.reduce((total, token) => {
      if (token.isStaked && token.stakedBalance) {
        return total + parseFloat(token.stakedBalance)
      }
      return total
    }, 0)
  })
  
  const stakedNFTsCount = computed(() => {
    return nfts.value.filter(nft => nft.isStaked).length
  })
  
  // ===== WALLET CONNECTION METHODS =====
  
  /**
   * Check if MetaMask is installed
   */
  const isMetaMaskInstalled = (): boolean => {
    return typeof window !== 'undefined' && !!window.ethereum
  }
  
  /**
   * Create mock Socios wallet for testing
   */
  const createMockSociosWallet = () => {
    if (typeof window === 'undefined') return
    
    // Only create mock in test environment
    if (!isTestEnvironment()) return
    
    // Create mock Socios wallet
    (window as any).socios = {
      isConnected: false,
      
      async connect() {
        console.log('🧪 MOCK SOCIOS WALLET: Starting connection...')
        console.log('⚠️  WARNING: This is NOT a real wallet! For development/testing only.')
        
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Mock account data
        const mockAccount = '0x742d35Cc6564C0532E3c17D5f8527E738d9e9eE7'
        const mockBalance = (Math.random() * 1000).toFixed(4)
        
        this.isConnected = true
        
        console.log('✅ MOCK CONNECTION SUCCESS')
        console.log('📍 Mock Address:', mockAccount)
        console.log('💰 Mock Balance:', mockBalance, 'CHZ')
        console.log('🌐 Mock Network: Chiliz Spicy Testnet')
        
        return {
          address: mockAccount,
          chainId: CHILIZ_SPICY_CONFIG.chainId, // Default to testnet
          balance: mockBalance
        }
      },
      
      async disconnect() {
        console.log('🧪 MOCK SOCIOS WALLET: Disconnecting...')
        console.log('⚠️  Remember: This was just a mock wallet for testing!')
        this.isConnected = false
      },
      
      // Mock event listener
      on(event: string, callback: Function) {
        console.log(`🧪 MOCK WALLET: Added listener for "${event}" event`)
        // Store callbacks for potential testing
      }
    }
    
    console.log('🧪 MOCK SOCIOS WALLET CREATED')
    console.log('⚠️  This is a FAKE wallet for development only!')
    console.log('📝 For real integration, contact Socios team for official SDK')
  }

  /**
   * Check if Socios wallet is available
   */
  const isSociosWalletAvailable = (): boolean => {
    if (typeof window === 'undefined') return false
    
    // In test environment, create mock wallet if it doesn't exist
    if (isTestEnvironment() && !(window as any).socios) {
      createMockSociosWallet()
    }
    
    // Check for Socios app environment (mobile)
    const userAgent = navigator.userAgent.toLowerCase()
    const isSociosApp = userAgent.includes('socios') || userAgent.includes('chiliz')
    
    // Check for Socios wallet interfaces
    const hasSociosWallet = !!(
      (window as any).socios || 
      (window as any).SociosWallet ||
      (window as any).ethereum?.isSocios ||
      (window as any).chiliz
    )
    
    // Return true if we're in Socios app OR have wallet interface
    return isSociosApp || hasSociosWallet
  }
  
  /**
   * Connect to MetaMask wallet
   */
  const connectMetaMask = async (): Promise<void> => {
    if (!isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.')
    }
    
    try {
      isLoading.value = true
      error.value = null
      
      // Request account access
      const accounts = await window.ethereum!.request({
        method: 'eth_requestAccounts',
      })
      
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please connect your wallet.')
      }
      
      // Get chain ID
      const chainId = await window.ethereum!.request({
        method: 'eth_chainId',
      })
      
      // Get balance
      const balance = await window.ethereum!.request({
        method: 'eth_getBalance',
        params: [accounts[0], 'latest'],
      })
      
      // Convert balance from wei to ether
      const balanceInEther = parseInt(balance, 16) / Math.pow(10, 18)
      
      walletState.value = {
        isConnected: true,
        account: accounts[0],
        chainId,
        balance: balanceInEther.toString(),
        walletType: 'metamask',
      }
      
      // Set up event listeners
      setupMetaMaskEventListeners()
      
    } catch (err: any) {
      error.value = err.message || 'Failed to connect to MetaMask'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Connect to Socios wallet (Primary wallet)
   */
  const connectSociosWallet = async (): Promise<void> => {
    if (!isSociosWalletAvailable()) {
      throw new Error('Socios wallet is not available. Please open this in the Socios app or install the Socios browser extension.')
    }
    
    try {
      isLoading.value = true
      error.value = null
      
      // Try different Socios wallet interfaces
      let sociosWallet = (window as any).socios || (window as any).SociosWallet
      
      // If using MetaMask with Socios integration
      if (!sociosWallet && (window as any).ethereum?.isSocios) {
        sociosWallet = (window as any).ethereum
      }
      
      if (!sociosWallet) {
        throw new Error('Socios wallet interface not found')
      }
      
      // Connect to Socios wallet
      let result
      if (sociosWallet.connect) {
        result = await sociosWallet.connect()
      } else if (sociosWallet.request) {
        // Use Ethereum-like interface
        const accounts = await sociosWallet.request({
          method: 'eth_requestAccounts',
        })
        
        const chainId = await sociosWallet.request({
          method: 'eth_chainId',
        })
        
        const balance = await sociosWallet.request({
          method: 'eth_getBalance',
          params: [accounts[0], 'latest'],
        })
        
        result = {
          address: accounts[0],
          chainId,
          balance: (parseInt(balance, 16) / Math.pow(10, 18)).toString(),
        }
      }
      
      walletState.value = {
        isConnected: true,
        account: result.address,
        chainId: result.chainId || CHILIZ_CHAIN_CONFIG.chainId,
        balance: result.balance,
        walletType: 'socios',
      }
      
      // Set up event listeners
      setupSociosEventListeners()
      
      // Automatically fetch tokens and NFTs after connection
      await Promise.all([
        fetchTokens(),
        fetchNFTs(),
        fetchStakingPositions()
      ])
      
    } catch (err: any) {
      error.value = err.message || 'Failed to connect to Socios wallet'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Disconnect wallet
   */
  const disconnect = (): void => {
    walletState.value = {
      isConnected: false,
      account: null,
      chainId: null,
      balance: null,
      walletType: null,
    }
    tokens.value = []
    nfts.value = []
    error.value = null
    
    // Remove event listeners
    if (window.ethereum) {
      window.ethereum.removeAllListeners()
    }
  }
  
  /**
   * Switch to Chiliz Chain
   */
  const switchToChilizChain = async (useTestnet = false): Promise<void> => {
    if (!window.ethereum) {
      throw new Error('No wallet found')
    }
    
    const config = useTestnet ? CHILIZ_SPICY_CONFIG : CHILIZ_CHAIN_CONFIG
    
    try {
      // Try to switch to Chiliz chain
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: config.chainId }],
      })
    } catch (switchError: any) {
      // If chain is not added, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [config],
          })
        } catch (addError: any) {
          throw new Error(`Failed to add Chiliz chain: ${addError.message}`)
        }
      } else {
        throw new Error(`Failed to switch to Chiliz chain: ${switchError.message}`)
      }
    }
  }
  
  // ===== TOKEN AND NFT METHODS =====
  
  /**
   * Fetch staking positions for the connected account
   */
  const fetchStakingPositions = async (): Promise<void> => {
    if (!walletState.value.account) return
    
    try {
      // This would normally query staking contracts on Chiliz chain
      // For now, we'll simulate some staking data
      stakingPositions.value = [
        {
          token: 'BAR',
          amount: '50.0',
          rewards: '2.5',
          apr: 12.5,
          stakedAt: '2024-01-15T10:00:00Z'
        },
        {
          token: 'PSG',
          amount: '25.0',
          rewards: '1.8',
          apr: 15.2,
          stakedAt: '2024-02-01T14:30:00Z'
        }
      ]
    } catch (err: any) {
      console.error('Failed to fetch staking positions:', err)
    }
  }

  /**
   * Fetch token balances for the connected account (with staking info)
   */
  const fetchTokens = async (): Promise<void> => {
    if (!walletState.value.account) {
      throw new Error('No wallet connected')
    }
    
    try {
      isLoading.value = true
      
      // This is a placeholder implementation
      // In a real implementation, you would:
      // 1. Query the Chiliz chain for token contracts
      // 2. Call balanceOf for each token contract
      // 3. Check staking contracts for staked balances
      // 4. Fetch token metadata (name, symbol, decimals)
      
      // Get staking info to merge with token data
      const stakingInfo = stakingPositions.value.reduce((acc, position) => {
        acc[position.token] = position
        return acc
      }, {} as any)
      
      // For now, we'll show some example fan tokens with staking info
      const exampleTokens: Token[] = [
        {
          address: '0x3506424F91fD33084466F402d5D97f05F8e3b4AF',
          name: 'FC Barcelona Fan Token',
          symbol: 'BAR',
          decimals: 18,
          balance: '150.25',
          stakedBalance: stakingInfo.BAR?.amount || '0',
          isStaked: !!stakingInfo.BAR,
          stakingRewards: stakingInfo.BAR?.rewards || '0',
          apr: stakingInfo.BAR?.apr || 0,
          logoURI: 'https://assets.coingecko.com/coins/images/16547/small/fc-barcelona-fan-token.png',
        },
        {
          address: '0xD559f20296FF4895da39b5bd9ADd54b442596a61',
          name: 'Paris Saint-Germain Fan Token',
          symbol: 'PSG',
          decimals: 18,
          balance: '89.75',
          stakedBalance: stakingInfo.PSG?.amount || '0',
          isStaked: !!stakingInfo.PSG,
          stakingRewards: stakingInfo.PSG?.rewards || '0',
          apr: stakingInfo.PSG?.apr || 0,
          logoURI: 'https://assets.coingecko.com/coins/images/16544/small/paris-saint-germain-fan-token.png',
        },
        {
          address: '0x46d502Fac9aEA7c5bC7B13C8Ec9D5cddac7ca38',
          name: 'Juventus Fan Token',
          symbol: 'JUV',
          decimals: 18,
          balance: '42.10',
          stakedBalance: '0',
          isStaked: false,
          stakingRewards: '0',
          apr: 0,
          logoURI: 'https://assets.coingecko.com/coins/images/16545/small/juventus-fan-token.png',
        },
      ]
      
      tokens.value = exampleTokens
      
    } catch (err: any) {
      error.value = `Failed to fetch tokens: ${err.message}`
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Fetch NFTs for the connected account (with staking info)
   */
  const fetchNFTs = async (): Promise<void> => {
    if (!walletState.value.account) {
      throw new Error('No wallet connected')
    }
    
    try {
      isLoading.value = true
      
      // This is a placeholder implementation
      // In a real implementation, you would:
      // 1. Query NFT contracts on Chiliz chain
      // 2. Check staking contracts for staked NFTs
      // 3. Fetch metadata and staking rewards
      
      const exampleNFTs: NFT[] = [
        {
          tokenId: '1',
          name: 'FC Barcelona Golden Ticket',
          description: 'Exclusive access to VIP events',
          image: 'https://via.placeholder.com/200x200/004B87/FFFFFF?text=BAR+NFT',
          collection: 'FC Barcelona Collection',
          contractAddress: '0x1234567890123456789012345678901234567890',
          isStaked: true,
          stakedAt: '2024-01-20T08:00:00Z',
          stakingRewards: '5.2',
          rarityRank: 15,
        },
        {
          tokenId: '42',
          name: 'PSG Player Card #42',
          description: 'Limited edition player card',
          image: 'https://via.placeholder.com/200x200/FF1E56/FFFFFF?text=PSG+NFT',
          collection: 'PSG Player Cards',
          contractAddress: '0x2345678901234567890123456789012345678901',
          isStaked: false,
          rarityRank: 142,
        },
        {
          tokenId: '7',
          name: 'Juventus Stadium Pass',
          description: 'Special stadium access token',
          image: 'https://via.placeholder.com/200x200/000000/FFFFFF?text=JUV+NFT',
          collection: 'Juventus Experiences',
          contractAddress: '0x3456789012345678901234567890123456789012',
          isStaked: true,
          stakedAt: '2024-02-10T16:30:00Z',
          stakingRewards: '3.1',
          rarityRank: 7,
        },
      ]
      
      nfts.value = exampleNFTs
      
    } catch (err: any) {
      error.value = `Failed to fetch NFTs: ${err.message}`
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  // ===== EVENT LISTENERS =====
  
  /**
   * Set up Socios wallet event listeners
   */
  const setupSociosEventListeners = (): void => {
    const sociosWallet = (window as any).socios || (window as any).SociosWallet || (window as any).ethereum
    if (!sociosWallet) return
    
    // Account changed
    if (sociosWallet.on) {
      sociosWallet.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect()
        } else {
          walletState.value.account = accounts[0]
          // Refresh data including staking
          Promise.all([
            fetchTokens(),
            fetchNFTs(),
            fetchStakingPositions()
          ]).catch(console.error)
        }
      })
      
      // Chain changed
      sociosWallet.on('chainChanged', (chainId: string) => {
        walletState.value.chainId = chainId
        // Refresh data when chain changes
        Promise.all([
          fetchTokens(),
          fetchNFTs(),
          fetchStakingPositions()
        ]).catch(console.error)
      })
      
      // Disconnect
      sociosWallet.on('disconnect', () => {
        disconnect()
      })
    }
  }

  /**
   * Set up MetaMask event listeners (fallback)
   */
  const setupMetaMaskEventListeners = (): void => {
    if (!window.ethereum) return
    
    // Account changed
    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect()
      } else {
        walletState.value.account = accounts[0]
        // Refresh data
        Promise.all([
          fetchTokens(),
          fetchNFTs(),
          fetchStakingPositions()
        ]).catch(console.error)
      }
    })
    
    // Chain changed
    window.ethereum.on('chainChanged', (chainId: string) => {
      walletState.value.chainId = chainId
      // Refresh data when chain changes
      Promise.all([
        fetchTokens(),
        fetchNFTs(),
        fetchStakingPositions()
      ]).catch(console.error)
    })
    
    // Disconnect
    window.ethereum.on('disconnect', () => {
      disconnect()
    })
  }
  
  // ===== INITIALIZATION =====
  
  /**
   * Initialize wallet connection if already connected
   */
  const initializeWallet = async (): Promise<void> => {
    if (!isMetaMaskInstalled()) return
    
    try {
      const accounts = await window.ethereum!.request({
        method: 'eth_accounts',
      })
      
      if (accounts.length > 0) {
        // Already connected, restore state
        const chainId = await window.ethereum!.request({
          method: 'eth_chainId',
        })
        
        const balance = await window.ethereum!.request({
          method: 'eth_getBalance',
          params: [accounts[0], 'latest'],
        })
        
        const balanceInEther = parseInt(balance, 16) / Math.pow(10, 18)
        
        walletState.value = {
          isConnected: true,
          account: accounts[0],
          chainId,
          balance: balanceInEther.toString(),
          walletType: 'metamask',
        }
        
        setupMetaMaskEventListeners()
        
        // Fetch tokens and NFTs
        await Promise.all([fetchTokens(), fetchNFTs()])
      }
    } catch (err) {
      console.error('Failed to initialize wallet:', err)
    }
  }
  
  // ===== RETURN API =====
  
  return {
    // State
    walletState,
    tokens,
    nfts,
    stakingPools,
    stakingPositions,
    isLoading,
    error,
    
    // Computed
    isOnChilizChain,
    isTestnet,
    formattedBalance,
    shortAddress,
    totalStakedValue,
    stakedNFTsCount,
    
    // Methods
    isMetaMaskInstalled,
    isSociosWalletAvailable,
    connectMetaMask,
    connectSociosWallet,
    disconnect,
    switchToChilizChain,
    fetchTokens,
    fetchNFTs,
    fetchStakingPositions,
    initializeWallet,
    
    // Constants
    CHILIZ_CHAIN_CONFIG,
    CHILIZ_SPICY_CONFIG,
    
    // Testing utilities
    isTestEnvironment,
    createMockSociosWallet,
  }
}

// Global type declarations for wallet integration
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, callback: (...args: any[]) => void) => void
      removeAllListeners: () => void
    }
  }
}