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
import {genkit, z} from "genkit";
import {firebase} from "@genkit-ai/firebase";
import {vertexAI, imagen3} from "@genkit-ai/vertexai";
import {openAI, dalle3} from "genkitx-openai";
import {generate} from "@genkit-ai/ai";

// Initialize Genkit with Firebase and AI providers
const ai = genkit({
  plugins: [
    firebase(),
    vertexAI({projectId: process.env.GCLOUD_PROJECT}),
    openAI({apiKey: process.env.OPENAI_API_KEY}),
  ],
});

// Logo generation flow
export const generateLogo = ai.defineFlow(
  {
    name: "generateLogo",
    inputSchema: z.object({
      businessName: z.string().describe("The name of the business"),
      businessType: z.string().describe("Type of business (e.g., restaurant, tech company, etc.)"),
      style: z.string().optional().describe("Logo style (e.g., modern, vintage, minimalist)"),
      colors: z.string().optional().describe("Preferred colors"),
      provider: z.enum(["openai", "vertexai"]).optional().default("openai"),
    }),
    outputSchema: z.object({
      imageUrl: z.string().describe("URL of the generated logo"),
      prompt: z.string().describe("The prompt used to generate the logo"),
      provider: z.string().describe("AI provider used"),
    }),
  },
  async (input) => {
    // Generate a detailed logo design prompt
    const promptGeneration = await generate({
      model: "gemini-1.5-flash",
      prompt: `Create a detailed logo design prompt for a business with the following details:
      - Business Name: ${input.businessName}
      - Business Type: ${input.businessType}
      - Style: ${input.style || "modern and professional"}
      - Colors: ${input.colors || "use appropriate colors for the business type"}
      
      Generate a concise but detailed prompt that would create a professional logo. Include specific visual elements, typography suggestions, and design principles. The prompt should be suitable for AI image generation.`,
    });

    const logoPrompt = promptGeneration.text;
    
    logger.info(`Generated logo prompt: ${logoPrompt}`);

    let imageResult;
    let providerUsed = input.provider;

    try {
      if (input.provider === "vertexai") {
        // Use Vertex AI Imagen
        imageResult = await generate({
          model: imagen3,
          prompt: logoPrompt,
          config: {
            width: 1024,
            height: 1024,
            seed: Math.floor(Math.random() * 1000000),
          },
        });
      } else {
        // Use OpenAI DALL-E 3
        imageResult = await generate({
          model: dalle3,
          prompt: logoPrompt,
          config: {
            size: "1024x1024",
            quality: "standard",
          },
        });
      }
    } catch (error) {
      logger.error(`Error generating logo with ${input.provider}:`, error);
      
      // Fallback to the other provider
      const fallbackProvider = input.provider === "openai" ? "vertexai" : "openai";
      logger.info(`Falling back to ${fallbackProvider}`);
      
      try {
        if (fallbackProvider === "vertexai") {
          imageResult = await generate({
            model: imagen3,
            prompt: logoPrompt,
            config: {
              width: 1024,
              height: 1024,
              seed: Math.floor(Math.random() * 1000000),
            },
          });
        } else {
          imageResult = await generate({
            model: dalle3,
            prompt: logoPrompt,
            config: {
              size: "1024x1024",
              quality: "standard",
            },
          });
        }
        providerUsed = fallbackProvider;
      } catch (fallbackError) {
        logger.error(`Fallback provider also failed:`, fallbackError);
        throw new Error(`Both AI providers failed to generate the logo`);
      }
    }

    // Extract image URL from the result
    const imageUrl = imageResult.media?.[0]?.url || imageResult.output?.url;
    
    if (!imageUrl) {
      throw new Error("No image URL returned from AI provider");
    }

    return {
      imageUrl,
      prompt: logoPrompt,
      provider: providerUsed,
    };
  }
);

// HTTP endpoint for logo generation
export const logoGenerator = onRequest(
  {cors: true},
  async (request, response) => {
    try {
      if (request.method !== "POST") {
        response.status(405).send("Method not allowed");
        return;
      }

      const {businessName, businessType, style, colors, provider} = request.body;

      if (!businessName || !businessType) {
        response.status(400).send("Business name and type are required");
        return;
      }

      const result = await generateLogo({
        businessName,
        businessType,
        style,
        colors,
        provider,
      });

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
