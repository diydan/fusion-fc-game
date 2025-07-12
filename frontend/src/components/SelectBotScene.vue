<template>
  <div class="mobile-scene-container" :class="{ 'screen-shake-active': isScreenShaking }">
    <!-- Background Video (optimized for mobile) -->
    <video 
      ref="backgroundVideo"
      autoplay
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

    <!-- 3D Scene -->
    <SceneCanvas 
      :dof-enabled="false"
      :style="{ 
        filter: getMobileCombinedFilter(),
        transition: 'filter 0.2s ease-out'
      }"
      @scene-created="onSceneCreated"
      @scene-ready="onSceneReady"
      @scene-render="onSceneRender"
    >
      <!-- Camera optimized for mobile -->
      <SceneCamera :camera-position="mobileCameraPosition" :fov="mobileCameraFov" :enable-controls="enableCameraControls" />
      
      <!-- Simplified fog -->
      <TresFogExp2 
        :color="getFogColorWithOpacity()"
        :density="0.01"
      />
      
      <!-- Simplified lighting -->
      <SceneLighting :lighting-settings="mobileLightingSettings" />
      
      <!-- Ground plane with grass texture -->
      <TresMesh 
        :position="[0, 0, 0]" 
        :rotation="[-Math.PI / 2, 0, 0]" 
        :receive-shadow="true"
        :visible="showGrass"
      >
        <TresPlaneGeometry :args="[30, 30, 10, 10]" />
        <TresMeshStandardMaterial 
          :map="grassTexture"
          :roughness="0.8"
          :metalness="0.2"
          :color="0x3a5f3a"
        />
      </TresMesh>

      <!-- Character Group -->
      <TresGroup :position="[0, sceneOffsetY, 0]">
        <TresGroup ref="modelGroup" :scale="characterScale" />
      </TresGroup>

      <!-- Goalkeeper Group -->
      <TresGroup :position="[0, sceneOffsetY, -18]" :rotation="[0, 0, 0]" :visible="showGoalkeeper">
        <TresGroup ref="goalkeeperGroup" :scale="[characterScale * 1.1, characterScale * 1.1, characterScale]" />
      </TresGroup>


      <!-- Ball Group -->
      <TresGroup
        ref="ballModelGroup"
        :position="ballState?.position || [0, 0, 0]"
        :rotation="ballState?.rotation || [0, 0, 0]"
        :visible="ballState ? !ballState.hidden : false"
      />
    </SceneCanvas>

    <!-- Mobile Bottom Action Bar -->
    <div class="mobile-action-bar" v-if="playerSelected && !hidePlayerSelection">
      <div class="action-bar-content">
        <button
          @click="shootCoin"
          :disabled="animationState.isStrikeSequenceActive || !isReady"
          class="action-btn primary"
        >
          <span class="btn-icon">⚡</span>
          <span class="btn-text">Apply Power Ups</span>
        </button>
        
        <button
          @click="resetCharacterPosition"
          :disabled="!isReady"
          class="action-btn secondary"
        >
          <span class="btn-icon">🔄</span>
          <span class="btn-text">Reset</span>
        </button>
      </div>
    </div>

    <!-- Goal Status Indicator -->
    <div 
      v-if="goalStatus" 
      class="goal-status-indicator"
      :class="{ 'goal': goalStatus === 'goal', 'miss': goalStatus === 'miss' }"
    >
      <div class="goal-status-content">
        <div class="goal-status-text">
          {{ goalStatus === 'goal' ? '⚽ GOAL!' : '❌ MISS!' }}
        </div>
      </div>
    </div>

    <!-- Player Selection for Match - Now simplified -->
    <div class="game-view" v-if="!hidePlayerSelection && !playerSelected && robotSquad.length > 0">
      <div class="game-header">
        <button @click="$router.push('/game-mode-selection')" class="back-btn">← Back to Game Mode</button>
        <h3>Select Player for {{ teamData.name }}</h3>
      </div>
      
      <div class="player-selection-grid">
        <div 
          v-for="(player, index) in robotSquad.slice(0, 6)" 
          :key="player.id"
          class="match-player-card"
          @click="selectPlayer(index)"
        >
          <div class="player-avatar">
            <div class="player-jersey" :style="{ backgroundColor: teamData.primaryColor }">{{ player.jerseyNumber }}</div>
            <div class="player-torus" :style="{ backgroundColor: teamData.secondaryColor }"></div>
          </div>
          
          <div class="player-info">
            <div class="player-name">{{ player.name }}</div>
            <div class="player-role" :style="{ color: player.roleColor }">
              {{ player.roleIcon }} {{ player.role }}
            </div>
            <div class="player-tier" :style="{ color: getTierInfo(player.tier).color }">
              {{ getTierInfo(player.tier).name }} ({{ getTierInfo(player.tier).range }})
            </div>
            <div class="player-overall">Overall: {{ player.overall }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- No Team Data Fallback -->
    <div class="no-team-fallback" v-if="!hidePlayerSelection && !playerSelected && robotSquad.length === 0">
      <div class="fallback-content">
        <h3>🤖 No Team Found</h3>
        <p>Please create your robot team first!</p>
        <button @click="$router.push('/game-mode-selection')" class="setup-team-btn">
          Back to Game Mode ←
        </button>
      </div>
    </div>
    
    <!-- Selected Player HUD -->
    <div class="selected-player-hud" v-if="playerSelected">
      <div class="hud-player-info">
        <div class="hud-player-name">{{ getCurrentPlayer().name }}</div>
        <div class="hud-team-name">{{ teamData.name }} - {{ getCurrentPlayer().role }}</div>
        <div class="hud-player-tier" :style="{ color: getTierInfo(getCurrentPlayer().tier || 'amateur').color }">
          {{ getTierInfo(getCurrentPlayer().tier || 'amateur').name }} Tier
        </div>
        <div class="hud-player-overall">Overall: {{ getCurrentPlayer().overall }}</div>
      </div>
      
      <div class="coin-packs">
        <div 
          v-for="(pack, teamKey) in coinPacks" 
          :key="teamKey"
          class="coin-pack"
          @click="applyTeamCoinBonus(teamKey)"
        >
          <div class="coin-icon" :style="{ backgroundColor: pack.color }">🪙</div>
          <div class="coin-count">{{ pack.count }}</div>
          <div class="coin-label">{{ pack.name }}</div>
        </div>
      </div>
      
      <div class="hud-actions">
        <button @click="playerSelected = false" class="change-player-btn">
          Change Player
        </button>
        <button @click="clearTeamData(); $router.push('/game-mode-selection')" class="clear-team-btn">
          Reset Team
        </button>
      </div>
    </div>

    <!-- Global Music Footer moved to top -->
    <GlobalMusicFooter
      :audio-state="audioState"
      @toggle="toggleBackgroundMusic"
      @stop="stopMusic"
      @next-track="nextTrack"
      @previous-track="previousTrack"
      @toggle-lyrics="() => audioState.showLyrics = !audioState.showLyrics"
    />

    <!-- Mobile Loading Indicator -->
    <div v-if="loadingStatus !== 'Ready'" class="mobile-loading">
      <div class="loading-spinner"></div>
      <p>{{ loadingStatus }}</p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed, withDefaults } from 'vue'

