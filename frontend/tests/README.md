# 🔥 Firebase Security Rules Test Suite

Comprehensive automated testing for Firebase Security Rules using `@firebase/rules-unit-testing`.

## 📋 Overview

This test suite provides complete coverage for both **Firestore** and **Storage** security rules, ensuring that all positive and negative scenarios are thoroughly tested. The tests run automatically in CI/CD pipelines and can be executed locally during development.

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- Firebase CLI (`npm install -g firebase-tools`)
- Test dependencies (`npm install` in this directory)

### Running Tests

```bash
# Run all tests
npm test

# Run specific test files
npm run test:firestore    # Firestore rules only
npm run test:storage      # Storage rules only

# Run with coverage
npm run test:coverage

# Use the enhanced test runner
node run-all-tests.js                    # All tests
node run-all-tests.js --coverage         # With coverage
node run-all-tests.js firestore-rules.test.js  # Specific file
```

### Using Firebase Emulator

```bash
# Run tests with emulator (recommended)
npm run test:emulator

# For CI/CD
npm run test:ci
```

## 📁 Test Structure

```
tests/
├── firestore-rules.test.js      # Firestore security rules tests
├── storage-rules.test.js        # Storage security rules tests
├── storage-rules-avatar.test.js # Legacy avatar tests
├── storage-rules-game-assets.test.js # Legacy game assets tests
├── jest.setup.js               # Jest configuration and helpers
├── run-all-tests.js            # Enhanced test runner
├── run-tests.js                # Legacy test runner
├── package.json                # Test dependencies
└── README.md                   # This file
```

## 🔒 Security Rules Coverage

### Firestore Rules Tested

#### ✅ Users Collection
- **Positive Cases:**
  - Users can read/write their own profiles
  - MetaMask users can create profiles with wallet addresses
  - Users with linked wallets can access profiles
  - Profile creation and updates

- **Negative Cases:**
  - Unauthenticated access denied
  - Cross-user access prevention
  - Profile deletion protection
  - Unauthorized profile creation

#### ✅ Wallets Collection
- **Positive Cases:**
  - Authenticated users can read wallet documents
  - Users can link wallets to their accounts
  - MetaMask wallet entry creation
  - Wallet document updates by linked users

- **Negative Cases:**
  - Unauthenticated access denied
  - Cross-account wallet linking prevention
  - Unauthorized wallet updates
  - Wallet deletion protection

#### ✅ Game Data Collection
- **Positive Cases:**
  - Users can read/write their own game data
  - Linked wallet access to game data

- **Negative Cases:**
  - Unauthenticated access denied
  - Cross-user game data access prevention

#### ✅ Matches Collection
- **Positive Cases:**
  - Authenticated users can read matches
  - Players can create matches they participate in
  - Participants can update match status
  - Wallet users in player lists can update matches

- **Negative Cases:**
  - Unauthenticated access denied
  - Non-participants cannot create/update matches
  - Match deletion prevention

#### ✅ Teams Collection
- **Positive Cases:**
  - Authenticated users can read teams
  - Users can create teams as managers
  - Team managers can update/delete teams

- **Negative Cases:**
  - Unauthenticated access denied
  - Non-managers cannot modify teams
  - Manager privilege escalation prevention

#### ✅ Team Members Collection
- **Positive Cases:**
  - Team managers can create/update/delete memberships
  - Users can leave teams (delete their own membership)
  - Team members can read membership documents

- **Negative Cases:**
  - Non-managers cannot create memberships
  - Critical field modification prevention
  - Format validation enforcement

#### ✅ Team Invitations Collection
- **Positive Cases:**
  - Team managers can create/delete invitations
  - Invited users can read and respond to invitations
  - Invitation acceptance/decline functionality

- **Negative Cases:**
  - Non-managers cannot create invitations
  - Unauthorized invitation access prevention
  - Non-invited users cannot modify invitations

### Storage Rules Tested

#### ✅ Avatar Storage
- **Positive Cases:**
  - Users can upload/read/update their own avatars
  - Multiple image formats supported (PNG, JPEG, GIF)
  - Size limit compliance (≤5MB)

- **Negative Cases:**
  - Unauthenticated access denied
  - Cross-user avatar access prevention
  - Size limit enforcement (>5MB rejection)
  - File type validation (non-images rejected)
  - Executable file prevention

#### ✅ Game Assets Storage
- **Public Assets:**
  - Anyone can read public game assets
  - Write access denied to public assets

- **Private Assets:**
  - Authenticated users can read private assets
  - Unauthenticated access denied
  - Write access denied to private assets

