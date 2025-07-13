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
  isShootingChargeUp?: boolean
  shootingChargeLevel?: number
  shootingChargeStartTime?: number
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

  constructor(config: GameConfig) {
    this.config = config
    this.gameState = {
      isPlaying: false,
      gameTime: 1200000, // 20 minutes per half in milliseconds
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
        possessionPercentage: { home: 50, away: 50 }
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
      touchCount: 0
    }
    
    this.initializePlayers()
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
        { role: 'striker', x: 380, y: 0.5 }
      ],
      '1-1-2-1': [
        { role: 'goalkeeper', x: 40, y: 0.5 },
        { role: 'defender', x: 150, y: 0.5 },
        { role: 'midfielder', x: 280, y: 0.35 },
        { role: 'midfielder', x: 280, y: 0.65 },
        { role: 'striker', x: 380, y: 0.5 }
      ],
      '1-3-1': [
        { role: 'goalkeeper', x: 40, y: 0.5 },
        { role: 'defender', x: 180, y: 0.3 },
        { role: 'defender', x: 140, y: 0.5 },
        { role: 'defender', x: 180, y: 0.7 },
        { role: 'striker', x: 360, y: 0.5 }
      ],
      '1-2-2': [
        { role: 'goalkeeper', x: 40, y: 0.5 },
        { role: 'defender', x: 150, y: 0.35 },
        { role: 'defender', x: 150, y: 0.65 },
        { role: 'striker', x: 340, y: 0.35 },
        { role: 'striker', x: 340, y: 0.65 }
      ]
    }
    
    return formations[formation] || formations['1-2-1-1']
  }

  // Initialize players based on formations
  initializePlayers(): void {
    const homeLayout = this.getFormationLayout(this.config.homeFormation)
    const awayLayout = this.getFormationLayout(this.config.awayFormation)
    
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
    
    const ballDist = Math.hypot(this.ball.x - player.x, this.ball.y - player.y)
    const hasBall = this.ball.possessor === player
    const ballIsLoose = !this.ball.possessor && !this.gameState.ballOut
    
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
    const fieldMargin = 5 // Small margin before considering ball out
    
    // Check if ball is out of bounds
    if (ballX <= fieldMargin || ballX >= this.config.fieldWidth - fieldMargin ||
        ballY <= fieldMargin || ballY >= this.config.fieldHeight - fieldMargin) {
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
    if (ballY <= 10 || ballY >= this.config.fieldHeight - 10) {
      // Ball went out on the sidelines (top/bottom)
      this.gameState.restartType = 'kick-in'
      this.gameState.restartTeam = lastTeam === 'home' ? 'away' : 'home'
      this.gameState.restartPosition = {
        x: Math.max(50, Math.min(this.config.fieldWidth - 50, ballX)),
        y: ballY <= 10 ? 15 : this.config.fieldHeight - 15
      }
    } else if (ballX <= 10 || ballX >= this.config.fieldWidth - 10) {
      // Ball went out on goal lines (left/right)
      const nearGoal = this.isNearGoal(ballY)
      
      if (nearGoal) {
        // Ball went out near the goal
        const isCorner = lastTeam === (ballX <= 10 ? 'away' : 'home')
        
        if (isCorner) {
          // Corner kick
          this.gameState.restartType = 'corner'
          this.gameState.restartTeam = lastTeam!
          this.gameState.restartPosition = {
            x: ballX <= 10 ? 15 : this.config.fieldWidth - 15,
            y: ballY < this.config.fieldHeight / 2 ? 15 : this.config.fieldHeight - 15
          }
          
          // Track corner stat
          this.gameState.matchStats.corners[lastTeam!]++
        } else {
          // Goal kick
          this.gameState.restartType = 'goal-kick'
          this.gameState.restartTeam = ballX <= 10 ? 'home' : 'away'
          this.gameState.restartPosition = {
            x: ballX <= 10 ? 60 : this.config.fieldWidth - 60,
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
      this.executeKickIn()
    }, 800) // Futsal has quicker restarts than regular soccer
  }
  
  // Check if ball position is near a goal
  private isNearGoal(ballY: number): boolean {
    const goalTop = (this.config.fieldHeight - this.config.goalWidth) / 2
    const goalBottom = goalTop + this.config.goalWidth
    const goalAreaExtension = 30 // Consider area around goal
    
    return ballY >= (goalTop - goalAreaExtension) && ballY <= (goalBottom + goalAreaExtension)
  }
  
  // Execute kick-in (futsal restart)
  private executeKickIn(): void {
    if (!this.gameState.restartPosition || !this.gameState.restartTeam) return
    
    // Place ball at restart position
    this.ball.x = this.gameState.restartPosition.x
    this.ball.y = this.gameState.restartPosition.y
    this.ball.z = 0
    this.ball.vx = 0
    this.ball.vy = 0
    this.ball.vz = 0
    
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
      
      // Position kick-in taker next to ball
      const kickInDistance = 15
      const fieldCenter = { x: this.config.fieldWidth / 2, y: this.config.fieldHeight / 2 }
      const directionToCenterX = fieldCenter.x - this.ball.x
      const directionToCenterY = fieldCenter.y - this.ball.y
      const directionLength = Math.hypot(directionToCenterX, directionToCenterY)
      
      if (directionLength > 0) {
        kickInTaker.x = this.ball.x + (directionToCenterX / directionLength) * kickInDistance
        kickInTaker.y = this.ball.y + (directionToCenterY / directionLength) * kickInDistance
      }
      
      // Ensure kicker is in bounds
      kickInTaker.x = Math.max(kickInTaker.radius, Math.min(this.config.fieldWidth - kickInTaker.radius, kickInTaker.x))
      kickInTaker.y = Math.max(kickInTaker.radius, Math.min(this.config.fieldHeight - kickInTaker.radius, kickInTaker.y))
      
      // Face the field
      kickInTaker.facing = Math.atan2(fieldCenter.y - kickInTaker.y, fieldCenter.x - kickInTaker.x)
      
      // Give possession to kick-in taker
      this.ball.possessor = kickInTaker
      this.ball.lastKicker = kickInTaker
      this.gameState.possession = kickInTaker.team
    }
    
    // Move opposing players away (4-meter rule in futsal)
    const minDistance = 25 // 4 meters scaled
    this.players.forEach(player => {
      if (player.team !== this.gameState.restartTeam) {
        const dist = Math.hypot(player.x - this.ball.x, player.y - this.ball.y)
        if (dist < minDistance) {
          const angle = Math.atan2(player.y - this.ball.y, player.x - this.ball.x)
          player.x = this.ball.x + Math.cos(angle) * minDistance
          player.y = this.ball.y + Math.sin(angle) * minDistance
          
          // Keep in bounds
          player.x = Math.max(player.radius, Math.min(this.config.fieldWidth - player.radius, player.x))
          player.y = Math.max(player.radius, Math.min(this.config.fieldHeight - player.radius, player.y))
        }
      }
    })
    
    // Reset game state
    this.gameState.ballOut = false
    this.gameState.restartType = null
    this.gameState.restartTeam = null
  }

  private updatePlayerPositioning(player: Player, tactic: string, strategy: number, hasBall: boolean, ballDist: number, tacticalAwareness: number, compactness: number, pushUpField: number): void {
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
          let bestGapX = oppositionGoalX
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
        this.ball.possessor = player
        this.ball.lastKicker = player
        this.gameState.possession = player.team
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
    
    // Base chances modified by role and situation
    let basePassChance = player.role === 'defender' ? 0.06 : 0.04
    let baseShootChance = 0.05
    
    // Tactic modifiers
    if (tactic === 'pass-move') basePassChance *= 1.5
    if (tactic === 'pivot' && player.role === 'striker') basePassChance *= 1.3
    
    // Too many touches increases chance to pass
    if (player.consecutiveTouches > 3) {
      basePassChance += 0.02 * player.consecutiveTouches
    }
    
    // Apply decision quality and panic
    const passChance = basePassChance * (0.5 + decisionQuality * 0.5) * (1 + panicFactor)
    const shootChance = nearGoal ? baseShootChance * (0.5 + decisionQuality * 0.5) : 0
    
    const shouldPass = Math.random() < passChance
    const shouldShoot = Math.random() < shootChance
    
    if (shouldShoot && nearGoal) {
      // Start shooting charge-up
      if (!player.shootingChargeStartTime) {
        player.isShootingChargeUp = true
        player.shootingChargeStartTime = Date.now()
        player.shootingChargeLevel = 0
      } else {
        // Update charge level (0 to 1 over 1 second)
        const chargeTime = Date.now() - player.shootingChargeStartTime
        player.shootingChargeLevel = Math.min(1, chargeTime / 1000)
        
        // Execute shot after charge-up (0.5 seconds)
        if (chargeTime >= 500) {
          this.executeShot(player)
          this.ball.possessor = null
          player.isShootingChargeUp = false
          player.shootingChargeStartTime = undefined
          player.shootingChargeLevel = 0
        }
      }
    } else if (shouldPass) {
      // Cancel any shooting charge-up
      if (player.isShootingChargeUp) {
        player.isShootingChargeUp = false
        player.shootingChargeStartTime = undefined
        player.shootingChargeLevel = 0
      }
      this.executePass(player)
      this.ball.possessor = null
    } else {
      // Cancel shooting charge-up if not shooting
      if (player.isShootingChargeUp) {
        player.isShootingChargeUp = false
        player.shootingChargeStartTime = undefined
        player.shootingChargeLevel = 0
      }
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
    let spin = { x: 0, y: 0, z: 0 }
    
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
    
    // Advanced pass evaluation
    const passOptions = teammates.map(teammate => {
      const dist = Math.hypot(teammate.x - player.x, teammate.y - player.y)
      const angle = Math.atan2(teammate.y - player.y, teammate.x - player.x)
      
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
      
      return {
        player: teammate,
        dist,
        angle,
        risk: interceptionRisk,
        score: passSuccess * distanceScore * positionScore * movementScore * 
               (teammate.attributes.offTheBall / 99)
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
      
      // Record pass
      this.gameState.passCount[player.team]++
      player.consecutiveTouches = 0
      this.ball.lastTouchTime = Date.now()
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
    if (dist < 50) return 0.7 // Too close
    if (dist < 150) return 1.0 // Optimal
    if (dist < 250) return 0.8 // Good
    if (dist < 350) return 0.5 // Long
    return 0.2 // Very long
  }
  
  // Evaluate teammate position
  private evaluateTeammatePosition(teammate: Player, passer: Player): number {
    let score = 1.0
    
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
    let spin = { x: 0, y: 0, z: 0 }
    
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

  // Ball physics update
  private updateBallPhysics(deltaTime: number): void {
    if (!this.ball.possessor && !this.gameState.ballOut) {
      const dt = deltaTime * 60 * this.gameState.gameSpeed
      
      // Apply spin effects on ball trajectory (Magnus effect)
      const spinFactor = 0.01
      this.ball.vx += this.ball.spin.y * spinFactor * dt
      this.ball.vy -= this.ball.spin.x * spinFactor * dt
      
      // Update position
      this.ball.x += this.ball.vx * dt
      this.ball.y += this.ball.vy * dt
      this.ball.z += this.ball.vz * dt
      
      // Gravity for ball height
      if (this.ball.z > 0) {
        this.ball.vz -= 0.5 * dt // gravity
      }
      
      // Ball bounce
      if (this.ball.z <= 0 && this.ball.vz < 0) {
        this.ball.z = 0
        this.ball.vz = -this.ball.vz * 0.6 // bounce damping
        
        // Add some spin on bounce
        this.ball.spin.z = (Math.random() - 0.5) * 10
      }
      
      // Futsal ball has less bounce and rolls more
      const groundFriction = this.ball.z <= 0.5 ? 0.94 : 0.98
      const airResistance = 0.99
      const currentSpeed = Math.hypot(this.ball.vx, this.ball.vy)
      
      // Apply friction based on whether ball is on ground or in air
      const friction = this.ball.z > 0.5 ? airResistance : groundFriction
      this.ball.vx *= friction
      this.ball.vy *= friction
      
      // Spin decay
      this.ball.spin.x *= 0.95
      this.ball.spin.y *= 0.95
      this.ball.spin.z *= 0.92
      
      // Enhanced rolling physics for futsal
      if (this.ball.z <= 0.5 && currentSpeed > 0.1) {
        // Convert some velocity to spin when rolling
        this.ball.spin.x = -this.ball.vy * 0.5
        this.ball.spin.y = this.ball.vx * 0.5
      }
      
      // First touch mechanics
      this.handleFirstTouch()
      
      // Ball out of bounds check
      this.checkBallOutOfBounds()
      
      // Ball stops at low speeds
      if (Math.abs(this.ball.vx) < 0.1) this.ball.vx = 0
      if (Math.abs(this.ball.vy) < 0.1) this.ball.vy = 0
      if (Math.abs(this.ball.vz) < 0.1 && this.ball.z <= 0) this.ball.vz = 0
      
      // Ball contests
      this.handleBallContests()
    }
  }

  private handleFirstTouch(): void {
    const ballSpeed = Math.hypot(this.ball.vx, this.ball.vy)
    if (ballSpeed > 1) {
      const receivingPlayer = this.players.find(p => {
        const dist = Math.hypot(p.x - this.ball.x, p.y - this.ball.y)
        return dist < p.radius + this.ball.radius && p !== this.ball.lastKicker
      })
      
      if (receivingPlayer) {
        const firstTouchQuality = (
          receivingPlayer.attributes.firstTouch / 99 * 0.5 +
          receivingPlayer.attributes.technique / 99 * 0.3 +
          receivingPlayer.attributes.composure / 99 * 0.2
        )
        
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
        }
      }
    }
  }


  private handleBallContests(): void {
    const playersNearBall = this.players.filter(p => {
      const dist = Math.hypot(p.x - this.ball.x, p.y - this.ball.y)
      return dist < p.radius + this.ball.radius + 10
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
      
      if (isEqualStrength || Math.random() < 0.3) {
        const angle = Math.atan2(
          this.ball.y - (strongest.player.y + secondStrongest.player.y) / 2,
          this.ball.x - (strongest.player.x + secondStrongest.player.x) / 2
        )
        
        const repelPower = 4 + playersNearBall.length
        this.ball.vx = Math.cos(angle) * repelPower
        this.ball.vy = Math.sin(angle) * repelPower
        this.ball.possessor = null
        
        playersNearBall.forEach((p, i) => {
          const pushAngle = (Math.PI * 2 * i) / playersNearBall.length
          p.x += Math.cos(pushAngle) * 3
          p.y += Math.sin(pushAngle) * 3
        })
      } else {
        const winner = strongest.player
        if (strongest.distance < winner.radius + this.ball.radius + 2) {
          this.ball.possessor = winner
          this.ball.lastKicker = winner
          this.gameState.possession = winner.team
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
    
    // No fouls if ball is very close (fighting for the ball)
    const ballDist1 = Math.hypot(this.ball.x - player1.x, this.ball.y - player1.y)
    const ballDist2 = Math.hypot(this.ball.x - player2.x, this.ball.y - player2.y)
    const ballNearby = Math.min(ballDist1, ballDist2) < 30
    
    if (ballNearby && !isSlideTackle) {
      // Normal challenge for the ball, less likely to be a foul
      return impactForce > 250 && Math.random() < 0.05  // Reduced from 0.1
    }
    
    // Slide tackles more likely to be fouls
    if (isSlideTackle) {
      const tacklingPlayer = player1.isSliding ? player1 : player2
      const tackleQuality = tacklingPlayer.attributes.tackling / 99
      const foulChance = 0.2 - tackleQuality * 0.15  // Reduced from 0.4 - 0.3
      return Math.random() < foulChance
    }
    
    // High impact collisions
    if (impactForce > 220) {  // Increased threshold from 180
      return Math.random() < 0.15  // Reduced from 0.3
    }
    
    return false
  }
  
  // Handle foul
  private handleFoul(foulingPlayer: Player, fouledPlayer: Player, position: { x: number; y: number }): void {
    const currentTime = Date.now()
    
    // Prevent multiple fouls in quick succession
    if (this.gameState.lastFoulTime && currentTime - this.gameState.lastFoulTime < 1000) {
      return
    }
    
    this.gameState.lastFoulTime = currentTime
    this.gameState.fouls[foulingPlayer.team]++
    this.gameState.accumulatedFouls[foulingPlayer.team]++
    
    // Check for card
    const severity = Math.random()
    if (severity > 0.95 || (foulingPlayer.yellowCards > 0 && severity > 0.85)) {  // Reduced chance
      // Red card or second yellow
      foulingPlayer.isSentOff = true
      if (foulingPlayer.yellowCards > 0) {
        // Second yellow
        foulingPlayer.yellowCards++
        this.gameState.matchStats.yellowCards[foulingPlayer.team]++
      }
      this.gameState.matchStats.redCards[foulingPlayer.team]++
    } else if (severity > 0.8) {  // Reduced from 0.6 to 0.8
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
    
    const minDistance = this.gameState.restartType === 'penalty' ? 50 : 30
    
    // Move all opposing players away
    this.players.forEach(player => {
      if (player.team !== this.gameState.restartTeam) {
        const dist = Math.hypot(
          player.x - this.gameState.restartPosition!.x,
          player.y - this.gameState.restartPosition!.y
        )
        
        if (dist < minDistance) {
          const angle = Math.atan2(
            player.y - this.gameState.restartPosition!.y,
            player.x - this.gameState.restartPosition!.x
          )
          
          player.x = this.gameState.restartPosition!.x + Math.cos(angle) * minDistance
          player.y = this.gameState.restartPosition!.y + Math.sin(angle) * minDistance
        }
      }
    })
    
    this.executeRestart()
  }

  // Execute restart (used for free kicks, penalties, etc.)
  private executeRestart(): void {
    if (!this.gameState.restartPosition || !this.gameState.restartTeam) return
    
    // Place ball at restart position
    this.ball.x = this.gameState.restartPosition.x
    this.ball.y = this.gameState.restartPosition.y
    this.ball.z = 0
    this.ball.vx = 0
    this.ball.vy = 0
    this.ball.vz = 0
    
    // Find nearest player from the restart team to take the restart
    const restartPlayers = this.players.filter(p => 
      p.team === this.gameState.restartTeam && !p.isSentOff
    )
    
    if (restartPlayers.length > 0) {
      // Find closest player to restart position
      const restartTaker = restartPlayers.sort((a, b) => {
        const aDist = Math.hypot(a.x - this.ball.x, a.y - this.ball.y)
        const bDist = Math.hypot(b.x - this.ball.x, b.y - this.ball.y)
        return aDist - bDist
      })[0]
      
      // Position player near the ball
      const offsetX = restartTaker.team === 'home' ? -15 : 15
      restartTaker.x = this.ball.x + offsetX
      restartTaker.y = this.ball.y
      
      // Give possession to the restart taker
      this.ball.possessor = restartTaker
      this.ball.lastKicker = restartTaker
    }
    
    // Clear restart state
    this.gameState.ballOut = false
    this.gameState.restartType = null
    this.gameState.restartTeam = null
    this.ballStationaryTime = 0
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
    if (this.startTime === null) {
      this.startTime = currentTime
      this.lastUpdateTime = currentTime
    }
    
    const deltaTime = Math.min((currentTime - (this.lastUpdateTime || currentTime)) / 1000, 0.1)
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
    this.players.forEach(player => {
      if (!player.isSentOff) {
        // Update position
        player.x += player.vx * deltaTime * 60 * this.gameState.gameSpeed
        player.y += player.vy * deltaTime * 60 * this.gameState.gameSpeed

        // Keep players in bounds
        player.x = Math.max(player.radius, Math.min(this.config.fieldWidth - player.radius, player.x))
        player.y = Math.max(player.radius, Math.min(this.config.fieldHeight - player.radius, player.y))
      }
    })
    
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
    return [...this.players]
  }

  getBall(): Ball {
    return { ...this.ball }
  }

  getStatistics(): MatchStats & { 
    foulsCommitted?: { home: number; away: number }
    advantagesPlayed?: number
    possession?: { home: number; away: number }
    freeKicksAttempted?: { home: number; away: number }
    shots?: { home: number; away: number }
    shotsOnTarget?: { home: number; away: number }
    passCompletionRate?: { home: number; away: number }
  } {
    return { 
      ...this.gameState.matchStats,
      foulsCommitted: this.gameState.fouls,
      advantagesPlayed: this.gameState.advantagesPlayed || 0,
      possession: this.gameState.matchStats.possessionPercentage,
      freeKicksAttempted: { home: 0, away: 0 }, // Not tracked in original engine
      shots: this.gameState.shots,
      shotsOnTarget: this.gameState.shotsOnTarget,
      passCompletionRate: { home: 0, away: 0 } // Not tracked in original engine
    }
  }

  // Public controls
  togglePlay(): void {
    this.gameState.isPlaying = !this.gameState.isPlaying
  }

  resetGame(): void {
    this.gameState.isPlaying = false
    this.gameState.gameTime = 1200000 // 20 minutes per half
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
    
    this.initializePlayers()
  }

  setGameSpeed(speed: number): void {
    this.gameState.gameSpeed = speed
  }

  updateConfig(newConfig: Partial<GameConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.initializePlayers()
  }

  play(): void {
    this.gameState.isPlaying = true
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