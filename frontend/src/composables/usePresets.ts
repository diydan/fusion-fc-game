import { reactive } from 'vue'
import type { PresetCollection, LightingSettings, MaterialSettings } from '@/types/scene'

export function usePresets() {
  const presets: PresetCollection = {
    'User Optimized': {
      lighting: { 
        keyLightIntensity: 1.0, 
        fillLightIntensity: 0.8, 
        fillLight2Intensity: 0.2, 
        frontLightIntensity: 0.6, 
        rimLightIntensity: 1.0, 
        ambientIntensity: 0.8, 
        shadowEnabled: true 
      },
      material: { 
        metalness: 0.70, 
        roughness: 0.30, 
        emissiveIntensity: 0.05, 
        envMapIntensity: 0.8, 
        brightness: 1.2 
      }
    },
    'Studio Bright': {
      lighting: { 
        keyLightIntensity: 2.0, 
        fillLightIntensity: 0.8, 
        fillLight2Intensity: 0.3, 
        frontLightIntensity: 0.8, 
        rimLightIntensity: 1.0, 
        ambientIntensity: 0.8, 
        shadowEnabled: true 
      },
      material: { 
        metalness: 0.7, 
        roughness: 0.3, 
        emissiveIntensity: 0.05, 
        envMapIntensity: 0.8, 
        brightness: 1.2 
      }
    },
    'Dramatic Dark': {
      lighting: { 
        keyLightIntensity: 1.0, 
        fillLightIntensity: 0.2, 
        fillLight2Intensity: 0.1, 
        frontLightIntensity: 0.4, 
        rimLightIntensity: 1.2, 
        ambientIntensity: 0.3, 
        shadowEnabled: true 
      },
      material: { 
        metalness: 0.9, 
        roughness: 0.1, 
        emissiveIntensity: 0.2, 
        envMapIntensity: 1.2, 
        brightness: 0.8 
      }
    },
    'Cyber Glow': {
      lighting: { 
        keyLightIntensity: 1.8, 
        fillLightIntensity: 0.4, 
        fillLight2Intensity: 0.5, 
        frontLightIntensity: 1.0, 
        rimLightIntensity: 1.5, 
        ambientIntensity: 0.5, 
        shadowEnabled: true 
      },
      material: { 
        metalness: 0.95, 
        roughness: 0.05, 
        emissiveIntensity: 0.3, 
        envMapIntensity: 1.5, 
        brightness: 1.1 
      }
    }
  }

  const applyPreset = (
    presetName: string, 
    lightingSettings: LightingSettings, 
    materialSettings: MaterialSettings,
    updateMaterials: () => void
  ) => {
    const preset = presets[presetName]
    if (!preset) {
      console.log(`❌ Preset "${presetName}" not found`)
      return
    }
    
    console.log(`🎨 Applying preset: ${presetName}`)
    
    // Apply lighting settings
    Object.assign(lightingSettings, preset.lighting)
    
    // Apply material settings
    Object.assign(materialSettings, preset.material)
    
    // Update materials
    updateMaterials()
    
    console.log(`✅ Applied preset: ${presetName}`)
  }

  return {
    presets,
    applyPreset
  }
}
