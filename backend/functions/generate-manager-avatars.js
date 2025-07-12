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

// 100 diverse manager avatar concepts
const managerAvatarConcepts = [
  // Professional Male Managers (30)
  { id: 1, style: "professional male soccer manager, suit and tie, confident expression", ethnicity: "caucasian", age: "40s" },
  { id: 2, style: "experienced male coach, tracksuit, tactical look", ethnicity: "african", age: "50s" },
  { id: 3, style: "young male manager, modern haircut, determined", ethnicity: "latino", age: "30s" },
  { id: 4, style: "veteran male coach, gray beard, wisdom in eyes", ethnicity: "asian", age: "60s" },
  { id: 5, style: "tactical male manager, glasses, clipboard", ethnicity: "middle-eastern", age: "40s" },
  { id: 6, style: "charismatic male coach, charming smile, leadership", ethnicity: "caucasian", age: "45s" },
  { id: 7, style: "intense male manager, focused expression, passionate", ethnicity: "african", age: "35s" },
  { id: 8, style: "calm male coach, zen-like composure, peaceful", ethnicity: "asian", age: "50s" },
  { id: 9, style: "dynamic male manager, energetic pose, motivational", ethnicity: "latino", age: "40s" },
  { id: 10, style: "strategic male coach, thinking pose, analytical", ethnicity: "caucasian", age: "55s" },
  { id: 11, style: "friendly male manager, warm smile, approachable", ethnicity: "african", age: "30s" },
  { id: 12, style: "serious male coach, stern look, disciplined", ethnicity: "middle-eastern", age: "45s" },
  { id: 13, style: "innovative male manager, modern style, forward-thinking", ethnicity: "asian", age: "35s" },
  { id: 14, style: "passionate male coach, emotional expression, heart", ethnicity: "latino", age: "50s" },
  { id: 15, style: "wise male manager, experienced gaze, mentor", ethnicity: "caucasian", age: "60s" },
  { id: 16, style: "ambitious male coach, hungry look, driven", ethnicity: "african", age: "25s" },
  { id: 17, style: "traditional male manager, classic style, old-school", ethnicity: "european", age: "55s" },
  { id: 18, style: "athletic male coach, fit appearance, active", ethnicity: "latino", age: "40s" },
  { id: 19, style: "intellectual male manager, thoughtful expression, studious", ethnicity: "asian", age: "45s" },
  { id: 20, style: "confident male coach, strong presence, leader", ethnicity: "middle-eastern", age: "40s" },
  { id: 21, style: "creative male manager, artistic flair, unique", ethnicity: "mixed", age: "35s" },
  { id: 22, style: "disciplined male coach, military bearing, structured", ethnicity: "caucasian", age: "50s" },
  { id: 23, style: "inspiring male manager, motivational aura, uplifting", ethnicity: "african", age: "40s" },
  { id: 24, style: "tactical male coach, strategic mind, calculated", ethnicity: "european", age: "45s" },
  { id: 25, style: "progressive male manager, modern approach, innovative", ethnicity: "scandinavian", age: "35s" },
  { id: 26, style: "experienced male coach, weathered face, seasoned", ethnicity: "latino", age: "60s" },
  { id: 27, style: "energetic male manager, vibrant personality, dynamic", ethnicity: "african", age: "30s" },
  { id: 28, style: "focused male coach, laser concentration, dedicated", ethnicity: "asian", age: "40s" },
  { id: 29, style: "charismatic male manager, magnetic personality, influential", ethnicity: "mediterranean", age: "45s" },
  { id: 30, style: "humble male coach, modest demeanor, grounded", ethnicity: "middle-eastern", age: "50s" },

  // Professional Female Managers (30)
  { id: 31, style: "professional female soccer manager, blazer, confident smile", ethnicity: "caucasian", age: "35s" },
  { id: 32, style: "experienced female coach, tracksuit, authoritative presence", ethnicity: "african", age: "40s" },
  { id: 33, style: "young female manager, modern style, determined look", ethnicity: "latina", age: "28s" },
  { id: 34, style: "veteran female coach, wise expression, leadership", ethnicity: "asian", age: "55s" },
  { id: 35, style: "tactical female manager, analytical gaze, strategic", ethnicity: "middle-eastern", age: "40s" },
  { id: 36, style: "charismatic female coach, warm smile, inspiring", ethnicity: "caucasian", age: "42s" },
  { id: 37, style: "intense female manager, focused expression, passionate", ethnicity: "african", age: "35s" },
  { id: 38, style: "calm female coach, serene composure, balanced", ethnicity: "asian", age: "45s" },
  { id: 39, style: "dynamic female manager, energetic pose, motivational", ethnicity: "latina", age: "38s" },
  { id: 40, style: "strategic female coach, thinking pose, intellectual", ethnicity: "european", age: "50s" },
  { id: 41, style: "friendly female manager, approachable smile, kind", ethnicity: "african", age: "32s" },
  { id: 42, style: "serious female coach, stern look, disciplined", ethnicity: "middle-eastern", age: "45s" },
  { id: 43, style: "innovative female manager, creative style, progressive", ethnicity: "asian", age: "35s" },
  { id: 44, style: "passionate female coach, emotional expression, heart", ethnicity: "latina", age: "40s" },
  { id: 45, style: "wise female manager, experienced gaze, mentor", ethnicity: "caucasian", age: "55s" },
  { id: 46, style: "ambitious female coach, determined look, driven", ethnicity: "mixed", age: "30s" },
  { id: 47, style: "traditional female manager, classic elegance, timeless", ethnicity: "european", age: "50s" },
  { id: 48, style: "athletic female coach, fit appearance, strong", ethnicity: "latina", age: "35s" },
  { id: 49, style: "intellectual female manager, thoughtful expression, studious", ethnicity: "asian", age: "42s" },
  { id: 50, style: "confident female coach, strong presence, leader", ethnicity: "african", age: "40s" },
  { id: 51, style: "creative female manager, artistic flair, unique", ethnicity: "mixed", age: "33s" },
  { id: 52, style: "disciplined female coach, structured approach, organized", ethnicity: "caucasian", age: "45s" },
  { id: 53, style: "inspiring female manager, motivational aura, uplifting", ethnicity: "african", age: "38s" },
  { id: 54, style: "tactical female coach, strategic mind, calculated", ethnicity: "scandinavian", age: "40s" },
  { id: 55, style: "progressive female manager, modern approach, forward-thinking", ethnicity: "asian", age: "35s" },
  { id: 56, style: "experienced female coach, seasoned wisdom, veteran", ethnicity: "latina", age: "55s" },
  { id: 57, style: "energetic female manager, vibrant personality, dynamic", ethnicity: "african", age: "32s" },
  { id: 58, style: "focused female coach, laser concentration, dedicated", ethnicity: "middle-eastern", age: "40s" },
  { id: 59, style: "charismatic female manager, magnetic personality, influential", ethnicity: "mediterranean", age: "43s" },
  { id: 60, style: "humble female coach, modest demeanor, grounded", ethnicity: "european", age: "48s" },

  // Diverse Young Managers (20)
  { id: 61, style: "young prodigy manager, genius expression, brilliant", ethnicity: "mixed", age: "25s" },
  { id: 62, style: "tech-savvy young coach, modern approach, digital", ethnicity: "asian", age: "27s" },
  { id: 63, style: "former player turned manager, athletic build, experienced", ethnicity: "african", age: "30s" },
  { id: 64, style: "university graduate manager, academic background, intelligent", ethnicity: "caucasian", age: "26s" },
  { id: 65, style: "international young coach, worldly experience, cultured", ethnicity: "latino", age: "29s" },
  { id: 66, style: "innovative young manager, creative tactics, revolutionary", ethnicity: "scandinavian", age: "28s" },
  { id: 67, style: "passionate young coach, fiery determination, intense", ethnicity: "middle-eastern", age: "27s" },
  { id: 68, style: "analytical young manager, data-driven approach, scientific", ethnicity: "asian", age: "26s" },
  { id: 69, style: "charismatic young coach, natural leader, inspiring", ethnicity: "african", age: "30s" },
  { id: 70, style: "ambitious young manager, hungry for success, driven", ethnicity: "mixed", age: "25s" },
  { id: 71, style: "calm young coach, mature beyond years, composed", ethnicity: "european", age: "28s" },
  { id: 72, style: "dynamic young manager, energetic approach, vibrant", ethnicity: "latina", age: "27s" },
  { id: 73, style: "strategic young coach, tactical genius, calculated", ethnicity: "asian", age: "29s" },
  { id: 74, style: "friendly young manager, team-first approach, collaborative", ethnicity: "african", age: "26s" },
  { id: 75, style: "disciplined young coach, structured methods, organized", ethnicity: "caucasian", age: "30s" },
  { id: 76, style: "creative young manager, artistic vision, imaginative", ethnicity: "latino", age: "28s" },
  { id: 77, style: "confident young coach, self-assured presence, bold", ethnicity: "middle-eastern", age: "27s" },
  { id: 78, style: "intellectual young manager, philosophical approach, deep", ethnicity: "european", age: "29s" },
  { id: 79, style: "progressive young coach, modern philosophy, evolved", ethnicity: "mixed", age: "26s" },
  { id: 80, style: "inspiring young manager, motivational speaker, uplifting", ethnicity: "african", age: "30s" },

  // Veteran Managers (20)
  { id: 81, style: "legendary veteran manager, silver hair, iconic", ethnicity: "european", age: "65s" },
  { id: 82, style: "experienced veteran coach, weathered face, wise", ethnicity: "latino", age: "62s" },
  { id: 83, style: "distinguished veteran manager, elegant presence, refined", ethnicity: "caucasian", age: "68s" },
  { id: 84, style: "masterful veteran coach, tactical genius, legendary", ethnicity: "asian", age: "60s" },
  { id: 85, style: "charismatic veteran manager, magnetic personality, influential", ethnicity: "african", age: "58s" },
  { id: 86, style: "calm veteran coach, zen-like wisdom, peaceful", ethnicity: "middle-eastern", age: "65s" },
  { id: 87, style: "passionate veteran manager, fiery spirit, intense", ethnicity: "mediterranean", age: "63s" },
  { id: 88, style: "intellectual veteran coach, philosophical mind, deep", ethnicity: "scandinavian", age: "67s" },
  { id: 89, style: "humble veteran manager, modest wisdom, grounded", ethnicity: "mixed", age: "61s" },
  { id: 90, style: "innovative veteran coach, modern adaptation, evolved", ethnicity: "asian", age: "59s" },
  { id: 91, style: "strategic veteran manager, master tactician, calculated", ethnicity: "european", age: "64s" },
  { id: 92, style: "inspiring veteran coach, motivational legend, uplifting", ethnicity: "african", age: "66s" },
  { id: 93, style: "disciplined veteran manager, structured approach, organized", ethnicity: "caucasian", age: "62s" },
  { id: 94, style: "friendly veteran coach, warm grandfather figure, kind", ethnicity: "latino", age: "68s" },
  { id: 95, style: "confident veteran manager, unwavering presence, strong", ethnicity: "middle-eastern", age: "60s" },
  { id: 96, style: "creative veteran coach, artistic vision, imaginative", ethnicity: "mixed", age: "65s" },
  { id: 97, style: "analytical veteran manager, data-driven wisdom, scientific", ethnicity: "asian", age: "63s" },
  { id: 98, style: "traditional veteran coach, old-school values, classic", ethnicity: "european", age: "70s" },
  { id: 99, style: "progressive veteran manager, forward-thinking elder, modern", ethnicity: "scandinavian", age: "58s" },
  { id: 100, style: "legendary veteran coach, hall of fame presence, iconic", ethnicity: "mixed", age: "72s" }
];

