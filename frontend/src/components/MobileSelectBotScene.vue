<template>
  <div class="mobile-scene-container" :class="{ 'screen-shake-active': isScreenShaking }">
    <!-- Background Video (optimized for mobile) -->
    <video 
      ref="backgroundVideo"
      :autoplay="!isPowerSaveMode"
      loop 
      muted 
      playsinline
      poster="/textures/stadium_bg.jpg"
      class="mobile-background-video"
      :style="{ 
        top: `calc(50% + ${videoOffsetY}px)`,
        filter: `blur(${videoBlur}px)`
      }"
      @loadeddata="setVideoPlaybackRate"
      @ended="ensureVideoLoop"
    >
      <source src="/video/stadium.mp4" type="video/mp4" />
      Your browser does not support the video tag.
    </video>

    <!-- 3D Scene (reduced quality for mobile) -->
    <SceneCanvas 
      :POWER_PREFERENCE="mobilePowerPreference"
      :bloom-enabled="mobileBloomEnabled"
      :bloom-intensity="mobileCameraBloom"
      :dof-enabled="false"
      :dof-focus="10"
      :dof-aperture="0.025"
      :dof-max-blur="0.01"
      :style="{ 
        filter: getMobileCombinedFilter(),
        transition: 'filter 0.2s ease-out'
      }"
      @scene-created="onSceneCreated"
      @scene-ready="onSceneReady"
      @scene-render="onSceneRender"
    >
      <!-- Camera optimized for mobile -->
      <SceneCamera 
        :camera-position="mobileCameraPosition" 
        :fov="mobileCameraFov"
        :enable-controls="!props.lockCamera" 
      />
      
      <!-- Simplified fog for mobile -->
      <TresFogExp2 
        v-if="mobileFogEnabled"
        :color="getFogColorWithOpacity()"
        :density="mobileFogDensity"
      />
      
      <!-- Simplified lighting for mobile -->
      <SceneLighting :lighting-settings="mobileLightingSettings" />
      
      <!-- Simplified ground plane -->
      <TresMesh 
        :position="[0, 0, 0]" 
        :rotation="[-Math.PI / 2, 0, 0]" 
        :receive-shadow="true"
        :visible="showGrass"
      >
        <TresPlaneGeometry :args="[20, 20]" />
        <TresShadowMaterial :color="0x000000" :opacity="0.1" />
      </TresMesh>

      <!-- Character Group -->
      <TresGroup v-if="!props.showTriangleFormation" :position="[props.showDanceBot ? -1.55 : 0, sceneOffsetY, props.showDanceBot ? -0.8 : 0]">
        <TresGroup ref="modelGroup" :scale="characterScale" />
      </TresGroup>
      
      <!-- Triangle Formation Characters -->
      <TresGroup v-if="props.showTriangleFormation">
        <!-- Home Team -->
        <!-- Front Character (Striker) -->
        <TresGroup :position="[0, sceneOffsetY, -3]">
          <TresGroup ref="modelGroup" :scale="characterScale" />
        </TresGroup>
        
        <!-- Mid Left Character -->
        <TresGroup :position="[-5, sceneOffsetY, -8]">
          <TresGroup ref="modelGroup2" :scale="characterScale" />
        </TresGroup>
        
        <!-- Mid Right Character -->
        <TresGroup :position="[5, sceneOffsetY, -8]">
          <TresGroup ref="modelGroup3" :scale="characterScale" />
        </TresGroup>
        
        <!-- Defender (Center Back) -->
        <TresGroup :position="[0, sceneOffsetY, -12]">
          <TresGroup ref="modelGroup4" :scale="characterScale" />
        </TresGroup>
        
        <!-- Goalkeeper -->
        <TresGroup :position="[0, sceneOffsetY, -17]">
          <TresGroup ref="modelGroup5" :scale="characterScale * 1.1" />
        </TresGroup>
        
        <!-- Opposing Team (Mirror Formation) -->
        <!-- Opposing Goalkeeper -->
        <TresGroup :position="[0, sceneOffsetY, 17]" :rotation="[0, Math.PI, 0]">
          <TresGroup ref="opposingModelGroup1" :scale="characterScale * 1.1" />
        </TresGroup>
        
        <!-- Opposing Defender -->
        <TresGroup :position="[0, sceneOffsetY, 12]" :rotation="[0, Math.PI, 0]">
          <TresGroup ref="opposingModelGroup2" :scale="characterScale" />
        </TresGroup>
        
        <!-- Opposing Mid Right (their left from their perspective) -->
        <TresGroup :position="[-5, sceneOffsetY, 8]" :rotation="[0, Math.PI, 0]">
          <TresGroup ref="opposingModelGroup3" :scale="characterScale" />
        </TresGroup>
        
        <!-- Opposing Mid Left (their right from their perspective) -->
        <TresGroup :position="[5, sceneOffsetY, 8]" :rotation="[0, Math.PI, 0]">
          <TresGroup ref="opposingModelGroup4" :scale="characterScale" />
        </TresGroup>
        
        <!-- Opposing Striker -->
        <TresGroup :position="[0, sceneOffsetY, 3]" :rotation="[0, Math.PI, 0]">
          <TresGroup ref="opposingModelGroup5" :scale="characterScale" />
        </TresGroup>
      </TresGroup>

      <!-- Jamie Bot Group (only visible on dance page) -->
      <TresGroup 
        v-if="props.showDanceBot"
        :position="[-0.6, sceneOffsetY, 0.8]"
        :rotation="[0, 0, 0]">
        <TresGroup ref="danceBotGroup" :scale="characterScale * 0.18" />
      </TresGroup>

      <!-- Cansu Bot Group (only visible on dance page) -->
      <TresGroup 
        v-if="props.showDanceBot"
        :position="[0.6, sceneOffsetY, -0.8]"
        :rotation="[0, 0.3, 0]">
        <TresGroup ref="cansuBotGroup" :scale="[characterScale * 0.459 * 0.9, characterScale * 0.459, characterScale * 0.459]" />
      </TresGroup>

      <!-- Character Labels (on ground) -->
      <TresGroup v-if="props.showDanceBot">
        <!-- DanBot Label -->
        <TresMesh 
          ref="mainCharacterLabel" 
          :position="[-1.55, 0.2, 1.1]" 
          :rotation="[-Math.PI / 2 + Math.PI / 6 + Math.PI / 18, 0, 0]">
          <TresPlaneGeometry :args="[1.2, 0.3]" />
          <TresMeshBasicMaterial 
            :map="mainCharacterLabelTexture" 
            :transparent="true" 
            :depthWrite="false"
            :side="THREE.DoubleSide" />
        </TresMesh>
        
        <!-- JamieBot Label -->
        <TresMesh 
          ref="jamieBotLabel" 
          :position="[-0.6, 0.2, 2.7]" 
          :rotation="[-Math.PI / 2 + Math.PI / 6 + Math.PI / 18, 0, 0]">
          <TresPlaneGeometry :args="[1.08, 0.27]" />
          <TresMeshBasicMaterial 
            :map="jamieBotLabelTexture" 
            :transparent="true" 
            :depthWrite="false"
            :side="THREE.DoubleSide" />
        </TresMesh>
        
        <!-- CansuBot Label -->
        <TresMesh 
          ref="cansuBotLabel" 
          :position="[0.6, 0.2, 1.1]" 
          :rotation="[-Math.PI / 2 + Math.PI / 6 + Math.PI / 18, 0, 0]">
          <TresPlaneGeometry :args="[1.2, 0.3]" />
          <TresMeshBasicMaterial 
            :map="cansuBotLabelTexture" 
            :transparent="true" 
            :depthWrite="false"
            :side="THREE.DoubleSide" />
        </TresMesh>
      </TresGroup>

      <!-- Goalkeeper Group -->
      <TresGroup :position="[0, sceneOffsetY, -18]" :rotation="[0, 0, 0]" :visible="showGoalkeeper">
        <TresGroup ref="goalkeeperGroup" :scale="[characterScale * 1.1, characterScale * 1.1, characterScale]" />
      </TresGroup>

      <!-- Ball Group -->
      <TresGroup
        ref="ballModelGroup"
        :position="ballState?.position || [0, 0.2, 0]"
        :rotation="ballState?.rotation || [0, 0, 0]"
        :visible="ballState ? !ballState.hidden : true"
      />
    </SceneCanvas>

    <!-- Mobile Control Panel - Now positioned at top with high z-index -->
    <MobileControlPanel
      v-if="!props.hideUiElements && !props.showTriangleFormation"
      :is-ready="isReady"
      :loading-status="loadingStatus"
      :is-strike-sequence-active="animationState.isStrikeSequenceActive"
      :current-animation="getCurrentAnimation()"
      @open-powerup-selector="showPelletSelector = true"
      @shoot-coin="shootCoinWithPellets"
    />
    
    <!-- Auto-Battler Control Panel -->
    <div v-if="!props.hideUiElements && props.showTriangleFormation" class="auto-battler-controls">
      <button @click="startGame" class="start-game-btn">
        <span class="btn-icon">🎮</span>
        Start Game
      </button>
    </div>
    
    <!-- Settings Cog Button (for auto-battler) -->
    <button 
      v-if="props.showTriangleFormation && !props.hideUiElements" 
      @click="showCameraControls = !showCameraControls"
      class="settings-cog-btn"
      :class="{ 'active': showCameraControls }">
      <span class="cog-icon">⚙️</span>
    </button>
    
    <!-- Camera Controls (shown when cog is clicked) -->
    <transition name="slide-fade">
      <div v-if="props.showTriangleFormation && !props.hideUiElements && showCameraControls" class="camera-controls-container">
        <button @click="saveCameraSettings" class="camera-control-btn save-btn">
          <span class="btn-icon">💾</span>
          Save Camera
        </button>
        <button @click="resetCameraSettings" class="camera-control-btn reset-btn">
          <span class="btn-icon">🔄</span>
          Reset Camera
        </button>
        <button @click="showCameraData" class="camera-control-btn info-btn">
          <span class="btn-icon">📷</span>
          Show Camera
        </button>
      </div>
    </transition>
    
    <!-- Camera Data Display -->
    <div v-if="showCameraDataPanel" class="camera-data-panel">
      <div class="camera-data-header">
        <h3>Camera Settings</h3>
        <button @click="showCameraDataPanel = false" class="close-data-btn">✕</button>
      </div>
      <div class="camera-data-content">
        <pre>{{ cameraDataDisplay }}</pre>
        <button @click="copyCameraData" class="copy-data-btn">
          <span class="btn-icon">📋</span>
          Copy to Clipboard
        </button>
      </div>
    </div>

    <!-- Token Attributes Display in top left corner -->
    <div v-if="!props.hideUiElements && currentPelletPack" class="token-attributes-display">
      <div class="attributes-header">
        <img 
          v-if="currentPelletPack.logoURI" 
          :src="currentPelletPack.logoURI" 
          :alt="currentPelletPack.tokenSymbol"
          class="token-logo"
        />
        <span class="token-name">{{ currentPelletPack.tokenSymbol }}</span>
      </div>
      <div class="attributes-grid">
        <div class="attribute-item" v-for="attr in currentTokenAttributes" :key="attr.key">
          <span class="attr-label">{{ attr.label }}</span>
          <span class="attr-value" :style="{ color: getAttributeColor(attr.value) }">{{ attr.value }}</span>
        </div>
      </div>
    </div>
    
    <!-- Color Controls in top left corner (hidden for now) -->
    <div v-if="!props.hideUiElements && false" class="color-controls-top-left">
      <MobileColorSlider
        label="Shirt"
        :initial-hue="overlayColorHue"
        @update:color="updateOverlayColor"
      />
      <MobileColorSlider
        label="Power-up Reactor"
        :initial-hue="torusEmissionHue"
        @update:color="updateTorusEmission"
      />
    </div>

    <!-- Pellet Bar for PowerUp Fuel -->
    <PelletBar
      v-if="!props.hideUiElements && !props.showTriangleFormation"
      :current-pellets="currentPelletPack?.currentPellets || 0"
      :max-pellets="currentPelletPack?.maxPellets || 10"
      :current-pack="currentPelletPack"
      @pellet-depleted="onPelletDepleted"
      @open-selector="showPelletSelector = true"
    />

    <!-- Pellet Pack Selector -->
    <PelletPackSelector
      v-if="showPelletSelector && !props.hideUiElements"
      :available-packs="availablePelletPacks"
      :selected-pack="currentPelletPack"
      @select="selectPelletPack"
      @close="showPelletSelector = false"
    />


    <!-- Mobile Loading Indicator -->
    <div v-if="loadingStatus !== 'Ready'" class="mobile-loading">
      <div class="loading-spinner"></div>
      <p>{{ loadingStatus }}</p>
    </div>

    <!-- Mobile Performance Warning -->
    <div v-if="showPerformanceWarning" class="mobile-performance-warning">
      <div class="warning-content">
        <h4>Performance Notice</h4>
        <p>For better performance on your device, consider enabling Power Save mode.</p>
        <div class="warning-actions">
          <button @click="enablePowerSaveMode" class="primary-btn">Enable Power Save</button>
          <button @click="showPerformanceWarning = false" class="secondary-btn">Continue</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'

