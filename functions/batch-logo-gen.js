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

// All 40 soccer team concepts
const soccerTeamConcepts = [
  { name: "Phoenix FC", style: "phoenix bird with spread wings, soccer ball incorporated", colors: "red and orange flames" },
  { name: "Thunder Wolves", style: "wolf head silhouette with lightning bolt", colors: "electric blue and silver" },
  { name: "Royal Lions", style: "majestic lion head with crown elements", colors: "gold and deep purple" },
  { name: "Steel Eagles", style: "eagle in flight clutching soccer ball", colors: "metallic steel and black" },
  { name: "Crimson Tigers", style: "tiger stripes forming soccer ball pattern", colors: "crimson red and black stripes" },
  { name: "Ocean Sharks", style: "shark fin breaking through waves", colors: "ocean blue and white foam" },
  { name: "Forest Rangers", style: "tree silhouette with soccer ball as moon", colors: "forest green and brown" },
  { name: "Fire Dragons", style: "dragon breathing fire in circular motion", colors: "orange fire and dark red" },
  { name: "Ice Bears", style: "polar bear with crystalline ice elements", colors: "ice blue and pure white" },
  { name: "Desert Scorpions", style: "scorpion tail curved around soccer ball", colors: "sandy beige and black" },
  
  { name: "Storm Hawks", style: "hawk diving through storm clouds", colors: "storm gray and electric yellow" },
  { name: "Mountain Rams", style: "ram horns forming mountain peaks", colors: "stone gray and snow white" },
  { name: "Neon Leopards", style: "leopard spots in geometric pattern", colors: "neon green and black spots" },
  { name: "Coastal Dolphins", style: "dolphin jumping through waves", colors: "turquoise and ocean blue" },
  { name: "Urban Falcons", style: "falcon with city skyline silhouette", colors: "dark gray and bright orange" },
  { name: "Golden Stallions", style: "horse rearing with flowing mane", colors: "golden yellow and chestnut brown" },
  { name: "Arctic Foxes", style: "fox silhouette in snowy landscape", colors: "arctic white and ice blue" },
  { name: "Jungle Jaguars", style: "jaguar spots forming soccer ball hexagons", colors: "jungle green and spotted gold" },
  { name: "Night Owls", style: "owl eyes glowing in darkness", colors: "midnight black and glowing yellow" },
  { name: "Solar Cheetahs", style: "cheetah running with speed lines", colors: "solar orange and racing stripes" },
  
  { name: "Crystal Unicorns", style: "unicorn horn with crystal facets", colors: "crystal clear and rainbow prisma" },
  { name: "Iron Rhinos", style: "rhino horn charging forward", colors: "metallic iron and rust orange" },
  { name: "Emerald Cobras", style: "cobra coiled around soccer ball", colors: "emerald green and venomous yellow" },
  { name: "Cyber Panthers", style: "panther with digital circuit patterns", colors: "electric purple and neon cyan" },
  { name: "Volcanic Bulls", style: "bull with lava and volcanic rock", colors: "lava red and charcoal black" },
  { name: "Wind Zebras", style: "zebra stripes flowing like wind", colors: "white and black flowing stripes" },
  { name: "Cosmic Wolves", style: "wolf howling at starry night sky", colors: "cosmic purple and star silver" },
  { name: "Blazing Mustangs", style: "mustang with fire mane", colors: "blazing orange and wild brown" },
  { name: "Tidal Whales", style: "whale tail creating wave splash", colors: "deep ocean blue and white foam" },
  { name: "Lightning Lynx", style: "lynx with electric fur patterns", colors: "electric white and storm blue" },
  
  { name: "Ruby Raptors", style: "raptor claws holding soccer ball", colors: "ruby red and predator black" },
  { name: "Sapphire Serpents", style: "serpent coiled in infinity symbol", colors: "sapphire blue and scale silver" },
  { name: "Titanium Titans", style: "geometric titan warrior helmet", colors: "titanium silver and power blue" },
  { name: "Prism Peacocks", style: "peacock feathers in rainbow array", colors: "prismatic rainbow and royal blue" },
  { name: "Magma Mammoths", style: "mammoth tusks crossing like swords", colors: "magma orange and ancient brown" },
  { name: "Neon Knights", style: "knight helmet with glowing visor", colors: "neon pink and armor silver" },
  { name: "Quantum Quetzals", style: "quetzal bird with energy trails", colors: "quantum green and energy white" },
  { name: "Frost Phoenixes", style: "phoenix made of ice crystals", colors: "frost blue and crystal white" },
  { name: "Shadow Spartans", style: "spartan shield with crossed spears", colors: "shadow black and bronze gold" },
  { name: "Plasma Pythons", style: "python coiled in plasma energy", colors: "plasma pink and electric blue" }
];

