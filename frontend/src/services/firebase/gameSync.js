import { 
  doc, 
  updateDoc, 
  onSnapshot,
  serverTimestamp,
  runTransaction,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';

// Update game state
export const updateGameState = async (matchId, gameState, playerId) => {
  try {
    const matchRef = doc(db, 'matches', matchId);
    
    await updateDoc(matchRef, {
      gameState: {
        ...gameState,
        lastUpdate: serverTimestamp(),
        lastUpdatedBy: playerId
      }
    });
    
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Subscribe to game state changes
export const subscribeToGameState = (matchId, callback) => {
  const matchRef = doc(db, 'matches', matchId);
  
  return onSnapshot(matchRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback(data.gameState || null);
    } else {
      callback(null);
    }
  });
};

// Send game action (for real-time events)
export const sendGameAction = async (matchId, action) => {
  try {
    const actionsRef = collection(db, 'matches', matchId, 'actions');
    
    await addDoc(actionsRef, {
      ...action,
      timestamp: serverTimestamp()
    });
    
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Subscribe to game actions
export const subscribeToGameActions = (matchId, callback) => {
  const actionsRef = collection(db, 'matches', matchId, 'actions');
  const q = query(actionsRef, orderBy('timestamp', 'desc'), limit(50));
  
  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        callback(change.doc.data());
      }
    });
  });
};

// Synchronize game clock
export const syncGameClock = async (matchId, time, period) => {
  try {
    await updateDoc(doc(db, 'matches', matchId), {
      'gameState.time': time,
      'gameState.period': period,
      'gameState.lastUpdate': serverTimestamp()
    });
    
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Handle goal scoring with validation
export const scoreGoal = async (matchId, team, playerId, scorerId) => {
  try {
    return await runTransaction(db, async (transaction) => {
      const matchRef = doc(db, 'matches', matchId);
      const matchDoc = await transaction.get(matchRef);
      
      if (!matchDoc.exists()) {
        throw new Error('Match not found');
      }
      
      const match = matchDoc.data();
      const currentScore = match.gameState?.score || { home: 0, away: 0 };
      
      // Update score
      const newScore = {
        ...currentScore,
        [team]: currentScore[team] + 1
      };
      
      // Add goal to history
      const goalEvent = {
        type: 'goal',
        team,
        scorer: scorerId,
        time: match.gameState?.time || 0,
        period: match.gameState?.period || 'first',
        timestamp: serverTimestamp()
      };
      
      transaction.update(matchRef, {
        'gameState.score': newScore,
        'gameState.lastUpdate': serverTimestamp(),
        'gameState.lastUpdatedBy': playerId
      });
      
      // Add goal event
      const eventsRef = collection(db, 'matches', matchId, 'events');
      transaction.set(doc(eventsRef), goalEvent);
      
      return { success: true, score: newScore, error: null };
    });
  } catch (error) {
    return { success: false, score: null, error: error.message };
  }
};

// Pause/Resume game
export const setGamePaused = async (matchId, paused, requestedBy) => {
  try {
    await updateDoc(doc(db, 'matches', matchId), {
      'gameState.paused': paused,
      'gameState.pausedBy': paused ? requestedBy : null,
      'gameState.lastUpdate': serverTimestamp()
    });
    
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Handle player disconnection
export const handlePlayerDisconnect = async (matchId, playerId) => {
  try {
    const updates = {};
    updates[`gameState.players.${playerId}.connected`] = false;
    updates[`gameState.players.${playerId}.disconnectedAt`] = serverTimestamp();
    updates['gameState.paused'] = true;
    updates['gameState.pauseReason'] = 'player_disconnected';
    
    await updateDoc(doc(db, 'matches', matchId), updates);
    
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Handle player reconnection
export const handlePlayerReconnect = async (matchId, playerId) => {
  try {
    const matchRef = doc(db, 'matches', matchId);
    const matchDoc = await getDoc(matchRef);
    
    if (!matchDoc.exists()) {
      return { success: false, error: 'Match not found' };
    }
    
    const match = matchDoc.data();
    const updates = {};
    
    updates[`gameState.players.${playerId}.connected`] = true;
    updates[`gameState.players.${playerId}.reconnectedAt`] = serverTimestamp();
    
    // Check if all players are connected
    const allConnected = match.players.every(p => 
      p.id === playerId || match.gameState?.players?.[p.id]?.connected !== false
    );
    
    if (allConnected && match.gameState?.pauseReason === 'player_disconnected') {
      updates['gameState.paused'] = false;
      updates['gameState.pauseReason'] = null;
    }
    
    await updateDoc(matchRef, updates);
    
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Submit team lineup
export const submitTeamLineup = async (matchId, playerId, lineup) => {
  try {
    const updates = {};
    updates[`gameState.lineups.${playerId}`] = {
      ...lineup,
      submittedAt: serverTimestamp()
    };
    
    await updateDoc(doc(db, 'matches', matchId), updates);
    
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update player positions in real-time
export const updatePlayerPositions = async (matchId, positions, playerId) => {
  try {
    await updateDoc(doc(db, 'matches', matchId), {
      'gameState.positions': positions,
      'gameState.lastPositionUpdate': serverTimestamp(),
      'gameState.lastUpdatedBy': playerId
    });
    
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};