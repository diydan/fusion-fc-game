# Demo Page Usage Instructions

This demo page showcases the core functionalities of Fusion FC Game, including real-time football simulation and multiplayer head-to-head capabilities.

## Quick Start

1. **Run the demo**: 
   ```bash
   npm run dev:demo
   ```
   This will start the development server with Vite.

2. **Navigate to Demo**: Go to `/demo` in your browser

3. **Authentication**: Ensure you're logged in to test multiplayer features

## Features Overview

### 🏈 Football Simulation Tab

The Football Simulation provides a comprehensive testing interface for the game engine:

#### Available Actions

- **Init Game**: 
  - Creates a new game session with two sample teams
  - Generates a unique session ID
  - Returns initial match setup including teams, pitch dimensions, and starting positions
  - **Usage**: Click to start a new simulation

- **Play Tick**: 
  - Advances the game state by one iteration
  - Updates player positions, ball position, and game time
  - May generate goals, fouls, or other game events
  - **Usage**: Click repeatedly to step through the game manually

- **Auto Loop (x20)**: 
  - Automatically plays 20 iterations in sequence
  - Provides quick progression through game time
  - Updates display in real-time with visual feedback
  - **Usage**: Click for fast-forwarded gameplay

- **Start 2nd Half**: 
  - Transitions the game to the second half
  - Resets positions and switches sides
  - Continues with existing score and game state
  - **Usage**: Click when ready to advance to second half

- **Get State**: 
  - Retrieves current game state without advancing
  - Useful for debugging and state inspection
  - Shows complete match details in both table and JSON formats
  - **Usage**: Click to refresh/inspect current state

#### Match Details Display

The interface provides two viewing modes:

1. **Table View**: Clean, organized display of:
   - Game Status (kick-off time, current time, half, phase)
   - Score (home vs away with visual scoreboard)
   - Team Information (names, ratings)
   - Ball Position (coordinates and current owner)

2. **JSON View**: Raw data format for developers:
   - Complete game state object
   - Useful for debugging and integration testing
   - Formatted for easy reading

### 🎮 Multiplayer Head-to-Head Tab

The Multiplayer system demonstrates real-time player interactions:

#### Available Actions

- **Join Queue (mock)**: 
  - Simulates joining the matchmaking queue
  - Requires user authentication
  - Creates queue entry with user ID, display name, and team ID
  - **Usage**: Test matchmaking system integration

- **Validate Sample State**: 
  - Tests game state validation system
  - Validates score bounds (0-20 goals)
  - Validates time bounds (0-5400 seconds for 90 minutes)
  - Validates player positions within field boundaries
  - **Usage**: Ensure game state integrity

- **Simulate Disconnect**: 
  - Mocks player disconnection scenarios
  - Triggers 60-second timeout before auto-forfeit
  - Updates match status and opponent victory
  - **Usage**: Test connection handling and recovery

- **Complete Match (pick winner)**: 
  - Manually completes a match
  - Calculates ELO rating changes (K-factor 32)
  - Updates winner and loser ratings
  - Creates match completion records
  - **Usage**: Test match completion and rating system

## 📋 Log Console

The integrated log console provides real-time feedback:

- **Expandable Interface**: Click "Show/Hide Log" to toggle
- **Timestamped Entries**: All actions logged with timestamps
- **Request/Response Tracking**: See API calls and responses
- **Error Handling**: Displays detailed error messages
- **JSON Formatting**: Structured data display for easy debugging

## 🔧 Technical Implementation

### API Integration

- **Base URL**: `https://us-central1-fusion-fc-game.cloudfunctions.net`
- **Authentication**: Firebase Auth required for multiplayer features
- **CORS**: Enabled for cross-origin requests
- **Error Handling**: Comprehensive error catching and user feedback

### Football Engine

- **Session Management**: In-memory sessions with 1-hour expiration
- **Team Configuration**: Sample teams with player ratings and positions
- **Game Logic**: Realistic football simulation with time, score, and events
- **State Persistence**: Session state maintained across requests

### Multiplayer System

