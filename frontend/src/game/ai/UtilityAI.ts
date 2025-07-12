// Utility-based AI system for football game
import type { Player, Ball, GameState } from '../engine/FutsalGameEngine'

export interface AIAction {
  type: 'shoot' | 'pass' | 'dribble' | 'hold' | 'clear'
  utility: number
  target?: Player | { x: number; y: number }
  metadata?: any
}

export interface AIContext {
  player: Player
  ball: Ball
  gameState: GameState
  teammates: Player[]
  opponents: Player[]
  fieldWidth: number
  fieldHeight: number
  goalWidth: number
}

export class UtilityAI {
  // Action evaluation weights (can be tuned)
  private static readonly WEIGHTS = {
    // Shooting weights
    SHOOT_DISTANCE: 0.3,
    SHOOT_ANGLE: 0.2,
    SHOOT_PRESSURE: 0.2,
    SHOOT_SKILL: 0.15,
    SHOOT_GAME_STATE: 0.15,
    
    // Passing weights
    PASS_SUCCESS: 0.25,
    PASS_DANGER: 0.2,
    PASS_ADVANCE: 0.15,
    PASS_PRESSURE: 0.15,
    PASS_TEAMMATE_POSITION: 0.15,
    PASS_SKILL: 0.1,
    
    // Dribbling weights
    DRIBBLE_SPACE: 0.3,
    DRIBBLE_SKILL: 0.25,
    DRIBBLE_PRESSURE: 0.2,
    DRIBBLE_ADVANCE: 0.15,
    DRIBBLE_STAMINA: 0.1,
    
    // General weights
    COMPOSURE_EFFECT: 0.8,
    FATIGUE_EFFECT: 0.7
  }

  /**
   * Evaluate all possible actions and return the best one
   */
  static evaluateActions(context: AIContext): AIAction {
    const actions: AIAction[] = []
    
    // Evaluate shooting
    const shootUtility = this.evaluateShoot(context)
    if (shootUtility > 0) {
      actions.push({ type: 'shoot', utility: shootUtility })
    }
    
    // Evaluate passing to each teammate
    const passActions = this.evaluatePasses(context)
    actions.push(...passActions)
    
    // Evaluate dribbling
    const dribbleUtility = this.evaluateDribble(context)
    actions.push({ type: 'dribble', utility: dribbleUtility })
    
    // Evaluate holding (shielding ball)
    const holdUtility = this.evaluateHold(context)
    actions.push({ type: 'hold', utility: holdUtility })
    
    // Evaluate clearing (emergency)
    const clearUtility = this.evaluateClear(context)
    actions.push({ type: 'clear', utility: clearUtility })
    
    // Apply composure and fatigue modifiers
    const composureMod = this.getComposureModifier(context)
    const fatigueMod = this.getFatigueModifier(context)
    
    actions.forEach(action => {
      action.utility *= composureMod * fatigueMod
    })
    
    // Return the action with highest utility
    return actions.reduce((best, current) => 
      current.utility > best.utility ? current : best
    )
  }

  /**
   * Evaluate shooting utility
   */
  private static evaluateShoot(context: AIContext): number {
    const { player, gameState, opponents, fieldWidth, fieldHeight, goalWidth } = context
    
    // Calculate distance to goal
    const goalX = player.team === 'home' ? fieldWidth : 0
    const goalY = fieldHeight / 2
    const distToGoal = Math.hypot(goalX - player.x, goalY - player.y)
    
    // Distance score (closer is better, max at 100 units)
    const distanceScore = Math.max(0, 1 - distToGoal / 300)
    
    // Angle score (straight on is best)
    const angleToGoal = Math.abs(Math.atan2(goalY - player.y, goalX - player.x))
    const angleScore = 1 - Math.abs(angleToGoal) / (Math.PI / 2)
    
    // Pressure score (less pressure is better)
    const pressure = this.calculatePressure(player, opponents)
    const pressureScore = 1 - pressure
    
    // Skill score
    const skillScore = (
      player.attributes.finishing / 99 * 0.4 +
      player.attributes.technique / 99 * 0.3 +
      player.attributes.composure / 99 * 0.3
    )
    
    // Game state score
    let gameStateScore = 0.5 // neutral
    const timeFactor = 1 - (gameState.gameTime / 90000) // 0 = start, 1 = end
    const scoreDiff = gameState.homeScore - gameState.awayScore
    const teamScoreDiff = player.team === 'home' ? scoreDiff : -scoreDiff
    
    if (teamScoreDiff < 0) {
      // Losing - more aggressive
      gameStateScore = 0.6 + timeFactor * 0.3
    } else if (teamScoreDiff > 0) {
      // Winning - more conservative
      gameStateScore = 0.4 - timeFactor * 0.2
    }
    
    // Only consider shooting if within reasonable range
    if (distToGoal > 250) return 0
    
    // Calculate weighted utility
    return (
      distanceScore * this.WEIGHTS.SHOOT_DISTANCE +
      angleScore * this.WEIGHTS.SHOOT_ANGLE +
      pressureScore * this.WEIGHTS.SHOOT_PRESSURE +
      skillScore * this.WEIGHTS.SHOOT_SKILL +
      gameStateScore * this.WEIGHTS.SHOOT_GAME_STATE
    )
  }

