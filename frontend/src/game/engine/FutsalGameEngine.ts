// FlowAI removed - using original AI only

export interface PlayerAttributes {
  // Physical
  pace: number
  acceleration: number
  stamina: number
  strength: number
  jumpingReach: number
  agility: number
  balance: number
  // Mental
  anticipation: number
  decisions: number
  positioning: number
  composure: number
  concentration: number
  workRate: number
  determination: number
  teamwork: number
  vision: number
  // Technical
  passing: number
  technique: number
  dribbling: number
  firstTouch: number
  tackling: number
  marking: number
  finishing: number
  heading: number
  crossing: number
  freekick: number
  curve: number
  volleys: number
  penalties: number
  // Special
  offTheBall: number
}

export interface Player {
  x: number
  y: number
  vx: number
  vy: number
  facing: number // direction player is facing (radians)
  team: 'home' | 'away'
  role: 'goalkeeper' | 'defender' | 'midfielder' | 'striker'
  radius: number
  targetX?: number
  targetY?: number
  stamina: number
  maxStamina: number
  number: number
  name: string
  attributes: PlayerAttributes
  lastTouchTime?: number
  consecutiveTouches: number
  isSliding?: boolean
  slideEndTime?: number
  yellowCards: number
  isSentOff: boolean
  // Restart behavior
  isMovingToRestart?: boolean
  restartTarget?: { x: number; y: number }
  restartRole?: 'taker' | 'support' | 'normal'
  ballTouchTime?: number // Track how long player has had the ball
  restartCooldown?: number // Time when player can resume chasing ball after restart
}

export interface Ball {
  x: number
  y: number
  vx: number
  vy: number
  vz: number // vertical velocity for bounces
  z: number // height above ground
  spin: { x: number; y: number; z: number } // ball spin affects trajectory
  radius: number
  possessor?: Player | null
  lastKicker?: Player | null
  lastTouchTime?: number
  touchCount: number // for tracking consecutive touches
  // Enhanced 3D physics
  bounceCount: number // number of bounces since last touch
  airTime: number // time in air for realistic trajectories
  lastBounceTime?: number
  isStationary: boolean // for restart situations
  // Ball stuck detection
  lastMovementTime: number // last time ball had significant movement
  stuckCheckTimer: number // timer for stuck detection
  // Pass indicators
  passType?: 'ground' | 'air' | 'through'
  passDistance?: number
  isBackPass?: boolean
  isThroughBall?: boolean
  // Restart tracking
  restartTaker?: Player | null // Player who took the restart (cannot touch ball again until another player does)
}

export interface Goal {
  team: 'home' | 'away'
  scorer: string
  minute: number
  assistedBy?: string
}

export interface MatchStats {
  corners: { home: number; away: number }
  yellowCards: { home: number; away: number }
  redCards: { home: number; away: number }
  goals: Goal[]
  possessionPercentage: { home: number; away: number }
  passesAttempted: { home: number; away: number }
  passesCompleted: { home: number; away: number }
  passCompletionRate: { home: number; away: number }
  freeKicksAttempted: { home: number; away: number }
  freeKicksScored: { home: number; away: number }
}

export interface GameState {
  isPlaying: boolean
  gameTime: number
  halfTime: 1 | 2
  homeScore: number
  awayScore: number
  possession: 'home' | 'away' | null
  passCount: { home: number; away: number }
  shots: { home: number; away: number }
  shotsOnTarget: { home: number; away: number }
  fouls: { home: number; away: number }
  accumulatedFouls: { home: number; away: number } // futsal specific
  ballOut: boolean
  restartType: 'kick-in' | 'corner' | 'goal-kick' | 'free-kick' | 'penalty' | null
  restartTeam: 'home' | 'away' | null
  restartPosition: { x: number; y: number }
  gameOver: boolean
  gameSpeed: number
  lastFoulTime?: number
  advantage?: { team: 'home' | 'away'; startTime: number } | null
  matchStats: MatchStats
  lastGoal?: Goal
  goalCelebration?: { active: boolean; startTime: number }
}

export interface FormationLayout {
  role: 'goalkeeper' | 'defender' | 'midfielder' | 'striker'
  x: number
  y: number
}

export interface GameConfig {
  fieldWidth: number
  fieldHeight: number
  goalWidth: number
  goalDepth: number
  centerCircleRadius: number
  homeFormation: string
  awayFormation: string
  homeTactic: string
  awayTactic: string
  homeStrategy: number
  awayStrategy: number
  // Buffer zone around field where players can move but ball is out
  fieldBuffer?: number
}

export class FutsalGameEngine {
  private config: GameConfig
  private gameState: GameState
  private players: Player[] = []
  private ball: Ball
  private startTime: number | null = null
  private lastUpdateTime: number | null = null
  private foulsEnabled: boolean = true
  private ballStationaryTime: number = 0
  private lastBallPosition: { x: number; y: number } = { x: 0, y: 0 }
  private possessionTimer: { home: number; away: number; neutral: number } = { home: 0, away: 0, neutral: 0 }
  private freeKickStartTime: number | null = null
  // FlowAI removed - using original AI only
  
  // Pass tracking
  private lastPassTarget: Player | null = null
  private lastPassTime: number | null = null
  private lastFreeKickTaker: Player | null = null

  constructor(config: GameConfig) {
    this.config = config
    this.gameState = {
      isPlaying: false,
      gameTime: 90000, // 90 seconds in milliseconds
      halfTime: 1,
      homeScore: 0,
      awayScore: 0,
      possession: null,
      passCount: { home: 0, away: 0 },
      shots: { home: 0, away: 0 },
      shotsOnTarget: { home: 0, away: 0 },
      fouls: { home: 0, away: 0 },
      accumulatedFouls: { home: 0, away: 0 },
      ballOut: false,
      restartType: null,
      restartTeam: null,
      restartPosition: { x: 0, y: 0 },
      gameOver: false,
      gameSpeed: 1,
      advantage: null,
      matchStats: {
        corners: { home: 0, away: 0 },
        yellowCards: { home: 0, away: 0 },
        redCards: { home: 0, away: 0 },
        goals: [],
        possessionPercentage: { home: 50, away: 50 },
        passesAttempted: { home: 0, away: 0 },
        passesCompleted: { home: 0, away: 0 },
        passCompletionRate: { home: 0, away: 0 },
        freeKicksAttempted: { home: 0, away: 0 },
        freeKicksScored: { home: 0, away: 0 }
      }
    }
    
    this.ball = {
      x: config.fieldWidth / 2,
      y: config.fieldHeight / 2,
      vx: 0,
      vy: 0,
      vz: 0,
      z: 0,
      spin: { x: 0, y: 0, z: 0 },
      radius: 7, // 40% larger than original (5 * 1.4 = 7)
      possessor: null,
      lastKicker: null,
      touchCount: 0,
      bounceCount: 0,
      airTime: 0,
      isStationary: true,
      lastMovementTime: 0,
      stuckCheckTimer: 0
    }
    
    this.initializePlayers()
    
    // FlowAI removed - using original AI only
  }

  // Generate random attributes based on position
  generateAttributes(role: string): PlayerAttributes {
    const base = 50 + Math.random() * 30 // Base 50-80
    const variance = () => -10 + Math.random() * 20 // ±10 variance
    
    // Position-specific boosts
    type AttributeBoosts = {
      [key in keyof PlayerAttributes]?: number
    }
    
    const boosts: Record<string, AttributeBoosts> = {
      goalkeeper: { positioning: 15, concentration: 10, jumpingReach: 10, anticipation: 10 },
      defender: { strength: 10, tackling: 15, marking: 15, heading: 10, positioning: 10 },
      midfielder: { passing: 15, vision: 15, stamina: 10, workRate: 10, technique: 10 },
      striker: { finishing: 15, pace: 10, dribbling: 10, offTheBall: 15, composure: 10 }
    }
    
    const boost = boosts[role] || {}
    
    return {
      // Physical
      pace: Math.min(99, Math.max(1, base + variance() + (boost.pace || 0))),
      acceleration: Math.min(99, Math.max(1, base + variance())),
      stamina: Math.min(99, Math.max(1, base + variance() + (boost.stamina || 0))),
      strength: Math.min(99, Math.max(1, base + variance() + (boost.strength || 0))),
      jumpingReach: Math.min(99, Math.max(1, base + variance() + (boost.jumpingReach || 0))),
      agility: Math.min(99, Math.max(1, base + variance())),
      balance: Math.min(99, Math.max(1, base + variance())),
      // Mental
      anticipation: Math.min(99, Math.max(1, base + variance() + (boost.anticipation || 0))),
      decisions: Math.min(99, Math.max(1, base + variance())),
      positioning: Math.min(99, Math.max(1, base + variance() + (boost.positioning || 0))),
      composure: Math.min(99, Math.max(1, base + variance() + (boost.composure || 0))),
      concentration: Math.min(99, Math.max(1, base + variance() + (boost.concentration || 0))),
      workRate: Math.min(99, Math.max(1, base + variance() + (boost.workRate || 0))),
      determination: Math.min(99, Math.max(1, base + variance())),
      teamwork: Math.min(99, Math.max(1, base + variance())),
      vision: Math.min(99, Math.max(1, base + variance() + (boost.vision || 0))),
      // Technical
      passing: Math.min(99, Math.max(1, base + variance() + (boost.passing || 0))),
      technique: Math.min(99, Math.max(1, base + variance() + (boost.technique || 0))),
      dribbling: Math.min(99, Math.max(1, base + variance() + (boost.dribbling || 0))),
      firstTouch: Math.min(99, Math.max(1, base + variance())),
      tackling: Math.min(99, Math.max(1, base + variance() + (boost.tackling || 0))),
      marking: Math.min(99, Math.max(1, base + variance() + (boost.marking || 0))),
      finishing: Math.min(99, Math.max(1, base + variance() + (boost.finishing || 0))),
      heading: Math.min(99, Math.max(1, base + variance() + (boost.heading || 0))),
      crossing: Math.min(99, Math.max(1, base + variance() + (boost.passing || 0) * 0.5)),
      freekick: Math.min(99, Math.max(1, base + variance())),
      curve: Math.min(99, Math.max(1, base + variance() + (boost.technique || 0) * 0.5)),
      volleys: Math.min(99, Math.max(1, base + variance() + (boost.technique || 0) * 0.3)),
      penalties: Math.min(99, Math.max(1, base + variance() + (boost.composure || 0) * 0.5)),
      // Special
      offTheBall: Math.min(99, Math.max(1, base + variance() + (boost.offTheBall || 0)))
    }
  }

  // Formation layouts
  private getFormationLayout(formation: string): FormationLayout[] {
    const formations: Record<string, FormationLayout[]> = {
      '1-2-1-1': [
        { role: 'goalkeeper', x: 40, y: 0.5 },
        { role: 'defender', x: 150, y: 0.35 },
        { role: 'defender', x: 150, y: 0.65 },
        { role: 'midfielder', x: 280, y: 0.5 },
        { role: 'striker', x: 320, y: 0.5 } // Moved back to stay outside center circle
      ],
      '1-1-2-1': [
        { role: 'goalkeeper', x: 40, y: 0.5 },
        { role: 'defender', x: 150, y: 0.5 },
        { role: 'midfielder', x: 280, y: 0.35 },
        { role: 'midfielder', x: 280, y: 0.65 },
        { role: 'striker', x: 320, y: 0.5 } // Moved back to stay outside center circle
      ],
      '1-3-1': [
        { role: 'goalkeeper', x: 40, y: 0.5 },
        { role: 'defender', x: 180, y: 0.3 },
        { role: 'defender', x: 140, y: 0.5 },
        { role: 'defender', x: 180, y: 0.7 },
        { role: 'striker', x: 320, y: 0.5 } // Moved back to stay outside center circle
      ],
      '1-2-2': [
        { role: 'goalkeeper', x: 40, y: 0.5 },
        { role: 'defender', x: 150, y: 0.35 },
        { role: 'defender', x: 150, y: 0.65 },
        { role: 'striker', x: 320, y: 0.35 }, // Moved back to stay outside center circle
        { role: 'striker', x: 320, y: 0.65 } // Moved back to stay outside center circle
      ]
    }
    
    return formations[formation] || formations['1-2-1-1']
  }

  // Initialize players based on formations
  initializePlayers(): void {
    const homeLayout = this.getFormationLayout(this.config.homeFormation)
    const awayLayout = this.getFormationLayout(this.config.awayFormation)
    
    console.log('Initializing players with formations:', {
      home: this.config.homeFormation,
      away: this.config.awayFormation,
      homeLayout,
      awayLayout
    })
    
    this.players = []
    
    // Initialize home team
    const homeNames = ['Martinez', 'Silva', 'Rodriguez', 'Garcia', 'Fernandez']
    homeLayout.forEach((pos, index: number) => {
      const attributes = this.generateAttributes(pos.role)
      
      this.players.push({
        x: pos.x,
        y: this.config.fieldHeight * pos.y,
        vx: 0,
        vy: 0,
        facing: 0,
        team: 'home',
        role: pos.role,
        radius: 10,
        stamina: attributes.stamina,
        maxStamina: attributes.stamina,
        number: index + 1,
        name: homeNames[index] || `Player ${index + 1}`,
        attributes,
        targetX: pos.x,
        targetY: this.config.fieldHeight * pos.y,
        consecutiveTouches: 0,
        yellowCards: 0,
        isSentOff: false
      })
    })
    
    // Initialize away team
    const awayNames = ['Johnson', 'Brown', 'Wilson', 'Davis', 'Miller']
    awayLayout.forEach((pos, index: number) => {
      const attributes = this.generateAttributes(pos.role)
      
      this.players.push({
        x: this.config.fieldWidth - pos.x,
        y: this.config.fieldHeight * pos.y,
        vx: 0,
        vy: 0,
        facing: Math.PI,
        team: 'away',
        role: pos.role,
        radius: 10,
        stamina: attributes.stamina,
        maxStamina: attributes.stamina,
        number: index + 6,
        name: awayNames[index] || `Player ${index + 6}`,
        attributes,
        targetX: this.config.fieldWidth - pos.x,
        targetY: this.config.fieldHeight * pos.y,
        consecutiveTouches: 0,
        yellowCards: 0,
        isSentOff: false
      })
    })
  }

