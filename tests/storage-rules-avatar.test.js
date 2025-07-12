const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { setDoc, doc } = require('firebase/firestore');
const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');

// Test configuration
const PROJECT_ID = 'fusion-fc-test';
const RULES_FILE = './storage.rules';

describe('Avatar Storage Rules', () => {
  let testEnv;
  let authenticatedContext;
  let unauthenticatedContext;
  let otherUserContext;
  
  const USER_ID = 'test-user-123';
  const OTHER_USER_ID = 'other-user-456';
  
  beforeAll(async () => {
    // Initialize test environment
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      storage: {
        rules: require('fs').readFileSync(RULES_FILE, 'utf8'),
      },
    });
    
    authenticatedContext = testEnv.authenticatedContext(USER_ID);
    unauthenticatedContext = testEnv.unauthenticatedContext();
    otherUserContext = testEnv.authenticatedContext(OTHER_USER_ID);
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearStorage();
  });

  describe('Avatar Owner Upload/Read Tests', () => {
    test('✓ Should allow owner to upload valid avatar image', async () => {
      const storage = authenticatedContext.storage();
      const avatarRef = ref(storage, `avatars/${USER_ID}/profile.jpg`);
      
      // Create a small valid image blob
      const validImageBlob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
      
      await assertSucceeds(
        uploadBytes(avatarRef, validImageBlob)
      );
    });

    test('✓ Should allow owner to read their own avatar', async () => {
      const storage = authenticatedContext.storage();
      const avatarRef = ref(storage, `avatars/${USER_ID}/profile.jpg`);
      
      // First upload an avatar
      const validImageBlob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
      await uploadBytes(avatarRef, validImageBlob);
      
      // Then try to read it
      await assertSucceeds(
        getDownloadURL(avatarRef)
      );
    });

    test('✓ Should allow owner to upload PNG format', async () => {
      const storage = authenticatedContext.storage();
      const avatarRef = ref(storage, `avatars/${USER_ID}/profile.png`);
      
      const validImageBlob = new Blob(['fake-png-data'], { type: 'image/png' });
      
      await assertSucceeds(
        uploadBytes(avatarRef, validImageBlob)
      );
    });

    test('✓ Should allow owner to upload GIF format', async () => {
      const storage = authenticatedContext.storage();
      const avatarRef = ref(storage, `avatars/${USER_ID}/profile.gif`);
      
      const validImageBlob = new Blob(['fake-gif-data'], { type: 'image/gif' });
      
      await assertSucceeds(
        uploadBytes(avatarRef, validImageBlob)
      );
    });

    test('✓ Should allow upload of exactly 5MB file', async () => {
      const storage = authenticatedContext.storage();
      const avatarRef = ref(storage, `avatars/${USER_ID}/large-avatar.jpg`);
      
      // Create a blob that's exactly 5MB
      const fiveMBData = new Array(5 * 1024 * 1024).fill('a').join('');
      const exactSizeBlob = new Blob([fiveMBData], { type: 'image/jpeg' });
      
      await assertSucceeds(
        uploadBytes(avatarRef, exactSizeBlob)
      );
    });
  });

  describe('Unauthorized Access Tests', () => {
    test('✗ Should deny unauthenticated user upload', async () => {
      const storage = unauthenticatedContext.storage();
      const avatarRef = ref(storage, `avatars/${USER_ID}/profile.jpg`);
      
      const validImageBlob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
      
      await assertFails(
        uploadBytes(avatarRef, validImageBlob)
      );
    });

    test('✗ Should deny unauthenticated user read', async () => {
      const storage = unauthenticatedContext.storage();
      const avatarRef = ref(storage, `avatars/${USER_ID}/profile.jpg`);
      
      await assertFails(
        getDownloadURL(avatarRef)
      );
    });

    test('✗ Should deny other user upload to different user folder', async () => {
      const storage = otherUserContext.storage();
      const avatarRef = ref(storage, `avatars/${USER_ID}/profile.jpg`);
      
      const validImageBlob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
      
      await assertFails(
        uploadBytes(avatarRef, validImageBlob)
      );
    });

    test('✗ Should deny other user read from different user folder', async () => {
      const storage = otherUserContext.storage();
      const avatarRef = ref(storage, `avatars/${USER_ID}/profile.jpg`);
      
      await assertFails(
        getDownloadURL(avatarRef)
      );
    });

    test('✗ Should deny authenticated user access to wrong userId path', async () => {
      const storage = authenticatedContext.storage();
      const avatarRef = ref(storage, `avatars/${OTHER_USER_ID}/profile.jpg`);
      
      const validImageBlob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
      
      await assertFails(
        uploadBytes(avatarRef, validImageBlob)
      );
    });
  });

  describe('File Validation Tests', () => {
    test('✗ Should deny oversized file (over 5MB)', async () => {
      const storage = authenticatedContext.storage();
      const avatarRef = ref(storage, `avatars/${USER_ID}/too-large.jpg`);
      
      // Create a blob that's over 5MB
      const oversizedData = new Array(6 * 1024 * 1024).fill('a').join('');
      const oversizedBlob = new Blob([oversizedData], { type: 'image/jpeg' });
      
      await assertFails(
        uploadBytes(avatarRef, oversizedBlob)
      );
    });

    test('✗ Should deny non-image file (text file)', async () => {
      const storage = authenticatedContext.storage();
      const avatarRef = ref(storage, `avatars/${USER_ID}/not-image.txt`);
      
      const textBlob = new Blob(['This is not an image'], { type: 'text/plain' });
      
      await assertFails(
        uploadBytes(avatarRef, textBlob)
      );
    });

    test('✗ Should deny non-image file (PDF)', async () => {
      const storage = authenticatedContext.storage();
      const avatarRef = ref(storage, `avatars/${USER_ID}/document.pdf`);
      
      const pdfBlob = new Blob(['fake-pdf-data'], { type: 'application/pdf' });
      
      await assertFails(
        uploadBytes(avatarRef, pdfBlob)
      );
    });

    test('✗ Should deny non-image file (JSON)', async () => {
      const storage = authenticatedContext.storage();
      const avatarRef = ref(storage, `avatars/${USER_ID}/data.json`);
      
      const jsonBlob = new Blob(['{"fake": "data"}'], { type: 'application/json' });
      
      await assertFails(
        uploadBytes(avatarRef, jsonBlob)
      );
    });

    test('✗ Should deny file with no MIME type', async () => {
      const storage = authenticatedContext.storage();
      const avatarRef = ref(storage, `avatars/${USER_ID}/no-mime-type`);
      
      const noMimeBlob = new Blob(['fake-data']);
      
      await assertFails(
        uploadBytes(avatarRef, noMimeBlob)
      );
    });

    test('✗ Should deny malicious file with fake image extension', async () => {
      const storage = authenticatedContext.storage();
      const avatarRef = ref(storage, `avatars/${USER_ID}/malicious.jpg`);
      
      const maliciousBlob = new Blob(['&lt;script&gt;alert("xss")&lt;/script&gt;'], { type: 'text/html' });
      
      await assertFails(
        uploadBytes(avatarRef, maliciousBlob)
      );
    });
  });

  describe('Edge Cases and Security Tests', () => {
    test('✗ Should deny path traversal attempts', async () => {
      const storage = authenticatedContext.storage();
      const avatarRef = ref(storage, `avatars/${USER_ID}/../../../sensitive.jpg`);
      
      const validImageBlob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
      
      await assertFails(
        uploadBytes(avatarRef, validImageBlob)
      );
    });

    test('✗ Should deny empty file upload', async () => {
      const storage = authenticatedContext.storage();
      const avatarRef = ref(storage, `avatars/${USER_ID}/empty.jpg`);
      
      const emptyBlob = new Blob([], { type: 'image/jpeg' });
      
      await assertFails(
        uploadBytes(avatarRef, emptyBlob)
      );
    });

    test('✗ Should deny upload with special characters in user ID', async () => {
      const maliciousUserId = 'user/../../../admin';
      const maliciousContext = testEnv.authenticatedContext(maliciousUserId);
      const storage = maliciousContext.storage();
      const avatarRef = ref(storage, `avatars/${maliciousUserId}/profile.jpg`);
      
      const validImageBlob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
      
      await assertFails(
        uploadBytes(avatarRef, validImageBlob)
      );
    });

    test('✓ Should handle nested file paths correctly', async () => {
      const storage = authenticatedContext.storage();
      const avatarRef = ref(storage, `avatars/${USER_ID}/nested/folder/profile.jpg`);
      
      const validImageBlob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
      
      await assertSucceeds(
        uploadBytes(avatarRef, validImageBlob)
      );
    });
  });

  describe('MIME Type Validation Tests', () => {
    const validImageTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/webp',
      'image/svg+xml'
    ];

    validImageTypes.forEach(mimeType => {
      test(`✓ Should allow ${mimeType} uploads`, async () => {
        const storage = authenticatedContext.storage();
        const avatarRef = ref(storage, `avatars/${USER_ID}/test.${mimeType.split('/')[1]}`);
        
        const validImageBlob = new Blob(['fake-image-data'], { type: mimeType });
        
        await assertSucceeds(
          uploadBytes(avatarRef, validImageBlob)
        );
      });
    });

    const invalidMimeTypes = [
      'video/mp4',
      'audio/mp3',
      'application/exe',
      'text/javascript',
      'application/x-executable'
    ];

    invalidMimeTypes.forEach(mimeType => {
      test(`✗ Should deny ${mimeType} uploads`, async () => {
        const storage = authenticatedContext.storage();
        const avatarRef = ref(storage, `avatars/${USER_ID}/test.${mimeType.split('/')[1]}`);
        
        const invalidBlob = new Blob(['fake-data'], { type: mimeType });
        
        await assertFails(
          uploadBytes(avatarRef, invalidBlob)
        );
      });
    });
  });
});
