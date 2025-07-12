# Game Asset Storage Rules Implementation

## Overview
This document describes the implementation of Firebase Storage security rules for game assets, including both public and private asset access controls.

## Rules Implemented

### Public Game Assets (`/game/assets/public/`)
```
match /game/assets/public/{all=**} {
  allow read: if true;  // public
}
```
- **Read Access**: Available to everyone (authenticated and unauthenticated users)
- **Write Access**: Denied to all users (no write permissions)
- **Use Case**: Public game assets like logos, backgrounds, UI elements that anyone can access

### Private Game Assets (`/game/assets/`)
```
match /game/assets/{all=**} {
  allow read: if isSignedIn();
}
```
- **Read Access**: Only available to authenticated users
- **Write Access**: Denied to all users (no write permissions)
- **Use Case**: Premium content, user-specific assets, or any content requiring authentication

## Security Features

### 1. No Write Permissions
- Both public and private asset rules explicitly exclude write permissions
- This prevents unauthorized uploads and modifications
- Assets can only be managed through admin tools or server-side operations

### 2. Authentication-Based Access Control
- Public assets: Available to everyone
- Private assets: Require user authentication
- Uses the `isSignedIn()` helper function to check authentication status

### 3. Path-Based Separation
- Clear separation between public and private assets
- Public assets are stored under `/game/assets/public/`
- Private assets are stored under `/game/assets/` (excluding the public subfolder)

## Helper Functions

### `isSignedIn()`
```javascript
function isSignedIn() {
  return request.auth != null;
}
```
Checks if the requesting user is authenticated.

## Test Coverage

### Test File: `tests/storage-rules-game-assets.test.js`

#### Public Asset Tests
- ✅ Anonymous users can read public assets
- ✅ Authenticated users can read public assets
- ✅ Nested public assets are accessible
- ✅ Deeply nested public assets are accessible
- ❌ No users can write to public assets (including admin)

#### Private Asset Tests
- ❌ Anonymous users cannot read private assets
- ✅ Authenticated users can read private assets
- ✅ Different authenticated users can access private assets
- ✅ Nested private assets are accessible
- ❌ No users can write to private assets (including admin)

#### Security & Edge Case Tests
- ❌ Path traversal attempts are blocked
- ❌ Access to non-game asset paths is denied
- ❌ Access to similar but different paths is denied
- ✅ Files with special characters are handled correctly
- ✅ Rule precedence works correctly (public overrides private)

#### Authentication State Tests
- ✅ Different authenticated users maintain access
- ❌ Unauthenticated access to private assets is denied

## Running Tests

### Prerequisites
1. Firebase CLI installed
2. Node.js dependencies installed in `tests/` directory
3. Firebase Storage emulator configured

### Test Execution
```bash
# Method 1: Using the test runner script
cd tests
npm run test:storage

# Method 2: Using the dedicated script
cd tests
./run-game-asset-tests.sh

# Method 3: Manual emulator + test
firebase emulators:start --only storage &
cd tests && npm test storage-rules-game-assets.test.js
```

## Configuration

### Firebase Configuration (`firebase.json`)
Storage emulator is configured on port 9199:
```json
{
  "emulators": {
    "storage": {
      "port": 9199
    }
  }
}
```

### Storage Rules (`storage.rules`)
The rules are implemented in the main storage rules file alongside existing avatar rules.

## Security Considerations

1. **Read-Only Access**: All game assets are read-only to prevent unauthorized modifications
2. **Authentication Requirement**: Private assets require authentication to prevent unauthorized access
3. **Path Validation**: Rules prevent path traversal and access to unintended locations
4. **Granular Control**: Clear separation between public and private content

## Usage Examples

### Accessing Public Assets
```javascript
// Anyone can access these
const logoRef = ref(storage, 'game/assets/public/logo.png');
const backgroundRef = ref(storage, 'game/assets/public/backgrounds/forest.jpg');
const iconRef = ref(storage, 'game/assets/public/ui/icons/sword.png');
```

### Accessing Private Assets
```javascript
// Requires authentication
const premiumSkinRef = ref(storage, 'game/assets/premium/skins/legendary-armor.png');
const userContentRef = ref(storage, 'game/assets/user-content/custom-maps/player123.json');
```

## Deployment

The rules are automatically deployed when using:
```bash
firebase deploy --only storage
```

Or for testing:
```bash
firebase emulators:start --only storage
```
