// Jest setup for Firebase Security Rules testing (Firestore and Storage)
const { initializeApp } = require('firebase/app');
const path = require('path');

// Mock Firebase app for testing
const mockFirebaseConfig = {
  apiKey: 'test-api-key',
  authDomain: 'test-project.firebaseapp.com',
  projectId: 'fusion-fc-test',
  storageBucket: 'fusion-fc-test.appspot.com',
  messagingSenderId: '123456789',
  appId: 'test-app-id'
};

// Initialize Firebase app for testing
initializeApp(mockFirebaseConfig);

// Set environment variables for Firebase emulators
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

// Global test timeout for async operations
jest.setTimeout(60000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test helper functions
global.testHelpers = {
  // Helper to create mock file metadata
  createMockFileMetadata: (contentType, size) => ({
    size: size || 1000,
    contentType: contentType || 'application/octet-stream',
    customMetadata: {},
    timeCreated: new Date().toISOString(),
    updated: new Date().toISOString()
  }),
  
  // Common test data
  TEST_PROJECT_ID: 'fusion-fc-test',
  USER_ID: 'test-user-123',
  OTHER_USER_ID: 'other-user-456',
  WALLET_ADDRESS: '0x742d35Cc6634C0532925a3b8D0b12345678901234',
  TEAM_ID: 'team-123',
  MATCH_ID: 'match-456'
};
