import { ethers } from 'ethers'

// Chiliz network configuration
export const CHILIZ_NETWORKS = {
  mainnet: {
    chainId: '0x15B38', // 88888
    chainName: 'Chiliz Chain',
    nativeCurrency: {
      name: 'Chiliz',
      symbol: 'CHZ',
      decimals: 18,
    },
    rpcUrls: ['https://rpc.ankr.com/chiliz'],
    blockExplorerUrls: ['https://chiliscan.com/'],
  },
  testnet: {
    chainId: '0x15B32', // 88882
    chainName: 'Chiliz Spicy Testnet',
    nativeCurrency: {
      name: 'Chiliz',
      symbol: 'CHZ',
      decimals: 18,
    },
    rpcUrls: ['https://spicy-rpc.chiliz.com/'],
    blockExplorerUrls: ['https://testnet.chiliscan.com/'],
  }
}

// Common Fan Tokens on Chiliz
export const FAN_TOKENS = {
  // Mainnet tokens
  mainnet: [
    {
      symbol: 'PSG',
      name: 'Paris Saint-Germain Fan Token',
      address: '0x8d1566569d5b695d44a9a234540d8Ea4a455FdE',
      decimals: 2,
      logo: '/tokens/psg.png'
    },
    {
      symbol: 'BAR',
      name: 'FC Barcelona Fan Token',
      address: '0xfD3C73b3B09D418841dd6Aff341b2d6e3abA8Ac2',
      decimals: 2,
      logo: '/tokens/bar.png'
    },
    {
      symbol: 'JUV',
      name: 'Juventus Fan Token',
      address: '0x4a3f8d561Bf932F5eCe4E5eF0c8C1F38b4d4A7e',
      decimals: 2,
      logo: '/tokens/juv.png'
    },
    {
      symbol: 'ATM',
      name: 'Atletico Madrid Fan Token',
      address: '0x3aF8B2D0b5b6aF6E8E7a2Ea1A8c5B3d9F6E4C1Ae',
      decimals: 2,
      logo: '/tokens/atm.png'
    }
  ],
  // Testnet tokens (same addresses for testing)
  testnet: [
    {
      symbol: 'PSG',
      name: 'Paris Saint-Germain Fan Token',
      address: '0x8d1566569d5b695d44a9a234540d8Ea4a455FdE',
      decimals: 2,
      logo: '/tokens/psg.png'
    },
    {
      symbol: 'BAR',
      name: 'FC Barcelona Fan Token',
      address: '0xfD3C73b3B09D418841dd6Aff341b2d6e3abA8Ac2',
      decimals: 2,
      logo: '/tokens/bar.png'
    }
  ]
}

// ERC-20 Token ABI (minimal)
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
]

export class ChilizWalletService {
  constructor() {
    this.provider = null
    this.signer = null
    this.network = 'testnet' // Default to testnet
  }

  // Initialize connection to MetaMask
  async initialize() {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask not detected')
    }

    this.provider = new ethers.BrowserProvider(window.ethereum)
    this.signer = await this.provider.getSigner()
    
    // Get current network
    const network = await this.provider.getNetwork()
    this.network = network.chainId === 88888n ? 'mainnet' : 'testnet'
    
