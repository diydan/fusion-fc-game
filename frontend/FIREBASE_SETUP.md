# Firebase Setup Guide

## 🔥 Firestore Database Setup

### 1. Enable Firestore
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click on **Firestore Database** in the left menu
4. Click **Create database**
5. Choose **Start in test mode** for development
6. Select your preferred location (e.g., us-central1)
7. Click **Enable**

### 2. Initialize Collections
After Firestore is enabled, create these collections:
- `users` - User profiles
- `gameData` - Game statistics
- `matches` - Game matches

### 3. Set Security Rules
1. Go to Firestore Database → Rules
2. Copy the contents from `firestore.rules` in this project
3. Click **Publish**

### 4. Enable Storage
1. Go to **Storage** in Firebase Console
2. Click **Get started**
3. Choose **Start in test mode**
4. Select your storage location
5. Click **Done**

## 🔒 Security Rules for Storage

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload their avatar
    match /avatars/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read game assets
    match /game-assets/{allPaths=**} {
      allow read: if true;
      allow write: if false; // Admin only via Firebase Admin SDK
    }
    
    // Allow authenticated users to manage team content
    match /team-content/{teamId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## 🔐 Authentication Setup

### Enable Authentication Providers
1. Go to **Authentication** → **Sign-in method**
2. Enable these providers:
   - **Email/Password**
   - **Google**

### Configure Authorized Domains
1. Go to Authentication → Settings
2. Add to Authorized domains:
   - `localhost`
   - Your production domain

## 🚨 Common Issues

### Firestore 400 Errors
If you see `net::ERR_ABORTED 400` errors:
1. Make sure Firestore is enabled in Console
2. Check your Firebase config in `.env`
3. Verify the project ID is correct
4. Ensure you're using the correct Firebase project

### MetaMask Authentication
Since MetaMask uses custom authentication:
1. Deploy a Cloud Function for custom token generation
2. Or use the temporary localStorage solution (development only)

## 📝 Environment Variables
Create `.env` file with:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

Get these values from:
1. Firebase Console → Project Settings
2. Scroll down to "Your apps"
3. Copy the config from your web app