// Props
interface Props {
  hideUiElements?: boolean
  lockCamera?: boolean
  showDanceBot?: boolean
  showTriangleFormation?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hideUiElements: false,
  lockCamera: false,
  showDanceBot: false,
  showTriangleFormation: false
})

// Emits
const emit = defineEmits(['coin-collected'])

// Router
const router = useRouter()

// Components
import SceneCanvas from './scene/SceneCanvas.vue'
import SceneCamera from './scene/SceneCamera.vue'
import SceneLighting from './scene/SceneLighting.vue'
import MobileControlPanel from './mobile/MobileControlPanel.vue'
import PelletBar from './ui/PelletBar.vue'
import PelletPackSelector from './ui/PelletPackSelector.vue'
import MobileColorSlider from './mobile/MobileColorSlider.vue'
import PlayerCardV3 from './recruit/PlayerCardV3.vue'
import type { PelletPack } from './ui/PelletPackSelector.vue'

// Composables (reuse existing ones)
import { useSceneSetup } from '@/composables/useSceneSetup'
import { useAnimations } from '@/composables/useAnimations'
import { useBallPhysics } from '@/composables/useBallPhysics'
import { useAudio } from '@/composables/useAudio'
import { useMobileOptimization } from '@/composables/useMobileOptimization'
import { useCoinPhysics } from '@/composables/useCoinPhysics'
import { createLayeredMeshGroup, createMainCharacterMaterials } from '@/utils/materialHelpers'
import { useTeamsData } from '@/composables/useTeamsData'

// Mobile-specific state
const showPerformanceWarning = ref(false)
const isPowerSaveMode = ref(false)
const showGoalkeeper = ref(false)

// Dance page loading state
const danceBotLoaded = ref(false)
const cansuBotLoaded = ref(false)
const mainCharacterLoaded = ref(false)

// Label textures
const mainCharacterLabelTexture = ref<THREE.Texture | null>(null)
const jamieBotLabelTexture = ref<THREE.Texture | null>(null)
const cansuBotLabelTexture = ref<THREE.Texture | null>(null)

// Mobile-optimized settings - now using same camera as desktop
const mobilePowerPreference = ref<'high-performance' | 'low-power' | 'default'>('default')
const mobileBloomEnabled = ref(false) // Disabled by default on mobile
const mobileCameraBloom = ref(0.3) // Reduced intensity
const mobileFogEnabled = ref(true)
const mobileFogDensity = ref(0.01) // Lighter fog
const mobileCameraFov = ref(42) // Same FOV as desktop
// Default camera position for normal mode
const defaultCameraPosition = ref<[number, number, number]>([-1.331, 1.805 * 0.8, 11.576 * 0.6])
// Auto-battler specific camera position
const autoBattlerCameraPosition = ref<[number, number, number]>([-29.594, 7.146, -2.400])
// Use auto-battler camera if in triangle formation
const mobileCameraPosition = computed(() => 
  props.showTriangleFormation ? autoBattlerCameraPosition.value : defaultCameraPosition.value
)

// Setup composables with mobile optimizations
const {
  loadingStatus,
  isScreenShaking,
  isReady,
  sceneOffsetY,
  characterScale,
  showGrass,
  videoOffsetY,
  videoBlur,
  lightingSettings,
  materialSettings,
  sceneRefs,
  cameraPosition,
  characterPosition,
  onSceneCreated,
  addTorusToCharacter,
  updateTorusColor,
  triggerScreenShake,
  updateCameraPosition,
  createGrassField,
  createCenterCircle,
  createFootballFieldLines,
  loadGoalpostModel,
  loadCornerFlags,
  updateTorusColor: updateTorusColorFromSetup
} = useSceneSetup()

// Mobile-optimized lighting
const mobileLightingSettings = computed(() => ({
  ...lightingSettings,
  ambientIntensity: Math.min(lightingSettings.ambientIntensity, 0.6),
  directionalIntensity: Math.min(lightingSettings.directionalIntensity, 0.8),
  enableShadows: false // Disable shadows on mobile for performance
}))

const { animationState, loadCharacterModel, updateAnimations, getCurrentAnimation, materials, triggerPowerUpFlash, playWaveAnimation, playPowerUpAnimation, updateOverlayColor: updateOverlayColorFromAnimation, updateArcreactorColor } = useAnimations(sceneRefs, materialSettings)
const { ballState, loadBallModel, updateBallPhysics, animateBallToPosition, animateBallWithPhysics, stopBallAnimation } = useBallPhysics(sceneRefs, 0.1, cameraPosition)
const { audioState, toggleBackgroundMusic, stopMusic, playBallKick, playCoinSpin, playCoinHitTorusSound, playVictorySound, nextTrack, previousTrack } = useAudio()
const { shootCoin } = useCoinPhysics(sceneRefs, cameraPosition, triggerPowerUpFlash, playCoinSpin, playCoinHitTorusSound, playPowerUpAnimation, playVictorySound, () => emit('coin-collected'))

// Mobile optimization composable
const { 
  detectPerformanceLevel,
  optimizeForDevice,
  enablePowerSaveMode: enablePowerSave,
  getOptimalSettings
} = useMobileOptimization()

// Template refs
const backgroundVideo = ref<HTMLVideoElement>()
const modelGroup = ref()
const modelGroup2 = ref()
const modelGroup3 = ref()
const modelGroup4 = ref()
const modelGroup5 = ref()
// Opposing team refs
const opposingModelGroup1 = ref()
const opposingModelGroup2 = ref()
const opposingModelGroup3 = ref()
const opposingModelGroup4 = ref()
const opposingModelGroup5 = ref()
const goalkeeperGroup = ref()
const ballModelGroup = ref()
const danceBotGroup = ref()
const cansuBotGroup = ref()
const overlayColorHue = ref(218)
const torusEmissionHue = ref(195)

// Pellet management state
const showPelletSelector = ref(false)
const currentPelletPack = ref<PelletPack | null>(null)
const availablePelletPacks = ref<PelletPack[]>([])

// Camera data display
const showCameraDataPanel = ref(false)
const cameraDataDisplay = ref('')
const showCameraControls = ref(false)

// Use shared teams data
const { getTeamByToken, getTeamAttributes } = useTeamsData()

// Computed token attributes
const currentTokenAttributes = computed(() => {
  if (!currentPelletPack.value) return []

  const attributes = getTeamAttributes(currentPelletPack.value.tokenSymbol)

  // Convert to abbreviated labels for mobile display
  return attributes.map(attr => ({
    ...attr,
    label: attr.label === 'Overall' ? 'OVR' :
           attr.label === 'Attack' ? 'ATK' :
           attr.label === 'Speed' ? 'SPD' :
           attr.label === 'Skill' ? 'SKL' :
           attr.label === 'Defense' ? 'DEF' :
           attr.label === 'Physical' ? 'PHY' :
           attr.label === 'Mental' ? 'MEN' :
           attr.label === 'Aggression' ? 'AGG' :
           attr.label
  }))
})

