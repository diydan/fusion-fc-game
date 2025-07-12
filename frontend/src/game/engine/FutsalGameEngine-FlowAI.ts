import type { Player, Ball, GameConfig, GameState } from './FutsalGameEngine'

interface AIState {
  possession: 'home' | 'away' | null
  phase: 'defending' | 'attacking' | 'transition'
  pressure: number
  teamShape: 'compact' | 'balanced' | 'stretched'
}

interface PassOption {
  target: Player
  score: number
  type: 'short' | 'through' | 'long' | 'cross'
  risk: number
  expectedSuccess: number
}

interface DribbleOption {
  direction: number
  distance: number
  type: 'simple' | 'skill' | 'burst'
  risk: number
}

interface ShotOption {
  power: number
  angle: number
  type: 'placement' | 'power' | 'chip'
  expectedGoalProbability: number
}

interface TacticalFormation {
  name: string
  positions: Map<string, { x: number, y: number }>
  compactness: number
  width: number
  depth: number
}

export class FutsalFlowAI {
  private config: GameConfig
  private players: Player[]
  private ball: Ball
  private gameState: GameState
  private aiState: AIState
  private formations: Map<string, TacticalFormation>
  private currentFormation: string = 'balanced'
  
  // AI tuning parameters
  private readonly params = {
    passAccuracy: 0.85,
    dribbleSuccess: 0.75,
    shotAccuracy: 0.7,
    decisionSpeed: 0.9,
    teamworkFactor: 0.8,
    riskTolerance: 0.5,
    pressureThreshold: 0.6,
    formationDiscipline: 0.7
  }
  
  constructor(config: GameConfig, players: Player[], ball: Ball, gameState: GameState) {
    this.config = config
    this.players = players
    this.ball = ball
    this.gameState = gameState
    
    this.aiState = {
      possession: null,
      phase: 'transition',
      pressure: 0,
      teamShape: 'balanced'
    }
    
    this.formations = this.initializeFormations()
  }
  
  private initializeFormations(): Map<string, TacticalFormation> {
    const formations = new Map<string, TacticalFormation>()
    
    // Balanced 2-1-1 formation
    formations.set('balanced', {
      name: 'balanced',
      positions: new Map([
        ['goalkeeper', { x: 0.1, y: 0.5 }],
        ['defender1', { x: 0.25, y: 0.35 }],
        ['defender2', { x: 0.25, y: 0.65 }],
        ['midfielder', { x: 0.5, y: 0.5 }],
        ['striker', { x: 0.75, y: 0.5 }]
      ]),
      compactness: 0.7,
      width: 0.7,
      depth: 0.65
    })
    
    // Defensive 3-1 formation
    formations.set('defensive', {
      name: 'defensive',
      positions: new Map([
        ['goalkeeper', { x: 0.05, y: 0.5 }],
        ['defender1', { x: 0.2, y: 0.3 }],
        ['defender2', { x: 0.2, y: 0.5 }],
        ['defender3', { x: 0.2, y: 0.7 }],
        ['midfielder', { x: 0.4, y: 0.5 }],
        ['striker', { x: 0.6, y: 0.5 }]
      ]),
      compactness: 0.9,
      width: 0.6,
      depth: 0.55
    })
    
    // Attacking 1-2-1 formation
    formations.set('attacking', {
      name: 'attacking',
      positions: new Map([
        ['goalkeeper', { x: 0.15, y: 0.5 }],
        ['defender', { x: 0.35, y: 0.5 }],
        ['midfielder1', { x: 0.55, y: 0.35 }],
        ['midfielder2', { x: 0.55, y: 0.65 }],
        ['striker', { x: 0.8, y: 0.5 }]
      ]),
      compactness: 0.5,
      width: 0.8,
      depth: 0.75
    })
    
    return formations
  }
  
  updatePlayerAI(player: Player): void {
    if (player.isSentOff || player.isMovingToRestart) return
    
    // Update AI state
    this.updateAIState()
    
    // Determine player action based on sophisticated decision tree
    const decision = this.makeDecision(player)
    
    // Execute the decision
    this.executeDecision(player, decision)
    
    // Apply movement
    this.applyMovement(player)
  }
  
  private updateAIState(): void {
    // Determine possession
    this.aiState.possession = this.ball.possessor ? this.ball.possessor.team : null
    
    // Calculate game phase
    const ballInDefensiveThird = (this.ball.x < this.config.fieldWidth * 0.33) || 
                                 (this.ball.x > this.config.fieldWidth * 0.67)
    
    if (this.aiState.possession) {
      this.aiState.phase = this.aiState.possession === 'home' ? 
        (this.ball.x > this.config.fieldWidth * 0.5 ? 'attacking' : 'defending') :
        (this.ball.x < this.config.fieldWidth * 0.5 ? 'attacking' : 'defending')
    } else {
      this.aiState.phase = 'transition'
    }
    
    // Calculate pressure
    this.aiState.pressure = this.calculatePressure()
    
    // Determine team shape
    if (this.aiState.pressure > this.params.pressureThreshold) {
      this.aiState.teamShape = 'compact'
    } else if (this.aiState.phase === 'attacking') {
      this.aiState.teamShape = 'stretched'
    } else {
      this.aiState.teamShape = 'balanced'
    }
    
    // Update formation based on game state
    this.updateFormation()
  }
  