#### ✅ Team Content Storage
- **Positive Cases:**
  - Team members can upload/read team content
  - Image uploads (≤10MB) and JSON files (≤1MB)
  - Subdirectory access support
  - Firestore-based team membership validation

- **Negative Cases:**
  - Non-team member access prevention
  - Size limit enforcement
  - File type validation
  - Team membership enforcement via Firestore

## 🧪 Test Scenarios

### Positive Test Cases
Each rule is tested with valid scenarios to ensure legitimate access works:
- Proper authentication
- Correct ownership/membership
- Valid file types and sizes
- Appropriate permissions

### Negative Test Cases
Each rule is tested with invalid scenarios to ensure security:
- Unauthenticated access attempts
- Cross-user access attempts
- Invalid file types/sizes
- Permission escalation attempts
- Data tampering prevention

### Edge Cases
- Exact size limits
- Boundary conditions
- Complex permission scenarios
- Wallet linking edge cases

## 🔧 Configuration

### Environment Variables
```bash
# Firebase Emulator Hosts (automatically set)
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099

# Test Configuration
FIREBASE_PROJECT_ID=fusion-fc-test
NODE_ENV=test
```

### Jest Configuration
```javascript
{
  "testEnvironment": "node",
  "setupFilesAfterEnv": ["<rootDir>/jest.setup.js"],
  "testTimeout": 60000
}
```

## 🏗️ CI/CD Integration

### GitHub Actions
The test suite is integrated with GitHub Actions and runs automatically on:
- Push to `main` or `develop` branches
- Pull requests modifying rules files
- Changes to test files

### Workflow Features
- **Rules Validation:** Syntax validation of rules files
- **Comprehensive Testing:** All test scenarios with coverage
- **Performance Monitoring:** Benchmark execution times
- **Security Analysis:** Impact assessment for rules changes
- **Coverage Reports:** Automated coverage reporting

### Required Checks
PRs modifying security rules must pass:
- ✅ All security rules tests
- ✅ Rules syntax validation
- ✅ Coverage requirements
- ✅ Performance benchmarks

## 📊 Coverage Requirements

The test suite maintains high coverage standards:
- **Functions:** >95% coverage
- **Branches:** >90% coverage  
- **Lines:** >95% coverage
- **Statements:** >95% coverage

## 🔍 Debugging Tests

### Local Development
```bash
# Run tests in watch mode
npm run test:watch

# Run specific test with verbose output
npx jest firestore-rules.test.js --verbose

# Debug with Node.js debugger
node --inspect-brk run-all-tests.js
```

### Common Issues
1. **Emulator Not Starting:** Check Firebase CLI installation
2. **Port Conflicts:** Ensure emulator ports are available
3. **Rules Syntax Errors:** Validate rules files before testing
4. **Timeout Issues:** Increase Jest timeout for slow operations

### Test Data
Test data is automatically exported/imported during emulator runs:
```
tests/test-data/
├── firestore_export/
├── storage_export/
└── auth_export/
```

## 📝 Adding New Tests

### For New Rules
1. Add rule to `firestore.rules` or `storage.rules`
2. Create corresponding test cases in appropriate test file
3. Include both positive and negative scenarios
4. Test edge cases and security boundaries
5. Update this README with new coverage

### Test Template
```javascript
describe('New Feature Rules', () => {
  describe('Positive Cases', () => {
    test('authorized access works', async () => {
      await assertSucceeds(/* test operation */);
    });
  });

  describe('Negative Cases', () => {
    test('unauthorized access fails', async () => {
      await assertFails(/* test operation */);
    });
  });
});
```

## 🤝 Contributing

1. **Write Tests First:** Add tests before modifying rules
2. **Test Coverage:** Ensure new code has >95% coverage
3. **Security Focus:** Always test negative scenarios
4. **Documentation:** Update README for new features
5. **CI Validation:** Ensure all CI checks pass

## 📚 Resources

- [Firebase Rules Unit Testing](https://firebase.google.com/docs/rules/unit-tests)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Storage Security Rules](https://firebase.google.com/docs/storage/security/get-started)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

## 🐛 Troubleshooting

### Emulator Issues
```bash
# Kill existing emulator processes
pkill -f firebase
firebase emulators:kill

# Clear emulator data
rm -rf tests/test-data

# Restart emulators
firebase emulators:start
```

### Test Failures
```bash
# Run single test for debugging
npx jest --testNamePattern="specific test name"

# Clear Jest cache
npx jest --clearCache

# Verbose error output
DEBUG=* npm test
```

---

🔥 **Happy Testing!** Ensure your Firebase Security Rules are bulletproof with comprehensive automated testing.
