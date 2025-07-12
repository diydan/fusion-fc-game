<template>
  <div>
    <b-tabs>
      <b-tab title="Football Sim">
        <div>
          <button @click="initGame">Init Game</button>
          <button @click="playIteration">Play Iteration</button>
          <button @click="startSecondHalf">Start Second Half</button>
          <button @click="getGameState">Get Game State</button>
        </div>
      </b-tab>
      <b-tab title="Multiplayer H2H">
        <div>
          <button @click="joinQueue">Join Queue</button>
          <button @click="validateGameState">Validate Game State</button>
          <button @click="handleDisconnect">Handle Disconnect</button>
          <button @click="completeMatch">Complete Match</button>
        </div>
      </b-tab>
    </b-tabs>

    <div>
      <button @click="toggleLog">Toggle Log Console</button>
      <div v-if="showLogConsole">
        <pre>{{ logMessages }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      showLogConsole: false,
      logMessages: ''
    };
  },
  methods: {
    initGame() {
      this.log('initGame called');
      // Implement initGame logic
    },
    playIteration() {
      this.log('playIteration called');
      // Implement playIteration logic
    },
    startSecondHalf() {
      this.log('startSecondHalf called');
      // Implement startSecondHalf logic
    },
    getGameState() {
      this.log('getGameState called');
      // Implement getGameState logic
    },
    joinQueue() {
      this.log('joinQueue called');
      // Mock write to matchmaking
    },
    validateGameState() {
      this.log('validateGameState called');
      // Implement validateGameState logic
    },
    handleDisconnect() {
      this.log('handleDisconnect called');
      // Simulate handleDisconnect
    },
    completeMatch() {
      this.log('completeMatch called');
      // Manually trigger completeMatch
    },
    toggleLog() {
      this.showLogConsole = !this.showLogConsole;
    },
    log(message) {
      this.logMessages += message + '\n';
    }
  }
};
</script>

<style scoped>
button {
  margin: 5px;
}
pre {
  background: #f4f4f4;
  padding: 10px;
}
</style>