// Get color based on attribute value
const getAttributeColor = (value: number): string => {
  if (value >= 90) return '#10b981' // Green for excellent
  if (value >= 80) return '#3b82f6' // Blue for good
  if (value >= 70) return '#f59e0b' // Orange for average
  return '#ef4444' // Red for poor
}

// Initialize default pellet packs (will be updated with real token data)
const initializePelletPacks = () => {
  // Default packs - these will be replaced with actual token data
  availablePelletPacks.value = [
    {
      tokenSymbol: 'PSG',
      tokenBalance: 50,
      currentPellets: 8,
      maxPellets: 8,
      color: '#FF0000',
      powerMultiplier: 1.5,
      refillCost: 8
    },
    {
      tokenSymbol: 'BAR',
      tokenBalance: 30,
      currentPellets: 6,
      maxPellets: 6,
      color: '#004D98',
      powerMultiplier: 2,
      refillCost: 6
    },
    {
      tokenSymbol: 'JUV',
      tokenBalance: 20,
      currentPellets: 5,
      maxPellets: 5,
      color: '#000000',
      powerMultiplier: 2.5,
      refillCost: 5
    },
    {
      tokenSymbol: 'MCI',
      tokenBalance: 15,
      currentPellets: 7,
      maxPellets: 7,
      color: '#6CABDD',
      powerMultiplier: 1.8,
      refillCost: 7
    }
  ]
  
  // Set default pack
  currentPelletPack.value = availablePelletPacks.value[0]
}

// Select a pellet pack
const selectPelletPack = (pack: PelletPack) => {
  currentPelletPack.value = pack
  showPelletSelector.value = false
  
  // Update torus emission color to match pellet pack color
  if (pack.color) {
    // Convert hex color to HSL for the torus
    const hexToHsl = (hex: string) => {
      // Remove # if present
      hex = hex.replace('#', '')
      
      // Convert to RGB
      const r = parseInt(hex.substr(0, 2), 16) / 255
      const g = parseInt(hex.substr(2, 2), 16) / 255
      const b = parseInt(hex.substr(4, 2), 16) / 255
      
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      let h = 0
      const s = 0.8 // Fixed saturation for emission
      const l = (max + min) / 2
      
      if (max !== min) {
        const d = max - min
        if (max === r) {
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        } else if (max === g) {
          h = ((b - r) / d + 2) / 6
        } else {
          h = ((r - g) / d + 4) / 6
        }
      }
      
      return { h: h * 360, s: s * 100, l: l * 100 }
    }
    
    const hsl = hexToHsl(pack.color)
    updateTorusEmission(`hsl(${hsl.h}, ${hsl.s}%, 50%)`)
  }
}

// Handle pellet depletion
const onPelletDepleted = () => {
  if (currentPelletPack.value) {
    // Refill pellets when they reach 0
    if (currentPelletPack.value.currentPellets === 0 && currentPelletPack.value.tokenBalance >= currentPelletPack.value.refillCost) {
      currentPelletPack.value.tokenBalance -= currentPelletPack.value.refillCost
      currentPelletPack.value.currentPellets = currentPelletPack.value.maxPellets
    }
  }
}

// Modified shoot coin function that consumes pellets
const shootCoinWithPellets = () => {
  if (currentPelletPack.value && currentPelletPack.value.currentPellets > 0) {
    currentPelletPack.value.currentPellets--
    
    // Apply power multiplier effect
    const powerMultiplier = currentPelletPack.value.powerMultiplier || 1
    
    // Shoot coin with power multiplier (you can modify shootCoin to accept power parameter)
    for (let i = 0; i < powerMultiplier; i++) {
      setTimeout(() => shootCoin(), i * 100) // Shoot multiple coins for higher power
    }
  } else {
    console.log('No pellets available!')
  }
}

// Update token balances from external source (wallet integration)
const updateTokenBalances = (tokens: Array<{ symbol: string, balance: number, logoURI?: string }>) => {
  // Filter out CHZ and map tokens to pellet packs
  availablePelletPacks.value = tokens
    .filter(token => token.symbol !== 'CHZ')
    .map(token => {
      // Find existing pack to preserve current pellets
      const existingPack = availablePelletPacks.value.find(p => p.tokenSymbol === token.symbol)
      
      // Different pack configurations based on token type
      let config = { maxPellets: 10, powerMultiplier: 1, refillCost: 10, color: '#FFD700' }
      
      // Custom configurations for known tokens
      switch (token.symbol) {
        case 'PSG':
          config = { maxPellets: 8, powerMultiplier: 1.5, refillCost: 8, color: '#FF0000' }
          break
        case 'BAR':
          config = { maxPellets: 6, powerMultiplier: 2, refillCost: 6, color: '#004D98' }
          break
        case 'JUV':
          config = { maxPellets: 5, powerMultiplier: 2.5, refillCost: 5, color: '#000000' }
          break
        case 'MCI':
          config = { maxPellets: 7, powerMultiplier: 1.8, refillCost: 7, color: '#6CABDD' }
          break
      }
      
      return {
        tokenSymbol: token.symbol,
        tokenBalance: token.balance,
        currentPellets: existingPack?.currentPellets || config.maxPellets,
        maxPellets: config.maxPellets,
        color: config.color,
        logoURI: token.logoURI,
        powerMultiplier: config.powerMultiplier,
        refillCost: config.refillCost
      }
    })
  
  // If no current pack selected, select the first one
  if (!currentPelletPack.value && availablePelletPacks.value.length > 0) {
    selectPelletPack(availablePelletPacks.value[0])
  }
}


// Label refs
const mainCharacterLabel = ref()
const jamieBotLabel = ref()
const cansuBotLabel = ref()

// Head bone tracking
const headBones = ref({
  mainCharacter: null as THREE.Bone | null,
  jamieBot: null as THREE.Bone | null,
  cansuBot: null as THREE.Bone | null
})

// Play goalkeeper animation based on shot direction
const playGoalkeeperAnimation = async (animationFile: string) => {
  if (!goalkeeperGroup.value || !sceneRefs.goalkeeperMixer) {
    return
  }

  try {
    const loader = new FBXLoader()
    const animationFBX = await loader.loadAsync(animationFile)
    
    if (animationFBX.animations && animationFBX.animations.length > 0) {
      const clip = animationFBX.animations[0]
      const action = sceneRefs.goalkeeperMixer.clipAction(clip)
      
      // Stop current goalkeeper animation
      sceneRefs.goalkeeperMixer.stopAllAction()
      
      // Play new animation once
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = true
      action.reset().play()
      
      // Return to idle after animation completes
      const onGoalkeeperFinished = (event: any) => {
        if (event.action === action) {
          sceneRefs.goalkeeperMixer.removeEventListener('finished', onGoalkeeperFinished)
          
          // Return to goalkeeper idle
          setTimeout(async () => {
            try {
              const idleAnimation = await loader.loadAsync('/bot1/Goalkeeper Idle.fbx')
              if (idleAnimation.animations.length > 0) {
                const idleAction = sceneRefs.goalkeeperMixer.clipAction(idleAnimation.animations[0])
                idleAction.reset().play()
                }
            } catch (error) {
              }
          }, 500)
        }
      }
      sceneRefs.goalkeeperMixer.addEventListener('finished', onGoalkeeperFinished)
    }
  } catch (error) {
    }
}

// Create label texture
const createLabelTexture = (text: string): THREE.Texture => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  
  if (!context) {
    return new THREE.Texture()
  }
  
  // Set canvas size
  canvas.width = 256
  canvas.height = 64
  
  // Draw background
  context.fillStyle = 'rgba(0, 0, 0, 0.5)'
  context.roundRect(0, 0, canvas.width, canvas.height, 20)
  context.fill()
  
  // Draw border
  context.strokeStyle = 'rgba(255, 255, 255, 0.2)'
  context.lineWidth = 2
  context.roundRect(1, 1, canvas.width - 2, canvas.height - 2, 19)
  context.stroke()
  
  // Draw text
  context.fillStyle = 'white'
  context.font = 'bold 24px Arial'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.shadowColor = 'rgba(0, 0, 0, 0.5)'
  context.shadowBlur = 3
  context.shadowOffsetY = 1
  context.fillText(text, canvas.width / 2, canvas.height / 2)
  
  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  texture.encoding = THREE.sRGBEncoding
  
  return texture
}

// Initialize label textures
const initializeLabelTextures = () => {
  mainCharacterLabelTexture.value = createLabelTexture('DanBot')
  jamieBotLabelTexture.value = createLabelTexture('JamieBot')
  cansuBotLabelTexture.value = createLabelTexture('CansuBot')
}

// Start synchronized dance animations
const startSynchronizedDance = () => {
  if (props.showDanceBot && danceBotLoaded.value && cansuBotLoaded.value && mainCharacterLoaded.value) {
    console.log('Starting synchronized dance animations!')
    
    // Play main character samba animation
    playWaveAnimation()
    
    // Play dance bot animations if they have them
    if (sceneRefs.danceBotMixer) {
      sceneRefs.danceBotMixer.stopAllAction()
      if (sceneRefs.danceBotMixer._actions && sceneRefs.danceBotMixer._actions.length > 0) {
        sceneRefs.danceBotMixer._actions[0].reset().play()
      }
    }
    
    // Play cansu bot animations if they have them
    if (sceneRefs.cansuBotMixer) {
      sceneRefs.cansuBotMixer.stopAllAction()
      if (sceneRefs.cansuBotMixer._actions && sceneRefs.cansuBotMixer._actions.length > 0) {
        sceneRefs.cansuBotMixer._actions[0].reset().play()
      }
    }
  }
}