- **Queue Management**: Matchmaking with rating-based pairing
- **Real-time Updates**: Live game state synchronization
- **Disconnect Handling**: Automatic forfeit after 60 seconds
- **ELO Ratings**: Standard chess-style rating system

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ installed
- Firebase project configured
- User authentication set up

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Configure Firebase settings
   ```

4. Run the demo:
   ```bash
   npm run dev:demo
   ```

### Testing Workflow

1. **Start with Football Simulation**:
   - Click "Init Game" to create a session
   - Use "Play Tick" to step through manually
   - Try "Auto Loop" for quick progression
   - Switch to "Start 2nd Half" when ready
   - Use "Get State" to inspect current status

2. **Test Multiplayer Features**:
   - Ensure you're authenticated
   - Click "Join Queue" to test matchmaking
   - Use "Validate Sample State" to test validation
   - Try "Simulate Disconnect" to test error handling
   - Use "Complete Match" to test rating updates

3. **Monitor Logs**:
   - Keep log console open for real-time feedback
   - Check timestamps and request/response flow
   - Look for error messages and success confirmations

## 📊 Expected Behavior

### Successful Operations

- **Init Game**: Returns session ID and match setup
- **Play Tick**: Updates game time and positions
- **Auto Loop**: Rapid progression with visual updates
- **Join Queue**: Confirmation with queue ID
- **Validate State**: Returns `{valid: true}` for correct data
- **Complete Match**: Shows ELO rating changes

### Error Scenarios

- **Unauthenticated**: "User must be authenticated" error
- **Invalid Session**: "Session not found" error
- **Network Issues**: Connection error with retry suggestions
- **Invalid Data**: Validation errors with specific details

## 📱 Mobile Compatibility

- **Responsive Design**: Works on mobile devices
- **Touch Interactions**: Button taps optimized for touch
- **Compact Layout**: Efficient use of screen space
- **Readable Text**: Appropriate font sizes for mobile

## 🔍 Debugging Tips

1. **Check Browser Console**: Look for JavaScript errors
2. **Network Tab**: Monitor API requests and responses
3. **Firebase Console**: Check authentication and database
4. **Log Output**: Use the integrated log console
5. **Session Storage**: Verify session persistence

## 📝 Notes

- The demo uses mock data for teams and players
- Session IDs are generated using timestamps
- ELO ratings use standard chess K-factor of 32
- Game time is measured in seconds (90 minutes = 5400 seconds)
- Pitch dimensions are configurable (default 100x50)
- Player positions are tracked in 2D coordinates

## 🎯 Use Cases

### Development Testing
- **API Integration**: Test all endpoints
- **Error Handling**: Verify error scenarios
- **State Management**: Check session persistence
- **Performance**: Monitor response times

### QA Testing
- **Functional Testing**: Verify all features work
- **User Experience**: Test flow and feedback
- **Edge Cases**: Test boundary conditions
- **Browser Compatibility**: Test across devices

### Demonstration
- **Stakeholder Demos**: Show working features
- **Technical Presentations**: Explain architecture
- **User Training**: Demonstrate functionality
- **Integration Testing**: Verify system connections

This demo provides a comprehensive testing and demonstration environment for the Fusion FC Game's core functionalities. Use it to validate features, test integrations, and demonstrate capabilities to stakeholders.

## 📸 Demo Screenshots

### Main Demo Interface
![Demo Overview](../assets/screenshots/demo-overview.png)
*Overview of the demo page with both Football Simulation and Multiplayer tabs*

### Football Simulation
![Football Simulation](../assets/screenshots/football-simulation.png)
*Football simulation interface showing game controls and match details*

### Multiplayer Features
![Multiplayer Features](../assets/screenshots/multiplayer-features.png)
*Multiplayer head-to-head testing interface*

### Log Console
![Log Console](../assets/screenshots/log-console.png)
*Real-time log console showing API requests and responses*

### Match Details
![Match Details](../assets/screenshots/match-details.png)
*Match details display with table and JSON views*

### Game Initialization
![Game Initialization](../assets/screenshots/init-game.png)
*Game initialization with session ID and match setup*

### Auto Loop in Action
![Auto Loop](../assets/screenshots/auto-loop.png)
*Auto loop functionality showing rapid game progression*

### Rating Updates
![Rating Updates](../assets/screenshots/rating-updates.png)
*ELO rating updates after match completion*

> **Note**: Screenshots should be captured from the actual demo page running locally or in a deployed environment. The current directory contains placeholder files that should be replaced with actual screenshots.
