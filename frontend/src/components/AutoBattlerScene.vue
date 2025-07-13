<template>
  <div class="auto-battler-scene-container">
    <!-- Background Video -->
    <video 
      ref="backgroundVideo"
      autoplay
      loop 
      muted 
      playsinline
      poster="/textures/stadium_bg.jpg"
      class="background-video"
    >
      <source src="/video/stadium.mp4" type="video/mp4" />
    </video>

    <!-- 3D Scene -->
    <SceneCanvas 
      :bloom-enabled="true"
      :bloom-intensity="0.3"
      @scene-created="onSceneCreated"
      @scene-ready="onSceneReady"
    >
      <!-- Camera -->
      <SceneCamera 
        :camera-position="[0, 16, 40]" 
        :fov="45"
        :enable-controls="true"
        :enable-pan="true"
        :enable-zoom="true"
        :enable-rotate="true"
      />
      
      <!-- Fog -->
      <TresFogExp2 
        :color="'#1a1a2e'"
        :density="0.01"
      />
      
      <!-- Lighting -->
      <SceneLighting :lighting-settings="lightingSettings" />
      
      <!-- Football Field -->
      <TresMesh 
        :position="[0, 0, 0]" 
        :rotation="[-Math.PI / 2, 0, 0]" 
        :receive-shadow="true"
      >
        <TresPlaneGeometry :args="[60, 40]" />
        <TresMeshStandardMaterial :color="'#2d5016'" :roughness="0.8" />
      </TresMesh>
      
      <!-- Field Lines -->
      <TresGroup ref="fieldLinesGroup" />
      
      <!-- Team 1 (Blue) - 4-4-2 Formation -->
      <TresGroup :position="[0, 0, -10]">
        <!-- Goalkeeper -->
        <TresGroup ref="team1Goalkeeper" :position="[0, 0, -14]" />
        
        <!-- Defenders (4) -->
        <TresGroup ref="team1Defender1" :position="[-12, 0, -6]" />
        <TresGroup ref="team1Defender2" :position="[-4, 0, -6]" />
        <TresGroup ref="team1Defender3" :position="[4, 0, -6]" />
        <TresGroup ref="team1Defender4" :position="[12, 0, -6]" />
        
        <!-- Midfielders (4) -->
        <TresGroup ref="team1Midfielder1" :position="[-12, 0, 0]" />
        <TresGroup ref="team1Midfielder2" :position="[-4, 0, 0]" />
        <TresGroup ref="team1Midfielder3" :position="[4, 0, 0]" />
        <TresGroup ref="team1Midfielder4" :position="[12, 0, 0]" />
        
        <!-- Forwards (2) -->
        <TresGroup ref="team1Forward1" :position="[-6, 0, 6]" />
        <TresGroup ref="team1Forward2" :position="[6, 0, 6]" />
      </TresGroup>
      
      <!-- Team 2 (Red) - 4-4-2 Formation (mirrored) -->
      <TresGroup :position="[0, 0, 10]">
        <!-- Goalkeeper -->
        <TresGroup ref="team2Goalkeeper" :position="[0, 0, 14]" />
        
        <!-- Defenders (4) -->
        <TresGroup ref="team2Defender1" :position="[-12, 0, 6]" />
        <TresGroup ref="team2Defender2" :position="[-4, 0, 6]" />
        <TresGroup ref="team2Defender3" :position="[4, 0, 6]" />
        <TresGroup ref="team2Defender4" :position="[12, 0, 6]" />
        
        <!-- Midfielders (4) -->
        <TresGroup ref="team2Midfielder1" :position="[-12, 0, 0]" />
        <TresGroup ref="team2Midfielder2" :position="[-4, 0, 0]" />
        <TresGroup ref="team2Midfielder3" :position="[4, 0, 0]" />
        <TresGroup ref="team2Midfielder4" :position="[12, 0, 0]" />
        
        <!-- Forwards (2) -->
        <TresGroup ref="team2Forward1" :position="[-6, 0, -6]" />
        <TresGroup ref="team2Forward2" :position="[6, 0, -6]" />
      </TresGroup>
      
      <!-- Ball -->
      <TresGroup ref="ballGroup" :position="[0, 0.5, 0]" />
    </SceneCanvas>
    
    <!-- Battle Controls -->
    <div class="battle-controls">
      <v-btn 
        color="primary" 
        size="large"
        @click="startBattle"
        :disabled="isBattling"
      >
        {{ isBattling ? 'Battle in Progress...' : 'Start Battle' }}
      </v-btn>
      
      <div class="team-scores">
        <div class="team-score blue">
          <span class="team-label">Blue Team</span>
          <span class="score">{{ team1Score }}</span>
        </div>
        <div class="vs">VS</div>
        <div class="team-score red">
          <span class="team-label">Red Team</span>
          <span class="score">{{ team2Score }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import SceneCanvas from './scene/SceneCanvas.vue'
import SceneCamera from './scene/SceneCamera.vue'
import SceneLighting from './scene/SceneLighting.vue'
import { createMainCharacterMaterials, createLayeredMeshGroup, type MaterialPair } from '@/utils/materialHelpers'

// Battle state
const isBattling = ref(false)
const team1Score = ref(0)
const team2Score = ref(0)

// 3D refs - Team 1
const team1Goalkeeper = ref<THREE.Group>()
const team1Defender1 = ref<THREE.Group>()
const team1Defender2 = ref<THREE.Group>()
const team1Defender3 = ref<THREE.Group>()
const team1Defender4 = ref<THREE.Group>()
const team1Midfielder1 = ref<THREE.Group>()
const team1Midfielder2 = ref<THREE.Group>()
const team1Midfielder3 = ref<THREE.Group>()
const team1Midfielder4 = ref<THREE.Group>()
const team1Forward1 = ref<THREE.Group>()
const team1Forward2 = ref<THREE.Group>()

// 3D refs - Team 2
const team2Goalkeeper = ref<THREE.Group>()
const team2Defender1 = ref<THREE.Group>()
const team2Defender2 = ref<THREE.Group>()
const team2Defender3 = ref<THREE.Group>()
const team2Defender4 = ref<THREE.Group>()
const team2Midfielder1 = ref<THREE.Group>()
const team2Midfielder2 = ref<THREE.Group>()
const team2Midfielder3 = ref<THREE.Group>()
const team2Midfielder4 = ref<THREE.Group>()
const team2Forward1 = ref<THREE.Group>()
const team2Forward2 = ref<THREE.Group>()

const ballGroup = ref<THREE.Group>()
const fieldLinesGroup = ref<THREE.Group>()

// Animation mixers
const mixers: THREE.AnimationMixer[] = []

// Lighting settings
const lightingSettings = {
  keyLightIntensity: 1.2,
  fillLightIntensity: 0.6,
  rimLightIntensity: 0.8,
  ambientIntensity: 0.4,
  shadowEnabled: true
}

// Scene ready handler
const onSceneCreated = () => {
  console.log('Auto-battler scene created')
}

const onSceneReady = () => {
  console.log('Auto-battler scene ready')
  loadAllPlayers()
  createFieldLines()
  loadBall()
}

// Create field lines
const createFieldLines = () => {
  if (!fieldLinesGroup.value) return
  
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff })
  
  // Center circle
  const centerCircleGeometry = new THREE.BufferGeometry()
  const centerCirclePoints = []
  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI * 2
    centerCirclePoints.push(new THREE.Vector3(
      Math.cos(angle) * 6,
      0.01,
      Math.sin(angle) * 6
    ))
  }
  centerCircleGeometry.setFromPoints(centerCirclePoints)
  const centerCircle = new THREE.Line(centerCircleGeometry, lineMaterial)
  fieldLinesGroup.value.add(centerCircle)
  
  // Center line
  const centerLineGeometry = new THREE.BufferGeometry()
  centerLineGeometry.setFromPoints([
    new THREE.Vector3(-30, 0.01, 0),
    new THREE.Vector3(30, 0.01, 0)
  ])
  const centerLine = new THREE.Line(centerLineGeometry, lineMaterial)
  fieldLinesGroup.value.add(centerLine)
  
  // Field boundary
  const boundaryGeometry = new THREE.BufferGeometry()
  boundaryGeometry.setFromPoints([
    new THREE.Vector3(-30, 0.01, -20),
    new THREE.Vector3(30, 0.01, -20),
    new THREE.Vector3(30, 0.01, 20),
    new THREE.Vector3(-30, 0.01, 20),
    new THREE.Vector3(-30, 0.01, -20)
  ])
  const boundary = new THREE.Line(boundaryGeometry, lineMaterial)
  fieldLinesGroup.value.add(boundary)
}