// Load dance bot (JamieBot)
const loadDanceBot = async () => {
  if (!props.showDanceBot || !danceBotGroup.value) return
  
  try {
    const loader = new FBXLoader()
    const danceBotModel = await loader.loadAsync('/dance-bots/JamieBot.fbx')
    
    // Scale to match character
    danceBotModel.scale.setScalar(1)
    
    // Apply materials and shadows
    danceBotModel.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        // Keep original materials for dance bot
        if (child.material) {
          child.material.metalness = 0.3
          child.material.roughness = 0.7
        }
      }
    })
    
    // Add to dance bot group
    danceBotGroup.value.clear()
    danceBotGroup.value.add(danceBotModel)
    
    // Create animation mixer for dance bot
    const mixer = new THREE.AnimationMixer(danceBotModel)
    sceneRefs.danceBotMixer = mixer
    
    // Play the bot's own animations if available
    if (danceBotModel.animations && danceBotModel.animations.length > 0) {
      // Play the first animation found in the FBX file
      const action = mixer.clipAction(danceBotModel.animations[0])
      action.play()
      console.log(`Playing JamieBot animation: ${danceBotModel.animations[0].name}`)
    } else {
      // Fallback to idle animation if no animations in the model
      try {
        const idleAnimation = await loader.loadAsync('/bot1/Idle.fbx')
        if (idleAnimation.animations.length > 0) {
          const action = mixer.clipAction(idleAnimation.animations[0])
          action.play()
        }
      } catch (error) {
        console.log('Could not load idle animation for dance bot')
      }
    }
    
    console.log('Dance bot loaded successfully')
    danceBotLoaded.value = true
    
    // Find head bone for dance bot
    headBones.value.jamieBot = findHeadBone(danceBotModel)
    console.log('Jamie bot head bone found:', headBones.value.jamieBot)
    
    startSynchronizedDance()
  } catch (error) {
    console.error('Error loading dance bot:', error)
  }
}

// Load Cansu Bot
const loadCansuBot = async () => {
  if (!props.showDanceBot || !cansuBotGroup.value) return
  
  try {
    const loader = new FBXLoader()
    const cansuBotModel = await loader.loadAsync('/dance-bots/CansuBot.fbx')
    
    // Scale to match character
    cansuBotModel.scale.setScalar(1)
    
    // Apply materials and shadows
    cansuBotModel.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        // Keep original materials for dance bot
        if (child.material) {
          child.material.metalness = 0.3
          child.material.roughness = 0.7
        }
      }
    })
    
    // Add to cansu bot group
    cansuBotGroup.value.clear()
    cansuBotGroup.value.add(cansuBotModel)
    
    // Create animation mixer for cansu bot
    const mixer = new THREE.AnimationMixer(cansuBotModel)
    sceneRefs.cansuBotMixer = mixer
    
    // Play the bot's own animations if available
    if (cansuBotModel.animations && cansuBotModel.animations.length > 0) {
      // Play the first animation found in the FBX file
      const action = mixer.clipAction(cansuBotModel.animations[0])
      action.play()
      console.log(`Playing CansuBot animation: ${cansuBotModel.animations[0].name}`)
    } else {
      // Fallback to idle animation if no animations in the model
      try {
        const idleAnimation = await loader.loadAsync('/bot1/Idle.fbx')
        if (idleAnimation.animations.length > 0) {
          const action = mixer.clipAction(idleAnimation.animations[0])
          action.play()
        }
      } catch (error) {
        console.log('Could not load idle animation for cansu bot')
      }
    }
    
    console.log('Cansu bot loaded successfully')
    cansuBotLoaded.value = true
    
    // Find head bone for cansu bot
    headBones.value.cansuBot = findHeadBone(cansuBotModel)
    console.log('Cansu bot head bone found:', headBones.value.cansuBot)
    
    startSynchronizedDance()
  } catch (error) {
    console.error('Error loading cansu bot:', error)
  }
}


// Load character copy for triangle formation
const loadCharacterCopy = async (targetGroup: any, animationDelay: number = 0, isGoalkeeper: boolean = false, isOpposingTeam: boolean = false, playerIndex: number = 0) => {
  try {
    // Load textures
    const textureLoader = new THREE.TextureLoader()
    const [baseTexture, overlayTexture] = await Promise.all([
      new Promise<THREE.Texture>((resolve, reject) => {
        textureLoader.load(
          '/bot1/bot1_original.png',
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace
            resolve(texture)
          },
          undefined,
          reject
        )
      }),
      new Promise<THREE.Texture>((resolve, reject) => {
        textureLoader.load(
          '/bot1/bot1_shorts.png',
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace
            resolve(texture)
          },
          undefined,
          reject
        )
      })
    ])

    // Load character model
    const loader = new FBXLoader()
    const characterModel = await loader.loadAsync('/bot1/soccer_player_humanoid__texture2.fbx')
    
    characterModel.scale.setScalar(1)
    
    // Create materials using helper function
    const materialPair = createMainCharacterMaterials(baseTexture, overlayTexture, materialSettings.brightness)
    
    // Modify colors for opposing team
    if (isOpposingTeam) {
      // Change overlay color to red for opposing team
      if (materialPair.overlay) {
        materialPair.overlay.color = new THREE.Color(0xff0000) // Red color
      }
    }
    
    // Apply materials and setup shadows
    characterModel.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        // Apply the same material setup as the main character
        if (child.material && (child.material instanceof THREE.MeshPhongMaterial || 
            child.material instanceof THREE.MeshBasicMaterial || 
            child.material instanceof THREE.MeshStandardMaterial)) {
          
          // Create layered mesh group using helper function
          const layeredGroup = createLayeredMeshGroup(child, materialPair)
          
          // Replace the original mesh with the layered group
          child.parent?.add(layeredGroup)
          child.parent?.remove(child)
        }
      }
    })
    
    // Add to target group
    targetGroup.clear()
    targetGroup.add(characterModel)
    
    // Create animation mixer for this character
    const mixer = new THREE.AnimationMixer(characterModel)
    
    // Load appropriate animation based on character type
    const animationFile = isGoalkeeper ? '/bot1/Goalkeeper Idle.fbx' : '/bot1/Soccer Idle.fbx'
    const idleAnimation = await loader.loadAsync(animationFile)
    if (idleAnimation.animations.length > 0) {
      const action = mixer.clipAction(idleAnimation.animations[0])
      
      // Apply animation delay for staggered start
      if (animationDelay > 0) {
        setTimeout(() => {
          action.play()
        }, animationDelay)
      } else {
        action.play()
      }
      
      // Store mixer in array for updates
      if (!sceneRefs.additionalMixers) {
        sceneRefs.additionalMixers = []
      }
      sceneRefs.additionalMixers.push(mixer)
    }
    
    console.log('Character copy loaded successfully')
  } catch (error) {
    console.error('Error loading character copy:', error)
  }
}


// Load goalkeeper (same character asset)
const loadGoalkeeper = async () => {
  try {
    // Use FBXLoader directly for the goalkeeper
    const loader = new FBXLoader()
    const goalkeeperModel = await loader.loadAsync('/bot1/soccer_player_humanoid__texture1.fbx')
    
    // Scale should match the parent group scale - don't double-scale
    goalkeeperModel.scale.setScalar(1) // Parent group already has characterScale
    
    // Apply same material treatment as main character
    goalkeeperModel.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        // Apply the same material setup as the main character
        if (child.material instanceof THREE.MeshPhongMaterial && materials.base && materials.overlay) {
          // Create layered mesh group using helper function
          const layeredGroup = createLayeredMeshGroup(child, { base: materials.base, overlay: materials.overlay })
          
          // Replace the original child with the layered group
          child.parent?.add(layeredGroup)
          child.parent?.remove(child)
          
          }
      }
    })
    
    // Add to goalkeeper group
    if (goalkeeperGroup.value) {
      goalkeeperGroup.value.clear()
      goalkeeperGroup.value.add(goalkeeperModel)
      
      // Make sure the goalkeeper group itself is visible
      goalkeeperGroup.value.visible = true
      
      // Log the goalkeeper's world position
      goalkeeperGroup.value.updateWorldMatrix(true, true)
      const worldPos = new THREE.Vector3()
      goalkeeperGroup.value.getWorldPosition(worldPos)
      // Load goalkeeper idle animation
      const idleAnimation = await loader.loadAsync('/bot1/Goalkeeper Idle.fbx')
      if (idleAnimation.animations.length > 0 && sceneRefs.scene) {
        const mixer = new THREE.AnimationMixer(goalkeeperModel)
        const action = mixer.clipAction(idleAnimation.animations[0])
        action.play()
        
        // Store mixer for updates
        sceneRefs.goalkeeperMixer = mixer
        }
      
      // Double-check visibility of the entire hierarchy
      } else {
      }
    
    } catch (error) {
    }
}

// Mobile-specific methods
const enablePowerSaveMode = () => {
  isPowerSaveMode.value = true
  showPerformanceWarning.value = false
  
  // Apply power save optimizations
  mobileBloomEnabled.value = false
  mobileFogEnabled.value = false
  showGrass.value = false
  mobilePowerPreference.value = 'low-power'
  
  // Reduce video quality
  if (backgroundVideo.value) {
    backgroundVideo.value.playbackRate = 0.5
  }
  
  }

