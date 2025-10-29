<template>
  <div class="control-panel">
    <!-- 游戏状态 -->
    <div class="status" :class="{ 'game-over': gameOver }">
      <h3>游戏状态</h3>
      <p class="current-player" :class="currentPlayer">
        当前玩家: <strong>{{ currentPlayerText }}</strong>
      </p>
      <p>回合数: <strong>{{ turn }}</strong></p>
      <p>模式: <strong>{{ getModeText }}</strong></p>
      <div class="quantum-energy">
        <p>量子能量:</p>
        <div class="energy-bar">
          <div class="energy-player">
            <span>⚫</span>
            <div class="energy-dots">
              <span 
                v-for="i in maxQuantumEnergy" 
                :key="'black-' + i"
                class="energy-dot"
                :class="{ active: i <= quantumEnergy.black }"
              ></span>
            </div>
          </div>
          <div class="energy-player">
            <span>⚪</span>
            <div class="energy-dots">
              <span 
                v-for="i in maxQuantumEnergy" 
                :key="'white-' + i"
                class="energy-dot"
                :class="{ active: i <= quantumEnergy.white }"
              ></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 模式选择器 -->
    <div class="mode-selector">
      <label>选择游戏模式:</label>
      <select v-model="selectedMode" @change="changeMode">
        <option value="classic">经典模式</option>
        <option value="superposition">叠加态模式</option>
        <option value="entanglement">纠缠模式</option>
        <option value="quantum">完全量子模式</option>
      </select>
    </div>

    <!-- AI 设置 -->
    <div class="ai-settings">
      <label>
        <input type="checkbox" v-model="aiEnabled" @change="toggleAI">
        启用 AI 对手
      </label>
      <select v-if="aiEnabled" v-model="aiDifficulty" @change="changeAIDifficulty">
        <option value="easy">简单</option>
        <option value="medium">中等</option>
        <option value="hard">困难</option>
      </select>
    </div>

    <!-- 量子操作 -->
    <QuantumOperations />

    <!-- 游戏控制 -->
    <div class="game-controls">
      <button 
        class="btn btn-pass" 
        @click="pass" 
        :disabled="gameOver"
      >
        ⏭️ 弃权
      </button>
      <button class="btn btn-save" @click="saveGame">
        💾 保存游戏
      </button>
      <button class="btn btn-load" @click="loadGame">
        📁 加载游戏
      </button>
      <button class="btn btn-reset" @click="resetGame">
        🔄 重新开始
      </button>
    </div>

    <!-- 分数板 -->
    <ScoreBoard />

    <!-- 教程 -->
    <Tutorial />
  </div>
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex';
import QuantumOperations from './QuantumOperations.vue';
import ScoreBoard from './ScoreBoard.vue';
import Tutorial from './Tutorial.vue';

export default {
  name: 'ControlPanel',
  components: {
    QuantumOperations,
    ScoreBoard,
    Tutorial
  },
  data() {
    return {
      selectedMode: 'classic',
      maxQuantumEnergy: 5
    };
  },
  computed: {
    ...mapState('game', ['currentPlayer', 'turn', 'gameMode', 'aiEnabled', 'aiDifficulty', 'gameOver', 'winner']),
    ...mapState('quantum', ['quantumEnergy']),
    
    currentPlayerText() {
      if (this.gameOver) {
        if (this.winner) {
          return this.winner === 'black' ? '⚫ 黑方获胜！' : '⚪ 白方获胜！';
        } else {
          return '🤝 平局！';
        }
      }
      return this.currentPlayer === 'black' ? '⚫ 黑方' : '⚪ 白方';
    },
    
    getModeText() {
      const modes = {
        classic: '经典围棋',
        superposition: '叠加态模式',
        entanglement: '纠缠模式',
        quantum: '完全量子模式'
      };
      return modes[this.gameMode] || '未知模式';
    }
  },
  watch: {
    gameMode(val) {
      this.selectedMode = val;
    }
  },
  mounted() {
    this.selectedMode = this.gameMode;
  },
  methods: {
    ...mapMutations('game', ['SET_GAME_MODE', 'SET_AI_ENABLED', 'SET_AI_DIFFICULTY']),
    ...mapActions('game', ['pass', 'resetGame', 'saveGame', 'loadGame']),
    
    changeMode() {
      this.SET_GAME_MODE(this.selectedMode);
      this.resetGame();
    },
    
    toggleAI() {
      this.SET_AI_ENABLED(this.aiEnabled);
    },
    
    changeAIDifficulty() {
      this.SET_AI_DIFFICULTY(this.aiDifficulty);
    }
  }
};
</script>

<style scoped>
.control-panel {
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  min-width: 350px;
  max-width: 400px;
}

.status {
  margin-bottom: 25px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  color: white;
  transition: all 0.3s;
}

.status.game-over {
  background: linear-gradient(135deg, #ffd700 0%, #ff6b6b 100%);
}

.current-player {
  font-size: 1.2em;
  padding: 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s;
}

.current-player.black {
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.current-player.white {
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
}

.status h3 {
  margin-bottom: 15px;
  font-size: 1.3em;
}

.status p {
  margin: 8px 0;
  font-size: 1.1em;
}

.quantum-energy {
  margin-top: 15px;
}

.energy-bar {
  margin-top: 10px;
}

.energy-player {
  display: flex;
  align-items: center;
  margin: 5px 0;
  gap: 10px;
}

.energy-dots {
  display: flex;
  gap: 5px;
}

.energy-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: all 0.3s;
}

.energy-dot.active {
  background: #ffd700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
}

.mode-selector {
  margin-bottom: 20px;
}

.mode-selector label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
}

.mode-selector select,
.ai-settings select {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: 2px solid #667eea;
  font-size: 1em;
  background: white;
  cursor: pointer;
}

.ai-settings {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.ai-settings label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.ai-settings input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.ai-settings select {
  margin-top: 10px;
}

.game-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 1em;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  color: white;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-pass {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.btn-save {
  background: linear-gradient(135deg, #20bf55 0%, #01baef 100%);
}

.btn-load {
  background: linear-gradient(135deg, #fad961 0%, #f76b1c 100%);
}

.btn-reset {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}
</style>