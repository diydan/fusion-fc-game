import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth } from '@/config/firebase';

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    const user = result.user;
    
    return { user, token, error: null };
  } catch (error) {
    return { user: null, token: null, error: error.message };
  }
};

export const signInWithGoogleRedirect = () => {
  return signInWithRedirect(auth, provider);
};

export const getGoogleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      const user = result.user;
      return { user, token, error: null };
    }
    return { user: null, token: null, error: null };
  } catch (error) {
    return { user: null, token: null, error: error.message };
  }
};