// Enhanced mobile strike sequence with character movement
const triggerMobileStrikeSequence = () => {
  if (!sceneRefs.actions || sceneRefs.actions.length < 2) {
    return
  }

  animationState.isStrikeSequenceActive = true

  // Phase 1: Ball rolls to position
  animateBallToPosition([-0.030, 0.100, 0.800], 1500)

  setTimeout(() => {
    // Phase 2: Strike animation
    if (sceneRefs.actions[animationState.currentIndex]) {
      sceneRefs.actions[animationState.currentIndex].fadeOut(0.3)
    }

    animationState.currentIndex = 1
    sceneRefs.actions[1].reset().fadeIn(0.3).play()

    setTimeout(() => {
      playBallKick()
      triggerScreenShake(400)

      // Phase 3: Character movement after kick
      if (sceneRefs.modelGroup) {
        const modelGroup = sceneRefs.modelGroup
        const kickStartPosition = modelGroup.position.clone()

        // Calculate movement toward camera with side offset
        const currentCameraPos = new THREE.Vector3(...cameraPosition.value)
        const directionTowardCamera = new THREE.Vector3()
        directionTowardCamera.subVectors(currentCameraPos, kickStartPosition).normalize()

        // Side offset for mobile (simpler calculation)
        const rightOffset = new THREE.Vector3(3, 0, 0) // 3 units to the right

        // Target position: toward camera + side offset
        const kickTargetPosition = new THREE.Vector3()
        kickTargetPosition.copy(kickStartPosition)
          .add(directionTowardCamera.multiplyScalar(10)) // 10 units toward camera
          .add(rightOffset)
        kickTargetPosition.y = kickStartPosition.y // Keep on ground

        const kickMovementDuration = 1800 // Mobile optimized duration
        const kickStartTime = Date.now()

        const animateKickMovement = () => {
          const elapsed = Date.now() - kickStartTime
          const progress = Math.min(elapsed / kickMovementDuration, 1)

          modelGroup.position.lerpVectors(kickStartPosition, kickTargetPosition, progress)

          if (progress < 1) {
            requestAnimationFrame(animateKickMovement)
          }
        }

        animateKickMovement()
      }

      // Phase 4: Ball physics
      const cameraPos = sceneRefs.camera?.position || new THREE.Vector3(...cameraPosition.value)
      const startPos = [-0.030, 0.100, 0.800]
      const finalTarget = [cameraPos.x, cameraPos.y + 0.3, cameraPos.z - 0.3]

      animateBallWithPhysics(startPos, finalTarget, 500, () => {
        if (ballState) {
          ballState.hidden = true
        }
      })
    }, 300)

  }, 1500)

  // Phase 5: Transition to running animation
  setTimeout(() => {
    if (sceneRefs.actions && sceneRefs.actions[1]) {
      sceneRefs.actions[1].fadeOut(0.2)
    }

    animationState.currentIndex = 2 // Running animation
    if (sceneRefs.actions && sceneRefs.actions[2]) {
      sceneRefs.actions[2].reset().fadeIn(0.2).play()
    }
  }, 2200)

  // End sequence - character stays running
  setTimeout(() => {
    // Character continues running - use reset button to return
  }, 4000)
}

// Enhanced mobile character reset
const triggerStrike2 = () => {
  if (!sceneRefs.actions || sceneRefs.actions.length < 2) {
    return
  }

  animationState.isStrikeSequenceActive = true

  // Phase 1: Ball rolls to position (same as Strike 1)
  animateBallToPosition([-0.030, 0.100, 0.800], 1500)

  setTimeout(() => {
    // Phase 2: Strike animation
    if (sceneRefs.actions[animationState.currentIndex]) {
      sceneRefs.actions[animationState.currentIndex].fadeOut(0.3)
    }

    animationState.currentIndex = 1
    sceneRefs.actions[1].reset().fadeIn(0.3).play()

    setTimeout(() => {
      playBallKick()
      triggerScreenShake(400)

      // Phase 3: Character movement after kick - two-stage movement
      if (sceneRefs.modelGroup) {
        const modelGroup = sceneRefs.modelGroup
        const kickStartPosition = modelGroup.position.clone()
        const kickStartRotation = modelGroup.rotation.y

        // Stage 1: Run toward ball direction for 1 second
        const ballDirection = new THREE.Vector3(0, 0, -1) // Toward goal (ball direction)
        const ballChaseDistance = 8 // Run 8 units toward goal
        const ballChasePosition = new THREE.Vector3()
        ballChasePosition.copy(kickStartPosition)
          .add(ballDirection.multiplyScalar(ballChaseDistance))
        ballChasePosition.y = kickStartPosition.y

        // Calculate rotation to face ball direction
        const ballDirectionAngle = Math.atan2(ballDirection.x, ballDirection.z)

        const stage1Duration = 1000 // 1 second
        const stage1StartTime = Date.now()

        const animateStage1 = () => {
          const elapsed = Date.now() - stage1StartTime
          const progress = Math.min(elapsed / stage1Duration, 1)

          // Move toward ball
          modelGroup.position.lerpVectors(kickStartPosition, ballChasePosition, progress)
          
          // Rotate to face ball direction
          modelGroup.rotation.y = kickStartRotation + (ballDirectionAngle - kickStartRotation) * progress

          if (progress < 1) {
            requestAnimationFrame(animateStage1)
          } else {
            // Stage 2: Natural curved celebration run
            const stage2StartPosition = modelGroup.position.clone()
            const currentRotation = modelGroup.rotation.y
            
            // More realistic celebration path - wider arc toward touchline then corner
            const cornerFlagPosition = new THREE.Vector3(-18, kickStartPosition.y, -22) // Past corner flag
            const offScreenPosition = new THREE.Vector3(-25, kickStartPosition.y, -30) // Further off screen
            
            // Create natural arc - first toward touchline, then to corner
            const touchlinePoint = new THREE.Vector3(-12, kickStartPosition.y, stage2StartPosition.z - 3)
            const midArcPoint = new THREE.Vector3(-15, kickStartPosition.y, -12)
            
            // Three-phase movement for natural celebration - slower, more realistic
            const phase1Duration = 1800 // 1.8s - curve toward touchline (slower)
            const phase2Duration = 2000 // 2s - arc toward corner flag (slower)
            const phase3Duration = 1500 // 1.5s - continue off screen (slower)
            const totalDuration = phase1Duration + phase2Duration + phase3Duration
            const stage2StartTime = Date.now()

            let lastPosition = stage2StartPosition.clone()

            const animateStage2 = () => {
              const elapsed = Date.now() - stage2StartTime
              const progress = Math.min(elapsed / totalDuration, 1)
              let newPosition = new THREE.Vector3()
              let targetDirection = new THREE.Vector3()
              
              if (elapsed < phase1Duration) {
                // Phase 1: Gradual curve toward touchline
                const t1 = elapsed / phase1Duration
                const smoothT1 = t1 * t1 * (3 - 2 * t1) // Smooth step
                newPosition.lerpVectors(stage2StartPosition, touchlinePoint, smoothT1)
                targetDirection.subVectors(touchlinePoint, stage2StartPosition).normalize()
              } else if (elapsed < phase1Duration + phase2Duration) {
                // Phase 2: Arc toward corner flag  
                const t2 = (elapsed - phase1Duration) / phase2Duration
                const smoothT2 = t2 * t2 * (3 - 2 * t2)
                
                // Bezier curve from touchline through mid-arc to corner
                const oneMinusT2 = 1 - smoothT2
                newPosition.x = oneMinusT2 * oneMinusT2 * touchlinePoint.x + 
                              2 * oneMinusT2 * smoothT2 * midArcPoint.x + 
                              smoothT2 * smoothT2 * cornerFlagPosition.x
                newPosition.y = touchlinePoint.y
                newPosition.z = oneMinusT2 * oneMinusT2 * touchlinePoint.z + 
                              2 * oneMinusT2 * smoothT2 * midArcPoint.z + 
                              smoothT2 * smoothT2 * cornerFlagPosition.z
                
                targetDirection.subVectors(cornerFlagPosition, midArcPoint).normalize()
              } else {
                // Phase 3: Continue running off screen
                const t3 = (elapsed - phase1Duration - phase2Duration) / phase3Duration
                const smoothT3 = t3 * t3 * (3 - 2 * t3)
                newPosition.lerpVectors(cornerFlagPosition, offScreenPosition, smoothT3)
                targetDirection.subVectors(offScreenPosition, cornerFlagPosition).normalize()
              }
              
              // Smooth rotation toward movement direction
              if (targetDirection.length() > 0) {
                const targetAngle = Math.atan2(targetDirection.x, targetDirection.z)
                let angleDiff = targetAngle - modelGroup.rotation.y
                
                // Normalize angle difference for shortest rotation
                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI
                
                // Gradual rotation - more natural than instant
                const rotationSpeed = 0.08 // Slower, more realistic rotation
                modelGroup.rotation.y += angleDiff * rotationSpeed
              }
              
              modelGroup.position.copy(newPosition)
              lastPosition.copy(newPosition)

              if (progress < 1) {
                requestAnimationFrame(animateStage2)
              } else {
                // Hide ball when player finishes running
                if (ballState) {
                  ballState.hidden = true
                  }
              }
            }

            animateStage2()
          }
        }

        animateStage1()
      }

      // Phase 4: Ball physics toward goal with random target selection
      const startPos = [-0.030, 0.100, 0.800]
      
      // 11 goal target options with goalkeeper animations
      // Goal posts: width 8 units (-4 to +4), height 2.4 units (0 to 2.4)
      const goalTargets = [
        { pos: [0, 1.2, -19], name: "Middle of net", animation: "/bot1/Goalkeeper Catch middle.fbx" },           // 1 - GOAL
        { pos: [3.5, 2.2, -19], name: "Top right corner", animation: "/bot1/Goalkeeper Diving right.fbx" },      // 2 - GOAL (within posts)
        { pos: [2, 1.2, -19], name: "Right center", animation: "/bot1/Goalkeeper Diving right.fbx" },            // 3 - GOAL
        { pos: [5, 1.2, -18], name: "Miss right", animation: "/bot1/Goalkeeper Diving right.fbx" },              // 4 - MISS (wide)
        { pos: [3, 0.5, -19], name: "Bottom right", animation: "/bot1/Goalkeeper Body right low.fbx" },          // 5 - GOAL
        { pos: [-3, 0.5, -19], name: "Bottom left", animation: "/bot1/Goalkeeper Body left low.fbx" },           // 6 - GOAL
        { pos: [-2, 1.2, -19], name: "Left center", animation: "/bot1/Goalkeeper Diving left.fbx" },             // 7 - GOAL
        { pos: [-5, 1.2, -18], name: "Left miss", animation: "/bot1/Goalkeeper Diving left.fbx" },               // 8 - MISS (wide)
        { pos: [-3.5, 2.2, -19], name: "Top left corner", animation: "/bot1/Goalkeeper Diving left.fbx" },       // 9 - GOAL (within posts)
        { pos: [0, 2.2, -19], name: "Top center", animation: "/bot1/Goalkeeper Catch middle.fbx" },              // 10 - GOAL
        { pos: [0, 3.5, -18], name: "Over the bar miss", animation: "/bot1/Goalkeeper Catch middle.fbx" }        // 11 - MISS (over bar)
      ]
      
      // Randomly select a target
      const randomTarget = goalTargets[Math.floor(Math.random() * goalTargets.length)]
      // Trigger goalkeeper animation with slight delay to react to ball movement
      setTimeout(() => {
        playGoalkeeperAnimation(randomTarget.animation)
      }, 300) // 0.3s delay for realistic reaction time

      animateBallWithPhysics(startPos, randomTarget.pos, 1500, () => {
        if (ballState) {
          // Goal detection - check if ball is within goal posts
          const ballFinalPos = ballState.position
          // Goal dimensions (standard football goal)
          const goalWidth = 8 // Total width: 8 units (-4 to +4)
          const goalHeight = 2.4 // Standard height: 2.4 units
          const goalZ = -18 // Goal line Z position
          const goalTolerance = 1 // Allow some tolerance for ball to cross goal line
          
          // Check if ball is within goal boundaries
          const withinGoalWidth = ballFinalPos[0] >= -goalWidth/2 && ballFinalPos[0] <= goalWidth/2
          const withinGoalHeight = ballFinalPos[1] >= 0 && ballFinalPos[1] <= goalHeight
          const crossedGoalLine = ballFinalPos[2] <= (goalZ + goalTolerance)
          
          const actualGoal = withinGoalWidth && withinGoalHeight && crossedGoalLine
          
          if (actualGoal) {
            // Goal scored
          } else {
            const reason = !withinGoalWidth ? 'wide' : 
                         !withinGoalHeight ? 'high' : 
                         !crossedGoalLine ? 'short' : 'unknown'
            // Miss reason: reason
          }
          
          // Hide ball after a short delay
          setTimeout(() => {
            ballState.hidden = true
          }, 500)
        }
      })
    }, 600)
  }, 1600)

  // Phase 5: Transition to running animation
  setTimeout(() => {
    if (sceneRefs.actions && sceneRefs.actions[1]) {
      sceneRefs.actions[1].fadeOut(0.2)
    }

    animationState.currentIndex = 2 // Running animation
    if (sceneRefs.actions && sceneRefs.actions[2]) {
      sceneRefs.actions[2].reset().fadeIn(0.2).play()
    }
  }, 2200)

  // End sequence - adjusted for slower celebration (1s ball chase + 1.8s touchline + 2s corner + 1.5s off screen)
  setTimeout(() => {
    animationState.isStrikeSequenceActive = false
  }, 8000)
}