interface Props {
  enableCameraControls?: boolean
  hidePlayerSelection?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  enableCameraControls: true,
  hidePlayerSelection: false
})

// Add reactive reference for camera controls
const enableCameraControls = computed(() => props.enableCameraControls)
const hidePlayerSelection = computed(() => props.hidePlayerSelection)

import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'

// Components
import SceneCanvas from './scene/SceneCanvas.vue'
import SceneCamera from './scene/SceneCamera.vue'
import SceneLighting from './scene/SceneLighting.vue'
import MobileControlPanel from './mobile/MobileControlPanel.vue'
import MobileColorSlider from './mobile/MobileColorSlider.vue'
import GlobalMusicFooter from './ui/GlobalMusicFooter.vue'

// Composables (reuse existing ones)
import { useSceneSetup } from '@/composables/useSceneSetup'
import { useAnimations } from '@/composables/useAnimations'
import { useBallPhysics } from '@/composables/useBallPhysics'
import { useAudio } from '@/composables/useAudio'
import { useMobileOptimization } from '@/composables/useMobileOptimization'
import { useCoinPhysics } from '@/composables/useCoinPhysics'

// Team and player selection state
const TEAM_DATA_KEY = 'robotTeamData'
const teamData = ref({
  name: '',
  primaryColor: '#007AFF',
  secondaryColor: '#FFD700',
  logoStyle: 'shield'
})
const playerSelected = ref(false)
const selectedPlayerIndex = ref(0)
const showGoalkeeper = ref(false)
const goalStatus = ref<'goal' | 'miss' | null>(null)
const goalTimeout = ref<NodeJS.Timeout | null>(null)

// Team coin packs
const coinPacks = {
  psg: { name: 'PSG', count: 10, color: '#004170' },
  manCity: { name: 'Man City', count: 10, color: '#6CABDD' },
  galatasaray: { name: 'Galatasaray', count: 10, color: '#FFA500' }
}

// Robot name generator components
const robotNamePrefixes = [
  'Cyber', 'Robo', 'Mech', 'Tech', 'Neo', 'Quantum', 'Alpha', 'Beta', 'Gamma', 'Delta',
  'Prime', 'Ultra', 'Mega', 'Super', 'Hyper', 'Turbo', 'Nitro', 'Bolt', 'Flash', 'Storm'
]

const robotNameSuffixes = [
  'Bot', 'Tron', 'Droid', 'Unit', 'Core', 'Matrix', 'Pulse', 'Strike', 'Force', 'Edge',
  'Blade', 'Spark', 'Volt', 'Surge', 'Burst', 'Blast', 'Rush', 'Dash', 'Zoom', 'Flux'
]

const robotNameMiddles = [
  'X', 'Z', 'Pro', 'Max', 'Elite', 'Prime', 'Ace', 'Star', 'Nova', 'Apex',
  'Ultra', 'Mega', 'Turbo', 'Nitro', 'Boost', 'Power', 'Speed', 'Force', 'Storm', 'Blitz'
]

// Robot positions and roles
const robotRoles = [
  { name: 'Striker', icon: '⚽', color: '#FF4444' },
  { name: 'Midfielder', icon: '🎯', color: '#4444FF' },
  { name: 'Defender', icon: '🛡️', color: '#44FF44' },
  { name: 'Goalkeeper', icon: '🥅', color: '#FFAA44' },
  { name: 'Winger', icon: '💨', color: '#FF44FF' },
  { name: 'Playmaker', icon: '🧠', color: '#44FFFF' }
]

// Generate robot squad
const generateRobotName = () => {
  const prefix = robotNamePrefixes[Math.floor(Math.random() * robotNamePrefixes.length)]
  const middle = robotNameMiddles[Math.floor(Math.random() * robotNameMiddles.length)]
  const suffix = robotNameSuffixes[Math.floor(Math.random() * robotNameSuffixes.length)]
  return `${prefix}-${middle}-${suffix}`
}

