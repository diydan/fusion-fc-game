#!/bin/bash

# Start Firebase storage emulator in background
echo "🚀 Starting Firebase Storage Emulator..."
cd .. && firebase emulators:start --only storage &
EMULATOR_PID=$!

# Wait for emulator to be ready
echo "⏳ Waiting for emulator to be ready..."
sleep 10

# Run the tests
echo "🧪 Running Game Asset Storage Rules Tests..."
cd tests && npm test storage-rules-game-assets.test.js

# Capture test exit code
TEST_EXIT_CODE=$?

# Stop the emulator
echo "🛑 Stopping emulator..."
kill $EMULATOR_PID

# Exit with test result
exit $TEST_EXIT_CODE