const rotateAndDropBall = () => {
  // Show goalkeeper
  showGoalkeeper.value = true
  if (sceneRefs.modelGroup && ballState) {
    // Rotate the character 180 degrees to face the goal
    const modelGroup = sceneRefs.modelGroup
    const currentRotation = modelGroup.rotation.y
    const targetRotation = currentRotation + Math.PI
    
    // Place ball in front of player immediately
    const modelPosition = modelGroup.position
    const forwardOffset = 1.5 // In front of player
    
    // Calculate position in front of player after rotation
    const ballX = modelPosition.x + Math.sin(targetRotation) * forwardOffset
    const ballZ = modelPosition.z + Math.cos(targetRotation) * forwardOffset
    const ballY = 0.1 // Ground level
    
    ballState.position = [ballX, ballY, ballZ]
    ballState.hidden = false
    // Animate the rotation
    const rotationDuration = 500
    const startTime = Date.now()
    const startRotation = currentRotation
    
    const animateRotation = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / rotationDuration, 1)
      
      // Smooth easing
      const easedProgress = 1 - Math.pow(1 - progress, 2)
      
      modelGroup.rotation.y = startRotation + (targetRotation - startRotation) * easedProgress
      
      if (progress < 1) {
        requestAnimationFrame(animateRotation)
      } else {
        }
    }
    
    animateRotation()
  }
}

const resetCharacterPosition = () => {
  // Stop any ongoing ball animations
  if (typeof stopBallAnimation === 'function') {
    stopBallAnimation()
  }

  // Stop running animation if active
  if (sceneRefs.actions && sceneRefs.actions[2]) {
    sceneRefs.actions[2].fadeOut(0.4)
  }

  // Stop strike animation if active
  if (sceneRefs.actions && sceneRefs.actions[1]) {
    sceneRefs.actions[1].fadeOut(0.4)
  }

  if (sceneRefs.modelGroup) {
    const modelGroup = sceneRefs.modelGroup
    const currentPosition = modelGroup.position.clone()
    const originalPosition = new THREE.Vector3(0, sceneOffsetY.value, 0)

    const returnDuration = 1200 // Slightly longer for smoother movement
    const startTime = Date.now()

    const animateReturn = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / returnDuration, 1)

      // Smooth easing for better visual appeal
      const easedProgress = 1 - Math.pow(1 - progress, 3) // Ease out cubic

      modelGroup.position.lerpVectors(currentPosition, originalPosition, easedProgress)

      if (progress < 1) {
        requestAnimationFrame(animateReturn)
      } else {
        setTimeout(() => {
          // Return to idle animation
          animationState.currentIndex = 0
          if (sceneRefs.actions && sceneRefs.actions[0]) {
            sceneRefs.actions[0].reset().fadeIn(0.6).play()
          }
          animationState.isStrikeSequenceActive = false
        }, 200)
      }
    }

    animateReturn()
  }

  // Reset ball position
  setTimeout(() => {
    if (sceneRefs.camera && ballState) {
      const camPos = sceneRefs.camera.position
      ballState.position = [camPos.x, Math.max(0.1, camPos.y - 0.5), camPos.z - 2]
      ballState.hidden = false
      }
  }, 300)
}

// Mobile video controls
const setVideoPlaybackRate = () => {
  if (backgroundVideo.value) {
    backgroundVideo.value.playbackRate = isPowerSaveMode.value ? 0.3 : 0.5
    backgroundVideo.value.loop = true
    }
}

const ensureVideoLoop = () => {
  if (backgroundVideo.value) {
    backgroundVideo.value.currentTime = 0
    backgroundVideo.value.play()
  }
}

// Mobile-optimized combined filter
const getMobileCombinedFilter = () => {
  const filters = []
  
  // Simplified bloom for mobile
  if (mobileBloomEnabled.value && mobileCameraBloom.value > 0) {
    const bloomIntensity = mobileCameraBloom.value * 0.5 // Reduced intensity
    const brightness = 1 + (bloomIntensity * 0.2)
    const saturate = 1 + (bloomIntensity * 0.3)
    
    filters.push(`brightness(${brightness})`)
    filters.push(`saturate(${saturate})`)
  }
  
  return filters.length > 0 ? filters.join(' ') : 'none'
}

// Fog color helper
const getFogColorWithOpacity = () => {
  return new THREE.Color(0x666666) // Simple gray fog for mobile
}

// Show camera data panel
const showCameraData = () => {
  if (sceneRefs.camera && sceneRefs.scene) {
    const position = sceneRefs.camera.position
    const rotation = sceneRefs.camera.rotation
    const fov = sceneRefs.camera.fov || mobileCameraFov.value
    
    let target = { x: 0, y: 0, z: 0 }
    if (sceneRefs.scene.userData.controls) {
      target = sceneRefs.scene.userData.controls.target
    }
    
    const cameraData = {
      position: { 
        x: position.x.toFixed(3), 
        y: position.y.toFixed(3), 
        z: position.z.toFixed(3) 
      },
      rotation: { 
        x: rotation.x.toFixed(3), 
        y: rotation.y.toFixed(3), 
        z: rotation.z.toFixed(3) 
      },
      fov: fov,
      target: { 
        x: target.x.toFixed(3), 
        y: target.y.toFixed(3), 
        z: target.z.toFixed(3) 
      }
    }
    
    cameraDataDisplay.value = JSON.stringify(cameraData, null, 2)
    showCameraDataPanel.value = true
  }
}

// Copy camera data to clipboard
const copyCameraData = () => {
  navigator.clipboard.writeText(cameraDataDisplay.value).then(() => {
    console.log('Camera data copied to clipboard')
  }).catch(err => {
    console.error('Failed to copy camera data:', err)
  })
}

// Navigate to play game
const startGame = () => {
  router.push('/play-game')
}

// Camera settings storage
const saveCameraSettings = () => {
  if (sceneRefs.camera && sceneRefs.scene) {
    // Get camera position
    const position = sceneRefs.camera.position
    
    // Get camera rotation (from looking at target)
    const rotation = sceneRefs.camera.rotation
    
    // Get camera zoom/fov
    const fov = sceneRefs.camera.fov || mobileCameraFov.value
    
    // Get orbit controls target if available
    let target = { x: 0, y: 0, z: 0 }
    if (sceneRefs.scene.userData.controls) {
      target = sceneRefs.scene.userData.controls.target
    }
    
    const cameraSettings = {
      position: { x: position.x, y: position.y, z: position.z },
      rotation: { x: rotation.x, y: rotation.y, z: rotation.z },
      fov: fov,
      target: target
    }
    
    // Save to localStorage
    localStorage.setItem('autoBattlerCameraSettings', JSON.stringify(cameraSettings))
    console.log('Camera settings saved:', cameraSettings)
  }
}