// Load player models
const loadAllPlayers = async () => {
  const loader = new FBXLoader()
  const textureLoader = new THREE.TextureLoader()
  
  // Load player model and textures
  const [playerModel, baseTexture, overlayTexture] = await Promise.all([
    loader.loadAsync('/bot1/soccer_player_humanoid__texture.fbx'),
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
  
  // Function to create a player instance with layered materials
  const createPlayer = async (group: THREE.Group, color: string, isGoalkeeper = false) => {
    // All players now use the same visual style (white kit + overlay)
    // Goalkeepers visually match the main character
    const player = playerModel.clone()
    player.scale.setScalar(0.02) // Same scale as original main character
    
    // Create base and overlay materials using helper function
    const materials = createMainCharacterMaterials(baseTexture, overlayTexture, 1)
    
    // Only apply team colors to defenders/midfielders/forwards
    // Goalkeepers keep the default white kit appearance
    if (!isGoalkeeper) {
      // Set team color on overlay material
      if (color === 'blue') {
        materials.overlay.color.setHSL(220/360, 0.8, 0.5)
      } else {
        materials.overlay.color.setHSL(0/360, 0.8, 0.5)
      }
    }
    // If isGoalkeeper, materials remain as default (white kit)
    
    // Apply layered materials to player
    player.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        // Create layered mesh group using helper function
        const layeredGroup = createLayeredMeshGroup(child, materials)
        
        // Replace the original mesh with the layered group
        child.parent?.add(layeredGroup)
        child.parent?.remove(child)
      }
    })
    
    group.add(player)
    
    // Create animation mixer
    const mixer = new THREE.AnimationMixer(player)
    mixers.push(mixer)
    
    // Load appropriate animation based on role
    const animationPath = isGoalkeeper 
      ? '/bot1/Goalkeeper Idle.fbx' 
      : '/bot1/Soccer Idle.fbx'
    loadAnimation(mixer, animationPath)
    
    return player
  }
  
  // Create Team 1 (Blue)
  if (team1Goalkeeper.value) {
    await createPlayer(team1Goalkeeper.value, 'blue', true)
    // Ensure Blue GK position matches goal location
    team1Goalkeeper.value.position.set(0, 0, -14)
  }
  if (team1Defender1.value) await createPlayer(team1Defender1.value, 'blue')
  if (team1Defender2.value) await createPlayer(team1Defender2.value, 'blue')
  if (team1Defender3.value) await createPlayer(team1Defender3.value, 'blue')
  if (team1Defender4.value) await createPlayer(team1Defender4.value, 'blue')
  if (team1Midfielder1.value) await createPlayer(team1Midfielder1.value, 'blue')
  if (team1Midfielder2.value) await createPlayer(team1Midfielder2.value, 'blue')
  if (team1Midfielder3.value) await createPlayer(team1Midfielder3.value, 'blue')
  if (team1Midfielder4.value) await createPlayer(team1Midfielder4.value, 'blue')
  if (team1Forward1.value) await createPlayer(team1Forward1.value, 'blue')
  if (team1Forward2.value) await createPlayer(team1Forward2.value, 'blue')
  
  // Create Team 2 (Red) - facing opposite direction
  if (team2Goalkeeper.value) {
    const player = await createPlayer(team2Goalkeeper.value, 'red', true)
    player.rotation.y = Math.PI
    // Ensure Red GK position matches goal location (facing the field)
    team2Goalkeeper.value.position.set(0, 0, 14)
  }
  if (team2Defender1.value) {
    const player = await createPlayer(team2Defender1.value, 'red')
    player.rotation.y = Math.PI
  }
  if (team2Defender2.value) {
    const player = await createPlayer(team2Defender2.value, 'red')
    player.rotation.y = Math.PI
  }
  if (team2Defender3.value) {
    const player = await createPlayer(team2Defender3.value, 'red')
    player.rotation.y = Math.PI
  }
  if (team2Defender4.value) {
    const player = await createPlayer(team2Defender4.value, 'red')
    player.rotation.y = Math.PI
  }
  if (team2Midfielder1.value) {
    const player = await createPlayer(team2Midfielder1.value, 'red')
    player.rotation.y = Math.PI
  }
  if (team2Midfielder2.value) {
    const player = await createPlayer(team2Midfielder2.value, 'red')
    player.rotation.y = Math.PI
  }
  if (team2Midfielder3.value) {
    const player = await createPlayer(team2Midfielder3.value, 'red')
    player.rotation.y = Math.PI
  }
  if (team2Midfielder4.value) {
    const player = await createPlayer(team2Midfielder4.value, 'red')
    player.rotation.y = Math.PI
  }
  if (team2Forward1.value) {
    const player = await createPlayer(team2Forward1.value, 'red')
    player.rotation.y = Math.PI
  }
  if (team2Forward2.value) {
    const player = await createPlayer(team2Forward2.value, 'red')
    player.rotation.y = Math.PI
  }
}

