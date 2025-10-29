import Vue from 'vue';

// 辅助函数：获取棋块
function getGroupHelper(state, getters, index, visited = new Set()) {
  if (visited.has(index)) return [];
  
  const cell = state.board[index];
  if (!cell || cell.state === 'empty') return [];
  
  visited.add(index);
  const group = [index];
  const color = cell.state;
  
  const adjacent = getters.getAdjacentCells(index);
  for (const adjIndex of adjacent) {
    const adjCell = state.board[adjIndex];
    if (adjCell && adjCell.state === color && !visited.has(adjIndex)) {
      const subGroup = getGroupHelper(state, getters, adjIndex, visited);
      group.push(...subGroup);
    }
  }
  
  return group;
}

// 辅助函数：检查棋块是否被吃
function isGroupCapturedHelper(state, getters, group) {
  // 获取整个棋块所有相邻的空点
  const liberties = new Set();
  
  for (let index of group) {
    const adjacent = getters.getAdjacentCells(index);
    for (let adjIndex of adjacent) {
      const adjCell = state.board[adjIndex];
      // 如果相邻点是空的，这就是一个气
      if (adjCell.state === 'empty') {
        liberties.add(adjIndex);
      }
    }
  }
  
  // 如果没有气，这个棋块被吃
  return liberties.size === 0;
}

const state = {
  boardSize: 9,
  board: [],
  currentPlayer: 'black',
  turn: 1,
  gameMode: 'classic',
  selectedCell: null,
  entanglementMode: false,
  firstEntangleCell: null,
  gameHistory: [],
  aiEnabled: false,
  aiDifficulty: 'medium',
  scores: {
    black: 0,
    white: 0
  },
  gameOver: false,
  winner: null,
  passCount: 0,  // 连续Pass次数
  koPosition: null,  // 记录劫的位置，防止立即回提
  isProcessingMove: false  // 防止同时处理多个落子
};