  private calculatePressure(): number {
    if (!this.ball.possessor) return 0.5
    
    const opponents = this.players.filter(p => 
      p.team !== this.ball.possessor!.team && !p.isSentOff
    )
    
    let pressureScore = 0
    opponents.forEach(opp => {
      const dist = Math.hypot(opp.x - this.ball.x, opp.y - this.ball.y)
      if (dist < 50) pressureScore += (50 - dist) / 50
    })
    
    return Math.min(1, pressureScore / 3)
  }
  
  private updateFormation(): void {
    const scoreDiff = this.gameState.homeScore - this.gameState.awayScore
    const maxGameTime = 90000 // 90 seconds default
    const timeRemaining = maxGameTime - this.gameState.gameTime
    const timeRatio = timeRemaining / maxGameTime
    
    // Dynamic formation selection based on game context
    if (this.aiState.phase === 'defending' && this.aiState.pressure > 0.7) {
      this.currentFormation = 'defensive'
    } else if (scoreDiff < 0 && timeRatio < 0.3) {
      // Losing with little time left
      this.currentFormation = 'attacking'
    } else if (scoreDiff > 1 && timeRatio < 0.5) {
      // Comfortably winning
      this.currentFormation = 'defensive'
    } else {
      this.currentFormation = 'balanced'
    }
  }
  
  private makeDecision(player: Player): any {
    const ballDist = Math.hypot(this.ball.x - player.x, this.ball.y - player.y)
    const hasBall = this.ball.possessor === player
    
    // Try to pick up loose ball if very close
    if (!hasBall && !this.ball.possessor && !this.gameState.ballOut && 
        ballDist < player.radius + this.ball.radius) {
      return { action: 'pickup' }
    }
    
    if (hasBall) {
      return this.makeDecisionWithBall(player)
    } else {
      return this.makeDecisionWithoutBall(player, ballDist)
    }
  }
  
  private makeDecisionWithBall(player: Player): any {
    // Analyze all options
    const passOptions = this.evaluatePassOptions(player)
    const dribbleOptions = this.evaluateDribbleOptions(player)
    const shotOption = this.evaluateShotOption(player)
    
    // Calculate decision scores
    const bestPass = passOptions.length > 0 ? 
      passOptions.reduce((a, b) => a.score > b.score ? a : b) : null
    const bestDribble = dribbleOptions.length > 0 ?
      dribbleOptions.reduce((a, b) => (1 - a.risk) > (1 - b.risk) ? a : b) : null
    
    // Time pressure factor
    const timePressure = this.calculateTimePressure(player)
    
    // Decision weights based on context
    const isGoalkeeper = player.role === 'goalkeeper'
    const weights = {
      pass: bestPass ? bestPass.score * (1 + timePressure) : 0,
      dribble: bestDribble ? (1 - bestDribble.risk) * (1 - timePressure * 0.5) : 0,
      shot: shotOption ? shotOption.expectedGoalProbability * (1 + this.aiState.pressure * 0.3) : 0
    }
    
    // Goalkeepers should rarely dribble - heavily favor passing
    if (isGoalkeeper) {
      weights.pass *= 2.5  // Strong preference for passing
      weights.dribble *= 0.1  // Heavily discourage dribbling
      weights.shot = 0  // Goalkeepers don't shoot from their area
    }
    
    // Add randomness based on difficulty
    const randomFactor = Math.random() * (1 - this.params.decisionSpeed)
    
    // Select action with highest weight
    let decision = 'pass'
    let maxWeight = weights.pass
    
    if (weights.dribble > maxWeight + randomFactor) {
      decision = 'dribble'
      maxWeight = weights.dribble
    }
    
    if (weights.shot > maxWeight + randomFactor) {
      decision = 'shot'
    }
    
    // Return decision with details
    switch (decision) {
      case 'pass':
        return { action: 'pass', target: bestPass }
      case 'dribble':
        return { action: 'dribble', option: bestDribble }
      case 'shot':
        return { action: 'shot', option: shotOption }
      default:
        return { action: 'dribble', option: bestDribble }
    }
  }
  
  private makeDecisionWithoutBall(player: Player, ballDist: number): any {
    // Check if should chase ball
    if (this.shouldChaseBall(player, ballDist)) {
      return { action: 'chase' }
    }
    
    // Otherwise, take tactical position
    return { action: 'position' }
  }
  
