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
  try {
    // Connect to MetaMask
    const { signer, address, error: connectError } = await connectMetaMask();
    if (connectError) throw new Error(connectError);

    // Create a message to sign
    const timestamp = Date.now();
    const message = `Sign this message to authenticate with Fusion FC Game\n\nWallet: ${address}\nTimestamp: ${timestamp}`;

    // Sign the message
    const { signature, error: signError } = await signMessage(signer, message);
    if (signError) throw new Error(signError);

    // Verify the signature
    const isValid = verifySignature(message, signature, address);
    if (!isValid) throw new Error('Invalid signature');

    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', address));
    
    if (!userDoc.exists()) {
      // Create new user document
      await setDoc(doc(db, 'users', address), {
        walletAddress: address,
        createdAt: new Date(),
        lastLogin: new Date(),
        authMethod: 'metamask'
      });
    } else {
      // Update last login
      await setDoc(doc(db, 'users', address), {
        lastLogin: new Date()
      }, { merge: true });
    }

    // In production, you would call a Cloud Function here to generate a custom token
    // For now, we'll store the wallet address in localStorage as a temporary solution
    localStorage.setItem('metamask_address', address);
    localStorage.setItem('metamask_signature', signature);
    
    return { 
      address, 
      signature, 
      error: null,
      message: 'Connected with MetaMask. Note: In production, implement server-side token generation.'
    };
  } catch (error) {
    return { address: null, signature: null, error: error.message };
  }
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