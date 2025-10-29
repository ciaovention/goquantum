<template>
  <div class="score-board">
    <h4>📊 统计信息</h4>
    <div class="score-item">
      <span>⚫ 黑方棋子:</span>
      <strong>{{ countStones('black') }}</strong>
    </div>
    <div class="score-item">
      <span>⚪ 白方棋子:</span>
      <strong>{{ countStones('white') }}</strong>
    </div>
    <div class="score-item">
      <span>🌀 叠加态:</span>
      <strong>{{ countSuperpositions }}</strong>
    </div>
    <div class="score-item">
      <span>🔗 纠缠对:</span>
      <strong>{{ countEntanglements }}</strong>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
export default {
  name: 'ScoreBoard',
  computed: {
    ...mapGetters('game', [
      'countStones',
      'countSuperpositions',
      'countEntanglements'
    ])
  }
};
</script>

<style scoped>
.score-board {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 10px;
  margin-top: 15px;
}
.score-board h4 {
  margin-bottom: 10px;
  color: #667eea;
}
.score-item {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  margin: 5px 0;
  background: white;
  border-radius: 5px;
}
</style>