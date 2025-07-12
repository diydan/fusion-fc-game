#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const TEST_PROJECT_ID = 'fusion-fc-test';
const EMULATOR_PORTS = {
  firestore: 8080,
  storage: 9199,
  auth: 9099,
  ui: 4000
};

class FirebaseRulesTestRunner {
  constructor() {
    this.emulatorProcess = null;
    this.testProcess = null;
    this.emulatorReady = false;
  }

  async run() {
    console.log('🚀 Starting Firebase Security Rules Test Suite...\n');
    
    try {
      await this.checkPrerequisites();
      await this.setupTestEnvironment();
      await this.startEmulators();
      await this.runTests();
    } catch (error) {
      console.error('❌ Test runner failed:', error.message);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');
    
    // Check Firebase CLI
    try {
      execSync('firebase --version', { stdio: 'ignore' });
      console.log('✅ Firebase CLI found');
    } catch (error) {
      throw new Error('Firebase CLI not found. Please install: npm install -g firebase-tools');
    }

    // Check if rules files exist
    const rulesFiles = ['../firestore.rules', '../storage.rules'];
    for (const file of rulesFiles) {
      const fullPath = path.resolve(__dirname, file);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Rules file not found: ${fullPath}`);
      }
    }
    console.log('✅ Rules files found');

    // Check if node_modules exists
    if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
      console.log('📦 Installing test dependencies...');
      execSync('npm install', { cwd: __dirname, stdio: 'inherit' });
    }
    console.log('✅ Test dependencies ready');
  }

  async setupTestEnvironment() {
    console.log('🛠️  Setting up test environment...');
    
    // Set environment variables
    process.env.FIRESTORE_EMULATOR_HOST = `localhost:${EMULATOR_PORTS.firestore}`;
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = `localhost:${EMULATOR_PORTS.storage}`;
    process.env.FIREBASE_AUTH_EMULATOR_HOST = `localhost:${EMULATOR_PORTS.auth}`;
    
    console.log('✅ Environment variables set');
  }

  async startEmulators() {
    console.log('🔥 Starting Firebase emulators...');
    
    return new Promise((resolve, reject) => {
      this.emulatorProcess = spawn('firebase', [
        'emulators:start',
        '--only', 'firestore,storage,auth',
        '--project', TEST_PROJECT_ID,
        '--import', './test-data',
        '--export-on-exit', './test-data'
      ], {
        stdio: 'pipe',
        cwd: path.resolve(__dirname, '..'),
        env: { ...process.env, FIREBASE_CLI_EXPERIMENTS: 'webframeworks' }
      });

      let emulatorOutput = '';
      
      this.emulatorProcess.stdout.on('data', (data) => {
        const output = data.toString();
        emulatorOutput += output;
        
        // Log important emulator messages
        if (output.includes('All emulators ready')) {
          console.log('✅ All Firebase emulators ready!');
          this.emulatorReady = true;
          resolve();
        } else if (output.includes('emulator started at')) {
          const lines = output.split('\n');
          for (const line of lines) {
            if (line.includes('emulator started at')) {
              console.log(`   ${line.trim()}`);
            }
          }
        }
      });

      this.emulatorProcess.stderr.on('data', (data) => {
        const error = data.toString();
        if (error.includes('Error') || error.includes('Failed')) {
          console.error(`Emulator error: ${error}`);
        }
      });

      this.emulatorProcess.on('error', (error) => {
        reject(new Error(`Failed to start emulators: ${error.message}`));
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        if (!this.emulatorReady) {
          reject(new Error('Emulators failed to start within 60 seconds'));
        }
      }, 60000);
    });
  }

  async runTests() {
    console.log('🧪 Running security rules tests...\n');
    
    return new Promise((resolve, reject) => {
      const testArgs = process.argv.includes('--coverage') 
        ? ['jest', '--coverage', '--verbose']
        : ['jest', '--verbose'];

      // Add specific test file if provided
      const testFile = process.argv.find(arg => arg.endsWith('.test.js'));
      if (testFile) {
        testArgs.push(testFile);
      }

      this.testProcess = spawn('npx', testArgs, {
        stdio: 'inherit',
        cwd: __dirname,
        env: {
          ...process.env,
          NODE_ENV: 'test',
          FIREBASE_PROJECT_ID: TEST_PROJECT_ID
        }
      });

      this.testProcess.on('close', (code) => {
        console.log(`\n📊 Tests completed with exit code: ${code}`);
        
        if (code === 0) {
          console.log('✅ All tests passed! 🎉');
          resolve();
        } else {
          console.log('❌ Some tests failed.');
          reject(new Error(`Tests failed with exit code ${code}`));
        }
      });

      this.testProcess.on('error', (error) => {
        reject(new Error(`Test execution failed: ${error.message}`));
      });
    });
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    
    if (this.testProcess) {
      this.testProcess.kill();
    }
    
    if (this.emulatorProcess) {
      console.log('🛑 Stopping Firebase emulators...');
      this.emulatorProcess.kill('SIGTERM');
      
      // Give emulators time to export data
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log('✅ Cleanup complete');
  }

  // Handle process interruption
  setupSignalHandlers() {
    const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    
    signals.forEach(signal => {
      process.on(signal, async () => {
        console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
        await this.cleanup();
        process.exit(0);
      });
    });
  }
}

// CLI argument parsing
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    help: args.includes('--help') || args.includes('-h'),
    coverage: args.includes('--coverage'),
    watch: args.includes('--watch'),
    testFile: args.find(arg => arg.endsWith('.test.js'))
  };
  
  if (options.help) {
    console.log(`
Firebase Security Rules Test Runner

Usage: node run-all-tests.js [options] [test-file]

Options:
  --help, -h      Show this help message
  --coverage      Run tests with coverage report
  --watch         Run tests in watch mode
  
Examples:
  node run-all-tests.js                    # Run all tests
  node run-all-tests.js --coverage         # Run with coverage
  node run-all-tests.js firestore-rules.test.js  # Run specific test file
`);
    process.exit(0);
  }
  
  return options;
}

// Main execution
if (require.main === module) {
  const options = parseArguments();
  const runner = new FirebaseRulesTestRunner();
  
  runner.setupSignalHandlers();
  runner.run().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = FirebaseRulesTestRunner;
