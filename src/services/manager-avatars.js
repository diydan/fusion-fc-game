// Manager Avatar Service
// Default avatars while the full collection loads

const DEFAULT_AVATARS = [
  {
    id: 1,
    url: "https://storage.googleapis.com/fusion-fc.firebasestorage.app/manager-avatars/avatar-001-caucasian-40s.png",
    style: "professional male soccer manager, suit and tie, confident expression",
    ethnicity: "caucasian",
    age: "40s"
  },
  {
    id: 31,
    url: "https://storage.googleapis.com/fusion-fc.firebasestorage.app/manager-avatars/avatar-031-caucasian-35s.png", 
    style: "professional female soccer manager, blazer, confident smile",
    ethnicity: "caucasian",
    age: "35s"
  },
  {
    id: 61,
    url: "https://storage.googleapis.com/fusion-fc.firebasestorage.app/manager-avatars/avatar-061-mixed-25s.png",
    style: "young prodigy manager, genius expression, brilliant",
    ethnicity: "mixed", 
    age: "25s"
  },
  {
    id: 81,
    url: "https://storage.googleapis.com/fusion-fc.firebasestorage.app/manager-avatars/avatar-081-european-65s.png",
    style: "legendary veteran manager, silver hair, iconic",
    ethnicity: "european",
    age: "65s"
  }
];

// Full avatar list will be populated from Firebase when available
let MANAGER_AVATARS = [...DEFAULT_AVATARS];
let avatarsLoaded = false;

// Load full avatar list from Firebase
async function loadManagerAvatars() {
  if (avatarsLoaded) return MANAGER_AVATARS;
  
  try {
    const response = await fetch('https://storage.googleapis.com/fusion-fc.firebasestorage.app/manager-avatars/avatar-list.js');
    if (response.ok) {
      const avatarListCode = await response.text();
      
      // Extract the JSON data from the JS file
      const jsonMatch = avatarListCode.match(/export const MANAGER_AVATARS = (\[[\s\S]*?\]);/);
      if (jsonMatch) {
        const avatarData = JSON.parse(jsonMatch[1]);
        MANAGER_AVATARS = avatarData;
        avatarsLoaded = true;
        console.log(`✅ Loaded ${MANAGER_AVATARS.length} manager avatars`);
      }
    }
  } catch (error) {
    console.warn('Failed to load full avatar list, using defaults:', error);
  }
  
  return MANAGER_AVATARS;
}

// Get random avatar
export function getRandomManagerAvatar() {
  return MANAGER_AVATARS[Math.floor(Math.random() * MANAGER_AVATARS.length)];
}

// Get avatar by demographics
export function getManagerAvatarByDemo(preferences = {}) {
  const { ethnicity, age, gender } = preferences;
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
  
  if (gender) {
    filtered = filtered.filter(avatar => 
      avatar.style.toLowerCase().includes(gender.toLowerCase())
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

// Get fallback avatar (guaranteed to work)
export function getFallbackManagerAvatar() {
  return DEFAULT_AVATARS[0]; // Always return first default avatar as ultimate fallback
}

// Get avatar for user (with fallback logic)
export function getManagerAvatarForUser(user = null) {
  // If user has a custom avatar, use it
  if (user?.avatar?.url) {
    return {
      id: 'custom',
      url: user.avatar.url,
      style: 'custom user avatar',
      ethnicity: 'custom',
      age: 'custom'
    };
  }
  
  // If user has preferences, try to match them
  if (user?.preferences) {
    return getManagerAvatarByDemo(user.preferences);
  }
  
  // Otherwise return random
  return getRandomManagerAvatar();
}

// Generate manager profile with avatar
export function generateManagerProfile(userPreferences = null) {
  const avatar = userPreferences ? 
    getManagerAvatarByDemo(userPreferences) : 
    getRandomManagerAvatar();
  
  // Generate some basic manager stats
  const experience = Math.floor(Math.random() * 20) + 1; // 1-20 years
  const reputation = Math.floor(Math.random() * 100) + 1; // 1-100
  
  const managerNames = [
    'Alex Thompson', 'Jordan Rivera', 'Casey Martinez', 'Taylor Chen',
    'Morgan Williams', 'Riley Anderson', 'Sage Johnson', 'Quinn Davis',
    'Phoenix Garcia', 'River Wilson', 'Skylar Brown', 'Rowan Miller',
    'Avery Moore', 'Cameron White', 'Dakota Lee', 'Emery Clark'
  ];
  
  const name = managerNames[Math.floor(Math.random() * managerNames.length)];
  
  return {
    id: `manager_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    avatar,
    experience,
    reputation,
    specialties: generateSpecialties(),
    personality: generatePersonality(),
    created: new Date().toISOString()
  };
}

function generateSpecialties() {
  const allSpecialties = [
    'Attack', 'Defense', 'Midfield', 'Youth Development', 'Fitness',
    'Tactics', 'Mental Coaching', 'Set Pieces', 'Pressing', 'Counter-Attack'
  ];
  
  const numSpecialties = Math.floor(Math.random() * 3) + 2; // 2-4 specialties
  const shuffled = allSpecialties.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numSpecialties);
}

function generatePersonality() {
  const personalities = [
    'Motivational', 'Tactical', 'Disciplined', 'Creative', 'Calm',
    'Passionate', 'Analytical', 'Charismatic', 'Demanding', 'Supportive'
  ];
  
  return personalities[Math.floor(Math.random() * personalities.length)];
}

// Initialize avatar loading
loadManagerAvatars();

export { loadManagerAvatars, MANAGER_AVATARS };