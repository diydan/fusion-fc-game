# Firebase Setup Guide

## Firestore Collections Required

### 1. Users Collection
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

### 2. Wallets Collection
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

### 3. Game Data Collection
Stores game-specific data for each user.

**Collection:** `gameData`
**Document ID:** User ID (same as users collection)

**Fields:**
- `team` (object): User's team configuration
- `stats` (object): Game statistics
- `achievements` (array): Unlocked achievements
- `settings` (object): Game-specific settings

### 4. Teams Collection (Optional)
For team/guild functionality.

**Collection:** `teams`
**Document ID:** Auto-generated team ID

**Fields:**
- `name` (string): Team name
- `members` (array): Array of user IDs (including wallet addresses)
- `owner` (string): Team owner's user ID
- `createdAt` (timestamp): Team creation date

## Firestore Security Rules

The `firestore.rules` file includes:

1. **Multi-auth support**: Rules check both Firebase UID and linked wallets
2. **Wallet linking protection**: Only users can link wallets to their own accounts
3. **Cross-auth data access**: Users can access their data regardless of login method
4. **Development override**: Currently has a catch-all rule for development (MUST be removed for production)

## Deployment Steps

### 1. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 2. Create Composite Indexes (if needed)
The Firebase Console will prompt you to create indexes as needed when queries fail.

Common indexes needed:
- `users` collection: `linkedProviders.metamask` + `createdAt`
- `wallets` collection: `userId` + `linkedAt`

### 3. Enable Authentication Methods
In Firebase Console > Authentication > Sign-in method:
1. Enable Email/Password
2. Enable Google
3. (Optional) Enable Anonymous for future MetaMask integration

### 4. Storage CORS Configuration
```bash
gsutil cors set cors.json gs://fusion-fc.firebasestorage.app
```

## Production Checklist

- [ ] Remove development override rule in `firestore.rules`
- [ ] Deploy Cloud Function for MetaMask custom tokens
- [ ] Enable App Check for additional security
- [ ] Set up backup policies for Firestore
- [ ] Configure Firebase Performance Monitoring
- [ ] Enable Firebase Analytics
- [ ] Set up error reporting with Crashlytics

## Environment Variables

Ensure `.env` contains:
```
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