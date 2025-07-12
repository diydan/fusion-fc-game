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

// Common Fan Tokens on Chiliz (actual addresses from Chiliz explorer)
export const FAN_TOKENS = {
  // Mainnet tokens (real Chiliz mainnet addresses)
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
    }
  ],
  // Testnet tokens (real Chiliz testnet addresses)
  testnet: [
    {
      symbol: 'CHZ',
      name: 'Chiliz Token',
      address: '0x677F7e16C7Dd57be1D4C8aD1244883214953DC47', // Example CHZ token on testnet
      decimals: 18,
      logo: '/tokens/chz.png'
    },
    {
      symbol: 'TEST',
      name: 'Test Token',
      address: '0x1234567890123456789012345678901234567890', // Generic test token
      decimals: 18,
      logo: '/tokens/test.png'
    },
    // Add some real testnet fan tokens if available
    {
      symbol: 'SPICY',
      name: 'Spicy Test Token',
      address: '0x0000000000000000000000000000000000000000', // Placeholder
      decimals: 18,
      logo: '/tokens/spicy.png'
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
    
    // Validate token address format
    if (!ethers.isAddress(tokenAddress)) {
      console.warn(`Invalid token address format: ${tokenAddress}`)
      return null
    }
    
    // Skip known invalid addresses
    const invalidAddresses = [
      '0x0000000000000000000000000000000000000000',
      '0x1234567890123456789012345678901234567890'
    ]
    
    if (invalidAddresses.includes(tokenAddress)) {
      console.warn(`Skipping known invalid token address: ${tokenAddress}`)
      return null
    }
    
    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider)
      
      // Check if contract exists by calling a simple method first
      const code = await this.provider.getCode(tokenAddress)
      if (code === '0x') {
        console.warn(`No contract deployed at address: ${tokenAddress}`)
        return null
      }
      
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
      // Only log meaningful errors, not BAD_DATA for invalid/non-existent tokens
      if (!error.message.includes('could not decode result data') && 
          !error.message.includes('BAD_DATA')) {
        console.error(`Failed to get token balance for ${tokenAddress}:`, error)
      }
      return null
    }
  }

  // Get all fan token balances
  async getAllTokenBalances(walletAddress) {
    const tokens = FAN_TOKENS[this.network] || []
    const balances = []

    console.log(`Fetching token balances for ${walletAddress} on ${this.network}`)

    // First try to get tokens from explorer API (this gives us token contracts)
    try {
      const explorerTokens = await this.getTokensFromExplorer(walletAddress)
      if (explorerTokens && explorerTokens.length > 0) {
        console.log('Found tokens from explorer:', explorerTokens)
        // Get actual balances for discovered tokens
        for (const token of explorerTokens) {
          try {
            const balance = await this.getTokenBalance(token.address, walletAddress)
            if (balance && parseFloat(balance.formattedBalance) > 0) {
              console.log(`Found balance for ${token.symbol}:`, balance.formattedBalance)
              balances.push(balance)
            }
          } catch (error) {
            console.warn(`Failed to get balance for discovered token ${token.symbol}:`, error)
          }
        }
      }
    } catch (error) {
      console.warn('Failed to fetch from explorer:', error)
    }

    // Try to get balances for known tokens (skip if already found from explorer)
    for (const token of tokens) {
      try {
        // Skip if we already have this token from explorer
        const alreadyFound = balances.some(b => b.address.toLowerCase() === token.address.toLowerCase())
        if (alreadyFound) {
          console.log(`Skipping ${token.symbol} - already found from explorer`)
          continue
        }
        
        console.log(`Checking known token: ${token.symbol} at ${token.address}`)
        const balance = await this.getTokenBalance(token.address, walletAddress)
        if (balance && parseFloat(balance.formattedBalance) > 0) {
          console.log(`Found balance for ${token.symbol}:`, balance.formattedBalance)
          balances.push({
            ...balance,
            logo: token.logo
          })
        }
      } catch (error) {
        console.warn(`Failed to fetch balance for ${token.symbol}:`, error)
      }
    }

    // Try to discover unknown tokens via transfers
    try {
      const discoveredTokens = await this.getTokenTransfers(walletAddress)
      console.log('Discovered token addresses:', discoveredTokens)
      
      // Try to get balances for discovered tokens
      for (const tokenAddress of discoveredTokens) {
        try {
          // Skip if we already checked this token (from known tokens or explorer)
          const alreadyChecked = tokens.some(t => t.address.toLowerCase() === tokenAddress.toLowerCase()) ||
                                balances.some(b => b.address.toLowerCase() === tokenAddress.toLowerCase())
          if (alreadyChecked) {
            continue
          }
          
          const balance = await this.getTokenBalance(tokenAddress, walletAddress)
          if (balance && parseFloat(balance.formattedBalance) > 0) {
            console.log(`Found balance for discovered token:`, balance)
            balances.push(balance)
          }
        } catch (error) {
          console.warn(`Failed to fetch balance for discovered token ${tokenAddress}:`, error)
        }
      }
    } catch (error) {
      console.warn('Failed to discover tokens via transfers:', error)
    }

    console.log('Final token balances:', balances)
    return balances
  }

  // Try to get tokens from Chiliz explorer API
  async getTokensFromExplorer(walletAddress) {
    try {
      const explorerUrl = this.network === 'mainnet' 
        ? 'https://chiliscan.com/api' 
        : 'https://spicy-explorer.chiliz.com/api'
      
      // Use the correct API format with module and action parameters
      const apiUrl = `${explorerUrl}?module=account&action=tokentx&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc`
      
      const response = await fetch(apiUrl)
      if (response.ok) {
        const data = await response.json()
        console.log('Explorer API response:', data)
        
        // Process the response to extract unique tokens
        if (data.status === "1" && data.result && Array.isArray(data.result)) {
          const uniqueTokens = new Map()
          
          data.result.forEach(tx => {
            if (tx.contractAddress && !uniqueTokens.has(tx.contractAddress)) {
              uniqueTokens.set(tx.contractAddress, {
                address: tx.contractAddress,
                symbol: tx.tokenSymbol || 'UNKNOWN',
                name: tx.tokenName || 'Unknown Token',
                decimals: parseInt(tx.tokenDecimal) || 18
              })
            }
          })
          
          console.log('Found tokens from explorer transactions:', Array.from(uniqueTokens.values()))
          return Array.from(uniqueTokens.values())
        }
        return []
      } else if (response.status === 400) {
        console.warn(`Explorer API returned 400 for address ${walletAddress} - likely invalid or empty address`)
        return []
      }
    } catch (error) {
      console.warn('Failed to fetch from explorer API:', error)
    }
    return []
  }

  // Get token transfers to discover tokens
  async getTokenTransfers(walletAddress) {
    if (!this.provider) await this.initialize()
    
    try {
      // Get recent blocks to scan for token transfers
      const currentBlock = await this.provider.getBlockNumber()
      const fromBlock = Math.max(0, currentBlock - 10000) // Last 10k blocks
      
      // ERC-20 Transfer event signature
      const transferTopic = ethers.id('Transfer(address,address,uint256)')
      
      // Get logs for incoming transfers
      const incomingLogs = await this.provider.getLogs({
        fromBlock: fromBlock,
        toBlock: 'latest',
        topics: [
          transferTopic,
          null, // from any address
          ethers.zeroPadValue(walletAddress, 32) // to our wallet
        ]
      })

      // Get logs for outgoing transfers
      const outgoingLogs = await this.provider.getLogs({
        fromBlock: fromBlock,
        toBlock: 'latest',
        topics: [
          transferTopic,
          ethers.zeroPadValue(walletAddress, 32), // from our wallet
          null // to any address
        ]
      })

      const allLogs = [...incomingLogs, ...outgoingLogs]
      const uniqueTokens = [...new Set(allLogs.map(log => log.address))]
      
      return uniqueTokens
    } catch (error) {
      console.error('Failed to get token transfers:', error)
      return []
    }
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