async function generateManagerAvatarBatch(startIndex, batchSize) {
  const endIndex = Math.min(startIndex + batchSize, managerAvatarConcepts.length);
  console.log(`\n🎯 Processing manager avatars: ${startIndex + 1}-${endIndex} of ${managerAvatarConcepts.length}`);
  
  for (let i = startIndex; i < endIndex; i++) {
    const concept = managerAvatarConcepts[i];
    
    try {
      console.log(`[${concept.id}/100] Generating avatar: ${concept.style.substring(0, 50)}...`);
      
      const response = await axios.post(LOGO_ENDPOINT, {
        businessName: `Manager ${concept.id}`,
        businessType: 'Professional Portrait',
        style: `${concept.style}, professional headshot, clean background, soccer manager portrait, photorealistic`,
        colors: "professional lighting and natural skin tones"
      }, {
        timeout: 90000 // 90 seconds timeout
      });
      
      if (response.data && response.data.imageUrl) {
        const base64Data = response.data.imageUrl.replace(/^data:image\/[a-z]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        const filename = `manager-avatars/avatar-${concept.id.toString().padStart(3, '0')}-${concept.ethnicity}-${concept.age}.png`;
        
        const file = bucket.file(filename);
        await file.save(buffer, {
          metadata: {
            contentType: 'image/png',
            metadata: {
              managerId: concept.id,
              style: concept.style,
              ethnicity: concept.ethnicity,
              age: concept.age,
              promptUsed: response.data.prompt,
              generatedAt: new Date().toISOString()
            }
          }
        });
        
        await file.makePublic();
        
        console.log(`✅ ${concept.id}/100 Uploaded: Manager ${concept.id}`);
        console.log(`   URL: https://storage.googleapis.com/fusion-fc.firebasestorage.app/${filename}`);
        
      } else {
        console.log(`❌ ${concept.id}/100 Failed: Manager ${concept.id} - No image data`);
      }
      
    } catch (error) {
      console.log(`❌ ${concept.id}/100 Error: Manager ${concept.id} - ${error.response?.status || error.message}`);
    }
    
    // Delay between requests
    await new Promise(resolve => setTimeout(resolve, 4000)); // 4 second delay
  }
}

async function generateAllManagerAvatars() {
  const batchSize = 5; // Process 5 at a time
  
  console.log('👥 Starting generation of 100 manager avatars...');
  console.log(`📦 Processing in batches of ${batchSize} with 4-second delays`);
  
  for (let i = 0; i < managerAvatarConcepts.length; i += batchSize) {
    await generateManagerAvatarBatch(i, batchSize);
    
    // Longer break between batches
    if (i + batchSize < managerAvatarConcepts.length) {
      console.log('⏸️  Taking 8-second break between batches...');
      await new Promise(resolve => setTimeout(resolve, 8000));
    }
  }
  
  console.log('\n🎉 All manager avatars completed!');
  console.log('🔗 Check Firebase Storage for uploaded avatars');
  
  // Generate avatar list file
  await generateAvatarListFile();
}

async function generateAvatarListFile() {
  console.log('📝 Generating avatar list file...');
  
  const avatarList = managerAvatarConcepts.map(concept => ({
    id: concept.id,
    url: `https://storage.googleapis.com/fusion-fc.firebasestorage.app/manager-avatars/avatar-${concept.id.toString().padStart(3, '0')}-${concept.ethnicity}-${concept.age}.png`,
    style: concept.style,
    ethnicity: concept.ethnicity,
    age: concept.age
  }));
  
  const listContent = `// Manager Avatar List - Auto-generated
export const MANAGER_AVATARS = ${JSON.stringify(avatarList, null, 2)};

// Get random avatar
export function getRandomManagerAvatar() {
  return MANAGER_AVATARS[Math.floor(Math.random() * MANAGER_AVATARS.length)];
}

// Get avatar by demographics
export function getManagerAvatarByDemo(ethnicity = null, age = null) {
  let filtered = MANAGER_AVATARS;
  
  if (ethnicity) {
    filtered = filtered.filter(avatar => 
      avatar.ethnicity.toLowerCase().includes(ethnicity.toLowerCase())
    );
  }
  
  if (age) {
    filtered = filtered.filter(avatar => 
      avatar.age.includes(age)
    );
  }
  
  return filtered.length > 0 ? 
    filtered[Math.floor(Math.random() * filtered.length)] : 
    getRandomManagerAvatar();
}

// Get avatar by ID
export function getManagerAvatarById(id) {
  return MANAGER_AVATARS.find(avatar => avatar.id === id) || getRandomManagerAvatar();
}
`;

  const file = bucket.file('manager-avatars/avatar-list.js');
  await file.save(listContent, {
    metadata: {
      contentType: 'application/javascript',
      metadata: {
        description: 'Auto-generated list of manager avatars',
        totalAvatars: managerAvatarConcepts.length,
        generatedAt: new Date().toISOString()
      }
    }
  });
  
  await file.makePublic();
  console.log('✅ Avatar list file generated and uploaded!');
}

// Command line interface
const command = process.argv[2];
const batchNum = parseInt(process.argv[3]);

if (command === 'all') {
  generateAllManagerAvatars()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Manager avatar generation failed:', error);
      process.exit(1);
    });
} else if (command === 'batch' && !isNaN(batchNum)) {
  const startIndex = batchNum * 5;
  
  console.log(`Running batch ${batchNum + 1} (avatars ${startIndex + 1}-${Math.min(startIndex + 5, 100)})`);
  
  generateManagerAvatarBatch(startIndex, 5)
    .then(() => {
      console.log(`Batch ${batchNum + 1} completed!`);
      if (startIndex + 5 < 100) {
        console.log(`To continue, run: node generate-manager-avatars.js batch ${batchNum + 1}`);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('Batch failed:', error);
      process.exit(1);
    });
} else {
  console.log('Usage:');
  console.log('  node generate-manager-avatars.js all           # Generate all 100 avatars');
  console.log('  node generate-manager-avatars.js batch 0       # Generate first batch (1-5)');
  console.log('  node generate-manager-avatars.js batch 1       # Generate second batch (6-10)');
  console.log('  # ... etc');
}