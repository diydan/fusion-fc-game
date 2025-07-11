import { ethers } from 'ethers';

// Chiliz network configurations
export const CHILIZ_NETWORKS = {
  mainnet: {
    chainId: '0x15b38', // 88888 in hex
    chainName: 'Chiliz Chain',
    nativeCurrency: {
      name: 'Chiliz',
      symbol: 'CHZ',
      decimals: 18
    },
    rpcUrls: ['https://rpc.ankr.com/chiliz'],
    blockExplorerUrls: ['https://scan.chiliz.com']
  },
  testnet: {
    chainId: '0x15b32', // 88882 in hex
    chainName: 'Chiliz Spicy Testnet',
    nativeCurrency: {
      name: 'Chiliz',
      symbol: 'CHZ',
      decimals: 18
    },
    rpcUrls: ['https://spicy-rpc.chiliz.com'],
    blockExplorerUrls: ['https://spicy-explorer.chiliz.com']
  }
};

export const addChilizNetwork = async (isTestnet = true) => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  const network = isTestnet ? CHILIZ_NETWORKS.testnet : CHILIZ_NETWORKS.mainnet;

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [network]
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const switchToChilizNetwork = async (isTestnet = true) => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  const network = isTestnet ? CHILIZ_NETWORKS.testnet : CHILIZ_NETWORKS.mainnet;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: network.chainId }]
    });
    return { success: true, error: null };
  } catch (error) {
    // This error code indicates that the chain has not been added to MetaMask
    if (error.code === 4902) {
      // Try to add the network
      return await addChilizNetwork(isTestnet);
    }
    return { success: false, error: error.message };
  }
};

export const getChilizProvider = (isTestnet = true) => {
  const network = isTestnet ? CHILIZ_NETWORKS.testnet : CHILIZ_NETWORKS.mainnet;
  return new ethers.JsonRpcProvider(network.rpcUrls[0]);
};

export const isChilizNetwork = (chainId) => {
  const hexChainId = typeof chainId === 'string' ? chainId : `0x${chainId.toString(16)}`;
  return hexChainId === CHILIZ_NETWORKS.mainnet.chainId || 
         hexChainId === CHILIZ_NETWORKS.testnet.chainId;
};