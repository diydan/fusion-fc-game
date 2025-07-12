#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Verifying Firebase Security Rules Test Setup...\n');

const checks = [
  {
    name: 'Firebase CLI Installation',
    check: () => {
      try {
        const version = execSync('firebase --version', { encoding: 'utf8' });
        return { success: true, message: `Firebase CLI ${version.trim()} found` };
      } catch (error) {
        return { success: false, message: 'Firebase CLI not found. Install with: npm install -g firebase-tools' };
      }
    }
  },
  {
    name: 'Node.js Version',
    check: () => {
      const version = process.version;
      const majorVersion = parseInt(version.slice(1).split('.')[0]);
      const success = majorVersion >= 16;
      return {
        success,
        message: success ? `Node.js ${version} (✓ >= 16)` : `Node.js ${version} (✗ requires >= 16)`
      };
    }
  },
  {
    name: 'Test Dependencies',
    check: () => {
      const packagePath = path.join(__dirname, 'package.json');
      const nodeModulesPath = path.join(__dirname, 'node_modules');
      
      if (!fs.existsSync(packagePath)) {
        return { success: false, message: 'package.json not found' };
      }
      
      if (!fs.existsSync(nodeModulesPath)) {
        return { success: false, message: 'node_modules not found. Run: npm install' };
      }
      
      return { success: true, message: 'Dependencies installed' };
    }
  },
  {
    name: 'Firebase Rules Files',
    check: () => {
      const firestoreRules = path.join(__dirname, '..', 'firestore.rules');
      const storageRules = path.join(__dirname, '..', 'storage.rules');
      
      const firestoreExists = fs.existsSync(firestoreRules);
      const storageExists = fs.existsSync(storageRules);
      
      if (!firestoreExists && !storageExists) {
        return { success: false, message: 'No rules files found' };
      }
      
      const found = [];
      if (firestoreExists) found.push('firestore.rules');
      if (storageExists) found.push('storage.rules');
      
      return { success: true, message: `Found: ${found.join(', ')}` };
    }
  },
  {
    name: 'Test Files',
    check: () => {
      const testFiles = [
        'firestore-rules.test.js',
        'storage-rules.test.js',
        'jest.setup.js',
        'run-all-tests.js'
      ];
      
      const existing = testFiles.filter(file => 
        fs.existsSync(path.join(__dirname, file))
      );
      
      const success = existing.length === testFiles.length;
      return {
        success,
        message: success ? 'All test files present' : `Missing: ${testFiles.filter(f => !existing.includes(f)).join(', ')}`
      };
    }
  },
  {
    name: 'Firebase Configuration',
    check: () => {
      const configPath = path.join(__dirname, '..', 'firebase.json');
      
      if (!fs.existsSync(configPath)) {
        return { success: false, message: 'firebase.json not found' };
      }
      
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const hasEmulators = config.emulators && 
                            config.emulators.firestore && 
                            config.emulators.storage;
        
        return {
          success: hasEmulators,
          message: hasEmulators ? 'Firebase emulator configuration found' : 'Emulator configuration missing'
        };
      } catch (error) {
        return { success: false, message: 'Invalid firebase.json' };
      }
    }
  },
  {
    name: 'GitHub Actions Workflow',
    check: () => {
      const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'firebase-rules-tests.yml');
      const success = fs.existsSync(workflowPath);
      return {
        success,
        message: success ? 'CI/CD workflow configured' : 'GitHub Actions workflow not found'
      };
    }
  }
];

let allPassed = true;

checks.forEach(({ name, check }) => {
  try {
    const result = check();
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${name}: ${result.message}`);
    
    if (!result.success) {
      allPassed = false;
    }
  } catch (error) {
    console.log(`❌ ${name}: Error - ${error.message}`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(60));

if (allPassed) {
  console.log('🎉 All checks passed! Your Firebase Security Rules test suite is ready.');
  console.log('\nNext steps:');
  console.log('1. Run tests: npm run test:rules');
  console.log('2. Run with coverage: npm run test:rules:coverage');
  console.log('3. Run specific tests: npm run test:firestore');
} else {
  console.log('⚠️  Some checks failed. Please address the issues above.');
  process.exit(1);
}

console.log('\n📚 Documentation: ./tests/README.md');
console.log('🚀 Test Runner: ./tests/run-all-tests.js');
console.log('🔧 CI/CD: ./.github/workflows/firebase-rules-tests.yml');