  // Player AI logic
  private updatePlayerAI(player: Player): void {
    if (player.isSentOff) return
    
    // FlowAI removed - using original AI only
    
    // Priority 1: Handle restart movement
    if (player.isMovingToRestart && player.restartTarget) {
      const distToTarget = Math.hypot(player.x - player.restartTarget.x, player.y - player.restartTarget.y)
      
      // Always set target position while moving to restart
      player.targetX = player.restartTarget.x
      player.targetY = player.restartTarget.y
      
      if (distToTarget > 5) {
        // Still moving to restart position
        // Calculate movement speed for restart
        const maxSpeed = 3.0 // Fixed speed for restart movement
        const accelRate = 0.1
        this.updatePlayerMovement(player, maxSpeed, accelRate)
        return
      } else {
        // Reached restart position
        
        // If this player is the taker and ball is stationary, take the kick
        if (player.restartRole === 'taker' && this.ball.isStationary && this.gameState.ballOut) {
          // Don't clear isMovingToRestart until we've taken the kick
          // Check if player is close enough to the ball
          const ballDist = Math.hypot(this.ball.x - player.x, this.ball.y - player.y)
          
          if (ballDist > player.radius + this.ball.radius + 10) {
            // Still need to get closer to the ball
            player.targetX = this.ball.x
            player.targetY = this.ball.y
            const maxSpeed = 3.0
            const accelRate = 0.1
            this.updatePlayerMovement(player, maxSpeed, accelRate)
            return
          }
          
          // Now we're close enough
          player.isMovingToRestart = false
          
          // Face towards appropriate target
          let targetAngle: number
          if (this.gameState.restartType === 'free-kick') {
            // Face the goal for free kicks
            const goalX = player.team === 'home' ? this.config.fieldWidth : 0
            targetAngle = Math.atan2(this.config.fieldHeight / 2 - player.y, goalX - player.x)
          } else {
            // Face field center for kick-ins
            const fieldCenter = { x: this.config.fieldWidth / 2, y: this.config.fieldHeight / 2 }
            targetAngle = Math.atan2(fieldCenter.y - player.y, fieldCenter.x - player.x)
          }
          player.facing = targetAngle
          
          // Take the kick immediately (no delay needed)
          if (this.ball.isStationary && this.gameState.ballOut) {
            // Store restart type before clearing
            const restartType = this.gameState.restartType
            
            // Mark this player as the restart taker
            this.ball.restartTaker = player
            
            // Set cooldown - player must wait before chasing ball (typical in futsal)
            player.restartCooldown = Date.now() + 2000 // 2 second cooldown
            
            // For free kicks, shoot at goal
            if (restartType === 'free-kick') {
              const shotPower = 8
              this.ball.vx = Math.cos(targetAngle) * shotPower
              this.ball.vy = Math.sin(targetAngle) * shotPower
              this.ball.vz = 2 // Add some height
              this.ball.lastKicker = player
              this.gameState.possession = player.team
            } else {
              // For kick-ins and corners, make a short pass towards field center
              const kickPower = 3
              this.ball.vx = Math.cos(targetAngle) * kickPower
              this.ball.vy = Math.sin(targetAngle) * kickPower
              this.ball.vz = 0 // Ground pass
              this.ball.lastKicker = player
              this.gameState.possession = player.team
            }
            
            // Clear ball stationary state
            this.ball.isStationary = false
            
            // Clear restart state
            this.gameState.ballOut = false
            this.gameState.restartType = null
            this.gameState.restartTeam = null
            player.restartRole = undefined
          }
        } else {
          // Not the taker, clear movement state
          player.isMovingToRestart = false
        }
        
        player.restartTarget = undefined
      }
    }
    
    const ballDist = Math.hypot(this.ball.x - player.x, this.ball.y - player.y)
    const hasBall = this.ball.possessor === player
    let ballIsLoose = !this.ball.possessor && !this.gameState.ballOut && !this.ball.isStationary
    
    // If player is in restart cooldown, stay in position for pass back
    if (player.restartCooldown && Date.now() < player.restartCooldown) {
      // Stay in current position, ready for pass back
      player.targetX = player.x
      player.targetY = player.y
      
      // Still update movement but don't pursue ball
      const staminaFactor = player.stamina / player.maxStamina
      const baseSpeed = 2.5 + (player.attributes.pace / 99) * 2.5
      const maxSpeed = baseSpeed * (0.6 + staminaFactor * 0.4) * (0.8 + (player.attributes.agility / 99) * 0.2)
      const accelRate = (player.attributes.acceleration / 99) * 0.08 + 0.02
      this.updatePlayerMovement(player, maxSpeed, accelRate)
      return
    }
    
    // Don't chase ball during restarts unless you're the designated restart taker
    if (this.ball.isStationary && player.restartRole !== 'taker') {
      ballIsLoose = false
    }
    
    // Special handling for kickoff - be more aggressive
    const isKickoffTime = this.gameState.gameTime > 1200000 - 3000
    
    if (!isKickoffTime) {
      // Prevent clustering: Count teammates near the ball
      const teammatesNearBall = this.players.filter(p => 
        p.team === player.team && 
        p !== player && 
        !p.isSentOff &&
        Math.hypot(this.ball.x - p.x, this.ball.y - p.y) < 60
      ).length
      
      // If too many teammates are near the ball, don't chase unless very close
      const maxTeammatesNearBall = player.role === 'goalkeeper' ? 0 : (player.role === 'striker' ? 1 : 2)
      if (teammatesNearBall >= maxTeammatesNearBall && ballDist > 30) {
        ballIsLoose = false
      }
    }
    
    // Reduce ball chasing if too many players are already near the ball
    const playersNearBall = this.players.filter(p => {
      const dist = Math.hypot(p.x - this.ball.x, p.y - this.ball.y)
      return dist < 30 && p.team === player.team && p !== player
    })
    
    const shouldAvoidCongestion = playersNearBall.length >= 2 && ballDist > 15
    
    // If avoiding congestion, don't treat ball as loose
    if (shouldAvoidCongestion) {
      ballIsLoose = false
    }
    
    // Get team tactic and strategy
    const tactic = player.team === 'home' ? this.config.homeTactic : this.config.awayTactic
    const strategy = player.team === 'home' ? this.config.homeStrategy : this.config.awayStrategy
    
    // Priority 1: Pursue loose balls actively
    if (ballIsLoose && this.shouldPursueBall(player, ballDist)) {
      this.updateBallPursuit(player, ballDist)
      // Still run movement and ball interaction
      const staminaFactor = player.stamina / player.maxStamina
      const baseSpeed = 2.5 + (player.attributes.pace / 99) * 2.5
      const maxSpeed = baseSpeed * (0.6 + staminaFactor * 0.4) * (0.8 + (player.attributes.agility / 99) * 0.2)
      const accelRate = (player.attributes.acceleration / 99) * 0.08 + 0.02
      
      // Even faster when ball is stationary
      const isStationary = this.isBallStationary()
      const speedMultiplier = isStationary ? 1.5 : 1.2
      const accelMultiplier = isStationary ? 1.6 : 1.3
      
      this.updatePlayerMovement(player, maxSpeed * speedMultiplier, accelRate * accelMultiplier)
      this.updatePlayerBallInteraction(player, hasBall, tactic)
      return
    }
    
    // Calculate speed based on attributes and stamina
    const staminaFactor = player.stamina / player.maxStamina
    const baseSpeed = 2.5 + (player.attributes.pace / 99) * 2.5
    const maxSpeed = baseSpeed * (0.6 + staminaFactor * 0.4) * (0.8 + (player.attributes.agility / 99) * 0.2)
    const accelRate = (player.attributes.acceleration / 99) * 0.08 + 0.02
    
    // Tactical awareness affects positioning
    const tacticalAwareness = (
      player.attributes.positioning / 99 * 0.4 +
      player.attributes.decisions / 99 * 0.3 +
      player.attributes.teamwork / 99 * 0.3
    )
    
    // Team shape and compactness based on strategy
    const compactness = 1.2 - (strategy / 8) * 0.4 // More defensive = more compact
    const pushUpField = (strategy - 4) * 20 // How far to push up/down field
    
    // Role-based AI with advanced tactics
    this.updatePlayerPositioning(player, tactic, strategy, hasBall, ballDist, tacticalAwareness, compactness, pushUpField)
    
    // Handle player movement with enhanced physics
    this.updatePlayerMovement(player, maxSpeed, accelRate)
    
    // Handle ball interactions with tactical context
    this.updatePlayerBallInteraction(player, hasBall, tactic)
    
    // Tactical discipline - players maintain shape
    this.enforceTacticalDiscipline(player, tactic, strategy)
  }
  
  // Enforce tactical discipline
  private enforceTacticalDiscipline(player: Player, tactic: string, strategy: number): void {
    const teamPlayers = this.players.filter(p => p.team === player.team && !p.isSentOff)
    const teamCenterX = teamPlayers.reduce((sum, p) => sum + p.x, 0) / teamPlayers.length
    const teamCenterY = teamPlayers.reduce((sum, p) => sum + p.y, 0) / teamPlayers.length
    
    // Maximum allowed distance from team shape
    const maxDistFromShape = 100 + (player.attributes.teamwork / 99) * 50
    const distFromCenter = Math.hypot(player.x - teamCenterX, player.y - teamCenterY)
    
    // Pull players back if they're too far from team shape
    if (distFromCenter > maxDistFromShape && player.role !== 'striker') {
      const pullBackStrength = 0.1 * (1 - player.attributes.teamwork / 99)
      player.targetX = player.x + (teamCenterX - player.x) * pullBackStrength
      player.targetY = player.y + (teamCenterY - player.y) * pullBackStrength
    }
  }
  
  // Determine if player should pursue the ball
  private shouldPursueBall(player: Player, ballDist: number): boolean {
    // Check if player is in restart cooldown
    if (player.restartCooldown && Date.now() < player.restartCooldown) {
      return false // Player must wait before chasing ball after taking restart
    }
    
    // Check if we're in a kickoff situation - delay pursuit for non-kickoff team
    if (this.gameState.gameTime > 1200000 - 3000) { // First 3 seconds of half
      const ballAtCenter = Math.hypot(this.ball.x - this.config.fieldWidth / 2, this.ball.y - this.config.fieldHeight / 2) < 50
      if (ballAtCenter) {
        // Only the striker from the kicking off team should pursue initially
        const centerX = this.config.fieldWidth / 2
        const isKickingOffTeam = (player.team === 'home' && this.ball.x < centerX + 10) || 
                               (player.team === 'away' && this.ball.x > centerX - 10)
        
        if (!isKickingOffTeam && ballDist > 40) {
          return false // Non-kickoff team stays back
        }
      }
    }
    
    // Always pursue if very close
    if (ballDist < 30) return true
    
    // Goalkeepers only pursue if ball is in their area
    if (player.role === 'goalkeeper') {
      const inGoalArea = player.team === 'home' ? 
        this.ball.x < 150 : this.ball.x > this.config.fieldWidth - 150
      return inGoalArea && ballDist < 80
    }
    
    // Find all players interested in the ball
    const allPlayers = this.players.filter(p => !p.isSentOff)
    const playersByDistance = allPlayers
      .map(p => ({
        player: p,
        distance: Math.hypot(this.ball.x - p.x, this.ball.y - p.y),
        pursuit: this.calculatePursuitScore(p)
      }))
      .sort((a, b) => a.pursuit - b.pursuit) // Sort by pursuit score (lower is better)
    
    // Player should pursue if they're among the top pursuers
    const topPursuers = playersByDistance.slice(0, 4) // Top 4 pursuers
    const isTopPursuer = topPursuers.some(p => p.player === player)
    
    // Additional checks
    const hasStamina = player.stamina > player.maxStamina * 0.3
    const ballIsReachable = ballDist < 200
    const ballIsMovingSlow = Math.hypot(this.ball.vx, this.ball.vy) < 3
    
    // More aggressive pursuit if ball has been stationary for a while
    const ballStationary = this.isBallStationary()
    const urgentPursuit = ballStationary && ballDist < 150
    
    return (isTopPursuer && hasStamina && ballIsReachable && ballIsMovingSlow) || urgentPursuit
  }
  
  // Calculate pursuit score (lower = more likely to pursue)
  private calculatePursuitScore(player: Player): number {
    const ballDist = Math.hypot(this.ball.x - player.x, this.ball.y - player.y)
    
    // Base score is distance
    let score = ballDist
    
    // Role modifiers
    if (player.role === 'goalkeeper') {
      score += 100 // Goalkeepers less likely unless in area
    } else if (player.role === 'striker') {
      score -= 20 // Strikers more aggressive
    } else if (player.role === 'midfielder') {
      score -= 10 // Midfielders quite aggressive
    }
    
    // Attribute modifiers
    score -= (player.attributes.workRate / 99) * 30 // Higher work rate = more likely
    score -= (player.attributes.determination / 99) * 20
    score -= (player.attributes.pace / 99) * 25 // Faster players more confident
    
    // Stamina penalty
    const staminaRatio = player.stamina / player.maxStamina
    if (staminaRatio < 0.5) {
      score += 50 // Tired players less likely to chase
    }
    
    // Team possession bonus - your team more likely to chase if you lost it
    if (this.ball.lastKicker?.team === player.team) {
      score -= 15
    }
    
    return score
  }
  
  // Update player to pursue the ball
  private updateBallPursuit(player: Player, ballDist: number): void {
    // Predict where ball will be
    const ballSpeed = Math.hypot(this.ball.vx, this.ball.vy)
    const playerSpeed = 2.5 + (player.attributes.pace / 99) * 2.5
    
    let interceptX = this.ball.x
    let interceptY = this.ball.y
    
    if (ballSpeed > 0.5) {
      // Ball is moving - try to intercept
      const timeToReach = ballDist / (playerSpeed * 50)
      
      // Account for ball friction
      const frictionFactor = 0.94
      let futureVx = this.ball.vx
      let futureVy = this.ball.vy
      
      // Predict ball position with friction
      for (let t = 0; t < timeToReach; t += 0.1) {
        interceptX += futureVx * 0.1 * 60
        interceptY += futureVy * 0.1 * 60
        futureVx *= frictionFactor
        futureVy *= frictionFactor
        
        if (Math.hypot(futureVx, futureVy) < 0.1) break
      }
    }
    
    // Add some intelligence based on player attributes
    const anticipation = player.attributes.anticipation / 99
    const intelligence = player.attributes.decisions / 99
    
    // Smart players anticipate better
    if (anticipation > 0.7 && ballSpeed > 1) {
      const smartOffset = anticipation * 20
      interceptX += (this.ball.vx > 0 ? smartOffset : -smartOffset)
      interceptY += (this.ball.vy > 0 ? smartOffset : -smartOffset)
    }
    
    // Set target to intercept position
    player.targetX = Math.max(player.radius, Math.min(this.config.fieldWidth - player.radius, interceptX))
    player.targetY = Math.max(player.radius, Math.min(this.config.fieldHeight - player.radius, interceptY))
    
    // Face the ball direction
    player.facing = Math.atan2(this.ball.y - player.y, this.ball.x - player.x)
  }
  
  // Check if ball has been stationary
  private isBallStationary(): boolean {
    const ballSpeed = Math.hypot(this.ball.vx, this.ball.vy)
    const ballMoved = Math.hypot(
      this.ball.x - this.lastBallPosition.x,
      this.ball.y - this.lastBallPosition.y
    )
    
    // Update tracking
    if (ballSpeed < 0.5 && ballMoved < 5) {
      this.ballStationaryTime += 1
    } else {
      this.ballStationaryTime = 0
      this.lastBallPosition.x = this.ball.x
      this.lastBallPosition.y = this.ball.y
    }
    
    return this.ballStationaryTime > 30 // Ball stationary for 30+ frames
  }
  
  // Check if ball is out of bounds and handle restart
  private checkBallOutOfBounds(): void {
    const ballX = this.ball.x
    const ballY = this.ball.y
    const fieldMargin = 0 // Ball must completely cross the line
    
    // Check if ball is out of bounds - with ball radius consideration
    const ballRadius = this.ball.radius
    if (ballX - ballRadius <= fieldMargin || ballX + ballRadius >= this.config.fieldWidth ||
        ballY - ballRadius <= fieldMargin || ballY + ballRadius >= this.config.fieldHeight) {
      this.handleBallOut()
    }
  }
  
  // Handle ball going out of bounds
  private handleBallOut(): void {
    if (this.gameState.ballOut) return // Already handling ball out
    
    this.gameState.ballOut = true
    const lastTeam = this.ball.lastKicker?.team
    
    // Determine restart type and position
    const ballX = this.ball.x
    const ballY = this.ball.y
    
    // Check if ball went out on sidelines or goal lines
    const ballRadius = this.ball.radius
    if (ballY - ballRadius <= 0 || ballY + ballRadius >= this.config.fieldHeight) {
      // Ball went out on the sidelines (top/bottom)
      this.gameState.restartType = 'kick-in'
      this.gameState.restartTeam = lastTeam === 'home' ? 'away' : 'home'
      this.gameState.restartPosition = {
        x: Math.max(50, Math.min(this.config.fieldWidth - 50, ballX)),
        y: ballY - ballRadius <= 0 ? 15 : this.config.fieldHeight - 15
      }
    } else if (ballX - ballRadius <= 0 || ballX + ballRadius >= this.config.fieldWidth) {
      // Ball went out on goal lines (left/right)
      const nearGoal = this.isNearGoal(ballY)
      
      if (nearGoal) {
        // Ball went out near the goal
        // Corner kick occurs when attacking team last touched the ball before it went out
        const defendingTeam = ballX - ballRadius <= 0 ? 'home' : 'away'
        const isCorner = lastTeam !== defendingTeam
        
        if (isCorner) {
          // Corner kick
          this.gameState.restartType = 'corner'
          this.gameState.restartTeam = lastTeam!
          this.gameState.restartPosition = {
            x: ballX - ballRadius <= 0 ? 0 : this.config.fieldWidth,
            y: ballY < this.config.fieldHeight / 2 ? 0 : this.config.fieldHeight
          }
          
          // Track corner stat
          this.gameState.matchStats.corners[lastTeam!]++
        } else {
          // Goal kick - defending team gets the ball
          this.gameState.restartType = 'goal-kick'
          this.gameState.restartTeam = defendingTeam
          this.gameState.restartPosition = {
            x: defendingTeam === 'home' ? 60 : this.config.fieldWidth - 60,
            y: this.config.fieldHeight / 2
          }
        }
      } else {
        // Ball went out on goal line but not near goal - kick-in
        this.gameState.restartType = 'kick-in'
        this.gameState.restartTeam = lastTeam === 'home' ? 'away' : 'home'
        this.gameState.restartPosition = {
          x: ballX <= 10 ? 15 : this.config.fieldWidth - 15,
          y: Math.max(50, Math.min(this.config.fieldHeight - 50, ballY))
        }
      }
    }
    
    // Stop the ball
    this.ball.vx = 0
    this.ball.vy = 0
    this.ball.vz = 0
    this.ball.possessor = null
    
    // Reset ball stationary timer
    this.ballStationaryTime = 0
    
    // Execute restart after a brief delay
    setTimeout(() => {
      if (this.gameState.restartType === 'corner') {
        this.executeCorner()
      } else if (this.gameState.restartType === 'kick-in') {
        this.executeKickIn()
      }
      // Note: goal-kicks and free-kicks are handled separately
    }, 800) // Futsal has quicker restarts than regular soccer
  }
  
  // Check if ball position is near a goal
  private isNearGoal(ballY: number): boolean {
    const goalTop = (this.config.fieldHeight - this.config.goalWidth) / 2
    const goalBottom = goalTop + this.config.goalWidth
    const goalAreaExtension = 30 // Consider area around goal
    
    return ballY >= (goalTop - goalAreaExtension) && ballY <= (goalBottom + goalAreaExtension)
  }
  
  // Setup corner kick
  private executeCorner(): void {
    if (!this.gameState.restartPosition || !this.gameState.restartTeam) return
    
    // Place ball at exact corner
    const isLeftCorner = this.gameState.restartPosition.x < this.config.fieldWidth / 2
    const isTopCorner = this.gameState.restartPosition.y < this.config.fieldHeight / 2
    
    this.ball.x = isLeftCorner ? 0 : this.config.fieldWidth
    this.ball.y = isTopCorner ? 0 : this.config.fieldHeight
    this.ball.z = 0
    this.ball.vx = 0
    this.ball.vy = 0
    this.ball.vz = 0
    this.ball.isStationary = true
    
    // Find nearest player from the restart team to take the corner
    const restartPlayers = this.players.filter(p => 
      p.team === this.gameState.restartTeam && !p.isSentOff
    )
    
    if (restartPlayers.length > 0) {
      // Find player with best crossing/technique for corners
      const cornerTaker = restartPlayers.sort((a, b) => {
        // Prioritize players with good crossing and technique
        const aScore = a.attributes.crossing + a.attributes.technique + a.attributes.curve
        const bScore = b.attributes.crossing + b.attributes.technique + b.attributes.curve
        return bScore - aScore
      })[0]
      
      // Set the taker to move to corner position
      cornerTaker.isMovingToRestart = true
      cornerTaker.restartRole = 'taker'
      
      // Position in buffer zone at corner
      cornerTaker.restartTarget = {
        x: isLeftCorner ? -15 : this.config.fieldWidth + 15,
        y: isTopCorner ? -15 : this.config.fieldHeight + 15
      }
      
      // Position attacking players in the box
      const attackingPlayers = restartPlayers.filter(p => p !== cornerTaker && p.role !== 'goalkeeper')
      attackingPlayers.forEach((player, index) => {
        player.isMovingToRestart = true
        player.restartRole = 'support'
        
        // Position in and around the penalty area
        const targetGoalX = isLeftCorner ? this.config.fieldWidth - 80 : 80
        const positions = [
          { x: targetGoalX, y: this.config.fieldHeight / 2 }, // Near post
          { x: targetGoalX - (isLeftCorner ? 30 : -30), y: this.config.fieldHeight / 2 + 20 }, // Far post
          { x: targetGoalX - (isLeftCorner ? 50 : -50), y: this.config.fieldHeight / 2 - 20 }, // Edge of box
          { x: targetGoalX - (isLeftCorner ? 70 : -70), y: this.config.fieldHeight / 2 } // Outside box
        ]
        
        if (index < positions.length) {
          player.restartTarget = positions[index]
        }
      })
    }
    
    // Move defending players to defensive positions
    const minDistance = 50 // 5 meters minimum distance
    const cornerX = this.gameState.restartPosition?.x || this.ball.x
    const cornerY = this.gameState.restartPosition?.y || this.ball.y
    
    this.players.forEach(player => {
      if (player.team !== this.gameState.restartTeam && !player.isSentOff) {
        const dist = Math.hypot(player.x - cornerX, player.y - cornerY)
        if (dist < minDistance) {
          player.isMovingToRestart = true
          const angle = Math.atan2(player.y - cornerY, player.x - cornerX)
          player.restartTarget = {
            x: cornerX + Math.cos(angle) * (minDistance + 10),
            y: cornerY + Math.sin(angle) * (minDistance + 10)
          }
        } else {
          // Defensive positioning in the box
          player.isMovingToRestart = true
          const goalX = player.team === 'home' ? 30 : this.config.fieldWidth - 30
          player.restartTarget = {
            x: goalX + (player.team === 'home' ? 50 : -50),
            y: this.config.fieldHeight / 2 + (player.number % 3 - 1) * 30
          }
        }
      }
    })
  }
  
