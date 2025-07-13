<template>
  <v-app>
    <!-- Navigation drawer removed - color controls now in scene -->

    <v-main>
      <!-- 3D Scene Container -->
      <div 
        class="scene-container" 
        :class="{ 'screen-shake-active': isScreenShaking }"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd">
        
        <!-- Mobile optimized background -->
        <div 
          v-if="!isMobile || qualityLevel !== 'low'"
          class="background-video-container">
          <video 
            ref="backgroundVideo"
            :autoplay="!isMobile"
            loop 
            muted 
            playsinline
            :poster="isMobile ? '/textures/stadium_bg_mobile.jpg' : '/textures/stadium_bg.jpg'"
            class="background-video"
            :style="getBackgroundStyle()">
            <source 
              :src="isMobile ? '/video/stadium_mobile.mp4' : '/video/stadium.mp4'" 
              type="video/mp4" />
          </video>
        </div>

        <!-- Fallback background for low quality -->
        <div 
          v-else
          class="background-fallback"
          :style="{ backgroundImage: 'url(/textures/stadium_bg_mobile.jpg)' }">
        </div>

        <!-- Original 3D Scene Canvas -->
        <MobileSelectBotScene ref="sceneCanvas" />

        <!-- Touch Control Hints -->
        <div v-if="showTouchHints" class="touch-hints">
          <v-card 
            class="pa-4 ma-4 glass-effect" 
            rounded="lg"
            @click="showTouchHints = false">
            <v-card-text class="text-center">
              <v-icon size="large" class="mb-2">mdi-gesture-swipe</v-icon>
              <div class="text-body-2 mb-2">Touch Controls</div>
              <div class="text-caption">
                • Single touch: Rotate camera<br>
                • Two fingers: Zoom in/out<br>
                • Tap: Interact with scene
              </div>
              <v-btn 
                size="small" 
                color="primary" 
                class="mt-2"
                @click="showTouchHints = false">
                Got it!
              </v-btn>
            </v-card-text>
          </v-card>
        </div>
        
        <!-- Token Attributes Display - Enhanced left side -->
        <div class="token-attributes-panel">
          <div v-if="currentPelletPack" class="attributes-content">
            <div class="attributes-header">
              <img 
                v-if="currentPelletPack.logoURI" 
                :src="currentPelletPack.logoURI" 
                :alt="currentPelletPack.tokenSymbol"
                class="token-logo"
              />
              <div class="token-info">
                <span class="token-name">{{ currentPelletPack.tokenSymbol }}</span>
                <span class="token-team">{{ getTokenTeamName(currentPelletPack.tokenSymbol) }}</span>
              </div>
            </div>
            
            <div class="attributes-breakdown">
              <div class="attribute-row" v-for="attr in currentTokenAttributes" :key="attr.key">
                <span class="attr-label">{{ attr.label }}</span>
                <div class="attr-bar-container">
                  <div 
                    class="attr-bar-fill" 
                    :style="{ 
                      width: attr.value + '%',
                      backgroundColor: getAttributeColor(attr.value)
                    }"
                  ></div>
                </div>
                <span class="attr-value" :style="{ color: getAttributeColor(attr.value) }">{{ attr.value }}</span>
              </div>
            </div>
            
            <div class="token-stats">
              <div class="stat-item">
                <span class="stat-label">Balance</span>
                <span class="stat-value">{{ currentPelletPack.tokenBalance }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Power</span>
                <span class="stat-value">{{ currentPelletPack.powerMultiplier }}x</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Player Card V3 - Top Right -->
        <div class="player-card-container">
          <div class="player-card-wrapper">
            <PlayerCardV3
              v-if="currentPlayerData"
              :player="currentPlayerData"
              :is-selected="false"
              @click="handlePlayerCardClick"
              @compare="handlePlayerCompare"
              @recruit="handlePlayerRecruit"
              @select-bot="handleSelectBot"
            />
          </div>
        </div>
      </div>
    </v-main>

  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useDisplay } from 'vuetify'
import MobileSelectBotScene from "@/components/MobileSelectBotScene.vue"
import PlayerCardV3 from '@/components/recruit/PlayerCardV3.vue'
import { useAudio } from '@/composables/useAudio'
import { useWallet } from '@/composables/useWallet'

// Vuetify composables
const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

// UI State
const drawer = ref(false)
const showTouchHints = ref(true)

// Performance tracking
const fps = ref(60)

// Quality settings
const qualityLevel = ref('medium')
const qualityOptions = [
  { title: 'Low (Best Performance)', value: 'low' },
  { title: 'Medium (Balanced)', value: 'medium' },
  { title: 'High (Best Quality)', value: 'high' }
]

