import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Types
interface MatchmakingEntry {
  userId: string;
  displayName: string;
  rating: number;
  teamId?: string;
  joinedAt: admin.firestore.Timestamp;
  status: 'waiting' | 'matched';
}

interface EloUpdate {
  winnerId: string;
  loserId: string;
  winnerRating: number;
  loserRating: number;
}

// Constants
const ELO_K_FACTOR = 32; // Standard chess ELO K-factor
const RATING_SEARCH_RANGE = 200;
const MATCHMAKING_TIMEOUT_MINUTES = 5;

/**
 * Process matchmaking queue
 * This function should be called periodically to match players
 */
export const processMatchmaking = onSchedule({
  schedule: "every 10 seconds",
  region: "us-central1",
}, async (event) => {
  logger.info("Processing matchmaking queue");
  
  try {
    // Get all waiting players
    const waitingPlayers = await db.collection('matchmaking')
      .where('status', '==', 'waiting')
      .orderBy('rating')
      .orderBy('joinedAt')
      .get();
    
    if (waitingPlayers.empty) {
      logger.info("No players waiting in queue");
      return;
    }
    
    const players = waitingPlayers.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MatchmakingEntry & { id: string }));
    
    logger.info(`Found ${players.length} players waiting`);
    
    // Try to match players
    const matched: string[] = [];
    
    for (let i = 0; i < players.length; i++) {
      if (matched.includes(players[i].id)) continue;
      
      const player1 = players[i];
      
      // Find suitable opponent
      for (let j = i + 1; j < players.length; j++) {
        if (matched.includes(players[j].id)) continue;
        
        const player2 = players[j];
        const ratingDiff = Math.abs(player1.rating - player2.rating);
        
        if (ratingDiff <= RATING_SEARCH_RANGE) {
          // Create match
          logger.info(`Matching ${player1.displayName} (${player1.rating}) with ${player2.displayName} (${player2.rating})`);
          
          await createMatch(player1, player2);
          matched.push(player1.id, player2.id);
          break;
        }
      }
    }
    
    // Clean up old entries
    await cleanupOldQueueEntries();
    
    logger.info(`Matched ${matched.length / 2} pairs of players`);
  } catch (error) {
    logger.error("Error in processMatchmaking:", error);
  }
});

/**
 * Create a match between two players
 */
async function createMatch(player1: any, player2: any) {
  const batch = db.batch();
  
  // Create match document
  const matchRef = db.collection('matches').doc();
  batch.set(matchRef, {
    players: [
      {
        id: player1.userId,
        displayName: player1.displayName,
        rating: player1.rating,
        teamId: player1.teamId,
        ready: false
      },
      {
        id: player2.userId,
        displayName: player2.displayName,
        rating: player2.rating,
        teamId: player2.teamId,
        ready: false
      }
    ],
    type: 'h2h',
    status: 'waiting',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Update matchmaking entries
  batch.update(db.collection('matchmaking').doc(player1.id), {
    status: 'matched',
    matchId: matchRef.id
  });
  
  batch.update(db.collection('matchmaking').doc(player2.id), {
    status: 'matched',
    matchId: matchRef.id
  });
  
  await batch.commit();
  
  // Schedule cleanup of matchmaking entries
  setTimeout(async () => {
    await db.collection('matchmaking').doc(player1.id).delete();
    await db.collection('matchmaking').doc(player2.id).delete();
  }, 5000);
}

/**
 * Clean up old matchmaking entries
 */
async function cleanupOldQueueEntries() {
  const cutoffTime = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() - MATCHMAKING_TIMEOUT_MINUTES * 60 * 1000)
  );
  
  const oldEntries = await db.collection('matchmaking')
    .where('joinedAt', '<', cutoffTime)
    .get();
  
  const batch = db.batch();
  oldEntries.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  logger.info(`Cleaned up ${oldEntries.size} old matchmaking entries`);
}

/**
 * Calculate ELO rating changes
 */
function calculateEloChange(winnerRating: number, loserRating: number): EloUpdate {
  // Expected scores
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));
  
  // New ratings
  const newWinnerRating = Math.round(winnerRating + ELO_K_FACTOR * (1 - expectedWinner));
  const newLoserRating = Math.round(loserRating + ELO_K_FACTOR * (0 - expectedLoser));
  
  return {
    winnerId: '',
    loserId: '',
    winnerRating: newWinnerRating,
    loserRating: newLoserRating
  };
}

/**
 * Complete a match and update ratings
 */