  private evaluatePassOptions(player: Player): PassOption[] {
    const teammates = this.players.filter(p => 
      p.team === player.team && p !== player && !p.isSentOff
    )
    
    const options: PassOption[] = []
    
    teammates.forEach(teammate => {
      const distance = Math.hypot(teammate.x - player.x, teammate.y - player.y)
      const angle = Math.atan2(teammate.y - player.y, teammate.x - player.x)
      
      // Check pass lane
      const isBlocked = this.isPassLaneBlocked(player, teammate)
      const isForward = this.isForwardPass(player, teammate)
      
      // Determine pass type - goalkeepers prefer longer passes
      let passType: 'short' | 'through' | 'long' | 'cross'
      const isGoalkeeper = player.role === 'goalkeeper'
      
      if (isGoalkeeper) {
        // Goalkeepers prefer long passes to clear danger
        if (distance < 150 && !isBlocked) {
          passType = 'short'
        } else if (isForward && teammate.role === 'striker') {
          passType = 'through'
        } else if (distance > 200) {
          passType = 'long'
        } else {
          passType = 'long' // Default to long for safety
        }
      } else {
        // Regular player logic
        if (distance < 100) {
          passType = 'short'
        } else if (isForward && teammate.role === 'striker') {
          passType = 'through'
        } else if (distance > 250) {
          passType = 'long'
        } else {
          passType = Math.abs(angle) > Math.PI / 3 ? 'cross' : 'short'
        }
      }
      
      // Calculate risk and success probability
      const risk = this.calculatePassRisk(player, teammate, passType, isBlocked)
      const expectedSuccess = this.calculatePassSuccess(player, teammate, passType)
      
      // Calculate score
      let score = expectedSuccess * (1 - risk)
      
      // Boost score for tactical advantages
      if (isForward) score *= 1.3
      if (teammate.role === 'striker' && this.aiState.phase === 'attacking') score *= 1.2
      if (this.isInSpace(teammate)) score *= 1.1
      
      // Goalkeepers prefer safer, longer passes
      if (isGoalkeeper) {
        if (passType === 'long') score *= 1.4  // Prefer long clearances
        if (distance > 300) score *= 1.2  // Extra boost for very long passes
        if (isBlocked && passType !== 'long') score *= 0.5  // Heavily penalize blocked short passes
      }
      
      options.push({
        target: teammate,
        score,
        type: passType,
        risk,
        expectedSuccess
      })
    })
    
    return options.sort((a, b) => b.score - a.score)
  }
  
  private evaluateDribbleOptions(player: Player): DribbleOption[] {
    const options: DribbleOption[] = []
    
    // Evaluate different dribble directions
    const angles = [-Math.PI/3, -Math.PI/6, 0, Math.PI/6, Math.PI/3]
    const goalAngle = this.getAngleToGoal(player)
    
    angles.forEach(angleOffset => {
      const direction = goalAngle + angleOffset
      const checkDist = 40
      
      // Check space in this direction
      const space = this.checkSpaceInDirection(player, direction, checkDist)
      const opponents = this.getOpponentsInPath(player, direction, checkDist)
      
      // Determine dribble type based on context
      let type: 'simple' | 'skill' | 'burst'
      if (opponents.length === 0) {
        type = 'burst'
      } else if (opponents.length === 1 && player.attributes.dribbling > 70) {
        type = 'skill'
      } else {
        type = 'simple'
      }
      
      // Calculate risk
      const risk = this.calculateDribbleRisk(player, direction, opponents, type)
      
      options.push({
        direction,
        distance: space,
        type,
        risk
      })
    })
    
    return options
  }
  
  private evaluateShotOption(player: Player): ShotOption | null {
    const goalDist = this.getDistanceToGoal(player)
    
    // Check if in shooting range
    if (goalDist > 350) return null
    
    const angle = this.getAngleToGoal(player)
    const goalWidth = 120 // Approximate goal width
    
    // Check shooting angle
    const angleToPost1 = Math.atan2(goalWidth/2, goalDist)
    const angleToPost2 = Math.atan2(-goalWidth/2, goalDist)
    
    // Determine shot type
    let type: 'placement' | 'power' | 'chip'
    if (goalDist < 150 && Math.abs(angle) < Math.PI/4) {
      type = 'placement'
    } else if (goalDist > 250) {
      type = 'power'
    } else {
      // Check if goalkeeper is off line
      const gk = this.getOpponentGoalkeeper(player)
      if (gk && this.isGoalkeeperOffLine(gk, player)) {
        type = 'chip'
      } else {
        type = Math.random() > 0.5 ? 'placement' : 'power'
      }
    }
    
    // Calculate expected goal probability
    const xG = this.calculateExpectedGoals(player, goalDist, angle, type)
    
    return {
      power: this.calculateShotPower(goalDist, type),
      angle: angle + (Math.random() - 0.5) * 0.2,
      type,
      expectedGoalProbability: xG
    }
  }
  
