export interface PlayerStats {
  pace: number
  shooting: number
  passing: number
  defense: number
  physical: number
  overall?: number
}

export interface TierInfo {
  name: string
  color: string
  range: { min: number; max: number }
}

export interface Player {
  id: string
  name: string
  role: string
  tier: string
  stats: PlayerStats
  overall: number
  price?: number
}

export interface TeamData {
  name: string
  colors: {
    primary: string
    secondary: string
  }
  formation?: string
  squad?: Player[]
}

export type TierType = 'amateur' | 'semi-pro' | 'pro' | 'elite'
export type RoleType = 'GK' | 'DEF' | 'MID' | 'ST'

// Name generation data
const robotNamePrefixes = [
  'Cyber', 'Nano', 'Quantum', 'Mega', 'Ultra', 'Neo', 'Hyper', 'Alpha', 'Beta', 
  'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Omega', 'Sigma', 'Theta', 'Lambda',
  'Xenon', 'Plasma', 'Fusion', 'Volt', 'Nexus', 'Apex', 'Vertex', 'Matrix',
  'Binary', 'Hexa', 'Octa', 'Terra', 'Aero', 'Hydro', 'Pyro', 'Cryo'
]

const robotNameSuffixes = [
  'Bot', 'Tron', 'X', 'Prime', 'Max', 'Pro', 'Elite', 'Plus', 'Ultra', 
  'Ace', 'One', 'Zero', 'Nova', 'Star', 'Core', 'Byte', 'Unit', 'System',
  'Engine', 'Force', 'Pulse', 'Wave', 'Flux', 'Grid', 'Node', 'Link'
]

const robotNameMiddles = [
  'Striker', 'Blitz', 'Thunder', 'Lightning', 'Storm', 'Turbo', 'Rocket',
  'Jet', 'Speed', 'Power', 'Force', 'Titan', 'Phoenix', 'Dragon', 'Eagle',
  'Hawk', 'Falcon', 'Viper', 'Cobra', 'Wolf', 'Tiger', 'Lion', 'Panther'
]

const robotRoles = ['GK', 'DEF', 'DEF', 'MID', 'MID', 'ST', 'DEF', 'MID', 'ST', 'MID', 'ST']

const primaryColors = [
  '#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF00FF', '#00FFFF',
  '#FFA500', '#800080', '#000000', '#FFFFFF', '#C0C0C0', '#FFD700'
]

const secondaryColors = [
  '#FFFFFF', '#000000', '#FFD700', '#C0C0C0', '#FF6B6B', '#4ECDC4',
  '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F8B195'
]

// Formation configurations
const formationConfigs = {
  '4-4-2': { defenders: 4, midfielders: 4, strikers: 2 },
  '4-3-3': { defenders: 4, midfielders: 3, strikers: 3 },
  '3-5-2': { defenders: 3, midfielders: 5, strikers: 2 },
  '5-3-2': { defenders: 5, midfielders: 3, strikers: 2 },
  '4-2-3-1': { defenders: 4, midfielders: 5, strikers: 1 }
}

