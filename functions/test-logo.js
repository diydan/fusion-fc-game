// Simple test script for logo generation
// Run with: node test-logo.js

const https = require('https');
const http = require('http');

const testLogoGeneration = async () => {
  const data = JSON.stringify({
    businessName: "Fusion FC",
    businessType: "Gaming/Sports",
    style: "modern and dynamic",
    colors: "blue and orange",
    provider: "openai" // or "vertexai"
  });

  const options = {
    hostname: 'localhost',
    port: 5001, // Firebase emulator port
    path: '/your-project-id/us-central1/logoGenerator',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          console.log('Logo generated successfully!');
          console.log('Image URL:', result.imageUrl);
          console.log('Prompt used:', result.prompt);
          console.log('Provider:', result.provider);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
};

// Run the test
testLogoGeneration()
  .then(result => {
    console.log('Test completed successfully!');
  })
  .catch(error => {
    console.error('Test failed:', error);
  });
