<template>
  <div class="board-section">
    <div class="board-container">
      <div class="board" :style="boardStyle">
        <!-- 棋盘网格线 -->
        <div class="grid-lines">
          <!-- 横线 -->
          <div 
            v-for="i in boardSize" 
            :key="'h-line-' + i" 
            class="line horizontal"
            :style="{ top: `${(i - 1) * cellSize - 2}px` }"
          ></div>
          <!-- 竖线 -->
          <div 
            v-for="i in boardSize" 
            :key="'v-line-' + i" 
            class="line vertical"
            :style="{ left: `${(i - 1) * cellSize}px` }"
          ></div>
          <!-- 星位 (如果是9路棋盘) -->
          <div v-if="boardSize === 9" class="star-points">
            <div class="star" :style="{ top: `${2 * cellSize}px`, left: `${2 * cellSize}px` }"></div>
            <div class="star" :style="{ top: `${2 * cellSize}px`, left: `${6 * cellSize}px` }"></div>
            <div class="star" :style="{ top: `${6 * cellSize}px`, left: `${2 * cellSize}px` }"></div>
            <div class="star" :style="{ top: `${6 * cellSize}px`, left: `${6 * cellSize}px` }"></div>
            <div class="star" :style="{ top: `${4 * cellSize}px`, left: `${4 * cellSize}px` }"></div>
          </div>
        </div>
        
        <!-- 交叉点 -->
        <div
          v-for="(cell, index) in board"
          :key="index"
          class="intersection"
          :style="getIntersectionStyle(index)"
          :class="{
            disabled: !canPlaceStone(index) || gameOver,
            highlighted: isHighlighted(index)
          }"
          @click="handleCellClick(index)"
          @mouseenter="hoveredCell = index"
          @mouseleave="hoveredCell = null"
        >
        <!-- 经典棋子 -->
        <transition name="stone-fade">
          <div
            v-if="cell.state === 'black' || cell.state === 'white'"
            class="stone"
            :class="[cell.state, { entangled: cell.entangled }]"
          >
            <span v-if="cell.entangled">⚛️</span>
          </div>
        </transition>

        <!-- 叠加态棋子 -->
        <div
          v-if="cell.superposition"
          class="stone superposition"
          :class="cell.quantumState"
        >
          <span>{{ Math.round(cell.probability * 100) }}%</span>
          <div v-if="cell.decoherenceTime > 0" class="decoherence-timer">
            {{ cell.decoherenceTime }}
          </div>
        </div>

        <!-- 预览效果 -->
        <div
          v-if="showPreview && hoveredCell === index && canPlaceStone(index)"
          class="stone preview"
          :class="currentPlayer"
        ></div>
        </div>
      </div>
      
      <!-- 棋盘坐标 -->
      <div class="row-coords">
        <div 
          v-for="i in boardSize" 
          :key="'row-' + i" 
          class="coord row-coord"
          :style="{ top: `${(i - 1) * cellSize}px` }"
        >
          {{ boardSize - i + 1 }}
        </div>
      </div>
      <div class="col-coords">
        <div 
          v-for="i in boardSize" 
          :key="'col-' + i" 
          class="coord col-coord"
          :style="{ left: `${(i - 1) * cellSize + 30}px` }"
        >
          {{ String.fromCharCode(65 + i - 1) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';

export default {
  name: 'GameBoard',
  data() {
    return {
      hoveredCell: null,
      showPreview: true,
      cellSize: 60,  // 每个格子的大小
      isProcessingMove: false  // 防止连续点击
    };
  },
  computed: {
    ...mapState('game', ['board', 'boardSize', 'currentPlayer', 'gameMode', 'entanglementMode', 'gameOver']),
    ...mapGetters('game', ['getBoardCell']),
    
    boardStyle() {
      return {
        width: `${(this.boardSize - 1) * this.cellSize + 60}px`,
        height: `${(this.boardSize - 1) * this.cellSize + 60}px`
      };
    }
  },
  methods: {
    ...mapActions('game', ['placeStone']),
    
    async handleCellClick(index) {
      // 防止在处理过程中重复点击
      if (this.isProcessingMove) {
        return;
      }
      
      if (this.gameOver) {
        return;
      }
      
      if (!this.canPlaceStone(index)) {
        return;
      }
      
      try {
        this.isProcessingMove = true;
        const success = await this.placeStone(index);
        if (!success) {
          // 如果落子失败，立即允许再次点击
          this.isProcessingMove = false;
        }
      } catch (error) {
        console.error('Error placing stone:', error);
        this.isProcessingMove = false;
      } finally {
        // 延迟一下再允许下一次点击，确保状态更新完成
        if (this.isProcessingMove) {
          setTimeout(() => {
            this.isProcessingMove = false;
          }, 200);
        }
      }
    },
    
    canPlaceStone(index) {
      const cell = this.board[index];
      
      // 确保board已经初始化
      if (!cell) return false;
      
      if (this.entanglementMode) {
        return cell.state === this.currentPlayer;
      }
      
      // 使用store中的getter来检查是否可以合法落子
      if (this.gameMode === 'classic') {
        return this.$store.getters['game/canPlaceAtPosition'](index, this.currentPlayer);
      } else {
        // 量子模式下的特殊规则
        return cell.state === 'empty' || cell.superposition;
      }
    },
    
    isHighlighted(index) {
      return this.entanglementMode && 
             this.$store.state.game.firstEntangleCell === index;
    },
    
    getIntersectionStyle(index) {
      const row = Math.floor(index / this.boardSize);
      const col = index % this.boardSize;
      return {
        top: `${row * this.cellSize + 30}px`,
        left: `${col * this.cellSize + 30}px`
      };
    }
  }
};
</script>

<style scoped>
.board-section {
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  display: inline-block;
}

.board-container {
  position: relative;
  padding-left: 40px;
  padding-bottom: 40px;
}

.board {
  background: #dcb35c;
  border-radius: 10px;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.1);
  position: relative;
  border: 3px solid #8b7355;
  padding: 30px;
}

/* 网格线样式 */
.grid-lines {
  position: absolute;
  top: 28px;
  left: 28px;
  width: calc(100% - 56px);
  height: calc(100% - 56px);
}

.line {
  position: absolute;
  background: #2c2416;
}

.line.horizontal {
  left: 0;
  width: calc(100% + 4px);
  height: 2px;
}

.line.vertical {
  top: -2px;
  height: calc(100% + 4px);
  width: 2px;
}

/* 星位点 */
.star-points {
  position: relative;
}

.star {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #2c2416;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

/* 交叉点（可点击区域） */
.intersection {
  position: absolute;
  width: 40px;
  height: 40px;
  cursor: pointer;
  transform: translate(-50%, -50%);
  transition: all 0.1s;
  z-index: 10;
}

.intersection:hover:not(.disabled) {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
}

.intersection.disabled {
  cursor: not-allowed;
}

.intersection.highlighted {
  background: radial-gradient(circle, rgba(255, 215, 0, 0.5) 0%, transparent 70%);
}

.stone {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  font-weight: bold;
  font-size: 12px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
  transition: all 0.3s;
  z-index: 20;
}

.stone.black {
  background: radial-gradient(circle at 30% 30%, #4a4a4a, #000);
  color: white;
}

.stone.white {
  background: radial-gradient(circle at 30% 30%, #fff, #ddd);
  color: #333;
  border: 2px solid #999;
}

.stone.preview {
  opacity: 0.5;
}

.stone.superposition {
  animation: pulse 1.5s infinite;
  box-shadow: 0 0 20px rgba(138, 43, 226, 0.8);
  background: radial-gradient(circle at center, rgba(138, 43, 226, 0.8), rgba(138, 43, 226, 0.4));
  color: white;
  font-size: 10px;
}

.stone.superposition.black {
  background: radial-gradient(circle at center, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.4));
}

.stone.superposition.white {
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.4));
}

.stone.entangled {
  animation: rotate 3s linear infinite;
  border: 3px solid #ff6b6b;
}

.decoherence-timer {
  position: absolute;
  bottom: -5px;
  right: -5px;
  background: #ff6b6b;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(0.9);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

@keyframes rotate {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

.row-coords {
  position: absolute;
  left: 15px;
  top: 30px;
  width: 20px;
}

.col-coords {
  position: absolute;
  bottom: 15px;
  left: 40px;
  height: 20px;
}

.coord {
  position: absolute;
  font-size: 14px;
  font-weight: bold;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

.coord.row-coord {
  width: 20px;
  height: 20px;
  transform: translateY(-50%);
}

.coord.col-coord {
  width: 20px;
  height: 20px;
  transform: translateX(-50%);
}

/* 棋子消失动画 */
.stone-fade-enter-active, .stone-fade-leave-active {
  transition: all 0.5s ease;
}

.stone-fade-enter {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.5);
}

.stone-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(1.5);
}

/* 移除网格线效果，因为我们已经有边框了 */
</style>