const generateRandomStats = (tier: 'amateur' | 'semi-pro' | 'pro' | 'elite' = 'amateur') => {
  let min: number, max: number
  
  switch (tier) {
    case 'amateur':
      min = 50; max = 60
      break
    case 'semi-pro':
      min = 60; max = 70
      break
    case 'pro':
      min = 70; max = 80
      break
    case 'elite':
      min = 80; max = 99
      break
    default:
      min = 50; max = 60
  }
  
  return {
    speed: Math.floor(Math.random() * (max - min + 1)) + min,
    skill: Math.floor(Math.random() * (max - min + 1)) + min,
    power: Math.floor(Math.random() * (max - min + 1)) + min,
    defense: Math.floor(Math.random() * (max - min + 1)) + min,
    passing: Math.floor(Math.random() * (max - min + 1)) + min,
    shooting: Math.floor(Math.random() * (max - min + 1)) + min
  }
}

const generateSquad = () => {
  const squad = []
  for (let i = 0; i < 12; i++) {
    const role = robotRoles[Math.floor(Math.random() * robotRoles.length)]
    const stats = generateRandomStats('amateur') // Default to amateur level (50-60)
    
    squad.push({
      id: i + 1,
      name: generateRobotName(),
      role: role.name,
      roleIcon: role.icon,
      roleColor: role.color,
      stats: stats,
      overall: Math.floor((stats.speed + stats.skill + stats.power + stats.defense + stats.passing + stats.shooting) / 6),
      tier: 'amateur',
      jerseyNumber: i + 1,
      avatar: `robot-${(i % 6) + 1}`, // 6 different avatar styles
      teamColors: {
        primary: teamData.value.primaryColor,
        secondary: teamData.value.secondaryColor
      }
    })
  }
  return squad
}

const robotSquad = ref([])

// Tier system helper function
const getTierInfo = (tier: string) => {
  switch (tier) {
    case 'amateur': return { name: 'Amateur', color: '#888888', range: '50-60' }
    case 'semi-pro': return { name: 'Semi-Pro', color: '#4CAF50', range: '60-70' }
    case 'pro': return { name: 'Professional', color: '#2196F3', range: '70-80' }
    case 'elite': return { name: 'Elite', color: '#FF9800', range: '80-99' }
    default: return { name: 'Amateur', color: '#888888', range: '50-60' }
  }
}

// Simplified camera settings
const mobileCameraFov = ref(42)
const mobileCameraPosition = ref<[number, number, number]>([-1.331, 1.805 * 0.8, 11.576 * 0.6])

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
  loadCornerFlags
} = useSceneSetup()

// Simplified lighting
const mobileLightingSettings = computed(() => ({
  ...lightingSettings,
  shadowEnabled: true,
  ambientIntensity: 1.2,
  directionalIntensity: 1.8
}))

const { animationState, loadCharacterModel, updateAnimations, getCurrentAnimation, materials, triggerPowerUpFlash, playWaveAnimation, playPowerUpAnimation } = useAnimations(sceneRefs, materialSettings)
const { ballState, loadBallModel, updateBallPhysics, animateBallToPosition, animateBallWithPhysics, stopBallAnimation } = useBallPhysics(sceneRefs, 0.1, cameraPosition)
const { audioState, toggleBackgroundMusic, stopMusic, playBallKick, playCoinSpin, playCoinHitTorusSound, nextTrack, previousTrack } = useAudio(playPowerUpAnimation)
const { shootCoin } = useCoinPhysics(sceneRefs, cameraPosition, triggerPowerUpFlash, playCoinSpin, playCoinHitTorusSound)

// LocalStorage functions
const saveTeamData = () => {
  try {
    const dataToSave = {
      teamData: teamData.value,
      robotSquad: robotSquad.value,
      lastUpdated: new Date().toISOString()
    }
    localStorage.setItem(TEAM_DATA_KEY, JSON.stringify(dataToSave))
    console.log('Team data saved to localStorage:', dataToSave)
  } catch (error) {
    console.error('Failed to save team data:', error)
  }
}

const loadTeamData = () => {
  try {
    const savedData = localStorage.getItem(TEAM_DATA_KEY)
    if (savedData) {
      const parsedData = JSON.parse(savedData)
      teamData.value = parsedData.teamData || {
        name: '',
        primaryColor: '#007AFF',
        secondaryColor: '#FFD700',
        logoStyle: 'shield'
      }
      robotSquad.value = parsedData.robotSquad || []
      console.log('Team data loaded from localStorage:', parsedData)
      return true
    } else {
      // No saved data, generate default team
      console.log('No saved team data found, generating default squad')
      teamData.value = {
        name: 'Fusion FC',
        primaryColor: '#3366FF',
        secondaryColor: '#00CCFF',
        logoStyle: 'shield'
      }
      robotSquad.value = generateSquad()
      saveTeamData()
      return true
    }
  } catch (error) {
    console.error('Failed to load team data:', error)
    // Generate default team on error
    teamData.value = {
      name: 'Fusion FC',
      primaryColor: '#3366FF',
      secondaryColor: '#00CCFF',
      logoStyle: 'shield'
    }
    robotSquad.value = generateSquad()
    return true
  }
}

const clearTeamData = () => {
  try {
    localStorage.removeItem(TEAM_DATA_KEY)
    teamData.value = {
      name: '',
      primaryColor: '#007AFF',
      secondaryColor: '#FFD700',
      logoStyle: 'shield'
    }
    robotSquad.value = []
    console.log('Team data cleared from localStorage')
  } catch (error) {
    console.error('Failed to clear team data:', error)
  }
}

