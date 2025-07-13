# Fusion FC Game

A next-generation football (soccer) game combining 3D character customization, team management, auto-battler mechanics, and blockchain integration.

## 🎮 Game Overview

Fusion FC Game is an innovative football experience that blends traditional team management with modern gaming mechanics:

- **3D Character Creator**: Customize your players with powerups and visual modifications
- **Team Management**: Build and manage your squad with amateur to professional players
- **Auto-Battler System**: Watch your team compete in automated matches
- **Powerup System**: Collect coins and enhance player abilities
- **Blockchain Integration**: Token-based powerups and team affiliations

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Modern web browser with WebGL support

### Installation

```bash
# Clone the repository
git clone https://github.com/diydan/fusion-fc-game.git
cd fusion-fc-game

# Install dependencies
cd frontend
npm install

# Start development server
npm run dev
```

The game will be available at:
- **Character Creator**: http://localhost:3000/character-creator
- **Team Management**: http://localhost:3000/my-team  
- **Auto Battler**: http://localhost:3003/auto-battler
- **Tokens/Powerups**: http://localhost:3000/tokens

## 🎯 Core Features

### Character Creator
- **3D Character Visualization**: Real-time 3D player models
- **Powerup Integration**: Team-based stat boosts (PSG, Barcelona, Manchester City, Juventus)
- **Visual Customization**: Color sliders for shorts and power-up reactor
- **Stat Progression**: Incremental improvements through coin collection
- **Audio Feedback**: Victory sounds and interactive audio

### Team Management
- **Squad Overview**: Manage up to 6 players in 2x3 grid layout
- **Player Cards**: Detailed stats with radar charts and attribute bars
- **Recruitment System**: Add new players to your squad
- **Amateur Focus**: All players start at amateur level with growth potential

### Auto Battler
- **Multiple Formations**: Triangle, 4-2-1, and 5-player formations
- **Camera Controls**: Full orbit, zoom, and pan capabilities
- **Real-time Battles**: Watch your team compete automatically
- **Formation Strategy**: Position players for optimal performance

### Powerup System
- **Team Tokens**: PSG, Barcelona, Manchester City, Juventus powerups
- **Coin Collection**: Shoot coins at characters and power reactors
- **Stat Boosts**: +0.1 per coin collected across all attributes
- **Visual Effects**: Power-up animations and reactor emissions
- **Audio Integration**: Victory celebrations and sound effects

## 🏗️ Technical Architecture

### Frontend Stack
- **Vue 3**: Modern reactive framework with Composition API
- **Vuetify**: Material Design component library
- **Three.js**: 3D graphics and WebGL rendering
- **TresJS**: Vue 3 integration for Three.js
- **TypeScript**: Type-safe development

### Key Components
- **MobileSelectBotScene**: Main 3D scene management
- **PlayerCardV3**: Enhanced player card with radar charts
- **PelletPackSelector**: Team powerup selection interface
- **TokenAttributesPanel**: Dynamic stat display system

### Audio System
- **Background Music**: Multiple tracks with seamless transitions
- **Sound Effects**: Ball physics, coin collection, victory celebrations
- **Audio Controls**: Global volume and track management

## 📊 Game Mechanics

### Player Progression
```
Base Stats (Amateur) → Team Powerup Boost → Coin Collection Bonus
     45-46 stats    →    +15-20 boost    →    +0.1 per coin
```

### Team Powerups
| Team | Strengths | Stat Focus |
|------|-----------|------------|
| PSG | Attack/Skill | High shooting, passing, dribbling |
| Barcelona | Skill/Mental | Excellent passing and technique |
| Manchester City | Balanced | Strong across all attributes |
| Juventus | Defense | Superior defensive capabilities |

### Attribute System
- **PAC** (Pace): Speed and acceleration
- **SHO** (Shooting): Goal scoring ability  
- **PAS** (Passing): Ball distribution skills
- **DEF** (Defense): Defensive capabilities
- **PHY** (Physical): Strength and stamina
- **DRI** (Dribbling): Ball control and skill moves

## 🎨 Visual Features

### 3D Graphics
- **Character Models**: Detailed soccer player models with animations
- **Stadium Environment**: Grass fields, goal posts, corner flags
- **Lighting System**: Dynamic lighting with shadows
- **Particle Effects**: Power-up emissions and visual feedback

### UI Design
- **Dark Theme**: Consistent #010224 color scheme
- **Glass Morphism**: Semi-transparent panels with blur effects
- **Responsive Design**: Mobile and desktop optimized
- **Orbitron Font**: Futuristic typography for headings and buttons

## 🔧 Development

### Project Structure
```
fusion-fc-game/
├── frontend/           # Vue 3 application
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── views/      # Page components
│   │   ├── composables/# Vue composition functions
│   │   ├── stores/     # State management
│   │   └── utils/      # Helper functions
│   └── public/         # Static assets
└── README.md          # This file
```

### Key Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🎵 Audio Assets

The game includes a rich audio experience:
- **Background Music**: Multiple ambient tracks
- **Sound Effects**: Ball physics, UI interactions, victory celebrations
- **Audio Files**: Located in `frontend/public/audio/`

## 🚧 Roadmap

### Upcoming Features
- [ ] Multiplayer battles
- [ ] Tournament system
- [ ] Advanced formations
- [ ] Player trading marketplace
- [ ] Achievement system
- [ ] Mobile app version

### Technical Improvements
- [ ] Performance optimizations
- [ ] Advanced graphics settings
- [ ] Offline mode support
- [ ] Save system implementation

## 📄 License

This project is licensed under the GNU AFFERO GENERAL PUBLIC LICENSE v3.0 - see the LICENSE file for details.