  private calculateTimePressure(player: Player): number {
    if (!player.ballTouchTime) {
      player.ballTouchTime = Date.now()
    }
    
    const timeWithBall = (Date.now() - player.ballTouchTime) / 1000
    const pressure = Math.min(1, timeWithBall / 3) // Max pressure after 3 seconds
    
    // Add opponent pressure
    const nearbyOpponents = this.players.filter(p => {
      const dist = Math.hypot(p.x - player.x, p.y - player.y)
      return p.team !== player.team && !p.isSentOff && dist < 50
    }).length
    
    return Math.min(1, pressure + nearbyOpponents * 0.2)
  }
  
  private calculatePassRisk(from: Player, to: Player, type: string, isBlocked: boolean): number {
    let risk = 0
    
    // Base risk by pass type
    const baseRisk = {
      'short': 0.1,
      'through': 0.3,
      'long': 0.4,
      'cross': 0.35
    }
    
    risk = baseRisk[type as keyof typeof baseRisk] || 0.2
    
    // Increase risk if blocked
    if (isBlocked) risk += 0.4
    
    // Adjust by player skill
    const passingSkill = from.attributes.passing / 99
    risk *= (2 - passingSkill)
    
    // Pressure factor
    risk += this.aiState.pressure * 0.2
    
    return Math.min(1, risk)
  }
  
  private calculatePassSuccess(from: Player, to: Player, type: string): number {
    const distance = Math.hypot(to.x - from.x, to.y - from.y)
    const passingAbility = (from.attributes.passing + from.attributes.vision) / 198
    const isGoalkeeper = from.role === 'goalkeeper'
    
    // Base success rate by type
    let success = 1
    
    if (isGoalkeeper) {
      // Goalkeepers have specialized kicking skills
      switch (type) {
        case 'short':
          success = 0.95  // Very accurate short passes
          break
        case 'through':
          success = 0.85  // Good at directed long balls
          break
        case 'long':
          success = 0.9 - (distance / 800) * 0.1  // Excellent at long clearances
          break
        case 'cross':
          success = 0.8  // Good at distributing to wings
          break
      }
    } else {
      // Regular player success rates
      switch (type) {
        case 'short':
          success = 0.95 - (distance / 200) * 0.2
          break
        case 'through':
          success = 0.7 + passingAbility * 0.2
          break
        case 'long':
          success = 0.6 + passingAbility * 0.3 - (distance / 500) * 0.2
          break
        case 'cross':
          success = 0.65 + passingAbility * 0.25
          break
      }
    }
    
    // Receiver skill factor
    const receivingSkill = (to.attributes.technique + to.attributes.agility) / 198
    success *= (0.8 + receivingSkill * 0.2)
    
    return Math.max(0.1, Math.min(1, success))
  }
  
  private calculateDribbleRisk(player: Player, direction: number, opponents: Player[], type: string): number {
    const dribbleSkill = (player.attributes.dribbling + player.attributes.agility + player.attributes.technique) / 297
    
    // Base risk by type
    let risk = 0
    switch (type) {
      case 'simple':
        risk = 0.2
        break
      case 'skill':
        risk = 0.4 - dribbleSkill * 0.3
        break
      case 'burst':
        risk = 0.15
        break
    }
    
    // Add risk per opponent
    risk += opponents.length * 0.2
    
    // Reduce risk for skilled players
    risk *= (2 - dribbleSkill)
    
    return Math.min(1, risk)
  }
  
  private calculateExpectedGoals(player: Player, distance: number, angle: number, type: string): number {
    const finishingSkill = (player.attributes.finishing + player.attributes.technique) / 198
    
    // Base xG by distance
    let xG = Math.max(0, 1 - distance / 400)
    
    // Angle factor
    const angleFactor = Math.cos(angle) // Better xG for central positions
    xG *= (0.5 + angleFactor * 0.5)
    
    // Shot type factor
    const typeMultiplier = {
      'placement': 1.1,
      'power': 0.9,
      'chip': 0.7
    }
    xG *= typeMultiplier[type as keyof typeof typeMultiplier] || 1
    
    // Player skill factor
    xG *= (0.5 + finishingSkill * 0.5)
    
    // Pressure reduction
    xG *= (1 - this.aiState.pressure * 0.3)
    
    return Math.max(0, Math.min(1, xG))
  }
  
  private executeDecision(player: Player, decision: any): void {
    switch (decision.action) {
      case 'pickup':
        this.pickUpBall(player)
        break
      
      case 'pass':
        if (decision.target) {
          this.executePass(player, decision.target)
        }
        break
      
      case 'dribble':
        if (decision.option) {
          this.executeDribble(player, decision.option)
        }
        break
      
      case 'shot':
        if (decision.option) {
          this.executeShot(player, decision.option)
        }
        break
      
      case 'chase':
        this.chaseBall(player)
        break
      
      case 'position':
        this.moveToTacticalPosition(player)
        break
    }
  }
  