  /**
   * Evaluate passing utilities for all teammates
   */
  private static evaluatePasses(context: AIContext): AIAction[] {
    const { player, teammates, opponents, fieldWidth, fieldHeight } = context
    const passActions: AIAction[] = []
    
    for (const teammate of teammates) {
      if (teammate === player || teammate.isSentOff) continue
      
      // Success probability
      const successProb = this.calculatePassSuccess(player, teammate, opponents)
      
      // Danger created (how close to goal)
      const dangerScore = this.calculateDangerPosition(teammate, player.team, fieldWidth, fieldHeight)
      
      // Advance score (moving ball forward)
      const advanceScore = this.calculateAdvanceScore(player, teammate, fieldWidth)
      
      // Pressure relief (passing away from pressure)
      const playerPressure = this.calculatePressure(player, opponents)
      const teammatePressure = this.calculatePressure(teammate, opponents)
      const pressureRelief = Math.max(0, playerPressure - teammatePressure)
      
      // Teammate position quality
      const positionScore = this.evaluateTeammatePosition(teammate, opponents)
      
      // Skill score
      const skillScore = (
        player.attributes.passing / 99 * 0.5 +
        player.attributes.vision / 99 * 0.3 +
        player.attributes.technique / 99 * 0.2
      )
      
      // Calculate weighted utility
      const utility = (
        successProb * this.WEIGHTS.PASS_SUCCESS +
        dangerScore * this.WEIGHTS.PASS_DANGER +
        advanceScore * this.WEIGHTS.PASS_ADVANCE +
        pressureRelief * this.WEIGHTS.PASS_PRESSURE +
        positionScore * this.WEIGHTS.PASS_TEAMMATE_POSITION +
        skillScore * this.WEIGHTS.PASS_SKILL
      )
      
      if (utility > 0.1) { // Minimum threshold
        passActions.push({
          type: 'pass',
          utility,
          target: teammate,
          metadata: { successProb, dangerScore }
        })
      }
    }
    
    return passActions
  }

  /**
   * Evaluate dribbling utility
   */
  private static evaluateDribble(context: AIContext): number {
    const { player, opponents, fieldWidth } = context
    
    // Space available
    const nearestOppDist = Math.min(...opponents.map(opp => 
      Math.hypot(opp.x - player.x, opp.y - player.y)
    ))
    const spaceScore = Math.min(1, nearestOppDist / 50)
    
    // Skill score
    const skillScore = (
      player.attributes.dribbling / 99 * 0.4 +
      player.attributes.agility / 99 * 0.3 +
      player.attributes.balance / 99 * 0.2 +
      player.attributes.pace / 99 * 0.1
    )
    
    // Pressure (lower is better for dribbling)
    const pressure = this.calculatePressure(player, opponents)
    const pressureScore = 1 - pressure
    
    // Advance potential
    const advanceScore = player.team === 'home' ? 
      (player.x / fieldWidth) : 
      (1 - player.x / fieldWidth)
    
    // Stamina consideration
    const staminaRatio = player.stamina / player.maxStamina
    const staminaScore = staminaRatio
    
    return (
      spaceScore * this.WEIGHTS.DRIBBLE_SPACE +
      skillScore * this.WEIGHTS.DRIBBLE_SKILL +
      pressureScore * this.WEIGHTS.DRIBBLE_PRESSURE +
      advanceScore * this.WEIGHTS.DRIBBLE_ADVANCE +
      staminaScore * this.WEIGHTS.DRIBBLE_STAMINA
    )
  }

  /**
   * Evaluate holding/shielding utility
   */
  private static evaluateHold(context: AIContext): number {
    const { player, opponents, teammates } = context
    
    // Good when under pressure but teammates are moving into position
    const pressure = this.calculatePressure(player, opponents)
    
    // Check if teammates are making runs
    const runningSupporters = teammates.filter(t => {
      const speed = Math.hypot(t.vx, t.vy)
      const movingForward = player.team === 'home' ? t.vx > 0 : t.vx < 0
      return speed > 2 && movingForward
    }).length
    
    // Higher utility when under pressure and teammates are moving
    return pressure > 0.6 && runningSupporters > 0 ? 0.5 : 0.1
  }