const getters = {
  getBoardCell: (state) => (index) => {
    return state.board[index];
  },
  
  getAdjacentCells: (state) => (index) => {
    const adjacent = [];
    const row = Math.floor(index / state.boardSize);
    const col = index % state.boardSize;

    if (row > 0) adjacent.push(index - state.boardSize);
    if (row < state.boardSize - 1) adjacent.push(index + state.boardSize);
    if (col > 0 && index % state.boardSize > 0) adjacent.push(index - 1);
    if (col < state.boardSize - 1 && index % state.boardSize < state.boardSize - 1) adjacent.push(index + 1);

    return adjacent;
  },

  getEmptyAdjacentCells: (state, getters) => (index) => {
    return getters.getAdjacentCells(index).filter(i => 
      state.board[i].state === 'empty' && !state.board[i].superposition
    );
  },

  countStones: (state) => (color) => {
    return state.board.filter(cell => cell.state === color).length;
  },

  countSuperpositions: (state) => {
    return state.board.filter(cell => cell.superposition).length;
  },

  countEntanglements: (state) => {
    const pairs = new Set();
    
    state.board.forEach((cell, index) => {
      if (cell.entangled && cell.entangledWith !== null) {
        const pairKey = [index, cell.entangledWith].sort().join('-');
        pairs.add(pairKey);
      }
    });
    
    return pairs.size;
  },

  hasSuperpositions: (state) => {
    return state.board.some(cell => cell.superposition);
  },

  getDistance: (state) => (index1, index2) => {
    const row1 = Math.floor(index1 / state.boardSize);
    const col1 = index1 % state.boardSize;
    const row2 = Math.floor(index2 / state.boardSize);
    const col2 = index2 % state.boardSize;
    
    return Math.sqrt(Math.pow(row2 - row1, 2) + Math.pow(col2 - col1, 2));
  },
  
  hasEmptyCells: (state) => {
    return state.board.some(cell => cell.state === 'empty');
  },
  
  // 检查某个空位是否可以合法落子
  canPlaceAtPosition: (state, getters) => (index, player) => {
    const cell = state.board[index];
    if (cell.state !== 'empty') return false;
    
    // 检查是否违反劫规则
    if (state.koPosition === index) {
      return false;
    }
    
    // 创建一个临时的棋盘副本来模拟
    const tempBoard = state.board.map(c => ({ ...c }));
    const tempState = { ...state, board: tempBoard };
    tempBoard[index].state = player;
    
    // 检查是否会立即被吃（自杀）
    const group = getGroupHelper(tempState, getters, index);
    const wouldBeCaptured = isGroupCapturedHelper(tempState, getters, group);
    
    // 检查是否能吃掉对手的棋子
    const adjacent = getters.getAdjacentCells(index);
    const opponent = player === 'black' ? 'white' : 'black';
    let canCaptureOpponent = false;
    
    for (const adjIndex of adjacent) {
      if (tempBoard[adjIndex].state === opponent) {
        const opponentGroup = getGroupHelper(tempState, getters, adjIndex);
        if (isGroupCapturedHelper(tempState, getters, opponentGroup)) {
          canCaptureOpponent = true;
          break;
        }
      }
    }
    
    // 如果会被吃且不能吃对方，则不能落子（自杀规则）
    if (wouldBeCaptured && !canCaptureOpponent) {
      return false;
    }
    
    return true;
  },
  
  // 检查是否还有合法的落子位置
  hasLegalMoves: (state, getters) => (player) => {
    for (let i = 0; i < state.board.length; i++) {
      if (getters.canPlaceAtPosition(i, player)) {
        return true;
      }
    }
    return false;
  },
  
  // 计算领地（包括围住的空地）
  getTerritoryCount: (state) => (color) => {
    const visited = new Set();
    let territory = 0;
    
    // 计算所有被该颜色围住的空地
    state.board.forEach((cell, index) => {
      if (cell.state === 'empty' && !visited.has(index)) {
        const group = [];
        const owner = getEmptyGroupOwner(state, index, visited, group);
        
        if (owner === color) {
          territory += group.length;
        }
      }
    });
    
    return territory;
  }
};

// 辅助函数：判断空地群的所有者
function getEmptyGroupOwner(state, index, visited, group) {
  if (visited.has(index)) return null;
  
  const cell = state.board[index];
  if (cell.state !== 'empty') return null;
  
  visited.add(index);
  group.push(index);
  
  const row = Math.floor(index / state.boardSize);
  const col = index % state.boardSize;
  const adjacent = [];
  
  if (row > 0) adjacent.push(index - state.boardSize);
  if (row < state.boardSize - 1) adjacent.push(index + state.boardSize);
  if (col > 0) adjacent.push(index - 1);
  if (col < state.boardSize - 1) adjacent.push(index + 1);
  
  const adjacentColors = new Set();
  
  adjacent.forEach(adjIndex => {
    const adjCell = state.board[adjIndex];
    if (adjCell.state === 'empty') {
      getEmptyGroupOwner(state, adjIndex, visited, group);
    } else if (adjCell.state === 'black' || adjCell.state === 'white') {
      adjacentColors.add(adjCell.state);
    }
  });
  
  // 如果只接触一种颜色的棋子，则该颜色拥有这片领地
  return adjacentColors.size === 1 ? Array.from(adjacentColors)[0] : null;
}

