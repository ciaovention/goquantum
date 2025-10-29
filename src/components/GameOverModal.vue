<template>
  <transition name="modal">
    <div v-if="gameOver" class="modal-overlay" @click.self="close">
      <div class="modal-content">
        <h2>🏆 游戏结束</h2>
        
        <div class="winner-section">
          <div class="winner-text">
            <span v-if="winner === 'black'" class="winner black">⚫ 黑方获胜！</span>
            <span v-else-if="winner === 'white'" class="winner white">⚪ 白方获胜！</span>
            <span v-else class="winner draw">🤝 平局！</span>
          </div>
        </div>
        
        <div class="score-details">
          <h3>最终得分</h3>
          <div class="score-row">
            <span class="player">⚫ 黑方</span>
            <span class="score">{{ blackTotal }} 目</span>
          </div>
          <div class="score-row">
            <span class="player">⚪ 白方</span>
            <span class="score">{{ whiteTotal }} 目</span>
          </div>
        </div>
        
        <div class="score-breakdown">
          <h4>得分明细</h4>
          <table>
            <tr>
              <th></th>
              <th>黑方</th>
              <th>白方</th>
            </tr>
            <tr>
              <td>吃子得分</td>
              <td>{{ scores.black }}</td>
              <td>{{ scores.white }}</td>
            </tr>
            <tr>
              <td>棋子数</td>
              <td>{{ blackStones }}</td>
              <td>{{ whiteStones }}</td>
            </tr>
            <tr>
              <td>领地</td>
              <td>{{ blackTerritory }}</td>
              <td>{{ whiteTerritory }}</td>
            </tr>
            <tr v-if="whiteKomi > 0">
              <td>贴目</td>
              <td>-</td>
              <td>+{{ whiteKomi }}</td>
            </tr>
            <tr class="total">
              <td>总计</td>
              <td>{{ blackTotal }}</td>
              <td>{{ whiteTotal }}</td>
            </tr>
          </table>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary" @click="newGame">
            🎮 新游戏
          </button>
          <button class="btn btn-secondary" @click="close">
            ❌ 关闭
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';

export default {
  name: 'GameOverModal',
  data() {
    return {
      whiteKomi: 7.5
    };
  },
  computed: {
    ...mapState('game', ['gameOver', 'winner', 'scores']),
    ...mapGetters('game', ['countStones', 'getTerritoryCount']),
    
    blackStones() {
      return this.countStones('black');
    },
    
    whiteStones() {
      return this.countStones('white');
    },
    
    blackTerritory() {
      return this.getTerritoryCount('black');
    },
    
    whiteTerritory() {
      return this.getTerritoryCount('white');
    },
    
    blackTotal() {
      return this.scores.black + this.blackStones + this.blackTerritory;
    },
    
    whiteTotal() {
      return this.scores.white + this.whiteStones + this.whiteTerritory + this.whiteKomi;
    }
  },
  methods: {
    ...mapActions('game', ['resetGame']),
    
    newGame() {
      this.resetGame();
    },
    
    close() {
      // 可以添加关闭逻辑，但游戏已结束
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 40px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: modalBounceIn 0.5s ease;
}

@keyframes modalBounceIn {
  0% {
    opacity: 0;
    transform: scale(0.7);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 2em;
}

.winner-section {
  text-align: center;
  margin-bottom: 30px;
}

.winner-text {
  font-size: 2.5em;
  font-weight: bold;
}

.winner.black {
  color: #000;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.winner.white {
  color: #666;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.winner.draw {
  color: #f39c12;
}

.score-details {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
}

.score-details h3 {
  margin-bottom: 15px;
  color: #333;
}

.score-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  font-size: 1.3em;
}

.player {
  font-weight: bold;
}

.score {
  color: #667eea;
  font-weight: bold;
}

.score-breakdown {
  margin-bottom: 30px;
}

.score-breakdown h4 {
  margin-bottom: 10px;
  color: #666;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 8px;
  text-align: center;
  border-bottom: 1px solid #e0e0e0;
}

th {
  background: #f0f0f0;
  font-weight: bold;
}

tr.total {
  font-weight: bold;
  background: #f8f9fa;
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.btn {
  padding: 12px 30px;
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  color: white;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.btn-secondary {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter, .modal-leave-to {
  opacity: 0;
}
</style>