/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

// Genkit imports
import {genkit} from "genkit";
import {enableFirebaseTelemetry} from "@genkit-ai/firebase";
import {vertexAI, imagen3} from "@genkit-ai/vertexai";
import {openAI, dallE3} from "genkitx-openai";
import {getStorage} from "firebase-admin/storage";
import {initializeApp} from "firebase-admin/app";

// Initialize Genkit with AI providers
const ai = genkit({
  plugins: [
    vertexAI({projectId: process.env.GCLOUD_PROJECT, location: "us-central1"}),
    openAI({apiKey: process.env.OPENAI_API_KEY}),
  ],
});

// Initialize Firebase Admin
const app = initializeApp();
const storage = getStorage(app);

// Enable Firebase telemetry
enableFirebaseTelemetry();

// Helper function to save logo to Firebase Storage
const saveLogoToStorage = async (userId: string, logoUrl: string, logoData: any) => {
  try {
    const response = await fetch(logoUrl);
    if (!response.ok) {
      throw new Error(`Failed to download logo: ${response.statusText}`);
    }
    
    const logoBuffer = await response.arrayBuffer();
    const timestamp = Date.now();
    const fileName = `logo_${timestamp}_${logoData.businessName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    const filePath = `generated-logos/${userId}/${fileName}`;
    
    const bucket = storage.bucket();
    const file = bucket.file(filePath);
    
    await file.save(Buffer.from(logoBuffer), {
      metadata: {
        contentType: 'image/png',
        metadata: {
          businessName: logoData.businessName,
          businessType: logoData.businessType,
          style: logoData.style || '',
          colors: logoData.colors || '',
          provider: logoData.provider,
          prompt: logoData.prompt,
          generatedAt: new Date().toISOString()
        }
      }
    });
    
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-09-2491' // Far future date
    });
    
    return { storageUrl: url, storagePath: filePath, error: null };
  } catch (error) {
    logger.error('Error saving logo to storage:', error);
    return { storageUrl: null, storagePath: null, error: error.message };
  }
};

// Logo generation helper function
const generateLogoImage = async (prompt: string, provider: string = "openai") => {
  try {
    if (provider === "vertexai") {
      // Use Vertex AI Imagen
      return await ai.generate({
        model: imagen3,
        prompt: prompt,
        config: {
          width: 1024,
          height: 1024,
          seed: Math.floor(Math.random() * 1000000),
        },
      });
    } else {
      // Use OpenAI DALL-E 3
      return await ai.generate({
        model: dallE3,
        prompt: prompt,
        config: {
          size: "1024x1024",
          quality: "standard",
        },
      });
    }
  } catch (error) {
    logger.error(`Error generating logo with ${provider}:`, error);
    throw error;
  }
};

// Generate logo prompt using Gemini
const generateLogoPrompt = async (businessName: string, businessType: string, style?: string, colors?: string) => {
  const promptText = `Create a detailed logo design prompt for a business with the following details:
  - Business Name: ${businessName}
  - Business Type: ${businessType}
  - Style: ${style || "modern and professional"}
  - Colors: ${colors || "use appropriate colors for the business type"}
  
  Generate a concise but detailed prompt that would create a professional logo. Include specific visual elements, typography suggestions, and design principles. The prompt should be suitable for AI image generation.`;
  
  try {
    const result = await ai.generate({
      model: "gemini-1.5-flash",
      prompt: promptText,
    });
    return result.text;
  } catch (error) {
    logger.error("Error generating logo prompt:", error);
    // Fallback to a basic prompt
    return `Professional logo design for ${businessName}, a ${businessType} business. ${style ? `Style: ${style}.` : "Modern and clean design."} ${colors ? `Colors: ${colors}.` : "Use appropriate brand colors."} High quality, vector-style, suitable for business use.`;
  }
};

// HTTP endpoint for logo generation
export const logoGenerator = onRequest(
  {cors: true},
  async (request, response) => {
    try {
      if (request.method !== "POST") {
        response.status(405).send("Method not allowed");
        return;
      }

      const {businessName, businessType, style, colors, provider = "openai", userId, saveToStorage = false} = request.body;

      if (!businessName || !businessType) {
        response.status(400).send("Business name and type are required");
        return;
      }

      if (saveToStorage && !userId) {
        response.status(400).send("User ID is required when saving to storage");
        return;
      }

      // Generate the logo prompt
      const logoPrompt = await generateLogoPrompt(businessName, businessType, style, colors);
      logger.info(`Generated logo prompt: ${logoPrompt}`);

      let imageResult;
      let providerUsed = provider;

      try {
        // Try to generate with the requested provider
        imageResult = await generateLogoImage(logoPrompt, provider);
      } catch (error) {
        logger.error(`Error generating logo with ${provider}:`, error);
        
        // Fallback to the other provider
        const fallbackProvider = provider === "openai" ? "vertexai" : "openai";
        logger.info(`Falling back to ${fallbackProvider}`);
        
        try {
          imageResult = await generateLogoImage(logoPrompt, fallbackProvider);
          providerUsed = fallbackProvider;
        } catch (fallbackError) {
          logger.error(`Fallback provider also failed:`, fallbackError);
          throw new Error(`Both AI providers failed to generate the logo`);
        }
      }

      // Extract image URL from the result
      const imageUrl = imageResult.media?.url || imageResult.output?.url || 
                      (imageResult.media && Array.isArray(imageResult.media) && imageResult.media[0]?.url);
      
      if (!imageUrl) {
        throw new Error("No image URL returned from AI provider");
      }

      const result = {
        imageUrl,
        prompt: logoPrompt,
        provider: providerUsed,
      };

      // Optionally save to Firebase Storage
      if (saveToStorage && userId) {
        const storageResult = await saveLogoToStorage(userId, imageUrl, {
          businessName,
          businessType,
          style,
          colors,
          provider: providerUsed,
          prompt: logoPrompt
        });
        
        if (storageResult.error) {
          logger.warn('Failed to save logo to storage:', storageResult.error);
        } else {
          result.storageUrl = storageResult.storageUrl;
          result.storagePath = storageResult.storagePath;
        }
      }

      response.json(result);
    } catch (error) {
      logger.error("Error in logo generation:", error);
      response.status(500).json({
        error: "Failed to generate logo",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