const mutations = {
  INIT_BOARD(state) {
    state.board = [];
    for (let i = 0; i < state.boardSize * state.boardSize; i++) {
      state.board.push({
        state: 'empty',
        superposition: false,
        probability: 0,
        entangled: false,
        entangledWith: null,
        quantumState: null,
        phase: 0,
        decoherenceTime: 0
      });
    }
  },

  SET_CELL(state, { index, cellData }) {
    Vue.set(state.board, index, { ...state.board[index], ...cellData });
  },

  SET_CURRENT_PLAYER(state, player) {
    state.currentPlayer = player;
  },

  INCREMENT_TURN(state) {
    state.turn++;
  },

  SET_GAME_MODE(state, mode) {
    state.gameMode = mode;
  },

  SET_ENTANGLEMENT_MODE(state, mode) {
    state.entanglementMode = mode;
  },

  SET_FIRST_ENTANGLE_CELL(state, index) {
    state.firstEntangleCell = index;
  },

  ADD_TO_HISTORY(state, move) {
    state.gameHistory.push({
      ...move,
      turn: state.turn,
      timestamp: Date.now()
    });
  },

  SET_AI_ENABLED(state, enabled) {
    state.aiEnabled = enabled;
  },

  SET_AI_DIFFICULTY(state, difficulty) {
    state.aiDifficulty = difficulty;
  },

  UPDATE_SCORE(state, { player, points }) {
    state.scores[player] += points;
  },

  RESET_GAME(state) {
    state.currentPlayer = 'black';
    state.turn = 1;
    state.selectedCell = null;
    state.entanglementMode = false;
    state.firstEntangleCell = null;
    state.gameHistory = [];
    state.scores = { black: 0, white: 0 };
    state.gameOver = false;
    state.winner = null;
    state.passCount = 0;
    state.koPosition = null;
  },
  
  SET_KO_POSITION(state, position) {
    state.koPosition = position;
  },
  
  SET_GAME_OVER(state, { winner }) {
    state.gameOver = true;
    state.winner = winner;
  },
  
  INCREMENT_PASS_COUNT(state) {
    state.passCount++;
  },
  
  RESET_PASS_COUNT(state) {
    state.passCount = 0;
  },
  
  SET_PROCESSING_MOVE(state, value) {
    state.isProcessingMove = value;
  }
};

