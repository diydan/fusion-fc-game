import { 
  linkWithCredential, 
  EmailAuthProvider, 
  GoogleAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  signInWithCredential
} from 'firebase/auth';
import { auth, db } from '@/config/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { connectMetaMask, signMessage, verifySignature } from './metamask';

// Check if an email is already in use
export const checkEmailAvailability = async (email) => {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return { 
      available: methods.length === 0, 
      methods: methods,
      error: null 
    };
  } catch (error) {
    return { available: false, methods: [], error: error.message };
  }
};

// Link email/password to existing account
export const linkEmailPassword = async (email, password) => {
  try {
    if (!auth.currentUser) throw new Error('No user logged in');
    
    // Check if email is already in use
    const { available, error: checkError } = await checkEmailAvailability(email);
    if (checkError) throw new Error(checkError);
    if (!available) throw new Error('Email is already in use by another account');
    
    const credential = EmailAuthProvider.credential(email, password);
    const result = await linkWithCredential(auth.currentUser, credential);
    
    // Update user profile in Firestore
    const userId = auth.currentUser.uid;
    await updateDoc(doc(db, 'users', userId), {
      email: email,
      linkedProviders: {
        email: true,
        ...(await getUserProviders(userId))
      },
      updatedAt: new Date()
    });
    
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Link Google account
export const linkGoogleAccount = async () => {
  try {
    if (!auth.currentUser) throw new Error('No user logged in');
    
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Update user profile
    const userId = auth.currentUser.uid;
    await updateDoc(doc(db, 'users', userId), {
      googleEmail: result.user.email,
      linkedProviders: {
        google: true,
        ...(await getUserProviders(userId))
      },
      updatedAt: new Date()
    });
    
    return { user: result.user, error: null };
  } catch (error) {
    // Handle account exists with different credential
    if (error.code === 'auth/account-exists-with-different-credential') {
      return { 
        user: null, 
        error: 'This Google account is already linked to another user' 
      };
    }
    return { user: null, error: error.message };
  }
};

// Link MetaMask wallet to existing account
export const linkMetaMaskWallet = async () => {
  try {
    if (!auth.currentUser) throw new Error('No user logged in');
    
    // Connect MetaMask
    const { signer, address, error: connectError } = await connectMetaMask();
    if (connectError) throw new Error(connectError);
    
    // Check if wallet is already linked
    const walletDoc = await getDoc(doc(db, 'wallets', address.toLowerCase()));
    if (walletDoc.exists()) {
      const { userId } = walletDoc.data();
      if (userId && userId !== auth.currentUser.uid) {
        throw new Error('This wallet is already linked to another account');
      }
    }
    
    // Sign message to verify ownership
    const timestamp = Date.now();
    const message = `Link wallet to Fusion FC account\n\nWallet: ${address}\nUser: ${auth.currentUser.uid}\nTimestamp: ${timestamp}`;
    
    const { signature, error: signError } = await signMessage(signer, message);
    if (signError) throw new Error(signError);
    
    // Verify signature
    const isValid = verifySignature(message, signature, address);
    if (!isValid) throw new Error('Invalid signature');
    
    // Link wallet in Firestore
    await setDoc(doc(db, 'wallets', address.toLowerCase()), {
      userId: auth.currentUser.uid,
      address: address,
      linkedAt: new Date(),
      signature: signature,
      message: message
    });
    
    // Update user profile
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      walletAddress: address,
      linkedProviders: {
        metamask: true,
        ...(await getUserProviders(auth.currentUser.uid))
      },
      updatedAt: new Date()
    });
    
    return { address, error: null };
  } catch (error) {
    return { address: null, error: error.message };
  }
};

// Get user's linked providers
export const getUserProviders = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().linkedProviders || {};
    }
    return {};
  } catch (error) {
    console.error('Error getting user providers:', error);
    return {};
  }
};

// Check if user can sign in with a specific method
export const canSignInWith = async (method, identifier) => {
  try {
    const providers = await getUserProviders(auth.currentUser?.uid);
    
    switch (method) {
      case 'email':
        return providers.email === true;
      case 'google':
        return providers.google === true;
      case 'metamask':
        if (!identifier) return providers.metamask === true;
        // Check if specific wallet is linked
        const walletDoc = await getDoc(doc(db, 'wallets', identifier.toLowerCase()));
        return walletDoc.exists() && walletDoc.data().userId === auth.currentUser?.uid;
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking sign in method:', error);
    return false;
  }
};

// Sign in with any linked method
export const signInWithLinkedAccount = async (method, credentials) => {
  try {
    switch (method) {
      case 'email':
        const { email, password } = credentials;
        const emailCredential = EmailAuthProvider.credential(email, password);
        return await signInWithCredential(auth, emailCredential);
        
      case 'google':
        const provider = new GoogleAuthProvider();
        return await signInWithPopup(auth, provider);
        
      case 'metamask':
        // For MetaMask, we need to verify the wallet is linked to the current user
        const { address } = credentials;
        const walletDoc = await getDoc(doc(db, 'wallets', address.toLowerCase()));
        if (!walletDoc.exists()) {
          throw new Error('Wallet not linked to any account');
        }
        
        const { userId } = walletDoc.data();
        // In production, this would verify with a Cloud Function
        // For now, we'll update the session
        localStorage.setItem('metamask_address', address);
        return { user: { uid: userId }, error: null };
        
      default:
        throw new Error('Invalid authentication method');
    }
  } catch (error) {
    throw error;
  }
};