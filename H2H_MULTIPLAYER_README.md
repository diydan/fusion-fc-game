# H2H Multiplayer Integration Guide

This guide explains how to integrate the Head-to-Head (H2H) multiplayer system into your Fusion FC game.

## Overview

The H2H multiplayer system includes:
- Real-time matchmaking with ELO-based skill matching
- Live game synchronization between players
- Cloud functions for secure game logic
- Spectator mode for watching live matches
- Automatic disconnect/reconnect handling

## Prerequisites

1. **Firebase Project Setup**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password and Google providers)
   - Enable Firestore Database
   - Enable Cloud Functions (requires Blaze plan)

2. **Environment Variables**
   Create a `.env` file in the frontend directory with your Firebase config:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

## Installation

### 1. Deploy Cloud Functions

```bash
cd backend/functions
npm install
npm run deploy
```

This will deploy:
- `processMatchmaking` - Automated matchmaking (runs every 10 seconds)
- `completeMatch` - Secure match completion with ELO updates
- `validateGameState` - Anti-cheat validation
- `handleDisconnect` - Disconnect management

### 2. Deploy Firestore Security Rules

```bash
cd frontend
firebase deploy --only firestore:rules
```

### 3. Frontend Setup

The frontend integration is already complete, but ensure you have:
- Firebase SDK installed
- Authentication configured
- Router updated with H2H routes

## Usage Guide

### For Players

1. **Access H2H Mode**
   - Navigate to "My Games" from the dashboard
   - Click "Find Match" in the H2H Multiplayer section

2. **Matchmaking**
   - Wait in the queue while the system finds an opponent
   - Players are matched based on similar skill ratings (±200 points)
   - Accept the match when found

3. **During Match**
   - Game state syncs in real-time
   - If disconnected, you have 1 minute to reconnect
   - Match ends when completed or forfeited

### For Developers

#### 1. Authentication Flow
```javascript
// User must be authenticated before matchmaking
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
if (!userStore.isAuthenticated) {
  router.push('/login')
}
```

#### 2. Join Matchmaking Queue
```javascript
import { joinMatchmakingQueue } from '@/services/firebase/matchmaking'

const result = await joinMatchmakingQueue(userId, userProfile)
if (result.success) {
  // User is now in queue
}
```

#### 3. Listen for Match Updates
```javascript
import { subscribeToMatch } from '@/services/firebase/matchmaking'

const unsubscribe = subscribeToMatch(matchId, (match) => {
  if (match.status === 'starting') {
    // Match is ready to begin
  }
})
```

#### 4. Synchronize Game State
```javascript
import { updateGameState, subscribeToGameState } from '@/services/firebase/gameSync'

// Send game updates
await updateGameState(matchId, {
  ball: { position: { x, y, z } },
  players: { [playerId]: { position: { x, y, z } } }
}, playerId)

// Listen for updates
subscribeToGameState(matchId, (state) => {
  // Update local game with received state
})
```

#### 5. Complete Match
```javascript
import { completeMatch } from '@/services/firebase/matchmaking'

// When match ends, declare winner
await completeMatch(matchId, winnerId)
```

## Database Schema

### Collections

#### `matchmaking`
```javascript
{
  userId: string,
  displayName: string,
  rating: number,
  teamId: string,
  joinedAt: Timestamp,
  status: 'waiting' | 'matched'
}
```

#### `matches`
```javascript
{
  players: [{
    id: string,
    displayName: string,
    rating: number,
    teamId: string,
    ready: boolean
  }],
  type: 'h2h',
  status: 'waiting' | 'starting' | 'active' | 'completed',
  winner?: string,
  gameState?: GameState,
  createdAt: Timestamp,
  startedAt?: Timestamp,
  completedAt?: Timestamp
}
```

#### `matches/{matchId}/actions`
```javascript
{
  type: 'move' | 'shoot' | 'pass' | 'tackle' | 'goal',
  playerId: string,
  data: any,
  timestamp: Timestamp
}
```

## Game State Structure

```javascript
{
  ball: {
    position: { x, y, z },
    velocity: { x, y, z }
  },
  players: {
    [playerId]: {
      position: { x, y, z },
      rotation: { x, y, z },
      stamina: number,
      animation?: string
    }
  },
  score: {
    home: number,
    away: number
  },
  time: number,
  period: 'first' | 'second' | 'overtime',
  paused?: boolean,
  lastUpdate: Timestamp,
  lastUpdatedBy: string
}
```

## Security Considerations

1. **Authentication Required**
   - All matchmaking routes require authentication
   - Cloud functions verify user identity

2. **Anti-Cheat Measures**
   - Game state validated server-side
   - Score changes verified by cloud functions
   - Position bounds checking

3. **Rate Limiting**
   - Matchmaking limited to one queue entry per user
   - Game state updates throttled

## Troubleshooting

### Common Issues

1. **"No opponent found"**
   - Ensure other players are in queue
   - Check rating range (±200 points)
   - Verify matchmaking function is deployed

2. **Game state not syncing**
   - Check Firestore rules are deployed
   - Verify both players are authenticated
   - Check browser console for errors

3. **Match not starting**
   - Ensure both players marked as ready
   - Check match status in Firestore

### Debug Commands

```javascript
// Check matchmaking queue
const queue = await getDocs(query(
  collection(db, 'matchmaking'),
  where('status', '==', 'waiting')
))
console.log('Players in queue:', queue.size)

// Check active matches
const matches = await getActiveH2HMatches()
console.log('Active matches:', matches)
```

## Testing

### Local Testing

1. **Multiple Users**
   - Open two browser windows in incognito mode
   - Login with different accounts
   - Join matchmaking from both

2. **Simulate Disconnect**
   - During match, close one browser
   - Observe pause behavior
   - Reconnect within 1 minute

### Firebase Emulator

```bash
cd backend/functions
npm run serve
```

This starts local emulators for testing without deploying.

## Performance Optimization

1. **Reduce Update Frequency**
   - Throttle position updates to 10-30 Hz
   - Batch multiple updates together

2. **Client-Side Prediction**
   - Continue local simulation between updates
   - Reconcile with server state

3. **Regional Deployment**
   - Deploy functions to multiple regions
   - Use closest region for lower latency

## Future Enhancements

1. **Tournament System**
   - Bracket generation
   - Multiple match formats
   - Prizes/rewards

2. **Advanced Matchmaking**
   - Team composition matching
   - Regional preferences
   - Ranked seasons

3. **Social Features**
   - Friend lists
   - Private matches
   - Team chat

## Support

For issues or questions:
1. Check browser console for errors
2. Review Firestore data in Firebase Console
3. Check Cloud Functions logs
4. Open an issue in the repository

---

Happy gaming! 🎮⚽