  private pickUpBall(player: Player): void {
    // Check if this player took the restart and cannot touch the ball yet
    if (this.ball.restartTaker === player) {
      return
    }
    
    const ballSpeed = Math.hypot(this.ball.vx, this.ball.vy)
    const controlSkill = (player.attributes.technique + player.attributes.agility) / 198
    const controlChance = 0.9 - (ballSpeed / 20) * 0.5 + controlSkill * 0.1
    
    if (Math.random() < controlChance) {
      this.ball.possessor = player
      this.ball.vx = 0
      this.ball.vy = 0
      this.ball.vz = 0
      this.ball.isStationary = false
      this.gameState.possession = player.team
      player.ballTouchTime = Date.now()
      
      // Clear restart taker once another player touches the ball
      if (this.ball.restartTaker) {
        this.ball.restartTaker = null
      }
    }
  }
  
  private executePass(player: Player, passOption: PassOption): void {
    const target = passOption.target
    const distance = Math.hypot(target.x - player.x, target.y - player.y)
    
    // Calculate pass destination based on type
    let passX = target.x
    let passY = target.y
    
    if (passOption.type === 'through') {
      // Pass into space ahead of target
      const runDirection = target.team === 'home' ? 1 : -1
      passX = target.x + runDirection * 30 + target.vx * 2
      passY = target.y + target.vy * 2
    } else if (passOption.type === 'cross') {
      // Aim for penalty area
      const goalX = player.team === 'home' ? this.config.fieldWidth - 100 : 100
      passX = goalX
      passY = this.config.fieldHeight / 2 + (Math.random() - 0.5) * 100
    }
    
    // Calculate pass vector
    const angle = Math.atan2(passY - player.y, passX - player.x)
    
    // Add error based on skill and risk
    const errorMagnitude = (1 - this.params.passAccuracy) * passOption.risk
    const errorAngle = (Math.random() - 0.5) * errorMagnitude * 0.5
    const finalAngle = angle + errorAngle
    
    // Calculate power - goalkeepers get significantly more power
    const isGoalkeeper = player.role === 'goalkeeper'
    const goalkeeperMultiplier = isGoalkeeper ? 1.8 : 1.0
    const basePower = Math.min(isGoalkeeper ? 20 : 12, 4 + distance / 40)
    const power = basePower * (1 + (passOption.type === 'long' ? 0.2 : 0)) * goalkeeperMultiplier
    
    // Release ball
    this.ball.possessor = null
    this.ball.vx = Math.cos(finalAngle) * power
    this.ball.vy = Math.sin(finalAngle) * power
    
    // Set height based on pass type - goalkeepers always kick higher to avoid interceptions
    if (isGoalkeeper) {
      // Goalkeeper kicks always have height to go over players
      switch (passOption.type) {
        case 'short':
          this.ball.vz = 1.5 + Math.random() * 0.5  // Even short passes have some height
          break
        case 'through':
          this.ball.vz = 2 + Math.random() * 0.5
          break
        case 'long':
          this.ball.vz = 3 + Math.random() * 1.5  // High clearances
          break
        case 'cross':
          this.ball.vz = 3.5 + Math.random()
          break
      }
    } else {
      // Regular player heights
      switch (passOption.type) {
        case 'short':
          this.ball.vz = 0
          break
        case 'through':
          this.ball.vz = 0.3
          break
        case 'long':
          this.ball.vz = 2 + Math.random()
          break
        case 'cross':
          this.ball.vz = 2.5 + Math.random() * 0.5
          break
      }
    }
    
    this.ball.lastKicker = player
    player.ballTouchTime = undefined
    
    // Update stats
    if (player.team === 'home') {
      this.gameState.passCount.home++
    } else {
      this.gameState.passCount.away++
    }
  }
  
  private executeDribble(player: Player, dribbleOption: DribbleOption): void {
    
    // Set target based on dribble type
    switch (dribbleOption.type) {
      case 'simple':
        // Small touches
        player.targetX = player.x + Math.cos(dribbleOption.direction) * 25
        player.targetY = player.y + Math.sin(dribbleOption.direction) * 25
        break
      
      case 'skill':
        // Skill move with direction change
        const skillAngle = dribbleOption.direction + (Math.random() - 0.5) * Math.PI/3
        player.targetX = player.x + Math.cos(skillAngle) * 35
        player.targetY = player.y + Math.sin(skillAngle) * 35
        break
      
      case 'burst':
        // Sprint burst
        player.targetX = player.x + Math.cos(dribbleOption.direction) * 60
        player.targetY = player.y + Math.sin(dribbleOption.direction) * 60
        break
    }
    
    // Keep in bounds
    player.targetX = Math.max(20, Math.min(this.config.fieldWidth - 20, player.targetX))
    player.targetY = Math.max(20, Math.min(this.config.fieldHeight - 20, player.targetY))
  }
  
