// Development proxy for logo generation to avoid CORS issues
// In production, the Firebase Function should have proper CORS headers

const LOGO_API_URL = 'https://logogenerator-6unsift5pq-uc.a.run.app/';
const PROXY_API_URL = '/api/logo-generator';

// For development, we'll use a local proxy or direct fetch with no-cors mode
export async function generateTeamLogoWithProxy(teamName, colors, customPrompt = null) {
  try {
    // Default style for robotic soccer teams
    const defaultStyle = 'futuristic robotic soccer team logo, modern and dynamic, circuit patterns, technological elements';
    const style = customPrompt || defaultStyle;
    
    // Use color names if available, otherwise use hex values
    const colorDescription = colors.primaryName && colors.secondaryName 
      ? `${colors.primaryName} and ${colors.secondaryName}`
      : `${colors.primary} and ${colors.secondary}`;
    
    console.log('Generating logo for:', teamName, 'with colors:', colorDescription);
    
    // Try direct endpoint first (in case CORS is fixed)
    try {
      console.log('Trying direct endpoint...');
      const response = await fetch(LOGO_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: teamName,
          businessType: 'Gaming/Sports Team',
          style: style,
          colors: colorDescription
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.imageUrl) {
          console.log('Logo generated successfully via direct endpoint!');
          return {
            tempLogoUrl: result.imageUrl,
            prompt: `${teamName} - ${style} - Colors: ${colorDescription}`,
            metadata: result.metadata || {},
            error: null
          };
        }
      }
    } catch (directError) {
      console.warn('Direct endpoint failed:', directError.message);
    }
    
    // For development, try the proxy endpoint as fallback
    if (import.meta.env.DEV) {
      try {
        console.log('Trying local proxy endpoint...');
        const response = await fetch(PROXY_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessName: teamName,
            businessType: 'Gaming/Sports Team',
            style: style,
            colors: colorDescription
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.imageUrl) {
            console.log('Logo generated successfully via proxy!');
            return {
              tempLogoUrl: result.imageUrl,
              prompt: `${teamName} - ${style} - Colors: ${colorDescription}`,
              metadata: result.metadata || {},
              error: null
            };
          }
        }
      } catch (proxyError) {
        console.warn('Proxy failed, using fallback:', proxyError.message);
      }
      
      // If proxy fails, use fallback
      console.warn('Using fallback logo generation for development.');
      return {
        tempLogoUrl: generatePlaceholderLogo(teamName, colors),
        prompt: `${teamName} - ${style} - Colors: ${colorDescription}`,
        metadata: { fallback: true },
        error: null
      };
    }
    
    // Production code - should work with proper CORS headers
    const response = await fetch(LOGO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: teamName,
        businessType: 'Gaming/Sports Team',
        style: style,
        colors: colorDescription
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Logo generation failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    
    if (!result.imageUrl) {
      throw new Error('No image URL returned from API');
    }
    
    return {
      tempLogoUrl: result.imageUrl,
      prompt: `${teamName} - ${style} - Colors: ${colorDescription}`,
      metadata: result.metadata || {},
      error: null
    };
  } catch (error) {
    console.error('Logo generation error:', error);
    
    // If CORS error, use fallback
    if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
      console.warn('CORS error detected. Using fallback logo.');
      return {
        tempLogoUrl: generatePlaceholderLogo(teamName, colors),
        prompt: 'Fallback logo due to CORS',
        metadata: { fallback: true },
        error: 'CORS issue - using fallback logo'
      };
    }
    
    return {
      tempLogoUrl: null,
      prompt: null,
      metadata: {},
      error: error.message
    };
  }
}

// Generate a high-quality placeholder logo
function generatePlaceholderLogo(teamName, colors) {
  // Extract initials from team name
  const words = teamName.split(' ');
  const initials = words
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);
  
  // Create a more sophisticated SVG logo
  const svg = `
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
        </filter>
        <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="none"/>
          <circle cx="10" cy="10" r="2" fill="${colors.secondary}" opacity="0.3"/>
          <circle cx="90" cy="10" r="2" fill="${colors.secondary}" opacity="0.3"/>
          <circle cx="10" cy="90" r="2" fill="${colors.secondary}" opacity="0.3"/>
          <circle cx="90" cy="90" r="2" fill="${colors.secondary}" opacity="0.3"/>
          <line x1="10" y1="10" x2="90" y2="10" stroke="${colors.secondary}" stroke-width="1" opacity="0.2"/>
          <line x1="10" y1="90" x2="90" y2="90" stroke="${colors.secondary}" stroke-width="1" opacity="0.2"/>
        </pattern>
      </defs>
      
      <!-- Background -->
      <rect width="1024" height="1024" fill="url(#bg-gradient)" rx="128" />
      
      <!-- Circuit pattern overlay -->
      <rect width="1024" height="1024" fill="url(#circuit)" rx="128" />
      
      <!-- Hexagon shape -->
      <path d="M 512 200 L 712 312 L 712 512 L 512 624 L 312 512 L 312 312 Z" 
            fill="none" 
            stroke="white" 
            stroke-width="8" 
            opacity="0.3" />
      
      <!-- Soccer ball icon -->
      <g transform="translate(512, 400)">
        <circle cx="0" cy="0" r="80" fill="white" opacity="0.2"/>
        <path d="M -30,-50 L 30,-50 L 50,0 L 30,50 L -30,50 L -50,0 Z" 
              fill="white" 
              opacity="0.3"/>
      </g>
      
      <!-- Team initials -->
      <text x="512" y="580" 
            font-family="Arial Black, sans-serif" 
            font-size="220" 
            font-weight="900" 
            text-anchor="middle" 
            fill="white" 
            filter="url(#shadow)"
            letter-spacing="-10">
        ${initials}
      </text>
      
      <!-- Team name -->
      <text x="512" y="720" 
            font-family="Arial, sans-serif" 
            font-size="48" 
            font-weight="bold" 
            text-anchor="middle" 
            fill="white" 
            opacity="0.8">
        ${teamName.toUpperCase()}
      </text>
      
      <!-- Tech elements -->
      <circle cx="200" cy="200" r="4" fill="white" opacity="0.6"/>
      <circle cx="824" cy="200" r="4" fill="white" opacity="0.6"/>
      <circle cx="200" cy="824" r="4" fill="white" opacity="0.6"/>
      <circle cx="824" cy="824" r="4" fill="white" opacity="0.6"/>
    </svg>
  `;
  
  // Convert SVG to data URL
  const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  
  return dataUrl;
}