import type { Player } from '../engine/FutsalGameEngine'
import type { AIContext } from './UtilityAI'

export enum NodeStatus {
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE'
}

export interface BehaviorNode {
  tick(context: AIContext): NodeStatus
}

// Composite Nodes
export class SequenceNode implements BehaviorNode {
  private children: BehaviorNode[]
  private currentIndex: number = 0

  constructor(children: BehaviorNode[]) {
    this.children = children
  }

  tick(context: AIContext): NodeStatus {
    while (this.currentIndex < this.children.length) {
      const status = this.children[this.currentIndex].tick(context)
      
      if (status === NodeStatus.RUNNING) {
        return NodeStatus.RUNNING
      }
      
      if (status === NodeStatus.FAILURE) {
        this.currentIndex = 0
        return NodeStatus.FAILURE
      }
      
      this.currentIndex++
    }
    
    this.currentIndex = 0
    return NodeStatus.SUCCESS
  }
}

export class SelectorNode implements BehaviorNode {
  private children: BehaviorNode[]
  private currentIndex: number = 0

  constructor(children: BehaviorNode[]) {
    this.children = children
  }

  tick(context: AIContext): NodeStatus {
    while (this.currentIndex < this.children.length) {
      const status = this.children[this.currentIndex].tick(context)
      
      if (status === NodeStatus.RUNNING) {
        return NodeStatus.RUNNING
      }
      
      if (status === NodeStatus.SUCCESS) {
        this.currentIndex = 0
        return NodeStatus.SUCCESS
      }
      
      this.currentIndex++
    }
    
    this.currentIndex = 0
    return NodeStatus.FAILURE
  }
}

export class ParallelNode implements BehaviorNode {
  private children: BehaviorNode[]
  private successThreshold: number

  constructor(children: BehaviorNode[], successThreshold: number = 1) {
    this.children = children
    this.successThreshold = successThreshold
  }

  tick(context: AIContext): NodeStatus {
    let successCount = 0
    let failureCount = 0
    let runningCount = 0
    
    for (const child of this.children) {
      const status = child.tick(context)
      
      if (status === NodeStatus.SUCCESS) successCount++
      else if (status === NodeStatus.FAILURE) failureCount++
      else runningCount++
    }
    
    if (successCount >= this.successThreshold) {
      return NodeStatus.SUCCESS
    }
    
    if (failureCount > this.children.length - this.successThreshold) {
      return NodeStatus.FAILURE
    }
    
    return NodeStatus.RUNNING
  }
}

// Decorator Nodes
export class InverterNode implements BehaviorNode {
  private child: BehaviorNode

  constructor(child: BehaviorNode) {
    this.child = child
  }

  tick(context: AIContext): NodeStatus {
    const status = this.child.tick(context)
    
    if (status === NodeStatus.SUCCESS) return NodeStatus.FAILURE
    if (status === NodeStatus.FAILURE) return NodeStatus.SUCCESS
    return NodeStatus.RUNNING
  }
}

export class RepeatNode implements BehaviorNode {
  private child: BehaviorNode
  private times: number
  private count: number = 0

  constructor(child: BehaviorNode, times: number = Infinity) {
    this.child = child
    this.times = times
  }

  tick(context: AIContext): NodeStatus {
    if (this.count >= this.times) {
      this.count = 0
      return NodeStatus.SUCCESS
    }
    
    const status = this.child.tick(context)
    
    if (status === NodeStatus.SUCCESS || status === NodeStatus.FAILURE) {
      this.count++
      
      if (this.count >= this.times) {
        this.count = 0
        return NodeStatus.SUCCESS
      }
      
      return NodeStatus.RUNNING
    }
    
    return NodeStatus.RUNNING
  }
}

// Condition Nodes
export class ConditionNode implements BehaviorNode {
  private condition: (context: AIContext) => boolean

  constructor(condition: (context: AIContext) => boolean) {
    this.condition = condition
  }

  tick(context: AIContext): NodeStatus {
    return this.condition(context) ? NodeStatus.SUCCESS : NodeStatus.FAILURE
  }
}