// Team data management (simplified)
const selectTeamColor = (colorType: 'primary' | 'secondary', color: string) => {
  teamData.value[colorType + 'Color'] = color
  saveTeamData() // Auto-save when colors change
}

// Player selection methods
const selectPlayer = (index: number) => {
  selectedPlayerIndex.value = index
  playerSelected.value = true
  
  const player = robotSquad.value[index]
  console.log(`Player selected: ${player.name} (${player.role})`)
  
  // Update player colors based on team
  updatePlayerColors(player)
}

const updatePlayerColors = (player: any) => {
  // Update jersey color based on team primary color
  if (materials.overlay) {
    const jerseyColor = new THREE.Color(teamData.value.primaryColor)
    materials.overlay.color.copy(jerseyColor)
    materials.overlay.needsUpdate = true
  }
  
  // Update torus color based on team secondary color
  if (typeof updateTorusColor === 'function') {
    const torusColor = new THREE.Color(teamData.value.secondaryColor)
    updateTorusColor(torusColor)
  }
}

const getCurrentPlayer = () => {
  return robotSquad[selectedPlayerIndex.value] || robotSquad.value[0] || {
    name: 'Default Player',
    role: 'Striker',
    overall: 85
  }
}

const getPlayerStats = (player: any) => {
  return player.baseStats
}

const upgradePlayerTier = (player: any) => {
  const tierOrder = ['amateur', 'semi-pro', 'pro', 'elite']
  const currentTierIndex = tierOrder.indexOf(player.tier)
  
  if (currentTierIndex < tierOrder.length - 1) {
    const newTier = tierOrder[currentTierIndex + 1]
    player.tier = newTier
    
    // Regenerate stats for the new tier
    player.stats = generateRandomStats(newTier as 'amateur' | 'semi-pro' | 'pro' | 'elite')
    player.overall = Math.floor((player.stats.speed + player.stats.skill + player.stats.power + player.stats.defense + player.stats.passing + player.stats.shooting) / 6)
    
    console.log(`${player.name} upgraded to ${newTier} tier! New overall: ${player.overall}`)
    return true
  }
  
  return false
}

const applyTeamCoinBonus = (teamName: string) => {
  const coinPack = coinPacks[teamName as keyof typeof coinPacks]
  if (coinPack && coinPack.count > 0) {
    coinPack.count--
    console.log(`Applied ${teamName} coin bonus! Remaining: ${coinPack.count}`)
    
    // Try to upgrade current player's tier instead of just adding stats
    const currentPlayer = getCurrentPlayer()
    if (currentPlayer) {
      const upgraded = upgradePlayerTier(currentPlayer)
      if (!upgraded) {
        // If already at max tier, give small stat boost
        Object.keys(currentPlayer.stats).forEach(stat => {
          currentPlayer.stats[stat] = Math.min(99, currentPlayer.stats[stat] + 2)
        })
        currentPlayer.overall = Math.floor(Object.values(currentPlayer.stats).reduce((a: number, b: number) => a + b, 0) / 6)
      }
      saveTeamData() // Save after player upgrade
    }
    
    return true
  }
  return false
}

// Template refs
const backgroundVideo = ref<HTMLVideoElement>()
const modelGroup = ref()
const goalkeeperGroup = ref()
const ballModelGroup = ref()
const overlayColorHue = ref(218)
const torusEmissionHue = ref(195)

// Grass texture
const grassTexture = ref(null)

// Play goalkeeper animation based on shot direction
const playGoalkeeperAnimation = async (animationFile: string) => {
  if (!goalkeeperGroup.value || !sceneRefs.goalkeeperMixer) {
    console.warn('🥅 Cannot play goalkeeper animation - goalkeeper not ready')
    return
  }

  try {
    console.log(`🥅 Loading goalkeeper animation: ${animationFile}`)
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
      
      console.log(`🥅 Goalkeeper animation started: ${clip.name}`)
      
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
                console.log('🥅 Goalkeeper returned to idle')
              }
            } catch (error) {
              console.error('🥅 Error returning goalkeeper to idle:', error)
            }
          }, 500)
        }
      }
      sceneRefs.goalkeeperMixer.addEventListener('finished', onGoalkeeperFinished)
    }
  } catch (error) {
    console.error(`🥅 Error loading goalkeeper animation ${animationFile}:`, error)
  }
}