// Simple scene state
const isScreenShaking = ref(false)
const activePanel = ref(['performance'])

// Color controls state
const shortColorHue = ref(218) // Default blue-ish
const torusColorHue = ref(195) // Default blue-ish

// Audio system - get toggle function for play button, global footer handles full controls
const { audioState, toggleBackgroundMusic } = useAudio()

// Wallet integration
const { tokens, isConnected, connectWallet, fetchTokens } = useWallet()

// Scene reference
const sceneCanvas = ref()

// Current player data for PlayerCardV3 - computed based on selected token
const currentPlayerData = computed(() => {
  if (!currentPelletPack.value) {
    return {
      id: 1,
      name: 'Gen 1 DanBot',
      position: 'FW',
      nationality: 'Digital',
      overall: 50,
      tier: 'semi-pro',
      price: 2500000,
      stats: {
        pace: 52,
        shooting: 55,
        passing: 48,
        defense: 42,
        physical: 50,
        dribbling: 53
      },
      bot: { name: 'DanBot', model: '/bot1/soccer_player.fbx' }
    }
  }
  
  const tokenData = tokenTeamData[currentPelletPack.value.tokenSymbol]
  const tokenSymbol = currentPelletPack.value.tokenSymbol
  
  // Map token attributes to player card stats
  return {
    id: 1,
    name: 'Gen 1 DanBot',
    position: 'FW',
    nationality: tokenData?.team || 'Digital',
    overall: tokenData?.overall || 75,
    tier: tokenData?.overall >= 55 ? 'amateur' : tokenData?.overall >= 50 ? 'semi-pro' : 'amateur',
    price: (tokenData?.overall || 75) * 50000,
    stats: {
      pace: tokenData?.speed || 75,
      shooting: tokenData?.attack || 75,
      passing: tokenData?.skill || 75,
      defense: tokenData?.defense || 75,
      physical: tokenData?.physical || 75,
      dribbling: tokenData?.mental || 75
    },
    bot: { name: 'DanBot', model: '/bot1/soccer_player.fbx' }
  }
})

// Computed properties
const fpsColor = computed(() => {
  if (fps.value >= 50) return 'success'
  if (fps.value >= 30) return 'warning'
  return 'error'
})

const qualityColor = computed(() => {
  switch (qualityLevel.value) {
    case 'high': return 'success'
    case 'medium': return 'warning'
    case 'low': return 'error'
    default: return 'primary'
  }
})

// Touch handling
const touchState = ref({
  startX: 0,
  startY: 0,
  startDistance: 0,
  isMultiTouch: false
})

const handleTouchStart = (event: TouchEvent) => {
  if (event.touches.length === 1) {
    touchState.value.startX = event.touches[0].clientX
    touchState.value.startY = event.touches[0].clientY
    touchState.value.isMultiTouch = false
  } else if (event.touches.length === 2) {
    const dx = event.touches[0].clientX - event.touches[1].clientX
    const dy = event.touches[0].clientY - event.touches[1].clientY
    touchState.value.startDistance = Math.sqrt(dx * dx + dy * dy)
    touchState.value.isMultiTouch = true
  }
  
  // Hide touch hints after first interaction
  if (showTouchHints.value) {
    setTimeout(() => { showTouchHints.value = false }, 3000)
  }
}

const handleTouchMove = (event: TouchEvent) => {
  event.preventDefault() // Prevent scrolling
  
  if (touchState.value.isMultiTouch && event.touches.length === 2) {
    // Handle pinch-to-zoom
    const dx = event.touches[0].clientX - event.touches[1].clientX
    const dy = event.touches[0].clientY - event.touches[1].clientY
    const currentDistance = Math.sqrt(dx * dx + dy * dy)
    
    const scale = currentDistance / touchState.value.startDistance
    // You could emit this to the 3D scene for camera zoom
  }
}

const handleTouchEnd = (event: TouchEvent) => {
  touchState.value.isMultiTouch = false
}

// Simple performance monitoring
const updateFps = (newFps: number) => {
  fps.value = Math.round(newFps)
}

// Color control methods removed - now handled in scene component

// Music control - simple toggle to start/pause music, global footer handles full controls
const toggleMusic = () => {
  toggleBackgroundMusic()
}

// Simple scene interactions
const triggerAction = () => {
  // The original scene handles its own interactions
}

const resetScene = () => {
  // The original scene handles its own reset
}

const triggerScreenShake = () => {
  isScreenShaking.value = true
  setTimeout(() => {
    isScreenShaking.value = false
  }, 500)
}

