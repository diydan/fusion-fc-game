import { ref, computed } from 'vue'

// Teams data interface
export interface TeamData {
  team: string
  token: string
  country: string
  league: string
  logo: string
  flag: string
  overall: number
  attack: number
  speed: number
  skill: number
  defense: number
  physical: number
  mental: number
  aggression: number
}

// Centralized teams data - single source of truth
const teamsData = ref<TeamData[]>([
  {
    team: 'Paris Saint-Germain',
    token: '$PSG',
    country: 'France',
    league: 'Ligue 1',
    logo: 'https://www.socios.com/wp-content/uploads/2024/01/Token-PSG.svg',
    flag: 'https://flagicons.lipis.dev/flags/4x3/fr.svg',
    overall: 90,
    attack: 89,
    speed: 87,
    skill: 89,
    defense: 68,
    physical: 81,
    mental: 89,
    aggression: 84
  },
  {
    team: 'FC Barcelona',
    token: '$BAR',
    country: 'Spain',
    league: 'La Liga',
    logo: 'https://www.socios.com/wp-content/uploads/2024/01/Token-FCB.svg',
    flag: 'https://flagicons.lipis.dev/flags/4x3/es.svg',
    overall: 89,
    attack: 87,
    speed: 87,
    skill: 90,
    defense: 73,
    physical: 82,
    mental: 90,
    aggression: 75
  },
  {
    team: 'Manchester City',
    token: '$CITY',
    country: 'England',
    league: 'Premier League',
    logo: 'https://www.socios.com/wp-content/uploads/2024/01/Token-CITY.svg',
    flag: 'https://flagicons.lipis.dev/flags/4x3/gb-eng.svg',
    overall: 88,
    attack: 89,
    speed: 86,
    skill: 91,
    defense: 85,
    physical: 84,
    mental: 90,
    aggression: 80
  },
  {
    team: 'Juventus',
    token: '$JUV',
    country: 'Italy',
    league: 'Serie A',
    logo: 'https://www.socios.com/wp-content/uploads/2024/01/Token-JUV.svg',
    flag: 'https://flagicons.lipis.dev/flags/4x3/it.svg',
    overall: 83,
    attack: 81,
    speed: 75,
    skill: 81,
    defense: 87,
    physical: 82,
    mental: 84,
    aggression: 84
  }
])

export function useTeamsData() {
  // Get team data by token symbol
  const getTeamByToken = (tokenSymbol: string): TeamData | null => {
    // Remove $ prefix if present and convert to uppercase
    const cleanSymbol = tokenSymbol.replace('$', '').toUpperCase()
    return teamsData.value.find(team => 
      team.token.replace('$', '').toUpperCase() === cleanSymbol
    ) || null
  }

  // Get team data by team name
  const getTeamByName = (teamName: string): TeamData | null => {
    return teamsData.value.find(team => 
      team.team.toLowerCase() === teamName.toLowerCase()
    ) || null
  }

  // Get all teams
  const getAllTeams = computed(() => teamsData.value)

  // Get team attributes formatted for display
  const getTeamAttributes = (tokenSymbol: string) => {
    const team = getTeamByToken(tokenSymbol)
    if (!team) {
      // Default attributes for unknown tokens
      return [
        { key: 'overall', label: 'Overall', value: 50 },
        { key: 'attack', label: 'Attack', value: 50 },
        { key: 'speed', label: 'Speed', value: 50 },
        { key: 'skill', label: 'Skill', value: 50 },
        { key: 'defense', label: 'Defense', value: 50 },
        { key: 'physical', label: 'Physical', value: 50 },
        { key: 'mental', label: 'Mental', value: 50 },
        { key: 'aggression', label: 'Aggression', value: 50 }
      ]
    }

    return [
      { key: 'overall', label: 'Overall', value: team.overall },
      { key: 'attack', label: 'Attack', value: team.attack },
      { key: 'speed', label: 'Speed', value: team.speed },
      { key: 'skill', label: 'Skill', value: team.skill },
      { key: 'defense', label: 'Defense', value: team.defense },
      { key: 'physical', label: 'Physical', value: team.physical },
      { key: 'mental', label: 'Mental', value: team.mental },
      { key: 'aggression', label: 'Aggression', value: team.aggression }
    ]
  }

  // Get team name by token symbol
  const getTeamName = (tokenSymbol: string): string => {
    const team = getTeamByToken(tokenSymbol)
    return team?.team || 'Unknown Team'
  }

  // Get team logo by token symbol
  const getTeamLogo = (tokenSymbol: string): string => {
    const team = getTeamByToken(tokenSymbol)
    return team?.logo || ''
  }

  return {
    teamsData,
    getAllTeams,
    getTeamByToken,
    getTeamByName,
    getTeamAttributes,
    getTeamName,
    getTeamLogo
  }
}
