// Debug utility to check environment variables
export const checkFirebaseConfig = () => {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };
  
  console.log('Firebase Config Check:');
  Object.entries(config).forEach(([key, value]) => {
    if (!value || value.includes('your_')) {
      console.error(`❌ ${key}: Missing or using placeholder value`);
    } else {
      console.log(`✅ ${key}: ${value.substring(0, 10)}...`);
    }
  });
  
  return config;
};