const onSceneReady = () => {
  }

// Background style for mobile optimization
const getBackgroundStyle = () => {
  return {
    transform: 'translate(-50%, -50%)',
    opacity: isMobile.value && qualityLevel.value === 'low' ? 0.5 : 0.8
  }
}

// Get team name for token
const getTokenTeamName = (tokenSymbol: string) => {
  const teamNames: Record<string, string> = {
    PSG: 'Paris Saint-Germain',
    BAR: 'FC Barcelona',
    JUV: 'Juventus',
    MCI: 'Manchester City'
  }
  return teamNames[tokenSymbol] || 'Team'
}

// Token team attributes data - scores between 40-60
const tokenTeamData: Record<string, any> = {
  PSG: {
    team: 'Paris Saint-Germain',
    overall: 56,
    attack: 58,
    speed: 55,
    skill: 57,
    defense: 45,
    physical: 52,
    mental: 56,
    aggression: 54
  },
  BAR: {
    team: 'FC Barcelona',
    overall: 55,
    attack: 56,
    speed: 53,
    skill: 58,
    defense: 46,
    physical: 50,
    mental: 55,
    aggression: 48
  },
  JUV: {
    team: 'Juventus',
    overall: 52,
    attack: 51,
    speed: 49,
    skill: 52,
    defense: 55,
    physical: 53,
    mental: 54,
    aggression: 51
  },
  MCI: {
    team: 'Manchester City',
    overall: 58,
    attack: 57,
    speed: 54,
    skill: 59,
    defense: 53,
    physical: 51,
    mental: 58,
    aggression: 49
  }
}

// Current pellet pack (mock data)
const currentPelletPack = ref({
  tokenSymbol: 'PSG',
  tokenBalance: 50,
  currentPellets: 8,
  maxPellets: 8,
  color: '#FF0000',
  powerMultiplier: 1.5,
  refillCost: 8,
  logoURI: '/team-logos/psg.png'
})

// Computed token attributes
const currentTokenAttributes = computed(() => {
  if (!currentPelletPack.value) return []
  
  const tokenData = tokenTeamData[currentPelletPack.value.tokenSymbol]
  if (!tokenData) {
    return [
      { key: 'overall', label: 'Overall', value: 50 },
      { key: 'attack', label: 'Attack', value: 50 },
      { key: 'speed', label: 'Speed', value: 50 },
      { key: 'skill', label: 'Skill', value: 50 },
      { key: 'defense', label: 'Defense', value: 50 },
      { key: 'physical', label: 'Physical', value: 50 },
      { key: 'mental', label: 'Mental', value: 50 },
      { key: 'aggression', label: 'Aggression', value: 50 }
    ]
  }
  
  return [
    { key: 'overall', label: 'Overall', value: tokenData.overall },
    { key: 'attack', label: 'Attack', value: tokenData.attack },
    { key: 'speed', label: 'Speed', value: tokenData.speed },
    { key: 'skill', label: 'Skill', value: tokenData.skill },
    { key: 'defense', label: 'Defense', value: tokenData.defense },
    { key: 'physical', label: 'Physical', value: tokenData.physical },
    { key: 'mental', label: 'Mental', value: tokenData.mental },
    { key: 'aggression', label: 'Aggression', value: tokenData.aggression }
  ]
})

// Get color based on attribute value (adjusted for 40-60 range)
const getAttributeColor = (value: number): string => {
  if (value >= 55) return '#10b981' // Green for 55-60
  if (value >= 50) return '#3b82f6' // Blue for 50-54
  if (value >= 45) return '#f59e0b' // Orange for 45-49
  return '#ef4444' // Red for 40-44
}

// Player card handlers
const handlePlayerCardClick = () => {
  console.log('Player card clicked')
}

const handlePlayerCompare = () => {
  console.log('Compare player')
}

const handlePlayerRecruit = () => {
  console.log('Recruit player')
}

const handleSelectBot = () => {
  console.log('Select bot for player')
}

// Set initial quality based on device
onMounted(async () => {
  if (isMobile.value) {
    // Start with medium quality on mobile
    qualityLevel.value = 'medium'
    // Show touch hints for mobile users
    showTouchHints.value = true
  } else {
    qualityLevel.value = 'high'
    showTouchHints.value = false
  }
  
  // Try to fetch wallet tokens if connected
  try {
    if (isConnected.value) {
      await fetchTokens()
    }
  } catch (error) {
    console.log('Failed to fetch tokens:', error)
  }
})

