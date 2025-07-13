<template>
  <div class="sim-2d-container">
    <div class="game-header">
      <div class="score-board">
        <div class="team-score home">
          <img src="/sim/team-left.png" alt="Home Team" class="team-logo-small" />
          <span class="score">{{ homeScore }}</span>
        </div>
        <div class="vs-section">
          <div class="timer">
            <span class="time">{{ formattedTime }}</span>
            <div v-if="gameOver" class="game-status">{{ gameStatus }}</div>
          </div>
          <span class="vs-text">VS</span>
        </div>
        <div class="team-score away">
          <span class="score">{{ awayScore }}</span>
          <img src="/sim/team-right.png" alt="Away Team" class="team-logo-small" />
        </div>
      </div>

      <!-- Coin Flip Modal -->
      <div v-if="showCoinFlipModal" class="modal-overlay">
        <div class="coin-flip-modal">
          <h2>⚽ Kickoff Toss</h2>
          
          <div v-if="!playerChoice" class="choice-phase">
            <p>Choose your call:</p>
            <div class="coin-choices">
              <GameButton
                @click="makeChoice('Heads')"
                color="primary"
                label="Heads"
                prepend-icon="mdi-currency-usd"
                size="large"
                click-sound="coin"
                class="mx-2"
              />
              <GameButton
                @click="makeChoice('Tails')"
                color="secondary"
                label="Tails"
                prepend-icon="mdi-currency-usd"
                size="large"
                click-sound="coin"
                class="mx-2"
              />
            </div>
          </div>

          <div v-else-if="coinResult" class="result-phase">
            <p>You chose: <strong>{{ playerChoice }}</strong></p>
            <transition name="fade">
              <div class="coin-result" v-if="coinResult">
                <div class="coin-face">{{ coinResult }}</div>
              </div>
            </transition>
            <transition name="fade-delay">
              <div class="result-text" v-if="coinResult">
                <p v-if="playerWon" class="win-text">✅ Correct! You win the toss!</p>
                <p v-else class="lose-text">❌ Wrong! Computer wins the toss!</p>
                <p><strong>{{ kickoffTeam }}</strong> team will kick off!</p>
              </div>
            </transition>
            <GameButton
              @click="proceedToStrategy"
              color="success"
              label="Continue"
              prepend-icon="mdi-arrow-right"
              size="large"
              click-sound="success"
              class="mt-4"
            />
          </div>
        </div>
      </div>
      
      <!-- Strategy Selection Modal -->
      <div v-if="showStrategyModal" class="modal-overlay">
        <div class="strategy-modal">
          <h2>⚽ Managers Plan</h2>
          <p class="strategy-intro">Select your team's strategy and formation</p>
          
          <div class="strategy-container">
            <!-- Home Team Strategy -->
            <div class="strategy-team home-strategy">
              <h3>My Team</h3>
              <div class="strategy-section">
                <label>Formation:</label>
                <select v-model="homeFormation" class="strategy-select">
                  <option value="1-2-1-1">1-2-1-1 (Balanced)</option>
                  <option value="1-1-2-1">1-1-2-1 (Midfield)</option>
                  <option value="1-3-1">1-3-1 (Defensive)</option>
                  <option value="1-2-2">1-2-2 (Attacking)</option>
                </select>
              </div>
              
              <div class="strategy-section">
                <label>Tactic:</label>
                <select v-model="homeTactic" class="strategy-select">
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
              
              <div class="strategy-section">
                <label>Playing Style:</label>
                <div class="strategy-slider">
                  <span>Defensive</span>
                  <input type="range" v-model="homeStrategy" min="0" max="8" step="1" />
                  <span>Attacking</span>
                </div>
                <div class="strategy-value">{{ getStrategyLabel(homeStrategy) }}</div>
              </div>
            </div>
          </div>
          
          <GameButton
            @click="startGame"
            color="success"
            label="Start Match"
            prepend-icon="mdi-play-circle"
            size="large"
            click-sound="success"
            class="mt-4"
          />
        </div>
      </div>
    </div>
    
    <div class="game-canvas-container">
      <canvas 
        ref="canvas" 
        class="game-canvas" 
        :width="700" 
        :height="500"
        @click="handleCanvasClick"
        @mousemove="handleCanvasHover"
        @mouseleave="handleCanvasLeave"
      />
      
      <!-- Team Avatars -->
      <div class="team-avatar home-avatar" @click="toggleManagerMenu">
        <div class="avatar-circle manager-clickable">
          <img src="/sim/demo-manger-left.png" alt="Home Manager" class="manager-image" />
        </div>
        
        <!-- Manager Menu Popover -->
        <transition name="popover">
          <div v-if="showManagerMenu" class="manager-menu">
            <div class="menu-item" @click.stop="managerAction('encourage')">
              <span class="menu-icon">💪</span>
              <span>Encourage Team</span>
            </div>
            <div class="menu-item" @click.stop="managerAction('belittle')">
              <span class="menu-icon">😤</span>
              <span>Belittle Team</span>
            </div>
            <div class="menu-item" @click.stop="managerAction('provoke')">
              <span class="menu-icon">🤬</span>
              <span>Provoke Manager</span>
            </div>
            <div class="menu-item" @click.stop="managerAction('swear')">
              <span class="menu-icon">🤯</span>
              <span>Swear at Ref</span>
            </div>
          </div>
        </transition>
      </div>
      
      <div class="team-avatar away-avatar">
        <div class="avatar-circle">
          <img src="/sim/demo-manger-right.png" alt="Away Manager" class="manager-image" />
        </div>
      </div>
      
      <!-- Manager Speech Bubble -->
      <transition name="speech-bubble">
        <div v-if="managerSpeech" class="manager-speech-bubble" :class="{ 'home-speech': managerSpeech.team === 'home' }">
          <div class="speech-content">{{ managerSpeech.text }}</div>
          <div class="speech-tail"></div>
        </div>
      </transition>
    </div>
    
    <div class="controls">
      <GameButton
        @click="togglePlay"
        :disabled="!gameStarted"
        color="primary"
        :label="isPlaying ? 'Pause' : 'Play'"
        :prepend-icon="isPlaying ? 'mdi-pause' : 'mdi-play'"
        click-sound="click"
        class="mr-2"
      />
      <GameButton
        @click="resetGame"
        color="error"
        label="Reset"
        prepend-icon="mdi-restart"
        click-sound="click"
        class="mr-4"
      />
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
    
    <!-- Stats and Activity Container -->
    <div class="stats-activity-container">
      <!-- Activity Stream (Left) -->
      <div class="activity-stream">
        <!-- My Team Configuration -->
        <div class="my-team-section">
          <div class="my-team-header">
            <h3>My Team</h3>
          </div>
          <div class="my-team-content">
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
        </div>
        
        <!-- Activity Feed -->
        <div class="activity-feed-section">
          <div class="activity-header">
            <h3>Activity Stream</h3>
          </div>
          <div class="activity-content">
            <div class="activity-list">
              <TransitionGroup name="activity">
                <div v-for="event in gameEvents" :key="event.id" class="activity-item" :class="event.type">
                  <span class="event-time">{{ formatEventTime(event.time) }}</span>
                  <span class="event-icon">{{ getEventIcon(event.type) }}</span>
                  <span class="event-text">{{ event.text }}</span>
                </div>
              </TransitionGroup>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Match Statistics (Right) -->
      <div class="engine-controls v1-controls">
        <div class="stats-header">
          <h3>Match Statistics</h3>
        </div>
        <div class="stats-content">
          <div class="stat-row">
          <span class="stat-label">Possession:</span>
          <span class="stat-value">
            <span class="possession-bar">
              <span class="possession-home" :style="{ width: possessionStats.home + '%' }">{{ possessionStats.home }}%</span>
              <span class="possession-away" :style="{ width: possessionStats.away + '%' }">{{ possessionStats.away }}%</span>
            </span>
          </span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Shots:</span>
          <span class="stat-value">Home {{ matchStats?.shots?.home || 0 }} - {{ matchStats?.shots?.away || 0 }} Away</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">On Target:</span>
          <span class="stat-value">Home {{ matchStats?.shotsOnTarget?.home || 0 }} - {{ matchStats?.shotsOnTarget?.away || 0 }} Away</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Pass Accuracy:</span>
          <span class="stat-value">Home {{ matchStats?.passCompletionRate?.home || 0 }}% - {{ matchStats?.passCompletionRate?.away || 0 }}% Away</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Fouls:</span>
          <span class="stat-value">{{ v1Stats.fouls }} ({{ v1Stats.advantages }} advantages)</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Free Kicks:</span>
          <span class="stat-value">{{ v1Stats.freeKicks }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Cards:</span>
          <span class="stat-value">
            <span v-for="(card, idx) in v1Stats.cards" :key="idx" class="card-indicator" :class="card.type">
              {{ card.player }} ({{ card.time }})
            </span>
            <span v-if="v1Stats.cards.length === 0" class="no-cards">No cards</span>
          </span>
        </div>
        </div>
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
          <GameButton
            @click="selectedTeam = 'home'"
            :color="selectedTeam === 'home' ? 'primary' : 'default'"
            label="Home Team"
            size="small"
            :variant="selectedTeam === 'home' ? '3d' : 'flat'"
            class="mr-2"
          />
          <GameButton
            @click="selectedTeam = 'away'"
            :color="selectedTeam === 'away' ? 'error' : 'default'"
            label="Away Team"
            size="small"
            :variant="selectedTeam === 'away' ? '3d' : 'flat'"
          />
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
import GameButton from '@/components/GameButton.vue'

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
const showStrategyModal = ref(false)
const showManagerMenu = ref(false)
const managerSpeech = ref<{ text: string; team: string } | null>(null)

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

// AI Manager state
const aiManagerLastAction = ref(0)
const AI_MANAGER_COOLDOWN = 10000 // 10 seconds between actions
const aiManagerMood = ref<'neutral' | 'happy' | 'angry' | 'frustrated'>('neutral')

// Manager speech options
const managerSpeeches = {
  encourage: [
    "Come on lads, we've got this!",
    "Keep pushing! You're doing great!",
    "That's the spirit! Keep it up!",
    "Brilliant work out there!",
    "Show them what we're made of!",
    "I believe in every one of you!",
    "This is our moment, seize it!",
    "Keep your heads up, we're stronger!",
    "Fantastic effort, keep going!",
    "You're making me proud out there!"
  ],
  belittle: [
    "Is that the best you can do?!",
    "My grandmother could play better!",
    "Wake up out there!",
    "You call that football?!",
    "Absolutely pathetic performance!",
    "I've seen better play in Sunday league!",
    "You're embarrassing the badge!",
    "What are you doing out there?!",
    "This is amateur hour!",
    "You're playing like children!"
  ],
  provoke: [
    "Your tactics are a joke!",
    "Go back to coaching school!",
    "Is that your game plan? Really?",
    "My team's destroying yours!",
    "You're out of your depth!",
    "Nice substitution... NOT!",
    "Your team looks tired already!",
    "Tactical masterclass? I think not!",
    "You should've stayed home!",
    "Amateur tactics, amateur results!"
  ],
  swear: [
    "That's never a foul, ref!",
    "Are you blind?!",
    "Absolute disgrace of a decision!",
    "You're having a laugh, ref!",
    "Open your eyes!",
    "That's a clear penalty!",
    "You're ruining the game!",
    "Shocking refereeing!",
    "Get some glasses, ref!",
    "Worst decision I've ever seen!"
  ]
}

// AI Manager speech options
const aiManagerSpeeches = {
  scored: [
    "YES! That's how we do it!",
    "Get in! Beautiful goal!",
    "That's what I'm talking about!",
    "Brilliant! Keep it up!",
    "Fantastic finish!"
  ],
  conceded: [
    "Wake up back there!",
    "What was that defending?!",
    "Concentrate! Focus!",
    "Absolutely shocking!",
    "Get your heads in the game!"
  ],
  winning: [
    "Keep the pressure on!",
    "Don't get complacent!",
    "Stay focused, lads!",
    "Control the game!",
    "Keep possession!"
  ],
  losing: [
    "We need to push harder!",
    "Get forward! Attack!",
    "We're running out of time!",
    "Show some passion!",
    "This is embarrassing!"
  ],
  foul_for: [
    "Good, break up their play!",
    "That's tactical!",
    "Well done, stop their momentum!",
    "Smart foul!",
    "Good decision!"
  ],
  foul_against: [
    "That's never a foul!",
    "Referee, are you serious?!",
    "Absolutely ridiculous!",
    "He dived! Clear dive!",
    "You're killing the game, ref!"
  ],
  miss: [
    "How did you miss that?!",
    "You have to score those!",
    "Unbelievable miss!",
    "My grandmother could've scored!",
    "Practice your finishing!"
  ],
  save: [
    "What a save! Unlucky!",
    "Great effort! Keep shooting!",
    "So close! Next time!",
    "Their keeper's having a blinder!",
    "Keep testing him!"
  ]
}

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

// Activity Stream
const gameEvents = ref<Array<{
  id: string
  time: number
  type: string
  text: string
}>>([])
let eventIdCounter = 0

// Game engine
let gameEngine: FutsalGameEngine
let animationId: number | null = null
let lastTime = 0
let lastEventCheck = 0

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

const matchStats = computed(() => {
  if (!gameEngine) return null
  return gameEngine.getStatistics()
})

const possessionStats = computed(() => {
  const stats = matchStats.value
  if (!stats?.possession) return { home: 50, away: 50 }
  return {
    home: Math.round(stats.possession.home),
    away: Math.round(stats.possession.away)
  }
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
  
  // Initialize audio on user interaction
  initAudio()
  
  // Immediate coin flip result - no animation
  const isHeads = Math.random() < 0.5
  coinResult.value = isHeads ? 'Heads' : 'Tails'
  playerWon.value = choice === coinResult.value
  kickoffTeam.value = playerWon.value ? 'Home' : 'Away'
  
  // Play whistle sound for result
  playWhistleSound()
  
  // Set kickoff formation immediately
  setKickoffFormation()
  // Force immediate visual update
  render()
}

const proceedToStrategy = () => {
  showCoinFlipModal.value = false
  showStrategyModal.value = true
}

const startGame = () => {
  showStrategyModal.value = false
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
  
  // Check for game events
  checkGameEvents()
  
  // AI Manager periodic behavior
  checkAIManagerBehavior()
  
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

// Manager functions
const toggleManagerMenu = () => {
  showManagerMenu.value = !showManagerMenu.value
}

const managerAction = (action: 'encourage' | 'belittle' | 'provoke' | 'swear') => {
  showManagerMenu.value = false
  
  // Get random speech from the action category
  const speeches = managerSpeeches[action]
  const randomSpeech = speeches[Math.floor(Math.random() * speeches.length)]
  
  // Show speech bubble
  managerSpeech.value = {
    text: randomSpeech,
    team: 'home'
  }
  
  // Add to activity stream
  addGameEvent({
    type: 'manager',
    text: `Manager: "${randomSpeech}"`
  })
  
  // Hide speech bubble after 3 seconds
  setTimeout(() => {
    managerSpeech.value = null
  }, 3000)
  
  // Play sound effect if enabled
  if (soundEnabled.value) {
    playWhistleSound()
  }
}

const aiManagerAction = (situation: keyof typeof aiManagerSpeeches) => {
  const currentTime = Date.now()
  
  // Check cooldown
  if (currentTime - aiManagerLastAction.value < AI_MANAGER_COOLDOWN) {
    return
  }
  
  // Get random speech for the situation
  const speeches = aiManagerSpeeches[situation]
  const randomSpeech = speeches[Math.floor(Math.random() * speeches.length)]
  
  // Show speech bubble
  managerSpeech.value = {
    text: randomSpeech,
    team: 'away'
  }
  
  // Add to activity stream
  addGameEvent({
    type: 'manager',
    text: `Away Manager: "${randomSpeech}"`
  })
  
  // Update last action time
  aiManagerLastAction.value = currentTime
  
  // Hide speech bubble after 3 seconds
  setTimeout(() => {
    if (managerSpeech.value?.team === 'away') {
      managerSpeech.value = null
    }
  }, 3000)
}

// Check AI Manager periodic behavior
const checkAIManagerBehavior = () => {
  if (!gameEngine || gameOver.value) return
  
  const currentTime = Date.now()
  
  // Check cooldown
  if (currentTime - aiManagerLastAction.value < AI_MANAGER_COOLDOWN) {
    return
  }
  
  // Random chance for periodic behavior (1% per frame when game is active)
  if (Math.random() < 0.01) {
    // Check game state
    if (awayScore.value > homeScore.value) {
      aiManagerAction('winning')
    } else if (awayScore.value < homeScore.value) {
      aiManagerAction('losing')
    }
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
  
  // Draw players (skip red-carded players)
  players.value.forEach(player => {
    if (!player.isSentOff) {
      drawPlayer(ctx, player)
    }
  })
  
  // Draw ball
  if (ball.value) {
    drawBall(ctx, ball.value)
  }
  
  // Draw free kick timer if active
  if (gameState.value) {
    drawFreeKickTimer(ctx)
  }
}

const drawField = (ctx: CanvasRenderingContext2D) => {
  const fieldX = 50
  const fieldY = 50
  const fieldWidth = 600
  const fieldHeight = 400
  
  // Dark green field with gradient
  const fieldGradient = ctx.createLinearGradient(fieldX, fieldY, fieldX, fieldY + fieldHeight)
  fieldGradient.addColorStop(0, '#2d5a2d')
  fieldGradient.addColorStop(0.5, '#357a35')
  fieldGradient.addColorStop(1, '#2d5a2d')
  ctx.fillStyle = fieldGradient
  ctx.fillRect(fieldX, fieldY, fieldWidth, fieldHeight)
  
  // Lighter stripes with subtle opacity
  ctx.fillStyle = 'rgba(53, 122, 53, 0.3)'
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
  
  // Player body with new theme colors
  const gradient = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, player.radius)
  if (player.team === 'home') {
    gradient.addColorStop(0, '#00d9ff')
    gradient.addColorStop(0.7, '#00b4d8')
    gradient.addColorStop(1, '#0077b6')
  } else {
    gradient.addColorStop(0, '#ff8787')
    gradient.addColorStop(0.7, '#ff6b6b')
    gradient.addColorStop(1, '#ff5252')
  }
  
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, player.radius, 0, Math.PI * 2)
  ctx.fill()
  
  // Darker edge with new colors
  ctx.strokeStyle = player.team === 'home' ? '#023e8a' : '#dc2626'
  ctx.lineWidth = 1
  ctx.stroke()
  
  // Shooting charge-up indicator
  if (player.isShootingChargeUp) {
    const chargeLevel = player.shootingChargeLevel || 0
    ctx.strokeStyle = '#00ff00'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(x, y, player.radius + 5, -Math.PI/2, -Math.PI/2 + chargeLevel * Math.PI * 2)
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

const drawFreeKickTimer = (ctx: CanvasRenderingContext2D) => {
  if (!gameState.value?.freeKickTimer || 
      !gameState.value?.freeKickTimerExpiry || 
      gameState.value?.restartType !== 'free-kick' ||
      !gameState.value?.ballOut) {
    return
  }
  
  const currentTime = Date.now()
  const timeRemaining = Math.max(0, gameState.value.freeKickTimerExpiry - currentTime)
  const secondsLeft = Math.ceil(timeRemaining / 1000)
  
  // Draw timer near the ball
  if (ball.value && secondsLeft > 0) {
    const x = ball.value.x + 50
    const y = ball.value.y + 50
    
    // Timer background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(x + 20, y - 40, 60, 30)
    
    // Timer text
    ctx.fillStyle = secondsLeft <= 1 ? '#ff6b6b' : '#ffffff'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${secondsLeft}s`, x + 50, y - 25)
    
    // Label
    ctx.font = '10px Arial'
    ctx.fillStyle = '#ffffff'
    ctx.fillText('FREE KICK', x + 50, y - 10)
  }
}

const drawBall = (ctx: CanvasRenderingContext2D, ball: Ball) => {
  const x = ball.x + 50
  const y = ball.y + 50
  
  // Simple shadow
  const shadowScale = 1 - (ball.z || 0) / 100
  ctx.fillStyle = `rgba(0, 0, 0, ${0.2 * shadowScale})`
  ctx.beginPath()
  ctx.ellipse(x, y + 8 + (ball.z || 0) * 0.3, ball.radius * 0.8 * shadowScale, ball.radius * 0.3 * shadowScale, 0, 0, Math.PI * 2)
  ctx.fill()
  
  // Ball at height
  const ballY = y - (ball.z || 0) * 0.5
  
  // Simple white ball
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(x, ballY, ball.radius, 0, Math.PI * 2)
  ctx.fill()
  
  // Black outline
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 1.5
  ctx.stroke()
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

// Activity stream functions
const addGameEvent = (type: string, text: string) => {
  const event = {
    id: `event-${eventIdCounter++}`,
    time: gameTime.value,
    type,
    text
  }
  
  gameEvents.value.unshift(event)
  
  // Keep only last 50 events
  if (gameEvents.value.length > 50) {
    gameEvents.value = gameEvents.value.slice(0, 50)
  }
}

const formatEventTime = (time: number): string => {
  const totalSeconds = Math.ceil(time / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}'`
}

const getEventIcon = (type: string): string => {
  const icons: Record<string, string> = {
    goal: '⚽',
    shot: '🥅',
    pass: '→',
    foul: '⚠️',
    yellow: '🟨',
    red: '🟥',
    freekick: '🦵',
    corner: '🏳️',
    kickin: '↩️',
    goalkick: '🥅',
    save: '🧤',
    tackle: '🦶',
    possession: '📊',
    restart: '🏁',
    whistle: '🎺'
  }
  return icons[type] || '•'
}

// Check for game events
const checkGameEvents = () => {
  if (!gameEngine) return
  
  const state = gameEngine.getGameState()
  const stats = gameEngine.getStatistics()
  
  // Check for goals
  const goals = stats?.goals || []
  if (goals.length > gameEvents.value.filter(e => e.type === 'goal').length) {
    const newGoal = goals[goals.length - 1]
    addGameEvent('goal', `GOAL! ${newGoal.scorer} scores for ${newGoal.team}!`)
    
    // AI Manager reaction to goal
    if (newGoal.team === 'away') {
      aiManagerAction('scored')
    } else {
      aiManagerAction('conceded')
    }
  }
  
  // Check for fouls
  const currentFouls = stats?.foulsCommitted?.home + stats?.foulsCommitted?.away || 0
  if (currentFouls > v1Stats.value.fouls) {
    addGameEvent('foul', 'Foul committed')
    
    // AI Manager reaction to fouls (50% chance to react)
    if (Math.random() < 0.5) {
      // Determine which team committed the foul based on the restart
      if (state.restartTeam === 'away') {
        aiManagerAction('foul_for')
      } else {
        aiManagerAction('foul_against')
      }
    }
  }
  
  // Check for free kicks
  if (state.restartType === 'free-kick' && !gameEvents.value.some(e => e.type === 'freekick' && Math.abs(e.time - gameTime.value) < 1000)) {
    addGameEvent('freekick', `Free kick awarded to ${state.restartTeam}`)
  }
  
  // Check for corners
  if (state.restartType === 'corner' && !gameEvents.value.some(e => e.type === 'corner' && Math.abs(e.time - gameTime.value) < 1000)) {
    addGameEvent('corner', `Corner kick for ${state.restartTeam}`)
  }
  
  // Check for kick-ins
  if (state.restartType === 'kick-in' && !gameEvents.value.some(e => e.type === 'kickin' && Math.abs(e.time - gameTime.value) < 1000)) {
    addGameEvent('kickin', `Kick-in for ${state.restartTeam}`)
  }
  
  // Check for goal kicks
  if (state.restartType === 'goal-kick' && !gameEvents.value.some(e => e.type === 'goalkick' && Math.abs(e.time - gameTime.value) < 1000)) {
    addGameEvent('goalkick', `Goal kick for ${state.restartTeam}`)
  }
  
  // Check for possession changes
  if (state.possession && state.possession !== lastPossession.value && lastPossession.value) {
    addGameEvent('possession', `${state.possession} team gains possession`)
  }
  lastPossession.value = state.possession
}

const lastPossession = ref<string | null>(null)

// Initialize on mount
onMounted(() => {
  initializeGameEngine()
  lastTime = performance.now()
  animationId = requestAnimationFrame(gameLoop)
  
  // Click outside handler for manager menu
  document.addEventListener('click', handleClickOutside)
})

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.home-avatar') && showManagerMenu.value) {
    showManagerMenu.value = false
  }
}

// Cleanup
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
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
  color: white;
  padding: 20px;
  padding-top: 0;
  margin-top: -20px;
  min-height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;

}

.game-header {
  margin-bottom: 20px;
}

.score-board {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  padding: 15px 30px;
  border-radius: 15px;
  margin-bottom: 20px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 120, 237, 0.3);
}

.team-score {
  display: flex;
  align-items: center;
  gap: 20px;
}

.team-logo-small {
  width: 65px;
  height: 65px;
  object-fit: cover;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.team-score.home .score {
  color: #00b4d8;
  text-shadow: 0 0 20px rgba(0, 180, 216, 0.5);
}

.team-score.away .score {
  color: #ff6b6b;
  text-shadow: 0 0 20px rgba(255, 107, 107, 0.5);
}

.team-name {
  font-size: 14px;
  color: #cbd5e1;
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: 600;
}

.score {
  font-size: 48px;
  font-weight: bold;
  line-height: 1;
}

.vs-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  flex: 1;
}

.timer {
  text-align: center;
}

.vs-text {
  font-size: 20px;
  font-weight: 800;
  color: #999;
  letter-spacing: 2px;
  text-transform: uppercase;
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
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.game-canvas-container {
  position: relative;
  display: flex;
  justify-content: center;
  margin: 0 auto 20px;
}

.game-canvas {
  display: block;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background-color: #000;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.6);
}

/* Team Avatars */
.team-avatar {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.home-avatar {
  bottom: -85px;
  left: 15px;
}

.away-avatar {
  bottom: -85px;
  right: 15px;
}

.avatar-circle {
  width: 94px;
  height: 94px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border: 3px solid rgba(255, 255, 255, 0.2);
}

.home-avatar .avatar-circle {
  background: linear-gradient(135deg, #0078ed 0%, #3366FF 100%);
}

.away-avatar .avatar-circle {
  background: linear-gradient(135deg, #FF8C42 0%, #E67E22 100%);
}

.avatar-text {
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.manager-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.managers-label {
  position: absolute;
  bottom: -65px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 16px;
  font-weight: 600;
  color: #ccc;
  text-transform: uppercase;
  letter-spacing: 1px;
  white-space: nowrap;
}

/* Team logos now integrated into scoreboard */

/* My Team Section in Activity Stream */
.my-team-section {
  border-bottom: 1px solid rgba(0, 120, 237, 0.3);
  padding-bottom: 20px;
  margin-bottom: 20px;
}

.my-team-header {
  padding: 15px 20px;
  border-bottom: 1px solid rgba(0, 120, 237, 0.3);
}

.my-team-header h3 {
  margin: 0;
  font-size: 16px;
  color: #3366FF;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.my-team-content {
  padding: 15px 20px;
}

.my-team-content .config-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.my-team-content .config-row:last-child {
  margin-bottom: 0;
}

.my-team-content label {
  flex: 0 0 80px;
  font-size: 12px;
  color: #999;
  font-weight: bold;
}

.my-team-content select {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  transition: all 0.2s;
}

.my-team-content select:focus {
  outline: none;
  border-color: #0078ed;
  box-shadow: 0 0 0 2px rgba(0, 120, 237, 0.3);
}

.my-team-content input[type="range"] {
  flex: 1;
}

.my-team-content .strategy-label {
  flex: 0 0 120px;
  font-size: 11px;
  color: #00b4d8;
  text-align: right;
  font-weight: 600;
}

/* Activity Feed Section */
.activity-feed-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Manager Clickable Avatar */
.manager-clickable {
  cursor: pointer;
  transition: transform 0.2s;
}

.manager-clickable:hover {
  transform: scale(1.1);
}

/* Manager Menu Popover */
.manager-menu {
  position: absolute;
  bottom: 85px;
  left: 0;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(0, 120, 237, 0.5);
  border-radius: 12px;
  padding: 8px;
  min-width: 180px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  color: white;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  font-size: 14px;
}

.menu-item:hover {
  background: rgba(0, 120, 237, 0.3);
}

.menu-icon {
  font-size: 18px;
}

/* Manager Speech Bubble */
.manager-speech-bubble {
  position: absolute;
  bottom: 0px;
  left: 80px;
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  padding: 12px 18px;
  border-radius: 18px;
  max-width: 250px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  font-size: 14px;
  font-weight: 500;
  z-index: 999;
}

.manager-speech-bubble.home-speech {
  left: 80px;
}

.manager-speech-bubble:not(.home-speech) {
  left: auto;
  right: 80px;
}

.manager-speech-bubble:not(.home-speech) .speech-tail {
  left: auto;
  right: 20px;
}

.speech-content {
  position: relative;
  z-index: 1;
}

.speech-tail {
  position: absolute;
  bottom: -8px;
  left: 20px;
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid rgba(255, 255, 255, 0.95);
}

/* Popover animation */
.popover-enter-active, .popover-leave-active {
  transition: all 0.2s ease;
}

.popover-enter-from, .popover-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Speech bubble animation */
.speech-bubble-enter-active, .speech-bubble-leave-active {
  transition: all 0.3s ease;
}

.speech-bubble-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.speech-bubble-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-bottom: 100px;
  flex-wrap: wrap;
}

.control-btn {
  padding: 12px 28px;
  font-size: 16px;
  font-weight: bold;
  background: linear-gradient(135deg, #00b4d8 0%, #0077b6 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 8px rgba(0, 119, 182, 0.3);
}

.control-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #0077b6 0%, #023e8a 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 119, 182, 0.4);
}

.control-btn:disabled {
  background: #334155;
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

/* Removed team-settings - now integrated into activity stream */

.team-config {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 120, 237, 0.3);
  width: 100%;
  max-width: 400px;
}

.team-config h3 {
  margin-bottom: 15px;
  font-size: 18px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.home-team h3 {
  color: #00b4d8;
}

.away-team h3 {
  color: #ff6b6b;
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
  background-color: rgba(0, 63, 237, 0.1);
  color: white;
  border: 1px solid rgba(0, 120, 237, 0.3);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.config-row select:focus {
  outline: none;
  border-color: #0078ed;
  box-shadow: 0 0 0 2px rgba(0, 120, 237, 0.3);
}

.strategy-label {
  flex: 0 0 120px;
  font-size: 12px;
  color: #999;
  text-align: right;
}

/* Engine controls */
.engine-controls {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  padding: 0;
  border-radius: 12px;
  margin: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(0, 120, 237, 0.3);
}

.stats-header {
  padding: 20px;
  border-bottom: 1px solid rgba(0, 120, 237, 0.3);
}
.stats-content {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}
.stats-header h3,
.engine-controls h3 {
  margin: 0;
  font-size: 18px;
  color: #00b4d8;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 120, 237, 0.2);
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

/* Possession bar */
.possession-bar {
  display: flex;
  width: 100%;
  height: 20px;
  background-color: #1a1a1a;
  border-radius: 10px;
  overflow: hidden;
}

.possession-home {
  background: linear-gradient(90deg, #0078ed 0%, #3366FF 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.possession-away {
  background: linear-gradient(90deg, #FF8C42 0%, #E67E22 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
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
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  min-width: 400px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 120, 237, 0.3);
}

.coin-flip-modal h2 {
  margin-bottom: 30px;
  font-size: 32px;
  color: #3366FF;
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
  animation: coinFadeIn 0.5s ease-out;
  opacity: 1;
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

/* Fade transitions for coin result */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.fade-delay-enter-active {
  transition: opacity 0.5s ease-out 0.3s, transform 0.5s ease-out 0.3s;
}
.fade-delay-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

/* Strategy Modal */
.strategy-modal {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  max-width: 900px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 120, 237, 0.3);
}

.strategy-modal h2 {
  margin-bottom: 15px;
  font-size: 32px;
  color: #3366FF;
}

.strategy-intro {
  font-size: 18px;
  color: #ccc;
  margin-bottom: 30px;
}

.strategy-container {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.strategy-team {
  background: rgba(0, 0, 0, 0.3);
  padding: 25px;
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: left;
  width: 100%;
  max-width: 400px;
}

.home-strategy {
  border-color: rgba(0, 120, 237, 0.3);
}

.away-strategy {
  border-color: rgba(255, 140, 66, 0.3);
}

.strategy-team h3 {
  margin-bottom: 20px;
  font-size: 20px;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.home-strategy h3 {
  color: #3366FF;
}

.away-strategy h3 {
  color: #FF8C42;
}

.strategy-section {
  margin-bottom: 20px;
}

.strategy-section label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #ccc;
  font-weight: 600;
}

.strategy-select {
  width: 100%;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.2s;
}

.strategy-select:focus {
  outline: none;
  border-color: #0078ed;
  box-shadow: 0 0 0 2px rgba(0, 120, 237, 0.3);
}

.strategy-slider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.strategy-slider span {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.strategy-slider input[type="range"] {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  opacity: 0.7;
  transition: opacity 0.2s;
  border-radius: 3px;
}

.strategy-slider input[type="range"]:hover {
  opacity: 1;
}

.strategy-slider input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  background: #0078ed;
  cursor: pointer;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.strategy-slider input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #0078ed;
  cursor: pointer;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.strategy-value {
  text-align: center;
  margin-top: 8px;
  font-size: 13px;
  color: #00b4d8;
  font-weight: 600;
}

@keyframes coinFadeIn {
  0% { 
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.05);
  }
  100% { 
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes achievementGlow {
  0% { 
    box-shadow: 0 8px 16px rgba(0, 180, 216, 0.3);
  }
  50% { 
    box-shadow: 0 8px 24px rgba(0, 180, 216, 0.5), 0 0 40px rgba(0, 180, 216, 0.3);
  }
  100% { 
    box-shadow: 0 8px 16px rgba(0, 180, 216, 0.3);
  }
}

/* Achievement notifications */
.achievement-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1500;
}

.achievement-notification {
  background: linear-gradient(135deg, rgba(0, 120, 237, 0.1) 0%, rgba(51, 102, 255, 0.1) 100%);
  backdrop-filter: blur(10px);
  border: 2px solid #0078ed;
  border-radius: 12px;
  padding: 16px 24px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 320px;
  box-shadow: 0 8px 16px rgba(0, 120, 237, 0.3);
  animation: achievementGlow 2s ease-in-out;
}

.achievement-icon {
  font-size: 32px;
}

.achievement-title {
  font-weight: bold;
  font-size: 16px;
  color: #3366FF;
  margin-bottom: 4px;
  text-shadow: 0 0 10px rgba(51, 102, 255, 0.3);
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

/* Stats and Activity Container */
.stats-activity-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin: 20px 0;
  align-items: stretch;
  height: 500px;
}

/* Activity Stream */
.activity-stream {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 120, 237, 0.3);
  height: 100%;
  display: flex;
  flex-direction: column;
}



.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(0, 120, 237, 0.3);
}

.activity-header h3 {
  margin: 0;
  font-size: 18px;
  color: #00b4d8;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
}


.activity-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  min-height: 0;
}

.activity-list {
  padding: 0;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  margin-bottom: 5px;
  background-color: #333;
  border-radius: 5px;
  font-size: 14px;
  transition: all 0.3s;
}

.activity-item:hover {
  background-color: #3a3a3a;
}

.event-time {
  color: #999;
  font-size: 12px;
  min-width: 30px;
}

.event-icon {
  font-size: 16px;
}

.event-text {
  flex: 1;
  color: #ddd;
}

/* Event type colors */
.activity-item.goal {
  background-color: #2e5a2e;
  border-left: 3px solid #4caf50;
}

.activity-item.foul {
  background-color: #5a3e2e;
  border-left: 3px solid #ff9800;
}

.activity-item.yellow {
  background-color: #5a5a2e;
  border-left: 3px solid #ffeb3b;
}

.activity-item.red {
  background-color: #5a2e2e;
  border-left: 3px solid #f44336;
}

.activity-item.freekick {
  background-color: #2e3e5a;
  border-left: 3px solid #2196f3;
}

.activity-item.corner {
  background-color: #3e2e5a;
  border-left: 3px solid #9c27b0;
}

/* Activity animations */
.activity-enter-active {
  transition: all 0.3s ease-out;
}

.activity-leave-active {
  transition: all 0.3s ease-in;
}

.activity-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.activity-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* Scrollbar styling */
.activity-content::-webkit-scrollbar {
  width: 6px;
}

.activity-content::-webkit-scrollbar-track {
  background: #1a1a1a;
}

.activity-content::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 3px;
}

.activity-content::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>