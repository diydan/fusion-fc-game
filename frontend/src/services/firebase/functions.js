import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '@/config/firebase';

// Initialize Functions
const functions = getFunctions(app, 'us-central1');

// Cloud function references
export const completeMatchFunction = httpsCallable(functions, 'completeMatch');
export const validateGameStateFunction = httpsCallable(functions, 'validateGameState');
export const handleDisconnectFunction = httpsCallable(functions, 'handleDisconnect');

// Helper functions to call cloud functions

/**
 * Complete a match through cloud function
 */
export const completeMatchViaFunction = async (matchId, winnerId) => {
  try {
    const result = await completeMatchFunction({ matchId, winnerId });
    return result.data;
  } catch (error) {
    console.error('Error calling completeMatch function:', error);
    throw error;
  }
};

/**
 * Validate game state through cloud function
 */
export const validateGameStateViaFunction = async (matchId, gameState) => {
  try {
    const result = await validateGameStateFunction({ matchId, gameState });
    return result.data;
  } catch (error) {
    console.error('Error calling validateGameState function:', error);
    throw error;
  }
};

/**
 * Handle disconnect through cloud function
 */
export const handleDisconnectViaFunction = async (matchId) => {
  try {
    const result = await handleDisconnectFunction({ matchId });
    return result.data;
  } catch (error) {
    console.error('Error calling handleDisconnect function:', error);
    throw error;
  }
};