    return this.signer.address
  }

  // Connect wallet and request account access
  async connectWallet() {
    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      })
      
      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      await this.initialize()
      return accounts[0]
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    }
  }

  // Switch to Chiliz network
  async switchToChilizNetwork(network = 'testnet') {
    const networkConfig = CHILIZ_NETWORKS[network]
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkConfig.chainId }],
      })
    } catch (switchError) {
      // Network not added to MetaMask
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [networkConfig],
        })
      } else {
        throw switchError
      }
    }
    
    this.network = network
    await this.initialize()
  }

  // Get native CHZ balance
  async getNativeBalance(address) {
    if (!this.provider) await this.initialize()
    
    const balance = await this.provider.getBalance(address)
    return ethers.formatEther(balance)
  }

  // Get token balance for a specific token contract
  async getTokenBalance(tokenAddress, walletAddress) {
    if (!this.provider) await this.initialize()
    
    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider)
      
      const [balance, decimals, symbol, name] = await Promise.all([
        contract.balanceOf(walletAddress),
        contract.decimals(),
        contract.symbol(),
        contract.name()
      ])

      return {
        address: tokenAddress,
        symbol,
        name,
        balance: balance.toString(),
        decimals,
        formattedBalance: ethers.formatUnits(balance, decimals)
      }
    } catch (error) {
      console.error(`Failed to get token balance for ${tokenAddress}:`, error)
      return null
    }
  }

  // Get all fan token balances
  async getAllTokenBalances(walletAddress) {
    const tokens = FAN_TOKENS[this.network] || []
    const balances = []

    for (const token of tokens) {
      const balance = await this.getTokenBalance(token.address, walletAddress)
      if (balance && parseFloat(balance.formattedBalance) > 0) {
        balances.push({
          ...balance,
          logo: token.logo
        })
      }
    }

    return balances
  }

  // Get wallet summary (native + all tokens)
  async getWalletSummary(walletAddress) {
    if (!walletAddress) {
      walletAddress = await this.signer.getAddress()
    }

    try {
      const [nativeBalance, tokenBalances] = await Promise.all([
        this.getNativeBalance(walletAddress),
        this.getAllTokenBalances(walletAddress)
      ])

      return {
        address: walletAddress,
        network: this.network,
        nativeBalance,
        tokens: tokenBalances,
        totalTokens: tokenBalances.length
      }
    } catch (error) {
      console.error('Failed to get wallet summary:', error)
      throw error
    }
  }

  // Check if wallet is connected to Chiliz network
  async isOnChilizNetwork() {
    if (!this.provider) return false
    
    const network = await this.provider.getNetwork()
    return network.chainId === 88888n || network.chainId === 88882n
  }

  // Get current network info
  async getNetworkInfo() {
    if (!this.provider) await this.initialize()
    
    const network = await this.provider.getNetwork()
    const isChiliz = network.chainId === 88888n || network.chainId === 88882n
    
    return {
      chainId: network.chainId.toString(),
      name: network.name,
      isChiliz,
      networkType: network.chainId === 88888n ? 'mainnet' : 'testnet'
    }
  }

  // Listen for account changes
  onAccountChange(callback) {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', callback)
    }
  }

  // Listen for network changes
  onNetworkChange(callback) {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', callback)
    }
  }

  // Remove event listeners
  removeListeners() {
    if (window.ethereum) {
      window.ethereum.removeAllListeners('accountsChanged')
      window.ethereum.removeAllListeners('chainChanged')
    }
  }
}

// Create singleton instance
export const chilizWallet = new ChilizWalletService()

// Utility functions
export const formatTokenBalance = (balance, decimals, symbol) => {
  const formatted = ethers.formatUnits(balance, decimals)
  return `${parseFloat(formatted).toLocaleString()} ${symbol}`
}

export const truncateAddress = (address, chars = 4) => {
  if (!address) return ''
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

export const getTokenIcon = (symbol) => {
  const iconMap = {
    CHZ: 'mdi-ethereum',
    PSG: 'mdi-soccer',
    BAR: 'mdi-soccer',
    JUV: 'mdi-soccer',
    ATM: 'mdi-soccer',
    default: 'mdi-coins'
  }
  return iconMap[symbol] || iconMap.default
}

// Mock PowerUp data for game integration
export const generateMockPowerUps = (tokenBalances) => {
  const powerUps = []
  
  // Generate PowerUps based on token holdings
  tokenBalances.forEach(token => {
    const balance = parseFloat(token.formattedBalance)
    
    if (balance >= 100) {
      powerUps.push({
        id: `${token.symbol}_speed`,
        name: `${token.symbol} Speed Boost`,
        type: 'Performance',
        rarity: balance >= 1000 ? 'legendary' : balance >= 500 ? 'rare' : 'common',
        status: 'available',
        icon: 'mdi-run-fast',
        description: `Speed boost powered by ${token.symbol} tokens`,
        requiredTokens: 100,
        tokenSymbol: token.symbol
      })
    }
    
    if (balance >= 50) {
      powerUps.push({
        id: `${token.symbol}_score`,
        name: `${token.symbol} Score Multiplier`,
        type: 'Scoring',
        rarity: 'common',
        status: 'available',
        icon: 'mdi-star-plus',
        description: `2x score multiplier using ${token.symbol}`,
        requiredTokens: 50,
        tokenSymbol: token.symbol
      })
    }
  })
  
  return powerUps
}