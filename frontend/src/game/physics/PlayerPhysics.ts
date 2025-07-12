// Player physics for futsal game
import type { Player, Ball } from '../engine/FutsalGameEngine'

export class PlayerPhysics {
  // Physics constants
  private static readonly MAX_SPEED = 8.0 // m/s (realistic futsal player speed)
  private static readonly MAX_SPRINT_SPEED = 10.0 // m/s
  private static readonly ACCELERATION = 15.0 // m/s²
  private static readonly DECELERATION = 20.0 // m/s² (can stop faster than accelerate)
  private static readonly TURN_SPEED = 8.0 // rad/s
  private static readonly SLIDE_DECELERATION = 25.0 // m/s²
  private static readonly STAMINA_DRAIN_RATE = 0.15 // stamina per second when sprinting
  private static readonly STAMINA_RECOVERY_RATE = 0.1 // stamina per second when resting

  /**
   * Update player physics for one frame
   */
  static updatePhysics(player: Player, deltaTime: number, fieldWidth: number, fieldHeight: number): void {
    if (!player || player.isSentOff) return

    // Handle sliding
    if (player.isSliding) {
      this.updateSliding(player, deltaTime)
      return
    }

    // Calculate desired velocity based on target
    if (player.targetX !== undefined && player.targetY !== undefined) {
      const dx = player.targetX - player.x
      const dy = player.targetY - player.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 0.1) {
        // Calculate desired facing direction
        const targetFacing = Math.atan2(dy, dx)
        
        // Smooth rotation towards target
        let facingDiff = targetFacing - player.facing
        // Normalize angle difference to [-PI, PI]
        while (facingDiff > Math.PI) facingDiff -= 2 * Math.PI
        while (facingDiff < -Math.PI) facingDiff += 2 * Math.PI
        
        // Apply turn speed limit
        const maxTurn = this.TURN_SPEED * deltaTime
        if (Math.abs(facingDiff) > maxTurn) {
          player.facing += Math.sign(facingDiff) * maxTurn
        } else {
          player.facing = targetFacing
        }

        // Normalize facing to [0, 2*PI]
        while (player.facing < 0) player.facing += 2 * Math.PI
        while (player.facing > 2 * Math.PI) player.facing -= 2 * Math.PI

        // Calculate speed based on player attributes and stamina
        const baseSpeed = this.calculateSpeed(player)
        const targetSpeed = Math.min(baseSpeed, distance / deltaTime)
        
        // Accelerate towards target speed
        const currentSpeed = Math.sqrt(player.vx * player.vx + player.vy * player.vy)
        const acceleration = targetSpeed > currentSpeed ? this.ACCELERATION : this.DECELERATION
        const newSpeed = this.approach(currentSpeed, targetSpeed, acceleration * deltaTime)

        // Apply velocity in facing direction
        if (newSpeed > 0) {
          player.vx = Math.cos(player.facing) * newSpeed
          player.vy = Math.sin(player.facing) * newSpeed
        } else {
          player.vx = 0
          player.vy = 0
        }

        // Drain stamina if sprinting
        if (newSpeed > this.MAX_SPEED * 0.8) {
          player.stamina = Math.max(0, player.stamina - this.STAMINA_DRAIN_RATE * deltaTime)
        }
      } else {
        // Close to target, stop
        player.vx = 0
        player.vy = 0
        player.targetX = undefined
        player.targetY = undefined
      }
    } else {
      // No target, decelerate to stop
      const currentSpeed = Math.sqrt(player.vx * player.vx + player.vy * player.vy)
      if (currentSpeed > 0) {
        const newSpeed = Math.max(0, currentSpeed - this.DECELERATION * deltaTime)
        const scale = newSpeed / currentSpeed
        player.vx *= scale
        player.vy *= scale
      }

      // Recover stamina when not moving
      player.stamina = Math.min(player.maxStamina, player.stamina + this.STAMINA_RECOVERY_RATE * deltaTime)
    }

    // Update position
    player.x += player.vx * deltaTime
    player.y += player.vy * deltaTime

    // Keep player in bounds
    player.x = Math.max(player.radius, Math.min(fieldWidth - player.radius, player.x))
    player.y = Math.max(player.radius, Math.min(fieldHeight - player.radius, player.y))