  private executeShot(player: Player, shotOption: ShotOption): void {
    
    // Add shot error based on pressure and skill
    const accuracy = (player.attributes.finishing + player.attributes.technique) / 198
    const errorRange = (1 - accuracy) * 0.4 + this.aiState.pressure * 0.2
    const angleError = (Math.random() - 0.5) * errorRange
    
    const finalAngle = shotOption.angle + angleError
    
    // Release ball
    this.ball.possessor = null
    this.ball.vx = Math.cos(finalAngle) * shotOption.power
    this.ball.vy = Math.sin(finalAngle) * shotOption.power
    
    // Set height based on shot type
    switch (shotOption.type) {
      case 'placement':
        this.ball.vz = 0.5 + Math.random() * 0.5
        break
      case 'power':
        this.ball.vz = 1 + Math.random() * 2
        break
      case 'chip':
        this.ball.vz = 3 + Math.random()
        break
    }
    
    // Add spin for curved shots
    if (player.attributes.curve > 70) {
      this.ball.spin = {
        x: (Math.random() - 0.5) * player.attributes.curve / 20,
        y: (Math.random() - 0.5) * player.attributes.curve / 20,
        z: 0
      }
    }
    
    this.ball.lastKicker = player
    player.ballTouchTime = undefined
    
    // Update stats
    if (player.team === 'home') {
      this.gameState.shots.home++
    } else {
      this.gameState.shots.away++
    }
  }
  
  private chaseBall(player: Player): void {
    const ballSpeed = Math.hypot(this.ball.vx, this.ball.vy)
    const playerSpeed = this.calculatePlayerSpeed(player, true)
    
    // Predict ball position
    const timeToReach = Math.hypot(this.ball.x - player.x, this.ball.y - player.y) / playerSpeed
    let predictedX = this.ball.x
    let predictedY = this.ball.y
    
    if (ballSpeed > 0.5) {
      const friction = 0.98
      let vx = this.ball.vx
      let vy = this.ball.vy
      
      for (let t = 0; t < timeToReach; t += 0.1) {
        vx *= friction
        vy *= friction
        predictedX += vx * 0.1
        predictedY += vy * 0.1
      }
    }
    
    // Set target to intercept point
    player.targetX = Math.max(10, Math.min(this.config.fieldWidth - 10, predictedX))
    player.targetY = Math.max(10, Math.min(this.config.fieldHeight - 10, predictedY))
  }
  
  private moveToTacticalPosition(player: Player): void {
    const formation = this.formations.get(this.currentFormation)!
    const isHome = player.team === 'home'
    
    // Get base position from formation
    const roleKey = this.getRoleKey(player)
    const basePos = formation.positions.get(roleKey) || { x: 0.5, y: 0.5 }
    
    // Adjust position based on ball location and game state
    let idealX = isHome ? 
      basePos.x * this.config.fieldWidth :
      (1 - basePos.x) * this.config.fieldWidth
    
    let idealY = basePos.y * this.config.fieldHeight
    
    // Apply formation modifiers
    const ballX = this.ball.x / this.config.fieldWidth
    const shiftX = (ballX - 0.5) * formation.depth * 100
    idealX += isHome ? shiftX : -shiftX
    
    // Compact/stretch based on team shape
    if (this.aiState.teamShape === 'compact') {
      const centerX = this.getTeamCenterX(player.team)
      idealX = idealX + (centerX - idealX) * 0.3
    }
    
    // Add intelligent positioning adjustments
    idealX = this.adjustPositionForSpace(player, idealX, idealY).x
    idealY = this.adjustPositionForSpace(player, idealX, idealY).y
    
    // Smooth movement to position
    const currentDist = Math.hypot(idealX - player.x, idealY - player.y)
    if (currentDist > 15 || !player.targetX) {
      player.targetX = player.x + (idealX - player.x) * 0.7
      player.targetY = player.y + (idealY - player.y) * 0.7
    }
  }
  
  private applyMovement(player: Player): void {
    if (!player.targetX || !player.targetY) return
    
    const dx = player.targetX - player.x
    const dy = player.targetY - player.y
    const dist = Math.hypot(dx, dy)
    
    if (dist > 1) {
      const hasBall = this.ball.possessor === player
      const isSprinting = dist > 50 && !hasBall
      
      // Calculate speed
      const baseSpeed = this.calculatePlayerSpeed(player, isSprinting)
      const acceleration = 0.1 + (player.attributes.acceleration / 99) * 0.1
      
      // Update stamina
      if (isSprinting) {
        player.stamina = Math.max(0, player.stamina - 0.25)
      } else {
        player.stamina = Math.min(player.maxStamina, player.stamina + 0.1)
      }
      
      // Calculate velocity
      const targetVx = (dx / dist) * baseSpeed
      const targetVy = (dy / dist) * baseSpeed
      
      // Smooth acceleration
      player.vx += (targetVx - player.vx) * acceleration
      player.vy += (targetVy - player.vy) * acceleration
      
      // Update facing
      player.facing = Math.atan2(dy, dx)
    } else {
      // Decelerate when close to target
      player.vx *= 0.85
      player.vy *= 0.85
    }
    
    // Apply physics
    player.x += player.vx
    player.y += player.vy
    
    // Keep in bounds
    player.x = Math.max(10, Math.min(this.config.fieldWidth - 10, player.x))
    player.y = Math.max(10, Math.min(this.config.fieldHeight - 10, player.y))
    
    // Move ball with player if possessed
    if (this.ball.possessor === player) {
      const dribbleSkill = player.attributes.dribbling / 99
      const ballDistance = 12 + (1 - dribbleSkill) * 5
      
      this.ball.x = player.x + Math.cos(player.facing) * ballDistance
      this.ball.y = player.y + Math.sin(player.facing) * ballDistance
      this.ball.z = 0
      this.ball.vx = player.vx * 0.9
      this.ball.vy = player.vy * 0.9
      this.ball.vz = 0
    }
  }
  
