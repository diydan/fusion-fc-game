<template>
  <div class="game-canvas-container">
    <div class="game-header">
      <div class="score-board">
        <div class="team-score home">
          <span class="team-name">{{ homeTeamName }}</span>
          <span class="score">{{ homeScore }}</span>
        </div>
        <div class="timer">
          <span class="time">{{ formattedTime }}</span>
          <div v-if="gameOver" class="game-status">{{ gameStatus }}</div>
        </div>
        <div class="team-score away">
          <span class="team-name">{{ awayTeamName }}</span>
          <span class="score">{{ awayScore }}</span>
        </div>
      </div>
    </div>

    <canvas 
      ref="canvas" 
      class="game-canvas"
      @click="handleCanvasClick"
      :width="canvasWidth"
      :height="canvasHeight"
    />

    <div class="game-controls">
      <button @click="togglePlayPause" class="control-btn">
        {{ isPlaying ? 'Pause' : 'Play' }}
      </button>
      <button @click="resetGame" class="control-btn">Reset</button>
      <button @click="toggleSound" class="control-btn">
        {{ soundEnabled ? '🔊' : '🔇' }}
      </button>
      <div class="speed-control">
        <label>Speed: {{ gameSpeed }}x</label>
        <input type="range" v-model="gameSpeed" min="0.5" max="3" step="0.5" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { FutsalGameEngine } from '@/game/engine/FutsalGameEngine'
import { useGameSound } from '@/composables/useGameSound'

// Props
const props = defineProps({
  homeTeamName: {
    type: String,
    default: 'Home'
  },
  awayTeamName: {
    type: String,
    default: 'Away'
  },
  homeFormation: {
    type: String,
    default: '1-2-1-1'
  },
  awayFormation: {
    type: String,
    default: '1-2-1-1'
  },
  homeTactic: {
    type: String,
    default: 'balanced'
  },
  awayTactic: {
    type: String,
    default: 'balanced'
  }
})

// Canvas setup
const canvas = ref(null)
const canvasWidth = 700
const canvasHeight = 500

// Game state
const gameStarted = ref(false)
const isPlaying = ref(false)
const gameSpeed = ref(1)
const soundEnabled = ref(true)

// Score and time
const homeScore = ref(0)
const awayScore = ref(0)
const gameTime = ref(0)
const gameOver = ref(false)
const gameStatus = ref('')

// Sound system
const { soundEnabled: globalSoundEnabled, masterVolume } = useGameSound()

// Audio cache for game sounds
const audioCache = new Map()

// Play audio file
const playAudioFile = async (url) => {
  if (!soundEnabled.value) return
  
  try {
    let audio = audioCache.get(url)
    if (!audio) {
      audio = new Audio(url)
      audio.volume = 0.5
      audioCache.set(url, audio)
    }
    audio.currentTime = 0
    audio.play()
  } catch (error) {
    console.error('Error playing audio:', error)
  }
}

// Game-specific sound functions
const playKickSound = () => playAudioFile('/audio/ball_kick_hit.mp3')
const playGoalSound = () => playAudioFile('/audio/sim/end-game.mp3')
const playWhistleSound = () => playAudioFile('/audio/sim/kick-off.mp3')
const playFoulSound = () => playAudioFile('/audio/sim/foul.mp3')

// Game engine
let gameEngine = null
let animationId = null
let lastTime = 0

