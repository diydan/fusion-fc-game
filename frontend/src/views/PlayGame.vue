<template>
  <div class="sim-2d-container">
    <div class="game-header">
      <div class="score-board">
        <div class="team-score home">
          <span class="team-name">Home</span>
          <span class="score">{{ homeScore }}</span>
        </div>
        <div class="timer">
          <span class="time">{{ formattedTime }}</span>
          <div v-if="gameOver" class="game-status">{{ gameStatus }}</div>
        </div>
        <div class="team-score away">
          <span class="team-name">Away</span>
          <span class="score">{{ awayScore }}</span>
        </div>
      </div>

      <!-- Coin Flip Modal -->
      <div v-if="showCoinFlipModal" class="modal-overlay">
        <div class="coin-flip-modal">
          <h2>⚽ Kickoff Toss</h2>
          
          <div v-if="!playerChoice" class="choice-phase">
            <p>Choose your call:</p>
            <div class="coin-choices">
              <button @click="makeChoice('Heads')" class="choice-button heads">
                <span class="coin-icon">🪙</span>
                <span>Heads</span>
              </button>
              <button @click="makeChoice('Tails')" class="choice-button tails">
                <span class="coin-icon">🪙</span>
                <span>Tails</span>
              </button>
            </div>
          </div>

          <div v-else-if="coinFlipping" class="flipping-phase">
            <p>You chose: <strong>{{ playerChoice }}</strong></p>
            <div class="coin-animation">
              <div class="spinning-coin">🪙</div>
            </div>
            <p>Flipping coin...</p>
          </div>

          <div v-else-if="coinResult" class="result-phase">
            <p>You chose: <strong>{{ playerChoice }}</strong></p>
            <div class="coin-result">
              <div class="coin-face">{{ coinResult }}</div>
            </div>
            <div class="result-text">
              <p v-if="playerWon" class="win-text">✅ Correct! You win the toss!</p>
              <p v-else class="lose-text">❌ Wrong! Computer wins the toss!</p>
              <p><strong>{{ kickoffTeam }}</strong> team will kick off!</p>
            </div>
            <button @click="startGame" class="start-button">Start Game</button>
          </div>
        </div>
      </div>
      
      <div class="team-settings">
        <div class="team-config home-team">
          <h3>Home Team</h3>
          <div class="config-row">
            <label>Formation:</label>
            <select v-model="homeFormation">
              <option value="1-2-1-1">1-2-1-1 (Balanced)</option>
              <option value="1-1-2-1">1-1-2-1 (Midfield)</option>
              <option value="1-3-1">1-3-1 (Defensive)</option>
              <option value="1-2-2">1-2-2 (Attacking)</option>
            </select>
          </div>
          <div class="config-row">
            <label>Tactic:</label>
            <select v-model="homeTactic">
              <option value="rotation">Rotation in Attack</option>
              <option value="flying-keeper">Flying Keeper</option>
              <option value="pass-move">Pass and Move</option>
              <option value="defensive">Defensive Positioning</option>
              <option value="counter">Counter-Attacking</option>
              <option value="high-press">High Press</option>
              <option value="wing-play">Wing Play</option>
              <option value="pivot">Pivot Play</option>
            </select>
          </div>
          <div class="config-row">
            <label>Strategy:</label>
            <input type="range" v-model="homeStrategy" min="0" max="8" step="1" />
            <span class="strategy-label">{{ getStrategyLabel(homeStrategy) }}</span>
          </div>
        </div>
        
        <div class="team-config away-team">
          <h3>Away Team</h3>
          <div class="config-row">
            <label>Formation:</label>
            <select v-model="awayFormation">
              <option value="1-2-1-1">1-2-1-1 (Balanced)</option>
              <option value="1-1-2-1">1-1-2-1 (Midfield)</option>
              <option value="1-3-1">1-3-1 (Defensive)</option>
              <option value="1-2-2">1-2-2 (Attacking)</option>
            </select>
          </div>
          <div class="config-row">
            <label>Tactic:</label>
            <select v-model="awayTactic">
              <option value="rotation">Rotation in Attack</option>
              <option value="flying-keeper">Flying Keeper</option>
              <option value="pass-move">Pass and Move</option>
              <option value="defensive">Defensive Positioning</option>
              <option value="counter">Counter-Attacking</option>
              <option value="high-press">High Press</option>
              <option value="wing-play">Wing Play</option>
              <option value="pivot">Pivot Play</option>
            </select>
          </div>
          <div class="config-row">
            <label>Strategy:</label>
            <input type="range" v-model="awayStrategy" min="0" max="8" step="1" />
            <span class="strategy-label">{{ getStrategyLabel(awayStrategy) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <canvas 
      ref="canvas" 
      class="game-canvas" 
      :width="700" 
      :height="500"
      @click="handleCanvasClick"
      @mousemove="handleCanvasHover"
      @mouseleave="handleCanvasLeave"
    />
    
    <div class="controls">
      <button @click="togglePlay" :disabled="!gameStarted" class="control-btn">
        {{ isPlaying ? 'Pause' : 'Play' }}
      </button>
      <button @click="resetGame" class="control-btn">Reset</button>
      <div class="sound-toggle">
        <label>
          <input type="checkbox" v-model="soundEnabled" />
          Sound
        </label>
      </div>
      <div class="speed-control">
        <label>Speed: {{ gameSpeed }}x</label>
        <input type="range" v-model="gameSpeed" min="0.5" max="3" step="0.5" />
      </div>
    </div>
    
    <!-- Engine Controls -->
    <div class="engine-controls v1-controls">
      <h3>Match Statistics</h3>
      <div class="stat-row">
        <span class="stat-label">Cards:</span>
        <span class="stat-value">
          <span v-for="(card, idx) in v1Stats.cards" :key="idx" class="card-indicator" :class="card.type">
            {{ card.player }} ({{ card.time }})
          </span>
          <span v-if="v1Stats.cards.length === 0" class="no-cards">No cards</span>
        </span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Fouls:</span>
        <span class="stat-value">{{ v1Stats.fouls }} ({{ v1Stats.advantages }} advantages)</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Free Kicks:</span>
        <span class="stat-value">{{ v1Stats.freeKicks }}</span>
      </div>
    </div>
    
    <!-- Player Selection Display -->
    <div class="player-display" v-if="selectedHomePlayer || selectedAwayPlayer">
      <div class="player-stats-container" v-if="selectedHomePlayer">
        <h3>{{ selectedHomePlayer.name }} - #{{ selectedHomePlayer.number }}</h3>
        <div class="attributes-grid">
          <div class="attribute" v-for="(value, key) in getDisplayAttributes(selectedHomePlayer.attributes)" :key="key">
            <span class="attr-name">{{ formatAttributeName(key) }}:</span>
            <div class="attr-bar">
              <div class="attr-fill" :style="{ width: value + '%' }"></div>
            </div>
            <span class="attr-value">{{ value }}</span>
          </div>
        </div>
        <canvas ref="singlePlayerChart" width="250" height="250" class="spider-chart"></canvas>
      </div>
      
      <div class="player-stats-container" v-if="selectedAwayPlayer">
        <h3>{{ selectedAwayPlayer.name }} - #{{ selectedAwayPlayer.number }}</h3>
        <div class="attributes-grid">
          <div class="attribute" v-for="(value, key) in getDisplayAttributes(selectedAwayPlayer.attributes)" :key="key">
            <span class="attr-name">{{ formatAttributeName(key) }}:</span>
            <div class="attr-bar">
              <div class="attr-fill away" :style="{ width: value + '%' }"></div>
            </div>
            <span class="attr-value">{{ value }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Team Stats Display -->
    <div class="team-stats-display" v-if="showTeamStats">
      <div class="team-stats-content">
        <h3>Team Comparison</h3>
        <div class="team-selector">
          <button @click="selectedTeam = 'home'" :class="{ active: selectedTeam === 'home' }">Home Team</button>
          <button @click="selectedTeam = 'away'" :class="{ active: selectedTeam === 'away' }">Away Team</button>
        </div>
        <canvas ref="spiderChart" width="300" height="300" class="spider-chart"></canvas>
        <div class="average-stats">
          <h4>{{ selectedTeam === 'home' ? 'Home' : 'Away' }} Team Averages</h4>
          <div class="stat-row" v-for="(value, key) in teamAverages" :key="key">
            <span>{{ formatAttributeName(key) }}:</span>
            <span>{{ value.toFixed(1) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Achievement Notifications -->
    <TransitionGroup name="achievement" tag="div" class="achievement-container">
      <div v-for="achievement in recentAchievements" :key="achievement.id + achievement.timestamp" class="achievement-notification">
        <div class="achievement-icon">{{ achievement.icon }}</div>
        <div class="achievement-info">
          <div class="achievement-title">{{ achievement.name }}</div>
          <div class="achievement-desc">{{ achievement.description }}</div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { FutsalGameEngine, type Player, type PlayerAttributes, type Ball, type GameConfig } from '@/game/engine/FutsalGameEngine'

const canvas = ref<HTMLCanvasElement>()
const spiderChart = ref<HTMLCanvasElement>()
const singlePlayerChart = ref<HTMLCanvasElement>()

// Game state
const homeScore = ref(0)
const awayScore = ref(0)
const gameTime = ref(1200000) // 20 minutes in milliseconds
const gameOver = ref(false)
const gameStatus = ref('')
const isPlaying = ref(false)
const gameStarted = ref(false)
const showCoinFlipModal = ref(true)
const playerChoice = ref<'Heads' | 'Tails' | null>(null)
const coinFlipping = ref(false)
const coinResult = ref<'Heads' | 'Tails' | null>(null)
const kickoffTeam = ref<'Home' | 'Away' | null>(null)
const playerWon = ref(false)

// Sound effects
const soundEnabled = ref(true)
const audioCache = new Map<string, HTMLAudioElement>()

// Team configurations
const homeFormation = ref('1-2-1-1')
const awayFormation = ref('1-2-1-1')
const homeTactic = ref('rotation')
const awayTactic = ref('counter')
const homeStrategy = ref(4) // 0-8 scale
const awayStrategy = ref(4)

// Game settings
const gameSpeed = ref(1)

// Player state
const players = ref<Player[]>([])
const ball = ref<Ball | null>(null)
const hoveredPlayer = ref<Player | null>(null)

// Statistics for V1
const v1Stats = ref({
  cards: [] as Array<{ player: string; type: string; time: string }>,
  fouls: 0,
  advantages: 0,
  freeKicks: 0
})

// Achievement system
const achievements = ref([
  { id: 'first-goal', name: 'First Blood', description: 'Score the first goal', icon: '⚽', unlocked: false },
  { id: 'hat-trick', name: 'Hat Trick Hero', description: 'Score 3 goals with one player', icon: '🎩', unlocked: false },
  { id: 'clean-sheet', name: 'Clean Sheet', description: 'Win without conceding', icon: '🧤', unlocked: false },
  { id: 'comeback', name: 'Comeback King', description: 'Win after being 2 goals down', icon: '👑', unlocked: false },
  { id: 'perfect-pass', name: 'Tiki-Taka', description: '10 consecutive passes', icon: '🎯', unlocked: false },
  { id: 'long-shot', name: 'Thunderbolt', description: 'Score from outside the box', icon: '⚡', unlocked: false },
  { id: 'quick-goal', name: 'Lightning Start', description: 'Score in the first 30 seconds', icon: '🏃', unlocked: false },
  { id: 'possession', name: 'Ball Hog', description: '70% possession for 5 minutes', icon: '🎮', unlocked: false }
])

const recentAchievements = ref<Array<any>>([])

// Game engine
let gameEngine: FutsalGameEngine
let animationId: number | null = null
let lastTime = 0

// Computed
const formattedTime = computed(() => {
  const totalSeconds = Math.ceil(gameTime.value / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const gameState = computed(() => {
  if (!gameEngine) return null
  return gameEngine.getGameState()
})

// Initialize audio
const initAudio = () => {
  const sounds = [
    '/audio/sim/kick-off.mp3',
    '/audio/sim/foul.mp3',
    '/audio/sim/foul2.mp3',
    '/audio/ball_kick_hit.mp3',
    '/audio/sim/end-game.mp3'
  ]
  
  sounds.forEach(sound => {
    if (!audioCache.has(sound)) {
      const audio = new Audio(sound)
      audio.volume = 0.5
      audioCache.set(sound, audio)
    }
  })
}

// Play audio file
const playAudioFile = (url: string, volume: number = 0.5) => {
  if (!soundEnabled.value) return
  
  let audio = audioCache.get(url)
  if (!audio) {
    audio = new Audio(url)
    audioCache.set(url, audio)
  }
  
  audio.volume = volume
  audio.currentTime = 0
  audio.play().catch(e => console.log('Audio play failed:', e))
}

// Initialize game engine
const initializeGameEngine = () => {
  const gameConfig: GameConfig = {
    fieldWidth: 600,
    fieldHeight: 400,
    fieldBuffer: 50,
    goalWidth: 120,
    goalDepth: 40,
    homeFormation: homeFormation.value,
    awayFormation: awayFormation.value,
    homeTactic: homeTactic.value,
    awayTactic: awayTactic.value,
    homeStrategy: homeStrategy.value,
    awayStrategy: awayStrategy.value,
    soundSystem: {
      playKickSound: () => playAudioFile('/audio/ball_kick_hit.mp3', 0.3),
      playGoalSound: () => playAudioFile('/audio/sim/end-game.mp3', 0.6),
      playWhistleSound: () => playAudioFile('/audio/sim/kick-off.mp3', 0.5),
      playFoulSound: () => playAudioFile('/audio/sim/foul.mp3', 0.4)
    }
  }
  
  gameEngine = new FutsalGameEngine(gameConfig)
  console.log('V1 (Original) engine initialized')
}

// Update game state from engine
const updateGameState = () => {
  if (!gameEngine) return
  
  const state = gameEngine.getGameState()
  homeScore.value = state.homeScore
  awayScore.value = state.awayScore
  gameTime.value = state.gameTime
  
  // Debug auto-pause issue
  if (isPlaying.value !== state.isPlaying) {
    console.log('Playing state changed:', isPlaying.value, '->', state.isPlaying)
  }
  
  isPlaying.value = state.isPlaying
  gameOver.value = state.gameOver
  
  if (state.gameOver) {
    if (state.homeScore > state.awayScore) {
      gameStatus.value = 'Home Team Wins!'
    } else if (state.awayScore > state.homeScore) {
      gameStatus.value = 'Away Team Wins!'
    } else {
      gameStatus.value = 'Draw!'
    }
  }
  
  // Get players and ball
  players.value = gameEngine.getPlayers() || []
  ball.value = gameEngine.getBall() || null
  
  // Update V1 statistics
  updateV1Statistics()
}

// Update V1 specific statistics
const updateV1Statistics = () => {
  if (!gameEngine) return
  
  const stats = gameEngine.getStatistics()
  if (stats) {
    v1Stats.value.fouls = stats.foulsCommitted?.home + stats.foulsCommitted?.away || 0
    v1Stats.value.advantages = stats.advantagesPlayed || 0
    v1Stats.value.freeKicks = stats.freeKicksAttempted?.home + stats.freeKicksAttempted?.away || 0
    
    // Update cards from players
    v1Stats.value.cards = []
    players.value.forEach(player => {
      if (player.yellowCards > 0) {
        v1Stats.value.cards.push({
          player: player.name,
          type: player.yellowCards >= 2 ? 'red' : 'yellow',
          time: 'N/A'
        })
      }
    })
  }
}

// Coin flip modal functions
const makeChoice = (choice: 'Heads' | 'Tails') => {
  playerChoice.value = choice
  coinFlipping.value = true
  
  // Initialize audio on user interaction
  initAudio()
  
  // Simulate coin flip
  setTimeout(() => {
    const isHeads = Math.random() < 0.5
    coinResult.value = isHeads ? 'Heads' : 'Tails'
    playerWon.value = choice === coinResult.value
    kickoffTeam.value = playerWon.value ? 'Home' : 'Away'
    coinFlipping.value = false
    
    // Play whistle sound for result
    playWhistleSound()
    
    // Set kickoff formation after a delay to make it visible
    setTimeout(() => {
      setKickoffFormation()
      // Force immediate visual update
      render()
    }, 1000)
  }, 2000)
}

const startGame = () => {
  showCoinFlipModal.value = false
  gameStarted.value = true
  
  // Play kickoff whistle
  playWhistleSound()
  
  // Start the game (formation already set after coin flip)
  if (gameEngine) {
    console.log('Starting game with kickoff team:', kickoffTeam.value)
    console.log('Engine instance type:', gameEngine.constructor.name)
    console.log('Engine object:', gameEngine)
    
    // Actually start the game! (ball starts at center with zero velocity)
    togglePlay()
  }
}

// Set realistic kickoff formation
const setKickoffFormation = () => {
  if (!gameEngine) return
  
  const players = gameEngine.getPlayers()
  const kickoffTeamValue = kickoffTeam.value
  
  players.forEach(player => {
    const playerData = player as any
    
    if (playerData.team === 'home') {
      if (kickoffTeamValue === 'Home') {
        // Home team kicks off - attacking formation
        setKickoffPosition(playerData, 'home', true)
      } else {
        // Home team defends - defensive formation
        setKickoffPosition(playerData, 'home', false)
      }
    } else {
      if (kickoffTeamValue === 'Away') {
        // Away team kicks off - attacking formation
        setKickoffPosition(playerData, 'away', true) 
      } else {
        // Away team defends - defensive formation
        setKickoffPosition(playerData, 'away', false)
      }
    }
  })
  
  // Position ball at center
  const ballObj = gameEngine.getBall()
  if (ballObj) {
    ballObj.x = 300
    ballObj.y = 200
    ballObj.vx = 0
    ballObj.vy = 0
    ballObj.z = 0
  }
}

// Set player position for kickoff
const setKickoffPosition = (player: any, team: 'home' | 'away', isKickingOff: boolean) => {
  const fieldWidth = 600
  const fieldHeight = 400
  const centerX = fieldWidth / 2
  const centerY = fieldHeight / 2
  
  // Function to set position based on engine version
  const setPosition = (x: number, y: number) => {
    // Direct assignment for all versions
    player.x = x
    player.y = y
    player.targetX = x
    player.targetY = y
  }
  
  if (team === 'home') {
    if (isKickingOff) {
      // Home team kicks off - proper kickoff formation
      switch (player.role) {
        case 'goalkeeper':
          setPosition(40, centerY)
          break
        case 'defender':
          if (player.number <= 2) {
            setPosition(120, player.number === 1 ? centerY - 60 : centerY + 60)
          } else {
            setPosition(100, centerY)
          }
          break
        case 'midfielder':
          if (player.number === 3) {
            setPosition(centerX - 30, centerY - 5) // Just behind center, offset from striker
          } else {
            setPosition(240, centerY)
          }
          break
        case 'striker':
          setPosition(centerX + 5, centerY) // Just in front of ball for kickoff
          break
      }
    } else {
      // Home team defends - stay in own half
      switch (player.role) {
        case 'goalkeeper':
          setPosition(40, centerY)
          break
        case 'defender':
          if (player.number <= 2) {
            setPosition(150, player.number === 1 ? centerY - 50 : centerY + 50)
          } else {
            setPosition(120, centerY)
          }
          break
        case 'midfielder':
          setPosition(220, player.number === 3 ? centerY - 40 : centerY + 40)
          break
        case 'striker':
          setPosition(centerX - 40, centerY) // Stay back from center
          break
      }
    }
  } else {
    // Away team
    if (isKickingOff) {
      // Away team kicks off - proper kickoff formation
      switch (player.role) {
        case 'goalkeeper':
          setPosition(fieldWidth - 40, centerY)
          break
        case 'defender':
          if (player.number <= 7) {
            setPosition(fieldWidth - 120, player.number === 6 ? centerY - 60 : centerY + 60)
          } else {
            setPosition(fieldWidth - 100, centerY)
          }
          break
        case 'midfielder':
          if (player.number === 8) {
            setPosition(centerX + 30, centerY + 5) // Just behind center, offset from striker
          } else {
            setPosition(fieldWidth - 240, centerY)
          }
          break
        case 'striker':
          setPosition(centerX - 5, centerY) // Just behind ball for kickoff
          break
      }
    } else {
      // Away team defends - stay in own half
      switch (player.role) {
        case 'goalkeeper':
          setPosition(fieldWidth - 40, centerY)
          break
        case 'defender':
          if (player.number <= 7) {
            setPosition(fieldWidth - 150, player.number === 6 ? centerY - 50 : centerY + 50)
          } else {
            setPosition(fieldWidth - 120, centerY)
          }
          break
        case 'midfielder':
          setPosition(fieldWidth - 220, player.number === 8 ? centerY - 40 : centerY + 40)
          break
        case 'striker':
          setPosition(centerX + 40, centerY) // Stay back from center
          break
      }
    }
  }
  
  // Update target positions
  player.targetX = player.x
  player.targetY = player.y
  
  // Clear any movement
  player.vx = 0
  player.vy = 0
  
  // Clear restart movement flags
  player.isMovingToRestart = false
  player.restartTarget = undefined
  player.restartRole = undefined
}

// Sound functions
const playKickSound = () => playAudioFile('/audio/ball_kick_hit.mp3', 0.3)
const playGoalSound = () => playAudioFile('/audio/sim/end-game.mp3', 0.6)
const playWhistleSound = () => {
  // Play kickoff whistle sound
  playAudioFile('/audio/sim/kick-off.mp3', 0.6)
}
const playFoulSound = () => playAudioFile('/audio/sim/foul.mp3', 0.4)

// Get strategy label
const getStrategyLabel = (value: number): string => {
  const labels = [
    'Ultra Defensive',
    'Defensive', 
    'Cautious',
    'Slightly Defensive',
    'Balanced',
    'Slightly Attacking',
    'Aggressive',
    'Attacking',
    'Ultra Attacking'
  ]
  return labels[value] || 'Balanced'
}

// Update fouls enablement
const updateFoulsEnabled = (enabled: boolean) => {
  // This would update the engine if it supported it
  console.log('Fouls enabled:', enabled)
}

// Update AI difficulty  
const updateAIDifficulty = (difficulty: number) => {
  // This would update the engine if it supported it
  console.log('AI difficulty:', difficulty)
}

// UI state
const showStats = ref(false)
const selectedHomePlayer = ref<Player | null>(null)
const selectedAwayPlayer = ref<Player | null>(null)
const showTeamStats = ref(false)
const selectedTeam = ref<'home' | 'away'>('home')

// Game loop
const gameLoop = (currentTime: number) => {
  if (!gameEngine) return
  
  const deltaTime = currentTime - lastTime
  lastTime = currentTime
  
  gameEngine.update(currentTime)
  updateGameState()
  
  render()
  
  // Check for achievements
  checkAchievements()
  
  if (isPlaying.value) {
    animationId = requestAnimationFrame(gameLoop)
  }
}

// Game controls
const togglePlay = () => {
  if (!gameEngine) return
  
  if (isPlaying.value) {
    gameEngine.pause()
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  } else {
    gameEngine.play()
    lastTime = performance.now()
    animationId = requestAnimationFrame(gameLoop)
  }
  updateGameState()
}

const resetGame = () => {
  if (!gameEngine) return
  
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  
  // Reset coin flip modal state
  gameStarted.value = false
  showCoinFlipModal.value = true
  playerChoice.value = null
  coinFlipping.value = false
  coinResult.value = null
  kickoffTeam.value = null
  playerWon.value = false
  
  // Reset achievements
  recentAchievements.value = []
  achievements.value.forEach(achievement => {
    achievement.unlocked = false
    achievement.timestamp = undefined
    achievement.player = undefined
    achievement.team = undefined
  })
  
  gameEngine.reset()
  updateGameState()
  render()
}

// Canvas event handlers
const handleCanvasClick = (event: MouseEvent) => {
  if (!canvas.value) return
  
  const rect = canvas.value.getBoundingClientRect()
  const x = event.clientX - rect.left - 50
  const y = event.clientY - rect.top - 50
  
  // Check if clicked on a player
  let clickedPlayer: Player | null = null
  players.value.forEach(player => {
    const dist = Math.hypot(player.x - x, player.y - y)
    if (dist < player.radius) {
      clickedPlayer = player
    }
  })
  
  if (clickedPlayer) {
    if (clickedPlayer.team === 'home') {
      selectedHomePlayer.value = selectedHomePlayer.value?.number === clickedPlayer.number ? null : clickedPlayer
      if (selectedHomePlayer.value) {
        drawSinglePlayerChart()
      }
    } else {
      selectedAwayPlayer.value = selectedAwayPlayer.value?.number === clickedPlayer.number ? null : clickedPlayer
    }
  }
}

const handleCanvasHover = (event: MouseEvent) => {
  if (!canvas.value) return
  
  const rect = canvas.value.getBoundingClientRect()
  const x = event.clientX - rect.left - 50
  const y = event.clientY - rect.top - 50
  
  hoveredPlayer.value = null
  players.value.forEach(player => {
    const dist = Math.hypot(player.x - x, player.y - y)
    if (dist < player.radius) {
      hoveredPlayer.value = player
    }
  })
  
  canvas.value.style.cursor = hoveredPlayer.value ? 'pointer' : 'default'
}

const handleCanvasLeave = () => {
  hoveredPlayer.value = null
  if (canvas.value) {
    canvas.value.style.cursor = 'default'
  }
}

// Rendering
const render = () => {
  if (!canvas.value || !gameEngine) return
  
  const ctx = canvas.value.getContext('2d')
  if (!ctx) return
  
  // Clear canvas
  ctx.clearRect(0, 0, 700, 500)
  
  // Draw field
  drawField(ctx)
  
  // Draw players
  players.value.forEach(player => {
    drawPlayer(ctx, player)
  })
  
  // Draw ball
  if (ball.value) {
    drawBall(ctx, ball.value)
  }
}

const drawField = (ctx: CanvasRenderingContext2D) => {
  const fieldX = 50
  const fieldY = 50
  const fieldWidth = 600
  const fieldHeight = 400
  
  // Dark green field
  ctx.fillStyle = '#2d5a2d'
  ctx.fillRect(fieldX, fieldY, fieldWidth, fieldHeight)
  
  // Lighter stripes
  ctx.fillStyle = '#357a35'
  for (let i = 0; i < 12; i += 2) {
    ctx.fillRect(fieldX + i * 50, fieldY, 50, fieldHeight)
  }
  
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
  
  // Center spot
  ctx.beginPath()
  ctx.arc(fieldX + fieldWidth/2, fieldY + fieldHeight/2, 3, 0, Math.PI * 2)
  ctx.fillStyle = 'white'
  ctx.fill()
  
  // Penalty areas
  const penaltyWidth = 200
  const penaltyDepth = 100
  
  // Home penalty area
  ctx.strokeRect(fieldX, fieldY + fieldHeight/2 - penaltyWidth/2, penaltyDepth, penaltyWidth)
  
  // Away penalty area
  ctx.strokeRect(fieldX + fieldWidth - penaltyDepth, fieldY + fieldHeight/2 - penaltyWidth/2, penaltyDepth, penaltyWidth)
  
  // Penalty spots
  ctx.beginPath()
  ctx.arc(fieldX + 70, fieldY + fieldHeight/2, 3, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.beginPath()
  ctx.arc(fieldX + fieldWidth - 70, fieldY + fieldHeight/2, 3, 0, Math.PI * 2)
  ctx.fill()
  
  // Goals
  const goalWidth = 120
  const goalDepth = 40
  
  // Home goal
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.fillRect(fieldX - goalDepth, fieldY + fieldHeight/2 - goalWidth/2, goalDepth, goalWidth)
  ctx.strokeStyle = 'white'
  ctx.strokeRect(fieldX - goalDepth, fieldY + fieldHeight/2 - goalWidth/2, goalDepth, goalWidth)
  
  // Away goal
  ctx.fillRect(fieldX + fieldWidth, fieldY + fieldHeight/2 - goalWidth/2, goalDepth, goalWidth)
  ctx.strokeRect(fieldX + fieldWidth, fieldY + fieldHeight/2 - goalWidth/2, goalDepth, goalWidth)
  
  // Corner arcs
  ctx.beginPath()
  ctx.arc(fieldX, fieldY, 10, 0, Math.PI/2)
  ctx.stroke()
  
  ctx.beginPath()
  ctx.arc(fieldX + fieldWidth, fieldY, 10, Math.PI/2, Math.PI)
  ctx.stroke()
  
  ctx.beginPath()
  ctx.arc(fieldX, fieldY + fieldHeight, 10, -Math.PI/2, 0)
  ctx.stroke()
  
  ctx.beginPath()
  ctx.arc(fieldX + fieldWidth, fieldY + fieldHeight, 10, Math.PI, -Math.PI/2)
  ctx.stroke()
}

const drawPlayer = (ctx: CanvasRenderingContext2D, player: Player) => {
  const x = player.x + 50
  const y = player.y + 50
  
  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.beginPath()
  ctx.ellipse(x, y + 12, player.radius * 0.8, player.radius * 0.3, 0, 0, Math.PI * 2)
  ctx.fill()
  
  // Highlight if selected or hovered
  if ((selectedHomePlayer.value?.number === player.number && player.team === 'home') ||
      (selectedAwayPlayer.value?.number === player.number && player.team === 'away') ||
      hoveredPlayer.value?.number === player.number) {
    ctx.strokeStyle = hoveredPlayer.value?.number === player.number ? 'yellow' : 'white'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(x, y, player.radius + 5, 0, Math.PI * 2)
    ctx.stroke()
  }
  
  // Player body
  const gradient = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, player.radius)
  if (player.team === 'home') {
    gradient.addColorStop(0, '#4a90e2')
    gradient.addColorStop(0.7, '#357abd')
    gradient.addColorStop(1, '#2968a3')
  } else {
    gradient.addColorStop(0, '#e74c3c')
    gradient.addColorStop(0.7, '#d62c1a')
    gradient.addColorStop(1, '#c0392b')
  }
  
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, player.radius, 0, Math.PI * 2)
  ctx.fill()
  
  // Darker edge
  ctx.strokeStyle = player.team === 'home' ? '#1e4d8a' : '#8b1a1a'
  ctx.lineWidth = 1
  ctx.stroke()
  
  // Stamina indicator
  if (player.stamina < player.maxStamina * 0.5) {
    ctx.strokeStyle = player.stamina < player.maxStamina * 0.25 ? '#ff4444' : '#ffaa44'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, player.radius + 3, -Math.PI/2, -Math.PI/2 + (player.stamina / player.maxStamina) * Math.PI * 2)
    ctx.stroke()
  }
  
  // Player number
  ctx.fillStyle = 'white'
  ctx.font = 'bold 12px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(player.number.toString(), x, y)
  
  // Role indicator for goalkeepers
  if (player.role === 'goalkeeper') {
    ctx.font = 'bold 8px Arial'
    ctx.fillText('GK', x, y + player.radius + 10)
  }
  
  // Yellow card indicator
  if (player.yellowCards > 0) {
    ctx.fillStyle = player.yellowCards >= 2 ? '#ff0000' : '#ffff00'
    ctx.fillRect(x + player.radius - 5, y - player.radius - 5, 10, 12)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1
    ctx.strokeRect(x + player.radius - 5, y - player.radius - 5, 10, 12)
  }
  
  // Movement indicator during restarts
  if (player.isMovingToRestart && player.restartTarget) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(player.restartTarget.x + 50, player.restartTarget.y + 50)
    ctx.stroke()
    ctx.setLineDash([])
  }
}

const drawBall = (ctx: CanvasRenderingContext2D, ball: Ball) => {
  const x = ball.x + 50
  const y = ball.y + 50
  
  // Shadow based on height
  const shadowScale = 1 - (ball.z || 0) / 100
  ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * shadowScale})`
  ctx.beginPath()
  ctx.ellipse(x, y + 10 + (ball.z || 0) * 0.5, ball.radius * shadowScale, ball.radius * 0.3 * shadowScale, 0, 0, Math.PI * 2)
  ctx.fill()
  
  // Ball at height
  const ballY = y - (ball.z || 0) * 0.5
  
  // Ball gradient
  const gradient = ctx.createRadialGradient(x - 2, ballY - 2, 0, x, ballY, ball.radius)
  gradient.addColorStop(0, '#ffffff')
  gradient.addColorStop(0.3, '#f0f0f0')
  gradient.addColorStop(0.6, '#e0e0e0')
  gradient.addColorStop(1, '#cccccc')
  
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, ballY, ball.radius, 0, Math.PI * 2)
  ctx.fill()
  
  // Ball pattern (simple pentagon)
  ctx.strokeStyle = '#999'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2 / 5) - Math.PI / 2
    const px = x + Math.cos(angle) * (ball.radius * 0.6)
    const py = ballY + Math.sin(angle) * (ball.radius * 0.6)
    if (i === 0) {
      ctx.moveTo(px, py)
    } else {
      ctx.lineTo(px, py)
    }
  }
  ctx.closePath()
  ctx.stroke()
  
  // Ball spin indicator
  if (ball.spin && (Math.abs(ball.spin.x) > 0.1 || Math.abs(ball.spin.y) > 0.1)) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, ballY, ball.radius + 2, 0, Math.PI * 2)
    ctx.setLineDash([3, 3])
    ctx.stroke()
    ctx.setLineDash([])
  }
}

// Helper functions
const getDisplayAttributes = (attributes: PlayerAttributes) => {
  return {
    pace: attributes.pace,
    shooting: attributes.finishing,
    passing: attributes.passing,
    dribbling: attributes.dribbling,
    defending: attributes.tackling,
    physical: attributes.strength
  }
}

const formatAttributeName = (key: string): string => {
  return key.charAt(0).toUpperCase() + key.slice(1)
}

// Team stats
const teamAverages = computed(() => {
  const team = players.value.filter(p => p.team === selectedTeam.value)
  if (team.length === 0) return {}
  
  const attrs = ['pace', 'passing', 'dribbling', 'finishing', 'tackling', 'strength']
  const averages: Record<string, number> = {}
  
  attrs.forEach(attr => {
    const sum = team.reduce((acc, player) => acc + (player.attributes[attr as keyof PlayerAttributes] || 0), 0)
    averages[attr] = sum / team.length
  })
  
  return averages
})

// Draw spider chart for single player
const drawSinglePlayerChart = () => {
  if (!singlePlayerChart.value || !selectedHomePlayer.value) return
  
  const ctx = singlePlayerChart.value.getContext('2d')
  if (!ctx) return
  
  const centerX = 125
  const centerY = 125
  const radius = 80
  
  // Clear canvas
  ctx.clearRect(0, 0, 250, 250)
  
  // Attributes to display
  const attributes = [
    { key: 'pace', label: 'PAC' },
    { key: 'finishing', label: 'SHO' },
    { key: 'passing', label: 'PAS' },
    { key: 'dribbling', label: 'DRI' },
    { key: 'tackling', label: 'DEF' },
    { key: 'strength', label: 'PHY' }
  ]
  
  // Draw grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.lineWidth = 1
  
  for (let i = 1; i <= 5; i++) {
    ctx.beginPath()
    for (let j = 0; j < attributes.length; j++) {
      const angle = (j * Math.PI * 2 / attributes.length) - Math.PI / 2
      const x = centerX + Math.cos(angle) * (radius * i / 5)
      const y = centerY + Math.sin(angle) * (radius * i / 5)
      if (j === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()
  }
  
  // Draw axes
  attributes.forEach((attr, i) => {
    const angle = (i * Math.PI * 2 / attributes.length) - Math.PI / 2
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius)
    ctx.stroke()
    
    // Labels
    ctx.fillStyle = 'white'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const labelX = centerX + Math.cos(angle) * (radius + 20)
    const labelY = centerY + Math.sin(angle) * (radius + 20)
    ctx.fillText(attr.label, labelX, labelY)
  })
  
  // Draw player stats
  ctx.fillStyle = 'rgba(66, 165, 245, 0.3)'
  ctx.strokeStyle = '#42a5f5'
  ctx.lineWidth = 2
  
  ctx.beginPath()
  attributes.forEach((attr, i) => {
    const value = selectedHomePlayer.value.attributes[attr.key as keyof PlayerAttributes] || 0
    const angle = (i * Math.PI * 2 / attributes.length) - Math.PI / 2
    const distance = (value / 99) * radius
    const x = centerX + Math.cos(angle) * distance
    const y = centerY + Math.sin(angle) * distance
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
}

// Achievement checking
const checkAchievements = () => {
  if (!gameEngine) return
  
  const state = gameEngine.getGameState()
  const stats = gameEngine.getStatistics()
  
  // First goal
  if (!achievements.value[0].unlocked && (state.homeScore > 0 || state.awayScore > 0)) {
    unlockAchievement('first-goal')
  }
  
  // Quick goal (within 30 seconds)
  if (!achievements.value[6].unlocked && state.gameTime > 1170000 && (state.homeScore > 0 || state.awayScore > 0)) {
    unlockAchievement('quick-goal')
  }
  
  // Hat trick
  const goals = stats?.goals || []
  const scorerCounts: Record<string, number> = {}
  goals.forEach(goal => {
    if (goal.scorer) {
      scorerCounts[goal.scorer] = (scorerCounts[goal.scorer] || 0) + 1
      if (scorerCounts[goal.scorer] >= 3 && !achievements.value[1].unlocked) {
        unlockAchievement('hat-trick', goal.scorer, goal.team)
      }
    }
  })
  
  // Possession
  const possession = stats?.possessionPercentage
  if (possession && !achievements.value[7].unlocked) {
    if (possession.home > 70 || possession.away > 70) {
      unlockAchievement('possession')
    }
  }
}

const unlockAchievement = (id: string, player?: string, team?: string) => {
  const achievement = achievements.value.find(a => a.id === id)
  if (achievement && !achievement.unlocked) {
    achievement.unlocked = true
    achievement.timestamp = Date.now()
    achievement.player = player
    achievement.team = team
    
    // Add to recent achievements for display
    recentAchievements.value.push({
      ...achievement,
      timestamp: Date.now()
    })
    
    // Remove after 5 seconds
    setTimeout(() => {
      recentAchievements.value = recentAchievements.value.filter(a => 
        a.timestamp !== achievement.timestamp
      )
    }, 5000)
    
    // Play achievement sound
    playGoalSound()
  }
}

// Initialize on mount
onMounted(() => {
  initializeGameEngine()
  lastTime = performance.now()
  animationId = requestAnimationFrame(gameLoop)
})

// Cleanup
onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})

// Watch for formation/tactic changes
watch([homeFormation, awayFormation, homeTactic, awayTactic], () => {
  if (gameEngine && !gameState.value?.isPlaying) {
    gameEngine.updateConfig({
      homeFormation: homeFormation.value,
      awayFormation: awayFormation.value,
      homeTactic: homeTactic.value,
      awayTactic: awayTactic.value
    })
    render()
  }
})
</script>

<style scoped>
.sim-2d-container {
  background-color: #1a1a1a;
  color: white;
  padding: 20px;
  min-height: 100vh;
  font-family: Arial, sans-serif;
}

.game-header {
  margin-bottom: 20px;
}

.score-board {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #2a2a2a;
  padding: 15px 30px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.team-score {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.team-score.home .score {
  color: #4a90e2;
}

.team-score.away .score {
  color: #e74c3c;
}

.team-name {
  font-size: 14px;
  color: #999;
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.score {
  font-size: 48px;
  font-weight: bold;
  line-height: 1;
}

.timer {
  text-align: center;
}

.time {
  font-size: 32px;
  font-weight: bold;
  color: #fff;
}

.game-status {
  font-size: 18px;
  color: #ffd700;
  margin-top: 10px;
  font-weight: bold;
  text-transform: uppercase;
}

.game-canvas {
  display: block;
  margin: 0 auto 20px;
  border: 2px solid #333;
  border-radius: 10px;
  background-color: #000;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
}

.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.control-btn {
  padding: 10px 24px;
  font-size: 16px;
  font-weight: bold;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.control-btn:hover:not(:disabled) {
  background-color: #357abd;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(74, 144, 226, 0.3);
}

.control-btn:disabled {
  background-color: #555;
  cursor: not-allowed;
  opacity: 0.6;
}

.sound-toggle label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
}

.sound-toggle input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.speed-control label {
  font-size: 14px;
  font-weight: bold;
}

.speed-control input[type="range"] {
  width: 120px;
}

.team-settings {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.team-config {
  background-color: #2a2a2a;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.team-config h3 {
  margin-bottom: 15px;
  font-size: 18px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.home-team h3 {
  color: #4a90e2;
}

.away-team h3 {
  color: #e74c3c;
}

.config-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 10px;
}

.config-row label {
  flex: 0 0 80px;
  font-size: 14px;
  color: #ccc;
}

.config-row select,
.config-row input[type="range"] {
  flex: 1;
  background-color: #1a1a1a;
  color: white;
  border: 1px solid #444;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 14px;
}

.config-row select:focus {
  outline: none;
  border-color: #4a90e2;
}

.strategy-label {
  flex: 0 0 120px;
  font-size: 12px;
  color: #999;
  text-align: right;
}

/* Engine controls */
.engine-controls {
  background-color: #2a2a2a;
  padding: 20px;
  border-radius: 10px;
  margin: 20px 0;
}

.engine-controls h3 {
  margin-bottom: 15px;
  color: #4a90e2;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #444;
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-label {
  font-weight: bold;
  color: #ccc;
}

.stat-value {
  color: #fff;
}

.card-indicator {
  display: inline-block;
  padding: 2px 8px;
  margin: 0 4px;
  border-radius: 3px;
  font-size: 12px;
}

.card-indicator.yellow {
  background-color: #ffeb3b;
  color: #000;
}

.card-indicator.red {
  background-color: #f44336;
  color: #fff;
}

.no-cards {
  color: #666;
  font-style: italic;
}

/* Player display */
.player-display {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin: 20px 0;
}

.player-stats-container {
  background-color: #2a2a2a;
  padding: 20px;
  border-radius: 10px;
}

.player-stats-container h3 {
  margin-bottom: 15px;
  color: #4a90e2;
}

.attributes-grid {
  display: grid;
  gap: 8px;
  margin-bottom: 20px;
}

.attribute {
  display: flex;
  align-items: center;
  gap: 10px;
}

.attr-name {
  flex: 0 0 100px;
  font-size: 12px;
  color: #ccc;
}

.attr-bar {
  flex: 1;
  height: 8px;
  background-color: #444;
  border-radius: 4px;
  overflow: hidden;
}

.attr-fill {
  height: 100%;
  background-color: #4a90e2;
  transition: width 0.3s;
}

.attr-fill.away {
  background-color: #e74c3c;
}

.attr-value {
  flex: 0 0 30px;
  text-align: right;
  font-size: 12px;
  font-weight: bold;
}

.spider-chart {
  display: block;
  margin: 0 auto;
}

/* Team stats display */
.team-stats-display {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #2a2a2a;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
  z-index: 1000;
}

.team-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  justify-content: center;
}

.team-selector button {
  padding: 8px 20px;
  background-color: #444;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.team-selector button.active {
  background-color: #4a90e2;
}

.average-stats {
  margin-top: 20px;
}

.average-stats h4 {
  margin-bottom: 10px;
  color: #4a90e2;
}

/* Coin flip modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.coin-flip-modal {
  background-color: #2a2a2a;
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  min-width: 400px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.coin-flip-modal h2 {
  margin-bottom: 30px;
  font-size: 32px;
  color: #4a90e2;
}

.choice-phase p {
  font-size: 20px;
  margin-bottom: 30px;
  color: #ccc;
}

.coin-choices {
  display: flex;
  gap: 30px;
  justify-content: center;
}

.choice-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 40px;
  background-color: #444;
  border: 3px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.choice-button:hover {
  background-color: #555;
  border-color: #4a90e2;
  transform: translateY(-5px);
}

.coin-icon {
  font-size: 48px;
}

.flipping-phase p {
  font-size: 18px;
  margin: 20px 0;
  color: #ccc;
}

.coin-animation {
  margin: 30px 0;
}

.spinning-coin {
  font-size: 80px;
  animation: coinFlip 2s ease-in-out infinite;
}

.result-phase p {
  font-size: 18px;
  margin: 15px 0;
  color: #ccc;
}

.coin-result {
  margin: 30px 0;
}

.coin-face {
  font-size: 80px;
  animation: coinBounce 0.5s ease-out;
}

.result-text {
  margin: 30px 0;
}

.win-text {
  color: #4caf50;
  font-size: 24px;
  font-weight: bold;
}

.lose-text {
  color: #f44336;
  font-size: 24px;
  font-weight: bold;
}

.start-button {
  padding: 15px 40px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.start-button:hover {
  background-color: #357abd;
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(74, 144, 226, 0.4);
}

/* Animations */
@keyframes coinFlip {
  0%, 100% { transform: rotateY(0deg); }
  50% { transform: rotateY(180deg); }
}

@keyframes coinBounce {
  0% { transform: scale(0) rotate(0deg); }
  50% { transform: scale(1.2) rotate(180deg); }
  100% { transform: scale(1) rotate(360deg); }
}

/* Achievement notifications */
.achievement-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1500;
}

.achievement-notification {
  background-color: #2a2a2a;
  border: 2px solid #4a90e2;
  border-radius: 10px;
  padding: 15px 20px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 15px;
  min-width: 300px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
}

.achievement-icon {
  font-size: 32px;
}

.achievement-title {
  font-weight: bold;
  font-size: 16px;
  color: #4a90e2;
  margin-bottom: 4px;
}

.achievement-desc {
  font-size: 14px;
  color: #ccc;
}

/* Achievement animations */
.achievement-enter-active {
  transition: all 0.5s ease-out;
}

.achievement-leave-active {
  transition: all 0.3s ease-in;
}

.achievement-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.achievement-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.achievement-move {
  transition: transform 0.3s;
}
</style>