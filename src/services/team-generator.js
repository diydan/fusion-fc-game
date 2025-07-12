import { getRandomColors } from '@/config/team-colors';
import { generateManagerProfile } from '@/services/manager-avatars';

// Team name components for futuristic robot teams
const prefixes = [
  'Cyber', 'Neon', 'Quantum', 'Fusion', 'Plasma', 
  'Digital', 'Hyper', 'Mega', 'Ultra', 'Techno',
  'Circuit', 'Binary', 'Nexus', 'Photon', 'Sonic'
];

const subjects = [
  'Hawks', 'Titans', 'Phoenix', 'Dragons', 'Knights', 
  'Rangers', 'Strikers', 'Thunder', 'Lightning', 'Storm',
  'Wolves', 'Eagles', 'Falcons', 'Raptors', 'Spartans'
];

const suffixes = [
  'FC', 'United', 'Robotics', 'Squad', 'Athletic', 
  'Sport', 'City', 'Dynamics', 'Force', 'Elite'
];

// Location-based subjects for when we have city data
const locationPatterns = [
  '{prefix} {city} {suffix}',
  '{city} {prefix} {suffix}',
  '{prefix} {city}',
  '{city} {subject} {suffix}'
];

export function generateTeamName(location = null) {
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const subject = subjects[Math.floor(Math.random() * subjects.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  if (location?.city) {
    // Use location-based pattern
    const pattern = locationPatterns[Math.floor(Math.random() * locationPatterns.length)];
    return pattern
      .replace('{prefix}', prefix)
      .replace('{city}', location.city)
      .replace('{subject}', subject)
      .replace('{suffix}', suffix);
  }
  
  // Random pattern without location
  const patterns = [
    `${prefix} ${subject} ${suffix}`,
    `${prefix} ${subject}`,
    `${subject} ${suffix}`,
    `${prefix} ${suffix}`
  ];
  
  return patterns[Math.floor(Math.random() * patterns.length)];
}

// Generate stadium data
function generateStadiumData(teamName) {
  const stadiumNames = [
    'Arena', 'Stadium', 'Field', 'Park', 'Dome', 'Complex', 
    'Ground', 'Colosseum', 'Amphitheater', 'Center'
  ];
  
  const stadiumName = `${teamName.split(' ')[0]} ${stadiumNames[Math.floor(Math.random() * stadiumNames.length)]}`;
  const capacity = Math.floor(Math.random() * 40000) + 20000; // 20k-60k capacity
  
  return {
    name: stadiumName,
    capacity,
    condition: Math.floor(Math.random() * 40) + 60, // 60-100% condition
    atmosphere: Math.floor(Math.random() * 30) + 70 // 70-100% atmosphere
  };
}

// Generate initial finances
function generateInitialFinances() {
  const budget = Math.floor(Math.random() * 5000000) + 1000000; // $1M-6M
  
  return {
    budget,
    revenue: Math.floor(budget * 0.3), // 30% of budget as monthly revenue
    expenses: Math.floor(budget * 0.25), // 25% of budget as monthly expenses
    transfers: Math.floor(budget * 0.5) // 50% available for transfers
  };
}

// Generate random location
function generateRandomLocation() {
  const cities = [
    'Neo Tokyo', 'Cyber City', 'New Angeles', 'Tech Valley', 'Digital Harbor',
    'Quantum Springs', 'Neon Heights', 'Circuit Bay', 'Binary Falls', 'Pixel Park',
    'Fusion Town', 'Nexus City', 'Photon Beach', 'Plasma Ridge', 'Sonic Hills'
  ];
  
  const regions = [
    'Northern Division', 'Southern League', 'Eastern Conference', 'Western Zone',
    'Central District', 'Coastal Region', 'Mountain League', 'Valley Division'
  ];
  
  return {
    city: cities[Math.floor(Math.random() * cities.length)],
    region: regions[Math.floor(Math.random() * regions.length)],
    country: 'Fusion Federation'
  };
}

export function generateRandomTeam(location = null, userPreferences = null) {
  const colors = getRandomColors();
  const name = generateTeamName(location);
  const manager = generateManagerProfile(userPreferences);
  
  // Generate initial team data
  const teamData = {
    id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    colors: {
      primary: colors.primary.hex,
      secondary: colors.secondary.hex,
      primaryName: colors.primary.name,
      secondaryName: colors.secondary.name
    },
    manager,
    stadium: generateStadiumData(name),
    finances: generateInitialFinances(),
    reputation: Math.floor(Math.random() * 50) + 25, // 25-75 starting reputation
    founded: new Date().getFullYear(),
    location: location || generateRandomLocation(),
    created: new Date().toISOString()
  };
  
  return teamData;
}

// Generate multiple team options
export function generateTeamOptions(count = 3, location = null) {
  const teams = [];
  const usedNames = new Set();
  
  while (teams.length < count) {
    const team = generateRandomTeam(location);
    
    // Ensure unique names
    if (!usedNames.has(team.name)) {
      usedNames.add(team.name);
      teams.push(team);
    }
  }
  
  return teams;
}

// Validate team name (for custom input)
export function validateTeamName(name) {
  if (!name || name.trim().length < 3) {
    return 'Team name must be at least 3 characters';
  }
  
  if (name.trim().length > 50) {
    return 'Team name must be less than 50 characters';
  }
  
  // Check for inappropriate content (basic filter)
  const inappropriateWords = ['hate', 'racist', 'sexist']; // Add more as needed
  const lowerName = name.toLowerCase();
  
  for (const word of inappropriateWords) {
    if (lowerName.includes(word)) {
      return 'Team name contains inappropriate content';
    }
  }
  
  return null; // Valid
}

// Format team name for display
export function formatTeamName(name) {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}