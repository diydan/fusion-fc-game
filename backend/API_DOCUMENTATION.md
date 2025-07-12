# Football Simulation API Documentation

## Base URL
```
https://[YOUR-REGION]-[YOUR-PROJECT-ID].cloudfunctions.net
```

## API Endpoints

### 1. Initialize Game
**POST** `/initGame`

Creates a new game session with two teams and pitch dimensions.

**Request Body:**
```json
{
  "team1": {
    "name": "Team A",
    "players": [/* array of 11 player objects */]
  },
  "team2": {
    "name": "Team B", 
    "players": [/* array of 11 player objects */]
  },
  "pitchWidth": 120,
  "pitchHeight": 90
}
```

**Response:**
```json
{
  "sessionId": "1234567890",
  "matchSetup": {
    /* Complete match setup object */
  }
}
```

### 2. Play Iteration
**POST** `/playIteration`

Advances the game by one iteration (movement/action).

**Request Body:**
```json
{
  "sessionId": "1234567890"
}
```

**Response:**
```json
{
  "sessionId": "1234567890",
  "matchDetails": {
    /* Updated match state */
  }
}
```

### 3. Start Second Half
**POST** `/startSecondHalf`

Switches team sides and starts the second half.

**Request Body:**
```json
{
  "sessionId": "1234567890"
}
```

**Response:**
```json
{
  "sessionId": "1234567890",
  "matchDetails": {
    /* Updated match state for second half */
  }
}
```

### 4. Get Game State
**GET** `/getGameState?sessionId=1234567890`

Retrieves current game state without advancing it.

**Response:**
```json
{
  "sessionId": "1234567890",
  "matchDetails": {
    /* Current match state */
  }
}
```

## Error Responses

All endpoints return appropriate HTTP status codes:
- `400` - Bad Request (missing parameters)
- `404` - Game session not found
- `405` - Method not allowed
- `500` - Server error

## Session Management
- Sessions are stored in memory and expire after 1 hour
- Each session ID is unique and generated using timestamp

## CORS
- CORS is enabled for all origins
- Can be restricted in production by modifying the cors configuration

## Deployment Steps

1. Update `.firebaserc` with your project ID:
```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

2. Install dependencies:
```bash
cd backend/functions
npm install
```

3. Build TypeScript:
```bash
npm run build
```

4. Deploy to Firebase:
```bash
npm run deploy
```

5. Test locally:
```bash
npm run serve
```

## Example Usage

```javascript
// Initialize a game
const response = await fetch('https://[YOUR-URL]/initGame', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    team1: teamData1,
    team2: teamData2,
    pitchWidth: 120,
    pitchHeight: 90
  })
});

const { sessionId } = await response.json();

// Play iterations
const iterationResponse = await fetch('https://[YOUR-URL]/playIteration', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId })
});
```