const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require('@firebase/rules-unit-testing');

describe('Storage Security Rules', () => {
  let testEnv;
  let authenticatedContext;
  let unauthenticatedContext;
  let otherUserContext;

  const TEST_PROJECT_ID = 'fusion-fc-test';
  const USER_ID = 'test-user-123';
  const OTHER_USER_ID = 'other-user-456';
  const TEAM_ID = 'team-123';

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: TEST_PROJECT_ID,
      storage: {
        rules: require('fs').readFileSync('../storage.rules', 'utf8'),
      },
      firestore: {
        rules: require('fs').readFileSync('../firestore.rules', 'utf8'),
      },
    });

    // Create different authentication contexts
    authenticatedContext = testEnv.authenticatedContext(USER_ID);
    unauthenticatedContext = testEnv.unauthenticatedContext();
    otherUserContext = testEnv.authenticatedContext(OTHER_USER_ID);
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.clearStorage();
  });

  // Helper function to create mock file data
  const createMockImageFile = (sizeInBytes = 1000) => {
    return {
      size: sizeInBytes,
      contentType: 'image/jpeg',
      customMetadata: {},
    };
  };

  const createMockJSONFile = (sizeInBytes = 500) => {
    return {
      size: sizeInBytes,
      contentType: 'application/json',
      customMetadata: {},
    };
  };

  const createMockInvalidFile = (sizeInBytes = 1000) => {
    return {
      size: sizeInBytes,
      contentType: 'application/x-executable',
      customMetadata: {},
    };
  };

  describe('Avatar Storage Rules', () => {
    describe('Positive Cases', () => {
      test('User can upload their own avatar (valid image, under size limit)', async () => {
        const avatarRef = authenticatedContext
          .storage()
          .bucket()
          .file(`avatars/${USER_ID}/profile.jpg`);

        await assertSucceeds(
          avatarRef.save('mock-image-data', {
            metadata: createMockImageFile(3 * 1024 * 1024), // 3MB
          })
        );
      });

      test('User can read their own avatar', async () => {
        // First upload an avatar
        await testEnv.withSecurityRulesDisabled(async (context) => {
          const avatarRef = context
            .storage()
            .bucket()
            .file(`avatars/${USER_ID}/profile.jpg`);
          await avatarRef.save('mock-image-data');
        });

        const avatarRef = authenticatedContext
          .storage()
          .bucket()
          .file(`avatars/${USER_ID}/profile.jpg`);

        await assertSucceeds(avatarRef.download());
      });

      test('User can update their own avatar', async () => {
        // Upload initial avatar
        await testEnv.withSecurityRulesDisabled(async (context) => {
          const avatarRef = context
            .storage()
            .bucket()
            .file(`avatars/${USER_ID}/profile.jpg`);
          await avatarRef.save('initial-image-data');
        });

        const avatarRef = authenticatedContext
          .storage()
          .bucket()
          .file(`avatars/${USER_ID}/profile.jpg`);

        await assertSucceeds(
          avatarRef.save('updated-image-data', {
            metadata: createMockImageFile(2 * 1024 * 1024), // 2MB
          })
        );
      });

      test('User can upload multiple avatar formats (PNG, JPEG, GIF)', async () => {
        const jpegRef = authenticatedContext
          .storage()
          .bucket()
          .file(`avatars/${USER_ID}/profile.jpeg`);

        const pngRef = authenticatedContext
          .storage()
          .bucket()
          .file(`avatars/${USER_ID}/profile.png`);

        const gifRef = authenticatedContext
          .storage()
          .bucket()
          .file(`avatars/${USER_ID}/profile.gif`);

        await assertSucceeds(
          jpegRef.save('jpeg-data', {
            metadata: { ...createMockImageFile(), contentType: 'image/jpeg' },
          })
        );

        await assertSucceeds(
          pngRef.save('png-data', {
            metadata: { ...createMockImageFile(), contentType: 'image/png' },
          })
        );

        await assertSucceeds(
          gifRef.save('gif-data', {
            metadata: { ...createMockImageFile(), contentType: 'image/gif' },
          })
        );
      });
    });

    describe('Negative Cases', () => {
      test('Unauthenticated user cannot upload avatars', async () => {
        const avatarRef = unauthenticatedContext
          .storage()
          .bucket()
          .file(`avatars/${USER_ID}/profile.jpg`);

        await assertFails(
          avatarRef.save('mock-data', {
            metadata: createMockImageFile(),
          })
        );
      });

      test('User cannot upload avatar for another user', async () => {
        const avatarRef = authenticatedContext
          .storage()
          .bucket()
          .file(`avatars/${OTHER_USER_ID}/profile.jpg`);

        await assertFails(
          avatarRef.save('mock-data', {
            metadata: createMockImageFile(),
          })
        );
      });

      test('User cannot read other users avatars', async () => {
        // Upload avatar for other user (as admin)
        await testEnv.withSecurityRulesDisabled(async (context) => {
          const avatarRef = context
            .storage()
            .bucket()
            .file(`avatars/${OTHER_USER_ID}/profile.jpg`);
          await avatarRef.save('other-user-avatar');
        });

        const avatarRef = authenticatedContext
          .storage()
          .bucket()
          .file(`avatars/${OTHER_USER_ID}/profile.jpg`);

        await assertFails(avatarRef.download());
      });

      test('Cannot upload file exceeding size limit (>5MB)', async () => {
        const avatarRef = authenticatedContext
          .storage()
          .bucket()
          .file(`avatars/${USER_ID}/large-profile.jpg`);

        await assertFails(
          avatarRef.save('large-image-data', {
            metadata: createMockImageFile(6 * 1024 * 1024), // 6MB
          })
        );
      });

      test('Cannot upload non-image files as avatar', async () => {
        const avatarRef = authenticatedContext
          .storage()
          .bucket()
          .file(`avatars/${USER_ID}/profile.txt`);

        await assertFails(
          avatarRef.save('text-data', {
            metadata: {
              size: 1000,
              contentType: 'text/plain',
              customMetadata: {},
            },
          })
        );
      });

      test('Cannot upload executable files as avatar', async () => {
        const avatarRef = authenticatedContext
          .storage()
          .bucket()
          .file(`avatars/${USER_ID}/malicious.exe`);

        await assertFails(
          avatarRef.save('malicious-data', {
            metadata: createMockInvalidFile(),
          })
        );
      });
    });
  });

  describe('Game Assets Storage Rules', () => {
    describe('Public Assets', () => {
      test('Anyone can read public game assets', async () => {
        // Upload public asset
        await testEnv.withSecurityRulesDisabled(async (context) => {
          const assetRef = context
            .storage()
            .bucket()
            .file('game/assets/public/textures/background.jpg');
          await assetRef.save('background-texture');
        });

        // Unauthenticated user can read
        const publicAssetRef = unauthenticatedContext
          .storage()
          .bucket()
          .file('game/assets/public/textures/background.jpg');

        await assertSucceeds(publicAssetRef.download());

        // Authenticated user can read
        const publicAssetRef2 = authenticatedContext
          .storage()
          .bucket()
          .file('game/assets/public/textures/background.jpg');

        await assertSucceeds(publicAssetRef2.download());
      });

      test('Cannot write to public assets directory', async () => {
        const publicAssetRef = authenticatedContext
          .storage()
          .bucket()
          .file('game/assets/public/textures/malicious.jpg');

        await assertFails(
          publicAssetRef.save('malicious-data', {
            metadata: createMockImageFile(),
          })
        );
      });

      test('Unauthenticated users cannot write to public assets', async () => {
        const publicAssetRef = unauthenticatedContext
          .storage()
          .bucket()
          .file('game/assets/public/sounds/effect.mp3');

        await assertFails(
          publicAssetRef.save('sound-data', {
            metadata: {
              size: 1000,
              contentType: 'audio/mpeg',
              customMetadata: {},
            },
          })
        );
      });
    });

    describe('Private Assets', () => {
      test('Authenticated user can read private game assets', async () => {
        // Upload private asset
        await testEnv.withSecurityRulesDisabled(async (context) => {
          const assetRef = context
            .storage()
            .bucket()
            .file('game/assets/premium/characters/hero.png');
          await assetRef.save('hero-sprite');
        });

        const privateAssetRef = authenticatedContext
          .storage()
          .bucket()
          .file('game/assets/premium/characters/hero.png');

        await assertSucceeds(privateAssetRef.download());
      });

      test('Unauthenticated user cannot read private game assets', async () => {
        // Upload private asset
        await testEnv.withSecurityRulesDisabled(async (context) => {
          const assetRef = context
            .storage()
            .bucket()
            .file('game/assets/premium/maps/secret-level.json');
          await assetRef.save('secret-level-data');
        });

        const privateAssetRef = unauthenticatedContext
          .storage()
          .bucket()
          .file('game/assets/premium/maps/secret-level.json');

        await assertFails(privateAssetRef.download());
      });

      test('Authenticated users cannot write to private assets', async () => {
        const privateAssetRef = authenticatedContext
          .storage()
          .bucket()
          .file('game/assets/premium/cheats.txt');

        await assertFails(
          privateAssetRef.save('cheat-codes', {
            metadata: {
              size: 1000,
              contentType: 'text/plain',
              customMetadata: {},
            },
          })
        );
      });
    });
  });

  describe('Team Content Storage Rules', () => {
    beforeEach(async () => {
      // Setup team with user as manager
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`teams/${TEAM_ID}`).set({
          name: 'Test Team',
          managerId: USER_ID,
          members: [USER_ID]
        });
      });
    });

    describe('Positive Cases', () => {
      test('Team manager can upload team images', async () => {
        const teamImageRef = authenticatedContext
          .storage()
          .bucket()
          .file(`teams/${TEAM_ID}/logo.png`);

        await assertSucceeds(
          teamImageRef.save('team-logo', {
            metadata: createMockImageFile(5 * 1024 * 1024), // 5MB
          })
        );
      });

      test('Team member can read team content', async () => {
        // Upload team content
        await testEnv.withSecurityRulesDisabled(async (context) => {
          const teamFileRef = context
            .storage()
            .bucket()
            .file(`teams/${TEAM_ID}/strategy.json`);
          await teamFileRef.save('team-strategy-data');
        });

        const teamFileRef = authenticatedContext
          .storage()
          .bucket()
          .file(`teams/${TEAM_ID}/strategy.json`);

        await assertSucceeds(teamFileRef.download());
      });

      test('Team member can upload JSON files under size limit', async () => {
        const teamDataRef = authenticatedContext
          .storage()
          .bucket()
          .file(`teams/${TEAM_ID}/config.json`);

        await assertSucceeds(
          teamDataRef.save('team-config', {
            metadata: createMockJSONFile(500 * 1024), // 500KB
          })
        );
      });

      test('Team member can upload images under size limit', async () => {
        const teamImageRef = authenticatedContext
          .storage()
          .bucket()
          .file(`teams/${TEAM_ID}/banner.jpg`);

        await assertSucceeds(
          teamImageRef.save('team-banner', {
            metadata: createMockImageFile(8 * 1024 * 1024), // 8MB
          })
        );
      });

      test('Team member can write to subdirectories', async () => {
        const subDirRef = authenticatedContext
          .storage()
          .bucket()
          .file(`teams/${TEAM_ID}/assets/icons/medal.png`);

        await assertSucceeds(
          subDirRef.save('medal-icon', {
            metadata: createMockImageFile(),
          })
        );
      });
    });

    describe('Negative Cases', () => {
      test('Non-team member cannot access team content', async () => {
        // Upload team content
        await testEnv.withSecurityRulesDisabled(async (context) => {
          const teamFileRef = context
            .storage()
            .bucket()
            .file(`teams/${TEAM_ID}/secret-strategy.json`);
          await teamFileRef.save('secret-data');
        });

        const teamFileRef = otherUserContext
          .storage()
          .bucket()
          .file(`teams/${TEAM_ID}/secret-strategy.json`);

        await assertFails(teamFileRef.download());
      });

      test('Non-team member cannot upload to team directory', async () => {
        const teamFileRef = otherUserContext
          .storage()
          .bucket()
          .file(`teams/${TEAM_ID}/malicious.txt`);

        await assertFails(
          teamFileRef.save('malicious-data', {
            metadata: {
              size: 1000,
              contentType: 'text/plain',
              customMetadata: {},
            },
          })
        );
      });

      test('Unauthenticated user cannot access team content', async () => {
        const teamFileRef = unauthenticatedContext
          .storage()
          .bucket()
          .file(`teams/${TEAM_ID}/logo.png`);

        await assertFails(teamFileRef.download());
      });

      test('Cannot upload images exceeding size limit (>10MB)', async () => {
        const largeImageRef = authenticatedContext
          .storage()
          .bucket()
          .file(`teams/${TEAM_ID}/huge-banner.jpg`);

        await assertFails(
          largeImageRef.save('huge-image', {
            metadata: createMockImageFile(11 * 1024 * 1024), // 11MB
          })
        );
      });

      test('Cannot upload JSON files exceeding size limit (>1MB)', async () => {
        const largeJSONRef = authenticatedContext
          .storage()
          .bucket()
          .file(`teams/${TEAM_ID}/large-config.json`);

        await assertFails(
          largeJSONRef.save('large-json-data', {
            metadata: createMockJSONFile(2 * 1024 * 1024), // 2MB
          })
        );
      });

      test('Cannot upload unsupported file types to team directory', async () => {
        const executableRef = authenticatedContext
          .storage()
          .bucket()
          .file(`teams/${TEAM_ID}/virus.exe`);

        await assertFails(
          executableRef.save('malicious-code', {
            metadata: createMockInvalidFile(),
          })
        );
      });

      test('Team member access is enforced via Firestore team membership', async () => {
        // Remove user from team
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`teams/${TEAM_ID}`).update({
            members: [] // Remove all members
          });
        });

        const teamFileRef = authenticatedContext
          .storage()
          .bucket()
          .file(`teams/${TEAM_ID}/restricted.json`);

        await assertFails(
          teamFileRef.save('restricted-data', {
            metadata: createMockJSONFile(),
          })
        );
      });
    });
  });

  describe('Global Deny Rules', () => {
    test('Access to undefined paths is denied', async () => {
      const randomRef = authenticatedContext
        .storage()
        .bucket()
        .file('random-path/file.txt');

      await assertFails(
        randomRef.save('random-data', {
          metadata: {
            size: 1000,
            contentType: 'text/plain',
            customMetadata: {},
          },
        })
      );
    });

    test('Large files are rejected globally (>20MB)', async () => {
      const largeFileRef = authenticatedContext
        .storage()
        .bucket()
        .file(`avatars/${USER_ID}/massive-file.jpg`);

      await assertFails(
        largeFileRef.save('massive-data', {
          metadata: createMockImageFile(25 * 1024 * 1024), // 25MB
        })
      );
    });

    test('Unauthenticated users cannot access undefined paths', async () => {
      const randomRef = unauthenticatedContext
        .storage()
        .bucket()
        .file('undefined-path/mystery.file');

      await assertFails(randomRef.download());
    });
  });

  describe('File Type Validation', () => {
    test('Image content type validation works correctly', async () => {
      const validImageRef = authenticatedContext
        .storage()
        .bucket()
        .file(`avatars/${USER_ID}/valid.jpg`);

      await assertSucceeds(
        validImageRef.save('image-data', {
          metadata: { ...createMockImageFile(), contentType: 'image/jpeg' },
        })
      );

      const invalidImageRef = authenticatedContext
        .storage()
        .bucket()
        .file(`avatars/${USER_ID}/invalid.jpg`);

      await assertFails(
        invalidImageRef.save('text-data', {
          metadata: {
            size: 1000,
            contentType: 'text/plain',
            customMetadata: {},
          },
        })
      );
    });

    test('JSON content type validation works correctly', async () => {
      // Setup team membership
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`teams/${TEAM_ID}`).set({
          name: 'Test Team',
          managerId: USER_ID,
          members: [USER_ID]
        });
      });

      const validJSONRef = authenticatedContext
        .storage()
        .bucket()
        .file(`teams/${TEAM_ID}/valid.json`);

      await assertSucceeds(
        validJSONRef.save('json-data', {
          metadata: createMockJSONFile(),
        })
      );

      const invalidJSONRef = authenticatedContext
        .storage()
        .bucket()
        .file(`teams/${TEAM_ID}/invalid.json`);

      await assertFails(
        invalidJSONRef.save('xml-data', {
          metadata: {
            size: 1000,
            contentType: 'application/xml',
            customMetadata: {},
          },
        })
      );
    });
  });

  describe('Size Limit Edge Cases', () => {
    test('Files at exact size limit are allowed', async () => {
      const exactSizeRef = authenticatedContext
        .storage()
        .bucket()
        .file(`avatars/${USER_ID}/exact-size.jpg`);

      await assertSucceeds(
        exactSizeRef.save('exact-size-data', {
          metadata: createMockImageFile(5 * 1024 * 1024), // Exactly 5MB
        })
      );
    });

    test('Files one byte over limit are rejected', async () => {
      const overSizeRef = authenticatedContext
        .storage()
        .bucket()
        .file(`avatars/${USER_ID}/over-size.jpg`);

      await assertFails(
        overSizeRef.save('over-size-data', {
          metadata: createMockImageFile(5 * 1024 * 1024 + 1), // 5MB + 1 byte
        })
      );
    });
  });
});