// Watch for token changes and update scene
watch(tokens, (newTokens) => {
  if (sceneCanvas.value && newTokens.length > 0) {
    // Format tokens for pellet packs
    const formattedTokens = newTokens.map(token => ({
      symbol: token.symbol,
      balance: parseFloat(token.balance),
      logoURI: token.logoURI
    }))
    
    // Update pellet packs in the scene
    sceneCanvas.value.updateTokenBalances(formattedTokens)
    
    // Update current pellet pack if we have tokens
    if (formattedTokens.length > 0 && !currentPelletPack.value) {
      const firstToken = formattedTokens[0]
      currentPelletPack.value = {
        tokenSymbol: firstToken.symbol,
        tokenBalance: firstToken.balance,
        currentPellets: 8,
        maxPellets: 8,
        color: '#FF0000',
        powerMultiplier: 1.5,
        refillCost: 8,
        logoURI: firstToken.logoURI
      }
    }
  }
}, { deep: true })

// Watch for pellet pack selection changes from the scene
watch(() => sceneCanvas.value?.currentPelletPack, (newPack) => {
  if (newPack) {
    currentPelletPack.value = newPack
  }
}, { deep: true })
</script>

<style scoped>
.scene-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  transition: transform 0.1s ease-out;
}

.scene-container.screen-shake-active {
  animation: screenShake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes screenShake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-2px, 0, 0); }
  40%, 60% { transform: translate3d(2px, 0, 0); }
}

.background-video-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.background-video {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
}

.background-fallback {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: -1;
}

.mobile-ui-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
}

.status-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 8px;
  pointer-events: auto;
}

.action-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 16px;
  pointer-events: auto;
}

.touch-hints {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: auto;
  z-index: 200;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.mobile-drawer {
  background: rgba(33, 33, 33, 0.95) !important;
  backdrop-filter: blur(10px);
}

/* Touch-friendly sizing */
@media (max-width: 600px) {
  .v-btn {
    min-height: 48px !important;
  }
  
  .v-slider {
    margin: 8px 0 !important;
  }
  
  .v-expansion-panel-text {
    padding: 8px 16px !important;
  }
}

/* Prevent pull-to-refresh and other iOS behaviors */
.scene-container {
  touch-action: none;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: none;
}

/* Hide scrollbars on mobile */
::-webkit-scrollbar {
  display: none;
}

/* Mobile Color Slider Styles */
.mobile-color-slider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.color-preview {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.color-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Music player is now handled by global footer */

.scene-container {
  height: 100vh;
}

/* Token Attributes Panel - Left Side */
.token-attributes-panel {
  position: fixed;
  top: 90px; /* Offset for header + 20px */
  left: 280px; /* Offset for side panel + 100px */
  z-index: 100;
  width: 280px;
  max-width: 90vw;
}

.attributes-content {
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.attributes-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.token-logo {
  width: 48px;
  height: 48px;
  object-fit: contain;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px;
}

.token-info {
  display: flex;
  flex-direction: column;
}

.token-name {
  font-size: 24px;
  font-weight: 800;
  color: white;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.token-team {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 2px;
}

.attributes-breakdown {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}


.attribute-row {
  display: grid;
  grid-template-columns: 80px 1fr 40px;
  align-items: center;
  gap: 12px;
}

.attr-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.attr-bar-container {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.attr-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
  box-shadow: 0 0 10px currentColor;
}

.attr-value {
  font-size: 16px;
  font-weight: 700;
  text-align: right;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.token-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #10b981;
}

/* Player Card Container - Top Right */
.player-card-container {
  position: fixed;
  top: 90px; /* 10px below the 80px position */
  right: 20px;
  z-index: 100;
  width: 320px;
  max-width: 90vw;
}

.player-card-wrapper {
  transform: scale(0.9);
  transform-origin: top right;
}

/* Mobile Adjustments */
@media (max-width: 768px) {
  .token-attributes-panel {
    top: 70px; /* Still offset for header on mobile + 20px */
    left: 10px; /* No side panel on mobile */
    width: 240px;
  }
  
  .attributes-content {
    padding: 16px;
  }
  
  .token-logo {
    width: 40px;
    height: 40px;
  }
  
  .token-name {
    font-size: 20px;
  }
  
  .player-card-container {
    top: 70px; /* Still offset for header on mobile + 20px */
    right: 10px;
    width: 280px;
  }
  
  .player-card-wrapper {
    transform: scale(0.8);
  }
}

/* Hide on very small screens */
@media (max-width: 600px) {
  .token-attributes-panel,
  .player-card-container {
    display: none;
  }
}
</style>