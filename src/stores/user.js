import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { auth } from '@/config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getUser, createUser, updateUser } from '@/services/database';
import { getAvatarUrl } from '@/services/storage';
import { clearMetaMaskSession, getMetaMaskSession } from '@/services/auth/metamask';
import { getFirebaseUserByWallet } from '@/services/auth/metamask-firebase';

export const useUserStore = defineStore('user', () => {
  // State
  const currentUser = ref(null);
  const userProfile = ref(null);
  const loading = ref(true);
  const error = ref(null);
  const avatarUrl = ref(null);

  // Computed
  const isAuthenticated = computed(() => !!currentUser.value);
  const isEmailVerified = computed(() => currentUser.value?.emailVerified ?? false);
  const authMethod = computed(() => {
    if (!currentUser.value) return null;
    if (currentUser.value.providerData?.[0]?.providerId === 'google.com') return 'google';
    if (currentUser.value.providerData?.[0]?.providerId === 'password') return 'email';
    if (userProfile.value?.authMethod === 'metamask') return 'metamask';
    if (currentUser.value.isAnonymous && userProfile.value?.walletAddress) return 'metamask';
    return 'unknown';
  });
  const displayName = computed(() => {
    return userProfile.value?.displayName || 
           currentUser.value?.displayName || 
           userProfile.value?.walletAddress?.slice(0, 6) + '...' + userProfile.value?.walletAddress?.slice(-4) ||
           'Anonymous';
  });

  // Actions
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error: fetchError } = await getUser(userId);
      if (fetchError) {
        console.warn('User profile not found:', fetchError);
        // Don't throw error if user doesn't exist yet
        if (fetchError === 'User not found') {
          return null;
        }
        throw new Error(fetchError);
      }
      
      userProfile.value = data;
      
      // Try to get avatar
      const { url } = await getAvatarUrl(userId);
      if (url) avatarUrl.value = url;
      
      return data;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      error.value = err.message;
      return null;
    }
  };

  const createUserProfile = async (userId, profileData) => {
    try {
      const { error: createError } = await createUser(userId, profileData);
      if (createError) throw new Error(createError);
      
      return await fetchUserProfile(userId);
    } catch (err) {
      error.value = err.message;
      return null;
    }
  };

  const updateUserProfile = async (updates) => {
    if (!currentUser.value) return;
    
    try {
      const userId = userProfile.value?.walletAddress || currentUser.value.uid;
      const { error: updateError } = await updateUser(userId, updates);
      if (updateError) throw new Error(updateError);
      
      // Update local state
      userProfile.value = { ...userProfile.value, ...updates };
      return true;
    } catch (err) {
      error.value = err.message;
      return false;
    }
  };

  const initializeAuth = () => {
    loading.value = true;
    
    // Check for MetaMask session first
    const metamaskAddress = localStorage.getItem('metamask_address');
    if (metamaskAddress) {
      // Check if this wallet is linked to a Firebase user
      getFirebaseUserByWallet(metamaskAddress).then(linkedUserId => {
        if (linkedUserId) {
          // Wallet is linked, use the linked user ID
          currentUser.value = { 
            uid: linkedUserId, 
            displayName: `Linked Wallet: ${metamaskAddress.slice(0, 6)}...${metamaskAddress.slice(-4)}`,
            isMetaMask: true,
            walletAddress: metamaskAddress
          };
          fetchUserProfile(linkedUserId).finally(() => {
            loading.value = false;
          });
        } else {
          // Create a mock user for unlinked MetaMask
          currentUser.value = { 
            uid: metamaskAddress, 
            displayName: `${metamaskAddress.slice(0, 6)}...${metamaskAddress.slice(-4)}`,
            isMetaMask: true 
          };
          fetchUserProfile(metamaskAddress).finally(() => {
            loading.value = false;
          });
        }
      });
      return;
    }
    
    // Firebase auth state listener
    onAuthStateChanged(auth, async (user) => {
      currentUser.value = user;
      
      if (user) {
        // Check if profile exists
        const profile = await fetchUserProfile(user.uid);
        
        if (!profile) {
          // Create profile for new user
          await createUserProfile(user.uid, {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            authMethod: user.providerData?.[0]?.providerId || 'unknown',
            linkedProviders: {
              [user.providerData?.[0]?.providerId || 'unknown']: true
            }
          });
        } else {
          // Update last login
          await updateUser(user.uid, { lastLogin: new Date() });
        }
      } else {
        userProfile.value = null;
        avatarUrl.value = null;
      }
      
      loading.value = false;
    });
  };

  const logout = async () => {
    try {
      // Always use Firebase signOut now that MetaMask uses Firebase Auth
      await signOut(auth);
      clearMetaMaskSession(); // Clean up any legacy localStorage
      return true;
    } catch (err) {
      error.value = err.message;
      return false;
    }
  };

  const setMetaMaskUser = async (address) => {
    currentUser.value = { uid: address, isMetaMask: true };
    const profile = await fetchUserProfile(address);
    
    if (!profile) {
      await createUserProfile(address, {
        walletAddress: address,
        authMethod: 'metamask'
      });
    }
  };

  const updateAvatar = (url) => {
    avatarUrl.value = url;
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    // State
    currentUser,
    userProfile,
    loading,
    error,
    avatarUrl,
    
    // Computed
    isAuthenticated,
    isEmailVerified,
    authMethod,
    displayName,
    
    // Actions
    initializeAuth,
    fetchUserProfile,
    createUserProfile,
    updateUserProfile,
    logout,
    setMetaMaskUser,
    updateAvatar,
    clearError
  };
});