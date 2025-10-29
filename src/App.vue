<template>
  <div id="app">
    <div class="header">
      <h1>⚛ 量子围棋 Quantum Go</h1>
      <p>探索量子力学的奇妙世界 - 叠加态、纠缠与测量</p>
    </div>

    <div class="game-container">
      <GameBoard />
      <ControlPanel />
    </div>

    <Notification />
    <GameOverModal />
  </div>
</template>

<script>
import GameBoard from './components/GameBoard.vue';
import ControlPanel from './components/ControlPanel.vue';
import Notification from './components/Notification.vue';
import GameOverModal from './components/GameOverModal.vue';

export default {
  name: 'App',
  components: {
    GameBoard,
    ControlPanel,
    Notification,
    GameOverModal
  },
  mounted() {
    // 初始化游戏
    this.$store.dispatch('game/initBoard');
    this.$store.dispatch('quantum/initQuantumState');
    
    // 延迟检查游戏状态，确保棋盘初始化完成
    setTimeout(() => {
      this.$store.dispatch('game/checkGameEnd');
    }, 1000);
  }
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Arial', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
}

#app {
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  text-align: center;
  color: white;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 2.5em;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.header p {
  font-size: 1.1em;
  opacity: 0.9;
}

.game-container {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
  justify-content: center;
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 1.8em;
  }

  .game-container {
    flex-direction: column;
    align-items: center;
  }
}
</style>