const resetCameraSettings = () => {
  // Remove saved settings
  localStorage.removeItem('autoBattlerCameraSettings')
  
  // Reset to default position
  if (sceneRefs.camera) {
    if (props.showTriangleFormation) {
      // Auto-battler specific defaults
      sceneRefs.camera.position.set(-29.594, 7.146, -2.400)
      sceneRefs.camera.rotation.set(-1.536, -1.302, -1.535)
      sceneRefs.camera.fov = 42
    } else {
      // Normal mode defaults
      sceneRefs.camera.position.set(...mobileCameraPosition.value)
      sceneRefs.camera.fov = mobileCameraFov.value
    }
    sceneRefs.camera.updateProjectionMatrix()
    
    // Reset controls target if available
    if (sceneRefs.scene && sceneRefs.scene.userData.controls) {
      sceneRefs.scene.userData.controls.target.set(0, 0, 0)
      sceneRefs.scene.userData.controls.update()
    }
  }
  console.log('Camera reset to default')
}

// Load saved camera settings on mount
const loadSavedCameraSettings = () => {
  const savedSettings = localStorage.getItem('autoBattlerCameraSettings')
  if (savedSettings && sceneRefs.camera) {
    try {
      const settings = JSON.parse(savedSettings)
      
      // Apply saved position
      if (settings.position) {
        sceneRefs.camera.position.set(settings.position.x, settings.position.y, settings.position.z)
      }
      
      // Apply saved rotation
      if (settings.rotation) {
        sceneRefs.camera.rotation.set(settings.rotation.x, settings.rotation.y, settings.rotation.z)
      }
      
      // Apply saved FOV
      if (settings.fov) {
        sceneRefs.camera.fov = settings.fov
        sceneRefs.camera.updateProjectionMatrix()
      }
      
      // Apply saved controls target
      if (settings.target && sceneRefs.scene && sceneRefs.scene.userData.controls) {
        sceneRefs.scene.userData.controls.target.set(settings.target.x, settings.target.y, settings.target.z)
        sceneRefs.scene.userData.controls.update()
      }
      
      console.log('Loaded saved camera settings:', settings)
    } catch (error) {
      console.error('Error loading camera settings:', error)
    }
  }
}

// Color update methods
const updateOverlayColor = (color: string) => {
  // Extract hue from HSL color string
  const match = color.match(/hsl\((\d+),/)
  if (match) {
    const hue = parseInt(match[1])
    // Use the useAnimations composable method
    updateOverlayColorFromAnimation(hue, 1.0, 0.5)
  }
}

const updateTorusEmission = (colorValue: string) => {
  // Extract hue from HSL color string and create THREE.Color
  const match = colorValue.match(/hsl\((\d+),/)
  if (match) {
    const hue = parseInt(match[1])
    // Create a THREE.Color from HSL
    const color = new THREE.Color()
    color.setHSL(hue / 360, 1.0, 0.5)
    // Use the useSceneSetup method to update the actual torus
    updateTorusColorFromSetup(color)
  }
}

// Scene event handlers
const onSceneReady = (event: any) => {
  if (event.scene && !sceneRefs.scene) {
    sceneRefs.scene = event.scene.value || event.scene
  }
  
  if (event.camera && !sceneRefs.camera) {
    sceneRefs.camera = event.camera.value || event.camera
  }
  
  if (event.renderer && !sceneRefs.renderer) {
    sceneRefs.renderer = event.renderer.value || event.renderer
  }
  
  if (sceneRefs.scene && sceneRefs.camera && sceneRefs.renderer) {
    loadingStatus.value = 'Ready'
    
    // Set auto-battler camera configuration
    if (props.showTriangleFormation) {
      setTimeout(() => {
        // Set camera position
        sceneRefs.camera.position.set(-29.594, 7.146, -2.400)
        
        // Set camera rotation
        sceneRefs.camera.rotation.set(-1.536, -1.302, -1.535)
        
        // Set FOV
        sceneRefs.camera.fov = 42
        sceneRefs.camera.updateProjectionMatrix()
        
        // Set controls target
        if (sceneRefs.scene.userData.controls) {
          sceneRefs.scene.userData.controls.target.set(0, 0, 0)
          sceneRefs.scene.userData.controls.update()
        }
        
        // Then load any saved settings if they exist
        loadSavedCameraSettings()
      }, 100)
    }
  }
}

const onSceneRender = (event: any) => {
  if (!sceneRefs.scene && event.scene) {
    sceneRefs.scene = event.scene
  }
}

// Find head bone in model
const findHeadBone = (model: THREE.Object3D): THREE.Bone | null => {
  let headBone: THREE.Bone | null = null
  
  model.traverse((child) => {
    if (child instanceof THREE.Bone) {
      const name = child.name.toLowerCase()
      if (name.includes('head') || name.includes('cabeza') || name.includes('tete')) {
        headBone = child
      }
    }
  })
  
  return headBone
}

// Update label positions to follow characters on ground
const updateLabelPositions = () => {
  if (!props.showDanceBot) return
  
  // Update DanBot label
  if (modelGroup.value && mainCharacterLabel.value?.value) {
    const characterWorldPos = new THREE.Vector3()
    modelGroup.value.getWorldPosition(characterWorldPos)
    
    // Get the mesh object
    const mesh = mainCharacterLabel.value.value
    if (mesh && mesh.position) {
      // Position label on ground in front of character
      mesh.position.set(characterWorldPos.x, 0.01, characterWorldPos.z + 1)
    }
  }
  
  // Update JamieBot label
  if (danceBotGroup.value && jamieBotLabel.value?.value) {
    const botWorldPos = new THREE.Vector3()
    danceBotGroup.value.getWorldPosition(botWorldPos)
    
    // Get the mesh object
    const mesh = jamieBotLabel.value.value
    if (mesh && mesh.position) {
      // Position label on ground in front of bot
      mesh.position.set(botWorldPos.x, 0.01, botWorldPos.z + 1)
    }
  }
  
  // Update CansuBot label
  if (cansuBotGroup.value && cansuBotLabel.value?.value) {
    const botWorldPos = new THREE.Vector3()
    cansuBotGroup.value.getWorldPosition(botWorldPos)
    
    // Get the mesh object
    const mesh = cansuBotLabel.value.value
    if (mesh && mesh.position) {
      // Position label on ground in front of bot
      mesh.position.set(botWorldPos.x, 0.01, botWorldPos.z + 1)
    }
  }
}

// Animation loop
const animationLoop = () => {
  const deltaTime = updateAnimations()
  updateBallPhysics(deltaTime)
  
  // Update goalkeeper animation
  if (sceneRefs.goalkeeperMixer) {
    sceneRefs.goalkeeperMixer.update(deltaTime)
  }
  
  // Update dance bot animation
  if (sceneRefs.danceBotMixer) {
    sceneRefs.danceBotMixer.update(deltaTime)
  }
  
  // Update cansu bot animation
  if (sceneRefs.cansuBotMixer) {
    sceneRefs.cansuBotMixer.update(deltaTime)
  }
  
  // Update additional character mixers (triangle formation)
  if (sceneRefs.additionalMixers) {
    sceneRefs.additionalMixers.forEach(mixer => mixer.update(deltaTime))
  }
  
  // Update label positions to follow head bones
  updateLabelPositions()
  
  requestAnimationFrame(animationLoop)
}

// Performance detection on mount
onMounted(async () => {
  // Initialize label textures for dance page
  if (props.showDanceBot) {
    initializeLabelTextures()
  }
  
  // Initialize pellet packs
  initializePelletPacks()
  
  // Detect device performance
  const performanceLevel = await detectPerformanceLevel()
  // Apply optimal settings based on device
  const optimalSettings = getOptimalSettings(performanceLevel)
  Object.assign({
    mobileBloomEnabled: mobileBloomEnabled.value,
    mobileFogEnabled: mobileFogEnabled.value,
    showGrass: showGrass.value
  }, optimalSettings)

  // Show performance warning for low-end devices
  if (performanceLevel === 'low') {
    setTimeout(() => {
      showPerformanceWarning.value = true
    }, 2000)
  }

  animationLoop()

  // Watch for camera position changes
  watch(mobileCameraPosition, (newPos, oldPos) => {
    // Camera position change tracking removed
  }, { deep: true })

  // Watch for FOV changes
  watch(mobileCameraFov, (newFov, oldFov) => {
    // FOV change tracking removed
  })
})

// Watch for mobile-specific changes
watch(isPowerSaveMode, (enabled) => {
  if (enabled) {
    enablePowerSave()
  }
})

// Connect refs
watch(modelGroup, (newModelGroup) => {
  if (newModelGroup) {
    sceneRefs.modelGroup = newModelGroup
    loadCharacterModel().then(() => {
      addTorusToCharacter()
      // Add field elements like desktop version
      createGrassField() // Add PBR grass texture field
      createCenterCircle() // Add center circle and spot
      createFootballFieldLines() // Add football field markings
      loadGoalpostModel() // Add goalposts to both ends of the field
      loadCornerFlags() // Add corner flags to all 4 corners
      
      // Load goalkeeper after main character is ready
      loadGoalkeeper().then(() => {
        })
      
      // Mark as ready
      isReady.value = true
      loadingStatus.value = 'Ready'
      
      // Mark main character as loaded and check for synchronized dance
      if (props.showDanceBot) {
        mainCharacterLoaded.value = true
        // Find head bone for main character
        if (sceneRefs.modelGroup) {
          headBones.value.mainCharacter = findHeadBone(sceneRefs.modelGroup)
          console.log('Main character head bone found:', headBones.value.mainCharacter)
        }
        startSynchronizedDance()
      }
      
    })
  }
}, { once: true })

// Watch for modelGroup2 (triangle formation - left midfielder)
watch(modelGroup2, (newModelGroup) => {
  if (newModelGroup && props.showTriangleFormation) {
    // Load with 300ms delay
    loadCharacterCopy(newModelGroup, 300, false, false, 1)
  }
}, { once: true })

// Watch for modelGroup3 (triangle formation - right midfielder)
watch(modelGroup3, (newModelGroup) => {
  if (newModelGroup && props.showTriangleFormation) {
    // Load with 600ms delay
    loadCharacterCopy(newModelGroup, 600, false, false, 2)
  }
}, { once: true })

// Watch for modelGroup4 (triangle formation - defender)
watch(modelGroup4, (newModelGroup) => {
  if (newModelGroup && props.showTriangleFormation) {
    // Load with 900ms delay
    loadCharacterCopy(newModelGroup, 900, false, false, 3)
  }
}, { once: true })

// Watch for modelGroup5 (triangle formation - goalkeeper)
watch(modelGroup5, (newModelGroup) => {
  if (newModelGroup && props.showTriangleFormation) {
    // Load goalkeeper with 1200ms delay
    loadCharacterCopy(newModelGroup, 1200, true, false, 4)
  }
}, { once: true })

// Watch for opposing team model groups
watch(opposingModelGroup1, (newModelGroup) => {
  if (newModelGroup && props.showTriangleFormation) {
    // Opposing goalkeeper with 1500ms delay
    loadCharacterCopy(newModelGroup, 1500, true, true, 0)
  }
}, { once: true })

watch(opposingModelGroup2, (newModelGroup) => {
  if (newModelGroup && props.showTriangleFormation) {
    // Opposing defender with 1800ms delay
    loadCharacterCopy(newModelGroup, 1800, false, true, 1)
  }
}, { once: true })

watch(opposingModelGroup3, (newModelGroup) => {
  if (newModelGroup && props.showTriangleFormation) {
    // Opposing mid right with 2100ms delay
    loadCharacterCopy(newModelGroup, 2100, false, true, 2)
  }
}, { once: true })

watch(opposingModelGroup4, (newModelGroup) => {
  if (newModelGroup && props.showTriangleFormation) {
    // Opposing mid left with 2400ms delay
    loadCharacterCopy(newModelGroup, 2400, false, true, 3)
  }
}, { once: true })

watch(opposingModelGroup5, (newModelGroup) => {
  if (newModelGroup && props.showTriangleFormation) {
    // Opposing striker with 2700ms delay
    loadCharacterCopy(newModelGroup, 2700, false, true, 4)
  }
}, { once: true })

watch(goalkeeperGroup, (newGoalkeeperGroup) => {
  if (newGoalkeeperGroup) {
    // Don't load goalkeeper here, wait for main character to load first
  }
})

watch(ballModelGroup, (newBallGroup) => {
  if (newBallGroup) {
    sceneRefs.ballModelGroup = newBallGroup
    // Ball model will be loaded after character loads
    loadBallModel().then(() => {
      // Position ball at center for triangle formation
      if (props.showTriangleFormation && ballState) {
        ballState.position = [0, 0.2, 0]
        ballState.hidden = false
      }
    })
  }
}, { once: true })

watch(danceBotGroup, (newDanceBotGroup) => {
  if (newDanceBotGroup && props.showDanceBot) {
    loadDanceBot()
  }
}, { once: true })

watch(cansuBotGroup, (newCansuBotGroup) => {
  if (newCansuBotGroup && props.showDanceBot) {
    loadCansuBot()
  }
}, { once: true })

onBeforeUnmount(() => {
  })

// Expose methods for parent component
defineExpose({
  updateOverlayColor,
  updateTorusEmission,
  updateTokenBalances
})
</script>

<style scoped>
.mobile-scene-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 100px 0 100px 0; /* Add padding for top music player and bottom control panel */
  overflow: hidden;
  touch-action: manipulation;
  -webkit-overflow-scrolling: touch;
  box-sizing: border-box;
}

.mobile-scene-container.screen-shake-active {
  animation: mobileScreenShake 0.3s ease-out;
}

@keyframes mobileScreenShake {
  0%, 100% { transform: translate3d(0, 0, 0); }
  25% { transform: translate3d(-2px, 1px, 0); }
  50% { transform: translate3d(2px, -1px, 0); }
  75% { transform: translate3d(-1px, 2px, 0); }
}

.mobile-background-video {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: translate(-50%, -50%);
  z-index: -1;
}

.mobile-settings-panel {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.mobile-settings-content {
  background: rgba(30, 30, 30, 0.95);
  border-radius: 16px;
  padding: 24px;
  margin: 20px;
  max-width: 400px;
  width: calc(100% - 40px);
  max-height: 80vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.mobile-settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  color: white;
}

.mobile-settings-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.mobile-settings-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-item label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 500;
}

.mobile-slider {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
}

.mobile-slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  background: #007AFF;
  border-radius: 50%;
  cursor: pointer;
}