// Action Nodes
export class ActionNode implements BehaviorNode {
  private action: (context: AIContext) => NodeStatus

  constructor(action: (context: AIContext) => NodeStatus) {
    this.action = action
  }

  tick(context: AIContext): NodeStatus {
    return this.action(context)
  }
}

// Football-specific Condition Nodes
export class HasBallCondition extends ConditionNode {
  constructor() {
    super((context) => context.ball.possessor === context.player)
  }
}

export class TeamHasBallCondition extends ConditionNode {
  constructor() {
    super((context) => context.gameState.possession === context.player.team)
  }
}

export class InShootingRangeCondition extends ConditionNode {
  constructor(maxDistance: number = 200) {
    super((context) => {
      const goalX = context.player.team === 'home' ? context.fieldWidth - 50 : 50
      const goalY = context.fieldHeight / 2
      const dist = Math.hypot(goalX - context.player.x, goalY - context.player.y)
      return dist <= maxDistance
    })
  }
}

export class StaminaAboveCondition extends ConditionNode {
  constructor(threshold: number) {
    super((context) => context.player.stamina / context.player.maxStamina > threshold)
  }
}

export class TimeRemainingCondition extends ConditionNode {
  constructor(seconds: number, operator: '<' | '>') {
    super((context) => {
      if (operator === '<') {
        return context.gameState.timeRemaining < seconds
      } else {
        return context.gameState.timeRemaining > seconds
      }
    })
  }
}

export class ScoreDifferenceCondition extends ConditionNode {
  constructor(difference: number, operator: '<' | '>' | '=') {
    super((context) => {
      const teamScore = context.gameState.score[context.player.team]
      const opponentScore = context.gameState.score[context.player.team === 'home' ? 'away' : 'home']
      const diff = teamScore - opponentScore
      
      if (operator === '<') return diff < difference
      if (operator === '>') return diff > difference
      return diff === difference
    })
  }
}

// Football-specific Action Nodes
export class ShootAction extends ActionNode {
  constructor() {
    super((context) => {
      // This would trigger the shoot action in the game engine
      return NodeStatus.SUCCESS
    })
  }
}

export class PassAction extends ActionNode {
  constructor() {
    super((context) => {
      // This would trigger the pass action in the game engine
      return NodeStatus.SUCCESS
    })
  }
}

export class DribbleAction extends ActionNode {
  constructor() {
    super((context) => {
      // This would trigger the dribble action in the game engine
      return NodeStatus.SUCCESS
    })
  }
}

export class MoveToPositionAction extends ActionNode {
  constructor() {
    super((context) => {
      // This would set the target position for the player
      return NodeStatus.RUNNING // Movement takes time
    })
  }
}

export class PressOpponentAction extends ActionNode {
  constructor() {
    super((context) => {
      // This would trigger pressing behavior
      return NodeStatus.RUNNING
    })
  }
}

// Behavior Tree Builder
export class BehaviorTreeBuilder {
  static createStrikerTree(): BehaviorNode {
    return new SelectorNode([
      // If we have the ball
      new SequenceNode([
        new HasBallCondition(),
        new SelectorNode([
          // Shoot if in range and have good angle
          new SequenceNode([
            new InShootingRangeCondition(150),
            new ShootAction()
          ]),
          // Pass if teammate in better position
          new SequenceNode([
            new ConditionNode((ctx) => ctx.teammates.length > 0),
            new PassAction()
          ]),
          // Otherwise dribble towards goal
          new DribbleAction()
        ])
      ]),
      
      // If team has ball, make runs
      new SequenceNode([
        new TeamHasBallCondition(),
        new MoveToPositionAction()
      ]),
      
      // If opponent has ball, press or fall back
      new SelectorNode([
        new SequenceNode([
          new StaminaAboveCondition(0.3),
          new ConditionNode((ctx) => {
            const dist = Math.hypot(ctx.ball.x - ctx.player.x, ctx.ball.y - ctx.player.y)
            return dist < 100
          }),
          new PressOpponentAction()
        ]),
        new MoveToPositionAction()
      ])
    ])
  }
  