// Load goalkeeper (same character asset)
const loadGoalkeeper = async () => {
  console.log('🥅 Loading goalkeeper...')
  console.log('Goalkeeper group ref:', goalkeeperGroup.value)
  console.log('Show goalkeeper:', showGoalkeeper.value)
  
  try {
    // Use FBXLoader directly for the goalkeeper
    const loader = new FBXLoader()
    const goalkeeperModel = await loader.loadAsync('/bot1/soccer_player_humanoid__texture2.fbx')
    
    console.log('Goalkeeper model loaded:', goalkeeperModel)
    console.log('Goalkeeper model bounds:', new THREE.Box3().setFromObject(goalkeeperModel))
    console.log('Goalkeeper model children:', goalkeeperModel.children.length)
    
    // Scale should match the parent group scale - don't double-scale
    goalkeeperModel.scale.setScalar(1) // Parent group already has characterScale
    
    // Apply same material treatment as main character
    goalkeeperModel.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        // Apply the same material setup as the main character
        if (child.material instanceof THREE.MeshPhongMaterial && materials.base && materials.overlay) {
          // Create a group with base and overlay meshes
          const group = new THREE.Group()
          
          // Base mesh with shared base material
          const baseMesh = child.clone()
          baseMesh.material = materials.base
          baseMesh.castShadow = true
          baseMesh.receiveShadow = false
          
          // Overlay mesh with shared overlay material
          const overlayMesh = child.clone()
          overlayMesh.material = materials.overlay
          overlayMesh.castShadow = false
          overlayMesh.receiveShadow = false
          
          group.add(baseMesh)
          group.add(overlayMesh)
          
          // Replace the original child with the group
          child.parent?.add(group)
          child.parent?.remove(child)
          
          console.log('Applied matching materials to goalkeeper mesh:', child.name)
        }
      }
    })
    
    // Add to goalkeeper group
    if (goalkeeperGroup.value) {
      console.log('Adding goalkeeper to group...')
      goalkeeperGroup.value.clear()
      goalkeeperGroup.value.add(goalkeeperModel)
      
      // Make sure the goalkeeper group itself is visible
      goalkeeperGroup.value.visible = true
      
      // Log the goalkeeper's world position
      goalkeeperGroup.value.updateWorldMatrix(true, true)
      const worldPos = new THREE.Vector3()
      goalkeeperGroup.value.getWorldPosition(worldPos)
      console.log('Goalkeeper world position:', worldPos)
      
      // Load goalkeeper idle animation
      const idleAnimation = await loader.loadAsync('/bot1/Goalkeeper Idle.fbx')
      if (idleAnimation.animations.length > 0 && sceneRefs.scene) {
        const mixer = new THREE.AnimationMixer(goalkeeperModel)
        const action = mixer.clipAction(idleAnimation.animations[0])
        action.play()
        
        // Store mixer for updates
        sceneRefs.goalkeeperMixer = mixer
        console.log('Goalkeeper Idle animation started')
      }
      
      // Double-check visibility of the entire hierarchy
      console.log('Goalkeeper visibility check:')
      console.log('- goalkeeperGroup visible:', goalkeeperGroup.value.visible)
      console.log('- parent visible:', goalkeeperGroup.value.parent?.visible)
      console.log('- showGoalkeeper ref:', showGoalkeeper.value)
      console.log('- goalkeeper children count:', goalkeeperGroup.value.children.length)
      
    } else {
      console.warn('Goalkeeper group ref not available')
    }
    
    console.log('✅ Goalkeeper loaded successfully')
  } catch (error) {
    console.error('❌ Error loading goalkeeper:', error)
  }
}


// Enhanced mobile strike sequence with character movement
const triggerMobileStrikeSequence = () => {
  if (!sceneRefs.actions || sceneRefs.actions.length < 2) {
    console.log('❌ Strike sequence not available - animations not loaded')
    return
  }

  console.log('🎬 Starting enhanced mobile strike sequence')
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
    console.log('🎬 Mobile strike sequence completed - use reset to return')
    // Character continues running - use reset button to return
  }, 4000)
}

// Enhanced mobile character reset

const triggerStrike2 = () => {
  if (!sceneRefs.actions || sceneRefs.actions.length < 2) {
    console.log('❌ Strike 2 not available - animations not loaded')
    return
  }

  console.log('🥅 Starting Strike 2 sequence - shooting toward goal!')
  animationState.isStrikeSequenceActive = true

  // Phase 1: Ball positioning
  if (hidePlayerSelection.value) {
    // Penalty mode: Ball already at penalty spot
    if (ballState) {
      ballState.position = [-0.030, 0.100, 0.800]
      ballState.hidden = false
    }
  } else {
    // Regular mode: Ball rolls to position  
    animateBallToPosition([-0.030, 0.100, 0.800], 1500)
  }

  const strikeDelay = hidePlayerSelection.value ? 100 : 1500
  
  setTimeout(() => {
    // Strike animation
    if (sceneRefs.actions[animationState.currentIndex]) {
      sceneRefs.actions[animationState.currentIndex].fadeOut(0.3)
    }

    animationState.currentIndex = 1
    sceneRefs.actions[1].reset().fadeIn(0.3).play()

    setTimeout(() => {
      playBallKick()
      triggerScreenShake(400)
      
      // Simple ball physics to goal
      const goalTargets = [
        { pos: [0, 1.2, -19], name: "Center goal" },
        { pos: [-2, 1.2, -19], name: "Left side" },
        { pos: [2, 1.2, -19], name: "Right side" }
      ]
      
      const randomTarget = goalTargets[Math.floor(Math.random() * goalTargets.length)]
      console.log(`🎯 Shooting at: ${randomTarget.name}`)
      
      // Animate ball to goal
      animateBallWithPhysics([-0.030, 0.100, 0.800], randomTarget.pos, 1500, () => {
        if (ballState) {
          ballState.hidden = true
        }
      })
      
      // End sequence
      setTimeout(() => {
        console.log('🥅 Strike 2 sequence completed')
        animationState.isStrikeSequenceActive = false
      }, 3000)
      
    }, 300)
  }, strikeDelay)
}

const rotateAndDropBall = () => {
  console.log('↩️ Turn button pressed - showing goalkeeper and placing ball...')
  
  // Show goalkeeper
  showGoalkeeper.value = true
  
  // Place ball at penalty spot
  if (ballState) {
    ballState.position = [-0.030, 0.100, 0.800]
    ballState.hidden = false
    console.log('⚽ Ball placed at penalty spot')
  }
  
  console.log('🥅 Goalkeeper is now visible, ball is ready for penalty')
}

const resetCharacterPosition = () => {
  console.log('🔄 Enhanced mobile reset: Returning character to starting position...')

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
      console.log('⚽ Ball unhidden and reset to camera position')
    }
  }, 300)
}

// Video controls
const setVideoPlaybackRate = () => {
  if (backgroundVideo.value) {
    backgroundVideo.value.playbackRate = 0.5
    backgroundVideo.value.loop = true
    console.log('🎬 Video playback rate set to:', backgroundVideo.value.playbackRate)
  }
}

