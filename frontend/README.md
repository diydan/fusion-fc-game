# Fusion FC Game
Chiliz Hackathon 2025

A mobile-first Vue 3 + Vuetify 3 football game application with Firebase backend and Web3 integration built with Vite


## Prerequisites

- Node.js (v16 or higher)
- pnpm (v8 or higher)
- Firebase project with Authentication, Firestore, and Storage enabled
- MetaMask browser extension (for Web3 features)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fusion-fc-game
```

2. Install pnpm (if not already installed):
```bash
npm install -g pnpm
```

3. Install dependencies:
```bash
pnpm install
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your Firebase and Chiliz configuration
```

5. Deploy Firestore security rules:
```bash
firebase deploy --only firestore:rules
```

## Development

Run the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Build

Build for production:

```bash
pnpm build
```

The production-ready files will be generated in the `dist` directory.

## Preview Production Build

Preview the production build locally:

```bash
pnpm preview
```

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint to check code quality

## Project Structure

```
fusion-fc-game/
├── src/
│   ├── components/     # Vue components
│   │   ├── auth/       # Authentication components
│   │   ├── game/       # Game-related components
│   │   └── common/     # Shared components
│   ├── views/          # Page components
│   ├── router/         # Vue Router configuration
│   ├── stores/         # Pinia stores
│   ├── services/       # Firebase and API services
│   │   ├── auth/       # Authentication services
│   │   ├── database.js # Firestore operations
│   │   └── storage.js  # Firebase Storage
│   ├── config/         # Configuration files
│   ├── plugins/        # Vuetify configuration
│   ├── styles/         # Global styles and theme
│   ├── App.vue         # Root component
│   └── main.js         # Application entry point
├── public/             # Static assets
├── index.html          # HTML template
├── vite.config.js      # Vite configuration
├── firestore.rules     # Firestore security rules
├── cors.json           # CORS configuration for Storage
└── package.json        # Project dependencies
```

## Features

### Authentication
- **Email/Password** - Traditional email authentication
- **Google Sign-In** - OAuth with Google
- **MetaMask** - Web3 wallet authentication
- **Multi-Auth Linking** - Link multiple auth methods to one account

### Navigation

The app includes 5 main sections:
- **Dashboard** - Main overview page
- **My Team** - Team management
- **My Games** - Game scheduling and results
- **Leaderboards** - Rankings and statistics
- **Settings** - Account management and preferences

### Blockchain Integration
- **Chiliz Network Support** - Mainnet and Testnet
- **MetaMask Integration** - Wallet connection and signing
- **Multi-chain Ready** - Configurable network support

## Customization

### Theme Colors

The custom theme colors are defined in:
- `dark-theme-palette.json` - Color palette configuration
- `src/styles/theme.js` - Vuetify theme implementation

### Styling

- Global styles: `src/styles/global.scss`
- Vuetify defaults: `src/plugins/vuetify.js`

## Environment Variables

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id

# MetaMask/Chiliz Configuration
VITE_DEFAULT_CHAIN_ID=88882  # 88888 for mainnet, 88882 for testnet
VITE_DEFAULT_NETWORK_NAME=Chiliz Spicy Testnet
VITE_USE_TESTNET=true

# AI Logo Generation (Firebase Functions)
OPENAI_API_KEY=your-openai-api-key
GCLOUD_PROJECT=fusion-fc
```

## Firebase Setup

1. Enable Authentication providers:
   - Email/Password
   - Google
   - (Optional) Anonymous for MetaMask

2. Create Firestore collections:
   - `users` - User profiles
   - `wallets` - Wallet-to-user mappings
   - `gameData` - Game statistics
   - `teams` - Team data

3. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

4. Configure Storage CORS:
   ```bash
   gsutil cors set cors.json gs://your-bucket.appspot.com
   ```

5. Set up AI Logo Generation:
   ```bash
   # Install dependencies
   cd functions
   npm install
   
   # Configure environment variables
   cp .env.example .env
   # Edit .env with your OpenAI API key
   
   # Build and deploy functions
   npm run build
   firebase deploy --only functions
   ```

## Key Features Implemented

### 🎮 Game Components
- **GameButton** - 3D animated buttons with sound effects
- **FloatingOrbs** - Animated background elements
- **Sound System** - Game audio with multiple sound types (coin, pop, whoosh)
- **Theme System** - Custom dark theme with Chiliz branding

### 🔐 Multi-Authentication System
- **Account Linking** - Link MetaMask, Google, and Email to single account
- **Smart Login Detection** - Automatically detects linked accounts
- **Secure Wallet Integration** - Chiliz network support with auto-switching
- **Session Management** - Persistent sessions across authentication methods

### 🏗️ Firebase Integration
- **Firestore Database** - User profiles, game data, and match history
- **Cloud Storage** - Avatar uploads and game assets
- **Security Rules** - Multi-auth compatible rules
- **Data Connect** - GraphQL integration ready
- **AI Logo Generation** - Firebase Genkit with OpenAI and Vertex AI integration

