import { getFunctions, httpsCallable } from 'firebase/functions'
import { addDoc, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'

// Firebase Functions setup
const functions = getFunctions()
const completeMatchFn = httpsCallable(functions, 'completeMatch')
const validateGameStateFn = httpsCallable(functions, 'validateGameState')
const handleDisconnectFn = httpsCallable(functions, 'handleDisconnect')

// REST API fallback URLs (if Firebase Functions are not available)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://us-central1-fusion-fc.cloudfunctions.net'

/**
 * Join matchmaking queue - writes to Firestore collection
 */
export const joinMatchmakingQueue = async (userData) => {
  try {
    const queueData = {
      userId: userData.userId,
      displayName: userData.displayName,
      rating: userData.rating || 1200,
      teamId: userData.teamId,
      gameMode: 'h2h',
      skillLevel: userData.skillLevel || 'intermediate',
      status: 'waiting',
      joinedAt: serverTimestamp()
    }
    
    const docRef = await addDoc(collection(db, 'matchmaking'), queueData)
    
    return {
      success: true,
      queueId: docRef.id,
      data: queueData
    }
  } catch (error) {
    console.error('Error joining matchmaking queue:', error)
    throw error
  }
}

/**
 * Validate game state using Firebase Functions with REST fallback
 */
export const validateGameState = async (matchId, gameState) => {
  try {
    // Try Firebase Functions first
    const result = await validateGameStateFn({
      matchId,
      gameState
    })
    
    return {
      success: true,
      data: result.data
    }
  } catch (error) {
    console.warn('Firebase Functions failed, trying REST API:', error)
    
    // Fallback to REST API
    try {
      const response = await fetch(`${API_BASE_URL}/validateGameState`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: { matchId, gameState }
        })
      })
      
      if (!response.ok) {
        throw new Error(`REST API error: ${response.status}`)
      }
      
      const data = await response.json()
      return {
        success: true,
        data: data.result
      }
    } catch (restError) {
      console.error('REST API also failed:', restError)
      throw new Error('Both Firebase Functions and REST API failed')
    }
  }
}

/**
 * Handle disconnect using Firebase Functions with REST fallback
 */
export const handleDisconnect = async (matchId) => {
  try {
    // Try Firebase Functions first
    const result = await handleDisconnectFn({
      matchId
    })
    
    return {
      success: true,
      data: result.data
    }
  } catch (error) {
    console.warn('Firebase Functions failed, trying REST API:', error)
    
    // Fallback to REST API
    try {
      const response = await fetch(`${API_BASE_URL}/handleDisconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: { matchId }
        })
      })
      
      if (!response.ok) {
        throw new Error(`REST API error: ${response.status}`)
      }
      
      const data = await response.json()
      return {
        success: true,
        data: data.result
      }
    } catch (restError) {
      console.error('REST API also failed:', restError)
      throw new Error('Both Firebase Functions and REST API failed')
    }
  }
}

/**
 * Complete match using Firebase Functions with REST fallback
 */
export const completeMatch = async (matchId, winnerId) => {
  try {
    // Try Firebase Functions first
    const result = await completeMatchFn({
      matchId,
      winnerId
    })
    
    return {
      success: true,
      data: result.data
    }
  } catch (error) {
    console.warn('Firebase Functions failed, trying REST API:', error)
    
    // Fallback to REST API
    try {
      const response = await fetch(`${API_BASE_URL}/completeMatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: { matchId, winnerId }
        })
      })
      
      if (!response.ok) {
        throw new Error(`REST API error: ${response.status}`)
      }
      
      const data = await response.json()
      return {
        success: true,
        data: data.result
      }
    } catch (restError) {
      console.error('REST API also failed:', restError)
      throw new Error('Both Firebase Functions and REST API failed')
    }
  }
}

/**
 * Create a demo match document for testing
 */
export const createDemoMatch = async (player1, player2) => {
  try {
    const matchId = 'demo_match_' + Date.now()
    
    await setDoc(doc(db, 'matches', matchId), {
      players: [player1, player2],
      type: 'h2h',
      status: 'active',
      createdAt: serverTimestamp()
    })
    
    return {
      success: true,
      matchId
    }
  } catch (error) {
    console.error('Error creating demo match:', error)
    throw error
  }
}