  // Helper methods
  
  private shouldChaseBall(player: Player, ballDist: number): boolean {
    if (this.gameState.ballOut) return false
    
    // Check if player is in restart cooldown
    if (player.restartCooldown && Date.now() < player.restartCooldown) {
      return false
    }
    
    // Always chase if very close
    if (ballDist < 30) return true
    
    // Role-based chase logic
    const maxChaseDistance = {
      'goalkeeper': player.team === 'home' ? 
        (this.ball.x < 150 ? 100 : 0) : 
        (this.ball.x > this.config.fieldWidth - 150 ? 100 : 0),
      'defender': 150,
      'midfielder': 200,
      'striker': 250
    }
    
    const roleMaxDist = maxChaseDistance[player.role as keyof typeof maxChaseDistance] || 150
    if (ballDist > roleMaxDist) return false
    
    // Check if player is closest on team
    const teammates = this.players.filter(p => p.team === player.team && !p.isSentOff)
    const closerTeammates = teammates.filter(p => {
      const pDist = Math.hypot(this.ball.x - p.x, this.ball.y - p.y)
      return pDist < ballDist - 10
    })
    
    return closerTeammates.length === 0
  }
  
  private isPassLaneBlocked(from: Player, to: Player): boolean {
    const opponents = this.players.filter(p => p.team !== from.team && !p.isSentOff)
    
    for (const opp of opponents) {
      const distToLine = this.distanceToLine(opp.x, opp.y, from.x, from.y, to.x, to.y)
      if (distToLine < 20) return true
    }
    
    return false
  }
  
  private isForwardPass(from: Player, to: Player): boolean {
    const isHome = from.team === 'home'
    return isHome ? to.x > from.x : to.x < from.x
  }
  
  private isInSpace(player: Player): boolean {
    const opponents = this.players.filter(p => p.team !== player.team && !p.isSentOff)
    
    for (const opp of opponents) {
      const dist = Math.hypot(opp.x - player.x, opp.y - player.y)
      if (dist < 40) return false
    }
    
    return true
  }
  
  private checkSpaceInDirection(player: Player, direction: number, distance: number): number {
    const checkX = player.x + Math.cos(direction) * distance
    const checkY = player.y + Math.sin(direction) * distance
    
    let minDist = distance
    
    this.players.forEach(other => {
      if (other !== player && !other.isSentOff) {
        const dist = Math.hypot(checkX - other.x, checkY - other.y)
        minDist = Math.min(minDist, dist)
      }
    })
    
    return minDist
  }
  
  private getOpponentsInPath(player: Player, direction: number, distance: number): Player[] {
    const opponents: Player[] = []
    const endX = player.x + Math.cos(direction) * distance
    const endY = player.y + Math.sin(direction) * distance
    
    this.players.forEach(p => {
      if (p.team !== player.team && !p.isSentOff) {
        const distToPath = this.distanceToLine(p.x, p.y, player.x, player.y, endX, endY)
        if (distToPath < 30) {
          opponents.push(p)
        }
      }
    })
    
    return opponents
  }
  
  private getDistanceToGoal(player: Player): number {
    const goalX = player.team === 'home' ? this.config.fieldWidth : 0
    const goalY = this.config.fieldHeight / 2
    return Math.hypot(goalX - player.x, goalY - player.y)
  }
  
  private getAngleToGoal(player: Player): number {
    const goalX = player.team === 'home' ? this.config.fieldWidth : 0
    const goalY = this.config.fieldHeight / 2
    return Math.atan2(goalY - player.y, goalX - player.x)
  }
  
  private getOpponentGoalkeeper(player: Player): Player | null {
    return this.players.find(p => 
      p.team !== player.team && p.role === 'goalkeeper' && !p.isSentOff
    ) || null
  }
  
  private isGoalkeeperOffLine(gk: Player, _shooter: Player): boolean {
    const goalX = gk.team === 'home' ? 30 : this.config.fieldWidth - 30
    const distFromGoal = Math.abs(gk.x - goalX)
    return distFromGoal > 50
  }
  
  private calculateShotPower(distance: number, type: string): number {
    const basePower = {
      'placement': 7 + distance / 50,
      'power': 10 + distance / 30,
      'chip': 5 + distance / 60
    }
    
    return Math.min(15, basePower[type as keyof typeof basePower] || 10)
  }
  
