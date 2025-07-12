#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const EMULATOR_PORT = 9199;
const TEST_PROJECT_ID = 'fusion-fc-test';

async function runTests() {
  console.log('🚀 Starting Firebase Storage Rules Tests...\n');
  
  // Check if Firebase CLI is available
  const { execSync } = require('child_process');
  try {
    execSync('firebase --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Firebase CLI not found. Please install it:');
    console.error('npm install -g firebase-tools');
    process.exit(1);
  }

  console.log('📁 Setting up test environment...');
  
  // Start Firebase emulator
  const emulatorProcess = spawn('firebase', [
    'emulators:start',
    '--only', 'storage',
    '--project', TEST_PROJECT_ID,
    '--export-on-exit'
  ], {
    stdio: 'pipe',
    cwd: path.resolve(__dirname, '..')
  });

  let emulatorReady = false;
  
  emulatorProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('All emulators ready')) {
      emulatorReady = true;
      console.log('✅ Firebase emulator ready!');
      runJestTests();
    }
  });

  emulatorProcess.stderr.on('data', (data) => {
    console.error(`Emulator error: ${data}`);
  });

  // Wait for emulator to be ready (timeout after 30 seconds)
  const timeout = setTimeout(() => {
    if (!emulatorReady) {
      console.error('❌ Emulator failed to start within 30 seconds');
      emulatorProcess.kill();
      process.exit(1);
    }
  }, 30000);

  function runJestTests() {
    clearTimeout(timeout);
    
    console.log('🧪 Running Jest tests...\n');
    
    const jestProcess = spawn('npx', ['jest', '--verbose'], {
      stdio: 'inherit',
      cwd: __dirname,
      env: {
        ...process.env,
        FIRESTORE_EMULATOR_HOST: `localhost:${EMULATOR_PORT}`,
        FIREBASE_STORAGE_EMULATOR_HOST: `localhost:${EMULATOR_PORT}`
      }
    });

    jestProcess.on('close', (code) => {
      console.log(`\n📊 Tests completed with exit code: ${code}`);
      
      // Stop emulator
      emulatorProcess.kill();
      
      if (code === 0) {
        console.log('✅ All tests passed!');
      } else {
        console.log('❌ Some tests failed.');
      }
      
      process.exit(code);
    });
  }

  // Handle process interruption
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping tests...');
    emulatorProcess.kill();
    process.exit(0);
  });
}

runTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