const ensureVideoLoop = () => {
  if (backgroundVideo.value) {
    backgroundVideo.value.currentTime = 0
    backgroundVideo.value.play()
  }
}

// Simplified visual effects
const getMobileCombinedFilter = () => {
  return 'none'
}

const getFogColorWithOpacity = () => {
  return new THREE.Color(0x666666)
}

// Color update methods
const updateOverlayColor = (color: string) => {
  if (materials.overlay) {
    const threeColor = new THREE.Color(color)
    materials.overlay.color.copy(threeColor)
    materials.overlay.needsUpdate = true
  }
}

const updateTorusEmission = (colorValue: string) => {
  const newThreeColor = new THREE.Color(colorValue)
  if (typeof updateTorusColor === 'function') {
    updateTorusColor(newThreeColor)
  }
}

// Radar chart calculation
const getRadarPoints = (stats: any) => {
  const center = 50
  const maxRadius = 30
  const minRadius = 10
  
  // Convert stats (70-99 range) to radar points
  const normalized = {
    speed: ((stats.speed - 70) / 29) * (maxRadius - minRadius) + minRadius,
    shooting: ((stats.shooting - 70) / 29) * (maxRadius - minRadius) + minRadius,
    power: ((stats.power - 70) / 29) * (maxRadius - minRadius) + minRadius,
    defense: ((stats.defense - 70) / 29) * (maxRadius - minRadius) + minRadius,
    passing: ((stats.passing - 70) / 29) * (maxRadius - minRadius) + minRadius,
    skill: ((stats.skill - 70) / 29) * (maxRadius - minRadius) + minRadius
  }
  
  // Calculate hexagon points (6 stats)
  const points = [
    [center, center - normalized.speed], // top (speed)
    [center + normalized.shooting * 0.866, center - normalized.shooting * 0.5], // top-right (shooting)
    [center + normalized.power * 0.866, center + normalized.power * 0.5], // bottom-right (power)
    [center, center + normalized.defense], // bottom (defense)
    [center - normalized.passing * 0.866, center + normalized.passing * 0.5], // bottom-left (passing)
    [center - normalized.skill * 0.866, center - normalized.skill * 0.5] // top-left (skill)
  ]
  
  return points.map(point => point.join(',')).join(' ')
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
  }
}

