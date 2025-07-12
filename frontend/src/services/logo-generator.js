import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/config/firebase';
import { generateTeamLogoWithProxy } from './logo-generator-proxy';

const LOGO_API_URL = 'https://logogenerator-6unsift5pq-uc.a.run.app/';

export async function generateTeamLogo(teamName, colors, customPrompt = null) {
  // Use proxy function to handle CORS issues
  return generateTeamLogoWithProxy(teamName, colors, customPrompt);
}

// Original function for direct API calls (when CORS is fixed)
export async function generateTeamLogoDirect(teamName, colors, customPrompt = null) {
  try {
    // Default style for robotic soccer teams
    const defaultStyle = 'futuristic robotic soccer team logo, modern and dynamic, circuit patterns, technological elements';
    const style = customPrompt || defaultStyle;
    
    // Use color names if available, otherwise use hex values
    const colorDescription = colors.primaryName && colors.secondaryName 
      ? `${colors.primaryName} and ${colors.secondaryName}`
      : `${colors.primary} and ${colors.secondary}`;
    
    console.log('Generating logo for:', teamName, 'with colors:', colorDescription);
    
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
      tempLogoUrl: result.imageUrl, // Temporary URL from API
      prompt: `${teamName} - ${style} - Colors: ${colorDescription}`,
      metadata: result.metadata || {},
      error: null
    };
  } catch (error) {
    console.error('Logo generation error:', error);
    return {
      tempLogoUrl: null,
      prompt: null,
      metadata: {},
      error: error.message
    };
  }
}

export async function saveTeamLogo(teamId, tempLogoUrl) {
  try {
    console.log('Saving logo for team:', teamId, 'from URL:', tempLogoUrl);
    
    // Fetch the image from temporary URL
    const response = await fetch(tempLogoUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch logo: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    // Validate blob
    if (!blob || blob.size === 0) {
      throw new Error('Invalid image data received');
    }
    
    // Create storage reference
    const timestamp = Date.now();
    const filename = `logo-${timestamp}.png`;
    const storageRef = ref(storage, `team-logos/${teamId}/${filename}`);
    
    console.log('Uploading to Firebase Storage:', `team-logos/${teamId}/${filename}`);
    
    // Upload to Firebase Storage
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: 'image/png',
      customMetadata: {
        generatedAt: new Date().toISOString(),
        teamId: teamId
      }
    });
    
    // Get permanent download URL
    const permanentUrl = await getDownloadURL(snapshot.ref);
    
    console.log('Logo saved successfully:', permanentUrl);
    
    return {
      logoUrl: permanentUrl,
      storagePath: `team-logos/${teamId}/${filename}`,
      size: blob.size,
      error: null
    };
  } catch (error) {
    console.error('Logo save error:', error);
    return {
      logoUrl: null,
      storagePath: null,
      size: 0,
      error: error.message
    };
  }
}

// Generate multiple logo variations
export async function generateLogoVariations(teamName, colors, count = 3) {
  const variations = [
    null, // Use default prompt
    'minimalist geometric robot soccer emblem, clean lines',
    'aggressive robotic mascot with soccer ball, dynamic action pose',
    'abstract technological pattern forming team initials',
    'shield crest with futuristic robot elements'
  ];
  
  const results = [];
  const usedPrompts = new Set();
  
  for (let i = 0; i < count; i++) {
    let customPrompt = variations[i % variations.length];
    
    // Ensure we don't use the same prompt twice
    while (usedPrompts.has(customPrompt) && usedPrompts.size < variations.length) {
      customPrompt = variations[Math.floor(Math.random() * variations.length)];
    }
    
    usedPrompts.add(customPrompt);
    
    const result = await generateTeamLogo(teamName, colors, customPrompt);
    results.push(result);
    
    // Add small delay to avoid rate limiting
    if (i < count - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

// Fallback logo generator (uses initials and colors)
export function generateFallbackLogo(teamName, colors) {
  // Extract initials from team name
  const initials = teamName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);
  
  // Create SVG logo
  const svg = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" fill="url(#grad1)" rx="64" />
      <text x="256" y="320" font-family="Arial, sans-serif" font-size="180" font-weight="bold" 
            text-anchor="middle" fill="white" stroke="black" stroke-width="4">
        ${initials}
      </text>
    </svg>
  `;
  
  // Convert SVG to data URL
  const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
  
  return {
    tempLogoUrl: dataUrl,
    prompt: 'Fallback logo generated from initials',
    isFallback: true,
    error: null
  };
}