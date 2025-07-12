// Jest setup for Firebase Storage rules testing
const { initializeApp } = require('firebase/app');

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

// Global test timeout
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
