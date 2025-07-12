import { ethers } from 'ethers';
import { signInWithCustomToken } from 'firebase/auth';
import { auth, db } from '@/config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { switchToChilizNetwork } from './chiliz';

export const connectMetaMask = async () => {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_requestAccounts', []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    
    // Check if we should switch to default network
    const defaultChainId = import.meta.env.VITE_DEFAULT_CHAIN_ID;
    const useTestnet = import.meta.env.VITE_USE_TESTNET === 'true';
    
    if (defaultChainId === '88888' || defaultChainId === '88882') {
      const network = await provider.getNetwork();
      const currentChainId = network.chainId.toString();
      
      if (currentChainId !== defaultChainId) {
        await switchToChilizNetwork(useTestnet);
      }
    }
    
    return { provider, signer, address, error: null };
  } catch (error) {
    return { provider: null, signer: null, address: null, error: error.message };
  }
};

export const signMessage = async (signer, message) => {
  try {
    const signature = await signer.signMessage(message);
    return { signature, error: null };
  } catch (error) {
    return { signature: null, error: error.message };
  }
};

export const verifySignature = (message, signature, address) => {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    return false;
  }
};

export const signInWithMetaMask = async () => {
  // Import the Firebase-integrated version
  const { signInWithMetaMaskDev } = await import('./metamask-firebase');
  return signInWithMetaMaskDev();
};

export const getMetaMaskSession = () => {
  const address = localStorage.getItem('metamask_address');
  const signature = localStorage.getItem('metamask_signature');
  return { address, signature };
};

export const clearMetaMaskSession = () => {
  localStorage.removeItem('metamask_address');
  localStorage.removeItem('metamask_signature');
};

export const watchAccountChange = (callback) => {
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', callback);
  }
};

export const watchChainChange = (callback) => {
  if (window.ethereum) {
    window.ethereum.on('chainChanged', callback);
  }
};