    // Handle collisions with walls
    if (player.x <= player.radius || player.x >= fieldWidth - player.radius) {
      player.vx = 0
    }
    if (player.y <= player.radius || player.y >= fieldHeight - player.radius) {
      player.vy = 0
    }
  }

  /**
   * Update sliding player
   */
  private static updateSliding(player: Player, deltaTime: number): void {
    // Decelerate during slide
    const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy)
    if (speed > 0) {
      const newSpeed = Math.max(0, speed - this.SLIDE_DECELERATION * deltaTime)
      const scale = newSpeed / speed
      player.vx *= scale
      player.vy *= scale
    }

    // Update position
    player.x += player.vx * deltaTime
    player.y += player.vy * deltaTime

    // Check if slide is finished
    if (player.slideEndTime && Date.now() >= player.slideEndTime) {
      player.isSliding = false
      player.slideEndTime = undefined
      player.vx = 0
      player.vy = 0
    }
  }

  /**
   * Calculate player speed based on attributes and stamina
   */
  private static calculateSpeed(player: Player): number {
    const basePace = player.attributes.pace / 100 // Normalize to 0-1
    const acceleration = player.attributes.acceleration / 100
    const staminaRatio = player.stamina / player.maxStamina

    // Base speed affected by pace and stamina
    let speed = this.MAX_SPEED * (0.7 + 0.3 * basePace)
    
    // Sprint speed if high stamina
    if (staminaRatio > 0.3) {
      speed = this.MAX_SPRINT_SPEED * (0.8 + 0.2 * acceleration) * staminaRatio
    }

    // Reduce speed for goalkeepers when out of goal area
    if (player.role === 'goalkeeper') {
      const goalAreaLimit = 100 // Rough goal area
      if (Math.abs(player.x - (player.team === 'home' ? 0 : 600)) > goalAreaLimit) {
        speed *= 0.8
      }
    }

    return speed
  }

  /**
   * Check collision between two players
   */
  static checkPlayerCollision(p1: Player, p2: Player): boolean {
    const dx = p1.x - p2.x
    const dy = p1.y - p2.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const minDistance = p1.radius + p2.radius

    return distance < minDistance
  }

  /**
   * Resolve collision between two players
   */
  static resolvePlayerCollision(p1: Player, p2: Player): void {
    const dx = p1.x - p2.x
    const dy = p1.y - p2.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const minDistance = p1.radius + p2.radius

    if (distance < minDistance && distance > 0) {
      // Normalize collision vector
      const nx = dx / distance
      const ny = dy / distance

      // Separate players
      const overlap = minDistance - distance
      const separationX = nx * overlap * 0.5
      const separationY = ny * overlap * 0.5

      p1.x += separationX
      p1.y += separationY
      p2.x -= separationX
      p2.y -= separationY

      // Exchange velocities (elastic collision)
      const v1 = p1.vx * nx + p1.vy * ny
      const v2 = p2.vx * nx + p2.vy * ny

      // Apply force based on player strength
      const strength1 = p1.attributes.strength / 100
      const strength2 = p2.attributes.strength / 100
      const totalStrength = strength1 + strength2

      p1.vx += (v2 - v1) * nx * (strength2 / totalStrength)
      p1.vy += (v2 - v1) * ny * (strength2 / totalStrength)
      p2.vx += (v1 - v2) * nx * (strength1 / totalStrength)
      p2.vy += (v1 - v2) * ny * (strength1 / totalStrength)

      // Chance of losing balance based on balance attribute
      if (Math.random() > p1.attributes.balance / 100) {
        p1.vx *= 0.5
        p1.vy *= 0.5
      }
      if (Math.random() > p2.attributes.balance / 100) {
        p2.vx *= 0.5
        p2.vy *= 0.5
      }
    }
  }

  /**
   * Check if player can reach ball
   */
  static canReachBall(player: Player, ball: Ball): boolean {
    const dx = ball.x - player.x
    const dy = ball.y - player.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const reachDistance = player.radius + ball.radius + 2 // Small buffer

    // Check horizontal distance and ball height
    return distance <= reachDistance && ball.z <= player.radius * 3
  }

  /**
   * Calculate tackle success probability
   */
  static calculateTackleSuccess(tackler: Player, target: Player): number {
    const tacklingSkill = tackler.attributes.tackling / 100
    const dribblingSkill = target.attributes.dribbling / 100
    const strengthDiff = (tackler.attributes.strength - target.attributes.strength) / 100
    const balanceDiff = (target.attributes.balance - tackler.attributes.balance) / 100

    // Base probability
    let probability = 0.5

    // Skill difference
    probability += (tacklingSkill - dribblingSkill) * 0.3

    // Physical attributes
    probability += strengthDiff * 0.1
    probability -= balanceDiff * 0.1

    // Sliding tackle bonus
    if (tackler.isSliding) {
      probability += 0.15
    }

    return Math.max(0.1, Math.min(0.9, probability))
  }

  /**
   * Utility function to approach a target value
   */
  private static approach(current: number, target: number, maxDelta: number): number {
    const diff = target - current
    if (Math.abs(diff) <= maxDelta) {
      return target
    }
    return current + Math.sign(diff) * maxDelta
  }
}