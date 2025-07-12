const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    storageBucket: 'fusion-fc.firebasestorage.app'
  });
}

const bucket = admin.storage().bucket();
const LOGO_ENDPOINT = 'https://logogenerator-6unsift5pq-uc.a.run.app';

// Test with just 3 logos first
const testConcepts = [
  { name: "Phoenix FC", style: "phoenix bird with spread wings, soccer ball incorporated", colors: "red and orange flames" },
  { name: "Thunder Wolves", style: "wolf head silhouette with lightning bolt", colors: "electric blue and silver" },
  { name: "Royal Lions", style: "majestic lion head with crown elements", colors: "gold and deep purple" }
];

async function testLogoGeneration() {
  console.log('Testing logo generation with 3 concepts...');
  
  for (let i = 0; i < testConcepts.length; i++) {
    const concept = testConcepts[i];
    const logoNumber = i + 1;
    
    try {
      console.log(`\n[${logoNumber}/3] Generating logo for ${concept.name}...`);
      
      // Generate logo using the AI endpoint
      const response = await axios.post(LOGO_ENDPOINT, {
        businessName: concept.name,
        businessType: 'Soccer Team',
        style: `${concept.style}, no text, no typography, no letters, icon only, emblem style`,
        colors: concept.colors
      }, {
        timeout: 60000 // 1 minute timeout
      });
      
      if (response.data && response.data.imageUrl) {
        // Extract base64 data
        const base64Data = response.data.imageUrl.replace(/^data:image\/[a-z]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Create filename
        const filename = `soccer-logo-placeholders/test-logo-${logoNumber}-${concept.name.toLowerCase().replace(/\s+/g, '-')}.png`;
        
        // Upload to Firebase Storage
        const file = bucket.file(filename);
        await file.save(buffer, {
          metadata: {
            contentType: 'image/png',
            metadata: {
              teamName: concept.name,
              style: concept.style,
              colors: concept.colors,
              promptUsed: response.data.prompt,
              generatedAt: new Date().toISOString()
            }
          }
        });
        
        // Make the file publicly readable
        await file.makePublic();
        
        console.log(`✅ Uploaded: ${filename}`);
        console.log(`   Public URL: https://storage.googleapis.com/fusion-fc.firebasestorage.app/${filename}`);
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } else {
        console.log(`❌ Failed to generate logo for ${concept.name}: No image data received`);
      }
      
    } catch (error) {
      console.log(`❌ Error generating logo for ${concept.name}:`, error.response?.data || error.message);
    }
  }
  
  console.log('\n🎉 Test completed!');
}

// Run the test
testLogoGeneration()
  .then(() => {
    console.log('Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });