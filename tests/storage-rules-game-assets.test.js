const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');

// Test configuration
const PROJECT_ID = 'fusion-fc-test';
const RULES_FILE = '../storage.rules';

describe('Game Asset Storage Rules', () => {
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
        host: 'localhost',
        port: 9199,
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

  describe('Public Game Assets (/game/assets/public/)', () => {
    describe('Read Access Tests', () => {
      test('✓ Should allow unauthenticated users to read public game assets', async () => {
        const storage = unauthenticatedContext.storage();
        const assetRef = ref(storage, 'game/assets/public/logo.png');
        
        // First, upload a test asset (using admin context for setup)
        const adminStorage = testEnv.authenticatedContext('admin').storage();
        const adminAssetRef = ref(adminStorage, 'game/assets/public/logo.png');
        const testBlob = new Blob(['fake-image-data'], { type: 'image/png' });
        
        // Note: We can't actually upload in these tests due to rule restrictions
        // but we can test the read permission logic
        await assertSucceeds(
          getDownloadURL(assetRef).catch(() => {
            // Expected to fail due to file not existing, but permissions should allow
            throw new Error('PERMISSION_DENIED');
          }).catch((error) => {
            if (error.message === 'PERMISSION_DENIED') {
              throw error;
            }
            // Any other error means permissions were OK
            return Promise.resolve();
          })
        );
      });

      test('✓ Should allow authenticated users to read public game assets', async () => {
        const storage = authenticatedContext.storage();
        const assetRef = ref(storage, 'game/assets/public/background.jpg');
        
        await assertSucceeds(
          getDownloadURL(assetRef).catch(() => {
            throw new Error('PERMISSION_DENIED');
          }).catch((error) => {
            if (error.message === 'PERMISSION_DENIED') {
              throw error;
            }
            return Promise.resolve();
          })
        );
      });

      test('✓ Should allow reading nested public assets', async () => {
        const storage = unauthenticatedContext.storage();
        const assetRef = ref(storage, 'game/assets/public/characters/hero.sprite');
        
        await assertSucceeds(
          getDownloadURL(assetRef).catch(() => {
            throw new Error('PERMISSION_DENIED');
          }).catch((error) => {
            if (error.message === 'PERMISSION_DENIED') {
              throw error;
            }
            return Promise.resolve();
          })
        );
      });

      test('✓ Should allow reading deeply nested public assets', async () => {
        const storage = unauthenticatedContext.storage();
        const assetRef = ref(storage, 'game/assets/public/levels/world1/stage1/tileset.png');
        
        await assertSucceeds(
          getDownloadURL(assetRef).catch(() => {
            throw new Error('PERMISSION_DENIED');
          }).catch((error) => {
            if (error.message === 'PERMISSION_DENIED') {
              throw error;
            }
            return Promise.resolve();
          })
        );
      });
    });

    describe('Write Access Tests', () => {
      test('✗ Should deny unauthenticated users from writing to public game assets', async () => {
        const storage = unauthenticatedContext.storage();
        const assetRef = ref(storage, 'game/assets/public/malicious.exe');
        
        const testBlob = new Blob(['malicious-data'], { type: 'application/octet-stream' });
        
        await assertFails(
          uploadBytes(assetRef, testBlob)
        );
      });

      test('✗ Should deny authenticated users from writing to public game assets', async () => {
        const storage = authenticatedContext.storage();
        const assetRef = ref(storage, 'game/assets/public/unauthorized.png');
        
        const testBlob = new Blob(['fake-image-data'], { type: 'image/png' });
        
        await assertFails(
          uploadBytes(assetRef, testBlob)
        );
      });

      test('✗ Should deny admin users from writing to public game assets', async () => {
        const adminContext = testEnv.authenticatedContext('admin');
        const storage = adminContext.storage();
        const assetRef = ref(storage, 'game/assets/public/admin-upload.png');
        
        const testBlob = new Blob(['fake-image-data'], { type: 'image/png' });
        
        await assertFails(
          uploadBytes(assetRef, testBlob)
        );
      });
    });
  });

  describe('Private Game Assets (/game/assets/)', () => {
    describe('Read Access Tests', () => {
      test('✗ Should deny unauthenticated users from reading private game assets', async () => {
        const storage = unauthenticatedContext.storage();
        const assetRef = ref(storage, 'game/assets/premium/character.png');
        
        await assertFails(
          getDownloadURL(assetRef)
        );
      });

      test('✓ Should allow authenticated users to read private game assets', async () => {
        const storage = authenticatedContext.storage();
        const assetRef = ref(storage, 'game/assets/premium/character.png');
        
        await assertSucceeds(
          getDownloadURL(assetRef).catch(() => {
            throw new Error('PERMISSION_DENIED');
          }).catch((error) => {
            if (error.message === 'PERMISSION_DENIED') {
              throw error;
            }
            return Promise.resolve();
          })
        );
      });

      test('✓ Should allow different authenticated users to read private game assets', async () => {
        const storage = otherUserContext.storage();
        const assetRef = ref(storage, 'game/assets/premium/weapon.sprite');
        
        await assertSucceeds(
          getDownloadURL(assetRef).catch(() => {
            throw new Error('PERMISSION_DENIED');
          }).catch((error) => {
            if (error.message === 'PERMISSION_DENIED') {
              throw error;
            }
            return Promise.resolve();
          })
        );
      });

      test('✓ Should allow reading nested private assets', async () => {
        const storage = authenticatedContext.storage();
        const assetRef = ref(storage, 'game/assets/premium/levels/secret/boss.png');
        
        await assertSucceeds(
          getDownloadURL(assetRef).catch(() => {
            throw new Error('PERMISSION_DENIED');
          }).catch((error) => {
            if (error.message === 'PERMISSION_DENIED') {
              throw error;
            }
            return Promise.resolve();
          })
        );
      });
    });

    describe('Write Access Tests', () => {
      test('✗ Should deny unauthenticated users from writing to private game assets', async () => {
        const storage = unauthenticatedContext.storage();
        const assetRef = ref(storage, 'game/assets/premium/hacked.exe');
        
        const testBlob = new Blob(['malicious-data'], { type: 'application/octet-stream' });
        
        await assertFails(
          uploadBytes(assetRef, testBlob)
        );
      });

      test('✗ Should deny authenticated users from writing to private game assets', async () => {
        const storage = authenticatedContext.storage();
        const assetRef = ref(storage, 'game/assets/premium/unauthorized.png');
        
        const testBlob = new Blob(['fake-image-data'], { type: 'image/png' });
        
        await assertFails(
          uploadBytes(assetRef, testBlob)
        );
      });

      test('✗ Should deny admin users from writing to private game assets', async () => {
        const adminContext = testEnv.authenticatedContext('admin');
        const storage = adminContext.storage();
        const assetRef = ref(storage, 'game/assets/premium/admin-upload.png');
        
        const testBlob = new Blob(['fake-image-data'], { type: 'image/png' });
        
        await assertFails(
          uploadBytes(assetRef, testBlob)
        );
      });
    });
  });

  describe('Edge Cases and Security Tests', () => {
    test('✗ Should deny access to game assets root without specific path', async () => {
      const storage = unauthenticatedContext.storage();
      const assetRef = ref(storage, 'game/assets/');
      
      await assertFails(
        getDownloadURL(assetRef)
      );
    });

    test('✗ Should deny path traversal attempts in public assets', async () => {
      const storage = unauthenticatedContext.storage();
      const assetRef = ref(storage, 'game/assets/public/../../../sensitive.txt');
      
      await assertFails(
        getDownloadURL(assetRef)
      );
    });

    test('✗ Should deny path traversal attempts in private assets', async () => {
      const storage = authenticatedContext.storage();
      const assetRef = ref(storage, 'game/assets/premium/../../../sensitive.txt');
      
      await assertFails(
        getDownloadURL(assetRef)
      );
    });

    test('✗ Should deny access to non-game asset paths', async () => {
      const storage = unauthenticatedContext.storage();
      const assetRef = ref(storage, 'game/other-data/file.txt');
      
      await assertFails(
        getDownloadURL(assetRef)
      );
    });

    test('✗ Should deny access to similar but different paths', async () => {
      const storage = unauthenticatedContext.storage();
      const assetRef = ref(storage, 'game/assets-public/file.txt');
      
      await assertFails(
        getDownloadURL(assetRef)
      );
    });

    test('✓ Should handle files with special characters in public assets', async () => {
      const storage = unauthenticatedContext.storage();
      const assetRef = ref(storage, 'game/assets/public/file with spaces & symbols!.png');
      
      await assertSucceeds(
        getDownloadURL(assetRef).catch(() => {
          throw new Error('PERMISSION_DENIED');
        }).catch((error) => {
          if (error.message === 'PERMISSION_DENIED') {
            throw error;
          }
          return Promise.resolve();
        })
      );
    });

    test('✓ Should handle files with special characters in private assets', async () => {
      const storage = authenticatedContext.storage();
      const assetRef = ref(storage, 'game/assets/premium/file with spaces & symbols!.png');
      
      await assertSucceeds(
        getDownloadURL(assetRef).catch(() => {
          throw new Error('PERMISSION_DENIED');
        }).catch((error) => {
          if (error.message === 'PERMISSION_DENIED') {
            throw error;
          }
          return Promise.resolve();
        })
      );
    });
  });

  describe('Rule Precedence Tests', () => {
    test('✓ Should prioritize public rule over private rule for public assets', async () => {
      // This test ensures that /game/assets/public/ takes precedence over /game/assets/
      const storage = unauthenticatedContext.storage();
      const publicAssetRef = ref(storage, 'game/assets/public/should-be-public.png');
      
      await assertSucceeds(
        getDownloadURL(publicAssetRef).catch(() => {
          throw new Error('PERMISSION_DENIED');
        }).catch((error) => {
          if (error.message === 'PERMISSION_DENIED') {
            throw error;
          }
          return Promise.resolve();
        })
      );
    });

    test('✗ Should apply private rule for non-public assets', async () => {
      // This test ensures that assets not in public/ require authentication
      const storage = unauthenticatedContext.storage();
      const privateAssetRef = ref(storage, 'game/assets/private/should-be-private.png');
      
      await assertFails(
        getDownloadURL(privateAssetRef)
      );
    });
  });

  describe('Authentication State Tests', () => {
    test('✓ Should maintain access when user switches authentication', async () => {
      // Test that different authenticated users can access private assets
      const storage1 = authenticatedContext.storage();
      const storage2 = otherUserContext.storage();
      
      const assetRef1 = ref(storage1, 'game/assets/premium/test1.png');
      const assetRef2 = ref(storage2, 'game/assets/premium/test2.png');
      
      await assertSucceeds(
        getDownloadURL(assetRef1).catch(() => {
          throw new Error('PERMISSION_DENIED');
        }).catch((error) => {
          if (error.message === 'PERMISSION_DENIED') {
            throw error;
          }
          return Promise.resolve();
        })
      );
      
      await assertSucceeds(
        getDownloadURL(assetRef2).catch(() => {
          throw new Error('PERMISSION_DENIED');
        }).catch((error) => {
          if (error.message === 'PERMISSION_DENIED') {
            throw error;
          }
          return Promise.resolve();
        })
      );
    });

    test('✗ Should lose access when authentication is removed', async () => {
      const storage = unauthenticatedContext.storage();
      const assetRef = ref(storage, 'game/assets/premium/no-access.png');
      
      await assertFails(
        getDownloadURL(assetRef)
      );
    });
  });
});