// Load animation
const loadAnimation = async (mixer: THREE.AnimationMixer, animationPath: string) => {
  const loader = new FBXLoader()
  try {
    const animation = await loader.loadAsync(animationPath)
    if (animation.animations.length > 0) {
      const action = mixer.clipAction(animation.animations[0])
      action.play()
    }
  } catch (error) {
    console.error('Failed to load animation:', animationPath, error)
  }
}

// DEPRECATED: This function is no longer needed as goalkeepers now use the same visual style
// as other players in the createPlayer function above
/*
const loadMainCharacter = async (isGoalkeeper: boolean): Promise<{ player: THREE.Group, mixer: THREE.AnimationMixer }> => {
  const loader = new FBXLoader()
  
  // Try to load the main character model with fallback
  let playerModel: THREE.Group
  try {
    playerModel = await loader.loadAsync('/bot1/soccer_player_humanoid__texture.fbx')
  } catch (error) {
    console.warn('Failed to load primary model, trying fallback:', error)
    try {
      playerModel = await loader.loadAsync('/bot1/soccer_player_humanoid__texture2.fbx')
    } catch (fallbackError) {
      console.error('Failed to load fallback model:', fallbackError)
      throw fallbackError
    }
  }
  
  // Load textures for materials
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
  
  // Apply scale
  playerModel.scale.setScalar(0.02)
  
  // Apply materials to all meshes
  playerModel.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Create materials using helper function
      const materials = createMainCharacterMaterials(baseTexture, overlayTexture, 1)
      
      // Apply materials to mesh
      child.material = materials.base
      
      // Enable shadows
      child.castShadow = true
      child.receiveShadow = true
    }
  })
  
  // Create animation mixer and load appropriate animation
  const mixer = new THREE.AnimationMixer(playerModel)
  
  // Load animation based on goalkeeper status
  const animationPath = isGoalkeeper 
    ? '/bot1/Goalkeeper Idle.fbx' 
    : '/bot1/Soccer Idle.fbx'
  
  await loadAnimation(mixer, animationPath)
  
  return { player: playerModel, mixer }
}
*/

