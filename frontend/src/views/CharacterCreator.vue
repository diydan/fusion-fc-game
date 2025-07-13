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
        <MobileSelectBotScene ref="sceneCanvas" :lock-camera="true" @coin-collected="onCoinCollected" />

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
                v-if="currentPelletPack?.logoURI"
                :src="currentPelletPack.logoURI"
                :alt="currentPelletPack.tokenSymbol"
                class="token-logo"
              />
              <div class="token-info">
                <span class="token-name">{{ currentPelletPack?.tokenSymbol }}</span>
                <span class="token-team">{{ currentPelletPack ? getTokenTeamName(currentPelletPack.tokenSymbol) : 'Select Powerup' }}</span>
              </div>
              <v-btn
                size="small"
                color="primary"
                variant="outlined"
                @click="showPelletSelector = true"
                class="change-powerup-btn"
              >
                <v-icon start size="16">mdi-swap-horizontal</v-icon>
                Change
              </v-btn>
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
          </div>

          <!-- Color Controls Section -->
          <div class="color-controls-panel">
            <h3 class="color-controls-title">Colors</h3>

            <!-- Shorts Color Slider -->
            <div class="color-slider-section">
              Shorts
              <div class="color-slider-container">
                <input
                  type="range"
                  v-model="shortColorHue"
                  min="0"
                  max="360"
                  step="1"
                  class="color-slider"
                  @input="updateShortsColor"
                />
                <div
                  class="color-preview"
                  :style="{ backgroundColor: `hsl(${shortColorHue}, 70%, 50%)` }"
                ></div>
              </div>
            </div>

            <!-- Torus Color Slider -->
            <div class="color-slider-section">
              <label class="color-label">#010224</label>
              <div class="color-slider-container">
                <input
                  type="range"
                  v-model="torusColorHue"
                  min="0"
                  max="360"
                  step="1"
                  class="color-slider"
                  @input="updateTorusColor"
                />
                <div
                  class="color-preview"
                  :style="{ backgroundColor: `hsl(${torusColorHue}, 70%, 50%)` }"
                ></div>
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
              :show-price="false"
              @click="handlePlayerCardClick"
              @compare="handlePlayerCompare"
              @recruit="handlePlayerRecruit"
              @select-bot="handleSelectBot"
            />
          </div>
        </div>
      </div>
    </v-main>

    <!-- Pellet Pack Selector Modal -->
    <PelletPackSelector
      v-if="showPelletSelector"
      :available-packs="availablePelletPacks"
      :selected-pack="currentPelletPack"
      @select="onPelletPackSelected"
      @close="showPelletSelector = false"
    />

  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useDisplay } from 'vuetify'
import MobileSelectBotScene from "@/components/MobileSelectBotScene.vue"
import PlayerCardV3 from '@/components/recruit/PlayerCardV3.vue'
import PelletPackSelector from '@/components/ui/PelletPackSelector.vue'
import { useAudio } from '@/composables/useAudio'
import { useTeamsData } from '@/composables/useTeamsData'
import { useWallet } from '@/composables/useWallet'

// PelletPack interface
interface PelletPack {
  tokenSymbol: string
  tokenBalance: number
  currentPellets: number
  maxPellets: number
  color: string
  logoURI?: string
  powerMultiplier: number
  refillCost: number
}

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

// Pellet pack selector state
const showPelletSelector = ref(false)