// Computed
const formattedTime = computed(() => {
  const minutes = Math.floor(gameTime.value / 60)
  const seconds = Math.floor(gameTime.value % 60)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

// Initialize game
const initializeGame = () => {
  console.log('Initializing game...')
  const gameConfig = {
    fieldWidth: 600,
    fieldHeight: 400,
    homeFormation: props.homeFormation,
    awayFormation: props.awayFormation,
    homeTactic: props.homeTactic,
    awayTactic: props.awayTactic,
    soundSystem: soundEnabled.value ? { playKickSound, playGoalSound, playWhistleSound } : null
  }
  
  console.log('Game config:', gameConfig)
  
  // Validate formations
  if (!props.homeFormation || !props.awayFormation) {
    console.error('Missing formation data!', {
      homeFormation: props.homeFormation,
      awayFormation: props.awayFormation
    })
  }
  
  gameEngine = new FutsalGameEngine(gameConfig)
  
  // Check if engine was created
  console.log('Game engine created:', gameEngine)
  console.log('Initial players:', gameEngine.getPlayers())
  console.log('Initial ball:', gameEngine.getBall())
  
  // Set kickoff team (home team for now)
  const gameState = gameEngine.getGameState()
  gameState.kickoffTeam = 'home'
  
  // The game will handle kickoff automatically when it starts
  // Get the ball state
  const ball = gameEngine.getBall()
  console.log('Initial ball from engine:', ball)
  
  // The ball should already be at center from engine initialization
  // Just log its state
  console.log('Game ready for kickoff')
  console.log('Players:', gameEngine.getPlayers().length)
  console.log('Ball state:', {
    x: ball?.x,
    y: ball?.y,
    radius: ball?.radius,
    isValid: ball && isFinite(ball.x) && isFinite(ball.y) && isFinite(ball.radius)
  })
  
  render()
}

// Game loop
let frameCount = 0
const gameLoop = (currentTime) => {
  if (!gameEngine) return
  
  frameCount++
  
  // Initialize lastTime on first frame
  if (lastTime === 0) {
    lastTime = currentTime
  }
  
  const deltaTime = currentTime - lastTime
  lastTime = currentTime
  
  // Debug: Check if update is being called (only first few frames)
  if (frameCount < 5) {
    console.log(`Game loop frame ${frameCount}, isPlaying:`, isPlaying.value)
  }
  
  // Pass the current timestamp to the engine (original uses absolute time)
  gameEngine.update(currentTime)
  
  // Update UI state
  const state = gameEngine.getGameState()
  homeScore.value = state.homeScore
  awayScore.value = state.awayScore
  gameTime.value = state.gameTime
  gameOver.value = state.gameOver
  
  // Debug: Check game state every ~second
  if (frameCount % 60 === 0) {
    console.log('Game state:', {
      time: state.gameTime.toFixed(1),
      isPlaying: state.isPlaying,
      score: `${state.homeScore}-${state.awayScore}`,
      ballPos: gameEngine.getBall()
    })
  }
  
  if (state.gameOver) {
    gameStatus.value = state.homeScore > state.awayScore ? 
      `${props.homeTeamName} Wins!` : 
      state.awayScore > state.homeScore ? 
      `${props.awayTeamName} Wins!` : 
      'Draw!'
    isPlaying.value = false
  }
  
  render()
  
  if (state.isPlaying) {
    animationId = requestAnimationFrame(gameLoop)
  }
}

// Render
const render = () => {
  if (!canvas.value || !gameEngine) return
  
  const ctx = canvas.value.getContext('2d')
  if (!ctx) return
  
  // Clear canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  
  // Draw field
  drawField(ctx)
  
  // Draw ball
  const ball = gameEngine.getBall()
  if (ball) {
    drawBall(ctx, ball)
  }
  
  // Draw players
  const players = gameEngine.getPlayers()
  players.forEach(player => {
    drawPlayer(ctx, player)
  })
}

// Drawing functions
const drawField = (ctx) => {
  const fieldX = 50
  const fieldY = 50
  const fieldWidth = 600
  const fieldHeight = 400
  
  // Field background
  ctx.fillStyle = '#2d7a2d'
  ctx.fillRect(fieldX, fieldY, fieldWidth, fieldHeight)
  
  // Field lines
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 2
  
  // Outer boundary
  ctx.strokeRect(fieldX, fieldY, fieldWidth, fieldHeight)
  
  // Center line
  ctx.beginPath()
  ctx.moveTo(fieldX + fieldWidth/2, fieldY)
  ctx.lineTo(fieldX + fieldWidth/2, fieldY + fieldHeight)
  ctx.stroke()
  
  // Center circle
  ctx.beginPath()
  ctx.arc(fieldX + fieldWidth/2, fieldY + fieldHeight/2, 50, 0, Math.PI * 2)
  ctx.stroke()
  
  // Goals
  const goalWidth = 120
  const goalHeight = 40
  
  // Home goal
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.fillRect(fieldX - goalHeight, fieldY + fieldHeight/2 - goalWidth/2, goalHeight, goalWidth)
  ctx.strokeRect(fieldX - goalHeight, fieldY + fieldHeight/2 - goalWidth/2, goalHeight, goalWidth)
  
  // Away goal
  ctx.fillRect(fieldX + fieldWidth, fieldY + fieldHeight/2 - goalWidth/2, goalHeight, goalWidth)
  ctx.strokeRect(fieldX + fieldWidth, fieldY + fieldHeight/2 - goalWidth/2, goalHeight, goalWidth)
  
  // Penalty areas
  const penaltyWidth = 200
  const penaltyDepth = 100
  
  ctx.strokeRect(fieldX, fieldY + fieldHeight/2 - penaltyWidth/2, penaltyDepth, penaltyWidth)
  ctx.strokeRect(fieldX + fieldWidth - penaltyDepth, fieldY + fieldHeight/2 - penaltyWidth/2, penaltyDepth, penaltyWidth)
}

const drawPlayer = (ctx, player) => {
  // Validate player data
  if (!player || !isFinite(player.x) || !isFinite(player.y)) {
    console.error('Invalid player data:', player)
    return
  }
  
  const x = player.x + 50
  const y = player.y + 50
  const radius = player.radius || 10 // Default radius if missing
  
  // Player body
  ctx.fillStyle = player.team === 'home' ? '#3498db' : '#e74c3c'
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
  
  // Player number
  ctx.fillStyle = 'white'
  ctx.font = 'bold 12px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText((player.number || '?').toString(), x, y)
  
  // Direction indicator
  if (player.targetX !== undefined && player.targetY !== undefined && 
      isFinite(player.targetX) && isFinite(player.targetY)) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, y)
    const angle = Math.atan2(player.targetY - player.y, player.targetX - player.x)
    ctx.lineTo(x + Math.cos(angle) * 20, y + Math.sin(angle) * 20)
    ctx.stroke()
  }
}