const actions = {
  initBoard({ commit }) {
    commit('INIT_BOARD');
  },

  async placeStone({ commit, state, dispatch }, index) {
    // 防止同时处理多个落子
    if (state.isProcessingMove) {
      return false;
    }
    
    // 如果游戏已结束，不能下棋
    if (state.gameOver) {
      return false;
    }
    
    commit('SET_PROCESSING_MOVE', true);
    
    try {
      const cell = state.board[index];

      if (state.entanglementMode) {
        dispatch('selectForEntanglement', index);
        return false;
      }

    if (cell.state !== 'empty' && !cell.superposition) {
      dispatch('showNotification', {
        title: '无效操作',
        message: '该位置已有棋子',
        type: 'warning'
      }, { root: true });
      return false;
    }
    
    // 检查是否违反劫规则
    if (state.koPosition === index) {
      dispatch('showNotification', {
        title: '无效操作',
        message: '不能立即回提（劫）',
        type: 'warning'
      }, { root: true });
      return false;
    }

    const moveData = {
      index,
      player: state.currentPlayer,
      mode: state.gameMode
    };

    let moveSuccess = false;
    
    switch (state.gameMode) {
      case 'classic':
        moveSuccess = await dispatch('placeClassicStone', index);
        break;
      case 'superposition':
        moveSuccess = await dispatch('placeSuperpositionStone', index);
        break;
      case 'entanglement':
      case 'quantum':
        moveSuccess = await dispatch('placeQuantumStone', index);
        break;
    }

      if (moveSuccess === true) {
        commit('ADD_TO_HISTORY', moveData);
        
        try {
          // 检查游戏是否应该结束
          await dispatch('checkGameEnd');
        } catch (error) {
          console.error('Error checking game end:', error);
        }
        
        // 如果游戏还没结束，切换回合
        if (!state.gameOver) {
          try {
            await dispatch('endTurn');
          } catch (error) {
            console.error('Critical error in endTurn:', error);
            // 最低限度的回合切换
            const nextPlayer = state.currentPlayer === 'black' ? 'white' : 'black';
            commit('SET_CURRENT_PLAYER', nextPlayer);
            commit('INCREMENT_TURN');
          }
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error in placeStone:', error);
      return false;
    } finally {
      // 确保无论如何都重置处理状态
      setTimeout(() => {
        commit('SET_PROCESSING_MOVE', false);
      }, 100);
    }
  },

  async placeClassicStone({ commit, state, dispatch }, index) {
    // 先放置棋子
    commit('SET_CELL', {
      index,
      cellData: {
        state: state.currentPlayer,
        superposition: false,
        probability: 1,
        entangled: false,
        entangledWith: null,
        quantumState: null
      }
    });

    // 检查吃子和自杀
    const isValidMove = dispatch('checkCapture', index);
    
    if (!isValidMove) {
      // 如果是无效的着法（自杀），已经在checkCapture中撤销了
      return false;
    }
    
    commit('UPDATE_SCORE', { player: state.currentPlayer, points: 1 });
    
    dispatch('showNotification', {
      title: '落子',
      message: `${state.currentPlayer === 'black' ? '黑方' : '白方'}落子`,
      type: 'success'
    }, { root: true });
    
    return true;
  },

  async placeSuperpositionStone({ commit, state, dispatch }, index) {
    const cell = state.board[index];

    if (cell.superposition) {
      // 测量叠加态会坍缩成实际棋子
      await dispatch('quantum/measureCell', index, { root: true });
      // 注意：测量后应该由量子模块处理落子逻辑
      return true;
    } else if (cell.state === 'empty') {
      // 创建叠加态不需要检查吃子，因为不是实际落子
      commit('SET_CELL', {
        index,
        cellData: {
          state: 'empty',
          superposition: true,
          probability: 0.5 + Math.random() * 0.3,
          entangled: false,
          entangledWith: null,
          quantumState: state.currentPlayer,
          decoherenceTime: 5
        }
      });
      
      dispatch('showNotification', {
        title: '叠加态',
        message: `创建了一个${state.currentPlayer === 'black' ? '黑方' : '白方'}的叠加态棋子`,
        type: 'info'
      }, { root: true });
      
      return true;
    }
    
    return false;
  },

  async placeQuantumStone({ commit, state, dispatch }, index) {
    const cell = state.board[index];

    if (cell.state === 'empty') {
      commit('SET_CELL', {
        index,
        cellData: {
          state: state.currentPlayer,
          superposition: false,
          probability: 1,
          entangled: false,
          entangledWith: null,
          quantumState: null
        }
      });

      const isValidMove = dispatch('checkCapture', index);
      
      if (!isValidMove) {
        return false;
      }
      
      commit('UPDATE_SCORE', { player: state.currentPlayer, points: 1 });
      
      dispatch('showNotification', {
        title: '落子',
        message: `${state.currentPlayer === 'black' ? '黑方' : '白方'}落子`,
        type: 'success'
      }, { root: true });
      
      return true;
    }
    
    return false;
  },

  checkCapture({ commit, state, getters, dispatch }, index) {
    const adjacent = getters.getAdjacentCells(index);
    const opponent = state.currentPlayer === 'black' ? 'white' : 'black';
    let capturedCount = 0;
    const capturedGroups = [];
    const processedIndices = new Set();

    // 检查相邻的对手棋子是否被吃
    for (const adjIndex of adjacent) {
      if (state.board[adjIndex].state === opponent && !processedIndices.has(adjIndex)) {
        // 使用辅助函数
        const group = getGroupHelper(state, getters, adjIndex);
        
        // 标记这个棋块的所有棋子为已处理
        group.forEach(idx => processedIndices.add(idx));
        
        // 使用辅助函数检查是否被吃
        const isCaptured = isGroupCapturedHelper(state, getters, group);
        
        if (isCaptured) {
          capturedGroups.push(group);
        }
      }
    }

    // 检查是否形成劫
    let koPosition = null;
    if (capturedGroups.length === 1 && capturedGroups[0].length === 1) {
      // 只吃了一个子，可能是劫
      const capturedIndex = capturedGroups[0][0];
      const selfGroup = getGroupHelper(state, getters, index);
      
      // 如果自己的棋块也只有一个子，这就是劫
      if (selfGroup.length === 1) {
        const selfLiberties = new Set();
        const adjacent = getters.getAdjacentCells(index);
        for (const adjIndex of adjacent) {
          if (state.board[adjIndex].state === 'empty' || adjIndex === capturedIndex) {
            selfLiberties.add(adjIndex);
          }
        }
        
        // 如果吃子后自己只有一气（就是刚吃掉的位置），这是劫
        if (selfLiberties.size === 1 && selfLiberties.has(capturedIndex)) {
          koPosition = capturedIndex;
        }
      }
    }
    
    // 移除被吃的棋子
    for (const group of capturedGroups) {
      for (const groupIndex of group) {
        dispatch('captureStone', groupIndex);
        capturedCount++;
      }
    }
    
    // 设置劫的位置
    commit('SET_KO_POSITION', koPosition);

    // 检查自杀规则：如果下的这步棋导致自己的棋块没气，且没有吃掉对方的子，则为自杀
    if (capturedCount === 0) {
      const selfGroup = getGroupHelper(state, getters, index);
      const isSelfCaptured = isGroupCapturedHelper(state, getters, selfGroup);
      
      if (isSelfCaptured) {
        // 撤销这一步（自杀是不允许的）
        dispatch('showNotification', {
          title: '无效落子',
          message: '不能自杀！该位置会导致己方棋子没有气',
          type: 'warning'
        }, { root: true });
        
        // 撤销这一步棋
        commit('SET_CELL', {
          index,
          cellData: {
            state: 'empty',
            superposition: false,
            probability: 0,
            entangled: false,
            entangledWith: null,
            quantumState: null,
            phase: 0,
            decoherenceTime: 0
          }
        });
        
        return false;  // 返回false表示这步棋无效
      }
    }

    if (capturedCount > 0) {
      dispatch('showNotification', {
        title: '吃子',
        message: `成功吃掉对方${capturedCount}子！`,
        type: 'success'
      }, { root: true });
    }
    
    return true;  // 返回true表示这步棋有效
  },



  captureStone({ commit, state }, index) {
    const capturedColor = state.board[index].state;
    const capturingPlayer = capturedColor === 'black' ? 'white' : 'black';

    commit('SET_CELL', {
      index,
      cellData: {
        state: 'empty',
        superposition: false,
        probability: 0,
        entangled: false,
        entangledWith: null,
        quantumState: null,
        phase: 0,
        decoherenceTime: 0
      }
    });

    commit('UPDATE_SCORE', { player: capturingPlayer, points: 2 });
  },

  selectForEntanglement({ commit, state, dispatch }, index) {
    const cell = state.board[index];

    if (cell.state !== state.currentPlayer) {
      dispatch('showNotification', {
        title: '错误',
        message: '只能纠缠自己的棋子',
        type: 'warning'
      }, { root: true });
      return;
    }

    if (state.firstEntangleCell === null) {
      commit('SET_FIRST_ENTANGLE_CELL', index);
      dispatch('showNotification', {
        title: '选择第一个',
        message: '请选择第二个要纠缠的棋子',
        type: 'info'
      }, { root: true });
    } else {
      if (state.firstEntangleCell !== index) {
        dispatch('quantum/createEntanglement', {
          index1: state.firstEntangleCell,
          index2: index
        }, { root: true });
        commit('SET_ENTANGLEMENT_MODE', false);
        commit('SET_FIRST_ENTANGLE_CELL', null);
      } else {
        dispatch('showNotification', {
          title: '错误',
          message: '不能选择同一个棋子',
          type: 'warning'
        }, { root: true });
      }
    }
  },

  async endTurn({ commit, state, dispatch }) {
    try {
      // 重置Pass计数（因为有落子）
      commit('RESET_PASS_COUNT');
      
      // 清除非当前回合的劫位置
      // 劫位置只在对手的下一手有效，之后清除
      if (state.koPosition !== null) {
        // 劫位置会在下一回合结束时清除
        // 这样可以防止立即回提，但允许之后再提
      }
      
      // 切换玩家 - 这是最重要的，必须执行
      const nextPlayer = state.currentPlayer === 'black' ? 'white' : 'black';
      commit('SET_CURRENT_PLAYER', nextPlayer);
      commit('INCREMENT_TURN');
      
      // 量子操作用 try-catch 包裹，防止错误中断流程
      if (state.gameMode !== 'classic') {
        try {
          await dispatch('quantum/applyDecoherence', null, { root: true });
          // 恢复量子能量
          await dispatch('quantum/restoreEnergy', nextPlayer, { root: true });
        } catch (error) {
          console.error('Quantum operation error:', error);
          // 量子操作失败不应该影响游戏进行
        }
      }
      
      await dispatch('showNotification', {
        title: '回合切换',
        message: `轮到${nextPlayer === 'black' ? '黑方' : '白方'}`,
        type: 'info',
        duration: 1500
      }, { root: true });
      
      // 在回合结束后检查游戏状态
      setTimeout(async () => {
        await dispatch('checkGameEnd');
        
        // 如果游戏没有结束，且启用了AI，让AI下棋
        if (!state.gameOver && state.aiEnabled && state.currentPlayer === 'white') {
          dispatch('aiMove');
        }
      }, 500);
    } catch (error) {
      console.error('Error in endTurn:', error);
      // 即使出错也要尝试切换玩家
      const nextPlayer = state.currentPlayer === 'black' ? 'white' : 'black';
      commit('SET_CURRENT_PLAYER', nextPlayer);
      commit('INCREMENT_TURN');
    }
  },
  
  async pass({ commit, state, getters, dispatch }) {
    commit('INCREMENT_PASS_COUNT');
    
    dispatch('showNotification', {
      title: '弃权',
      message: `${state.currentPlayer === 'black' ? '黑方' : '白方'}选择弃权`,
      type: 'info'
    }, { root: true });
    
    // 如果双方连续弃权，游戏结束
    if (state.passCount >= 2) {
      await dispatch('endGame');
    } else {
      // 切换到下一个玩家
      const nextPlayer = state.currentPlayer === 'black' ? 'white' : 'black';
      commit('SET_CURRENT_PLAYER', nextPlayer);
      commit('INCREMENT_TURN');
      
      // 延迟检查游戏状态
      setTimeout(async () => {
        await dispatch('checkGameEnd');
        
        // 如果游戏没有结束，且启用了AI，让AI下棋
        if (!state.gameOver && state.aiEnabled && state.currentPlayer === 'white') {
          dispatch('aiMove');
        }
      }, 500);
    }
  },
  
  async endGame({ commit, state, getters, dispatch }) {
    // 计算最终得分
    const blackStones = getters.countStones('black');
    const whiteStones = getters.countStones('white');
    const blackTerritory = getters.getTerritoryCount('black');
    const whiteTerritory = getters.getTerritoryCount('white');
    
    const blackTotal = state.scores.black + blackStones + blackTerritory;
    const whiteTotal = state.scores.white + whiteStones + whiteTerritory + 7.5; // 白棋贴7.5目
    
    let winner = null;
    let winnerName = '';
    let message = '';
    
    if (blackTotal > whiteTotal) {
      winner = 'black';
      winnerName = '黑方';
      message = `黑方 ${blackTotal} 目 vs 白方 ${whiteTotal} 目`;
    } else if (whiteTotal > blackTotal) {
      winner = 'white';
      winnerName = '白方';
      message = `白方 ${whiteTotal} 目 vs 黑方 ${blackTotal} 目`;
    } else {
      winnerName = '平局';
      message = `双方都是 ${blackTotal} 目`;
    }
    
    commit('SET_GAME_OVER', { winner });
    
    // 显示游戏结束通知
    await dispatch('showNotification', {
      title: '游戏结束',
      message: `${winnerName}获胜！${message}`,
      type: 'success',
      duration: 10000 // 显示10秒
    }, { root: true });
    
    // 显示详细得分
    setTimeout(() => {
      dispatch('showNotification', {
        title: '得分详情',
        message: `黑方: ${state.scores.black}(吃子) + ${blackStones}(棋子) + ${blackTerritory}(领地) = ${blackTotal}\n` +
                `白方: ${state.scores.white}(吃子) + ${whiteStones}(棋子) + ${whiteTerritory}(领地) + 7.5(贴目) = ${whiteTotal}`,
        type: 'info',
        duration: 15000
      }, { root: true });
    }, 2000);
  },
  
  async checkGameEnd({ state, getters, dispatch }) {
    // 如果游戏已经结束，不再检查
    if (state.gameOver) {
      return;
    }
    
    // 检查当前玩家是否还有合法的落子位置
    const currentPlayerHasMove = getters.hasLegalMoves(state.currentPlayer);
    const opponentPlayer = state.currentPlayer === 'black' ? 'white' : 'black';
    const opponentHasMove = getters.hasLegalMoves(opponentPlayer);
    
    // 如果双方都没有合法落子位置，游戏结束
    if (!currentPlayerHasMove && !opponentHasMove) {
      await dispatch('endGame');
    } else if (!currentPlayerHasMove) {
      // 如果只有当前玩家没有合法落子，提示并自动弃权
      dispatch('showNotification', {
        title: '无合法落子',
        message: `${state.currentPlayer === 'black' ? '黑方' : '白方'}没有合法的落子位置，自动弃权`,
        type: 'info',
        duration: 2000
      }, { root: true });
      
      // 自动执行弃权
      setTimeout(() => {
        dispatch('pass');
      }, 1000);
    }
  },

  aiMove({ state, dispatch }) {
    // AI 逻辑会在 aiEngine.js 中实现
    dispatch('quantum/aiQuantumMove', null, { root: true });
  },

  resetGame({ commit, dispatch }) {
    commit('INIT_BOARD');
    commit('RESET_GAME');
    dispatch('quantum/initQuantumState', null, { root: true });
    
    dispatch('showNotification', {
      title: '重置',
      message: '游戏已重置',
      type: 'info'
    }, { root: true });
  },

  saveGame({ state, dispatch }) {
    const gameState = {
      board: state.board,
      currentPlayer: state.currentPlayer,
      turn: state.turn,
      gameMode: state.gameMode,
      scores: state.scores,
      quantumState: state.quantum,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('quantumGoSave', JSON.stringify(gameState));
    
    dispatch('showNotification', {
      title: '保存',
      message: '游戏已保存',
      type: 'success'
    }, { root: true });
  },

  loadGame({ commit, dispatch }) {
    const saved = localStorage.getItem('quantumGoSave');
    if (saved) {
      try {
        const gameState = JSON.parse(saved);
        
        // 恢复游戏状态
        gameState.board.forEach((cell, index) => {
          commit('SET_CELL', { index, cellData: cell });
        });
        
        commit('SET_CURRENT_PLAYER', gameState.currentPlayer);
        commit('SET_GAME_MODE', gameState.gameMode);
        
        state.turn = gameState.turn;
        state.scores = gameState.scores;
        
        dispatch('showNotification', {
          title: '加载',
          message: '游戏已加载',
          type: 'success'
        }, { root: true });
      } catch (error) {
        dispatch('showNotification', {
          title: '错误',
          message: '加载失败，存档可能已损坏',
          type: 'error'
        }, { root: true });
      }
    } else {
      dispatch('showNotification', {
        title: '错误',
        message: '没有找到保存的游戏',
        type: 'warning'
      }, { root: true });
    }
  }
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};