  static createMidfielderTree(): BehaviorNode {
    return new SelectorNode([
      // If we have the ball
      new SequenceNode([
        new HasBallCondition(),
        new SelectorNode([
          // Shoot if very close to goal
          new SequenceNode([
            new InShootingRangeCondition(100),
            new ShootAction()
          ]),
          // Pass to create opportunities
          new SequenceNode([
            new ConditionNode((ctx) => ctx.teammates.length > 0),
            new PassAction()
          ]),
          // Dribble to maintain possession
          new DribbleAction()
        ])
      ]),
      
      // Support play
      new SequenceNode([
        new TeamHasBallCondition(),
        new ParallelNode([
          new MoveToPositionAction(),
          new ConditionNode((ctx) => {
            const dist = Math.hypot(ctx.ball.x - ctx.player.x, ctx.ball.y - ctx.player.y)
            return dist < 200
          })
        ])
      ]),
      
      // Defensive duties
      new SequenceNode([
        new InverterNode(new TeamHasBallCondition()),
        new SelectorNode([
          new SequenceNode([
            new ConditionNode((ctx) => ctx.gameState.strategy >= 7), // High press
            new PressOpponentAction()
          ]),
          new MoveToPositionAction()
        ])
      ])
    ])
  }
  
  static createDefenderTree(): BehaviorNode {
    return new SelectorNode([
      // If we have the ball, clear or pass
      new SequenceNode([
        new HasBallCondition(),
        new SelectorNode([
          // Clear if under pressure
          new SequenceNode([
            new ConditionNode((ctx) => {
              const nearbyOpponents = ctx.opponents.filter(opp => {
                const dist = Math.hypot(opp.x - ctx.player.x, opp.y - ctx.player.y)
                return dist < 50
              })
              return nearbyOpponents.length > 1
            }),
            new ActionNode(() => NodeStatus.SUCCESS) // Clear action
          ]),
          // Pass to teammate
          new PassAction()
        ])
      ]),
      
      // Defensive positioning
      new SequenceNode([
        new InverterNode(new TeamHasBallCondition()),
        new SelectorNode([
          // Mark nearest opponent
          new SequenceNode([
            new ConditionNode((ctx) => {
              const distances = ctx.opponents.map(opp => ({
                opponent: opp,
                distance: Math.hypot(opp.x - ctx.player.x, opp.y - ctx.player.y)
              }))
              const nearest = distances.sort((a, b) => a.distance - b.distance)[0]
              return nearest && nearest.distance < 100
            }),
            new ActionNode(() => NodeStatus.RUNNING) // Mark action
          ]),
          // Hold defensive line
          new MoveToPositionAction()
        ])
      ]),
      
      // Support attack conservatively
      new SequenceNode([
        new TeamHasBallCondition(),
        new StaminaAboveCondition(0.6),
        new MoveToPositionAction()
      ])
    ])
  }
  
  static createGoalkeeperTree(): BehaviorNode {
    return new SelectorNode([
      // If we have the ball, distribute
      new SequenceNode([
        new HasBallCondition(),
        new SelectorNode([
          // Quick throw to nearby teammate
          new SequenceNode([
            new ConditionNode((ctx) => {
              const nearbyTeammates = ctx.teammates.filter(tm => {
                const dist = Math.hypot(tm.x - ctx.player.x, tm.y - ctx.player.y)
                return dist < 150
              })
              return nearbyTeammates.length > 0
            }),
            new PassAction()
          ]),
          // Long throw/kick
          new ActionNode(() => NodeStatus.SUCCESS)
        ])
      ]),
      
      // Positioning based on ball location
      new MoveToPositionAction()
    ])
  }
}

// Export a function to get the appropriate tree for a player
export function getPlayerBehaviorTree(player: Player): BehaviorNode {
  switch (player.role) {
    case 'striker':
      return BehaviorTreeBuilder.createStrikerTree()
    case 'midfielder':
      return BehaviorTreeBuilder.createMidfielderTree()
    case 'defender':
      return BehaviorTreeBuilder.createDefenderTree()
    case 'goalkeeper':
      return BehaviorTreeBuilder.createGoalkeeperTree()
    default:
      return BehaviorTreeBuilder.createMidfielderTree()
  }
}