const drawBall = (ctx, ball) => {
  // Validate ball data
  if (!ball || !isFinite(ball.x) || !isFinite(ball.y) || !isFinite(ball.radius)) {
    console.error('Invalid ball data:', ball)
    return
  }
  
  const x = ball.x + 50
  const y = ball.y + 50
  const radius = ball.radius || 5 // Default radius if missing
  const z = ball.z || 0
  
  // Ball shadow (based on height)
  const shadowScale = 1 - z / 100
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.beginPath()
  ctx.ellipse(x, y + 5, radius * shadowScale, radius * shadowScale * 0.5, 0, 0, Math.PI * 2)
  ctx.fill()
  
  // Ball
  const gradient = ctx.createRadialGradient(x - 2, y - 2, 0, x, y, radius)
  gradient.addColorStop(0, 'white')
  gradient.addColorStop(0.7, '#f0f0f0')
  gradient.addColorStop(1, '#cccccc')
  
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y - z * 0.5, radius, 0, Math.PI * 2)
  ctx.fill()
  
  // Ball outline
  ctx.strokeStyle = '#999999'
  ctx.lineWidth = 1
  ctx.stroke()
}

// Control functions
const togglePlayPause = () => {
  if (!gameStarted.value) {
    initializeGame()
    gameStarted.value = true
  }
  
  if (!gameEngine) return
  
  if (isPlaying.value) {
    console.log('Pausing game...')
    gameEngine.pause()
    isPlaying.value = false
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  } else {
    console.log('Starting game...')
    // Reset frame counter
    frameCount = 0
    
    // Call the engine's play method
    gameEngine.play()
    isPlaying.value = true
    
    // Start the game loop
    lastTime = performance.now()
    animationId = requestAnimationFrame(gameLoop)
    
    if (soundEnabled.value) playWhistleSound()
  }
}

const resetGame = () => {
  console.log('Resetting game...')
  console.trace('Reset called from:')
  
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  
  isPlaying.value = false
  homeScore.value = 0
  awayScore.value = 0
  gameTime.value = 0
  gameOver.value = false
  gameStatus.value = ''
  frameCount = 0
  lastTime = 0
  
  // Reset the game engine instead of destroying it
  if (gameEngine) {
    gameEngine.reset()
  }
  
  // Re-render the reset field
  render()
}

const toggleSound = () => {
  soundEnabled.value = !soundEnabled.value
  
  // Update volume for all cached audio
  audioCache.forEach(audio => {
    audio.volume = soundEnabled.value ? 0.5 : 0
  })
  
  if (gameEngine) {
    gameEngine.setSoundEnabled(soundEnabled.value)
  }
}

const handleCanvasClick = (event) => {
  if (!canvas.value || !gameEngine) return
  
  const rect = canvas.value.getBoundingClientRect()
  const x = event.clientX - rect.left - 50
  const y = event.clientY - rect.top - 50
  
  // Convert to game coordinates and handle selection
  const players = gameEngine.getPlayers()
  const clickedPlayer = players.find(player => {
    const distance = Math.sqrt((player.x - x) ** 2 + (player.y - y) ** 2)
    return distance < player.radius
  })
  
  if (clickedPlayer) {
    console.log('Clicked player:', clickedPlayer)
  }
}

// Watch for speed changes
watch(gameSpeed, (newSpeed) => {
  if (gameEngine) {
    gameEngine.setGameSpeed(newSpeed)
  }
})

// Lifecycle
onMounted(() => {
  console.log('GameCanvas mounted')
  // Initialize the game engine on mount so it's ready
  initializeGame()
  gameStarted.value = true
  // Render the initial state
  render()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})
</script>

<style scoped>
.game-canvas-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background-color: #1a1a1a;
  border-radius: 10px;
}

.game-header {
  width: 100%;
  max-width: 700px;
}

.score-board {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #2c2c2c;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.team-score {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.team-name {
  font-size: 14px;
  color: #999;
  margin-bottom: 5px;
}

.score {
  font-size: 36px;
  font-weight: bold;
  color: white;
}

.team-score.home .score {
  color: #3498db;
}

.team-score.away .score {
  color: #e74c3c;
}

.timer {
  text-align: center;
}

.time {
  font-size: 24px;
  color: white;
  font-weight: bold;
}

.game-status {
  font-size: 16px;
  color: #f39c12;
  margin-top: 5px;
  font-weight: bold;
}

.game-canvas {
  border: 2px solid #444;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.game-controls {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.control-btn {
  padding: 10px 20px;
  font-size: 16px;
  background-color: #2c2c2c;
  color: white;
  border: 1px solid #444;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.control-btn:hover:not(:disabled) {
  background-color: #3c3c3c;
  transform: translateY(-1px);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
}

.speed-control input {
  width: 100px;
}

@media (max-width: 768px) {
  .game-canvas-container {
    padding: 10px;
  }
  
  .game-canvas {
    max-width: 100%;
    height: auto;
  }
  
  .control-btn {
    padding: 8px 16px;
    font-size: 14px;
  }
}
</style>