  // Setup kick-in with player walking to position
  private executeKickIn(): void {
    if (!this.gameState.restartPosition || !this.gameState.restartTeam) return
    
    // Place ball at restart position
    this.ball.x = this.gameState.restartPosition.x
    this.ball.y = this.gameState.restartPosition.y
    this.ball.z = 0
    this.ball.vx = 0
    this.ball.vy = 0
    this.ball.vz = 0
    this.ball.isStationary = true
    
    // Find nearest player from the restart team to take the kick-in
    const restartPlayers = this.players.filter(p => 
      p.team === this.gameState.restartTeam && !p.isSentOff
    )
    
    if (restartPlayers.length > 0) {
      // Find closest player to restart position
      const kickInTaker = restartPlayers.sort((a, b) => {
        const aDist = Math.hypot(a.x - this.ball.x, a.y - this.ball.y)
        const bDist = Math.hypot(b.x - this.ball.x, b.y - this.ball.y)
        return aDist - bDist
      })[0]
      
      // Set the taker to move to the ball position
      kickInTaker.isMovingToRestart = true
      kickInTaker.restartRole = 'taker'
      
      // Calculate target position for kick-in
      const kickInDistance = 15
      
      // For kick-ins on touchlines, position the player appropriately
      if (this.gameState.restartType === 'kick-in') {
        // Determine which touchline the ball is on based on restart position
        const isTopTouchline = this.ball.y <= 20
        const isBottomTouchline = this.ball.y >= this.config.fieldHeight - 20
        const isLeftTouchline = this.ball.x <= 20
        const isRightTouchline = this.ball.x >= this.config.fieldWidth - 20
        
        if (isTopTouchline || isBottomTouchline) {
          // Ball is on top or bottom touchline
          // Place ball exactly on the line
          this.ball.y = isTopTouchline ? 0 : this.config.fieldHeight
          
          // Position player outside the field in buffer zone
          kickInTaker.restartTarget = {
            x: this.ball.x,
            y: isTopTouchline ? -15 : this.config.fieldHeight + 15
          }
        } else if (isLeftTouchline || isRightTouchline) {
          // Ball is on left or right touchline (goal lines)
          // Place ball exactly on the line
          this.ball.x = isLeftTouchline ? 0 : this.config.fieldWidth
          
          // Position player outside the field in buffer zone
          kickInTaker.restartTarget = {
            x: isLeftTouchline ? -15 : this.config.fieldWidth + 15,
            y: this.ball.y
          }
        } else {
          // Should not happen for kick-ins, but fallback to field-side positioning
          const fieldCenter = { x: this.config.fieldWidth / 2, y: this.config.fieldHeight / 2 }
          const directionToCenterX = fieldCenter.x - this.ball.x
          const directionToCenterY = fieldCenter.y - this.ball.y
          const directionLength = Math.hypot(directionToCenterX, directionToCenterY)
          
          if (directionLength > 0) {
            kickInTaker.restartTarget = {
              x: this.ball.x - (directionToCenterX / directionLength) * kickInDistance,
              y: this.ball.y - (directionToCenterY / directionLength) * kickInDistance
            }
          }
        }
      } else {
        // Other restarts (corners, goal kicks)
        const fieldCenter = { x: this.config.fieldWidth / 2, y: this.config.fieldHeight / 2 }
        const directionToCenterX = fieldCenter.x - this.ball.x
        const directionToCenterY = fieldCenter.y - this.ball.y
        const directionLength = Math.hypot(directionToCenterX, directionToCenterY)
        
        if (directionLength > 0) {
          kickInTaker.restartTarget = {
            x: this.ball.x + (directionToCenterX / directionLength) * kickInDistance,
            y: this.ball.y + (directionToCenterY / directionLength) * kickInDistance
          }
        }
      }
      
      // Ensure target is in bounds (including buffer zone for kick-ins)
      if (kickInTaker.restartTarget) {
        const buffer = this.config.fieldBuffer || 0
        kickInTaker.restartTarget.x = Math.max(kickInTaker.radius - buffer, Math.min(this.config.fieldWidth + buffer - kickInTaker.radius, kickInTaker.restartTarget.x))
        kickInTaker.restartTarget.y = Math.max(kickInTaker.radius - buffer, Math.min(this.config.fieldHeight + buffer - kickInTaker.radius, kickInTaker.restartTarget.y))
      }
    }
    
    // Move opposing players away gradually - use restart position, not current ball position
    const minDistance = 50 // 5 meters for futsal
    const restartX = this.gameState.restartPosition?.x || this.ball.x
    const restartY = this.gameState.restartPosition?.y || this.ball.y
    
    this.players.forEach(player => {
      if (player.team !== this.gameState.restartTeam && !player.isSentOff) {
        const dist = Math.hypot(player.x - restartX, player.y - restartY)
        if (dist < minDistance) {
          player.isMovingToRestart = true
          const angle = Math.atan2(player.y - restartY, player.x - restartX)
          player.restartTarget = {
            x: restartX + Math.cos(angle) * (minDistance + 10),
            y: restartY + Math.sin(angle) * (minDistance + 10)
          }
          
          // Keep in bounds
          player.restartTarget.x = Math.max(player.radius, Math.min(this.config.fieldWidth - player.radius, player.restartTarget.x))
          player.restartTarget.y = Math.max(player.radius, Math.min(this.config.fieldHeight - player.radius, player.restartTarget.y))
        }
      }
    })
  }

  private updatePlayerPositioning(player: Player, tactic: string, strategy: number, hasBall: boolean, ballDist: number, tacticalAwareness: number, compactness: number, pushUpField: number): void {
    // Check if player should make a run into space
    if (!hasBall && this.shouldMakeRun(player, tactic)) {
      this.makeIntelligentRun(player, tactic)
      return
    }
    
    // Base positioning based on role
    switch (player.role) {
      case 'goalkeeper':
        this.updateGoalkeeperPositioning(player, tactic)
        break
      case 'defender':
        this.updateDefenderPositioning(player, tactic, strategy, ballDist, tacticalAwareness, compactness, pushUpField)
        break
      case 'midfielder':
        this.updateMidfielderPositioning(player, hasBall, tactic, strategy, tacticalAwareness, compactness, pushUpField)
        break
      case 'striker':
        this.updateStrikerPositioning(player, tactic, ballDist, tacticalAwareness, strategy, pushUpField)
        break
    }
    
    // Apply tactical overrides
    this.applyTacticalOverrides(player, tactic, strategy)
  }
  
  // Apply specific tactical patterns
  private applyTacticalOverrides(player: Player, tactic: string, strategy: number): void {
    const teamHasBall = this.gameState.possession === player.team
    
    switch (tactic) {
      case 'high-press':
        if (!teamHasBall && player.role !== 'goalkeeper') {
          // Push up to press
          const pressLine = player.team === 'home' ? 
            this.config.fieldWidth * 0.6 : 
            this.config.fieldWidth * 0.4
          
          if ((player.team === 'home' && player.targetX! < pressLine) ||
              (player.team === 'away' && player.targetX! > pressLine)) {
            player.targetX = pressLine
          }
        }
        break
        
      case 'counter':
        if (teamHasBall && player.role === 'striker') {
          // Sprint forward on counter
          const targetX = player.team === 'home' ? 
            this.config.fieldWidth - 100 : 100
          player.targetX = targetX
        }
        break
        
      case 'pivot':
        if (player.role === 'striker') {
          // Stay central as pivot
          player.targetY = this.config.fieldHeight / 2
          const pivotX = player.team === 'home' ? 
            this.config.fieldWidth * 0.65 : 
            this.config.fieldWidth * 0.35
          player.targetX = pivotX
        }
        break
    }
  }

  private updateGoalkeeperPositioning(player: Player, tactic: string): void {
    const goalX = player.team === 'home' ? 50 : this.config.fieldWidth - 50
    const keeperAnticipation = player.attributes.anticipation / 99
    const keeperPositioning = player.attributes.positioning / 99
    
    // Anticipate ball trajectory
    const ballPredictX = this.ball.x + this.ball.vx * keeperAnticipation * 10
    const ballPredictY = this.ball.y + this.ball.vy * keeperAnticipation * 10
    
    if (tactic === 'flying-keeper' && 
        (player.team === 'home' ? this.ball.x > this.config.fieldWidth * 0.7 : this.ball.x < this.config.fieldWidth * 0.3)) {
      const maxKeeperX = player.team === 'home' ? 
        150 + keeperPositioning * 100 : 
        this.config.fieldWidth - 150 - keeperPositioning * 100
      player.targetX = player.team === 'home' ? 
        Math.min(maxKeeperX, ballPredictX * 0.3) : 
        Math.max(maxKeeperX, ballPredictX * 0.3)
      player.targetY = Math.max(
        this.config.fieldHeight * 0.2,
        Math.min(this.config.fieldHeight * 0.8, ballPredictY)
      )
    } else {
      const positionOffset = (keeperPositioning - 0.5) * 10
      player.targetX = goalX + positionOffset
      
      const reactionQuality = (
        player.attributes.concentration / 99 * 0.5 +
        player.attributes.composure / 99 * 0.3 +
        player.attributes.jumpingReach / 99 * 0.2
      )
      const targetY = ballPredictY * reactionQuality + (this.config.fieldHeight / 2) * (1 - reactionQuality)
      
      player.targetY = Math.max(
        (this.config.fieldHeight - this.config.goalWidth) / 2 + 20,
        Math.min((this.config.fieldHeight + this.config.goalWidth) / 2 - 20, targetY)
      )
    }
  }

  private updateDefenderPositioning(player: Player, tactic: string, strategy: number, ballDist: number, tacticalAwareness: number, compactness: number, pushUpField: number): void {
    const baseDefenseLineX = player.team === 'home' ? 120 : this.config.fieldWidth - 120
    const defenseLineX = baseDefenseLineX + (player.team === 'home' ? pushUpField : -pushUpField)
    
    const ballInDangerZone = player.team === 'home' ? 
      this.ball.x < this.config.fieldWidth * 0.35 : 
      this.ball.x > this.config.fieldWidth * 0.65
    
    const teamHasBall = this.gameState.possession === player.team
    
    if (ballInDangerZone && !teamHasBall) {
      // Emergency defending
      const tacklingAbility = player.attributes.tackling / 99
      const markingAbility = player.attributes.marking / 99
      const anticipation = player.attributes.anticipation / 99
      
      // Track back to goal
      const goalX = player.team === 'home' ? 50 : this.config.fieldWidth - 50
      const coverPosition = {
        x: goalX + (this.ball.x - goalX) * 0.5,
        y: this.ball.y + (this.config.fieldHeight / 2 - this.ball.y) * 0.3
      }
      
      player.targetX = coverPosition.x
      player.targetY = coverPosition.y
    } else if (tactic === 'high-press' && !teamHasBall) {
      // High defensive line when pressing
      const pressLineX = player.team === 'home' ? 
        this.config.fieldWidth * 0.5 : 
        this.config.fieldWidth * 0.5
      
      // Find nearest opponent to mark
      const opponents = this.players.filter(p => 
        p.team !== player.team && 
        !p.isSentOff &&
        p.role !== 'goalkeeper' &&
        Math.abs(p.y - player.y) < 100
      )
      
      const nearestOpponent = opponents.sort((a, b) => {
        const aDist = Math.hypot(a.x - player.x, a.y - player.y)
        const bDist = Math.hypot(b.x - player.x, b.y - player.y)
        return aDist - bDist
      })[0]
      
      if (nearestOpponent) {
        // Man-marking with intelligence
        const markingDistance = 15 + (1 - player.attributes.marking / 99) * 15
        const angleToGoal = Math.atan2(
          player.team === 'home' ? 0 - nearestOpponent.y : this.config.fieldHeight - nearestOpponent.y,
          player.team === 'home' ? 0 - nearestOpponent.x : this.config.fieldWidth - nearestOpponent.x
        )
        
        player.targetX = nearestOpponent.x + Math.cos(angleToGoal) * markingDistance
        player.targetY = nearestOpponent.y + Math.sin(angleToGoal) * markingDistance
      } else {
        player.targetX = pressLineX
        player.targetY = player.y
      }
    } else {
      // Normal defensive positioning
      const defenders = this.players.filter(p => 
        p.team === player.team && 
        p.role === 'defender' && 
        !p.isSentOff
      ).sort((a, b) => a.number - b.number)
      
      const defenderIndex = defenders.indexOf(player)
      const numDefenders = defenders.length
      
      if (numDefenders > 1) {
        // Spread defenders across the width
        const spacing = (this.config.fieldHeight * 0.6) / (numDefenders - 1)
        const startY = this.config.fieldHeight * 0.2
        
        player.targetX = defenseLineX
        player.targetY = startY + defenderIndex * spacing
        
        // Shift towards ball side
        const ballSideShift = (this.ball.y - this.config.fieldHeight / 2) * 0.2 * compactness
        player.targetY += ballSideShift * tacticalAwareness
      } else {
        // Single defender stays central
        player.targetX = defenseLineX
        player.targetY = this.config.fieldHeight / 2
      }
      
      // Adjust based on ball position when defending
      if (!teamHasBall) {
        const ballSideX = player.team === 'home' ? 
          Math.min(this.ball.x, defenseLineX) : 
          Math.max(this.ball.x, defenseLineX)
        
        player.targetX = player.targetX! * 0.7 + ballSideX * 0.3
      }
    }
  }