async function generateLogoBatch(startIndex, batchSize) {
  const endIndex = Math.min(startIndex + batchSize, soccerTeamConcepts.length);
  console.log(`\n🚀 Processing batch: ${startIndex + 1}-${endIndex} of ${soccerTeamConcepts.length}`);
  
  for (let i = startIndex; i < endIndex; i++) {
    const concept = soccerTeamConcepts[i];
    const logoNumber = i + 1;
    
    try {
      console.log(`[${logoNumber}/40] Generating logo for ${concept.name}...`);
      
      const response = await axios.post(LOGO_ENDPOINT, {
        businessName: concept.name,
        businessType: 'Soccer Team',
        style: `${concept.style}, no text, no typography, no letters, icon only, emblem style`,
        colors: concept.colors
      }, {
        timeout: 90000 // 90 seconds timeout
      });
      
      if (response.data && response.data.imageUrl) {
        const base64Data = response.data.imageUrl.replace(/^data:image\/[a-z]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        const filename = `soccer-logo-placeholders/logo-${logoNumber.toString().padStart(2, '0')}-${concept.name.toLowerCase().replace(/\s+/g, '-')}.png`;
        
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
        
        await file.makePublic();
        
        console.log(`✅ ${logoNumber}/40 Uploaded: ${concept.name}`);
        console.log(`   URL: https://storage.googleapis.com/fusion-fc.firebasestorage.app/${filename}`);
        
      } else {
        console.log(`❌ ${logoNumber}/40 Failed: ${concept.name} - No image data`);
      }
      
    } catch (error) {
      console.log(`❌ ${logoNumber}/40 Error: ${concept.name} - ${error.response?.status || error.message}`);
    }
    
    // Longer delay between requests
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
  }
}

async function generateAllLogos() {
  const batchSize = 5; // Process 5 at a time
  
  console.log('🎯 Starting batch generation of 40 soccer team logos...');
  console.log(`📦 Processing in batches of ${batchSize} with 5-second delays`);
  
  for (let i = 0; i < soccerTeamConcepts.length; i += batchSize) {
    await generateLogoBatch(i, batchSize);
    
    // Longer break between batches
    if (i + batchSize < soccerTeamConcepts.length) {
      console.log('⏸️  Taking 10-second break between batches...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  console.log('\n🎉 All batches completed!');
  console.log('🔗 Check Firebase Storage for uploaded logos');
}

// Get batch parameters from command line
const startBatch = parseInt(process.argv[2]) || 0;
const runAll = process.argv[2] === 'all';

if (runAll) {
  generateAllLogos()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Batch generation failed:', error);
      process.exit(1);
    });
} else {
  // Run a single batch of 5
  const batchNum = startBatch;
  const startIndex = batchNum * 5;
  
  console.log(`Running batch ${batchNum + 1} (logos ${startIndex + 1}-${Math.min(startIndex + 5, 40)})`);
  
  generateLogoBatch(startIndex, 5)
    .then(() => {
      console.log(`Batch ${batchNum + 1} completed!`);
      if (startIndex + 5 < 40) {
        console.log(`To continue, run: node batch-logo-gen.js ${batchNum + 1}`);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('Batch failed:', error);
      process.exit(1);
    });
}