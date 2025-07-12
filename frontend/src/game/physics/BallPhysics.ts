// Adapted from fusion project for futsal game physics
import type { Ball, Player } from '../engine/FutsalGameEngine'

export class BallPhysics {
  // Realistic physics constants for futsal
  private static readonly GRAVITY = -9.81 // m/s²
  private static readonly AIR_DENSITY = 1.225 // kg/m³
  private static readonly BALL_MASS = 0.43 // kg (FIFA regulation)
  private static readonly DRAG_COEFFICIENT = 0.47 // sphere drag coefficient
  private static readonly ROLLING_FRICTION = 0.015 // indoor court has less friction than grass
  private static readonly BOUNCE_DAMPING = 0.65 // futsal balls bounce less than outdoor balls
  private static readonly SPIN_DECAY = 0.985 // spin decay factor
  private static readonly MAX_SPIN = 20 // max spin rate (rad/s)

  // Futsal-specific constants
  private static readonly MIN_VELOCITY = 0.01 // minimum velocity before stopping
  private static readonly MIN_BOUNCE_VELOCITY = 0.3 // minimum velocity to bounce
  private static readonly COURT_FRICTION = 0.8 // friction coefficient for indoor court
  
  /**
   * Update ball physics for one frame
   */
  static updatePhysics(ball: Ball, deltaTime: number, fieldWidth: number, fieldHeight: number): void {
    if (!ball || ball.isStationary) return

    // Skip physics for possessed ball
    if (ball.possessor) {
      this.updatePossessedBall(ball, ball.possessor)
      return
    }

    // Calculate current speed
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy + ball.vz * ball.vz)
    
    // Apply gravity to vertical velocity
    ball.vz += this.GRAVITY * deltaTime
    
    // Apply air resistance
    if (speed > this.MIN_VELOCITY) {
      const ballArea = Math.PI * ball.radius * ball.radius
      const dragForce = 0.5 * this.AIR_DENSITY * speed * speed * this.DRAG_COEFFICIENT * ballArea
      const dragAcceleration = dragForce / this.BALL_MASS
      
      if (speed > 0) {
        const dragFactor = Math.min(dragAcceleration * deltaTime / speed, 1)
        ball.vx *= (1 - dragFactor)
        ball.vy *= (1 - dragFactor)
        ball.vz *= (1 - dragFactor * 0.7) // Less drag on vertical for realistic arc
      }
    }
    
    // Update position
    ball.x += ball.vx * deltaTime
    ball.y += ball.vy * deltaTime
    ball.z += ball.vz * deltaTime
    
    // Ground collision
    if (ball.z <= ball.radius) {
      ball.z = ball.radius
      
      // Handle bounce
      if (ball.vz < -this.MIN_BOUNCE_VELOCITY) {
        ball.vz = -ball.vz * this.BOUNCE_DAMPING
        ball.bounceCount++
        ball.lastBounceTime = Date.now()
        
        // Apply spin effect on bounce
        if (ball.spin) {
          ball.vx += ball.spin.y * 0.1 // backspin affects forward velocity
          ball.vy += ball.spin.x * 0.1 // sidespin affects lateral velocity
        }
      } else {
        ball.vz = 0
      }
      
      // Apply rolling friction when on ground
      const horizontalSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy)
      if (horizontalSpeed > this.MIN_VELOCITY) {
        const frictionForce = this.ROLLING_FRICTION * this.BALL_MASS * Math.abs(this.GRAVITY)
        const frictionAcceleration = frictionForce / this.BALL_MASS
        const frictionFactor = Math.min(frictionAcceleration * deltaTime / horizontalSpeed, 1)
        
        ball.vx *= (1 - frictionFactor)
        ball.vy *= (1 - frictionFactor)
      } else {
        // Stop very slow movement
        ball.vx = 0
        ball.vy = 0
      }
      