.mobile-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #007AFF;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.toggle-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}


.color-controls-top-left {
  position: fixed;
  top: 76px;
  left: 16px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: auto;  /* Ensure mouse events work */
  max-width: 220px;      /* Set max width for desktop */
}

.mobile-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1500;
  background: rgba(0, 0, 0, 0.8);
  padding: 24px;
  border-radius: 16px;
  text-align: center;
  color: white;
  backdrop-filter: blur(10px);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #007AFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.mobile-performance-warning {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #010224;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.warning-content {
  background: rgba(30, 30, 30, 0.95);
  border-radius: 16px;
  padding: 24px;
  margin: 20px;
  max-width: 360px;
  width: calc(100% - 40px);
  text-align: center;
  color: white;
  border: 1px solid rgba(255, 165, 0, 0.3);
}

.warning-content h4 {
  margin: 0 0 16px;
  color: #FFA500;
  font-size: 18px;
}

.warning-content p {
  margin: 0 0 24px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
}

.warning-actions {
  display: flex;
  gap: 12px;
  flex-direction: column;
}

.primary-btn {
  background: #007AFF;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.primary-btn:hover {
  background: #0056CC;
}

.secondary-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 12px 24px;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.secondary-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Touch-friendly adjustments */
@media (max-width: 600px) {
  .mobile-settings-content {
    margin: 16px;
    padding: 20px;
  }
  
  
  .primary-btn,
  .secondary-btn {
    min-height: 48px;
    font-size: 16px;
  }
}

/* Token Attributes Display */
.token-attributes-display {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1100;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 16px;
  min-width: 200px;
  max-width: 250px;
}

.attributes-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.attributes-header .token-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 50%;
}

.attributes-header .token-name {
  font-size: 18px;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.attributes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.attribute-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.attr-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.attr-value {
  font-size: 20px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* Mobile adjustments for attributes display */
@media (max-width: 768px) {
  .token-attributes-display {
    top: 10px;
    left: 10px;
    padding: 12px;
    min-width: 180px;
  }
  
  .attributes-header .token-logo {
    width: 28px;
    height: 28px;
  }
  
  .attributes-header .token-name {
    font-size: 16px;
  }
  
  .attributes-grid {
    gap: 8px;
  }
  
  .attribute-item {
    padding: 6px;
  }
  
  .attr-value {
    font-size: 18px;
  }
}

/* Settings Cog Button */
.settings-cog-btn {
  position: fixed;
  bottom: 120px;
  right: 20px;
  z-index: 1101;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.settings-cog-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
}

.settings-cog-btn.active {
  background: rgba(0, 122, 255, 0.3);
  border-color: rgba(0, 122, 255, 0.6);
}

.settings-cog-btn.active .cog-icon {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Camera Controls */
.camera-controls-container {
  position: fixed;
  bottom: 190px;
  right: 20px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Slide Fade Transition */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}

.camera-control-btn {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 12px 20px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 140px;
}

.camera-control-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.camera-control-btn:active {
  transform: translateY(0);
}

.camera-control-btn.save-btn {
  background: rgba(0, 122, 255, 0.2);
  border-color: rgba(0, 122, 255, 0.5);
}

.camera-control-btn.save-btn:hover {
  background: rgba(0, 122, 255, 0.3);
}

.camera-control-btn.reset-btn {
  background: rgba(255, 69, 58, 0.2);
  border-color: rgba(255, 69, 58, 0.5);
}

.camera-control-btn.reset-btn:hover {
  background: rgba(255, 69, 58, 0.3);
}

.btn-icon {
  font-size: 18px;
}

.camera-control-btn.info-btn {
  background: rgba(52, 199, 89, 0.2);
  border-color: rgba(52, 199, 89, 0.5);
}

.camera-control-btn.info-btn:hover {
  background: rgba(52, 199, 89, 0.3);
}

.camera-control-btn.walkout-btn {
  background: rgba(255, 149, 0, 0.2);
  border-color: rgba(255, 149, 0, 0.5);
}

.camera-control-btn.walkout-btn:hover {
  background: rgba(255, 149, 0, 0.3);
}

/* Camera Data Panel */
.camera-data-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2000;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 0;
  min-width: 400px;
  max-width: 90vw;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.camera-data-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.camera-data-header h3 {
  margin: 0;
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.close-data-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-data-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.camera-data-content {
  padding: 20px;
}

.camera-data-content pre {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
  color: #00ff41;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  margin: 0 0 16px 0;
  overflow-x: auto;
  max-height: 400px;
}

.copy-data-btn {
  background: rgba(0, 122, 255, 0.2);
  border: 1px solid rgba(0, 122, 255, 0.5);
  border-radius: 8px;
  padding: 10px 20px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 auto;
}

.copy-data-btn:hover {
  background: rgba(0, 122, 255, 0.3);
  transform: translateY(-1px);
}

/* Add walking animation placeholder */
@keyframes playerWalk {
  0% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
  100% { transform: translateY(0); }
}

/* Auto-Battler Controls */
.auto-battler-controls {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1100;
}

.start-game-btn {
  background: linear-gradient(135deg, #10B981, #34D399);
  border: none;
  border-radius: 16px;
  padding: 16px 32px;
  color: white;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 
    0 4px 0 0 #059669,
    0 8px 16px rgba(0, 0, 0, 0.3);
  transition: background 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  position: relative;
}

.start-game-btn:hover {
  background: linear-gradient(135deg, #34D399, #6EE7B7);
}

.start-game-btn:active {
  top: 2px;
  box-shadow: 
    0 2px 0 0 #059669,
    0 4px 8px rgba(0, 0, 0, 0.2);
}

.start-game-btn .btn-icon {
  font-size: 24px;
}
</style>
