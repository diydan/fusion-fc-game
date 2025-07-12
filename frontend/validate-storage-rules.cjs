#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const STORAGE_RULES_PATH = path.join(__dirname, 'storage.rules');

function validateStorageRules() {
  console.log('🔍 Validating Firebase Storage Rules...\n');
  
  try {
    // Check if the file exists
    if (!fs.existsSync(STORAGE_RULES_PATH)) {
      console.error('❌ storage.rules file not found!');
      return false;
    }

    // Read the rules file
    const rulesContent = fs.readFileSync(STORAGE_RULES_PATH, 'utf8');
    
    // Basic syntax checks
    const checks = [
      {
        name: 'Rules version specified',
        test: () => rulesContent.includes("rules_version = '2'"),
        message: 'Rules should specify version 2'
      },
      {
        name: 'Firebase storage service defined',
        test: () => rulesContent.includes('service firebase.storage'),
        message: 'Must define firebase.storage service'
      },
      {
        name: 'Avatar rules present',
        test: () => rulesContent.includes('match /avatars/{userId}/{file}'),
        message: 'Avatar rules should be defined'
      },
      {
        name: 'isAvatarOwner function defined',
        test: () => rulesContent.includes('function isAvatarOwner(path)'),
        message: 'isAvatarOwner helper function should be defined'
      },
      {
        name: 'validImage function defined',
        test: () => rulesContent.includes('function validImage()'),
        message: 'validImage helper function should be defined'
      },
      {
        name: 'validSize function defined',
        test: () => rulesContent.includes('function validSize(maxSize)'),
        message: 'validSize helper function should be defined'
      },
      {
        name: 'Authentication check in isAvatarOwner',
        test: () => rulesContent.includes('request.auth != null'),
        message: 'Authentication should be checked in isAvatarOwner'
      },
      {
        name: 'Path validation in isAvatarOwner',
        test: () => rulesContent.includes('path[3] == request.auth.uid'),
        message: 'Path should be validated against authenticated user ID'
      },
      {
        name: 'Image MIME type validation',
        test: () => rulesContent.includes("contentType.matches('image/.*')"),
        message: 'Image MIME type should be validated'
      },
      {
        name: 'File size validation',
        test: () => rulesContent.includes('request.resource.size < maxSize'),
        message: 'File size should be validated'
      },
      {
        name: '5MB size limit',
        test: () => rulesContent.includes('5 * 1024 * 1024'),
        message: 'Should enforce 5MB size limit'
      },
      {
        name: 'Proper function calls in avatar rule',
        test: () => rulesContent.includes('isAvatarOwner(path) && validImage() && validSize(5 * 1024 * 1024)'),
        message: 'Avatar rule should call all validation functions'
      }
    ];

    let allPassed = true;
    
    checks.forEach(check => {
      if (check.test()) {
        console.log(`✅ ${check.name}`);
      } else {
        console.log(`❌ ${check.name}: ${check.message}`);
        allPassed = false;
      }
    });

    console.log('\n📋 Rules Content Preview:');
    console.log('─'.repeat(50));
    console.log(rulesContent.substring(0, 500) + (rulesContent.length > 500 ? '...' : ''));
    console.log('─'.repeat(50));

    if (allPassed) {
      console.log('\n🎉 All validation checks passed!');
      console.log('✅ Storage rules are properly configured');
      return true;
    } else {
      console.log('\n⚠️  Some validation checks failed');
      console.log('Please review and fix the storage rules');
      return false;
    }

  } catch (error) {
    console.error('❌ Error validating storage rules:', error.message);
    return false;
  }
}

// Run validation if called directly
if (require.main === module) {
  const isValid = validateStorageRules();
  process.exit(isValid ? 0 : 1);
}

module.exports = { validateStorageRules };
