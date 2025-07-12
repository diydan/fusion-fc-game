import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '@/config/firebase';

// User operations
export const createUser = async (userId, userData) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      ...userData,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      onboardingCompleted: false,
      onboardingStep: 0
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUser = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
    } else {
      return { data: null, error: 'User not found' };
    }
  } catch (error) {
    return { data: null, error: error.message };
  }
};

export const updateUser = async (userId, updates) => {
  try {
    const docRef = doc(db, 'users', userId);
    
    // Check if document exists first
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Document exists, update it
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } else {
      // Document doesn't exist, create it
      await setDoc(docRef, {
        uid: userId,
        ...updates,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('updateUser error:', error);
    return { success: false, error: error.message };
  }
};

// Game data operations
export const initializeGameData = async (userId) => {
  try {
    await setDoc(doc(db, 'gameData', userId), {
      score: 0,
      level: 1,
      achievements: [],
      inventory: [],
      stats: {
        matchesPlayed: 0,
        matchesWon: 0,
        totalScore: 0
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getGameData = async (userId) => {
  try {
    const docRef = doc(db, 'gameData', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
    } else {
      return { data: null, error: 'Game data not found' };
    }
  } catch (error) {
    return { data: null, error: error.message };
  }
};

export const updateGameStats = async (userId, stats) => {
  try {
    const docRef = doc(db, 'gameData', userId);
    const updates = {};
    
    if (stats.score !== undefined) {
      updates['score'] = increment(stats.score);
      updates['stats.totalScore'] = increment(stats.score);
    }
    if (stats.matchesPlayed !== undefined) {
      updates['stats.matchesPlayed'] = increment(stats.matchesPlayed);
    }
    if (stats.matchesWon !== undefined) {
      updates['stats.matchesWon'] = increment(stats.matchesWon);
    }
    
    updates.updatedAt = serverTimestamp();
    
    await updateDoc(docRef, updates);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Match operations
export const createMatch = async (matchData) => {
  try {
    const docRef = await addDoc(collection(db, 'matches'), {
      ...matchData,
      status: 'waiting',
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, error: null };
  } catch (error) {
    return { id: null, error: error.message };
  }
};

export const getMatch = async (matchId) => {
  try {
    const docRef = doc(db, 'matches', matchId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
    } else {
      return { data: null, error: 'Match not found' };
    }
  } catch (error) {
    return { data: null, error: error.message };
  }
};

export const updateMatch = async (matchId, updates) => {
  try {
    const docRef = doc(db, 'matches', matchId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getActiveMatches = async (limitCount = 10) => {
  try {
    const q = query(
      collection(db, 'matches'),
      where('status', 'in', ['waiting', 'active']),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const matches = [];
    querySnapshot.forEach((doc) => {
      matches.push({ id: doc.id, ...doc.data() });
    });
    
    return { data: matches, error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

export const getUserMatches = async (userId, limitCount = 10) => {
  try {
    const q = query(
      collection(db, 'matches'),
      where('players', 'array-contains', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const matches = [];
    querySnapshot.forEach((doc) => {
      matches.push({ id: doc.id, ...doc.data() });
    });
    
    return { data: matches, error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

// Team operations
export const createTeam = async (teamData) => {
  try {
    const docRef = await addDoc(collection(db, 'teams'), {
      ...teamData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      stats: {
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0
      }
    });
    return { id: docRef.id, error: null };
  } catch (error) {
    return { id: null, error: error.message };
  }
};

export const getTeam = async (teamId) => {
  try {
    const docRef = doc(db, 'teams', teamId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
    } else {
      return { data: null, error: 'Team not found' };
    }
  } catch (error) {
    return { data: null, error: error.message };
  }
};

export const updateTeam = async (teamId, updates) => {
  try {
    const docRef = doc(db, 'teams', teamId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getTeamByManagerId = async (managerId) => {
  try {
    const q = query(
      collection(db, 'teams'),
      where('managerId', '==', managerId),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { data: { id: doc.id, ...doc.data() }, error: null };
    } else {
      return { data: null, error: 'Team not found' };
    }
  } catch (error) {
    return { data: null, error: error.message };
  }
};

// Onboarding operations
export const updateOnboardingProgress = async (userId, step, data = {}) => {
  try {
    const updates = {
      onboardingStep: step,
      ...data
    };
    
    if (step === 'completed') {
      updates.onboardingCompleted = true;
      updates.onboardingCompletedAt = serverTimestamp();
    }
    
    await updateUser(userId, updates);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};