export const completeMatch = onCall({
  region: "us-central1",
}, async (request) => {
  const { matchId, winnerId } = request.data;
  const userId = request.auth?.uid;
  
  if (!userId) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  if (!matchId || !winnerId) {
    throw new HttpsError('invalid-argument', 'Match ID and winner ID are required');
  }
  
  try {
    const matchRef = db.collection('matches').doc(matchId);
    const matchDoc = await matchRef.get();
    
    if (!matchDoc.exists) {
      throw new HttpsError('not-found', 'Match not found');
    }
    
    const match = matchDoc.data()!;
    
    // Verify user is part of the match
    const playerIds = match.players.map((p: any) => p.id);
    if (!playerIds.includes(userId)) {
      throw new HttpsError('permission-denied', 'User is not part of this match');
    }
    
    // Verify match is active
    if (match.status !== 'active') {
      throw new HttpsError('failed-precondition', 'Match is not active');
    }
    
    // Get player data
    const winner = match.players.find((p: any) => p.id === winnerId);
    const loser = match.players.find((p: any) => p.id !== winnerId);
    
    if (!winner || !loser) {
      throw new HttpsError('invalid-argument', 'Invalid winner ID');
    }
    
    // Calculate new ratings
    const eloUpdate = calculateEloChange(winner.rating, loser.rating);
    
    // Update match
    const batch = db.batch();
    
    batch.update(matchRef, {
      status: 'completed',
      winner: winnerId,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      finalRatings: {
        [winner.id]: eloUpdate.winnerRating,
        [loser.id]: eloUpdate.loserRating
      }
    });
    
    // Update user ratings and stats
    batch.update(db.collection('users').doc(winner.id), {
      rating: eloUpdate.winnerRating,
      'stats.matchesPlayed': admin.firestore.FieldValue.increment(1),
      'stats.matchesWon': admin.firestore.FieldValue.increment(1)
    });
    
    batch.update(db.collection('users').doc(loser.id), {
      rating: eloUpdate.loserRating,
      'stats.matchesPlayed': admin.firestore.FieldValue.increment(1)
    });
    
    await batch.commit();
    
    logger.info(`Match ${matchId} completed. Winner: ${winner.displayName} (${winner.rating} -> ${eloUpdate.winnerRating})`);
    
    return {
      success: true,
      ratings: {
        winner: eloUpdate.winnerRating,
        loser: eloUpdate.loserRating
      }
    };
  } catch (error) {
    logger.error('Error completing match:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to complete match');
  }
});

/**
 * Validate game state update
 */
export const validateGameState = onCall({
  region: "us-central1",
}, async (request) => {
  const { matchId, gameState } = request.data;
  const userId = request.auth?.uid;
  
  if (!userId) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  if (!matchId || !gameState) {
    throw new HttpsError('invalid-argument', 'Match ID and game state are required');
  }
  
  try {
    // Get match data
    const matchDoc = await db.collection('matches').doc(matchId).get();
    
    if (!matchDoc.exists) {
      throw new HttpsError('not-found', 'Match not found');
    }
    
    const match = matchDoc.data()!;
    
    // Verify player is in the match
    const isPlayer = match.players.some((p: any) => p.id === userId);
    if (!isPlayer) {
      throw new HttpsError('permission-denied', 'User is not in this match');
    }
    
    // Basic validation
    if (gameState.score) {
      if (gameState.score.home < 0 || gameState.score.away < 0) {
        throw new HttpsError('invalid-argument', 'Invalid score values');
      }
      
      // Check for suspiciously high scores
      if (gameState.score.home > 20 || gameState.score.away > 20) {
        logger.warn(`Suspicious score detected in match ${matchId}: ${gameState.score.home} - ${gameState.score.away}`);
      }
    }
    
    if (gameState.time) {
      if (gameState.time < 0 || gameState.time > 5400) { // 90 minutes max
        throw new HttpsError('invalid-argument', 'Invalid time value');
      }
    }
    
    // Validate player positions
    if (gameState.players) {
      for (const [, playerData] of Object.entries(gameState.players)) {
        const pos = (playerData as any).position;
        if (pos) {
          // Check bounds (assuming standard field size)
          if (Math.abs(pos.x) > 50 || Math.abs(pos.z) > 30 || pos.y < 0 || pos.y > 10) {
            throw new HttpsError('invalid-argument', 'Player position out of bounds');
          }
        }
      }
    }
    
    return { valid: true };
  } catch (error) {
    logger.error('Error validating game state:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to validate game state');
  }
});

/**
 * Handle player disconnect
 */
export const handleDisconnect = onCall({
  region: "us-central1",
}, async (request) => {
  const { matchId } = request.data;
  const userId = request.auth?.uid;
  
  if (!userId) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  if (!matchId) {
    throw new HttpsError('invalid-argument', 'Match ID is required');
  }
  
  try {
    const matchRef = db.collection('matches').doc(matchId);
    const updates: any = {};
    
    updates[`gameState.players.${userId}.connected`] = false;
    updates[`gameState.players.${userId}.disconnectedAt`] = admin.firestore.FieldValue.serverTimestamp();
    updates['gameState.paused'] = true;
    updates['gameState.pauseReason'] = 'player_disconnected';
    
    await matchRef.update(updates);
    
    logger.info(`Player ${userId} disconnected from match ${matchId}`);
    
    // Set a timeout to forfeit if player doesn't reconnect
    setTimeout(async () => {
      const matchDoc = await matchRef.get();
      if (matchDoc.exists) {
        const match = matchDoc.data()!;
        const playerConnected = match.gameState?.players?.[userId]?.connected;
        
        if (!playerConnected && match.status === 'active') {
          // Forfeit the match
          const opponent = match.players.find((p: any) => p.id !== userId);
          if (opponent) {
            // Mark match as forfeited
            await matchRef.update({
              status: 'completed',
              winner: opponent.id,
              completedAt: admin.firestore.FieldValue.serverTimestamp(),
              forfeited: true,
              forfeitedBy: userId
            });
            logger.info(`Match ${matchId} forfeited by ${userId}`);
          }
        }
      }
    }, 60000); // 1 minute timeout
    
    return { success: true };
  } catch (error) {
    logger.error('Error handling disconnect:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to handle disconnect');
  }
});