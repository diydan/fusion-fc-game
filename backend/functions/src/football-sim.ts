import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
const footballEngine = require('footballsimulationengine');

let gameSessions = new Map();

export const initGame = onRequest(
  { 
    cors: true,
    maxInstances: 100
  },
  async (request, response) => {
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
      logger.error('Error initiating game:', error);
      response.status(500).send({ error: 'Failed to initiate game' });
    }
  }
);

export const playIteration = onRequest(
  { 
    cors: true,
    maxInstances: 100
  },
  async (request, response) => {
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
        matchDetails: updatedMatch
      });
    } catch (error) {
      logger.error('Error playing iteration:', error);
      response.status(500).send({ error: 'Failed to play iteration' });
    }
  }
);

export const startSecondHalf = onRequest(
  { 
    cors: true,
    maxInstances: 100
  },
  async (request, response) => {
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
        matchDetails: secondHalfMatch
      });
    } catch (error) {
      logger.error('Error starting second half:', error);
      response.status(500).send({ error: 'Failed to start second half' });
    }
  }
);

export const getGameState = onRequest(
  { 
    cors: true,
    maxInstances: 100
  },
  async (request, response) => {
    try {
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
        matchDetails
      });
    } catch (error) {
      logger.error('Error getting game state:', error);
      response.status(500).send({ error: 'Failed to get game state' });
    }
  }
);