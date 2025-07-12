// Steering Behaviors for realistic player movement
import type { Player } from '../engine/FutsalGameEngine'

export interface Vector2D {
  x: number
  y: number
}

export class SteeringBehaviors {
  // Steering force limits
  private static readonly MAX_FORCE = 0.3
  private static readonly ARRIVAL_RADIUS = 50
  private static readonly SLOW_RADIUS = 100
  
  /**
   * Seek behavior - move towards target
   */
  static seek(player: Player, target: Vector2D, maxSpeed: number): Vector2D {
    const desired = {
      x: target.x - player.x,
      y: target.y - player.y
    }
    
    const distance = Math.hypot(desired.x, desired.y)
    if (distance > 0) {
      // Normalize and scale to max speed
      desired.x = (desired.x / distance) * maxSpeed
      desired.y = (desired.y / distance) * maxSpeed
      
      // Steering = desired - velocity
      return {
        x: desired.x - player.vx,
        y: desired.y - player.vy
      }
    }
    
    return { x: 0, y: 0 }
  }
  
  /**
   * Arrive behavior - slow down when approaching target
   */
  static arrive(player: Player, target: Vector2D, maxSpeed: number): Vector2D {
    const desired = {
      x: target.x - player.x,
      y: target.y - player.y
    }
    
    const distance = Math.hypot(desired.x, desired.y)
    
    if (distance > 0) {
      let speed = maxSpeed
      
      // Slow down as we approach
      if (distance < this.ARRIVAL_RADIUS) {
        speed = 0
      } else if (distance < this.SLOW_RADIUS) {
        speed = maxSpeed * ((distance - this.ARRIVAL_RADIUS) / (this.SLOW_RADIUS - this.ARRIVAL_RADIUS))
      }
      
      // Desired velocity
      desired.x = (desired.x / distance) * speed
      desired.y = (desired.y / distance) * speed
      
      // Steering = desired - velocity
      return {
        x: desired.x - player.vx,
        y: desired.y - player.vy
      }
    }
    
    return { x: 0, y: 0 }
  }
  
  /**
   * Flee behavior - move away from target
   */
  static flee(player: Player, threat: Vector2D, maxSpeed: number, panicDistance: number = 100): Vector2D {
    const desired = {
      x: player.x - threat.x,
      y: player.y - threat.y
    }
    
    const distance = Math.hypot(desired.x, desired.y)
    
    // Only flee if within panic distance
    if (distance > 0 && distance < panicDistance) {
      // Normalize and scale to max speed
      desired.x = (desired.x / distance) * maxSpeed
      desired.y = (desired.y / distance) * maxSpeed
      
      // Steering = desired - velocity
      return {
        x: desired.x - player.vx,
        y: desired.y - player.vy
      }
    }
    
    return { x: 0, y: 0 }
  }
  
  /**
   * Pursuit behavior - intercept moving target
   */
  static pursuit(player: Player, target: Player, maxSpeed: number): Vector2D {
    const toTarget = {
      x: target.x - player.x,
      y: target.y - player.y
    }
    
    const distance = Math.hypot(toTarget.x, toTarget.y)
    
    // Predict where target will be
    const lookAheadTime = distance / maxSpeed
    const predictedPos = {
      x: target.x + target.vx * lookAheadTime * 60, // Account for frame-based velocity
      y: target.y + target.vy * lookAheadTime * 60
    }
    
    return this.seek(player, predictedPos, maxSpeed)
  }
  
  /**
   * Evade behavior - avoid moving threat
   */
  static evade(player: Player, threat: Player, maxSpeed: number, threatDistance: number = 100): Vector2D {
    const toThreat = {
      x: threat.x - player.x,
      y: threat.y - player.y
    }
    
    const distance = Math.hypot(toThreat.x, toThreat.y)
    
    if (distance < threatDistance) {
      // Predict where threat will be
      const lookAheadTime = distance / maxSpeed
      const predictedPos = {
        x: threat.x + threat.vx * lookAheadTime * 60,
        y: threat.y + threat.vy * lookAheadTime * 60
      }
      
      return this.flee(player, predictedPos, maxSpeed, threatDistance)
    }
    
    return { x: 0, y: 0 }
  }
  
