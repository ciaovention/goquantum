<template>
  <div class="tutorial">
    <h3>🎓 游戏说明</h3>
    <ul>
      <li><strong>经典模式:</strong> 传统围棋规则</li>
      <li><strong>叠加态:</strong> 棋子可以同时存在于多个位置，测量后坍缩</li>
      <li><strong>纠缠:</strong> 两个棋子状态相互关联，一个被测量会影响另一个</li>
      <li><strong>测量:</strong> 使叠加态坍缩为确定状态</li>
      <li><strong>Hadamard门(H):</strong> 创建叠加态</li>
      <li><strong>CNOT门:</strong> 创建两个棋子的纠缠态</li>
      <li><strong>Pauli-X/Z门:</strong> 翻转棋子颜色/相位</li>
      <li><strong>量子隧穿:</strong> 棋子有概率穿越棋盘</li>
      <li><strong>量子传态:</strong> 利用纠缠进行传输</li>
      <li><strong>贝尔态测量:</strong> 测量纠缠对，结果表现出量子关联性</li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'Tutorial'
};
</script>

<style scoped>
.tutorial {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  margin-top: 20px;
}
.tutorial h3 {
  color: #667eea;
  margin-bottom: 15px;
}
.tutorial ul {
  list-style: none;
  padding: 0;
}
.tutorial li {
  padding: 10px;
  margin: 8px 0;
  background: white;
  border-radius: 5px;
  border-left: 4px solid #667eea;
  font-size: 0.95em;
}
.tutorial strong {
  color: #764ba2;
}
</style>