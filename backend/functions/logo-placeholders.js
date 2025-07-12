// Logo placeholder utility for frontend
const LOGO_PLACEHOLDERS = [
  {
    id: 1,
    name: "Phoenix FC",
    url: "https://storage.googleapis.com/fusion-fc.firebasestorage.app/soccer-logo-placeholders/logo-01-phoenix-fc.png",
    colors: "red and orange flames"
  },
  {
    id: 3,
    name: "Royal Lions", 
    url: "https://storage.googleapis.com/fusion-fc.firebasestorage.app/soccer-logo-placeholders/logo-03-royal-lions.png",
    colors: "gold and deep purple"
  },
  {
    id: 4,
    name: "Steel Eagles",
    url: "https://storage.googleapis.com/fusion-fc.firebasestorage.app/soccer-logo-placeholders/logo-04-steel-eagles.png", 
    colors: "metallic steel and black"
  },
  {
    id: 9,
    name: "Ice Bears",
    url: "https://storage.googleapis.com/fusion-fc.firebasestorage.app/soccer-logo-placeholders/logo-09-ice-bears.png",
    colors: "ice blue and pure white"
  },
  {
    id: 10,
    name: "Desert Scorpions",
    url: "https://storage.googleapis.com/fusion-fc.firebasestorage.app/soccer-logo-placeholders/logo-10-desert-scorpions.png",
    colors: "sandy beige and black"
  }
  // Add more as they get generated...
];

// Function to get a random placeholder
function getRandomPlaceholder() {
  const randomIndex = Math.floor(Math.random() * LOGO_PLACEHOLDERS.length);
  return LOGO_PLACEHOLDERS[randomIndex];
}

// Function to get placeholder by team style/colors (optional matching)
function getMatchingPlaceholder(teamColors, teamStyle) {
  // Simple color matching logic
  const colorKeywords = (teamColors || '').toLowerCase();
  const styleKeywords = (teamStyle || '').toLowerCase();
  
  // Try to find a somewhat matching placeholder
  const matchingLogos = LOGO_PLACEHOLDERS.filter(logo => {
    const logoColors = logo.colors.toLowerCase();
    const logoName = logo.name.toLowerCase();
    
    // Check for color matches
    if (colorKeywords.includes('red') && logoColors.includes('red')) return true;
    if (colorKeywords.includes('blue') && logoColors.includes('blue')) return true;
    if (colorKeywords.includes('gold') && logoColors.includes('gold')) return true;
    if (colorKeywords.includes('black') && logoColors.includes('black')) return true;
    if (colorKeywords.includes('orange') && logoColors.includes('orange')) return true;
    
    // Check for style matches
    if (styleKeywords.includes('eagle') && logoName.includes('eagle')) return true;
    if (styleKeywords.includes('lion') && logoName.includes('lion')) return true;
    if (styleKeywords.includes('phoenix') && logoName.includes('phoenix')) return true;
    if (styleKeywords.includes('bear') && logoName.includes('bear')) return true;
    
    return false;
  });
  
  // Return matching logo or random fallback
  return matchingLogos.length > 0 ? 
    matchingLogos[Math.floor(Math.random() * matchingLogos.length)] : 
    getRandomPlaceholder();
}

// Export for use in frontend
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LOGO_PLACEHOLDERS, getRandomPlaceholder, getMatchingPlaceholder };
}