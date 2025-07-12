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
// Storage imports removed for now - can be added later if needed
// import {getStorage} from "firebase-admin/storage";
// import {initializeApp} from "firebase-admin/app";

// Initialize Genkit with AI providers
const ai = genkit({
  plugins: [
    vertexAI({projectId: "fusion-fc", location: "us-central1"}),
  ],
});

// Enable Firebase telemetry
enableFirebaseTelemetry();

// Note: Storage functionality can be added later when needed
// For now, we'll just return the direct AI provider URLs

// Logo generation helper function
const generateLogoImage = async (prompt: string) => {
  try {
    // Use Vertex AI Imagen
    return await ai.generate({
      model: imagen3,
      prompt: prompt,
      config: {
        width: 1024,
        height: 1024,
      },
    });
  } catch (error) {
    logger.error("Error generating logo with Vertex AI:", error);
    throw error;
  }
};

// Generate logo prompt using Gemini
const generateLogoPrompt = async (
  businessName: string,
  businessType: string,
  style?: string,
  colors?: string
) => {
  const promptText = [
    "Create a detailed logo design prompt for a business with the following details:",
    `- Business Name: ${businessName}`,
    `- Business Type: ${businessType}`,
    `- Style: ${style || "modern and professional"}`,
    `- Colors: ${colors || "use appropriate colors for the business type"}`,
    "",
    "Generate a concise but detailed prompt that would create a professional logo.",
    "Include specific visual elements, typography suggestions, and design principles.",
    "The prompt should be suitable for AI image generation.",
  ].join("\n");

  try {
    const result = await ai.generate({
      model: "gemini-1.5-flash",
      prompt: promptText,
    });
    return result.text;
  } catch (error) {
    logger.error("Error generating logo prompt:", error);
    // Fallback to a basic prompt
    return `Professional logo design for ${businessName}, ` +
      `a ${businessType} business. ` +
      `${style ? `Style: ${style}.` : "Modern and clean design."} ` +
      `${colors ? `Colors: ${colors}.` : "Use appropriate brand colors."} ` +
      "High quality, vector-style, suitable for business use.";
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

      const {businessName, businessType, style, colors} = request.body;

      if (!businessName || !businessType) {
        response.status(400).send("Business name and type are required");
        return;
      }

      // Generate the logo prompt
      const logoPrompt = await generateLogoPrompt(
        businessName,
        businessType,
        style,
        colors
      );
      logger.info(`Generated logo prompt: ${logoPrompt}`);

      // Generate image with Vertex AI
      const imageResult = await generateLogoImage(logoPrompt);

      // Extract image URL from the result
      const imageUrl = imageResult.media?.url || imageResult.output?.url ||
                      (imageResult.media && Array.isArray(imageResult.media) &&
                       imageResult.media[0]?.url);

      if (!imageUrl) {
        throw new Error("No image URL returned from AI provider");
      }

      const result = {
        imageUrl,
        prompt: logoPrompt,
        provider: "vertexai",
      };

      // Note: Storage functionality can be added later when needed

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
