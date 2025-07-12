# Firebase Storage Rules Tests

This directory contains comprehensive tests for Firebase Storage security rules, specifically focusing on avatar upload/download functionality.

## Avatar Rules Implementation

The avatar rules are implemented in `/storage.rules` with the following security controls:

```javascript
match /avatars/{userId}/{file} {
  allow read, write: if isAvatarOwner(path) && validImage() && validSize(5 * 1024 * 1024);
}
```

### Security Features

- **Owner-only access**: Only the authenticated user can upload/read their own avatars
- **Image validation**: Only image files (MIME type `image/*`) are allowed
- **Size limits**: Maximum file size of 5MB
- **Path validation**: Prevents unauthorized access to other users' folders

## Test Coverage

### ✅ Successful Operations
- Owner can upload valid avatar images (JPEG, PNG, GIF, etc.)
- Owner can read their own avatar files
- Files up to 5MB are accepted
- Various image formats are supported

### ❌ Blocked Operations
- Unauthenticated users cannot upload or read avatars
- Users cannot access other users' avatar folders
- Files larger than 5MB are rejected
- Non-image files are rejected (PDF, text, JSON, etc.)
- Malicious files with fake image extensions are blocked

### 🔐 Security Tests
- Path traversal attempts are blocked
- Empty files are rejected
- Files without MIME types are rejected
- Special characters in paths are handled securely

## Running the Tests

### Prerequisites

1. **Firebase CLI**: Install globally if not already installed
   ```bash
   npm install -g firebase-tools
   ```

2. **Dependencies**: Install test dependencies
   ```bash
   cd tests
   npm install
   ```

### Test Execution Options

#### Option 1: Automated Test Runner (Recommended)
```bash
cd tests
node run-tests.js
```
This will automatically:
- Start Firebase Storage emulator
- Run all tests
- Stop the emulator
- Provide detailed output

#### Option 2: Manual Emulator + Jest
```bash
# Terminal 1: Start emulator
firebase emulators:start --only storage --project fusion-fc-test

# Terminal 2: Run tests
cd tests
npm test
```

#### Option 3: Specific Test Files
```bash
cd tests
npm run test:avatar  # Run only avatar tests
```

#### Option 4: Watch Mode
```bash
cd tests
npm run test:watch
```

## Test Structure

### Test Files
- `storage-rules-avatar.test.js` - Comprehensive avatar rules tests
- `jest.setup.js` - Jest configuration and setup
- `run-tests.js` - Automated test runner with emulator management
- `package.json` - Test dependencies and scripts

### Test Categories

1. **Avatar Owner Upload/Read Tests**
   - Valid image uploads
   - Owner reading own avatars
   - Different image formats (JPEG, PNG, GIF, etc.)
   - Maximum file size validation

2. **Unauthorized Access Tests**
   - Unauthenticated user attempts
   - Cross-user access attempts
   - Wrong path access attempts

3. **File Validation Tests**
   - Oversized file rejection
   - Non-image file rejection
   - Invalid MIME type rejection
   - Malicious file detection

4. **Edge Cases and Security Tests**
   - Path traversal attempts
   - Empty file handling
   - Special character handling
   - Nested path support

5. **MIME Type Validation Tests**
   - Valid image types acceptance
   - Invalid file types rejection

## Test Output

The tests provide clear output with:
- ✅ For successful operations that should be allowed
- ❌ For blocked operations that should be denied
- Detailed error messages for debugging
- Coverage reports when using `--coverage` flag

## Configuration

### Firebase Project
- Test project ID: `fusion-fc-test`
- Emulator port: 9199 (default)
- Rules file: `../storage.rules`

### Jest Configuration
- Environment: Node.js
- Timeout: 30 seconds per test
- Setup file: `jest.setup.js`

## Debugging

If tests fail:

1. **Check Firebase CLI version**: `firebase --version`
2. **Verify emulator is running**: Check port 9199
3. **Review rules syntax**: Ensure no syntax errors in `storage.rules`
4. **Check test output**: Look for specific error messages
5. **Run individual tests**: Use `npm run test:avatar` for focused debugging

## Adding New Tests

To add new test cases:

1. Open `storage-rules-avatar.test.js`
2. Add tests to appropriate `describe` blocks
3. Use `assertSucceeds()` for operations that should be allowed
4. Use `assertFails()` for operations that should be denied
5. Follow the existing naming convention (✅/❌ prefixes)

## CI/CD Integration

For continuous integration, use:
```bash
# Install dependencies
npm install

# Run tests with coverage
npm run test:coverage

# Or use the automated runner
node run-tests.js
```

The tests are designed to be deterministic and can run in any environment with Firebase CLI and Node.js installed.
