#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Test endpoints
const endpoints = {
  initGame: 'https://initgame-6unsift5pq-uc.a.run.app',
  playIteration: 'https://playiteration-6unsift5pq-uc.a.run.app',
  startSecondHalf: 'https://startsecondhalf-6unsift5pq-uc.a.run.app',
  getGameState: 'https://getgamestate-6unsift5pq-uc.a.run.app',
  logoGenerator: 'https://logogenerator-6unsift5pq-uc.a.run.app'
};

// Test data
const testData = {
  team1: {
    name: "Team A",
    players: [
      {"name": "Player 1", "position": "GK", "rating": 80},
      {"name": "Player 2", "position": "DEF", "rating": 75},
      {"name": "Player 3", "position": "MID", "rating": 78},
      {"name": "Player 4", "position": "FWD", "rating": 82}
    ]
  },
  team2: {
    name: "Team B",
    players: [
      {"name": "Player 5", "position": "GK", "rating": 78},
      {"name": "Player 6", "position": "DEF", "rating": 76},
      {"name": "Player 7", "position": "MID", "rating": 79},
      {"name": "Player 8", "position": "FWD", "rating": 81}
    ]
  },
  pitchWidth: 120,
  pitchHeight: 90
};

// Make HTTP request
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js Test Client'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test functions
async function testEndpoints() {
  console.log('=== Testing Deployed Cloud Functions ===\n');
  
  // Test 1: Init Game
  console.log('1. Testing initGame endpoint...');
  try {
    const response = await makeRequest(endpoints.initGame, 'POST', testData);
    console.log(`Status: ${response.statusCode}`);
    console.log(`Response: ${response.body.substring(0, 200)}...`);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      if (data.sessionId) {
        console.log('✅ PASS: initGame returns sessionId');
        global.sessionId = data.sessionId;
      } else {
        console.log('❌ FAIL: initGame missing sessionId');
      }
    } else {
      console.log('❌ FAIL: initGame returned non-200 status');
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Play Iteration (if we have sessionId)
  if (global.sessionId) {
    console.log('2. Testing playIteration endpoint...');
    try {
      const response = await makeRequest(endpoints.playIteration, 'POST', {
        sessionId: global.sessionId
      });
      console.log(`Status: ${response.statusCode}`);
      console.log(`Response: ${response.body.substring(0, 200)}...`);
      
      if (response.statusCode === 200) {
        const data = JSON.parse(response.body);
        if (data.matchDetails) {
          console.log('✅ PASS: playIteration advances game state');
          global.matchDetails = data.matchDetails;
        } else {
          console.log('❌ FAIL: playIteration missing matchDetails');
        }
      } else {
        console.log('❌ FAIL: playIteration returned non-200 status');
      }
    } catch (error) {
      console.log('❌ ERROR:', error.message);
    }
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 3: Get Game State
  if (global.sessionId) {
    console.log('3. Testing getGameState endpoint...');
    try {
      const response = await makeRequest(endpoints.getGameState + `?sessionId=${global.sessionId}`, 'GET');
      console.log(`Status: ${response.statusCode}`);
      console.log(`Response: ${response.body.substring(0, 200)}...`);
      
      if (response.statusCode === 200) {
        const data = JSON.parse(response.body);
        if (data.matchDetails) {
          console.log('✅ PASS: getGameState returns current state');
        } else {
          console.log('❌ FAIL: getGameState missing matchDetails');
        }
      } else {
        console.log('❌ FAIL: getGameState returned non-200 status');
      }
    } catch (error) {
      console.log('❌ ERROR:', error.message);
    }
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 4: Start Second Half
  if (global.sessionId) {
    console.log('4. Testing startSecondHalf endpoint...');
    try {
      const response = await makeRequest(endpoints.startSecondHalf, 'POST', {
        sessionId: global.sessionId
      });
      console.log(`Status: ${response.statusCode}`);
      console.log(`Response: ${response.body.substring(0, 200)}...`);
      
      if (response.statusCode === 200) {
        const data = JSON.parse(response.body);
        if (data.matchDetails && data.matchDetails.half === 2) {
          console.log('✅ PASS: startSecondHalf flips to second half');
        } else {
          console.log('❌ FAIL: startSecondHalf did not flip period');
        }
      } else {
        console.log('❌ FAIL: startSecondHalf returned non-200 status');
      }
    } catch (error) {
      console.log('❌ ERROR:', error.message);
    }
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  console.log('=== Test Summary ===');
  console.log('Note: Multiplayer functions (validateGameState, handleDisconnect, completeMatch)');
  console.log('require Firebase authentication and cannot be tested directly with curl/HTTP requests.');
  console.log('These would need to be tested through the frontend application or with proper auth tokens.');
}

// Run tests
testEndpoints().catch(console.error);
