import * as functions from 'firebase-functions';
import * as cors from 'cors';
const footballEngine = require('footballsimulationengine');

const corsHandler = cors({ origin: true });

let gameSessions = new Map();

export const initGame = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        response.status(405).send({ error: 'Method not allowed' });
        return;
      }

      const { team1, team2, pitchWidth, pitchHeight } = request.body;

      if (!team1 || !team2 || !pitchWidth || !pitchHeight) {
        response.status(400).send({ error: 'Missing required parameters' });
        return;
      }

      const matchSetup = await footballEngine.initiateGame(team1, team2, { pitchWidth, pitchHeight });
      
      const sessionId = Date.now().toString();
      gameSessions.set(sessionId, matchSetup);
      
      setTimeout(() => {
        gameSessions.delete(sessionId);
      }, 3600000);

      response.status(200).send({
        sessionId,
        matchSetup
      });
    } catch (error) {
      console.error('Error initiating game:', error);
      response.status(500).send({ error: 'Failed to initiate game' });
    }
  });
});

export const playIteration = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        response.status(405).send({ error: 'Method not allowed' });
        return;
      }

      const { sessionId } = request.body;

      if (!sessionId) {
        response.status(400).send({ error: 'Missing sessionId' });
        return;
      }

      const matchDetails = gameSessions.get(sessionId);
      
      if (!matchDetails) {
        response.status(404).send({ error: 'Game session not found' });
        return;
      }

      const updatedMatch = await footballEngine.playIteration(matchDetails);
      gameSessions.set(sessionId, updatedMatch);

      response.status(200).send({
        sessionId,
        matchDetails: updatedMatch
      });
    } catch (error) {
      console.error('Error playing iteration:', error);
      response.status(500).send({ error: 'Failed to play iteration' });
    }
  });
});

export const startSecondHalf = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        response.status(405).send({ error: 'Method not allowed' });
        return;
      }

      const { sessionId } = request.body;

      if (!sessionId) {
        response.status(400).send({ error: 'Missing sessionId' });
        return;
      }

      const matchDetails = gameSessions.get(sessionId);
      
      if (!matchDetails) {
        response.status(404).send({ error: 'Game session not found' });
        return;
      }

      const secondHalfMatch = await footballEngine.startSecondHalf(matchDetails);
      gameSessions.set(sessionId, secondHalfMatch);

      response.status(200).send({
        sessionId,
        matchDetails: secondHalfMatch
      });
    } catch (error) {
      console.error('Error starting second half:', error);
      response.status(500).send({ error: 'Failed to start second half' });
    }
  });
});

export const getGameState = functions.https.onRequest((request, response) => {
  corsHandler(request, response, () => {
    try {
      if (request.method !== 'GET') {
        response.status(405).send({ error: 'Method not allowed' });
        return;
      }

      const sessionId = request.query.sessionId as string;

      if (!sessionId) {
        response.status(400).send({ error: 'Missing sessionId' });
        return;
      }

      const matchDetails = gameSessions.get(sessionId);
      
      if (!matchDetails) {
        response.status(404).send({ error: 'Game session not found' });
        return;
      }

      response.status(200).send({
        sessionId,
        matchDetails
      });
    } catch (error) {
      console.error('Error getting game state:', error);
      response.status(500).send({ error: 'Failed to get game state' });
    }
  });
});