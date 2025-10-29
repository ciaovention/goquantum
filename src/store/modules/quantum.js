const state = {
  quantumEnergy: {
    black: 3,
    white: 3
  },
  maxQuantumEnergy: 5,
  quantumGates: {
    hadamard: { cost: 1, description: '创建叠加态' },
    cnot: { cost: 1, description: '创建纠缠' },
    pauli_x: { cost: 1, description: '翻转量子态' },
    pauli_z: { cost: 1, description: '相位翻转' },
    measure: { cost: 0, description: '测量叠加态' },
    teleport: { cost: 2, description: '量子传态' },
    tunnel: { cost: 2, description: '量子隧穿' }
  },
  decoherenceRate: 0.1,
  measurementHistory: []
};

const getters = {
  getQuantumEnergy: (state) => (player) => {
    return state.quantumEnergy[player];
  },

  canUseQuantumGate: (state) => (player, gateName) => {
    const gate = state.quantumGates[gateName];
    return gate && state.quantumEnergy[player] >= gate.cost;
  },

  getQuantumGateCost: (state) => (gateName) => {
    const gate = state.quantumGates[gateName];
    return gate ? gate.cost : 0;
  }
};

const mutations = {
  SET_QUANTUM_ENERGY(state, { player, energy }) {
    state.quantumEnergy[player] = Math.max(0, Math.min(state.maxQuantumEnergy, energy));
  },

  CONSUME_QUANTUM_ENERGY(state, { player, amount }) {
    state.quantumEnergy[player] = Math.max(0, state.quantumEnergy[player] - amount);
  },

  ADD_MEASUREMENT_HISTORY(state, measurement) {
    state.measurementHistory.push({
      ...measurement,
      timestamp: Date.now()
    });
  },

  RESET_QUANTUM_STATE(state) {
    state.quantumEnergy = { black: 3, white: 3 };
    state.measurementHistory = [];
  }
};

