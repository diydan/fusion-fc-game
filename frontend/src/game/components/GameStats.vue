<template>
  <div class="game-stats">
    <div class="stats-header">
      <h3>Match Statistics</h3>
      <button @click="expanded = !expanded" class="toggle-btn">
        <i :class="expanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
      </button>
    </div>

    <transition name="slide">
      <div v-if="expanded" class="stats-content">
        <div class="team-stats">
          <div class="team-column home">
            <h4>{{ homeTeamName }}</h4>
            <div class="stat-row" v-for="stat in formattedStats" :key="stat.key">
              <span class="stat-value">{{ stat.home }}</span>
              <div class="stat-bar">
                <div 
                  class="stat-fill home-fill" 
                  :style="{ width: stat.homePercent + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <div class="stat-labels">
            <div class="stat-label" v-for="stat in formattedStats" :key="stat.key">
              {{ stat.label }}
            </div>
          </div>

          <div class="team-column away">
            <h4>{{ awayTeamName }}</h4>
            <div class="stat-row" v-for="stat in formattedStats" :key="stat.key">
              <div class="stat-bar">
                <div 
                  class="stat-fill away-fill" 
                  :style="{ width: stat.awayPercent + '%' }"
                ></div>
              </div>
              <span class="stat-value">{{ stat.away }}</span>
            </div>
          </div>
        </div>

        <div class="possession-meter">
          <div class="possession-label">Ball Possession</div>
          <div class="possession-bar">
            <div 
              class="possession-fill home-possession" 
              :style="{ width: stats.possession.home + '%' }"
            >
              {{ Math.round(stats.possession.home) }}%
            </div>
            <div 
              class="possession-fill away-possession" 
              :style="{ width: stats.possession.away + '%' }"
            >
              {{ Math.round(stats.possession.away) }}%
            </div>
          </div>
        </div>

        <div class="player-stats" v-if="selectedPlayer">
          <h4>
            <i class="fas fa-user"></i>
            {{ selectedPlayer.name }} (#{{ selectedPlayer.number }})
          </h4>
          <div class="player-stat-grid">
            <div class="player-stat">
              <span class="label">Touches</span>
              <span class="value">{{ selectedPlayer.stats.touches }}</span>
            </div>
            <div class="player-stat">
              <span class="label">Passes</span>
              <span class="value">{{ selectedPlayer.stats.passes }}</span>
            </div>
            <div class="player-stat">
              <span class="label">Shots</span>
              <span class="value">{{ selectedPlayer.stats.shots }}</span>
            </div>
            <div class="player-stat">
              <span class="label">Tackles</span>
              <span class="value">{{ selectedPlayer.stats.tackles }}</span>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  homeTeamName: {
    type: String,
    default: 'Home'
  },
  awayTeamName: {
    type: String,
    default: 'Away'
  },
  stats: {
    type: Object,
    default: () => ({
      shots: { home: 0, away: 0 },
      shotsOnTarget: { home: 0, away: 0 },
      passes: { home: 0, away: 0 },
      passAccuracy: { home: 0, away: 0 },
      fouls: { home: 0, away: 0 },
      corners: { home: 0, away: 0 },
      possession: { home: 50, away: 50 }
    })
  },
  selectedPlayer: {
    type: Object,
    default: null
  }
})

const expanded = ref(true)

const formattedStats = computed(() => {
  const statKeys = [
    { key: 'shots', label: 'Shots' },
    { key: 'shotsOnTarget', label: 'On Target' },
    { key: 'passes', label: 'Passes' },
    { key: 'passAccuracy', label: 'Pass Accuracy', suffix: '%' },
    { key: 'fouls', label: 'Fouls' },
    { key: 'corners', label: 'Corners' }
  ]

  return statKeys.map(({ key, label, suffix = '' }) => {
    const home = props.stats[key]?.home || 0
    const away = props.stats[key]?.away || 0
    const total = home + away || 1

    return {
      key,
      label,
      home: home + suffix,
      away: away + suffix,
      homePercent: (home / total) * 100,
      awayPercent: (away / total) * 100
    }
  })
})
</script>

<style scoped>
.game-stats {
  background: rgba(0, 0, 0, 0.8);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  overflow: hidden;
  width: 100%;
  max-width: 400px;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.stats-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.toggle-btn {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.stats-content {
  padding: 16px;
}

.team-stats {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.team-column h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}

.team-column.home h4 {
  color: #3498db;
}

.team-column.away h4 {
  color: #e74c3c;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 13px;
  font-weight: 500;
  color: white;
  min-width: 40px;
}

.team-column.home .stat-value {
  text-align: right;
}

.team-column.away .stat-value {
  text-align: left;
}

.stat-bar {
  flex: 1;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  min-width: 60px;
}

.stat-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.home-fill {
  background: #3498db;
  float: right;
}

.away-fill {
  background: #e74c3c;
}

.stat-labels {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding-top: 36px;
}

.stat-label {
  font-size: 12px;
  color: #888;
  text-align: center;
  margin-bottom: 8px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.possession-meter {
  margin-bottom: 16px;
}

.possession-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
  text-align: center;
}

.possession-bar {
  display: flex;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
}

.possession-fill {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: white;
  transition: width 0.3s ease;
}

.home-possession {
  background: #3498db;
}

.away-possession {
  background: #e74c3c;
}

.player-stats {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 16px;
}

.player-stats h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
}

.player-stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.player-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.player-stat .label {
  font-size: 12px;
  color: #888;
}

.player-stat .value {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>