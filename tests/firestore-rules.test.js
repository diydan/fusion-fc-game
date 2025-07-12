const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require('@firebase/rules-unit-testing');

describe('Firestore Security Rules', () => {
  let testEnv;
  let authenticatedContext;
  let unauthenticatedContext;
  let walletAuthContext;
  let adminContext;

  const TEST_PROJECT_ID = 'fusion-fc-test';
  const USER_ID = 'test-user-123';
  const OTHER_USER_ID = 'other-user-456';
  const WALLET_ADDRESS = '0x742d35Cc6634C0532925a3b8D0b12345678901234';
  const OTHER_WALLET = '0x742d35Cc6634C0532925a3b8D0b987654321abcde';
  const TEAM_ID = 'team-123';
  const MATCH_ID = 'match-456';

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: TEST_PROJECT_ID,
      firestore: {
        rules: require('fs').readFileSync('../firestore.rules', 'utf8'),
      },
    });

    // Create different authentication contexts
    authenticatedContext = testEnv.authenticatedContext(USER_ID);
    unauthenticatedContext = testEnv.unauthenticatedContext();
    walletAuthContext = testEnv.authenticatedContext(USER_ID, {
      walletAddress: WALLET_ADDRESS
    });
    adminContext = testEnv.authenticatedContext('admin-user');
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  describe('Users Collection', () => {
    describe('Positive Cases', () => {
      test('User can read their own profile', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`users/${USER_ID}`).set({
            name: 'Test User',
            email: 'test@example.com'
          });
        });

        await assertSucceeds(
          authenticatedContext.firestore().doc(`users/${USER_ID}`).get()
        );
      });

      test('User can create their own profile', async () => {
        await assertSucceeds(
          authenticatedContext.firestore().doc(`users/${USER_ID}`).set({
            name: 'Test User',
            email: 'test@example.com',
            createdAt: new Date()
          })
        );
      });

      test('User can update their own profile', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`users/${USER_ID}`).set({
            name: 'Test User',
            email: 'test@example.com'
          });
        });

        await assertSucceeds(
          authenticatedContext.firestore().doc(`users/${USER_ID}`).update({
            name: 'Updated Name'
          })
        );
      });

      test('MetaMask user can create profile with wallet address', async () => {
        await assertSucceeds(
          walletAuthContext.firestore().doc(`users/${WALLET_ADDRESS}`).set({
            name: 'MetaMask User',
            walletAddress: WALLET_ADDRESS,
            createdAt: new Date()
          })
        );
      });

      test('User with linked wallet can access profile', async () => {
        // Setup wallet linking
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`wallets/${WALLET_ADDRESS}`).set({
            userId: USER_ID,
            address: WALLET_ADDRESS
          });
          await context.firestore().doc(`users/${USER_ID}`).set({
            name: 'Test User',
            linkedWallet: WALLET_ADDRESS
          });
        });

        await assertSucceeds(
          walletAuthContext.firestore().doc(`users/${USER_ID}`).get()
        );
      });
    });

    describe('Negative Cases', () => {
      test('Unauthenticated user cannot read profiles', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`users/${USER_ID}`).set({
            name: 'Test User'
          });
        });

        await assertFails(
          unauthenticatedContext.firestore().doc(`users/${USER_ID}`).get()
        );
      });

      test('User cannot read other users profiles', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`users/${OTHER_USER_ID}`).set({
            name: 'Other User'
          });
        });

        await assertFails(
          authenticatedContext.firestore().doc(`users/${OTHER_USER_ID}`).get()
        );
      });

      test('User cannot create profile for another user', async () => {
        await assertFails(
          authenticatedContext.firestore().doc(`users/${OTHER_USER_ID}`).set({
            name: 'Malicious Profile'
          })
        );
      });

      test('User cannot delete their profile', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`users/${USER_ID}`).set({
            name: 'Test User'
          });
        });

        await assertFails(
          authenticatedContext.firestore().doc(`users/${USER_ID}`).delete()
        );
      });

      test('User cannot update other users profiles', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`users/${OTHER_USER_ID}`).set({
            name: 'Other User'
          });
        });

        await assertFails(
          authenticatedContext.firestore().doc(`users/${OTHER_USER_ID}`).update({
            name: 'Hacked Name'
          })
        );
      });
    });
  });

  describe('Wallets Collection', () => {
    describe('Positive Cases', () => {
      test('Authenticated user can read any wallet document', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`wallets/${WALLET_ADDRESS}`).set({
            userId: OTHER_USER_ID,
            address: WALLET_ADDRESS
          });
        });

        await assertSucceeds(
          authenticatedContext.firestore().doc(`wallets/${WALLET_ADDRESS}`).get()
        );
      });

      test('User can create wallet linking to their account', async () => {
        await assertSucceeds(
          authenticatedContext.firestore().doc(`wallets/${WALLET_ADDRESS}`).set({
            userId: USER_ID,
            address: WALLET_ADDRESS,
            linkedAt: new Date()
          })
        );
      });

      test('MetaMask user can create wallet entry', async () => {
        await assertSucceeds(
          walletAuthContext.firestore().doc(`wallets/${WALLET_ADDRESS}`).set({
            address: WALLET_ADDRESS,
            lastLogin: new Date()
          })
        );
      });

      test('Linked user can update their wallet document', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`wallets/${WALLET_ADDRESS}`).set({
            userId: USER_ID,
            address: WALLET_ADDRESS
          });
        });

        await assertSucceeds(
          authenticatedContext.firestore().doc(`wallets/${WALLET_ADDRESS}`).update({
            lastLogin: new Date()
          })
        );
      });

      test('MetaMask user can update their own wallet lastLogin', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`wallets/${WALLET_ADDRESS}`).set({
            address: WALLET_ADDRESS
          });
        });

        await assertSucceeds(
          walletAuthContext.firestore().doc(`wallets/${WALLET_ADDRESS}`).update({
            lastLogin: new Date(),
            signature: 'test-sig',
            message: 'test-message'
          })
        );
      });
    });

    describe('Negative Cases', () => {
      test('Unauthenticated user cannot read wallets', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`wallets/${WALLET_ADDRESS}`).set({
            userId: USER_ID
          });
        });

        await assertFails(
          unauthenticatedContext.firestore().doc(`wallets/${WALLET_ADDRESS}`).get()
        );
      });

      test('User cannot create wallet linking to another account', async () => {
        await assertFails(
          authenticatedContext.firestore().doc(`wallets/${WALLET_ADDRESS}`).set({
            userId: OTHER_USER_ID,
            address: WALLET_ADDRESS
          })
        );
      });

      test('User cannot update wallet not linked to them', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`wallets/${WALLET_ADDRESS}`).set({
            userId: OTHER_USER_ID,
            address: WALLET_ADDRESS
          });
        });

        await assertFails(
          authenticatedContext.firestore().doc(`wallets/${WALLET_ADDRESS}`).update({
            lastLogin: new Date()
          })
        );
      });

      test('User cannot delete wallet documents', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`wallets/${WALLET_ADDRESS}`).set({
            userId: USER_ID
          });
        });

        await assertFails(
          authenticatedContext.firestore().doc(`wallets/${WALLET_ADDRESS}`).delete()
        );
      });
    });
  });

  describe('Game Data Collection', () => {
    describe('Positive Cases', () => {
      test('User can read/write their own game data', async () => {
        await assertSucceeds(
          authenticatedContext.firestore().doc(`gameData/${USER_ID}`).set({
            level: 1,
            score: 100,
            achievements: []
          })
        );

        await assertSucceeds(
          authenticatedContext.firestore().doc(`gameData/${USER_ID}`).get()
        );

        await assertSucceeds(
          authenticatedContext.firestore().doc(`gameData/${USER_ID}`).update({
            score: 200
          })
        );
      });

      test('User with linked wallet can access game data', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`wallets/${WALLET_ADDRESS}`).set({
            userId: USER_ID,
            address: WALLET_ADDRESS
          });
        });

        await assertSucceeds(
          walletAuthContext.firestore().doc(`gameData/${USER_ID}`).set({
            level: 5,
            score: 5000
          })
        );
      });
    });

    describe('Negative Cases', () => {
      test('Unauthenticated user cannot access game data', async () => {
        await assertFails(
          unauthenticatedContext.firestore().doc(`gameData/${USER_ID}`).get()
        );
      });

      test('User cannot access other users game data', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`gameData/${OTHER_USER_ID}`).set({
            level: 10,
            score: 10000
          });
        });

        await assertFails(
          authenticatedContext.firestore().doc(`gameData/${OTHER_USER_ID}`).get()
        );
      });
    });
  });

  describe('Matches Collection', () => {
    describe('Positive Cases', () => {
      test('Authenticated user can read matches', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`matches/${MATCH_ID}`).set({
            players: [USER_ID, OTHER_USER_ID],
            status: 'active'
          });
        });

        await assertSucceeds(
          authenticatedContext.firestore().doc(`matches/${MATCH_ID}`).get()
        );
      });

      test('Player can create a match they participate in', async () => {
        await assertSucceeds(
          authenticatedContext.firestore().doc(`matches/${MATCH_ID}`).set({
            players: [USER_ID, OTHER_USER_ID],
            status: 'waiting',
            createdAt: new Date()
          })
        );
      });

      test('Participant can update match', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`matches/${MATCH_ID}`).set({
            players: [USER_ID, OTHER_USER_ID],
            status: 'active'
          });
        });

        await assertSucceeds(
          authenticatedContext.firestore().doc(`matches/${MATCH_ID}`).update({
            status: 'completed'
          })
        );
      });

      test('Wallet user in players list can update match', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`matches/${MATCH_ID}`).set({
            players: [WALLET_ADDRESS, OTHER_USER_ID],
            status: 'active'
          });
        });

        await assertSucceeds(
          walletAuthContext.firestore().doc(`matches/${MATCH_ID}`).update({
            status: 'completed'
          })
        );
      });
    });

    describe('Negative Cases', () => {
      test('Unauthenticated user cannot read matches', async () => {
        await assertFails(
          unauthenticatedContext.firestore().doc(`matches/${MATCH_ID}`).get()
        );
      });

      test('User cannot create match without being a player', async () => {
        await assertFails(
          authenticatedContext.firestore().doc(`matches/${MATCH_ID}`).set({
            players: [OTHER_USER_ID, 'another-user'],
            status: 'waiting'
          })
        );
      });

      test('Non-participant cannot update match', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`matches/${MATCH_ID}`).set({
            players: [OTHER_USER_ID, 'another-user'],
            status: 'active'
          });
        });

        await assertFails(
          authenticatedContext.firestore().doc(`matches/${MATCH_ID}`).update({
            status: 'completed'
          })
        );
      });

      test('Users cannot delete matches', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`matches/${MATCH_ID}`).set({
            players: [USER_ID, OTHER_USER_ID],
            status: 'completed'
          });
        });

        await assertFails(
          authenticatedContext.firestore().doc(`matches/${MATCH_ID}`).delete()
        );
      });
    });
  });

  describe('Teams Collection', () => {
    describe('Positive Cases', () => {
      test('Any authenticated user can read teams', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`teams/${TEAM_ID}`).set({
            name: 'Test Team',
            managerId: OTHER_USER_ID
          });
        });

        await assertSucceeds(
          authenticatedContext.firestore().doc(`teams/${TEAM_ID}`).get()
        );
      });

      test('User can create team as manager', async () => {
        await assertSucceeds(
          authenticatedContext.firestore().doc(`teams/${TEAM_ID}`).set({
            name: 'My Team',
            managerId: USER_ID,
            members: [],
            createdAt: new Date()
          })
        );
      });

      test('Team manager can update team', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`teams/${TEAM_ID}`).set({
            name: 'Test Team',
            managerId: USER_ID,
            members: []
          });
        });

        await assertSucceeds(
          authenticatedContext.firestore().doc(`teams/${TEAM_ID}`).update({
            name: 'Updated Team Name'
          })
        );
      });

      test('Team manager can delete team', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`teams/${TEAM_ID}`).set({
            name: 'Test Team',
            managerId: USER_ID
          });
        });

        await assertSucceeds(
          authenticatedContext.firestore().doc(`teams/${TEAM_ID}`).delete()
        );
      });
    });

    describe('Negative Cases', () => {
      test('Unauthenticated user cannot read teams', async () => {
        await assertFails(
          unauthenticatedContext.firestore().doc(`teams/${TEAM_ID}`).get()
        );
      });

      test('User cannot create team with different manager', async () => {
        await assertFails(
          authenticatedContext.firestore().doc(`teams/${TEAM_ID}`).set({
            name: 'Malicious Team',
            managerId: OTHER_USER_ID
          })
        );
      });

      test('Non-manager cannot update team', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`teams/${TEAM_ID}`).set({
            name: 'Test Team',
            managerId: OTHER_USER_ID
          });
        });

        await assertFails(
          authenticatedContext.firestore().doc(`teams/${TEAM_ID}`).update({
            name: 'Hacked Team'
          })
        );
      });

      test('Non-manager cannot delete team', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`teams/${TEAM_ID}`).set({
            name: 'Test Team',
            managerId: OTHER_USER_ID
          });
        });

        await assertFails(
          authenticatedContext.firestore().doc(`teams/${TEAM_ID}`).delete()
        );
      });

      test('Manager cannot change managerId without proper authorization', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`teams/${TEAM_ID}`).set({
            name: 'Test Team',
            managerId: USER_ID
          });
        });

        await assertFails(
          authenticatedContext.firestore().doc(`teams/${TEAM_ID}`).update({
            managerId: OTHER_USER_ID
          })
        );
      });
    });
  });

  describe('Team Members Collection', () => {
    const membershipId = `${TEAM_ID}_${OTHER_USER_ID}`;

    describe('Positive Cases', () => {
      test('Team manager can create membership', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`teams/${TEAM_ID}`).set({
            name: 'Test Team',
            managerId: USER_ID
          });
        });

        await assertSucceeds(
          authenticatedContext.firestore().doc(`teamMembers/${membershipId}`).set({
            teamId: TEAM_ID,
            userId: OTHER_USER_ID,
            role: 'member',
            joinedAt: new Date()
          })
        );
      });

      test('Team manager can update membership', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`teams/${TEAM_ID}`).set({
            name: 'Test Team',
            managerId: USER_ID
          });
          await context.firestore().doc(`teamMembers/${membershipId}`).set({
            teamId: TEAM_ID,
            userId: OTHER_USER_ID,
            role: 'member'
          });
        });

        await assertSucceeds(
          authenticatedContext.firestore().doc(`teamMembers/${membershipId}`).update({
            role: 'captain'
          })
        );
      });

      test('Team manager can delete membership', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`teams/${TEAM_ID}`).set({
            name: 'Test Team',
            managerId: USER_ID
          });
          await context.firestore().doc(`teamMembers/${membershipId}`).set({
            teamId: TEAM_ID,
            userId: OTHER_USER_ID,
            role: 'member'
          });
        });

        await assertSucceeds(
          authenticatedContext.firestore().doc(`teamMembers/${membershipId}`).delete()
        );
      });

      test('User can leave team (delete their own membership)', async () => {
        const selfMembershipId = `${TEAM_ID}_${USER_ID}`;
        
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`teams/${TEAM_ID}`).set({
            name: 'Test Team',
            managerId: OTHER_USER_ID
          });
          await context.firestore().doc(`teamMembers/${selfMembershipId}`).set({
            teamId: TEAM_ID,
            userId: USER_ID,
            role: 'member'
          });
        });

        await assertSucceeds(
          authenticatedContext.firestore().doc(`teamMembers/${selfMembershipId}`).delete()
        );
      });

      test('Team member can read membership documents', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`teams/${TEAM_ID}`).set({
            name: 'Test Team',
            managerId: OTHER_USER_ID,
            members: [USER_ID]
          });
          await context.firestore().doc(`teamMembers/${membershipId}`).set({
            teamId: TEAM_ID,
            userId: OTHER_USER_ID,
            role: 'member'
          });
        });

        await assertSucceeds(
          authenticatedContext.firestore().doc(`teamMembers/${membershipId}`).get()
        );
      });
    });

    describe('Negative Cases', () => {
      test('Non-manager cannot create membership', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`teams/${TEAM_ID}`).set({
            name: 'Test Team',
            managerId: OTHER_USER_ID
          });
        });

        await assertFails(
          authenticatedContext.firestore().doc(`teamMembers/${membershipId}`).set({
            teamId: TEAM_ID,
            userId: OTHER_USER_ID,
            role: 'member'
          })
        );
      });

      test('User cannot create membership with wrong format', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`teams/${TEAM_ID}`).set({
            name: 'Test Team',
            managerId: USER_ID
          });
        });

        await assertFails(
          authenticatedContext.firestore().doc(`teamMembers/${membershipId}`).set({
            teamId: 'wrong-team-id',
            userId: OTHER_USER_ID,
            role: 'member'
          })
        );
      });

      test('Cannot change critical fields in membership update', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`teams/${TEAM_ID}`).set({
            name: 'Test Team',
            managerId: USER_ID
          });
          await context.firestore().doc(`teamMembers/${membershipId}`).set({
            teamId: TEAM_ID,
            userId: OTHER_USER_ID,
            role: 'member'
          });
        });

        await assertFails(
          authenticatedContext.firestore().doc(`teamMembers/${membershipId}`).update({
            teamId: 'different-team'
          })
        );

        await assertFails(
          authenticatedContext.firestore().doc(`teamMembers/${membershipId}`).update({
            userId: 'different-user'
          })
        );
      });

      test('Unauthenticated user cannot access memberships', async () => {
        await assertFails(
          unauthenticatedContext.firestore().doc(`teamMembers/${membershipId}`).get()
        );
      });
    });
  });

  describe('Team Invitations Collection', () => {
    const invitationId = 'invitation-123';

    describe('Positive Cases', () => {
      test('Team manager can create invitation', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`teams/${TEAM_ID}`).set({
            name: 'Test Team',
            managerId: USER_ID
          });
        });

        await assertSucceeds(
          authenticatedContext.firestore().doc(`teamInvitations/${invitationId}`).set({
            teamId: TEAM_ID,
            invitedUserId: OTHER_USER_ID,
            status: 'pending',
            createdAt: new Date()
          })
        );
      });

      test('Invited user can read invitation', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`teams/${TEAM_ID}`).set({
            name: 'Test Team',
            managerId: OTHER_USER_ID
          });
          await context.firestore().doc(`teamInvitations/${invitationId}`).set({
            teamId: TEAM_ID,
            invitedUserId: USER_ID,
            status: 'pending'
          });
        });

        await assertSucceeds(
          authenticatedContext.firestore().doc(`teamInvitations/${invitationId}`).get()
        );
      });

      test('Team manager can read invitation', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`teams/${TEAM_ID}`).set({
            name: 'Test Team',
            managerId: USER_ID
          });
          await context.firestore().doc(`teamInvitations/${invitationId}`).set({
            teamId: TEAM_ID,
            invitedUserId: OTHER_USER_ID,
            status: 'pending'
          });
        });

        await assertSucceeds(
          authenticatedContext.firestore().doc(`teamInvitations/${invitationId}`).get()
        );
      });

      test('Invited user can accept/decline invitation', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`teams/${TEAM_ID}`).set({
            name: 'Test Team',
            managerId: OTHER_USER_ID
          });
          await context.firestore().doc(`teamInvitations/${invitationId}`).set({
            teamId: TEAM_ID,
            invitedUserId: USER_ID,
            status: 'pending'
          });
        });

        await assertSucceeds(
          authenticatedContext.firestore().doc(`teamInvitations/${invitationId}`).update({
            status: 'accepted'
          })
        );
      });

      test('Team manager can delete invitation', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`teams/${TEAM_ID}`).set({
            name: 'Test Team',
            managerId: USER_ID
          });
          await context.firestore().doc(`teamInvitations/${invitationId}`).set({
            teamId: TEAM_ID,
            invitedUserId: OTHER_USER_ID,
            status: 'pending'
          });
        });

        await assertSucceeds(
          authenticatedContext.firestore().doc(`teamInvitations/${invitationId}`).delete()
        );
      });
    });

    describe('Negative Cases', () => {
      test('Non-manager cannot create invitation', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`teams/${TEAM_ID}`).set({
            name: 'Test Team',
            managerId: OTHER_USER_ID
          });
        });

        await assertFails(
          authenticatedContext.firestore().doc(`teamInvitations/${invitationId}`).set({
            teamId: TEAM_ID,
            invitedUserId: 'some-user',
            status: 'pending'
          })
        );
      });

      test('Unauthorized user cannot read invitation', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`teams/${TEAM_ID}`).set({
            name: 'Test Team',
            managerId: OTHER_USER_ID
          });
          await context.firestore().doc(`teamInvitations/${invitationId}`).set({
            teamId: TEAM_ID,
            invitedUserId: 'some-other-user',
            status: 'pending'
          });
        });

        await assertFails(
          authenticatedContext.firestore().doc(`teamInvitations/${invitationId}`).get()
        );
      });

      test('Non-invited user cannot update invitation', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().doc(`teams/${TEAM_ID}`).set({
            name: 'Test Team',
            managerId: OTHER_USER_ID
          });
          await context.firestore().doc(`teamInvitations/${invitationId}`).set({
            teamId: TEAM_ID,
            invitedUserId: 'some-other-user',
            status: 'pending'
          });
        });

        await assertFails(
          authenticatedContext.firestore().doc(`teamInvitations/${invitationId}`).update({
            status: 'accepted'
          })
        );
      });

      test('Unauthenticated user cannot access invitations', async () => {
        await assertFails(
          unauthenticatedContext.firestore().doc(`teamInvitations/${invitationId}`).get()
        );
      });
    });
  });

  describe('Default Deny Rule', () => {
    test('Access to undefined collections is denied', async () => {
      await assertFails(
        authenticatedContext.firestore().doc('randomCollection/randomDoc').get()
      );

      await assertFails(
        authenticatedContext.firestore().doc('randomCollection/randomDoc').set({
          data: 'test'
        })
      );
    });

    test('Unauthenticated access to undefined collections is denied', async () => {
      await assertFails(
        unauthenticatedContext.firestore().doc('randomCollection/randomDoc').get()
      );
    });
  });
});
