// Collision detection system for futsal game
import type { Player, Ball, Goal } from '../engine/FutsalGameEngine'

export interface CollisionResult {
  type: 'player-player' | 'player-ball' | 'ball-goal' | 'ball-wall'
  entities: any[]
  normal?: { x: number; y: number }
  penetration?: number
}

export class CollisionDetection {
  /**
   * Broad phase collision detection using spatial hashing
   */
  static broadPhase(players: Player[], cellSize: number = 50): Map<string, Player[]> {
    const grid = new Map<string, Player[]>()
    
    for (const player of players) {
      const cellX = Math.floor(player.x / cellSize)
      const cellY = Math.floor(player.y / cellSize)
      const key = `${cellX},${cellY}`
      
      if (!grid.has(key)) {
        grid.set(key, [])
      }
      grid.get(key)!.push(player)
      
      // Also add to neighboring cells if near borders
      const offsetX = player.x % cellSize
      const offsetY = player.y % cellSize
      const r = player.radius
      
      if (offsetX < r) {
        const neighborKey = `${cellX - 1},${cellY}`
        if (!grid.has(neighborKey)) grid.set(neighborKey, [])
        grid.get(neighborKey)!.push(player)
      }
      if (offsetX > cellSize - r) {
        const neighborKey = `${cellX + 1},${cellY}`
        if (!grid.has(neighborKey)) grid.set(neighborKey, [])
        grid.get(neighborKey)!.push(player)
      }
      if (offsetY < r) {
        const neighborKey = `${cellX},${cellY - 1}`
        if (!grid.has(neighborKey)) grid.set(neighborKey, [])
        grid.get(neighborKey)!.push(player)
      }
      if (offsetY > cellSize - r) {
        const neighborKey = `${cellX},${cellY + 1}`
        if (!grid.has(neighborKey)) grid.set(neighborKey, [])
        grid.get(neighborKey)!.push(player)
      }
    }
    
    return grid
  }

  /**
   * Check circle-circle collision
   */
  static circleCircle(
    x1: number, y1: number, r1: number,
    x2: number, y2: number, r2: number
  ): { colliding: boolean; normal?: { x: number; y: number }; penetration?: number } {
    const dx = x2 - x1
    const dy = y2 - y1
    const distSq = dx * dx + dy * dy
    const minDist = r1 + r2
    const minDistSq = minDist * minDist
    
    if (distSq < minDistSq) {
      const dist = Math.sqrt(distSq)
      return {
        colliding: true,
        normal: dist > 0 ? { x: dx / dist, y: dy / dist } : { x: 1, y: 0 },
        penetration: minDist - dist
      }
    }
    
    return { colliding: false }
  }

  /**
   * Check if point is inside circle
   */
  static pointInCircle(px: number, py: number, cx: number, cy: number, r: number): boolean {
    const dx = px - cx
    const dy = py - cy
    return dx * dx + dy * dy <= r * r
  }

  /**
   * Check ball-goal collision
   */
  static ballGoalCollision(ball: Ball, goal: Goal): boolean {
    // Simple AABB check for goal
    return ball.x >= goal.x && 
           ball.x <= goal.x + goal.width &&
           ball.y >= goal.y && 
           ball.y <= goal.y + goal.height &&
           ball.z <= goal.height // Ball must be below crossbar
  }

  /**
   * Check ball-wall collision for futsal court
   */
  static ballWallCollision(
    ball: Ball, 
    fieldWidth: number, 
    fieldHeight: number
  ): { side?: 'left' | 'right' | 'top' | 'bottom'; normal?: { x: number; y: number } } {
    const result: any = {}
    
    if (ball.x - ball.radius <= 0) {
      result.side = 'left'
      result.normal = { x: 1, y: 0 }
    } else if (ball.x + ball.radius >= fieldWidth) {
      result.side = 'right'
      result.normal = { x: -1, y: 0 }
    }
    
    if (ball.y - ball.radius <= 0) {
      result.side = 'top'
      result.normal = { x: 0, y: 1 }
    } else if (ball.y + ball.radius >= fieldHeight) {
      result.side = 'bottom'
      result.normal = { x: 0, y: -1 }
    }
    
    return result
  }

