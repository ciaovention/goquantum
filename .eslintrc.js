// /home/joy/Documents/Projects/web/games-test/quantumgo/quantum-go/.eslintrc.js
module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/essential',
    'eslint:recommended',
  ],
  parserOptions: {
    parser: 'babel-eslint',
  },
  rules: {
    // 关闭组件名必须多个单词的规则
    'vue/multi-word-component-names': 'off',
    // 关闭 console 警告
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    // 关闭 debugger 警告
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
  },
};