### 📱 Responsive Design
- **Mobile-First** - Optimized for mobile devices
- **Desktop Support** - Full desktop experience with navigation drawer
- **Adaptive UI** - Bottom navigation on mobile, sidebar on desktop

### 🎨 AI Logo Generation
- **Multi-Provider Support** - OpenAI DALL-E 3 and Google Vertex AI Imagen
- **Intelligent Prompting** - Uses Google Gemini to generate detailed design prompts
- **Automatic Fallback** - Switches between providers if one fails
- **Professional Quality** - High-resolution 1024x1024 logos
- **RESTful API** - HTTP endpoint for easy integration
- **Customizable Parameters** - Business name, type, style, and color preferences

#### Usage Example
```javascript
const response = await fetch('https://logogenerator-6unsift5pq-uc.a.run.app/', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    businessName: 'Fusion FC',
    businessType: 'Gaming/Sports',
    style: 'modern and dynamic',
    colors: 'blue and orange',
    provider: 'openai' // or 'vertexai'
  })
});
const result = await response.json();
console.log('Generated logo URL:', result.imageUrl);
```

#### Local Development
```bash
# Start Firebase emulator
firebase emulators:start --only functions

# Test logo generation
node functions/test-logo.js
```

## Development & Testing

### Test Multi-Authentication
1. **Link Email to MetaMask Account**: Login with MetaMask → Settings → Add Email/Password
2. **Link MetaMask to Email Account**: Login with Email → Settings → Connect MetaMask
3. **Cross-Method Login**: Test login with all linked methods

### Test Sound System
- Visit `/sound-test` to test all game sounds
- Test button click sounds throughout the app
- Verify audio feedback on interactions

### Test AI Logo Generation
- Test logo generation locally with Firebase emulator
- Use the test script: `node functions/test-logo.js`
- Verify both OpenAI and Vertex AI providers work
- Check fallback system between providers

### Test Responsive Design
- Mobile: Bottom navigation, compact header
- Desktop: Sidebar navigation, full header
- Tablet: Adaptive layout based on screen size

## Deployment

### Firebase Hosting
```bash
# Build and deploy
pnpm build
firebase deploy
```

### Environment Setup
1. **Firebase Project**: Create project with Authentication, Firestore, Storage
2. **Enable Auth Providers**: Email/Password, Google OAuth
3. **Deploy Rules**: `firebase deploy --only firestore:rules`
4. **Configure CORS**: `gsutil cors set cors.json gs://your-bucket.appspot.com`

### Production Checklist
- [ ] Remove development override rule in `firestore.rules` (lines 85-87)
- [ ] Deploy Cloud Functions for MetaMask custom tokens
- [ ] Update CORS configuration with production domains
- [ ] Enable App Check for additional security
- [ ] Set up monitoring and analytics
- [ ] Configure AI Logo Generation API keys (OpenAI and Google Cloud)
- [ ] Deploy Firebase Functions with logo generation
- [ ] Test logo generation in production environment

## Development Notes

- MetaMask authentication uses localStorage in development
- For production, implement Cloud Functions for custom tokens
- Remove the catch-all Firestore rule before deploying to production
- Sound files are served from `/public/sounds/` directory
- Theme colors are centralized in `dark-theme-palette.json`

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome for Android)
- MetaMask extension required for Web3 features

## Troubleshooting

### Common Issues
1. **MetaMask Connection**: Ensure MetaMask is installed and unlocked
2. **Firebase 400 Errors**: Check Firebase configuration in `.env`
3. **CORS Issues**: Configure Storage CORS with `gsutil cors set cors.json`
4. **Build Warnings**: Large chunks are normal for Vuetify projects

### Debug Tools
- **Firebase Emulator**: Test locally with `firebase emulators:start`
- **Vue DevTools**: Browser extension for debugging
- **Debug Logs**: Check browser console for authentication flows

## Documentation

### Setup Guides
- **`FIREBASE_SETUP.md`** - Complete Firebase setup and configuration
- **`STORAGE_CORS_SETUP.md`** - Firebase Storage CORS configuration
- **`firebase-setup.md`** - Detailed Firestore collections and security rules
- **`functions/LOGO_GENERATION_README.md`** - AI Logo Generation setup and usage

### Testing Guides
- **`test-multi-auth.md`** - Multi-authentication testing procedures
- **`color_palette.md`** - Theme color documentation
- **`dark-theme-palette.json`** - Theme configuration file

### Configuration Files
- **`firestore.rules`** - Firestore security rules with multi-auth support
- **`cors.json`** - Storage CORS configuration
- **`.env.example`** - Environment variables template
- **`apphosting.yaml`** - Firebase App Hosting configuration

## Contributing

This project was built for the Chiliz Hackathon 2025. The codebase demonstrates:
- Modern Vue 3 + Composition API patterns
- Multi-authentication architecture
- Firebase integration best practices
- Responsive mobile-first design
- Web3 wallet integration

Feel free to explore the code structure and implementation patterns for your own projects!
