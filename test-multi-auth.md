# Multi-Authentication Test Guide

## Features Implemented

### 1. Account Linking in Settings Page
- Users can link multiple authentication methods to a single account
- Supported methods: Email/Password, Google, MetaMask
- Each method can be added independently

### 2. Smart Login Detection
- MetaMask login checks if wallet is linked to existing account
- If linked, logs in with the linked Firebase user
- If not linked, creates standalone MetaMask session

### 3. Password Addition for MetaMask Users
- MetaMask-only users can add email/password
- This allows login with either MetaMask or email/password
- Account data is preserved across auth methods

## Testing Steps

### Test 1: Link Email to MetaMask Account
1. Login with MetaMask
2. Go to Settings page (/settings)
3. Click "Add" next to Email & Password
4. Enter email and password
5. Verify email auth is added

### Test 2: Link MetaMask to Email Account
1. Create account with email/password
2. Go to Settings page
3. Click "Connect" next to MetaMask
4. Sign message in MetaMask
5. Verify wallet is linked

### Test 3: Multi-Method Login
1. After linking accounts, logout
2. Try logging in with MetaMask - should access same account
3. Logout and try email/password - should access same account
4. Both methods should show same user data

### Test 4: Link Google Account
1. Login with any method
2. Go to Settings page
3. Click "Link" next to Google Account
4. Complete Google auth flow
5. Verify Google is linked

## Database Structure

### Users Collection
```json
{
  "uid": "firebase-user-id",
  "email": "user@example.com",
  "displayName": "User Name",
  "walletAddress": "0x123...",
  "linkedProviders": {
    "email": true,
    "google": true,
    "metamask": true
  }
}
```

### Wallets Collection
```json
{
  "address": "0x123...",
  "userId": "firebase-user-id",
  "linkedAt": "2024-01-01T00:00:00Z",
  "signature": "0xabc...",
  "message": "Link wallet to account..."
}
```

## Current Limitations (Development Mode)

1. MetaMask uses localStorage for session persistence
2. No custom Firebase tokens for MetaMask (requires Cloud Functions)
3. Email verification not enforced
4. No 2FA support yet

## Production Requirements

1. Implement Cloud Function for MetaMask custom tokens
2. Add email verification enforcement
3. Add 2FA support
4. Add account recovery options
5. Add unlink functionality in Settings