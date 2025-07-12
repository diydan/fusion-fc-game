# Logo Generation with Firebase Genkit

This Firebase Functions project now includes AI-powered logo generation using Firebase Genkit with multiple AI providers.

## Features

- **Multi-Provider Support**: Uses OpenAI DALL-E 3 and Google Vertex AI Imagen
- **Intelligent Prompting**: Generates detailed design prompts using Gemini
- **Fallback System**: Automatically tries alternative provider if one fails
- **RESTful API**: HTTP endpoint for easy integration
- **Genkit Flow**: Structured flow for testing and development

## Setup Instructions

### 1. Install Dependencies
```bash
cd functions
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```

Edit the `.env` file and add your API keys:
```env
OPENAI_API_KEY=your_openai_api_key_here
GCLOUD_PROJECT=your_google_cloud_project_id
```

### 3. Set up API Keys

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add it to your `.env` file

#### Google Cloud Project
1. Make sure your Firebase project has Google Cloud services enabled
2. Enable the Vertex AI API in your Google Cloud Console
3. Your project ID should be the same as your Firebase project ID

### 4. Build and Deploy

#### For Local Development
```bash
# Build the functions
npm run build

# Start the Firebase emulator
firebase emulators:start --only functions

# Test the function (in another terminal)
node test-logo.js
```

#### For Production
```bash
# Deploy to Firebase
firebase deploy --only functions
```

## Usage

### HTTP API Endpoint

**POST** `/logoGenerator`

Request body:
```json
{
  "businessName": "Your Business Name",
  "businessType": "Type of business (e.g., restaurant, tech company)",
  "style": "modern and professional", // optional
  "colors": "blue and white", // optional
  "provider": "openai" // optional: "openai" or "vertexai"
}
```

Response:
```json
{
  "imageUrl": "https://...",
  "prompt": "Detailed prompt used for generation",
  "provider": "openai"
}
```

### Genkit Flow

You can also use the Genkit flow directly:

```typescript
import { generateLogo } from './functions/src/index.js';

const result = await generateLogo({
  businessName: "Fusion FC",
  businessType: "Gaming/Sports",
  style: "modern and dynamic",
  colors: "blue and orange"
});
```

## Testing

### Local Testing
1. Start the Firebase emulator: `firebase emulators:start --only functions`
2. Run the test script: `node test-logo.js`
3. Check the console output for the generated logo URL

### Genkit Dev UI
```bash
# Install Genkit CLI globally
npm install -g genkit-cli

# Start the Genkit development server
genkit start
```

This opens a web interface where you can test your flows interactively.

## API Examples

### cURL Example
```bash
curl -X POST https://your-region-your-project.cloudfunctions.net/logoGenerator \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Fusion FC",
    "businessType": "Gaming/Sports",
    "style": "modern and dynamic",
    "colors": "blue and orange",
    "provider": "openai"
  }'
```

### JavaScript Example
```javascript
const response = await fetch('https://your-region-your-project.cloudfunctions.net/logoGenerator', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    businessName: 'Fusion FC',
    businessType: 'Gaming/Sports',
    style: 'modern and dynamic',
    colors: 'blue and orange',
    provider: 'openai'
  })
});

const result = await response.json();
console.log('Generated logo URL:', result.imageUrl);
```

## Troubleshooting

### Common Issues

1. **API Key Errors**: Make sure your API keys are correctly set in the environment variables
2. **Provider Failures**: The system automatically falls back to the alternative provider
3. **Image URL Issues**: Some providers return different URL formats - the function handles this automatically
4. **Timeout Issues**: Large image generation requests may take time - consider increasing function timeout

### Debugging

Check the Firebase Functions logs:
```bash
firebase functions:log
```

Or use the Firebase Console to view logs in real-time.

## Cost Considerations

- OpenAI DALL-E 3: ~$0.040 per image (1024x1024)
- Google Vertex AI Imagen: Pricing varies by region and usage
- Gemini (for prompt generation): Very low cost for text generation

## Next Steps

1. Add image storage to Firebase Storage
2. Implement user authentication
3. Add logo variation generation
4. Create a web interface for logo generation
5. Add logo templates and customization options