  private updateMidfielderPositioning(player: Player, hasBall: boolean, tactic: string, strategy: number, tacticalAwareness: number, compactness: number, pushUpField: number): void {
    const ballDist = Math.hypot(this.ball.x - player.x, this.ball.y - player.y)
    const teamHasBall = this.gameState.possession === player.team
    const ballInOwnHalf = player.team === 'home' ? this.ball.x < this.config.fieldWidth / 2 : this.ball.x > this.config.fieldWidth / 2
    
    // Midfielders are the engine of futsal
    const centralZoneX = this.config.fieldWidth / 2 + (player.team === 'home' ? pushUpField : -pushUpField)
    
    if (hasBall) {
      // Player has the ball - look for options
      const teammates = this.players.filter(p => 
        p.team === player.team && 
        p !== player && 
        !p.isSentOff
      )
      
      // Find best position based on teammates
      let bestX = player.x
      let bestY = player.y
      let maxSpace = 0
      
      // Sample positions around current location
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        const testX = player.x + Math.cos(angle) * 50
        const testY = player.y + Math.sin(angle) * 50
        
        if (testX < 20 || testX > this.config.fieldWidth - 20 ||
            testY < 20 || testY > this.config.fieldHeight - 20) continue
        
        const space = teammates.reduce((min, teammate) => {
          const dist = Math.hypot(teammate.x - testX, teammate.y - testY)
          return Math.min(min, dist)
        }, Infinity)
        
        if (space > maxSpace) {
          maxSpace = space
          bestX = testX
          bestY = testY
        }
      }
      
      player.targetX = bestX
      player.targetY = bestY
    } else if (tactic === 'pass-move' && teamHasBall) {
      // Constant movement to create passing lanes
      const time = Date.now() / 2000
      const movePattern = player.number % 2
      
      if (movePattern === 0) {
        // Horizontal movement
        const baseY = this.config.fieldHeight / 2
        player.targetX = centralZoneX + Math.sin(time) * 80 * tacticalAwareness
        player.targetY = baseY + Math.cos(time * 1.5) * 60
      } else {
        // Diagonal runs
        player.targetX = centralZoneX + Math.cos(time) * 100 * tacticalAwareness
        player.targetY = this.config.fieldHeight / 2 + Math.sin(time * 0.8) * 80
      }
    } else if (!teamHasBall) {
      // Defensive positioning
      if (tactic === 'high-press') {
        // Press the ball carrier
        const ballCarrier = this.ball.possessor
        if (ballCarrier && ballDist < 150) {
          player.targetX = ballCarrier.x
          player.targetY = ballCarrier.y
        } else {
          // Cover passing lanes
          const defenseX = player.team === 'home' ? 200 : this.config.fieldWidth - 200
          player.targetX = defenseX + (this.ball.x - defenseX) * 0.5
          player.targetY = this.ball.y
        }
      } else {
        // Zone defense
        const defenseX = centralZoneX - (player.team === 'home' ? 50 : -50)
        player.targetX = defenseX
        
        // Cover the center
        const centerCoverage = this.config.fieldHeight / 2
        const ballInfluence = (this.ball.y - centerCoverage) * 0.3
        player.targetY = centerCoverage + ballInfluence
      }
    } else {
      // Supporting play
      if (tactic === 'rotation') {
        // Rotate positions with other midfielders
        const otherMids = this.players.filter(p => 
          p.team === player.team && 
          p.role === 'midfielder' && 
          p !== player &&
          !p.isSentOff
        )
        
        if (otherMids.length > 0) {
          const time = Date.now() / 3000
          const rotationAngle = time * (player.number % 2 === 0 ? 1 : -1)
          const rotationRadius = 60
          
          player.targetX = centralZoneX + Math.cos(rotationAngle) * rotationRadius
          player.targetY = this.config.fieldHeight / 2 + Math.sin(rotationAngle) * rotationRadius
        }
      } else {
        // Standard support positioning
        const supportX = this.ball.x + (player.team === 'home' ? -30 : 30)
        const supportY = this.ball.y + (player.number % 2 === 0 ? 40 : -40)
        
        player.targetX = Math.max(50, Math.min(this.config.fieldWidth - 50, supportX))
        player.targetY = Math.max(50, Math.min(this.config.fieldHeight - 50, supportY))
      }
    }
  }

  private updateStrikerPositioning(player: Player, tactic: string, ballDist: number, tacticalAwareness: number, strategy: number, pushUpField: number): void {
    const teamHasBall = this.gameState.possession === player.team
    const oppositionGoalX = player.team === 'home' ? this.config.fieldWidth - 50 : 50
    
    if (tactic === 'pivot') {
      // Stay central as target man
      const pivotX = player.team === 'home' ? 
        this.config.fieldWidth - 140 + pushUpField : 
        140 - pushUpField
      
      player.targetX = pivotX
      player.targetY = this.config.fieldHeight / 2
      
      // Small movements to receive ball
      if (teamHasBall) {
        const time = Date.now() / 1500
        player.targetY += Math.sin(time) * 20
      }
    } else if (tactic === 'wing-play') {
      // Wide positioning
      const side = player.number % 2 === 0 ? 0.85 : 0.15
      player.targetY = this.config.fieldHeight * side
      
      if (teamHasBall) {
        // Push forward on wings
        player.targetX = oppositionGoalX + (player.team === 'home' ? -100 : 100)
      } else {
        // Track back
        const fallbackX = player.team === 'home' ? 300 : this.config.fieldWidth - 300
        player.targetX = fallbackX
      }
    } else {
      // Dynamic striker movement
      const time = Date.now() / 2000
      const offBallQuality = player.attributes.offTheBall / 99
      const anticipation = player.attributes.anticipation / 99
      
      if (teamHasBall) {
        // Intelligent runs
        const defenders = this.players.filter(p => 
          p.team !== player.team && 
          p.role === 'defender' &&
          !p.isSentOff
        )
        
        if (defenders.length > 0) {
          // Find gaps between defenders
          const bestGapX = oppositionGoalX
          let bestGapY = this.config.fieldHeight / 2
          let maxGapSize = 0
          
          // Check horizontal gaps
          const sortedDefenders = [...defenders].sort((a, b) => a.y - b.y)
          
          // Gap at top
          const topGap = sortedDefenders[0].y
          if (topGap > maxGapSize) {
            maxGapSize = topGap
            bestGapY = topGap / 2
          }
          
          // Gaps between defenders
          for (let i = 0; i < sortedDefenders.length - 1; i++) {
            const gap = sortedDefenders[i + 1].y - sortedDefenders[i].y
            if (gap > maxGapSize) {
              maxGapSize = gap
              bestGapY = (sortedDefenders[i].y + sortedDefenders[i + 1].y) / 2
            }
          }
          
          // Gap at bottom
          const bottomGap = this.config.fieldHeight - sortedDefenders[sortedDefenders.length - 1].y
          if (bottomGap > maxGapSize) {
            maxGapSize = bottomGap
            bestGapY = sortedDefenders[sortedDefenders.length - 1].y + bottomGap / 2
          }
          
          // Move into the gap
          player.targetX = oppositionGoalX + (player.team === 'home' ? -80 : 80)
          player.targetY = bestGapY
          
          // Curved runs
          const runCurve = Math.sin(time * (1 + offBallQuality * 0.5)) * 30 * anticipation
          player.targetX += runCurve
        } else {
          // No defenders, go straight to goal
          player.targetX = oppositionGoalX + (player.team === 'home' ? -60 : 60)
          player.targetY = this.config.fieldHeight / 2
        }
      } else {
        // Defensive work
        const pressIntensity = (
          player.attributes.workRate / 99 * 0.5 +
          player.attributes.determination / 99 * 0.3 +
          player.attributes.concentration / 99 * 0.2
        )
        
        if (strategy >= 6 && (ballDist < 200 * pressIntensity || pressIntensity > 0.8)) {
          // Press from the front
          player.targetX = this.ball.x
          player.targetY = this.ball.y
        } else {
          // Fall back but stay advanced
          const fallbackX = player.team === 'home' ? 
            Math.max(this.config.fieldWidth / 2, this.ball.x - 50) :
            Math.min(this.config.fieldWidth / 2, this.ball.x + 50)
          
          player.targetX = fallbackX
          player.targetY = this.config.fieldHeight / 2
        }
      }
    }
  }

  private updatePlayerMovement(player: Player, maxSpeed: number, accelRate: number): void {
    if (player.targetX !== undefined && player.targetY !== undefined) {
      const dx = player.targetX - player.x
      const dy = player.targetY - player.y
      const dist = Math.hypot(dx, dy)
      const currentSpeed = Math.hypot(player.vx, player.vy)

      if (dist > 5) {
        const desiredAngle = Math.atan2(dy, dx)
        
        // Update facing direction with smooth turning
        const facingDiff = desiredAngle - player.facing
        const turnSpeed = (player.attributes.agility / 99) * 0.15
        
        // Normalize angle difference
        let normalizedDiff = facingDiff
        while (normalizedDiff > Math.PI) normalizedDiff -= 2 * Math.PI
        while (normalizedDiff < -Math.PI) normalizedDiff += 2 * Math.PI
        
        player.facing += Math.sign(normalizedDiff) * Math.min(Math.abs(normalizedDiff), turnSpeed)
        
        // Realistic acceleration curves
        const accelerationCurve = (speed: number, max: number) => {
          const ratio = speed / max
          if (ratio < 0.3) return 1.2 // Quick initial burst
          if (ratio < 0.7) return 1.0 // Steady acceleration
          if (ratio < 0.9) return 0.7 // Approaching top speed
          return 0.3 // Hard to reach absolute max
        }
        
        const accelModifier = accelerationCurve(currentSpeed, maxSpeed)
        const effectiveAccel = accelRate * accelModifier * (player.attributes.acceleration / 99)
        
        // Movement based on facing direction and control
        const controlQuality = (player.attributes.technique / 99) * 0.7 + 0.3
        const targetSpeed = Math.min(maxSpeed, dist / 10) * controlQuality
        
        // Add momentum-based movement
        const momentum = currentSpeed / maxSpeed
        const inertia = 0.85 + (player.attributes.strength / 99) * 0.1
        
        // Calculate desired velocity based on facing
        const targetVx = Math.cos(player.facing) * targetSpeed
        const targetVy = Math.sin(player.facing) * targetSpeed
        
        // Apply acceleration with momentum consideration
        const vxDiff = targetVx - player.vx
        const vyDiff = targetVy - player.vy
        
        player.vx += vxDiff * effectiveAccel * (1 - momentum * 0.3)
        player.vy += vyDiff * effectiveAccel * (1 - momentum * 0.3)
        
        // Apply slight drift when changing direction at speed
        if (momentum > 0.5) {
          const driftFactor = (1 - player.attributes.balance / 99) * 0.1
          player.vx *= (1 - driftFactor)
          player.vy *= (1 - driftFactor)
        }
      } else {
        // Enhanced deceleration with balance consideration
        const balanceFactor = player.attributes.balance / 99
        const decelRate = 0.85 + balanceFactor * 0.1
        player.vx *= decelRate
        player.vy *= decelRate
        
        // Face the target when close
        player.facing = Math.atan2(dy, dx)
      }
      
      // Enhanced stamina system
      const playerSpeed = Math.hypot(player.vx, player.vy)
      const speedRatio = playerSpeed / maxSpeed
      const workRateFactor = player.attributes.workRate / 99
      const fitnessLevel = player.attributes.stamina / 99
      
      if (speedRatio > 0.8) {
        // Sprinting drains stamina quickly
        const drainRate = 0.15 * (1.2 - fitnessLevel * 0.4) * (0.8 + workRateFactor * 0.4)
        player.stamina = Math.max(0, player.stamina - drainRate)
      } else if (speedRatio > 0.5) {
        // Jogging drains stamina slowly
        const drainRate = 0.05 * (1 - fitnessLevel * 0.3) * (0.8 + workRateFactor * 0.4)
        player.stamina = Math.max(0, player.stamina - drainRate)
      } else {
        // Walking/standing recovers stamina
        const recoveryRate = 0.08 * (0.7 + fitnessLevel * 0.3) * (0.8 + (player.attributes.determination / 99) * 0.2)
        player.stamina = Math.min(player.maxStamina, player.stamina + recoveryRate)
      }
      
      // Fatigue affects max speed
      const fatigueFactor = player.stamina / player.maxStamina
      if (fatigueFactor < 0.5) {
        const fatigueSpeedPenalty = 0.7 + fatigueFactor * 0.6
        player.vx *= fatigueSpeedPenalty
        player.vy *= fatigueSpeedPenalty
      }
    }
  }

  private updatePlayerBallInteraction(player: Player, hasBall: boolean, tactic: string): void {
    if (hasBall) {
      if (!this.ball.possessor) {
        // Check if this player took the restart and cannot touch the ball yet
        if (this.ball.restartTaker === player) {
          // Cannot pick up the ball - let it bounce off
          return
        }
        
        this.ball.possessor = player
        this.ball.lastKicker = player
        this.gameState.possession = player.team
        
        // Clear restart taker once another player touches the ball
        if (this.ball.restartTaker) {
          this.ball.restartTaker = null
        }
      } else if (this.ball.possessor === player) {
        this.handleBallControl(player, tactic)
      }
    } else if (this.ball.possessor === player) {
      this.ball.possessor = null
    }
  }

  private handleBallControl(player: Player, tactic: string): void {
    // Track consecutive touches
    if (player.lastTouchTime && Date.now() - player.lastTouchTime < 500) {
      player.consecutiveTouches++
    } else {
      player.consecutiveTouches = 1
    }
    player.lastTouchTime = Date.now()
    
    // Realistic dribbling mechanics
    const dribbleQuality = (
      player.attributes.dribbling / 99 * 0.4 +
      player.attributes.technique / 99 * 0.3 +
      player.attributes.balance / 99 * 0.2 +
      player.attributes.agility / 99 * 0.1
    )
    
    const playerSpeed = Math.hypot(player.vx, player.vy)
    const speedFactor = Math.min(1.5, playerSpeed / 3)
    const baseDribbleDistance = 12 + (1 - dribbleQuality) * 8
    const dribbleDistance = baseDribbleDistance * (1 + speedFactor * 0.3)
    
    // Use player facing for dribble direction
    const dribbleAngle = player.facing + (Math.random() - 0.5) * 0.2 * (1 - dribbleQuality)
    const wobble = (1 - dribbleQuality) * 2 * (Math.random() - 0.5)
    
    // Keep ball on ground when dribbling
    this.ball.x = player.x + Math.cos(dribbleAngle) * dribbleDistance + wobble
    this.ball.y = player.y + Math.sin(dribbleAngle) * dribbleDistance + wobble
    this.ball.z = Math.max(0, this.ball.z * 0.5) // Bring ball down
    
    this.ball.vx = player.vx * 0.9
    this.ball.vy = player.vy * 0.9
    this.ball.vz = 0
    
    // Add some ball spin when dribbling
    this.ball.spin.x = -player.vy * 0.3
    this.ball.spin.y = player.vx * 0.3
    this.ball.spin.z *= 0.9
    
    // Decision making
    const nearGoal = player.team === 'home' ? 
      this.ball.x > this.config.fieldWidth - 180 : 
      this.ball.x < 180
    
    const decisionQuality = (
      player.attributes.decisions / 99 * 0.4 +
      player.attributes.composure / 99 * 0.3 +
      player.attributes.vision / 99 * 0.3
    )
    
    // Pressure affects decisions
    const pressure = this.calculatePressure(player)
    const calmness = player.attributes.composure / 99
    const panicFactor = pressure * (1 - calmness)
    
    // Base chances modified by role and situation - increased for more passing
    let basePassChance = player.role === 'defender' ? 0.12 : 0.08
    const baseShootChance = 0.05
    
    // Tactic modifiers
    if (tactic === 'pass-move') basePassChance *= 2.0
    if (tactic === 'pivot' && player.role === 'striker') basePassChance *= 1.5
    
    // Too many touches increases chance to pass
    if (player.consecutiveTouches > 2) {
      basePassChance += 0.04 * player.consecutiveTouches
    }
    
    // Increase passing when teammates are making runs
    const teammatesInSpace = this.players.filter(p => 
      p.team === player.team && 
      p !== player && 
      !p.isSentOff &&
      p.targetX !== undefined &&
      Math.abs(p.y - p.targetY!) > 20
    ).length
    if (teammatesInSpace > 0) {
      basePassChance *= 1.3
    }
    
    // Apply decision quality and panic
    const passChance = basePassChance * (0.5 + decisionQuality * 0.5) * (1 + panicFactor)
    const shootChance = nearGoal ? baseShootChance * (0.5 + decisionQuality * 0.5) : 0
    
    const shouldPass = Math.random() < passChance
    const shouldShoot = Math.random() < shootChance
    
    if (shouldShoot && nearGoal) {
      this.executeShot(player)
      this.ball.possessor = null
    } else if (shouldPass) {
      this.executePass(player)
      this.ball.possessor = null
    }
  }

  private executeShot(player: Player): void {
    const goalX = player.team === 'home' ? this.config.fieldWidth - 10 : 10
    const goalCenterY = this.config.fieldHeight / 2
    const shotDist = Math.hypot(goalX - this.ball.x, goalCenterY - this.ball.y)
    
    // Determine shot type based on situation
    const shotType = this.determineShotType(player, shotDist)
    
    // Calculate shot target
    const shotTarget = this.calculateShotTarget(player, goalX, goalCenterY, shotType)
    
    // Calculate shot physics
    const shotPhysics = this.calculateShotPhysics(player, shotTarget, shotType, shotDist)
    
    // Apply shot
    this.ball.vx = shotPhysics.vx
    this.ball.vy = shotPhysics.vy
    this.ball.vz = shotPhysics.vz
    this.ball.spin = shotPhysics.spin
    
    // Record shot
    this.gameState.shots[player.team]++
    
    // Check if it's on target
    const futureY = this.ball.y + (shotPhysics.vy / shotPhysics.vx) * (goalX - this.ball.x)
    const goalTop = (this.config.fieldHeight - this.config.goalWidth) / 2
    const goalBottom = goalTop + this.config.goalWidth
    
    if (futureY >= goalTop && futureY <= goalBottom) {
      this.gameState.shotsOnTarget[player.team]++
    }
    
    player.consecutiveTouches = 0
    this.ball.lastTouchTime = Date.now()
  }
  
  // Determine shot type
  private determineShotType(player: Player, dist: number): 'power' | 'placed' | 'chip' | 'volley' {
    const hasSpace = this.calculatePressure(player) < 0.3
    const closeRange = dist < 150
    
    // Check if ball is in air for volley
    if (this.ball.z > 20 && player.attributes.volleys > 60) {
      return 'volley'
    }
    
    // Close range with space - place it
    if (closeRange && hasSpace && player.attributes.finishing > 70) {
      return 'placed'
    }
    
    // Goalkeeper off line - chip
    const goalkeeper = this.players.find(p => 
      p.team !== player.team && 
      p.role === 'goalkeeper' &&
      !p.isSentOff
    )
    
    if (goalkeeper) {
      const keeperDistFromGoal = player.team === 'home' ?
        goalkeeper.x - 10 :
        this.config.fieldWidth - goalkeeper.x - 10
        
      if (keeperDistFromGoal > 80 && player.attributes.technique > 75) {
        return 'chip'
      }
    }
    
    // Default to power shot
    return 'power'
  }
  
  // Calculate shot target
  private calculateShotTarget(
    player: Player, 
    goalX: number, 
    goalCenterY: number,
    shotType: 'power' | 'placed' | 'chip' | 'volley'
  ): { x: number; y: number; z: number } {
    const goalTop = (this.config.fieldHeight - this.config.goalWidth) / 2
    const goalBottom = goalTop + this.config.goalWidth
    
    // Find goalkeeper position
    const goalkeeper = this.players.find(p => 
      p.team !== player.team && 
      p.role === 'goalkeeper' &&
      !p.isSentOff
    )
    
    let targetY = goalCenterY
    let targetZ = 0
    
    if (goalkeeper) {
      // Aim away from goalkeeper
      const keeperY = goalkeeper.y
      const keeperCoverage = 30 // How much area keeper covers
      
      if (Math.abs(keeperY - goalCenterY) < keeperCoverage) {
        // Keeper is central, aim for corners
        if (player.y < goalCenterY) {
          targetY = goalTop + 20 // Top corner
        } else {
          targetY = goalBottom - 20 // Bottom corner
        }
      } else {
        // Keeper is off-center, aim opposite side
        if (keeperY < goalCenterY) {
          targetY = goalBottom - 30
        } else {
          targetY = goalTop + 30
        }
      }
    }
    
    // Adjust for shot type
    switch (shotType) {
      case 'placed':
        // Precise placement
        targetZ = 20 // Slightly off ground
        break
        
      case 'chip':
        // High trajectory
        targetZ = 80
        targetY = goalCenterY // Center for chips
        break
        
      case 'volley':
        // Keep it low and hard
        targetZ = 30
        break
        
      case 'power':
      default:
        // Aim for power
        targetZ = 40
        // Slightly randomize for power shots
        targetY += (Math.random() - 0.5) * 20
        break
    }
    
    return { x: goalX, y: targetY, z: targetZ }
  }
  
  // Calculate shot physics
  private calculateShotPhysics(
    player: Player,
    target: { x: number; y: number; z: number },
    shotType: 'power' | 'placed' | 'chip' | 'volley',
    dist: number
  ): { vx: number; vy: number; vz: number; spin: { x: number; y: number; z: number } } {
    // Player shot attributes
    const shotPower = player.attributes.strength / 99
    const shotAccuracy = player.attributes.finishing / 99
    const shotTechnique = player.attributes.technique / 99
    const composure = player.attributes.composure / 99
    
    // Base calculations
    const dx = target.x - this.ball.x
    const dy = target.y - this.ball.y
    const horizontalDist = Math.hypot(dx, dy)
    const angle = Math.atan2(dy, dx)
    
    // Shot speed based on type
    let speed = 0
    let vz = 0
    const spin = { x: 0, y: 0, z: 0 }
    
    switch (shotType) {
      case 'power':
        speed = 8 + shotPower * 4
        vz = target.z * 0.05
        spin.x = -2 // Slight topspin
        break
        
      case 'placed':
        speed = 6 + shotTechnique * 2
        vz = target.z * 0.08
        // Side spin for curve
        spin.z = (player.y > target.y ? -1 : 1) * player.attributes.curve / 99 * 3
        break
        
      case 'chip':
        speed = 4 + shotTechnique * 1.5
        // High trajectory for chip
        vz = 3 + dist / 100
        spin.x = 3 // Backspin
        break
        
      case 'volley':
        speed = 9 + shotPower * 3
        vz = -1 // Keep it low
        spin.x = -3 // Heavy topspin
        // Volleys are harder to control
        shotAccuracy *= 0.7
        break
    }
    
    // Pressure affects accuracy
    const pressure = this.calculatePressure(player)
    const pressureMultiplier = 1 - pressure * 0.5
    const effectiveAccuracy = shotAccuracy * composure * pressureMultiplier
    
    // Shot error
    const maxError = Math.PI / 6 // 30 degrees
    const error = (1 - effectiveAccuracy) * maxError * (Math.random() - 0.5)
    const finalAngle = angle + error
    
    // Distance affects power
    const distanceFactor = Math.max(0.6, Math.min(1, 200 / dist))
    speed *= distanceFactor
    
    // Calculate final velocities
    const vx = Math.cos(finalAngle) * speed
    const vy = Math.sin(finalAngle) * speed
    
    // Add some randomness to spin
    spin.x += (Math.random() - 0.5) * 1
    spin.y += (Math.random() - 0.5) * 0.5
    spin.z += (Math.random() - 0.5) * 1
    
    // Special shot modifiers
    if (player.attributes.freekick > 80 && shotType === 'placed') {
      // Free kick specialist can add more curve
      spin.z *= 1.5
    }
    
    if (player.attributes.heading > 80 && this.ball.z > 30) {
      // Good headers add power to aerial shots
      speed *= 1.2
    }
    
    return { vx, vy, vz, spin }
  }

  private executePass(player: Player): void {
    const teammates = this.players.filter(p => p.team === player.team && p !== player && !p.isSentOff)
    
    // Check if under pressure - consider back pass
    const pressure = this.calculatePressure(player)
    const shouldConsiderBackPass = pressure > 0.6
    
    // Advanced pass evaluation
    const passOptions = teammates.map(teammate => {
      const dist = Math.hypot(teammate.x - player.x, teammate.y - player.y)
      const angle = Math.atan2(teammate.y - player.y, teammate.x - player.x)
      
      // Determine if this is a back pass
      const attackingLeft = player.team === 'home'
      const passDirection = Math.cos(angle) * (attackingLeft ? 1 : -1)
      const isBackPass = passDirection < -0.3
      const isSidePass = Math.abs(passDirection) < 0.3
      const isForwardPass = passDirection > 0.3
      
      // Check passing lane
      const opponents = this.players.filter(p => p.team !== player.team && !p.isSentOff)
      let interceptionRisk = 0
      let closestOpponentDist = Infinity
      
      for (const opp of opponents) {
        // Calculate if opponent can intercept
        const oppToLineDistance = this.pointToLineDistance(
          opp.x, opp.y,
          player.x, player.y,
          teammate.x, teammate.y
        )
        
        if (oppToLineDistance < 20) {
          const oppDist = Math.hypot(opp.x - player.x, opp.y - player.y)
          if (oppDist < dist) {
            // Opponent is in the passing lane
            const interceptAbility = opp.attributes.anticipation / 99
            interceptionRisk += (1 - oppToLineDistance / 20) * interceptAbility
            closestOpponentDist = Math.min(closestOpponentDist, oppDist)
          }
        }
      }
      
      // Evaluate pass quality
      const passSuccess = 1 - Math.min(0.9, interceptionRisk)
      const distanceScore = this.evaluatePassDistance(dist)
      const positionScore = this.evaluateTeammatePosition(teammate, player)
      const movementScore = this.evaluateTeammateMovement(teammate, player)
      
      // Boost back pass score when under pressure
      let backPassBonus = 1
      if (shouldConsiderBackPass && isBackPass) {
        backPassBonus = 1.5 // 50% boost for back passes when under pressure
      }
      
      return {
        player: teammate,
        dist,
        angle,
        risk: interceptionRisk,
        isBackPass,
        isSidePass,
        isForwardPass,
        score: passSuccess * distanceScore * positionScore * movementScore * 
               (teammate.attributes.offTheBall / 99) * backPassBonus
      }
    })
    
    // Sort by score
    passOptions.sort((a, b) => b.score - a.score)
    
    // Decision making - sometimes make risky passes
    const decisionQuality = player.attributes.decisions / 99
    const shouldTakeRisk = Math.random() < (1 - decisionQuality) * 0.3
    
    let selectedPass = passOptions[0]
    if (shouldTakeRisk && passOptions.length > 1) {
      // Sometimes choose second best option
      selectedPass = passOptions[Math.random() < 0.7 ? 0 : 1]
    }
    
    if (selectedPass) {
      const target = selectedPass.player
      const passDist = selectedPass.dist
      
      // Pass type based on distance and situation
      const passType = this.determinePassType(passDist, selectedPass.risk, player)
      
      // Calculate pass physics
      const passPhysics = this.calculatePassPhysics(
        player, target, passType, passDist, selectedPass.angle
      )
      
      // Apply pass
      this.ball.vx = passPhysics.vx
      this.ball.vy = passPhysics.vy
      this.ball.vz = passPhysics.vz
      this.ball.spin = passPhysics.spin
      
      // Record pass attempt
      this.gameState.passCount[player.team]++
      this.gameState.matchStats.passesAttempted[player.team]++
      player.consecutiveTouches = 0
      this.ball.lastTouchTime = Date.now()
      
      // Store pass info for tracking completion
      this.ball.lastKicker = player
      this.lastPassTarget = target
      this.lastPassTime = Date.now()
      
      // Store pass type for visual indicators
      this.ball.passType = passType
      this.ball.passDistance = passDist
      this.ball.isBackPass = selectedPass.isBackPass || false
      this.ball.isThroughBall = selectedPass.isForwardPass && target.targetY !== undefined && 
                               Math.abs(target.y - target.targetY) > 30 // Player is making a run
    }
  }
  
  // Calculate distance from point to line
  private pointToLineDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const A = px - x1
    const B = py - y1
    const C = x2 - x1
    const D = y2 - y1
    
    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1
    
    if (lenSq !== 0) {
      param = dot / lenSq
    }
    
    let xx, yy
    
    if (param < 0) {
      xx = x1
      yy = y1
    } else if (param > 1) {
      xx = x2
      yy = y2
    } else {
      xx = x1 + param * C
      yy = y1 + param * D
    }
    
    const dx = px - xx
    const dy = py - yy
    
    return Math.sqrt(dx * dx + dy * dy)
  }
  
  // Evaluate pass distance
  private evaluatePassDistance(dist: number): number {
    if (dist < 30) return 0.4 // Too close
    if (dist < 80) return 0.8 // Short
    if (dist < 150) return 1.0 // Good
    if (dist < 250) return 1.2 // Long - encouraged!
    if (dist < 350) return 1.1 // Very long
    return 0.8 // Extremely long
  }
  
  // Evaluate teammate position
  private evaluateTeammatePosition(teammate: Player, passer: Player): number {
    let score = 1.0
    
    // Heavily penalize teammates near boundaries to prevent ball going out
    const boundaryMargin = 60 // Distance from boundary to consider risky
    const xToBoundary = Math.min(teammate.x, this.config.fieldWidth - teammate.x)
    const yToBoundary = Math.min(teammate.y, this.config.fieldHeight - teammate.y)
    
    if (xToBoundary < boundaryMargin) {
      score *= 0.3 + (xToBoundary / boundaryMargin) * 0.7 // 30-100% based on distance
    }
    if (yToBoundary < boundaryMargin) {
      score *= 0.3 + (yToBoundary / boundaryMargin) * 0.7 // 30-100% based on distance
    }
    
    // Better if teammate is forward
    if (passer.team === 'home') {
      if (teammate.x > passer.x) score *= 1.2
    } else {
      if (teammate.x < passer.x) score *= 1.2
    }
    
    // Better if in space
    const opponents = this.players.filter(p => p.team !== teammate.team && !p.isSentOff)
    const nearestOppDist = Math.min(...opponents.map(opp => 
      Math.hypot(opp.x - teammate.x, opp.y - teammate.y)
    ))
    
    if (nearestOppDist > 50) score *= 1.3
    if (nearestOppDist < 20) score *= 0.5
    
    return score
  }
  
  // Evaluate teammate movement
  private evaluateTeammateMovement(teammate: Player, passer: Player): number {
    const relativeVx = teammate.vx - passer.vx
    const relativeVy = teammate.vy - passer.vy
    const speed = Math.hypot(relativeVx, relativeVy)
    
    // Moving teammates are harder to mark
    if (speed > 2) return 1.2
    if (speed > 1) return 1.1
    return 1.0
  }
  
  // Determine pass type
  private determinePassType(dist: number, risk: number, player: Player): 'ground' | 'lofted' | 'through' {
    if (risk > 0.5 && dist < 200) {
      // High risk, try lofted pass
      return 'lofted'
    }
    
    if (dist > 250) {
      // Long distance, use lofted
      return 'lofted'
    }
    
    if (player.attributes.vision > 80 && risk < 0.3) {
      // Good vision, low risk, try through ball
      return 'through'
    }
    
    return 'ground'
  }
  
  // Calculate pass physics
  private calculatePassPhysics(
    player: Player, 
    target: Player, 
    passType: 'ground' | 'lofted' | 'through',
    dist: number,
    angle: number
  ): { vx: number; vy: number; vz: number; spin: { x: number; y: number; z: number } } {
    const passQuality = (
      player.attributes.passing / 99 * 0.5 +
      player.attributes.technique / 99 * 0.3 +
      player.attributes.vision / 99 * 0.2
    )
    
    // Base pass speed
    let passSpeed = 4 + passQuality * 2
    let vz = 0
    const spin = { x: 0, y: 0, z: 0 }
    
    // Lead the target
    const leadTime = dist / (passSpeed * 40)
    const leadX = target.vx * leadTime * 20
    const leadY = target.vy * leadTime * 20
    
    const targetX = target.x + leadX
    const targetY = target.y + leadY
    const finalDx = targetX - this.ball.x
    const finalDy = targetY - this.ball.y
    const finalDist = Math.hypot(finalDx, finalDy)
    
    // Adjust for pass type
    switch (passType) {
      case 'lofted':
        passSpeed *= 0.8
        vz = 2 + dist / 200 // Higher for longer passes
        spin.z = (Math.random() - 0.5) * 5
        break
        
      case 'through':
        passSpeed *= 1.2
        // Add backspin for better control
        spin.x = -2
        break
        
      case 'ground':
      default:
        // Add slight topspin for ground passes
        spin.x = 1
        break
    }
    
    // Pass error based on quality and pressure
    const pressure = this.calculatePressure(player)
    const errorFactor = (1 - passQuality) * (1 + pressure) * 0.1
    const errorAngle = (Math.random() - 0.5) * errorFactor
    
    // Final velocity
    const finalAngle = Math.atan2(finalDy, finalDx) + errorAngle
    const vx = Math.cos(finalAngle) * passSpeed
    const vy = Math.sin(finalAngle) * passSpeed
    
    // Add curve to passes
    if (player.attributes.curve > 70 && passType === 'ground') {
      spin.z = (Math.random() - 0.5) * 3 * (player.attributes.curve / 99)
    }
    
    return { vx, vy, vz, spin }
  }
  
  // Calculate pressure on player
  private calculatePressure(player: Player): number {
    const opponents = this.players.filter(p => p.team !== player.team && !p.isSentOff)
    let pressure = 0
    
    for (const opp of opponents) {
      const dist = Math.hypot(opp.x - player.x, opp.y - player.y)
      if (dist < 50) {
        pressure += (1 - dist / 50) * (opp.attributes.marking / 99)
      }
    }
    
    return Math.min(1, pressure)
  }
  
  private shouldMakeRun(player: Player, tactic: string): boolean {
    // Don't make runs if player is too far from play
    const ballDist = Math.hypot(this.ball.x - player.x, this.ball.y - player.y)
    if (ballDist > 250) return false
    
    // More likely to make runs with certain tactics
    const tacticBonus = tactic === 'pass-move' ? 0.3 : tactic === 'counter' ? 0.4 : 0
    
    // Off the ball movement quality affects run frequency
    const offBallQuality = player.attributes.offTheBall / 99
    const anticipation = player.attributes.anticipation / 99
    const workRate = player.attributes.workRate / 99
    
    // Role-based run chances
    const roleChance = {
      'striker': 0.15,
      'midfielder': 0.10,
      'defender': 0.05,
      'goalkeeper': 0
    }[player.role] || 0
    
    const runChance = (roleChance + tacticBonus) * offBallQuality * workRate
    
    // Check if there's space to run into
    const hasSpace = this.findSpaceToRun(player) !== null
    
    return hasSpace && Math.random() < runChance
  }
  
  private findSpaceToRun(player: Player): { x: number, y: number } | null {
    const teammates = this.players.filter(p => p.team === player.team && p !== player && !p.isSentOff)
    const opponents = this.players.filter(p => p.team !== player.team && !p.isSentOff)
    
    // Attacking direction
    const attackingLeft = player.team === 'home'
    const attackDirection = attackingLeft ? 1 : -1
    
    // Look for spaces in dangerous areas
    const candidateSpaces: { x: number, y: number, score: number }[] = []
    
    // Search grid based on player position
    const searchRadius = 150
    const steps = 8
    
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2
      const distance = 50 + Math.random() * 100
      
      const targetX = player.x + Math.cos(angle) * distance
      const targetY = player.y + Math.sin(angle) * distance
      
      // Keep within bounds
      if (targetX < 20 || targetX > this.config.fieldWidth - 20 ||
          targetY < 20 || targetY > this.config.fieldHeight - 20) {
        continue
      }
      
      // Check space quality
      let spaceScore = 1
      
      // Prefer forward runs
      const forwardBonus = Math.cos(angle) * attackDirection
      spaceScore += forwardBonus * 0.5
      
      // Check distance from opponents
      for (const opp of opponents) {
        const oppDist = Math.hypot(opp.x - targetX, opp.y - targetY)
        if (oppDist < 40) {
          spaceScore -= (40 - oppDist) / 40
        }
      }
      
      // Check distance from teammates (avoid crowding)
      for (const tm of teammates) {
        const tmDist = Math.hypot(tm.x - targetX, tm.y - targetY)
        if (tmDist < 30) {
          spaceScore -= (30 - tmDist) / 30 * 0.5
        }
      }
      
      // Prefer spaces that can receive passes
      const passingLaneClear = this.checkPassingLane(player.x, player.y, targetX, targetY, opponents)
      if (!passingLaneClear) {
        spaceScore *= 0.3
      }
      
      if (spaceScore > 0) {
        candidateSpaces.push({ x: targetX, y: targetY, score: spaceScore })
      }
    }
    
    // Return best space
    if (candidateSpaces.length > 0) {
      candidateSpaces.sort((a, b) => b.score - a.score)
      return candidateSpaces[0]
    }
    
    return null
  }
  
  private checkPassingLane(x1: number, y1: number, x2: number, y2: number, opponents: Player[]): boolean {
    for (const opp of opponents) {
      const dist = this.pointToLineDistance(opp.x, opp.y, x1, y1, x2, y2)
      if (dist < 20) {
        const oppDist = Math.hypot(opp.x - x1, opp.y - y1)
        const targetDist = Math.hypot(x2 - x1, y2 - y1)
        if (oppDist < targetDist) {
          return false
        }
      }
    }
    return true
  }
  
  private makeIntelligentRun(player: Player, tactic: string): void {
    const space = this.findSpaceToRun(player)
    if (!space) return
    
    // Sprint into space
    const runSpeed = 1.5 // Faster than normal movement
    const anticipation = player.attributes.anticipation / 99
    
    // Add some curve to the run for realism
    const directAngle = Math.atan2(space.y - player.y, space.x - player.x)
    const curveAmount = 0.3 * (1 - anticipation)
    
    player.targetX = space.x + Math.cos(directAngle + Math.PI/2) * curveAmount * 20
    player.targetY = space.y + Math.sin(directAngle + Math.PI/2) * curveAmount * 20
  }

  // Ball physics update
  private updateBallPhysics(deltaTime: number): void {
    // Check if ball should no longer be stationary
    if (this.ball.isStationary && !this.gameState.ballOut) {
      const ballSpeed = Math.hypot(this.ball.vx, this.ball.vy)
      if (ballSpeed > 0.1) { // Lower threshold to detect movement sooner
        this.ball.isStationary = false
        console.log('Ball is no longer stationary - speed:', ballSpeed)
      }
      
      // Force ball to stop being stationary during kickoff after 2 seconds
      const isKickoffTime = this.gameState.gameTime > 1200000 - 5000
      if (isKickoffTime && this.ball.isStationary) {
        const timeSinceStart = 1200000 - this.gameState.gameTime
        if (timeSinceStart > 2000) {
          console.log('Forcing ball to be non-stationary during kickoff')
          this.ball.isStationary = false
        }
      }
    }
    
    if (!this.ball.possessor && !this.gameState.ballOut && !this.ball.isStationary) {
      const dt = deltaTime * 60 * this.gameState.gameSpeed
      
      // Update air time
      if (this.ball.z > 0.1) {
        this.ball.airTime += dt
      } else {
        this.ball.airTime = 0
      }
      
      // Apply spin effects on ball trajectory (Magnus effect)
      const spinFactor = 0.01
      this.ball.vx += this.ball.spin.y * spinFactor * dt
      this.ball.vy -= this.ball.spin.x * spinFactor * dt
      
      // Update position
      this.ball.x += this.ball.vx * dt
      this.ball.y += this.ball.vy * dt
      this.ball.z += this.ball.vz * dt
      
      // Prevent ball from getting stuck in dangerous areas
      const cornerRadius = 40
      const goalAreaDepth = 60
      const centerX = this.config.fieldWidth / 2
      const centerY = this.config.fieldHeight / 2
      
      // Check if ball is in corner
      const isInCorner = (
        (this.ball.x < cornerRadius || this.ball.x > this.config.fieldWidth - cornerRadius) &&
        (this.ball.y < cornerRadius || this.ball.y > this.config.fieldHeight - cornerRadius)
      )
      
      // Check if ball is stuck behind goal
      const isBehindGoal = (
        this.ball.x < 0 || this.ball.x > this.config.fieldWidth ||
        (this.ball.x < goalAreaDepth && (this.ball.y < centerY - this.config.goalWidth || this.ball.y > centerY + this.config.goalWidth)) ||
        (this.ball.x > this.config.fieldWidth - goalAreaDepth && (this.ball.y < centerY - this.config.goalWidth || this.ball.y > centerY + this.config.goalWidth))
      )
      
      // If ball is in dangerous area and moving slowly, give it a push towards center
      if ((isInCorner || isBehindGoal) && Math.hypot(this.ball.vx, this.ball.vy) < 2) {
        const pushDirection = {
          x: (centerX - this.ball.x) / Math.hypot(centerX - this.ball.x, centerY - this.ball.y),
          y: (centerY - this.ball.y) / Math.hypot(centerX - this.ball.x, centerY - this.ball.y)
        }
        
        this.ball.vx += pushDirection.x * 3
        this.ball.vy += pushDirection.y * 3
        
        if (this.ball.z < 0.5) {
          this.ball.vz = 1 // Small bounce to help clear obstacles
        }
        
        console.log('Ball in dangerous area - applying preventive push')
      }
      
      // Enhanced gravity with realistic acceleration
      if (this.ball.z > 0) {
        this.ball.vz -= 0.6 * dt // stronger gravity for more realistic feel
      }
      
      // Enhanced ball bounce with surface interaction
      if (this.ball.z <= 0 && this.ball.vz < 0) {
        this.ball.z = 0
        
        // Calculate bounce intensity based on impact speed
        const impactSpeed = Math.abs(this.ball.vz)
        const bounceCoefficient = Math.max(0.3, 0.7 - this.ball.bounceCount * 0.1) // decreasing bounces
        
        this.ball.vz = impactSpeed * bounceCoefficient
        this.ball.bounceCount++
        this.ball.lastBounceTime = Date.now()
        
        // Surface friction affects horizontal velocity on bounce
        // Less friction loss for futsal balls
        const surfaceFriction = 0.95
        this.ball.vx *= surfaceFriction
        this.ball.vy *= surfaceFriction
        
        // Add realistic spin on bounce
        this.ball.spin.z += (Math.random() - 0.5) * 8
        this.ball.spin.x += this.ball.vy * 0.3
        this.ball.spin.y -= this.ball.vx * 0.3
      }
      
      // Futsal ball physics - different behavior in air vs ground
      const currentSpeed = Math.hypot(this.ball.vx, this.ball.vy)
      
      if (this.ball.z > 0.5) {
        // Air resistance (less friction in air)
        const airResistance = 0.98
        this.ball.vx *= airResistance
        this.ball.vy *= airResistance
      } else {
        // Ground friction - more realistic rolling
        // Futsal balls have less friction than regular soccer balls
        let groundFriction: number
        if (currentSpeed > 5) {
          groundFriction = 0.985 // Very fast - minimal friction
        } else if (currentSpeed > 3) {
          groundFriction = 0.98 // Fast rolling
        } else if (currentSpeed > 1) {
          groundFriction = 0.975 // Medium rolling
        } else if (currentSpeed > 0.5) {
          groundFriction = 0.97 // Slow rolling
        } else {
          groundFriction = 0.95 // Very slow - more friction to stop
        }
        
        this.ball.vx *= groundFriction
        this.ball.vy *= groundFriction
        
        // Rolling physics - convert velocity to spin
        if (currentSpeed > 0.1) {
          this.ball.spin.x = -this.ball.vy * 0.4
          this.ball.spin.y = this.ball.vx * 0.4
        }
        
        // Add tiny random variations for more natural movement
        if (currentSpeed > 0.5 && currentSpeed < 4) {
          this.ball.vx += (Math.random() - 0.5) * 0.02
          this.ball.vy += (Math.random() - 0.5) * 0.02
        }
      }
      
      // Spin decay (different rates for different spin types)
      this.ball.spin.x *= 0.94
      this.ball.spin.y *= 0.94
      this.ball.spin.z *= 0.88 // side spin decays faster
      
      // Check if ball is essentially stopped
      const totalSpeed = Math.hypot(this.ball.vx, this.ball.vy, this.ball.vz)
      if (totalSpeed < 0.05 && this.ball.z < 0.1) { // Lower threshold - let it roll longer
        this.ball.vx = 0
        this.ball.vy = 0
        this.ball.vz = 0
        this.ball.z = 0
        this.ball.spin = { x: 0, y: 0, z: 0 }
        this.ball.bounceCount = 0
        this.ball.airTime = 0
        
        // If ball stops and players are crowding it, give it a small random kick
        const nearbyPlayers = this.players.filter(p => {
          const dist = Math.hypot(p.x - this.ball.x, p.y - this.ball.y)
          return dist < 20 && !p.isMovingToRestart
        })
        
        if (nearbyPlayers.length >= 3) {
          const randomAngle = Math.random() * Math.PI * 2
          const escapeSpeed = 2 + Math.random() * 2
          this.ball.vx = Math.cos(randomAngle) * escapeSpeed
          this.ball.vy = Math.sin(randomAngle) * escapeSpeed
          this.ball.vz = 0.5 + Math.random() * 1
        }
      }
    }
    
    // Ball stuck detection (works for all ball states)
    this.checkBallStuck(deltaTime)
    
    if (!this.ball.possessor && !this.gameState.ballOut && !this.ball.isStationary) {
      // First touch mechanics
      this.handleFirstTouch()
      
      // Ball out of bounds check
      this.checkBallOutOfBounds()
      
      // Ball contests
      this.handleBallContests()
    }
  }

  private checkBallStuck(deltaTime: number): void {
    // Skip stuck detection during restarts or when ball is possessed
    if (this.ball.possessor || this.gameState.ballOut) {
      this.ball.stuckCheckTimer = 0
      this.lastBallPosition = { x: this.ball.x, y: this.ball.y }
      return
    }
    
    // Special handling for kickoff - more aggressive stuck detection
    const isKickoffTime = this.gameState.gameTime > 1200000 - 5000 // First 5 seconds
    if (isKickoffTime && this.ball.isStationary) {
      this.ball.stuckCheckTimer += deltaTime * 2 // Accelerate stuck detection during kickoff
    }
    
    const currentTime = this.gameState.gameTime
    const ballSpeed = Math.hypot(this.ball.vx, this.ball.vy, this.ball.vz)
    const ballMovement = Math.hypot(
      this.ball.x - this.lastBallPosition.x, 
      this.ball.y - this.lastBallPosition.y
    )
    
    // If ball is moving significantly, reset timers
    if (ballSpeed > 0.5 || ballMovement > 2) {
      this.ball.lastMovementTime = currentTime
      this.ball.stuckCheckTimer = 0
      this.lastBallPosition = { x: this.ball.x, y: this.ball.y }
      return
    }
    
    // Accumulate stuck time
    this.ball.stuckCheckTimer += deltaTime
    
    // Multi-tier stuck resolution system
    
    // Tier 1: Small repel (300ms)
    if (this.ball.stuckCheckTimer > 0.3 && this.ball.stuckCheckTimer <= 0.31) {
      console.log('Ball stuck Tier 1: Small repel')
      this.repelBallFromStrongestPlayer(3) // Small force
    }
    
    // Tier 2: Medium repel (600ms)
    else if (this.ball.stuckCheckTimer > 0.6 && this.ball.stuckCheckTimer <= 0.61) {
      console.log('Ball stuck Tier 2: Medium repel')
      this.repelBallFromStrongestPlayer(6) // Medium force
    }
    
    // Tier 3: Strong repel with random direction (900ms)
    else if (this.ball.stuckCheckTimer > 0.9 && this.ball.stuckCheckTimer <= 0.91) {
      console.log('Ball stuck Tier 3: Strong random repel')
      this.repelBallRandomDirection(8) // Strong force
    }
    
    // Tier 4: Teleport to empty space (1.2 seconds)
    else if (this.ball.stuckCheckTimer > 1.2 && this.ball.stuckCheckTimer <= 1.21) {
      console.log('Ball stuck Tier 4: Teleport to empty space')
      this.moveBallToEmptySpace()
    }
    
    // Tier 5: Emergency reset to center (1.5 seconds)
    else if (this.ball.stuckCheckTimer > 1.5) {
      console.log('Ball stuck Tier 5: Emergency reset to center')
      this.emergencyBallReset()
      this.ball.stuckCheckTimer = 0
    }
    
    // Update last position for movement detection
    if (this.ball.stuckCheckTimer % 0.1 < deltaTime) {
      this.lastBallPosition = { x: this.ball.x, y: this.ball.y }
    }
  }

  private repelBallFromStrongestPlayer(force: number = 5): void {
    // Find all players near the ball
    const nearbyPlayers = this.players.filter(p => {
      const dist = Math.hypot(p.x - this.ball.x, p.y - this.ball.y)
      return dist < 50 && !p.isSentOff && !p.isMovingToRestart
    })
    
    if (nearbyPlayers.length === 0) {
      // No players nearby, give ball random kick
      const randomAngle = Math.random() * Math.PI * 2
      this.ball.vx = Math.cos(randomAngle) * 3
      this.ball.vy = Math.sin(randomAngle) * 3
      this.ball.vz = 1
      return
    }
    
    // Calculate player strengths
    const playerStrengths = nearbyPlayers.map(p => ({
      player: p,
      strength: (
        p.attributes.strength / 99 * 0.3 +
        p.attributes.determination / 99 * 0.2 +
        p.attributes.agility / 99 * 0.2 +
        p.attributes.technique / 99 * 0.15 +
        p.attributes.balance / 99 * 0.15
      ),
      distance: Math.hypot(p.x - this.ball.x, p.y - this.ball.y)
    }))
    
    // Sort by strength (strongest first)
    playerStrengths.sort((a, b) => b.strength - a.strength)
    
    const strongest = playerStrengths[0]
    const secondStrongest = playerStrengths.length > 1 ? playerStrengths[1] : null
    
    let repelDirection: { x: number; y: number }
    
    // Check if we have a clear strongest player or if it's equal strength
    if (!secondStrongest || Math.abs(strongest.strength - secondStrongest.strength) > 0.1) {
      // Repel away from strongest player
      const dx = this.ball.x - strongest.player.x
      const dy = this.ball.y - strongest.player.y
      const dist = Math.hypot(dx, dy)
      
      if (dist > 0) {
        repelDirection = { x: dx / dist, y: dy / dist }
      } else {
        // Players on top of ball, use random direction
        const angle = Math.random() * Math.PI * 2
        repelDirection = { x: Math.cos(angle), y: Math.sin(angle) }
      }
    } else {
      // Equal strength - 50/50 random direction
      const angle = Math.random() * Math.PI * 2
      repelDirection = { x: Math.cos(angle), y: Math.sin(angle) }
    }
    
    // Apply repel force
    const repelPower = force + Math.random() * 2
    this.ball.vx = repelDirection.x * repelPower
    this.ball.vy = repelDirection.y * repelPower
    this.ball.vz = Math.min(force * 0.3, 2) + Math.random() * 0.5
    
    // Clear possession
    this.ball.possessor = null
    this.ball.bounceCount = 0
    this.ball.isStationary = false
    
    console.log(`Ball repelled with force ${force} from stuck position. Direction: (${repelDirection.x.toFixed(2)}, ${repelDirection.y.toFixed(2)})`)
  }
  
  private repelBallRandomDirection(force: number = 5): void {
    // Generate random direction biased towards open field areas
    const centerX = this.config.fieldWidth / 2
    const centerY = this.config.fieldHeight / 2
    
    // Bias towards center when near edges
    let targetX = centerX + (Math.random() - 0.5) * 200
    let targetY = centerY + (Math.random() - 0.5) * 150
    
    // If ball is near edge, strongly bias towards center
    if (this.ball.x < 50 || this.ball.x > this.config.fieldWidth - 50) {
      targetX = centerX
    }
    if (this.ball.y < 50 || this.ball.y > this.config.fieldHeight - 50) {
      targetY = centerY
    }
    
    const dirX = targetX - this.ball.x
    const dirY = targetY - this.ball.y
    const dist = Math.hypot(dirX, dirY)
    
    if (dist > 0) {
      this.ball.vx = (dirX / dist) * force
      this.ball.vy = (dirY / dist) * force
      this.ball.vz = Math.min(force * 0.2, 2) // Higher bounce for random direction
    } else {
      // Fallback to pure random
      const angle = Math.random() * Math.PI * 2
      this.ball.vx = Math.cos(angle) * force
      this.ball.vy = Math.sin(angle) * force
      this.ball.vz = 1
    }
    
    this.ball.possessor = null
    this.ball.isStationary = false
    this.ball.bounceCount = 0
    
    console.log(`Ball repelled in random direction with force ${force}`)
  }
  
  private emergencyBallReset(): void {
    // Emergency reset - place ball at center with small random offset
    const centerX = this.config.fieldWidth / 2
    const centerY = this.config.fieldHeight / 2
    
    this.ball.x = centerX + (Math.random() - 0.5) * 40
    this.ball.y = centerY + (Math.random() - 0.5) * 40
    this.ball.z = 0
    this.ball.vx = (Math.random() - 0.5) * 4
    this.ball.vy = (Math.random() - 0.5) * 4
    this.ball.vz = 0
    this.ball.possessor = null
    this.ball.isStationary = false
    this.ball.lastMovementTime = this.gameState.gameTime
    this.ball.bounceCount = 0
    
    // Push nearby players away slightly
    this.players.forEach(player => {
      const dist = Math.hypot(player.x - this.ball.x, player.y - this.ball.y)
      if (dist < 50 && !player.isSentOff) {
        const pushDir = {
          x: (player.x - this.ball.x) / Math.max(dist, 1),
          y: (player.y - this.ball.y) / Math.max(dist, 1)
        }
        player.x += pushDir.x * 30
        player.y += pushDir.y * 30
        player.targetX = player.x
        player.targetY = player.y
      }
    })
    
    console.log('Emergency ball reset executed - ball placed at center')
  }

  private moveBallToEmptySpace(): void {
    // Find empty space away from all players
    const minDistanceFromPlayers = 40 // Minimum distance from any player
    const fieldMargin = 30 // Stay away from field edges
    
    let bestPosition: { x: number; y: number } | null = null
    let maxMinDistance = 0
    
    // Try multiple random positions and pick the one furthest from all players
    for (let attempts = 0; attempts < 50; attempts++) {
      const candidateX = fieldMargin + Math.random() * (this.config.fieldWidth - 2 * fieldMargin)
      const candidateY = fieldMargin + Math.random() * (this.config.fieldHeight - 2 * fieldMargin)
      
      // Find distance to nearest player
      let minDistanceToPlayer = Number.MAX_VALUE
      for (const player of this.players) {
        if (player.isSentOff || player.isMovingToRestart) continue
        const distance = Math.hypot(candidateX - player.x, candidateY - player.y)
        minDistanceToPlayer = Math.min(minDistanceToPlayer, distance)
      }
      
      // If this position is better (further from nearest player), save it
      if (minDistanceToPlayer > maxMinDistance) {
        maxMinDistance = minDistanceToPlayer
        bestPosition = { x: candidateX, y: candidateY }
      }
      
      // If we found a position with sufficient clearance, use it
      if (minDistanceToPlayer >= minDistanceFromPlayers) {
        break
      }
    }
    
    // If no good position found, just use center field
    if (!bestPosition || maxMinDistance < 20) {
      bestPosition = { 
        x: this.config.fieldWidth / 2, 
        y: this.config.fieldHeight / 2 
      }
    }
    
    // Move ball to the empty space with a gentle bounce
    this.ball.x = bestPosition.x
    this.ball.y = bestPosition.y
    this.ball.z = 0
    this.ball.vx = 0
    this.ball.vy = 0
    this.ball.vz = 0.5 // Small bounce to show the ball moved
    this.ball.possessor = null
    this.ball.bounceCount = 0
    this.ball.isStationary = false
    this.ball.spin = { x: 0, y: 0, z: 0 }
    
    console.log(`Ball moved to empty space at (${bestPosition.x.toFixed(1)}, ${bestPosition.y.toFixed(1)}) - min distance from players: ${maxMinDistance.toFixed(1)}`)
  }

  private handleFirstTouch(): void {
    const ballSpeed = Math.hypot(this.ball.vx, this.ball.vy)
    if (ballSpeed > 1) {
      const receivingPlayer = this.players.find(p => {
        const dist = Math.hypot(p.x - this.ball.x, p.y - this.ball.y)
        // Check both lastKicker and restartTaker
        return dist < p.radius + this.ball.radius && p !== this.ball.lastKicker && p !== this.ball.restartTaker
      })
      
      if (receivingPlayer) {
        const firstTouchQuality = (
          receivingPlayer.attributes.firstTouch / 99 * 0.5 +
          receivingPlayer.attributes.technique / 99 * 0.3 +
          receivingPlayer.attributes.composure / 99 * 0.2
        )
        
        // Check if this is a completed pass
        if (this.ball.lastKicker && this.lastPassTarget && this.lastPassTime) {
          const timeSincePass = Date.now() - this.lastPassTime
          if (timeSincePass < 3000) { // Within 3 seconds
            if (receivingPlayer === this.lastPassTarget && receivingPlayer.team === this.ball.lastKicker.team) {
              // Pass completed successfully to intended target
              this.gameState.matchStats.passesCompleted[receivingPlayer.team]++
            } else if (receivingPlayer.team === this.ball.lastKicker.team) {
              // Pass completed to teammate (not intended target but still successful)
              this.gameState.matchStats.passesCompleted[receivingPlayer.team]++
            }
            // Clear pass tracking
            this.lastPassTarget = null
            this.lastPassTime = null
          }
        }
        
        // Clear pass indicators when ball is received
        this.ball.passType = undefined
        this.ball.passDistance = undefined
        this.ball.isBackPass = undefined
        this.ball.isThroughBall = undefined
        
        if (Math.random() > firstTouchQuality) {
          const errorAngle = Math.random() * Math.PI * 2
          const errorDistance = (1 - firstTouchQuality) * 30
          this.ball.vx = Math.cos(errorAngle) * errorDistance * 0.2
          this.ball.vy = Math.sin(errorAngle) * errorDistance * 0.2
        } else {
          this.ball.vx *= firstTouchQuality * 0.1
          this.ball.vy *= firstTouchQuality * 0.1
          this.ball.possessor = receivingPlayer
          this.ball.lastKicker = receivingPlayer
          this.gameState.possession = receivingPlayer.team
          
          // Clear restart taker once another player touches the ball
          if (this.ball.restartTaker) {
            this.ball.restartTaker = null
          }
        }
      }
    }
  }


  private handleBallContests(): void {
    // Don't handle ball contests during restarts or when ball is stationary
    if (this.ball.isStationary || this.gameState.ballOut) return
    
    // Check if we're in a kickoff situation - prevent contests for 3 seconds
    if (this.gameState.gameTime > 1200000 - 3000) { // First 3 seconds of half
      return
    }
    
    const playersNearBall = this.players.filter(p => {
      const dist = Math.hypot(p.x - this.ball.x, p.y - this.ball.y)
      // Reduced radius to prevent constant clustering
      return dist < p.radius + this.ball.radius + 5 && !p.isMovingToRestart
    })
    
    if (playersNearBall.length >= 2 && !this.ball.possessor) {
      const playerStrengths = playersNearBall.map(p => ({
        player: p,
        strength: (
          p.attributes.strength / 99 * 0.25 +
          p.attributes.balance / 99 * 0.15 +
          p.attributes.determination / 99 * 0.15 +
          p.attributes.agility / 99 * 0.15 +
          p.attributes.technique / 99 * 0.15 +
          p.stamina / p.maxStamina * 0.15
        ),
        distance: Math.hypot(p.x - this.ball.x, p.y - this.ball.y)
      }))
      
      playerStrengths.sort((a, b) => b.strength - a.strength)
      
      const strongest = playerStrengths[0]
      const secondStrongest = playerStrengths[1]
      
      const strengthDiff = Math.abs(strongest.strength - secondStrongest.strength)
      const isEqualStrength = strengthDiff < 0.1
      
      // Reduce contest frequency to prevent constant clustering
      if ((isEqualStrength || Math.random() < 0.2) && playersNearBall.length <= 4) {
        const angle = Math.atan2(
          this.ball.y - (strongest.player.y + secondStrongest.player.y) / 2,
          this.ball.x - (strongest.player.x + secondStrongest.player.x) / 2
        )
        
        // Stronger ball repel force to clear congestion
        const repelPower = 6 + playersNearBall.length * 2
        this.ball.vx = Math.cos(angle) * repelPower
        this.ball.vy = Math.sin(angle) * repelPower
        this.ball.vz = Math.max(1, repelPower * 0.3) // Add some height to clear players
        this.ball.possessor = null
        this.ball.bounceCount = 0 // Reset bounce count for new trajectory
        
        // Push players away more forcefully
        playersNearBall.forEach((p, i) => {
          const pushAngle = (Math.PI * 2 * i) / playersNearBall.length
          const pushDistance = 8 + Math.random() * 5 // More variable push distance
          p.x += Math.cos(pushAngle) * pushDistance
          p.y += Math.sin(pushAngle) * pushDistance
          
          // Keep players in bounds (including buffer zone)
          const buffer = this.config.fieldBuffer || 0
          p.x = Math.max(p.radius - buffer, Math.min(this.config.fieldWidth + buffer - p.radius, p.x))
          p.y = Math.max(p.radius - buffer, Math.min(this.config.fieldHeight + buffer - p.radius, p.y))
        })
      } else {
        const winner = strongest.player
        // Only award possession if player is very close and not part of a big crowd
        if (strongest.distance < winner.radius + this.ball.radius + 1 && playersNearBall.length <= 3) {
          this.ball.possessor = winner
          this.ball.lastKicker = winner
          this.gameState.possession = winner.team
          this.ball.isStationary = false
        }
      }
    }
  }

  // Player collision handling
  private updatePlayerCollisions(): void {
    // Sort players by their x position for optimization
    const sortedPlayers = [...this.players].sort((a, b) => a.x - b.x)
    
    for (let i = 0; i < sortedPlayers.length; i++) {
      const player = sortedPlayers[i]
      if (player.isSentOff) continue
      
      for (let j = i + 1; j < sortedPlayers.length; j++) {
        const otherPlayer = sortedPlayers[j]
        if (otherPlayer.isSentOff) continue
        
        // Early exit if players are too far apart
        if (otherPlayer.x - player.x > player.radius + otherPlayer.radius) break
        
        const dx = player.x - otherPlayer.x
        const dy = player.y - otherPlayer.y
        const distance = Math.hypot(dx, dy)
        const minDistance = player.radius + otherPlayer.radius
        
        if (distance < minDistance && distance > 0) {
          // Calculate collision properties
          const nx = dx / distance // Normal vector
          const ny = dy / distance
          
          // Player physical attributes affect collision
          const p1Mass = 70 + (player.attributes.strength / 99) * 20 // 70-90kg
          const p2Mass = 70 + (otherPlayer.attributes.strength / 99) * 20
          const p1Balance = player.attributes.balance / 99
          const p2Balance = otherPlayer.attributes.balance / 99
          
          // Check if this could be a foul
          const relativeSpeed = Math.hypot(player.vx - otherPlayer.vx, player.vy - otherPlayer.vy)
          const impactForce = relativeSpeed * (p1Mass + p2Mass) / 2
          const isSlideTackle = player.isSliding || otherPlayer.isSliding
          
          // Foul detection
          if (this.checkForFoul(player, otherPlayer, impactForce, isSlideTackle)) {
            // Foul occurred, handle it
            this.handleFoul(player, otherPlayer, { x: (player.x + otherPlayer.x) / 2, y: (player.y + otherPlayer.y) / 2 })
          }
          
          // Separate overlapping players
          const overlap = minDistance - distance
          const totalMass = p1Mass + p2Mass
          const pushRatio1 = p2Mass / totalMass
          const pushRatio2 = p1Mass / totalMass
          
          player.x += nx * overlap * pushRatio1
          player.y += ny * overlap * pushRatio1
          otherPlayer.x -= nx * overlap * pushRatio2
          otherPlayer.y -= ny * overlap * pushRatio2
          
          // Calculate collision response
          const vrel = (player.vx - otherPlayer.vx) * nx + (player.vy - otherPlayer.vy) * ny
          
          if (vrel > 0) {
            // Players moving towards each other
            const restitution = 0.3 // Low restitution for player collisions
            const impulse = 2 * vrel / (1/p1Mass + 1/p2Mass) * (1 + restitution)
            
            // Apply impulse with balance consideration
            const balanceMultiplier1 = 0.5 + p1Balance * 0.5
            const balanceMultiplier2 = 0.5 + p2Balance * 0.5
            
            player.vx -= impulse * nx / p1Mass * balanceMultiplier1
            player.vy -= impulse * ny / p1Mass * balanceMultiplier1
            otherPlayer.vx += impulse * nx / p2Mass * balanceMultiplier2
            otherPlayer.vy += impulse * ny / p2Mass * balanceMultiplier2
            
            // Players might lose balance if hit hard
            if (impactForce > 150 && Math.random() > p1Balance) {
              player.vx *= 0.3
              player.vy *= 0.3
            }
            if (impactForce > 150 && Math.random() > p2Balance) {
              otherPlayer.vx *= 0.3
              otherPlayer.vy *= 0.3
            }
          }
        }
      }
    }
  }
  
  // Check if collision results in a foul
  private checkForFoul(player1: Player, player2: Player, impactForce: number, isSlideTackle: boolean): boolean {
    // Return false if fouls are disabled
    if (!this.foulsEnabled) {
      return false
    }
    
    // No fouls if ball is very close (fighting for the ball) - increased radius
    const ballDist1 = Math.hypot(this.ball.x - player1.x, this.ball.y - player1.y)
    const ballDist2 = Math.hypot(this.ball.x - player2.x, this.ball.y - player2.y)
    const ballNearby = Math.min(ballDist1, ballDist2) < 50 // Increased to 50
    
    if (ballNearby && !isSlideTackle) {
      // Normal challenge for the ball, very unlikely to be a foul
      return impactForce > 300 && Math.random() < 0.02 // Reduced to 2% chance
    }
    
    // Slide tackles more likely to be fouls but still reduced
    if (isSlideTackle) {
      const tacklingPlayer = player1.isSliding ? player1 : player2
      const tackleQuality = tacklingPlayer.attributes.tackling / 99
      const foulChance = 0.15 - tackleQuality * 0.1 // Reduced significantly
      return Math.random() < foulChance
    }
    
    // High impact collisions - much higher threshold
    if (impactForce > 300) { // Increased to 300
      return Math.random() < 0.05 // Reduced to 5% chance
    }
    
    return false
  }
  
  // Handle foul
  private handleFoul(foulingPlayer: Player, fouledPlayer: Player, position: { x: number; y: number }): void {
    const currentTime = Date.now()
    
    // Prevent multiple fouls in quick succession - increased cooldown
    if (this.gameState.lastFoulTime && currentTime - this.gameState.lastFoulTime < 3000) {
      return
    }
    
    this.gameState.lastFoulTime = currentTime
    this.gameState.fouls[foulingPlayer.team]++
    this.gameState.accumulatedFouls[foulingPlayer.team]++
    
    // Check for card
    const severity = Math.random()
    if (severity > 0.9 || (foulingPlayer.yellowCards > 0 && severity > 0.7)) {
      // Red card or second yellow
      foulingPlayer.isSentOff = true
      if (foulingPlayer.yellowCards > 0) {
        // Second yellow
        foulingPlayer.yellowCards++
        this.gameState.matchStats.yellowCards[foulingPlayer.team]++
      }
      this.gameState.matchStats.redCards[foulingPlayer.team]++
    } else if (severity > 0.6) {
      // Yellow card
      foulingPlayer.yellowCards++
      this.gameState.matchStats.yellowCards[foulingPlayer.team]++
    }
    
    // Set up free kick or penalty
    const inPenaltyArea = this.isInPenaltyArea(position, fouledPlayer.team === 'home' ? 'away' : 'home')
    
    if (inPenaltyArea) {
      this.gameState.restartType = 'penalty'
      this.gameState.restartTeam = fouledPlayer.team
      this.gameState.restartPosition = {
        x: fouledPlayer.team === 'home' ? this.config.fieldWidth - 120 : 120,
        y: this.config.fieldHeight / 2
      }
    } else {
      this.gameState.restartType = 'free-kick'
      this.gameState.restartTeam = fouledPlayer.team
      this.gameState.restartPosition = position
    }
    
    // Stop the ball
    this.ball.vx = 0
    this.ball.vy = 0
    this.ball.vz = 0
    this.ball.possessor = null
    this.gameState.ballOut = true
    
    // Move players away from the restart position
    setTimeout(() => {
      this.setupFreeKick()
    }, 500)
  }
  
  // Check if position is in penalty area
  private isInPenaltyArea(position: { x: number; y: number }, team: 'home' | 'away'): boolean {
    const penaltyWidth = 120
    const penaltyHeight = 80
    const penaltyY = (this.config.fieldHeight - penaltyHeight) / 2
    
    if (team === 'home') {
      return position.x <= penaltyWidth && 
             position.y >= penaltyY && 
             position.y <= penaltyY + penaltyHeight
    } else {
      return position.x >= this.config.fieldWidth - penaltyWidth && 
             position.y >= penaltyY && 
             position.y <= penaltyY + penaltyHeight
    }
  }
  
  // Setup free kick positioning
  private setupFreeKick(): void {
    if (!this.gameState.restartPosition || !this.gameState.restartTeam) return
    
    
    // Place ball at free kick position
    this.ball.x = this.gameState.restartPosition.x
    this.ball.y = this.gameState.restartPosition.y
    this.ball.z = 0
    this.ball.vx = 0
    this.ball.vy = 0
    this.ball.vz = 0
    this.ball.isStationary = true
    
    // Find best player to take the free kick
    const eligiblePlayers = this.players.filter(p => 
      p.team === this.gameState.restartTeam && !p.isSentOff
    )
    
    // Sort by free kick attribute and distance
    const freeKickTaker = eligiblePlayers.sort((a, b) => {
      const aDist = Math.hypot(a.x - this.ball.x, a.y - this.ball.y)
      const bDist = Math.hypot(b.x - this.ball.x, b.y - this.ball.y)
      // Prefer players with better freekick skill who are also close
      return (bDist + (99 - b.attributes.freekick)) - (aDist + (99 - a.attributes.freekick))
    })[0]
    
    if (freeKickTaker) {
      
      // Set the taker to move to the ball
      freeKickTaker.isMovingToRestart = true
      freeKickTaker.restartRole = 'taker'
      
      // Position close to the ball
      const goalX = freeKickTaker.team === 'home' ? this.config.fieldWidth : 0
      const angleToGoal = Math.atan2(this.config.fieldHeight / 2 - this.ball.y, goalX - this.ball.x)
      
      // Position just behind the ball, close enough to take the kick
      const kickDistance = 12 // Close enough to satisfy the kick distance check
      freeKickTaker.restartTarget = {
        x: this.ball.x - Math.cos(angleToGoal) * kickDistance,
        y: this.ball.y - Math.sin(angleToGoal) * kickDistance
      }
      
      
      // Keep in bounds (no buffer for free kicks - must be inside field)
      freeKickTaker.restartTarget.x = Math.max(freeKickTaker.radius, Math.min(this.config.fieldWidth - freeKickTaker.radius, freeKickTaker.restartTarget.x))
      freeKickTaker.restartTarget.y = Math.max(freeKickTaker.radius, Math.min(this.config.fieldHeight - freeKickTaker.radius, freeKickTaker.restartTarget.y))
      
      // Track for stats
      this.lastFreeKickTaker = freeKickTaker
    }
    
    // Move opposing players away gradually
    const minDistance = this.gameState.restartType === 'penalty' ? 50 : 50 // 5 meters for free kicks
    this.players.forEach(player => {
      if (player.team !== this.gameState.restartTeam && !player.isSentOff) {
        const dist = Math.hypot(
          player.x - this.gameState.restartPosition!.x,
          player.y - this.gameState.restartPosition!.y
        )
        
        if (dist < minDistance) {
          player.isMovingToRestart = true
          const angle = Math.atan2(
            player.y - this.gameState.restartPosition!.y,
            player.x - this.gameState.restartPosition!.x
          )
          
          player.restartTarget = {
            x: this.gameState.restartPosition!.x + Math.cos(angle) * (minDistance + 10),
            y: this.gameState.restartPosition!.y + Math.sin(angle) * (minDistance + 10)
          }
          
          // Keep in bounds (but NOT for kick-in takers)
          player.restartTarget.x = Math.max(player.radius, Math.min(this.config.fieldWidth - player.radius, player.restartTarget.x))
          player.restartTarget.y = Math.max(player.radius, Math.min(this.config.fieldHeight - player.radius, player.restartTarget.y))
        }
      }
    })
  }

  // Execute restart is now handled by player AI when they reach position

  // Setup realistic player movement for restarts
  private setupRestartPlayerMovement(): void {
    if (!this.gameState.restartPosition || !this.gameState.restartTeam) return
    
    // Set free kick start time for fallback
    this.freeKickStartTime = Date.now()
    
    const restartPlayers = this.players.filter(p => 
      p.team === this.gameState.restartTeam && !p.isSentOff
    )
    
    if (restartPlayers.length === 0) return
    
    // Find the best player to take the restart (closest + good at technique/passing)
    const restartTaker = restartPlayers.sort((a, b) => {
      const aDist = Math.hypot(a.x - this.ball.x, a.y - this.ball.y)
      const bDist = Math.hypot(b.x - this.ball.x, b.y - this.ball.y)
      const aSkill = (a.attributes.passing + a.attributes.technique) / 2
      const bSkill = (b.attributes.passing + b.attributes.technique) / 2
      
      // Combine distance and skill (closer + more skilled = better)
      const aScore = (1 / (aDist + 1)) * aSkill
      const bScore = (1 / (bDist + 1)) * bSkill
      
      return bScore - aScore
    })[0]
    
    // Clear any existing restart states
    this.players.forEach(player => {
      player.isMovingToRestart = false
      player.restartTarget = undefined
      player.restartRole = 'normal'
    })
    
    // Set up the restart taker
    const offsetDistance = 12 // Distance from ball for the restart taker
    // Calculate angle towards opponent goal
    const opponentGoalX = restartTaker.team === 'home' ? this.config.fieldWidth : 0
    const ballToGoalAngle = Math.atan2(this.config.fieldHeight / 2 - this.ball.y, opponentGoalX - this.ball.x)
    const targetX = this.ball.x - Math.cos(ballToGoalAngle) * offsetDistance
    const targetY = this.ball.y - Math.sin(ballToGoalAngle) * offsetDistance
    
    restartTaker.isMovingToRestart = true
    restartTaker.restartTarget = { x: targetX, y: targetY }
    restartTaker.restartRole = 'taker'
    restartTaker.targetX = targetX
    restartTaker.targetY = targetY
    
    // Set up supporting players for proper positioning
    const supportPlayers = restartPlayers.filter(p => p !== restartTaker).slice(0, 2)
    supportPlayers.forEach((player, index) => {
      const supportAngle = ballToGoalAngle + (index === 0 ? Math.PI / 4 : -Math.PI / 4)
      const supportDistance = 25 + index * 15
      const supportX = this.ball.x + Math.cos(supportAngle) * supportDistance
      const supportY = this.ball.y + Math.sin(supportAngle) * supportDistance
      
      // Keep support players in bounds
      const clampedX = Math.max(20, Math.min(this.config.fieldWidth - 20, supportX))
      const clampedY = Math.max(20, Math.min(this.config.fieldHeight - 20, supportY))
      
      player.isMovingToRestart = true
      player.restartTarget = { x: clampedX, y: clampedY }
      player.restartRole = 'support'
      player.targetX = clampedX
      player.targetY = clampedY
    })
    
    // Start a timer to complete the restart once players are in position
    setTimeout(() => {
      this.completeRestart(restartTaker)
    }, 1500) // Give players 1.5 seconds to get into position
  }

  // Complete the restart once players are positioned
  private completeRestart(restartTaker: Player): void {
    if (!this.ball.isStationary) return // Restart already completed
    
    // Check if 2 seconds have passed since free kick started
    const currentTime = Date.now()
    const timeSinceFreeKick = this.freeKickStartTime ? currentTime - this.freeKickStartTime : 0
    const forceShoot = timeSinceFreeKick > 2000 // 2 second fallback
    
    // Check if restart taker is close enough to the ball, or force completion if they're reasonably close
    const distanceToBall = Math.hypot(restartTaker.x - this.ball.x, restartTaker.y - this.ball.y)
    
    if (distanceToBall < 25 || restartTaker.isSentOff || forceShoot) {
      // If original taker is sent off, find another player
      let actualTaker = restartTaker
      if (restartTaker.isSentOff) {
        const availablePlayers = this.players.filter(p => 
          p.team === this.gameState.restartTeam && !p.isSentOff
        )
        if (availablePlayers.length > 0) {
          actualTaker = availablePlayers.sort((a, b) => {
            const aDist = Math.hypot(a.x - this.ball.x, a.y - this.ball.y)
            const bDist = Math.hypot(b.x - this.ball.x, b.y - this.ball.y)
            return aDist - bDist
          })[0]
        }
      }
      
      // Move player to ball if needed
      if (distanceToBall > 15) {
        actualTaker.x = this.ball.x + (Math.random() - 0.5) * 10
        actualTaker.y = this.ball.y + (Math.random() - 0.5) * 10
      }
      
      // Give possession to the restart taker
      this.ball.possessor = actualTaker
      this.ball.lastKicker = actualTaker
      this.ball.isStationary = false
      this.gameState.possession = actualTaker.team
      
      // Track free kick if this was a free kick
      if (this.gameState.restartType === 'free-kick') {
        this.gameState.matchStats.freeKicksAttempted[actualTaker.team]++
        this.lastFreeKickTaker = actualTaker
      }
      
      // If forced due to timeout, immediately shoot at goal
      if (forceShoot) {
        this.executeAutomaticShot(actualTaker)
      }
      
      // Clear restart state
      this.gameState.ballOut = false
      this.gameState.restartType = null
      this.gameState.restartTeam = null
      this.ballStationaryTime = 0
      this.freeKickStartTime = null // Reset timer
      
      // Clear restart movement for all players
      this.players.forEach(player => {
        player.isMovingToRestart = false
        player.restartTarget = undefined
        player.restartRole = 'normal'
      })
    } else {
      // Player not close enough, try again in a bit
      setTimeout(() => {
        this.completeRestart(restartTaker)
      }, 500)
    }
  }

  // Execute automatic shot when free kick timeout occurs
  private executeAutomaticShot(player: Player): void {
    // Calculate angle and power for shot towards goal
    const opponentGoalX = player.team === 'home' ? this.config.fieldWidth : 0
    const goalCenterY = this.config.fieldHeight / 2
    
    // Add some randomness to the target within the goal
    const goalWidth = 60
    const targetY = goalCenterY + (Math.random() - 0.5) * goalWidth * 0.8
    
    const dx = opponentGoalX - this.ball.x
    const dy = targetY - this.ball.y
    const distance = Math.hypot(dx, dy)
    
    // Calculate shot power based on distance and player's shooting ability
    const shootingPower = (player.attributes.finishing + player.attributes.technique) / 2 / 99
    const basePower = Math.min(12, 6 + distance * 0.02) // Base power scales with distance
    const finalPower = basePower * (0.7 + shootingPower * 0.6) // 70-130% of base power
    
    // Normalize direction and apply power
    this.ball.vx = (dx / distance) * finalPower
    this.ball.vy = (dy / distance) * finalPower
    this.ball.vz = 1 + Math.random() * 2 // Add some lift
    
    // Add some shooting error based on player skill
    const accuracy = player.attributes.finishing / 99
    const errorFactor = (1 - accuracy) * 0.3 // Max 30% error for worst players
    this.ball.vx += (Math.random() - 0.5) * finalPower * errorFactor
    this.ball.vy += (Math.random() - 0.5) * finalPower * errorFactor
    
    // Release possession for realistic shot mechanics
    this.ball.possessor = null
    
  }

  // Goal detection
  private checkGoals(): void {
    const goalY = (this.config.fieldHeight - this.config.goalWidth) / 2
    if (this.ball.x <= this.config.goalDepth && 
        this.ball.y >= goalY && 
        this.ball.y <= goalY + this.config.goalWidth) {
      this.gameState.awayScore++
      this.handleGoalScored('away')
    } else if (this.ball.x >= this.config.fieldWidth - this.config.goalDepth && 
               this.ball.y >= goalY && 
               this.ball.y <= goalY + this.config.goalWidth) {
      this.gameState.homeScore++
      this.handleGoalScored('home')
    }
  }

  private handleGoalScored(team: 'home' | 'away'): void {
    // Find the scorer (last kicker) and potential assist
    const scorer = this.ball.lastKicker
    let assistedBy: string | undefined
    
    // Look for assist (previous player who touched the ball)
    if (scorer) {
      const recentTouches = this.players.filter(p => 
        p.team === team && 
        p !== scorer && 
        p.lastTouchTime && 
        Date.now() - p.lastTouchTime < 5000 // Within 5 seconds
      ).sort((a, b) => (b.lastTouchTime || 0) - (a.lastTouchTime || 0))
      
      if (recentTouches.length > 0) {
        assistedBy = recentTouches[0].name
      }
    }
    
    // Create goal record
    const currentMinute = Math.floor((1200000 - this.gameState.gameTime) / 1000 / 60) + 1
    const goal: Goal = {
      team,
      scorer: scorer?.name || 'Unknown',
      minute: currentMinute,
      assistedBy
    }
    
    // Add to match stats
    this.gameState.matchStats.goals.push(goal)
    this.gameState.lastGoal = goal
    
    // Check if this was a free kick goal
    if (this.lastFreeKickTaker && this.lastFreeKickTaker === scorer) {
      // Goal scored directly from free kick
      this.gameState.matchStats.freeKicksScored[team]++
      this.lastFreeKickTaker = null // Reset
    }
    
    // Start goal celebration
    this.gameState.goalCelebration = {
      active: true,
      startTime: Date.now()
    }
    
    // Reset ball to center
    this.ball.x = this.config.fieldWidth / 2
    this.ball.y = this.config.fieldHeight / 2
    this.ball.vx = 0
    this.ball.vy = 0
    this.ball.possessor = null
    this.ball.lastKicker = null
    this.gameState.possession = null
    
    // Re-initialize player positions
    this.initializePlayers()
    
    // Clear celebration after 3 seconds
    setTimeout(() => {
      if (this.gameState.goalCelebration) {
        this.gameState.goalCelebration.active = false
      }
    }, 3000)
  }

  // Main update function
  update(currentTime: number): void {
    // Initialize on first frame
    if (this.startTime === null) {
      this.startTime = currentTime
      this.lastUpdateTime = currentTime
      console.log('Engine first frame initialization', { currentTime, startTime: this.startTime })
      return // Skip first frame
    }
    
    const deltaTime = Math.min((currentTime - this.lastUpdateTime) / 1000, 0.1)
    
    // Debug check for NaN
    if (isNaN(deltaTime)) {
      console.error('deltaTime is NaN!', { currentTime, lastUpdateTime: this.lastUpdateTime })
      return
    }
    
    this.lastUpdateTime = currentTime
    
    if (this.gameState.isPlaying && this.gameState.gameTime > 0) {
      this.gameState.gameTime = Math.max(0, this.gameState.gameTime - deltaTime * 1000 * this.gameState.gameSpeed)
      
      if (this.gameState.gameTime === 0) {
        this.gameState.isPlaying = false
        this.gameState.gameOver = true
      }
      
      this.updatePhysics(deltaTime)
    }
  }

  private updatePhysics(deltaTime: number): void {
    if (!this.gameState.isPlaying || this.gameState.gameTime <= 0) return
    
    // Update player AI first
    this.players.forEach(player => {
      if (!player.isSentOff) {
        this.updatePlayerAI(player)
      }
    })
    
    // Update positions
    for (const player of this.players) {
      if (!player.isSentOff) {
        // Update position
        const dx = player.vx * deltaTime * 60 * this.gameState.gameSpeed
        const dy = player.vy * deltaTime * 60 * this.gameState.gameSpeed
        
        // Debug check
        if (isNaN(dx) || isNaN(dy) || isNaN(player.x) || isNaN(player.y)) {
          console.error('Player position update NaN detected!', {
            player: { x: player.x, y: player.y, vx: player.vx, vy: player.vy, name: player.name },
            deltaTime,
            gameSpeed: this.gameState.gameSpeed,
            dx, dy
          })
          continue // Skip this player update
        }
        
        player.x += dx
        player.y += dy

        // Keep players in bounds (including buffer zone)
        const buffer = this.config.fieldBuffer || 0
        player.x = Math.max(player.radius - buffer, Math.min(this.config.fieldWidth + buffer - player.radius, player.x))
        player.y = Math.max(player.radius - buffer, Math.min(this.config.fieldHeight + buffer - player.radius, player.y))
      }
    }
    
    // Update player collisions
    this.updatePlayerCollisions()
    
    // Update ball
    this.updateBallPhysics(deltaTime)
    
    // Check if ball went out of bounds
    this.checkBallOutOfBounds()
    
    // Check for goals
    this.checkGoals()
    
    // Update possession tracking
    this.updatePossessionStats(deltaTime)
    
    // Update pass completion rates
    this.updatePassCompletionRates()
  }
  
  // Update pass completion rates
  private updatePassCompletionRates(): void {
    // Calculate home team pass completion rate
    if (this.gameState.matchStats.passesAttempted.home > 0) {
      this.gameState.matchStats.passCompletionRate.home = Math.round(
        (this.gameState.matchStats.passesCompleted.home / 
         this.gameState.matchStats.passesAttempted.home) * 100
      )
    }
    
    // Calculate away team pass completion rate
    if (this.gameState.matchStats.passesAttempted.away > 0) {
      this.gameState.matchStats.passCompletionRate.away = Math.round(
        (this.gameState.matchStats.passesCompleted.away / 
         this.gameState.matchStats.passesAttempted.away) * 100
      )
    }
  }
  
  // Update possession statistics
  private updatePossessionStats(deltaTime: number): void {
    if (this.ball.possessor) {
      this.possessionTimer[this.ball.possessor.team] += deltaTime
    } else {
      this.possessionTimer.neutral += deltaTime
    }
    
    // Update possession percentages every few seconds
    const totalTime = this.possessionTimer.home + this.possessionTimer.away + this.possessionTimer.neutral
    if (totalTime > 0) {
      const homePercentage = Math.round((this.possessionTimer.home / totalTime) * 100)
      const awayPercentage = Math.round((this.possessionTimer.away / totalTime) * 100)
      
      this.gameState.matchStats.possessionPercentage = {
        home: Math.max(0, Math.min(100, homePercentage)),
        away: Math.max(0, Math.min(100, awayPercentage))
      }
    }
  }

  // Public getters
  getGameState(): GameState {
    return { ...this.gameState }
  }

  getPlayers(): Player[] {
    // Only return players who haven't been sent off
    return this.players.filter(p => !p.isSentOff)
  }

  getAllPlayers(): Player[] {
    // Return all players including sent-off ones
    return [...this.players]
  }

  getBall(): Ball {
    return { ...this.ball }
  }

  // Public controls
  togglePlay(): void {
    this.gameState.isPlaying = !this.gameState.isPlaying
  }

  resetGame(): void {
    this.gameState.isPlaying = false
    this.gameState.gameTime = 90000 // 90 seconds
    this.gameState.halfTime = 1
    this.gameState.homeScore = 0
    this.gameState.awayScore = 0
    this.gameState.gameOver = false
    this.gameState.possession = null
    this.gameState.passCount = { home: 0, away: 0 }
    this.gameState.shots = { home: 0, away: 0 }
    this.gameState.shotsOnTarget = { home: 0, away: 0 }
    this.gameState.fouls = { home: 0, away: 0 }
    this.gameState.accumulatedFouls = { home: 0, away: 0 }
    this.gameState.ballOut = false
    this.gameState.advantage = null
    this.startTime = null
    this.lastUpdateTime = null
    this.freeKickStartTime = null
    this.lastPassTarget = null
    this.lastPassTime = null
    this.lastFreeKickTaker = null
    
    this.ball.x = this.config.fieldWidth / 2
    this.ball.y = this.config.fieldHeight / 2
    this.ball.vx = 0
    this.ball.vy = 0
    this.ball.vz = 0
    this.ball.z = 0
    this.ball.spin = { x: 0, y: 0, z: 0 }
    this.ball.possessor = null
    this.ball.lastKicker = null
    this.ball.touchCount = 0
    this.ball.isStationary = true
    this.ball.bounceCount = 0
    this.ball.lastMovementTime = 0
    this.ball.stuckCheckTimer = 0
    
    this.initializePlayers()
    
    // FlowAI removed - using original AI only
  }

  setGameSpeed(speed: number): void {
    this.gameState.gameSpeed = speed
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled
  }

  updateConfig(newConfig: Partial<GameConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.initializePlayers()
  }

  play(): void {
    this.gameState.isPlaying = true
    
    // Handle kickoff if ball is at center and stationary
    if (this.ball.isStationary && 
        Math.abs(this.ball.x - this.config.fieldWidth / 2) < 10 &&
        Math.abs(this.ball.y - this.config.fieldHeight / 2) < 10) {
      this.performKickoff()
    }
  }
  
  private performKickoff(): void {
    console.log('Performing kickoff')
    
    // Determine which team kicks off (alternates or could be set from coin toss)
    const kickoffTeam: 'home' | 'away' = this.gameState.lastGoal ? 
      (this.gameState.lastGoal.team === 'home' ? 'away' : 'home') : 'home'
    const striker = this.players.find(p => 
      p.team === kickoffTeam && 
      p.role === 'striker' && 
      !p.isSentOff
    )
    
    if (striker) {
      // Position striker next to ball
      striker.x = this.ball.x - (kickoffTeam === 'home' ? 15 : -15)
      striker.y = this.ball.y
      
      // Give a small kick to start the game
      setTimeout(() => {
        if (this.ball.isStationary) {
          // Simple pass to nearby teammate
          const teammate = this.players.find(p => 
            p.team === kickoffTeam && 
            p !== striker && 
            !p.isSentOff &&
            p.role === 'midfielder'
          )
          
          if (teammate) {
            const angle = Math.atan2(teammate.y - this.ball.y, teammate.x - this.ball.x)
            this.ball.vx = Math.cos(angle) * 3
            this.ball.vy = Math.sin(angle) * 3
            this.ball.vz = 0
            this.ball.isStationary = false
            this.ball.lastKicker = striker
            this.gameState.possession = kickoffTeam
            
            console.log('Kickoff executed - ball passed to teammate')
          } else {
            // Fallback: kick forward
            const direction = kickoffTeam === 'home' ? 1 : -1
            this.ball.vx = direction * 3
            this.ball.vy = (Math.random() - 0.5) * 2
            this.ball.vz = 0
            this.ball.isStationary = false
            this.ball.lastKicker = striker
            this.gameState.possession = kickoffTeam
            
            console.log('Kickoff executed - ball kicked forward')
          }
        }
      }, 500) // Small delay to let players settle
    } else {
      // Emergency fallback - just get the ball moving
      console.log('No striker found - using emergency kickoff')
      setTimeout(() => {
        if (this.ball.isStationary) {
          this.ball.vx = 2
          this.ball.vy = (Math.random() - 0.5) * 2
          this.ball.vz = 0
          this.ball.isStationary = false
          console.log('Emergency kickoff executed')
        }
      }, 1000)
    }
  }

  pause(): void {
    this.gameState.isPlaying = false
  }

  reset(): void {
    this.resetGame()
  }

  setFoulsEnabled(enabled: boolean): void {
    this.foulsEnabled = enabled
  }
}