  /**
   * Wander behavior - random movement
   */
  static wander(player: Player, maxSpeed: number, wanderRadius: number = 40): Vector2D {
    // Project a circle in front of the player
    const circleDistance = 50
    const circleCenter = {
      x: player.x + Math.cos(player.facing) * circleDistance,
      y: player.y + Math.sin(player.facing) * circleDistance
    }
    
    // Random point on circle
    const randomAngle = Math.random() * Math.PI * 2
    const wanderPoint = {
      x: circleCenter.x + Math.cos(randomAngle) * wanderRadius,
      y: circleCenter.y + Math.sin(randomAngle) * wanderRadius
    }
    
    return this.seek(player, wanderPoint, maxSpeed * 0.5)
  }
  
  /**
   * Separation behavior - avoid crowding teammates
   */
  static separation(player: Player, neighbors: Player[], desiredSeparation: number = 30): Vector2D {
    const steer = { x: 0, y: 0 }
    let count = 0
    
    for (const other of neighbors) {
      if (other === player || other.isSentOff) continue
      
      const d = Math.hypot(other.x - player.x, other.y - player.y)
      
      if (d > 0 && d < desiredSeparation) {
        // Calculate vector away from neighbor
        const diff = {
          x: (player.x - other.x) / d, // Normalized
          y: (player.y - other.y) / d
        }
        
        // Weight by distance (closer = stronger repulsion)
        diff.x /= d
        diff.y /= d
        
        steer.x += diff.x
        steer.y += diff.y
        count++
      }
    }
    
    // Average the forces
    if (count > 0) {
      steer.x /= count
      steer.y /= count
      
      // Normalize and scale
      const mag = Math.hypot(steer.x, steer.y)
      if (mag > 0) {
        steer.x = (steer.x / mag) * this.MAX_FORCE
        steer.y = (steer.y / mag) * this.MAX_FORCE
      }
    }
    
    return steer
  }
  
  /**
   * Cohesion behavior - stay with group
   */
  static cohesion(player: Player, neighbors: Player[], maxSpeed: number): Vector2D {
    const center = { x: 0, y: 0 }
    let count = 0
    
    for (const other of neighbors) {
      if (other === player || other.isSentOff) continue
      
      const d = Math.hypot(other.x - player.x, other.y - player.y)
      
      if (d > 0 && d < 100) { // Cohesion radius
        center.x += other.x
        center.y += other.y
        count++
      }
    }
    
    if (count > 0) {
      center.x /= count
      center.y /= count
      
      return this.seek(player, center, maxSpeed)
    }
    
    return { x: 0, y: 0 }
  }
  
  /**
   * Path following behavior
   */
  static followPath(player: Player, path: Vector2D[], maxSpeed: number, pathRadius: number = 20): Vector2D {
    if (path.length === 0) return { x: 0, y: 0 }
    
    // Find nearest point on path
    let nearestDist = Infinity
    let nearestIndex = 0
    
    for (let i = 0; i < path.length; i++) {
      const d = Math.hypot(path[i].x - player.x, path[i].y - player.y)
      if (d < nearestDist) {
        nearestDist = d
        nearestIndex = i
      }
    }
    
    // If close to current waypoint, target next one
    if (nearestDist < pathRadius && nearestIndex < path.length - 1) {
      nearestIndex++
    }
    
    return this.arrive(player, path[nearestIndex], maxSpeed)
  }
  
  /**
   * Combine multiple steering forces with weights
   */
  static combine(forces: Array<{ force: Vector2D; weight: number }>): Vector2D {
    const combined = { x: 0, y: 0 }
    
    for (const { force, weight } of forces) {
      combined.x += force.x * weight
      combined.y += force.y * weight
    }
    
    // Limit to max force
    const mag = Math.hypot(combined.x, combined.y)
    if (mag > this.MAX_FORCE) {
      combined.x = (combined.x / mag) * this.MAX_FORCE
      combined.y = (combined.y / mag) * this.MAX_FORCE
    }
    
    return combined
  }
  
  /**
   * Apply steering force to player velocity
   */
  static applyForce(player: Player, force: Vector2D, deltaTime: number): void {
    // F = ma, assuming mass = 1
    player.vx += force.x * deltaTime * 60
    player.vy += force.y * deltaTime * 60
  }
}