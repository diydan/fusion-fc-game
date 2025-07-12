import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { 
  getGameData, 
  initializeGameData, 
  updateGameStats,
  createMatch,
  getMatch,
  updateMatch,
  getActiveMatches,
  getUserMatches
} from '@/services/database';
import { useUserStore } from './user';

export const useGameStore = defineStore('game', () => {
  // State
  const gameData = ref(null);
  const currentMatch = ref(null);
  const activeMatches = ref([]);
  const userMatches = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Computed
  const userStore = useUserStore();
  const userId = computed(() => userStore.currentUser?.uid);
  const score = computed(() => gameData.value?.score || 0);
  const level = computed(() => gameData.value?.level || 1);
  const stats = computed(() => gameData.value?.stats || {
    matchesPlayed: 0,
    matchesWon: 0,
    totalScore: 0
  });
  const winRate = computed(() => {
    if (!stats.value.matchesPlayed) return 0;
    return Math.round((stats.value.matchesWon / stats.value.matchesPlayed) * 100);
  });
  const achievements = computed(() => gameData.value?.achievements || []);
  const inventory = computed(() => gameData.value?.inventory || []);

  // Actions
  const initializeGame = async () => {
    if (!userId.value) return;
    
    loading.value = true;
    error.value = null;
    
    try {
      // Try to get existing game data
      const { data, error: fetchError } = await getGameData(userId.value);
      
      if (fetchError === 'Game data not found') {
        // Initialize new game data
        const { error: initError } = await initializeGameData(userId.value);
        if (initError) throw new Error(initError);
        
        // Fetch the newly created data
        const { data: newData, error: newFetchError } = await getGameData(userId.value);
        if (newFetchError) throw new Error(newFetchError);
        
        gameData.value = newData;
      } else if (fetchError) {
        throw new Error(fetchError);
      } else {
        gameData.value = data;
      }
      
      return true;
    } catch (err) {
      error.value = err.message;
      return false;
    } finally {
      loading.value = false;
    }
  };

  const updateScore = async (points) => {
    if (!userId.value) return;
    
    try {
      const { error: updateError } = await updateGameStats(userId.value, { score: points });
      if (updateError) throw new Error(updateError);
      
      // Update local state
      if (gameData.value) {
        gameData.value.score += points;
        gameData.value.stats.totalScore += points;
      }
      
      return true;
    } catch (err) {
      error.value = err.message;
      return false;
    }
  };

  const recordMatchResult = async (won) => {
    if (!userId.value) return;
    
    try {
      const updates = { matchesPlayed: 1 };
      if (won) updates.matchesWon = 1;
      
      const { error: updateError } = await updateGameStats(userId.value, updates);
      if (updateError) throw new Error(updateError);
      
      // Update local state
      if (gameData.value) {
        gameData.value.stats.matchesPlayed++;
        if (won) gameData.value.stats.matchesWon++;
      }
      
      return true;
    } catch (err) {
      error.value = err.message;
      return false;
    }
  };

  const createNewMatch = async (matchData) => {
    if (!userId.value) return null;
    
    try {
      const { id, error: createError } = await createMatch({
        ...matchData,
        createdBy: userId.value,
        players: [userId.value]
      });
      
      if (createError) throw new Error(createError);
      
      // Fetch the created match
      const { data, error: fetchError } = await getMatch(id);
      if (fetchError) throw new Error(fetchError);
      
      currentMatch.value = data;
      return id;
    } catch (err) {
      error.value = err.message;
      return null;
    }
  };

  const joinMatch = async (matchId) => {
    if (!userId.value || !matchId) return false;
    
    try {
      // Get match data
      const { data: match, error: fetchError } = await getMatch(matchId);
      if (fetchError) throw new Error(fetchError);
      
      // Check if user can join
      if (match.players.includes(userId.value)) {
        throw new Error('Already in this match');
      }
      
      if (match.players.length >= match.maxPlayers) {
        throw new Error('Match is full');
      }
      
      // Update match
      const updates = {
        players: [...match.players, userId.value]
      };
      
      if (match.players.length + 1 >= match.minPlayers) {
        updates.status = 'active';
      }
      
      const { error: updateError } = await updateMatch(matchId, updates);
      if (updateError) throw new Error(updateError);
      
      // Update local state
      currentMatch.value = { ...match, ...updates };
      return true;
    } catch (err) {
      error.value = err.message;
      return false;
    }
  };

  const leaveMatch = async () => {
    if (!userId.value || !currentMatch.value) return false;
    
    try {
      const updates = {
        players: currentMatch.value.players.filter(p => p !== userId.value)
      };
      
      if (updates.players.length < currentMatch.value.minPlayers) {
        updates.status = 'waiting';
      }
      
      const { error: updateError } = await updateMatch(currentMatch.value.id, updates);
      if (updateError) throw new Error(updateError);
      
      currentMatch.value = null;
      return true;
    } catch (err) {
      error.value = err.message;
      return false;
    }
  };

  const fetchActiveMatches = async (limit = 10) => {
    try {
      const { data, error: fetchError } = await getActiveMatches(limit);
      if (fetchError) throw new Error(fetchError);
      
      activeMatches.value = data;
      return true;
    } catch (err) {
      error.value = err.message;
      return false;
    }
  };

  const fetchUserMatches = async (limit = 10) => {
    if (!userId.value) return false;
    
    try {
      const { data, error: fetchError } = await getUserMatches(userId.value, limit);
      if (fetchError) throw new Error(fetchError);
      
      userMatches.value = data;
      return true;
    } catch (err) {
      error.value = err.message;
      return false;
    }
  };

  const addAchievement = (achievement) => {
    if (gameData.value && !gameData.value.achievements.includes(achievement)) {
      gameData.value.achievements.push(achievement);
    }
  };

  const addToInventory = (item) => {
    if (gameData.value) {
      gameData.value.inventory.push(item);
    }
  };

  const clearError = () => {
    error.value = null;
  };

  // Game-specific methods for the soccer game
  const getMatch = async (matchId) => {
    if (!matchId) return null;
    
    try {
      const { data, error: fetchError } = await getMatch(matchId);
      if (fetchError) throw new Error(fetchError);
      return data;
    } catch (err) {
      error.value = err.message;
      return null;
    }
  };

  const deleteMatch = async (matchId) => {
    if (!userId.value || !matchId) return false;
    
    try {
      // For now, just remove from local state
      activeMatches.value = activeMatches.value.filter(m => m.id !== matchId);
      userMatches.value = userMatches.value.filter(m => m.id !== matchId);
      
      // TODO: Add Firebase delete functionality
      return true;
    } catch (err) {
      error.value = err.message;
      return false;
    }
  };

  const updateMatchResult = async (matchId, result) => {
    if (!userId.value || !matchId) return false;
    
    try {
      const updates = {
        status: 'completed',
        result: result,
        completedAt: new Date().toISOString()
      };
      
      const { error: updateError } = await updateMatch(matchId, updates);
      if (updateError) throw new Error(updateError);
      
      // Record match result
      const won = result.winner === userId.value;
      await recordMatchResult(won);
      
      return true;
    } catch (err) {
      error.value = err.message;
      return false;
    }
  };

  const updateMatchStats = async (matchId, stats) => {
    if (!matchId) return false;
    
    try {
      const updates = {
        lastUpdated: new Date().toISOString(),
        gameStats: stats
      };
      
      const { error: updateError } = await updateMatch(matchId, updates);
      if (updateError) throw new Error(updateError);
      
      return true;
    } catch (err) {
      error.value = err.message;
      return false;
    }
  };

  return {
    // State
    gameData,
    currentMatch,
    activeMatches,
    userMatches,
    loading,
    error,
    
    // Computed
    score,
    level,
    stats,
    winRate,
    achievements,
    inventory,
    
    // Actions
    initializeGame,
    updateScore,
    recordMatchResult,
    createNewMatch,
    joinMatch,
    leaveMatch,
    fetchActiveMatches,
    fetchUserMatches,
    addAchievement,
    addToInventory,
    clearError,
    getMatch,
    deleteMatch,
    updateMatchResult,
    updateMatchStats
  };
});