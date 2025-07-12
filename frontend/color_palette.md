# Color Palette

Inspired by modern dark UI design with deep blue gradients and vibrant accent colors.

## New Color Scheme

| Color Preview | Hex Code | RGB Values | Description |
|---------------|----------|------------|-------------|
| 🟦 | `#0F1419` | rgb(15, 20, 25) | Deep Dark Blue Background |
| 🟦 | `#1A1F2E` | rgb(26, 31, 46) | Dark Blue Surface |
| 🟦 | `#4A90E2` | rgb(74, 144, 226) | Bright Blue Primary |
| 🟣 | `#FF6B9D` | rgb(255, 107, 157) | Pink Secondary |
| 🔵 | `#29B6F6` | rgb(41, 182, 246) | Light Blue Info |
| 🟣 | `#7B1FA2` | rgb(123, 31, 162) | Purple Accent |


## Material Design Dark Theme Palette

### Primary Colors
- **Main**: `#4A90E2` - Bright Blue
- **Light**: `#6BB6FF` - Light variant
- **Dark**: `#2E5BBA` - Dark variant

### Secondary Colors
- **Main**: `#FF6B9D` - Pink Accent
- **Light**: `#FF8BC7` - Light variant
- **Dark**: `#E91E63` - Dark variant

### Semantic Colors
- **Success**: `#4CAF50` (Material Green)
- **Error**: `#FF5252` (Material Red)
- **Warning**: `#FFA726` (Material Orange)
- **Info**: `#29B6F6` (Light Blue)

### Background Colors
- **Default**: `#0F1419` - Deep dark blue background
- **Paper**: `#1A1F2E` - Card/Paper surfaces
- **Elevated**: `#2A3441` - Elevated surfaces

### Surface Colors
- **Main**: `#1A1F2E` - Dark blue surface
- **Light**: `#252B3D` - Light variant
- **Dark**: `#0F1419` - Dark variant
- **Variant**: `#252B3D` - Surface variant
- **Bright**: `#2A3441` - Bright surface

### Text Colors
- **Primary**: `#E3F2FD` - Light blue-white
- **Secondary**: `#B3E5FC` - Light blue
- **Disabled**: `#546E7A` - Blue-grey
- **Hint**: `#78909C` - Medium blue-grey

### Elevation System
Material Design dark theme elevation levels:
- **Level 0**: `#0F1419`
- **Level 1**: `#1A1F2E`
- **Level 2**: `#1F2433`
- **Level 3**: `#252B3D`
- **Level 4**: `#2A3441`
- **Level 6**: `#2F3A47`
- **Level 8**: `#34404D`
- **Level 12**: `#3A4653`
- **Level 16**: `#404C59`
- **Level 24**: `#46525F`

### Gradients
- **Primary**: `linear-gradient(135deg, #4A90E2 0%, #2E5BBA 100%)`
- **Secondary**: `linear-gradient(135deg, #FF6B9D 0%, #E91E63 100%)`
- **Background**: `linear-gradient(180deg, #0F1419 0%, #1A1F2E 100%)`
- **Surface**: `linear-gradient(135deg, #1A1F2E 0%, #2A3441 100%)`
- **Accent**: `linear-gradient(135deg, #29B6F6 0%, #7B1FA2 100%)`

### Shadows
- **Primary**: `0 4px 20px rgba(74, 144, 226, 0.3)`
- **Secondary**: `0 4px 20px rgba(255, 107, 157, 0.3)`
- **Surface**: `0 2px 10px rgba(0, 0, 0, 0.4)`
- **Glow**: `0 0 20px rgba(74, 144, 226, 0.2)`

## CSS Variables

```css
:root {
  /* Primary Colors */
  --primary: #4A90E2;
  --primary-light: #6BB6FF;
  --primary-dark: #2E5BBA;

  /* Secondary Colors */
  --secondary: #FF6B9D;
  --secondary-light: #FF8BC7;
  --secondary-dark: #E91E63;

  /* Semantic Colors */
  --success: #4CAF50;
  --error: #FF5252;
  --warning: #FFA726;
  --info: #29B6F6;

  /* Background Colors */
  --bg-default: #0F1419;
  --bg-paper: #1A1F2E;
  --bg-elevated: #2A3441;

  /* Surface Colors */
  --surface: #1A1F2E;
  --surface-light: #252B3D;
  --surface-dark: #0F1419;
  --surface-variant: #252B3D;
  --surface-bright: #2A3441;

  /* Text Colors */
  --text-primary: #E3F2FD;
  --text-secondary: #B3E5FC;
  --text-disabled: #546E7A;
  --text-hint: #78909C;

  /* Utility */
  --divider: rgba(227, 242, 253, 0.12);

  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #4A90E2 0%, #2E5BBA 100%);
  --gradient-secondary: linear-gradient(135deg, #FF6B9D 0%, #E91E63 100%);
  --gradient-background: linear-gradient(180deg, #0F1419 0%, #1A1F2E 100%);
  --gradient-accent: linear-gradient(135deg, #29B6F6 0%, #7B1FA2 100%);

  /* Shadows */
  --shadow-primary: 0 4px 20px rgba(74, 144, 226, 0.3);
  --shadow-secondary: 0 4px 20px rgba(255, 107, 157, 0.3);
  --shadow-surface: 0 2px 10px rgba(0, 0, 0, 0.4);
  --shadow-glow: 0 0 20px rgba(74, 144, 226, 0.2);
}
```

## Full Theme JSON

See `dark-theme-palette.json` for the complete Material Design dark theme configuration.