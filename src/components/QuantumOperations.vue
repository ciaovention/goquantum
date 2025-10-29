<template>
  <div class="quantum-ops">
    <h3>⚛️ 量子操作</h3>
    
    <!-- 基础量子门 -->
    <div class="quantum-gates">
      <button
        class="btn btn-quantum"
        @click="applyHadamard"
        :disabled="!canUseHadamard"
        :title="`Hadamard门 - 消耗${getGateCost('hadamard')}能量`"
      >
        🌊 应用叠加态 (H门)
        <span class="cost">-{{ getGateCost('hadamard') }}</span>
      </button>

      <button
        class="btn btn-quantum"
        @click="startEntanglement"
        :disabled="!canUseCNOT"
        :title="`CNOT门 - 消耗${getGateCost('cnot')}能量`"
      >
        🔗 创建纠缠 (CNOT门)
        <span class="cost">-{{ getGateCost('cnot') }}</span>
      </button>

      <button
        class="btn btn-quantum"
        @click="showPauliMenu = !showPauliMenu"
        :disabled="!canUsePauli"
      >
        🔄 Pauli门操作
      </button>

      <!-- Pauli门子菜单 -->
      <div v-if="showPauliMenu" class="sub-menu">
        <button
          class="btn btn-quantum-sub"
          @click="selectOperation('pauli_x')"
          :disabled="!canUsePauliX"
        >
          X门 - 翻转颜色
          <span class="cost">-{{ getGateCost('pauli_x') }}</span>
        </button>
        <button
          class="btn btn-quantum-sub"
          @click="selectOperation('pauli_z')"
          :disabled="!canUsePauliZ"
        >
          Z门 - 相位翻转
          <span class="cost">-{{ getGateCost('pauli_z') }}</span>
        </button>
      </div>

      <!-- 高级量子操作 -->
      <button
        class="btn btn-quantum-advanced"
        @click="selectOperation('tunnel')"
        :disabled="!canUseTunnel"
        :title="`量子隧穿 - 消耗${getGateCost('tunnel')}能量`"
      >
        ⚡ 量子隧穿
        <span class="cost">-{{ getGateCost('tunnel') }}</span>
      </button>

      <button
        class="btn btn-quantum-advanced"
        @click="selectOperation('teleport')"
        :disabled="!canUseTeleport"
        :title="`量子传态 - 消耗${getGateCost('teleport')}能量`"
      >
        🌌 量子传态
        <span class="cost">-{{ getGateCost('teleport') }}</span>
      </button>

      <!-- 测量操作 -->
      <button
        class="btn btn-measure"
        @click="measureAll"
        :disabled="!hasSuperpositions"
      >
        📏 测量所有叠加态
      </button>

      <button
        class="btn btn-measure"
        @click="selectOperation('bell_measure')"
        :disabled="!hasEntanglements"
      >
        🔔 贝尔态测量
      </button>
    </div>

    <!-- 操作提示 -->
    <div v-if="currentOperation" class="operation-hint">
      <p>{{ getOperationHint }}</p>
      <button class="btn btn-cancel" @click="cancelOperation">
        取消操作
      </button>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';

