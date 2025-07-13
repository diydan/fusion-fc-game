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

### 2. Required Collections

#### Users Collection
Stores user profile information for all authentication methods.

**Collection:** `users`
**Document ID:** Firebase Auth UID or wallet address (for MetaMask-only users)

**Fields:**
- `email` (string): User's email address
- `displayName` (string): User's display name
- `photoURL` (string): Profile photo URL
- `walletAddress` (string): Linked MetaMask wallet address
- `authMethod` (string): Primary auth method (email, google, metamask)
- `linkedProviders` (object): Map of linked authentication methods
  - `email` (boolean): Whether email/password is linked
  - `google` (boolean): Whether Google is linked
  - `metamask` (boolean): Whether MetaMask is linked
- `createdAt` (timestamp): Account creation date
- `lastLogin` (timestamp): Last login date
- `updatedAt` (timestamp): Last profile update

#### Wallets Collection
Maps MetaMask wallet addresses to Firebase user IDs for multi-auth support.

**Collection:** `wallets`
**Document ID:** Lowercase wallet address (e.g., "0x123...abc")

**Fields:**
- `userId` (string): Firebase Auth UID this wallet is linked to
- `address` (string): Original case wallet address
- `linkedAt` (timestamp): When the wallet was linked
- `lastLogin` (timestamp): Last login with this wallet
- `signature` (string): Latest authentication signature
- `message` (string): Latest signed message

#### Game Data Collection
Stores game-specific data for each user.

**Collection:** `gameData`
**Document ID:** User ID (same as users collection)

**Fields:**
- `team` (object): User's team configuration
- `stats` (object): Game statistics
- `achievements` (array): Unlocked achievements
- `settings` (object): Game-specific settings

#### Teams Collection (Optional)
For team/guild functionality.

**Collection:** `teams`
**Document ID:** Auto-generated team ID

**Fields:**
- `name` (string): Team name
- `members` (array): Array of user IDs (including wallet addresses)
- `owner` (string): Team owner's user ID
- `createdAt` (timestamp): Team creation date

#### Matches Collection
For game match history.

**Collection:** `matches`
**Document ID:** Auto-generated match ID

**Fields:**
- `players` (array): Participating players
- `result` (object): Match results
- `timestamp` (timestamp): Match date/time

### 3. Set Security Rules
1. Go to Firestore Database → Rules
2. Copy the contents from `firestore.rules` in this project
3. Click **Publish**

**Key Security Features:**
- Multi-auth support: Rules check both Firebase UID and linked wallets
- Wallet linking protection: Only users can link wallets to their own accounts
- Cross-auth data access: Users can access their data regardless of login method
- Development override: Currently has a catch-all rule for development (MUST be removed for production)

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
   - (Optional) **Anonymous** for future MetaMask integration

### Configure Authorized Domains
1. Go to Authentication → Settings
2. Add to Authorized domains:
   - `localhost`
   - Your production domain

## 🚀 Deployment Steps

### 1. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 2. Create Composite Indexes (if needed)
The Firebase Console will prompt you to create indexes as needed when queries fail.

Common indexes needed:
- `users` collection: `linkedProviders.metamask` + `createdAt`
- `wallets` collection: `userId` + `linkedAt`

### 3. Storage CORS Configuration
```bash
gsutil cors set cors.json gs://fusion-fc.firebasestorage.app
```

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
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id

# MetaMask Configuration
VITE_DEFAULT_CHAIN_ID=88882
VITE_DEFAULT_NETWORK_NAME=Chiliz Spicy Testnet
VITE_USE_TESTNET=true
```

Get these values from:
1. Firebase Console → Project Settings
2. Scroll down to "Your apps"
3. Copy the config from your web app

## ✅ Production Checklist

- [ ] Remove development override rule in `firestore.rules`
- [ ] Deploy Cloud Function for MetaMask custom tokens
- [ ] Enable App Check for additional security
- [ ] Set up backup policies for Firestore
- [ ] Configure Firebase Performance Monitoring
- [ ] Enable Firebase Analytics
- [ ] Set up error reporting with Crashlytics
- [ ] Update CORS configuration for production domains
- [ ] Test all authentication methods in production
- [ ] Verify security rules work correctly
- [ ] Set up monitoring and alerts