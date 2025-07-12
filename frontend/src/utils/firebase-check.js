// Temporary Firebase configuration checker
import { checkFirebaseConfig } from './debug';

export const verifyFirebaseSetup = () => {
  console.log('🔍 Checking Firebase Configuration...');
  const config = checkFirebaseConfig();
  
  // Check project ID specifically
  if (!config.projectId || config.projectId.includes('your_')) {
    console.error(`
❌ Firebase Project ID is not configured!

Please update your .env file with the correct project ID from Firebase Console:
VITE_FIREBASE_PROJECT_ID=your-actual-project-id

You can find this in Firebase Console → Project Settings
    `);
    return false;
  }
  
  console.log('✅ Firebase config looks valid');
  console.log('Project ID:', config.projectId);
  return true;
};