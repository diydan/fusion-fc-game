import { signInAnonymously, updateProfile, linkWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, db } from '@/config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { connectMetaMask, signMessage, verifySignature } from './metamask';

// Development solution: Store wallet info without Firebase Auth
export const signInWithMetaMaskDev = async () => {
  try {
    // Step 1: Connect MetaMask
    const { signer, address, error: connectError } = await connectMetaMask();
    if (connectError) throw new Error(connectError);

    // Step 2: Check if wallet is linked to an existing account
    const walletDocRef = doc(db, 'wallets', address.toLowerCase());
    const walletDoc = await getDoc(walletDocRef);
    
    let linkedUserId = null;
    let isNewWallet = true;
    
    if (walletDoc.exists()) {
      const walletData = walletDoc.data();
      linkedUserId = walletData.userId;
      isNewWallet = false;
    }

    // Step 3: Create signature message
    const timestamp = Date.now();
    const message = `Sign this message to authenticate with Fusion FC Game\n\nWallet: ${address}\nTimestamp: ${timestamp}`;

    // Step 4: Sign message
    const { signature, error: signError } = await signMessage(signer, message);
    if (signError) throw new Error(signError);

    // Step 5: Verify signature
    const isValid = verifySignature(message, signature, address);
    if (!isValid) throw new Error('Invalid signature');

    // Step 6: For development, create a temporary session
    // In production, this should call a Cloud Function to get a custom token
    localStorage.setItem('metamask_address', address);
    localStorage.setItem('metamask_signature', signature);
    localStorage.setItem('metamask_timestamp', timestamp.toString());

    // Step 7: Store wallet info in Firestore
    try {
      await setDoc(walletDocRef, {
        address: address,
        lastLogin: new Date(),
        signature: signature,
        message: message,
        ...(isNewWallet ? {} : { userId: linkedUserId }) // Preserve userId if exists
      }, { merge: true });
    } catch (firestoreError) {
      console.warn('Could not store wallet info in Firestore:', firestoreError);
      // Continue anyway for development
    }

    // Step 8: Return appropriate user info
    const userId = linkedUserId || address;
    const displayName = linkedUserId ? 
      `Linked Wallet: ${address.slice(0, 6)}...${address.slice(-4)}` : 
      `${address.slice(0, 6)}...${address.slice(-4)}`;

    return { 
      user: { uid: userId, displayName },
      address, 
      signature,
      isLinked: !isNewWallet,
      linkedUserId,
      error: null,
      warning: 'Development mode: Using localStorage. For production, implement Cloud Functions.'
    };
  } catch (error) {
    console.error('MetaMask login error:', error);
    return { user: null, address: null, signature: null, error: error.message };
  }
};

// Check if wallet is already linked to a Firebase user
export const getFirebaseUserByWallet = async (walletAddress) => {
  try {
    const walletDocRef = doc(db, 'wallets', walletAddress.toLowerCase());
    const walletDoc = await getDoc(walletDocRef);
    
    if (walletDoc.exists()) {
      const { userId } = walletDoc.data();
      return userId;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user by wallet:', error);
    return null;
  }
};

// Optional: Link email to MetaMask account later
export const linkEmailToMetaMaskAccount = async (email, password) => {
  try {
    if (!auth.currentUser) throw new Error('No user logged in');
    
    const credential = EmailAuthProvider.credential(email, password);
    await linkWithCredential(auth.currentUser, credential);
    
    // Update user doc
    await setDoc(doc(db, 'users', auth.currentUser.uid), {
      email: email,
      isAnonymous: false
    }, { merge: true });
    
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};