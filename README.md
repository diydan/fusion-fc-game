# Fusion FC Game
Chiliz Hackathon 2025

A mobile-first Vue 3 + Vuetify 3 application built with Vite


## Prerequisites

- Node.js (v16 or higher)
- pnpm (v8 or higher)

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
│   ├── views/          # Page components
│   ├── router/         # Vue Router configuration
│   ├── stores/         # Pinia stores
│   ├── plugins/        # Vuetify configuration
│   ├── styles/         # Global styles and theme
│   ├── App.vue         # Root component
│   └── main.js         # Application entry point
├── public/             # Static assets
├── index.html          # HTML template
├── vite.config.js      # Vite configuration
└── package.json        # Project dependencies
```

## Navigation

The app includes 5 main sections:
- **Dashboard** - Main overview page
- **My Team** - Team management
- **My Games** - Game scheduling and results
- **Leaderboards** - Rankings and statistics
- **Settings** - App configuration

## Customization

### Theme Colors

The custom theme colors are defined in:
- `dark-theme-palette.json` - Color palette configuration
- `src/styles/theme.js` - Vuetify theme implementation

### Styling

- Global styles: `src/styles/global.scss`
- Vuetify defaults: `src/plugins/vuetify.js`

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome for Android)