const onSceneRender = (event: any) => {
  if (!sceneRefs.scene && event.scene) {
    sceneRefs.scene = event.scene
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
  
  requestAnimationFrame(animationLoop)
}

// Component initialization
onMounted(async () => {
  console.log('📱 3D Game component mounted')
  
  // Load grass texture
  const textureLoader = new THREE.TextureLoader()
  textureLoader.load('/textures/grass1-bl/grass1-albedo3.png', (texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(10, 10)
    texture.colorSpace = THREE.SRGBColorSpace
    grassTexture.value = texture
    console.log('🌱 Grass texture loaded')
  })
  
  // Show goalkeeper in penalty mode
  if (hidePlayerSelection.value) {
    console.log('🥅 Penalty mode detected - showing goalkeeper')
    showGoalkeeper.value = true
    
    // Initialize ball at penalty spot for penalty mode
    setTimeout(() => {
      if (ballState) {
        ballState.position = [-0.030, 0.100, 0.800] // Penalty spot position
        ballState.hidden = false
        console.log('⚽ Ball positioned at penalty spot for penalty mode')
      }
    }, 2000) // Wait for scene to be ready
  }
  
  // Try to load existing team data
  const teamLoaded = loadTeamData()
  if (teamLoaded && teamData.value.name && robotSquad.value.length > 0) {
    console.log('✅ Team data loaded, ready for 3D game')
    // No need to change currentStep - just show player selection or game directly
  } else {
    console.log('❌ No team data found, will show fallback')
    // Fallback UI will handle redirecting to game mode selection
  }
  
  animationLoop()
})


// Watch for team name changes and auto-save
watch(() => teamData.value.name, (newName) => {
  if (newName.trim()) {
    saveTeamData()
  }
})

// Connect refs
watch(modelGroup, (newModelGroup) => {
  if (newModelGroup) {
    sceneRefs.modelGroup = newModelGroup
    loadCharacterModel().then(() => {
      addTorusToCharacter()
      
      // Set initial orientation for penalty mode
      if (hidePlayerSelection.value) {
        console.log('🥅 Setting player to face goal for penalty mode')
        newModelGroup.rotation.y = Math.PI // 180 degrees to face goal (z-negative direction)
      }
      
      // Add field elements like desktop version
      createGrassField() // Add PBR grass texture field
      createCenterCircle() // Add center circle and spot
      createFootballFieldLines() // Add football field markings
      loadGoalpostModel() // Add goalposts to both ends of the field
      loadCornerFlags() // Add corner flags to all 4 corners
      
      // Load goalkeeper after main character is ready
      loadGoalkeeper().then(() => {
        console.log('Both characters should now be loaded')
      })
      
      // Mark as ready
      isReady.value = true
      loadingStatus.value = 'Ready'
    })
  }
}, { once: true })

watch(goalkeeperGroup, (newGoalkeeperGroup) => {
  if (newGoalkeeperGroup) {
    console.log('Goalkeeper group ref connected:', newGoalkeeperGroup)
    // Don't load goalkeeper here, wait for main character to load first
  }
})

watch(ballModelGroup, (newBallGroup) => {
  if (newBallGroup) {
    sceneRefs.ballModelGroup = newBallGroup
    // Ball model will be loaded after character loads
    loadBallModel()
  }
}, { once: true })

onBeforeUnmount(() => {
  console.log('🧹 Mobile scene component unmounting...')
})

// Reset ball to penalty spot (for penalty shootout)
const resetBallToPenaltySpot = () => {
  if (ballState && hidePlayerSelection.value) {
    ballState.position = [-0.030, 0.100, 0.800]
    ballState.hidden = false
    console.log('⚽ Ball reset to penalty spot')
  }
}

// Expose methods for parent components to call
defineExpose({
  triggerStrike2,
  triggerMobileStrikeSequence,
  resetCharacterPosition,
  resetBallToPenaltySpot
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

/* Goal Status Indicator */
.goal-status-indicator {
  position: fixed;
  top: 120px; /* Below the music player header */
  right: 20px;
  z-index: 1500;
  animation: slideInFade 0.3s ease-out;
}

.goal-status-content {
  background: rgba(0, 0, 0, 0.9);
  border-radius: 12px;
  padding: 12px 20px;
  border: 2px solid;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.goal-status-indicator.goal .goal-status-content {
  border-color: #4ade80;
  background: rgba(34, 197, 94, 0.15);
}

.goal-status-indicator.miss .goal-status-content {
  border-color: #f87171;
  background: rgba(239, 68, 68, 0.15);
}

.goal-status-text {
  font-size: 18px;
  font-weight: bold;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
  letter-spacing: 1px;
}

.goal-status-indicator.goal .goal-status-text {
  color: #4ade80;
}

.goal-status-indicator.miss .goal-status-text {
  color: #f87171;
}

@keyframes slideInFade {
  0% {
    opacity: 0;
    transform: translateX(50px) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
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

.toggle-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  min-width: 80px;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.toggle-btn.active {
  background: #007AFF;
  border-color: #007AFF;
}

.mobile-color-controls {
  position: fixed;
  bottom: 120px;
  left: 16px;
  right: 16px;
  z-index: 900;
  display: flex;
  gap: 16px;
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
  background: rgba(0, 0, 0, 0.9);
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
  
  .toggle-btn {
    min-height: 44px;
    font-size: 16px;
  }
  
  .primary-btn,
  .secondary-btn {
    min-height: 48px;
    font-size: 16px;
  }
}

/* No Team Fallback Styles */
.no-team-fallback {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  padding: 20px;
  box-sizing: border-box;
}

.fallback-content {
  background: rgba(30, 30, 30, 0.95);
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.fallback-content h3 {
  margin: 0 0 16px 0;
  font-size: 24px;
  font-weight: 600;
}

.fallback-content p {
  margin: 0 0 24px 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
}

.setup-team-btn {
  padding: 16px 32px;
  background: #007AFF;
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.setup-team-btn:hover {
  background: #0056CC;
}

/* Player Selection Interface Styles */
.player-selection-panel {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  overflow-y: auto;
  backdrop-filter: blur(10px);
  padding: 20px;
  box-sizing: border-box;
}

.player-selection-header {
  text-align: center;
  margin-bottom: 20px;
  color: white;
}

.player-selection-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.player-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.player-card {
  background: rgba(30, 30, 30, 0.95);
  border-radius: 16px;
  padding: 16px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s;
  color: white;
}

.player-card:hover {
  border-color: #007AFF;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 123, 255, 0.3);
}

.player-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  gap: 8px;
}

.player-jersey {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid white;
}

.player-torus {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.player-info {
  text-align: center;
}

.player-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.player-team {
  font-size: 14px;
  color: #007AFF;
  margin-bottom: 8px;
}

.player-description {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 12px;
  line-height: 1.3;
}

.player-stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.stat-label {
  min-width: 50px;
  text-align: left;
  color: rgba(255, 255, 255, 0.8);
}

.stat-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1);
  transition: width 0.3s;
}

.stat-value {
  min-width: 25px;
  text-align: right;
  font-weight: 600;
  color: white;
}

.selected-player-hud {
  position: fixed;
  top: 120px;
  left: 20px;
  right: 20px;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.9);
  border-radius: 16px;
  padding: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.hud-player-info {
  text-align: center;
  margin-bottom: 12px;
  color: white;
}

.hud-player-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.hud-team-name {
  font-size: 14px;
  color: #007AFF;
}

.hud-player-tier {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.coin-packs {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}

.coin-pack {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 60px;
}

.coin-pack:hover {
  background: rgba(255, 255, 255, 0.2);
}

.coin-pack.active {
  background: rgba(0, 123, 255, 0.3);
  border: 1px solid #007AFF;
}

.coin-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  font-size: 12px;
}

.coin-count {
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin-bottom: 2px;
}

.coin-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
}

.hud-actions {
  display: flex;
  gap: 8px;
}

.change-player-btn, .clear-team-btn {
  flex: 1;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.change-player-btn {
  background: rgba(255, 255, 255, 0.1);
}

.change-player-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.clear-team-btn {
  background: rgba(255, 0, 0, 0.2);
  border-color: rgba(255, 0, 0, 0.3);
}

.clear-team-btn:hover {
  background: rgba(255, 0, 0, 0.3);
}

.mobile-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px 20px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}

.action-bar-content {
  display: flex;
  gap: 16px;
  justify-content: center;
  max-width: 400px;
  margin: 0 auto;
}

.action-btn {
  flex: 1;
  min-height: 56px;
  padding: 12px 20px;
  border: none;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  position: relative;
  overflow: hidden;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.action-btn.primary:active {
  transform: translateY(0);
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.1);
}

.action-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 255, 255, 0.2);
}

.action-btn.secondary:active {
  transform: translateY(0);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.btn-icon {
  font-size: 20px;
  line-height: 1;
}

.btn-text {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
}

/* Responsive design */
@media (max-width: 600px) {
  .player-grid {
    grid-template-columns: 1fr;
  }
  
  .player-card {
    padding: 12px;
  }
  
  .mobile-action-bar {
    padding: 12px 16px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
  }
  
  .action-bar-content {
    gap: 12px;
  }
  
  .action-btn {
    min-height: 52px;
    padding: 10px 16px;
    font-size: 15px;
  }
  
  .btn-icon {
    font-size: 18px;
  }
  
  .btn-text {
    font-size: 13px;
  }
  
  .coin-packs {
    gap: 8px;
  }
  
  .coin-pack {
    min-width: 50px;
    padding: 6px;
  }
}

@media (max-width: 480px) {
  .action-btn {
    min-height: 48px;
    padding: 8px 12px;
  }
  
  .btn-icon {
    font-size: 16px;
  }
  
  .btn-text {
    font-size: 12px;
  }
}

/* Team Selection Styles */
.team-selection-panel {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.95);
  z-index: 1000;
  overflow-y: auto;
  backdrop-filter: blur(10px);
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.team-selection-header {
  text-align: center;
  margin-bottom: 30px;
  color: white;
}

.team-selection-header h2 {
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 600;
}

.team-selection-header p {
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
}

.team-creation-form {
  background: rgba(30, 30, 30, 0.95);
  border-radius: 20px;
  padding: 30px;
  max-width: 500px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.team-name-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
}

.team-name-input:focus {
  border-color: #007AFF;
}

.team-name-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.color-selection {
  display: flex;
  gap: 20px;
  margin-bottom: 25px;
}

.color-group {
  flex: 1;
}

.color-group label {
  color: white;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  display: block;
}

.color-picker {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.color-option {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: white;
  transform: scale(1.15);
}

.team-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin-bottom: 25px;
}

.preview-jersey {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.preview-torus {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.preview-text {
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.proceed-btn {
  width: 100%;
  padding: 16px;
  background: #007AFF;
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.proceed-btn:hover {
  background: #0056CC;
}

/* Squad View Styles */
.squad-view-panel {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.95);
  z-index: 1000;
  overflow-y: auto;
  backdrop-filter: blur(10px);
  padding: 20px;
  box-sizing: border-box;
}

.squad-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  color: white;
}

.squad-title {
  display: flex;
  align-items: center;
  gap: 15px;
}

.squad-title h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.team-colors-display {
  display: flex;
  gap: 5px;
}

.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.squad-actions {
  display: flex;
  gap: 12px;
}

.back-btn, .play-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.play-btn {
  background: #44FF44;
  color: black;
}

.play-btn:hover {
  background: #33DD33;
}

.squad-grid {
  display: grid;
  gap: 16px;
  max-width: 1400px;
  margin: 0 auto;
}

.desktop-grid {
  grid-template-columns: repeat(6, 1fr);
}

.robot-card {
  background: rgba(30, 30, 30, 0.95);
  border-radius: 16px;
  padding: 16px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s;
  color: white;
}

.robot-card:hover {
  border-color: #007AFF;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 123, 255, 0.3);
}

.robot-header {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.robot-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  font-weight: 600;
  color: white;
}

.robot-face {
  font-size: 18px;
}

.robot-number {
  position: absolute;
  bottom: -5px;
  right: -5px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
}

.robot-info {
  flex: 1;
}

.robot-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.robot-role {
  font-size: 12px;
  margin-bottom: 4px;
}

.robot-overall {
  font-size: 12px;
  color: #FFD700;
  font-weight: 600;
}

.robot-stats {
  display: flex;
  gap: 12px;
}

.radar-chart {
  flex: 1;
  max-width: 80px;
}

.radar-svg {
  width: 100%;
  height: 80px;
}

.stat-label-svg {
  font-size: 6px;
  fill: rgba(255, 255, 255, 0.7);
  font-weight: 600;
}

.stats-list {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.stat-mini {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
}

/* Game View Styles */
.game-view {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  overflow-y: auto;
  backdrop-filter: blur(10px);
  padding: 20px;
  box-sizing: border-box;
}

.game-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  color: white;
}

.game-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.player-selection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  max-width: 800px;
  margin: 0 auto;
}

.match-player-card {
  background: rgba(30, 30, 30, 0.95);
  border-radius: 16px;
  padding: 16px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s;
  color: white;
  text-align: center;
}

.match-player-card:hover {
  border-color: #007AFF;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 123, 255, 0.3);
}

.match-player-card .player-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  gap: 8px;
}

.match-player-card .player-jersey {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
}

.match-player-card .player-torus {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.match-player-card .player-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.match-player-card .player-role {
  font-size: 12px;
  margin-bottom: 4px;
}

.match-player-card .player-tier {
  font-size: 10px;
  margin-bottom: 4px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.player-overall {
  font-size: 12px;
  color: #FFD700;
  font-weight: 600;
}

.hud-player-overall {
  font-size: 12px;
  color: #FFD700;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .desktop-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 768px) {
  .desktop-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .color-selection {
    flex-direction: column;
    gap: 15px;
  }
  
  .squad-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .team-creation-form {
    padding: 20px;
  }
  
  .robot-stats {
    flex-direction: column;
    gap: 8px;
  }
  
  .stats-list {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 480px) {
  .desktop-grid {
    grid-template-columns: 1fr;
  }
  
  .robot-card {
    padding: 12px;
  }
  
  .team-creation-form {
    padding: 16px;
  }
  
  .color-picker {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .color-option {
    width: 35px;
    height: 35px;
  }
}
</style>
