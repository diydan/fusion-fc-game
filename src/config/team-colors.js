export const TEAM_COLORS = [
  { name: 'Electric Blue', hex: '#00D4FF' },
  { name: 'Neon Green', hex: '#39FF14' },
  { name: 'Cyber Purple', hex: '#9D00FF' },
  { name: 'Plasma Orange', hex: '#FF6B00' },
  { name: 'Chrome Silver', hex: '#C0C0C0' },
  { name: 'Hologram Pink', hex: '#FF10F0' },
  { name: 'Quantum Red', hex: '#FF073A' },
  { name: 'Digital Gold', hex: '#FFD700' },
  { name: 'Matrix Black', hex: '#0A0A0A' },
  { name: 'Laser White', hex: '#F8F8FF' },
  { name: 'Fusion Yellow', hex: '#FFEA00' },
  { name: 'Titanium Grey', hex: '#71797E' },
  { name: 'Energy Teal', hex: '#00CED1' },
  { name: 'Voltage Violet', hex: '#8B00FF' },
  { name: 'Circuit Brown', hex: '#964B00' },
  { name: 'Neon Navy', hex: '#002FA7' }
];

// Get random two colors (ensuring they're different and have good contrast)
export function getRandomColors() {
  const shuffled = [...TEAM_COLORS].sort(() => 0.5 - Math.random());
  
  // Ensure we don't pick two very similar colors
  let primary = shuffled[0];
  let secondary = shuffled[1];
  
  // If colors are too similar, pick another
  if (isColorsTooSimilar(primary.hex, secondary.hex)) {
    secondary = shuffled[2] || shuffled[3];
  }
  
  return {
    primary,
    secondary
  };
}

// Helper function to check if colors are too similar
function isColorsTooSimilar(color1, color2) {
  // Convert hex to RGB
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  // Calculate color difference
  const diff = Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
  
  // If difference is less than 100, colors are too similar
  return diff < 100;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Get color by hex value
export function getColorByHex(hex) {
  return TEAM_COLORS.find(color => color.hex.toLowerCase() === hex.toLowerCase());
}

// Get contrasting text color for a background
export function getContrastingTextColor(backgroundColor) {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return '#FFFFFF';
  
  // Calculate luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  
  // Return white for dark colors, black for light colors
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}