import { getRandomColors } from '@/config/team-colors';

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

export function generateRandomTeam(location = null) {
  const colors = getRandomColors();
  const name = generateTeamName(location);
  
  return {
    name,
    colors: {
      primary: colors.primary.hex,
      secondary: colors.secondary.hex,
      primaryName: colors.primary.name,
      secondaryName: colors.secondary.name
    }
  };
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