// Coin collection tracking for incremental boosts
const coinsCollected = ref(0)

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
    // Base amateur stats without any powerup
    const baseStats = {
      overall: 43,
      attack: 46,
      speed: 45,
      skill: 46,
      defense: 35,
      physical: 42,
      mental: 46,
      aggression: 44
    }

    return {
      id: 1,
      name: 'Gen 1 DanBot',
      position: 'FW',
      nationality: 'Digital',
      overall: baseStats.overall,
      tier: 'amateur',
      price: baseStats.overall * 50000,
      stats: baseStats,
      bot: { name: 'DanBot', model: '/bot1/soccer_player.fbx' }
    }
  }
  
  const tokenData = getTeamByToken(currentPelletPack.value.tokenSymbol)
  const tokenSymbol = currentPelletPack.value.tokenSymbol

  // Debug logging
  console.log('🎮 Player Card Update:', {
    tokenSymbol,
    teamData: tokenData,
    teamAttack: tokenData?.attack,
    teamSpeed: tokenData?.speed
  })

  // Base amateur stats (without any powerup boost)
  const baseStats = {
    overall: 43,
    attack: 46,
    speed: 45,
    skill: 46,
    defense: 35,
    physical: 42,
    mental: 46,
    aggression: 44
  }

  // Calculate powerup boost based on team's relative strength
  // Teams with higher stats give bigger boosts to the player
  const calculateBoost = (teamStat: number, baseStat: number) => {
    // More aggressive boost formula for visible differences
    // Team stat 90 gives +15 boost, team stat 70 gives +5 boost, etc.
    const boostMultiplier = Math.max(0, (teamStat - 50) / 10) // 0-4 range for stats 50-90
    const boost = Math.round(boostMultiplier * 4) // 0-16 boost range
    console.log(`📊 Boost calc: teamStat=${teamStat}, baseStat=${baseStat}, boost=${boost}, final=${baseStat + boost}`)
    return baseStat + boost
  }

  // Calculate coin collection bonus (small incremental boost per coin)
  const coinBonus = Math.floor(coinsCollected.value * 0.1) // +0.1 per coin collected

  const boostedStats = {
    overall: calculateBoost(tokenData?.overall || 75, baseStats.overall) + coinBonus,
    attack: calculateBoost(tokenData?.attack || 75, baseStats.attack) + coinBonus,
    speed: calculateBoost(tokenData?.speed || 75, baseStats.speed) + coinBonus,
    skill: calculateBoost(tokenData?.skill || 75, baseStats.skill) + coinBonus,
    defense: calculateBoost(tokenData?.defense || 75, baseStats.defense) + coinBonus,
    physical: calculateBoost(tokenData?.physical || 75, baseStats.physical) + coinBonus,
    mental: calculateBoost(tokenData?.mental || 75, baseStats.mental) + coinBonus,
    aggression: calculateBoost(tokenData?.aggression || 75, baseStats.aggression) + coinBonus
  }

  console.log('🚀 Final boosted stats:', boostedStats)

  return {
    id: 1,
    name: 'Gen 1 DanBot',
    position: 'FW',
    nationality: 'Digital',
    overall: boostedStats.overall,
    tier: 'amateur',
    price: boostedStats.overall * 50000,
    stats: {
      overall: boostedStats.overall,
      attack: boostedStats.attack,
      speed: boostedStats.speed,
      skill: boostedStats.skill,
      defense: boostedStats.defense,
      physical: boostedStats.physical,
      mental: boostedStats.mental,
      aggression: boostedStats.aggression
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
  return getTeamName(tokenSymbol)
}

// Handle pellet pack selection
const onPelletPackSelected = (pack: PelletPack) => {
  console.log('🔄 Powerup changed to:', pack.tokenSymbol, pack)
  currentPelletPack.value = pack
  showPelletSelector.value = false

  // Update the scene with the new pack
  if (sceneCanvas.value) {
    sceneCanvas.value.updateCurrentPelletPack(pack)
  }

  console.log('✅ Current pellet pack updated:', currentPelletPack.value)
}

// Color update functions
const updateShortsColor = () => {
  if (sceneCanvas.value) {
    const hslColor = `hsl(${shortColorHue.value}, 70%, 50%)`
    sceneCanvas.value.updateOverlayColor(hslColor)
  }
}

const updateTorusColor = () => {
  if (sceneCanvas.value) {
    const hslColor = `hsl(${torusColorHue.value}, 70%, 50%)`
    sceneCanvas.value.updateTorusEmission(hslColor)
  }
}

// Function to increment coin collection count
const onCoinCollected = () => {
  coinsCollected.value += 1
  console.log(`🪙 Coin collected! Total: ${coinsCollected.value}`)
}

// Use shared teams data
const { getTeamByToken, getTeamAttributes, getTeamName } = useTeamsData()

// Function to get team-specific colors
const getTeamColor = (tokenSymbol: string) => {
  const colors = {
    'PSG': '#004170',
    'BAR': '#A50044',
    'CITY': '#6CABDD',
    'JUV': '#000000'
  }
  return colors[tokenSymbol] || '#FF6B35'
}

// Available pellet packs based on teams data
const availablePelletPacks = computed(() => {
  const { getAllTeams } = useTeamsData()
  return getAllTeams.value.map(team => ({
    tokenSymbol: team.token.replace('$', ''),
    tokenBalance: Math.floor(Math.random() * 100) + 20, // Mock balance
    currentPellets: Math.floor(Math.random() * 8) + 1, // Mock pellets
    maxPellets: 8,
    color: getTeamColor(team.token.replace('$', '')),
    powerMultiplier: 1 + (team.overall - 50) / 100, // Based on team overall
    refillCost: 8,
    logoURI: team.logo
  }))
})

// Current pellet pack - starts with first available pack
const currentPelletPack = ref<PelletPack | null>(null)

// Initialize with first pack when available
watch(availablePelletPacks, (packs) => {
  if (packs.length > 0 && !currentPelletPack.value) {
    currentPelletPack.value = packs[0]
  }
}, { immediate: true })

// Computed token attributes
const currentTokenAttributes = computed(() => {
  if (!currentPelletPack.value) return []

  return getTeamAttributes(currentPelletPack.value.tokenSymbol)
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
  background: #010224;
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

.change-powerup-btn {
  margin-left: auto;
}

/* Color Controls Panel */
.color-controls-panel {
  background: rgb(1 2 36);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 20px;
  margin-top: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.color-controls-title {
  color: white;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.color-slider-section {
  margin-bottom: 20px;
}

.color-slider-section:last-child {
  margin-bottom: 0;
}

.color-label {
  display: block;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.color-slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-slider {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(
    to right,
    hsl(0, 70%, 50%),
    hsl(60, 70%, 50%),
    hsl(120, 70%, 50%),
    hsl(180, 70%, 50%),
    hsl(240, 70%, 50%),
    hsl(300, 70%, 50%),
    hsl(360, 70%, 50%)
  );
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}

.color-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  border: 2px solid rgba(0, 0, 0, 0.2);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.color-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  border: 2px solid rgba(0, 0, 0, 0.2);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.color-preview {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
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