  private calculateDribbleSpeed(player: Player, type: string): number {
    const baseSpeed = 3 + (player.attributes.pace / 99) * 4
    const dribbleModifier = player.attributes.dribbling / 99
    
    const typeMultiplier = {
      'simple': 0.7,
      'skill': 0.6,
      'burst': 1.2
    }
    
    return baseSpeed * (typeMultiplier[type as keyof typeof typeMultiplier] || 0.8) * 
           (0.6 + dribbleModifier * 0.4)
  }
  
  private calculatePlayerSpeed(player: Player, isSprinting: boolean): number {
    const staminaFactor = player.stamina / player.maxStamina
    const baseSpeed = 3 + (player.attributes.pace / 99) * 4
    
    return baseSpeed * 
           (isSprinting ? 1.4 : 1) * 
           (0.6 + staminaFactor * 0.4) *
           (this.ball.possessor === player ? 0.8 : 1)
  }
  
  private getRoleKey(player: Player): string {
    // Map multiple players of same role to formation positions
    const sameRolePlayers = this.players.filter(p => 
      p.team === player.team && p.role === player.role && !p.isSentOff
    ).sort((a, b) => a.number - b.number)
    
    const index = sameRolePlayers.indexOf(player)
    
    switch (player.role) {
      case 'goalkeeper':
        return 'goalkeeper'
      case 'defender':
        return `defender${index > 0 ? index + 1 : ''}`
      case 'midfielder':
        return `midfielder${index > 0 ? index + 1 : ''}`
      case 'striker':
        return `striker${index > 0 ? index + 1 : ''}`
      default:
        return 'midfielder'
    }
  }
  
  private getTeamCenterX(team: 'home' | 'away'): number {
    const teamPlayers = this.players.filter(p => p.team === team && !p.isSentOff)
    const totalX = teamPlayers.reduce((sum, p) => sum + p.x, 0)
    return totalX / teamPlayers.length
  }
  
  private adjustPositionForSpace(player: Player, x: number, y: number): { x: number, y: number } {
    // Find nearby teammates and opponents
    const nearbyPlayers = this.players.filter(p => {
      if (p === player || p.isSentOff) return false
      const dist = Math.hypot(p.x - x, p.y - y)
      return dist < 50
    })
    
    // Calculate repulsion forces
    let adjustX = 0
    let adjustY = 0
    
    nearbyPlayers.forEach(other => {
      const dx = x - other.x
      const dy = y - other.y
      const dist = Math.hypot(dx, dy)
      
      if (dist > 0 && dist < 50) {
        const force = (50 - dist) / 50
        adjustX += (dx / dist) * force * 20
        adjustY += (dy / dist) * force * 20
      }
    })
    
    return {
      x: Math.max(20, Math.min(this.config.fieldWidth - 20, x + adjustX)),
      y: Math.max(20, Math.min(this.config.fieldHeight - 20, y + adjustY))
    }
  }
  
  private distanceToLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
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
  
  // Kickoff handler
  handleKickoff(): void {
    const centerX = this.config.fieldWidth / 2
    const centerY = this.config.fieldHeight / 2
    
    // Reset ball
    this.ball.x = centerX
    this.ball.y = centerY
    this.ball.z = 0
    this.ball.vx = 0
    this.ball.vy = 0
    this.ball.vz = 0
    this.ball.possessor = null
    this.ball.isStationary = false
    
    // Position players according to kickoff formation
    this.players.forEach(player => {
      player.vx = 0
      player.vy = 0
      player.targetX = undefined
      player.targetY = undefined
      player.isMovingToRestart = false
      
      const isHome = player.team === 'home'
      const sideMultiplier = isHome ? -1 : 1
      
      // Special kickoff positions
      switch (player.role) {
        case 'goalkeeper':
          player.x = isHome ? 50 : this.config.fieldWidth - 50
          player.y = centerY
          break
          
        case 'defender':
          const defIndex = this.players.filter(p => 
            p.team === player.team && p.role === 'defender' && p.number <= player.number
          ).length
          player.x = centerX + sideMultiplier * 150
          player.y = centerY + (defIndex === 1 ? -60 : 60)
          break
          
        case 'midfielder':
          player.x = centerX + sideMultiplier * 80
          player.y = centerY + (player.number % 2 === 0 ? -40 : 40)
          break
          
        case 'striker':
          if (isHome && this.players.filter(p => p.team === 'home' && p.role === 'striker')[0] === player) {
            player.x = centerX - 15
            player.y = centerY
          } else {
            player.x = centerX + sideMultiplier * 60
            player.y = centerY
          }
          break
      }
    })
    
    // Execute kickoff after delay
    setTimeout(() => {
      if (this.ball.possessor === null) {
        this.ball.vx = -2
        this.ball.vy = 1
        this.ball.vz = 0
      }
    }, 500)
  }
}