import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  getDoc,
  getDocs,
  runTransaction,
  increment,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';

// Join matchmaking queue
export const joinMatchmakingQueue = async (userId, userProfile) => {
  try {
    const queueData = {
      userId,
      displayName: userProfile.displayName || 'Anonymous',
      rating: userProfile.rating || 1200,
      teamId: userProfile.activeTeamId,
      joinedAt: serverTimestamp(),
      status: 'waiting'
    };
    
    await setDoc(doc(db, 'matchmaking', userId), queueData);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Leave matchmaking queue
export const leaveMatchmakingQueue = async (userId) => {
  try {
    await deleteDoc(doc(db, 'matchmaking', userId));
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Find opponent and create match
export const findOpponent = async (userId, userRating) => {
  try {
    return await runTransaction(db, async (transaction) => {
      // Query for waiting players with similar rating (within 200 points)
      const queueRef = collection(db, 'matchmaking');
      const q = query(
        queueRef,
        where('status', '==', 'waiting'),
        where('userId', '!=', userId),
        where('rating', '>=', userRating - 200),
        where('rating', '<=', userRating + 200),
        orderBy('rating'),
        orderBy('joinedAt'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return { match: null, error: 'No opponent found' };
      }
      
      const opponentDoc = snapshot.docs[0];
      const opponent = opponentDoc.data();
      
      // Get both user profiles
      const userRef = doc(db, 'matchmaking', userId);
      const userDoc = await transaction.get(userRef);
      const userData = userDoc.data();
      
      // Create match
      const matchRef = doc(collection(db, 'matches'));
      const matchData = {
        players: [
          {
            id: userId,
            displayName: userData.displayName,
            rating: userData.rating,
            teamId: userData.teamId,
            ready: false
          },
          {
            id: opponent.userId,
            displayName: opponent.displayName,
            rating: opponent.rating,
            teamId: opponent.teamId,
            ready: false
          }
        ],
        type: 'h2h',
        status: 'waiting',
        createdAt: serverTimestamp()
      };
      
      transaction.set(matchRef, matchData);
      
      // Update both players' queue status
      transaction.update(userRef, { status: 'matched' });
      transaction.update(doc(db, 'matchmaking', opponent.userId), { status: 'matched' });
      
      // Remove both players from queue after a delay
      setTimeout(async () => {
        await deleteDoc(userRef);
        await deleteDoc(doc(db, 'matchmaking', opponent.userId));
      }, 2000);
      
      return { match: { id: matchRef.id, ...matchData }, error: null };
    });
  } catch (error) {
    return { match: null, error: error.message };
  }
};

// Listen to matchmaking queue
export const subscribeToQueue = (callback) => {
  const q = query(
    collection(db, 'matchmaking'),
    where('status', '==', 'waiting'),
    orderBy('joinedAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const queue = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
    callback(queue);
  });
};

// Listen to specific match
export const subscribeToMatch = (matchId, callback) => {
  const matchRef = doc(db, 'matches', matchId);
  
  return onSnapshot(matchRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    } else {
      callback(null);
    }
  });
};

// Update player ready status
export const setPlayerReady = async (matchId, playerId, ready) => {
  try {
    const matchRef = doc(db, 'matches', matchId);
    const matchDoc = await getDoc(matchRef);
    
    if (!matchDoc.exists()) {
      return { success: false, error: 'Match not found' };
    }
    
    const match = matchDoc.data();
    const players = match.players.map(p => 
      p.id === playerId ? { ...p, ready } : p
    );
    
    // Check if all players are ready
    const allReady = players.every(p => p.ready);
    const updates = { players };
    
    if (allReady && match.status === 'waiting') {
      updates.status = 'starting';
      updates.startedAt = serverTimestamp();
    }
    
    await updateDoc(matchRef, updates);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get active matches (for spectating)
export const getActiveH2HMatches = async (limitCount = 10) => {
  try {
    const q = query(
      collection(db, 'matches'),
      where('type', '==', 'h2h'),
      where('status', 'in', ['active', 'starting']),
      orderBy('startedAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    const matches = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { matches, error: null };
  } catch (error) {
    return { matches: [], error: error.message };
  }
};

// Import cloud function
import { completeMatchViaFunction } from './functions';

// Update match result (now uses cloud function)
export const completeMatch = async (matchId, winnerId) => {
  try {
    // Use cloud function for secure server-side processing
    const result = await completeMatchViaFunction(matchId, winnerId);
    return { success: result.success, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};