      // Update air time
      ball.airTime = 0
    } else {
      // Ball is in the air
      ball.airTime += deltaTime
    }
    
    // Apply spin physics
    if (ball.spin) {
      // Magnus effect (curve ball)
      if (speed > 0.5) {
        const magnus = 0.5 * this.AIR_DENSITY * speed * ball.radius
        ball.vx += magnus * ball.spin.z * deltaTime * 0.01
        ball.vy -= magnus * ball.spin.x * deltaTime * 0.01
      }
      
      // Decay spin
      ball.spin.x *= this.SPIN_DECAY
      ball.spin.y *= this.SPIN_DECAY
      ball.spin.z *= this.SPIN_DECAY
    }
    
    // Wall collisions (futsal court boundaries)
    this.handleWallCollisions(ball, fieldWidth, fieldHeight)
    
    // Check if ball is essentially stationary
    const totalSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy + ball.vz * ball.vz)
    ball.isStationary = totalSpeed < this.MIN_VELOCITY && ball.z <= ball.radius + 0.01
    
    // Update stuck detection
    if (totalSpeed < 0.1) {
      ball.stuckCheckTimer += deltaTime
      if (ball.stuckCheckTimer > 3) { // Ball stuck for 3 seconds
        ball.isStationary = true
      }
    } else {
      ball.stuckCheckTimer = 0
      ball.lastMovementTime = Date.now()
    }
  }

  /**
   * Update ball position when possessed by a player
   */
  private static updatePossessedBall(ball: Ball, player: Player): void {
    // Position ball in front of player based on their facing direction
    const controlDistance = player.radius + ball.radius + 0.5
    ball.x = player.x + Math.cos(player.facing) * controlDistance
    ball.y = player.y + Math.sin(player.facing) * controlDistance
    ball.z = ball.radius * 1.5 // Slightly off ground when controlled
    
    // Match player velocity with some damping
    ball.vx = player.vx * 0.8
    ball.vy = player.vy * 0.8
    ball.vz = 0
    
    // Reset physics state
    ball.bounceCount = 0
    ball.airTime = 0
    ball.isStationary = false
    ball.stuckCheckTimer = 0
  }

  /**
   * Handle collisions with court walls
   */
  private static handleWallCollisions(ball: Ball, fieldWidth: number, fieldHeight: number): void {
    const dampingFactor = 0.7 // Energy lost on wall collision
    
    // Left/Right walls
    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius
      ball.vx = Math.abs(ball.vx) * dampingFactor
    } else if (ball.x + ball.radius > fieldWidth) {
      ball.x = fieldWidth - ball.radius
      ball.vx = -Math.abs(ball.vx) * dampingFactor
    }
    
    // Top/Bottom walls (excluding goal areas)
    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius
      ball.vy = Math.abs(ball.vy) * dampingFactor
    } else if (ball.y + ball.radius > fieldHeight) {
      ball.y = fieldHeight - ball.radius
      ball.vy = -Math.abs(ball.vy) * dampingFactor
    }
  }

  /**
   * Apply force to ball (for kicks, passes, etc.)
   */
  static applyForce(ball: Ball, force: { x: number; y: number; z: number }, spin?: { x: number; y: number; z: number }): void {
    // Convert force to velocity change (F = ma, so a = F/m, v = at where t=1)
    ball.vx += force.x / this.BALL_MASS
    ball.vy += force.y / this.BALL_MASS
    ball.vz += force.z / this.BALL_MASS
    
    // Apply spin if provided
    if (spin) {
      ball.spin = {
        x: Math.max(-this.MAX_SPIN, Math.min(this.MAX_SPIN, spin.x)),
        y: Math.max(-this.MAX_SPIN, Math.min(this.MAX_SPIN, spin.y)),
        z: Math.max(-this.MAX_SPIN, Math.min(this.MAX_SPIN, spin.z))
      }
    }
    
    // Reset stationary state
    ball.isStationary = false
    ball.stuckCheckTimer = 0
    ball.lastMovementTime = Date.now()
  }

  /**
   * Calculate trajectory for a shot/pass
   */
  static calculateTrajectory(
    from: { x: number; y: number },
    to: { x: number; y: number },
    power: number,
    height: number = 0.3
  ): { velocity: { x: number; y: number; z: number }; spin?: { x: number; y: number; z: number } } {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // Normalize direction
    const dirX = dx / distance
    const dirY = dy / distance
    
    // Calculate initial velocity based on power and distance
    const baseSpeed = Math.min(power * 20, 30) // Max speed 30 m/s
    const vx = dirX * baseSpeed
    const vy = dirY * baseSpeed
    
    // Calculate vertical velocity for desired arc
    const flightTime = distance / baseSpeed
    const vz = (height + 0.5 * Math.abs(this.GRAVITY) * flightTime * flightTime) / flightTime
    
    return {
      velocity: { x: vx, y: vy, z: vz },
      spin: height > 0.5 ? { x: 0, y: -5, z: 0 } : undefined // Add backspin for lofted passes
    }
  }

  /**
   * Check if ball is in a goal
   */
  static isInGoal(ball: Ball, fieldWidth: number, fieldHeight: number, goalWidth: number): 'home' | 'away' | null {
    const goalTop = fieldHeight / 2 - goalWidth / 2
    const goalBottom = fieldHeight / 2 + goalWidth / 2
    
    // Check if ball is within goal mouth height
    if (ball.y >= goalTop && ball.y <= goalBottom && ball.z < 2) { // Goal height ~2m
      // Check if past goal line
      if (ball.x < 0) return 'home' // Scored in home goal
      if (ball.x > fieldWidth) return 'away' // Scored in away goal
    }
    
    return null
  }
}