export default {
  name: 'QuantumOperations',
  data() {
    return {
      showPauliMenu: false,
      currentOperation: null,
      selectedCells: []
    };
  },
  computed: {
    ...mapState('game', ['currentPlayer', 'gameMode', 'board']),
    ...mapState('quantum', ['quantumEnergy', 'quantumGates']),
    ...mapGetters('game', ['countStones', 'countSuperpositions', 'countEntanglements']),
    ...mapGetters('quantum', ['canUseQuantumGate', 'getQuantumGateCost']),
    
    canUseHadamard() {
      return this.isQuantumMode && 
             this.canUseQuantumGate(this.currentPlayer, 'hadamard') &&
             this.countStones(this.currentPlayer) > 0;
    },
    
    canUseCNOT() {
      return this.isQuantumMode &&
             this.canUseQuantumGate(this.currentPlayer, 'cnot') &&
             this.countStones(this.currentPlayer) >= 2;
    },
    
    canUsePauli() {
      return this.isQuantumMode &&
             (this.canUsePauliX || this.canUsePauliZ);
    },
    
    canUsePauliX() {
      return this.canUseQuantumGate(this.currentPlayer, 'pauli_x') &&
             this.countStones(this.currentPlayer) > 0;
    },
    
    canUsePauliZ() {
      return this.canUseQuantumGate(this.currentPlayer, 'pauli_z') &&
             this.countSuperpositions > 0;
    },
    
    canUseTunnel() {
      return this.isQuantumMode &&
             this.canUseQuantumGate(this.currentPlayer, 'tunnel') &&
             this.countStones(this.currentPlayer) > 0;
    },
    
    canUseTeleport() {
      return this.isQuantumMode &&
             this.canUseQuantumGate(this.currentPlayer, 'teleport') &&
             this.countEntanglements > 0;
    },
    
    hasSuperpositions() {
      return this.countSuperpositions > 0;
    },
    
    hasEntanglements() {
      return this.countEntanglements > 0;
    },
    
    isQuantumMode() {
      return this.gameMode === 'superposition' ||
             this.gameMode === 'entanglement' ||
             this.gameMode === 'quantum';
    },
    
    getOperationHint() {
      const hints = {
        'pauli_x': '选择一个棋子翻转颜色',
        'pauli_z': '选择一个叠加态棋子进行相位翻转',
        'tunnel': '选择起点和终点进行量子隧穿',
        'teleport': '选择一个纠缠的棋子和目标位置',
        'bell_measure': '选择一对纠缠的棋子进行贝尔态测量'
      };
      return hints[this.currentOperation] || '';
    }
  },
  methods: {
    ...mapActions('quantum', [
      'applyHadamard',
      'measureAll',
      'applyPauliX',
      'applyPauliZ',
      'quantumTunneling',
      'quantumTeleportation',
      'measureBellState'
    ]),
    ...mapActions('game', ['placeStone']),
    
    getGateCost(gateName) {
      return this.getQuantumGateCost(gateName);
    },
    
    startEntanglement() {
      this.$store.commit('game/SET_ENTANGLEMENT_MODE', true);
      this.$store.dispatch('showNotification', {
        title: '纠缠模式',
        message: '请选择两个棋子进行纠缠',
        type: 'info'
      });
    },
    
    selectOperation(operation) {
      this.currentOperation = operation;
      this.selectedCells = [];
      this.showPauliMenu = false;
      
      // 监听棋盘点击
      this.$root.$on('boardClick', this.handleBoardClick);
    },
    
    cancelOperation() {
      this.currentOperation = null;
      this.selectedCells = [];
      this.$root.$off('boardClick', this.handleBoardClick);
    },
    
    handleBoardClick(index) {
      if (!this.currentOperation) return;
      
      const cell = this.board[index];
      
      switch (this.currentOperation) {
        case 'pauli_x':
          if (cell.state === this.currentPlayer) {
            this.applyPauliX({ player: this.currentPlayer, index });
            this.cancelOperation();
          }
          break;
          
        case 'pauli_z':
          if (cell.superposition) {
            this.applyPauliZ({ player: this.currentPlayer, index });
            this.cancelOperation();
          }
          break;
          
        case 'tunnel':
          if (this.selectedCells.length === 0) {
            if (cell.state === this.currentPlayer) {
              this.selectedCells.push(index);
              this.$store.dispatch('showNotification', {
                title: '量子隧穿',
                message: '选择目标位置',
                type: 'info'
              });
            }
          } else {
            if (cell.state === 'empty') {
              this.quantumTunneling({
                player: this.currentPlayer,
                fromIndex: this.selectedCells[0],
                toIndex: index
              });
              this.cancelOperation();
            }
          }
          break;
          
        case 'teleport':
          if (this.selectedCells.length === 0) {
            if (cell.state === this.currentPlayer && cell.entangled) {
              this.selectedCells.push(index);
              this.$store.dispatch('showNotification', {
                title: '量子传态',
                message: '选择目标位置',
                type: 'info'
              });
            }
          } else {
            if (cell.state === 'empty') {
              this.quantumTeleportation({
                player: this.currentPlayer,
                sourceIndex: this.selectedCells[0],
                targetIndex: index
              });
              this.cancelOperation();
            }
          }
          break;
          
        case 'bell_measure':
          if (this.selectedCells.length === 0) {
            if (cell.entangled) {
              this.selectedCells.push(index);
            }
          } else {
            if (cell.entangled && cell.entangledWith === this.selectedCells[0]) {
              this.measureBellState({
                index1: this.selectedCells[0],
                index2: index
              });
              this.cancelOperation();
            }
          }
          break;
      }
    }
  },
  beforeDestroy() {
    this.$root.$off('boardClick', this.handleBoardClick);
  }
};
</script>

<style scoped>
.quantum-ops {
  margin-bottom: 25px;
}

.quantum-ops h3 {
  margin-bottom: 15px;
  color: #667eea;
  font-size: 1.2em;
}

.quantum-gates {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn {
  position: relative;
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 0.95em;
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

.btn-quantum {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.btn-quantum-advanced {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.btn-quantum-sub {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  padding: 8px;
  font-size: 0.9em;
}

.btn-measure {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
}

.btn-cancel {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  padding: 8px;
  font-size: 0.9em;
}

.cost {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.85em;
}

.sub-menu {
  margin-left: 20px;
  margin-top: 5px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.operation-hint {
  margin-top: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.operation-hint p {
  margin-bottom: 10px;
  color: #666;
}
</style>