  /**
   * Evaluate clearing utility (emergency action)
   */
  private static evaluateClear(context: AIContext): number {
    const { player, opponents, fieldWidth } = context
    
    // Only consider clearing in defensive third
    const inDefensiveThird = player.team === 'home' ? 
      player.x < fieldWidth / 3 : 
      player.x > fieldWidth * 2 / 3
    
    if (!inDefensiveThird) return 0
    
    const pressure = this.calculatePressure(player, opponents)
    
    // High pressure in defensive area = clear
    return pressure > 0.8 ? 0.7 : 0
  }

  /**
   * Calculate pressure on a player
   */
  private static calculatePressure(player: Player, opponents: Player[]): number {
    let pressure = 0
    
    for (const opp of opponents) {
      if (opp.isSentOff) continue
      
      const dist = Math.hypot(opp.x - player.x, opp.y - player.y)
      
      if (dist < 50) {
        // Consider opponent's defensive attributes
        const defenseSkill = (
          opp.attributes.marking / 99 * 0.4 +
          opp.attributes.tackling / 99 * 0.3 +
          opp.attributes.anticipation / 99 * 0.3
        )
        
        // Pressure decreases with distance
        const distanceFactor = 1 - dist / 50
        pressure += distanceFactor * defenseSkill
      }
    }
    
    return Math.min(1, pressure)
  }

  /**
   * Calculate pass success probability
   */
  private static calculatePassSuccess(passer: Player, receiver: Player, opponents: Player[]): number {
    const dist = Math.hypot(receiver.x - passer.x, receiver.y - passer.y)
    
    // Base success rate based on distance
    let successRate = Math.max(0.3, 1 - dist / 400)
    
    // Check for intercepting opponents
    for (const opp of opponents) {
      if (opp.isSentOff) continue
      
      // Simple line interception check
      const toReceiver = { x: receiver.x - passer.x, y: receiver.y - passer.y }
      const toOpp = { x: opp.x - passer.x, y: opp.y - passer.y }
      
      // Dot product to check if opponent is in pass lane
      const dot = (toReceiver.x * toOpp.x + toReceiver.y * toOpp.y) / dist
      
      if (dot > 0 && dot < dist) {
        // Cross product for distance from line
        const cross = Math.abs(toReceiver.x * toOpp.y - toReceiver.y * toOpp.x) / dist
        
        if (cross < 20) { // Within interception range
          const interceptionSkill = opp.attributes.anticipation / 99
          successRate *= (1 - interceptionSkill * 0.5)
        }
      }
    }
    
    return successRate
  }

  /**
   * Calculate danger position score
   */
  private static calculateDangerPosition(player: Player, team: 'home' | 'away', fieldWidth: number, fieldHeight: number): number {
    const goalX = team === 'home' ? fieldWidth : 0
    const goalY = fieldHeight / 2
    const distToGoal = Math.hypot(goalX - player.x, goalY - player.y)
    
    // Closer to goal = more dangerous
    return Math.max(0, 1 - distToGoal / 300)
  }

  /**
   * Calculate advance score (moving ball forward)
   */
  private static calculateAdvanceScore(from: Player, to: Player, fieldWidth: number): number {
    const forward = from.team === 'home' ? 
      (to.x - from.x) / fieldWidth : 
      (from.x - to.x) / fieldWidth
    
    return Math.max(0, forward)
  }

  /**
   * Evaluate teammate position quality
   */
  private static evaluateTeammatePosition(teammate: Player, opponents: Player[]): number {
    // Check space around teammate
    const nearestOppDist = Math.min(...opponents.map(opp => 
      Math.hypot(opp.x - teammate.x, opp.y - teammate.y)
    ))
    
    const spaceScore = Math.min(1, nearestOppDist / 40)
    const offBallScore = teammate.attributes.offTheBall / 99
    
    return spaceScore * 0.7 + offBallScore * 0.3
  }

  /**
   * Get composure modifier based on pressure
   */
  private static getComposureModifier(context: AIContext): number {
    const pressure = this.calculatePressure(context.player, context.opponents)
    const composure = context.player.attributes.composure / 99
    
    // High composure reduces impact of pressure
    return this.WEIGHTS.COMPOSURE_EFFECT + (1 - this.WEIGHTS.COMPOSURE_EFFECT) * composure * (1 - pressure)
  }

  /**
   * Get fatigue modifier based on stamina
   */
  private static getFatigueModifier(context: AIContext): number {
    const staminaRatio = context.player.stamina / context.player.maxStamina
    
    if (staminaRatio > 0.7) return 1 // No effect
    if (staminaRatio > 0.5) return 0.9
    if (staminaRatio > 0.3) return 0.75
    return 0.6 // Very tired
  }
}