// Load ball
const loadBall = () => {
  if (!ballGroup.value) return
  
  const ballGeometry = new THREE.SphereGeometry(0.2, 32, 32)
  const ballMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.4,
    metalness: 0.1
  })
  
  const ball = new THREE.Mesh(ballGeometry, ballMaterial)
  ball.castShadow = true
  ball.receiveShadow = true
  
  ballGroup.value.add(ball)
}

// Start battle
const startBattle = () => {
  if (isBattling.value) return
  
  isBattling.value = true
  team1Score.value = 0
  team2Score.value = 0
  
  // Simple battle simulation
  let battleTime = 0
  const battleDuration = 10000 // 10 seconds
  
  const battleInterval = setInterval(() => {
    battleTime += 100
    
    // Random events
    if (Math.random() < 0.02) {
      // Random goal
      if (Math.random() < 0.5) {
        team1Score.value++
      } else {
        team2Score.value++
      }
    }
    
    // Move ball randomly
    if (ballGroup.value) {
      const time = Date.now() * 0.001
      ballGroup.value.position.x = Math.sin(time * 2) * 10
      ballGroup.value.position.z = Math.cos(time * 1.5) * 10
    }
    
    if (battleTime >= battleDuration) {
      clearInterval(battleInterval)
      isBattling.value = false
    }
  }, 100)
}

// Animation loop
const animate = () => {
  requestAnimationFrame(animate)
  
  const delta = 0.016 // 60fps
  mixers.forEach(mixer => mixer.update(delta))
}

// Start animation loop when mounted
onMounted(() => {
  animate()
})

// Watch group refs
watch(team1Goalkeeper, (group) => {
  if (group) {
    console.log('Team 1 goalkeeper group ready')
    // Delay loading to ensure all refs are ready
    setTimeout(loadAllPlayers, 100)
  }
})

// Define a method that can be exposed to parent
const updateTokenBalances = (tokens: any[]) => {
  // This component doesn't use token balances, but we need this method
  // to maintain compatibility with the parent component
  console.log('AutoBattlerScene: Token balances update not implemented')
}

// Expose methods to parent
defineExpose({
  updateTokenBalances
})
</script>

<style scoped>
.auto-battler-scene-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.background-video {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: translate(-50%, -50%);
  z-index: -1;
  opacity: 0.3;
}

.battle-controls {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  background: rgba(0, 0, 0, 0.8);
  padding: 20px;
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.team-scores {
  display: flex;
  align-items: center;
  gap: 30px;
  color: white;
  font-size: 20px;
  font-weight: bold;
}

.team-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.team-score.blue {
  color: #0066cc;
}

.team-score.red {
  color: #cc0000;
}

.team-label {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.8;
}

.score {
  font-size: 36px;
  font-weight: 900;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.vs {
  color: white;
  font-size: 24px;
  opacity: 0.6;
}
</style>