export const teamGenerator = {
  /**
   * Generate a random robot name
   * @param useMiddleName Whether to include a middle name component
   */
  generateRobotName(useMiddleName = true): string {
    const prefix = robotNamePrefixes[Math.floor(Math.random() * robotNamePrefixes.length)]
    const suffix = robotNameSuffixes[Math.floor(Math.random() * robotNameSuffixes.length)]
    
    if (useMiddleName) {
      const middle = robotNameMiddles[Math.floor(Math.random() * robotNameMiddles.length)]
      return `${prefix}-${middle}-${suffix}`
    }
    
    return `${prefix}-${suffix}`
  },

  /**
   * Generate random stats based on tier
   */
  generateRandomStats(tier: TierType): PlayerStats {
    const tierRanges = {
      amateur: { min: 40, max: 55 },
      'semi-pro': { min: 55, max: 70 },
      pro: { min: 70, max: 85 },
      elite: { min: 85, max: 99 }
    }

    const range = tierRanges[tier]
    
    const getRandomStat = () => Math.floor(Math.random() * (range.max - range.min + 1)) + range.min

    const stats: PlayerStats = {
      pace: getRandomStat(),
      shooting: getRandomStat(),
      passing: getRandomStat(),
      defense: getRandomStat(),
      physical: getRandomStat()
    }

    // Calculate overall as average
    stats.overall = Math.round(
      (stats.pace + stats.shooting + stats.passing + stats.defense + stats.physical) / 5
    )

    return stats
  },

  /**
   * Get tier information
   */
  getTierInfo(tier: string): TierInfo {
    const tierMap: Record<string, TierInfo> = {
      amateur: { name: 'Amateur', color: '#718096', range: { min: 40, max: 55 } },
      'semi-pro': { name: 'Semi-Pro', color: '#4299E1', range: { min: 55, max: 70 } },
      pro: { name: 'Professional', color: '#805AD5', range: { min: 70, max: 85 } },
      elite: { name: 'Elite', color: '#ED8936', range: { min: 85, max: 99 } }
    }
    
    return tierMap[tier] || tierMap.amateur
  },

  /**
   * Generate a complete squad based on formation
   */
  generateSquad(options: {
    formation?: string
    tierDistribution?: Record<TierType, number>
    useMiddleNames?: boolean
  } = {}): Player[] {
    const {
      formation = '4-4-2',
      tierDistribution = { amateur: 3, 'semi-pro': 4, pro: 3, elite: 1 },
      useMiddleNames = true
    } = options

    const squad: Player[] = []
    const config = formationConfigs[formation] || formationConfigs['4-4-2']
    
    // Generate goalkeeper
    const gkTier = Math.random() > 0.7 ? 'pro' : 'semi-pro'
    squad.push(this.generatePlayer('GK', gkTier as TierType, useMiddleNames))
    
    // Generate field players based on formation
    const roles: RoleType[] = []
    for (let i = 0; i < config.defenders; i++) roles.push('DEF')
    for (let i = 0; i < config.midfielders; i++) roles.push('MID')
    for (let i = 0; i < config.strikers; i++) roles.push('ST')
    
    // Shuffle roles for variety
    roles.sort(() => Math.random() - 0.5)
    
    // Distribute tiers
    const tierList: TierType[] = []
    Object.entries(tierDistribution).forEach(([tier, count]) => {
      for (let i = 0; i < count; i++) {
        tierList.push(tier as TierType)
      }
    })
    
    // Generate players
    roles.forEach((role, index) => {
      const tier = tierList[index % tierList.length]
      squad.push(this.generatePlayer(role, tier, useMiddleNames))
    })
    
    return squad
  },

  /**
   * Generate a single player
   */
  generatePlayer(role: RoleType, tier: TierType, useMiddleNames = true): Player {
    const stats = this.generateRandomStats(tier)
    
    // Adjust stats based on role
    if (role === 'GK') {
      stats.defense = Math.min(99, stats.defense + 10)
      stats.physical = Math.min(99, stats.physical + 5)
      stats.shooting = Math.max(30, stats.shooting - 20)
    } else if (role === 'DEF') {
      stats.defense = Math.min(99, stats.defense + 8)
      stats.physical = Math.min(99, stats.physical + 5)
    } else if (role === 'MID') {
      stats.passing = Math.min(99, stats.passing + 5)
    } else if (role === 'ST') {
      stats.shooting = Math.min(99, stats.shooting + 8)
      stats.pace = Math.min(99, stats.pace + 5)
    }
    
    // Recalculate overall
    const overall = Math.round(
      (stats.pace + stats.shooting + stats.passing + stats.defense + stats.physical) / 5
    )
    
    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: this.generateRobotName(useMiddleNames),
      role,
      tier,
      stats,
      overall,
      price: this.calculatePrice(overall, tier)
    }
  },

  /**
   * Calculate player price based on overall and tier
   */
  calculatePrice(overall: number, tier: string): number {
    const basePrice = overall * 1000
    const tierMultiplier = {
      amateur: 0.5,
      'semi-pro': 1,
      pro: 2,
      elite: 4
    }
    
    return Math.round(basePrice * (tierMultiplier[tier] || 1))
  },

  /**
   * Generate team colors
   */
  generateTeamColors(): { primary: string; secondary: string } {
    const primary = primaryColors[Math.floor(Math.random() * primaryColors.length)]
    let secondary = secondaryColors[Math.floor(Math.random() * secondaryColors.length)]
    
    // Ensure contrast
    while (primary === secondary) {
      secondary = secondaryColors[Math.floor(Math.random() * secondaryColors.length)]
    }
    
    return { primary, secondary }
  },

  /**
   * Generate team name
   */
  generateTeamName(): string {
    const prefixes = ['FC', 'Real', 'Athletic', 'Sporting', 'Racing', 'United', 'City', 'Town']
    const names = [
      'Cybertron', 'Nexus', 'Matrix', 'Binary', 'Quantum', 'Neural', 'Digital',
      'Silicon', 'Chrome', 'Titanium', 'Plasma', 'Fusion', 'Vertex', 'Apex'
    ]
    const suffixes = ['FC', 'United', 'City', 'Athletic', 'Rovers', 'Wanderers', '']
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const name = names[Math.floor(Math.random() * names.length)]
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
    
    return suffix ? `${prefix} ${name} ${suffix}` : `${prefix} ${name}`
  },

  /**
   * Calculate radar chart points for stats visualization
   */
  getRadarPoints(stats: PlayerStats, radius = 100): string {
    const attributes = ['pace', 'shooting', 'passing', 'defense', 'physical']
    const angleStep = (Math.PI * 2) / attributes.length
    const points: string[] = []

    attributes.forEach((attr, index) => {
      const value = stats[attr as keyof PlayerStats] || 0
      const normalizedValue = value / 100
      const angle = index * angleStep - Math.PI / 2
      const x = radius + normalizedValue * radius * Math.cos(angle)
      const y = radius + normalizedValue * radius * Math.sin(angle)
      points.push(`${x},${y}`)
    })

    return points.join(' ')
  }
}