  /**
   * Ray-circle intersection for predictive collision
   */
  static rayCircleIntersection(
    rayStart: { x: number; y: number },
    rayDir: { x: number; y: number },
    circleCenter: { x: number; y: number },
    radius: number
  ): { hit: boolean; t?: number; point?: { x: number; y: number } } {
    const dx = rayStart.x - circleCenter.x
    const dy = rayStart.y - circleCenter.y
    
    const a = rayDir.x * rayDir.x + rayDir.y * rayDir.y
    const b = 2 * (dx * rayDir.x + dy * rayDir.y)
    const c = dx * dx + dy * dy - radius * radius
    
    const discriminant = b * b - 4 * a * c
    
    if (discriminant < 0) {
      return { hit: false }
    }
    
    const t1 = (-b - Math.sqrt(discriminant)) / (2 * a)
    const t2 = (-b + Math.sqrt(discriminant)) / (2 * a)
    
    const t = t1 >= 0 ? t1 : t2
    
    if (t >= 0) {
      return {
        hit: true,
        t,
        point: {
          x: rayStart.x + t * rayDir.x,
          y: rayStart.y + t * rayDir.y
        }
      }
    }
    
    return { hit: false }
  }

  /**
   * Check line-of-sight between two points
   */
  static hasLineOfSight(
    from: { x: number; y: number },
    to: { x: number; y: number },
    obstacles: Array<{ x: number; y: number; radius: number }>
  ): boolean {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    
    if (dist === 0) return true
    
    const rayDir = { x: dx / dist, y: dy / dist }
    
    for (const obstacle of obstacles) {
      const intersection = this.rayCircleIntersection(from, rayDir, obstacle, obstacle.radius)
      if (intersection.hit && intersection.t! >= 0 && intersection.t! <= dist) {
        return false
      }
    }
    
    return true
  }

  /**
   * Get all collisions in the current frame
   */
  static detectAllCollisions(
    players: Player[],
    ball: Ball,
    fieldWidth: number,
    fieldHeight: number,
    goals: Goal[]
  ): CollisionResult[] {
    const collisions: CollisionResult[] = []
    
    // Use broad phase for player-player collisions
    const grid = this.broadPhase(players)
    const checkedPairs = new Set<string>()
    
    for (const [_, cellPlayers] of grid) {
      for (let i = 0; i < cellPlayers.length; i++) {
        for (let j = i + 1; j < cellPlayers.length; j++) {
          const p1 = cellPlayers[i]
          const p2 = cellPlayers[j]
          const pairKey = `${Math.min(p1.number, p2.number)}-${Math.max(p1.number, p2.number)}`
          
          if (!checkedPairs.has(pairKey)) {
            checkedPairs.add(pairKey)
            const collision = this.circleCircle(
              p1.x, p1.y, p1.radius,
              p2.x, p2.y, p2.radius
            )
            
            if (collision.colliding) {
              collisions.push({
                type: 'player-player',
                entities: [p1, p2],
                normal: collision.normal,
                penetration: collision.penetration
              })
            }
          }
        }
      }
    }
    
    // Player-ball collisions
    for (const player of players) {
      if (!player.isSentOff) {
        const collision = this.circleCircle(
          player.x, player.y, player.radius,
          ball.x, ball.y, ball.radius
        )
        
        if (collision.colliding && ball.z <= player.radius * 2) {
          collisions.push({
            type: 'player-ball',
            entities: [player, ball],
            normal: collision.normal,
            penetration: collision.penetration
          })
        }
      }
    }
    
    // Ball-wall collisions
    const wallCollision = this.ballWallCollision(ball, fieldWidth, fieldHeight)
    if (wallCollision.side) {
      collisions.push({
        type: 'ball-wall',
        entities: [ball, wallCollision.side],
        normal: wallCollision.normal
      })
    }
    
    // Ball-goal collisions
    for (const goal of goals) {
      if (this.ballGoalCollision(ball, goal)) {
        collisions.push({
          type: 'ball-goal',
          entities: [ball, goal]
        })
      }
    }
    
    return collisions
  }
}