const actions = {
  initQuantumState({ commit }) {
    commit('RESET_QUANTUM_STATE');
  },

  restoreEnergy({ commit, state }, player) {
    if (state.quantumEnergy[player] < state.maxQuantumEnergy) {
      commit('SET_QUANTUM_ENERGY', {
        player,
        energy: state.quantumEnergy[player] + 1
      });
    }
  },

  applyHadamard({ commit, rootState, dispatch }, { player, targetIndex }) {
    if (!this.getters['quantum/canUseQuantumGate'](player, 'hadamard')) {
      dispatch('showNotification', {
        title: '能量不足',
        message: '没有足够的量子能量使用Hadamard门',
        type: 'warning'
      }, { root: true });
      return false;
    }

    // 查找玩家最后一个棋子
    let lastStoneIndex = -1;
    for (let i = rootState.game.board.length - 1; i >= 0; i--) {
      if (rootState.game.board[i].state === player && !rootState.game.board[i].superposition) {
        lastStoneIndex = i;
        break;
      }
    }

    if (lastStoneIndex === -1) {
      dispatch('showNotification', {
        title: '错误',
        message: '没有找到可以应用叠加态的棋子',
        type: 'warning'
      }, { root: true });
      return false;
    }

    // 找到相邻的空位
    const adjacentEmpty = rootState.game.getters['game/getEmptyAdjacentCells'](lastStoneIndex);
    
    if (adjacentEmpty.length > 0) {
      const target = targetIndex || adjacentEmpty[Math.floor(Math.random() * adjacentEmpty.length)];
      
      commit('game/SET_CELL', {
        index: target,
        cellData: {
          state: 'empty',
          superposition: true,
          probability: 0.7,
          entangled: false,
          entangledWith: null,
          quantumState: player,
          decoherenceTime: 5
        }
      }, { root: true });

      commit('CONSUME_QUANTUM_ENERGY', { player, amount: 1 });
      
      dispatch('showNotification', {
        title: 'Hadamard门',
        message: '成功应用H门，创建叠加态！',
        type: 'success'
      }, { root: true });
      
      return true;
    }

    dispatch('showNotification', {
      title: '错误',
      message: '周围没有空位可以创建叠加态',
      type: 'warning'
    }, { root: true });
    return false;
  },

  createEntanglement({ commit, rootState, dispatch }, { index1, index2 }) {
    const player = rootState.game.currentPlayer;
    
    if (!this.getters['quantum/canUseQuantumGate'](player, 'cnot')) {
      dispatch('showNotification', {
        title: '能量不足',
        message: '没有足够的量子能量创建纠缠',
        type: 'warning'
      }, { root: true });
      return false;
    }

    // 创建纠缠
    commit('game/SET_CELL', {
      index: index1,
      cellData: {
        entangled: true,
        entangledWith: index2
      }
    }, { root: true });

    commit('game/SET_CELL', {
      index: index2,
      cellData: {
        entangled: true,
        entangledWith: index1
      }
    }, { root: true });

    commit('CONSUME_QUANTUM_ENERGY', { player, amount: 1 });

    dispatch('showNotification', {
      title: 'CNOT门',
      message: '成功创建纠缠态！两个棋子现在量子纠缠',
      type: 'success'
    }, { root: true });

    return true;
  },

  measureCell({ commit, rootState, dispatch }, index) {
    const cell = rootState.game.board[index];
    
    if (!cell.superposition) return;

    // 量子测量 - 波函数坍缩
    const random = Math.random();
    const collapsed = random < cell.probability;
    
    const result = {
      index,
      originalProbability: cell.probability,
      collapsed,
      result: collapsed ? cell.quantumState : 'empty'
    };

    commit('ADD_MEASUREMENT_HISTORY', result);

    if (collapsed) {
      commit('game/SET_CELL', {
        index,
        cellData: {
          state: cell.quantumState,
          superposition: false,
          probability: 1,
          entangled: false,
          entangledWith: null,
          quantumState: null
        }
      }, { root: true });
      
      dispatch('showNotification', {
        title: '测量',
        message: `叠加态坍缩为${cell.quantumState === 'black' ? '黑棋' : '白棋'}`,
        type: 'success'
      }, { root: true });
    } else {
      commit('game/SET_CELL', {
        index,
        cellData: {
          state: 'empty',
          superposition: false,
          probability: 0,
          entangled: false,
          entangledWith: null,
          quantumState: null
        }
      }, { root: true });
      
      dispatch('showNotification', {
        title: '测量',
        message: '叠加态坍缩为空',
        type: 'info'
      }, { root: true });
    }

    // 处理纠缠效应
    if (cell.entangled && cell.entangledWith !== null) {
      dispatch('affectEntangledStone', {
        index: cell.entangledWith,
        controlState: collapsed
      });
    }
  },

  affectEntangledStone({ commit, rootState, dispatch }, { index, controlState }) {
    const cell = rootState.game.board[index];
    
    if (cell.superposition) {
      // 纠缠效应：控制棋子的状态影响目标棋子
      let newProbability = cell.probability;
      
      if (controlState) {
        // 如果控制棋子坍缩为实体，目标棋子概率增加
        newProbability = Math.min(0.95, cell.probability + 0.3);
      } else {
        // 如果控制棋子坍缩为空，目标棋子概率降低
        newProbability = Math.max(0.05, cell.probability - 0.3);
      }
      
      commit('game/SET_CELL', {
        index,
        cellData: {
          probability: newProbability
        }
      }, { root: true });
      
      dispatch('showNotification', {
        title: '纠缠效应',
        message: '纠缠的棋子受到了影响！',
        type: 'info'
      }, { root: true });
    }
  },

  measureAll({ rootState, dispatch }) {
    let measured = 0;
    
    for (let i = 0; i < rootState.game.board.length; i++) {
      if (rootState.game.board[i].superposition) {
        dispatch('measureCell', i);
        measured++;
      }
    }
    
    if (measured > 0) {
      dispatch('showNotification', {
        title: '全局测量',
        message: `测量了${measured}个叠加态`,
        type: 'success'
      }, { root: true });
    }
  },

  applyPauliX({ commit, rootState, dispatch }, { player, index }) {
    if (!this.getters['quantum/canUseQuantumGate'](player, 'pauli_x')) {
      dispatch('showNotification', {
        title: '能量不足',
        message: '没有足够的量子能量使用Pauli-X门',
        type: 'warning'
      }, { root: true });
      return false;
    }

    const cell = rootState.game.board[index];
    
    if (cell.state === 'black' || cell.state === 'white') {
      const newState = cell.state === 'black' ? 'white' : 'black';
      
      commit('game/SET_CELL', {
        index,
        cellData: {
          state: newState
        }
      }, { root: true });
      
      commit('CONSUME_QUANTUM_ENERGY', { player, amount: 1 });
      
      dispatch('showNotification', {
        title: 'Pauli-X门',
        message: '成功翻转棋子颜色！',
        type: 'success'
      }, { root: true });
      
      return true;
    }
    
    return false;
  },

  applyPauliZ({ commit, rootState, dispatch }, { player, index }) {
    if (!this.getters['quantum/canUseQuantumGate'](player, 'pauli_z')) {
      return false;
    }

    const cell = rootState.game.board[index];
    
    if (cell.superposition) {
      commit('game/SET_CELL', {
        index,
        cellData: {
          probability: 1 - cell.probability
        }
      }, { root: true });
      
      commit('CONSUME_QUANTUM_ENERGY', { player, amount: 1 });
      
      dispatch('showNotification', {
        title: 'Pauli-Z门',
        message: '成功进行相位翻转！',
        type: 'success'
      }, { root: true });
      
      return true;
    }
    
    return false;
  },

  quantumTunneling({ commit, rootState, dispatch, getters }, { player, fromIndex, toIndex }) {
    if (!this.getters['quantum/canUseQuantumGate'](player, 'tunnel')) {
      return false;
    }

    const fromCell = rootState.game.board[fromIndex];
    const toCell = rootState.game.board[toIndex];
    
    if (fromCell.state !== player || toCell.state !== 'empty') {
      return false;
    }

    // 计算隧穿概率
    const distance = rootState.game.getters['game/getDistance'](fromIndex, toIndex);
    const probability = Math.exp(-distance / 3);
    
    if (Math.random() < probability) {
      // 成功隧穿
      commit('game/SET_CELL', {
        index: toIndex,
        cellData: { ...fromCell }
      }, { root: true });
      
      commit('game/SET_CELL', {
        index: fromIndex,
        cellData: {
          state: 'empty',
          superposition: false,
          probability: 0,
          entangled: false,
          entangledWith: null,
          quantumState: null
        }
      }, { root: true });
      
      commit('CONSUME_QUANTUM_ENERGY', { player, amount: 2 });
      
      dispatch('showNotification', {
        title: '量子隧穿',
        message: `成功隧穿！概率为${Math.round(probability * 100)}%`,
        type: 'success'
      }, { root: true });
      
      return true;
    } else {
      dispatch('showNotification', {
        title: '隧穿失败',
        message: `隧穿失败，概率为${Math.round(probability * 100)}%`,
        type: 'warning'
      }, { root: true });
      
      return false;
    }
  },

  quantumTeleportation({ commit, rootState, dispatch }, { player, sourceIndex, targetIndex }) {
    if (!this.getters['quantum/canUseQuantumGate'](player, 'teleport')) {
      return false;
    }

    const sourceCell = rootState.game.board[sourceIndex];
    const targetCell = rootState.game.board[targetIndex];
    
    if (!sourceCell.entangled || targetCell.state !== 'empty') {
      dispatch('showNotification', {
        title: '传态失败',
        message: '需要纠缠的棋子和空位目标',
        type: 'warning'
      }, { root: true });
      return false;
    }

    // 量子传态
    commit('game/SET_CELL', {
      index: targetIndex,
      cellData: { ...sourceCell }
    }, { root: true });
    
    commit('game/SET_CELL', {
      index: sourceIndex,
      cellData: {
        state: 'empty',
        superposition: false,
        probability: 0,
        entangled: false,
        entangledWith: null,
        quantumState: null
      }
    }, { root: true });
    
    commit('CONSUME_QUANTUM_ENERGY', { player, amount: 2 });
    
    dispatch('showNotification', {
      title: '量子传态',
      message: '成功传输量子态！',
      type: 'success'
    }, { root: true });
    
    return true;
  },

  applyDecoherence({ commit, rootState, state }) {
    try {
      // 量子退相干 - 叠加态随时间逐渐退相干
      if (!rootState.game || !rootState.game.board) {
        return;
      }
      
      rootState.game.board.forEach((cell, index) => {
        if (cell.superposition) {
          // 概率逐渐趋向0或1
          let newProbability = cell.probability;
          
          if (cell.probability > 0.5) {
            newProbability = Math.min(0.99, cell.probability + state.decoherenceRate);
          } else {
            newProbability = Math.max(0.01, cell.probability - state.decoherenceRate);
          }
          
          // 减少退相干时间
          const newDecoherenceTime = Math.max(0, cell.decoherenceTime - 1);
          
          commit('game/SET_CELL', {
            index,
            cellData: {
              probability: newProbability,
              decoherenceTime: newDecoherenceTime
            }
          }, { root: true });
          
          // 如果退相干时间到了，自动测量
          if (newDecoherenceTime === 0) {
            this.dispatch('quantum/measureCell', index);
          }
        }
      });
    } catch (error) {
      console.error('Error in applyDecoherence:', error);
    }
  },

  measureBellState({ commit, rootState, dispatch }, { index1, index2 }) {
    const cell1 = rootState.game.board[index1];
    const cell2 = rootState.game.board[index2];
    
    if (cell1.entangledWith === index2 && cell2.entangledWith === index1) {
      // 贝尔态测量
      const result = Math.random() < 0.5 ? 'same' : 'opposite';
      
      if (result === 'same') {
        const state = Math.random() < 0.5 ? 'black' : 'white';
        
        commit('game/SET_CELL', {
          index: index1,
          cellData: { state, entangled: false, entangledWith: null }
        }, { root: true });
        
        commit('game/SET_CELL', {
          index: index2,
          cellData: { state, entangled: false, entangledWith: null }
        }, { root: true });
      } else {
        const state1 = Math.random() < 0.5 ? 'black' : 'white';
        const state2 = state1 === 'black' ? 'white' : 'black';
        
        commit('game/SET_CELL', {
          index: index1,
          cellData: { state: state1, entangled: false, entangledWith: null }
        }, { root: true });
        
        commit('game/SET_CELL', {
          index: index2,
          cellData: { state: state2, entangled: false, entangledWith: null }
        }, { root: true });
      }
      
      dispatch('showNotification', {
        title: '贝尔态测量',
        message: `测量结果：${result === 'same' ? '相同状态' : '相反状态'}`,
        type: 'success'
      }, { root: true });
      
      return true;
    }
    
    return false;
  },

  aiQuantumMove({ rootState, dispatch, getters }) {
    // AI 使用量子操作的策略
    const aiPlayer = 'white';
    const difficulty = rootState.game.aiDifficulty;
    
    // 根据难度决定使用量子操作的概率
    const quantumProbability = {
      easy: 0.1,
      medium: 0.3,
      hard: 0.5
    }[difficulty];
    
    if (Math.random() < quantumProbability && getters.getQuantumEnergy(aiPlayer) > 0) {
      // 随机选择一个量子操作
      const operations = ['hadamard', 'entanglement', 'measure'];
      const operation = operations[Math.floor(Math.random() * operations.length)];
      
      switch (operation) {
        case 'hadamard':
          dispatch('applyHadamard', { player: aiPlayer });
          break;
        case 'entanglement':
          // 找两个AI的棋子进行纠缠
          const aiStones = [];
          rootState.game.board.forEach((cell, index) => {
            if (cell.state === aiPlayer) {
              aiStones.push(index);
            }
          });
          
          if (aiStones.length >= 2) {
            const idx1 = Math.floor(Math.random() * aiStones.length);
            let idx2 = Math.floor(Math.random() * aiStones.length);
            while (idx2 === idx1) {
              idx2 = Math.floor(Math.random() * aiStones.length);
            }
            
            dispatch('createEntanglement', {
              index1: aiStones[idx1],
              index2: aiStones[idx2]
            });
          }
          break;
        case 'measure':
          // 测量一个叠加态
          const superpositions = [];
          rootState.game.board.forEach((cell, index) => {
            if (cell.superposition && cell.quantumState === aiPlayer) {
              superpositions.push(index);
            }
          });
          
          if (superpositions.length > 0) {
            const idx = superpositions[Math.floor(Math.random() * superpositions.length)];
            dispatch('measureCell', idx);
          }
          break;
      }
    }
    
    // 然后进行常规落子
    setTimeout(() => {
      dispatch('game/aiNormalMove', null, { root: true });
    }, 500);
  }
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};