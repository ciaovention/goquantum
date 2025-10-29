import Vue from 'vue';
import App from './App.vue';
import store from './store';

Vue.config.productionTip = false;

// 全局混入 - 防止代码被轻易复制
Vue.mixin({
  methods: {
    $_preventCopy() {
      if (process.env.NODE_ENV === 'production') {
        // 禁用右键菜单
        document.addEventListener('contextmenu', e => e.preventDefault());
        
        // 禁用选择
        document.addEventListener('selectstart', e => {
          if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
          }
        });
        
        // 禁用复制
        document.addEventListener('copy', e => {
          if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
          }
        });
        
        // 禁用F12
        document.addEventListener('keydown', e => {
          if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
            e.preventDefault();
          }
        });
      }
    }
  },
  mounted() {
    this.$_preventCopy();
  }
});

// 全局错误处理
Vue.config.errorHandler = function (err, vm, info) {
  console.error('Vue Error:', err, info);
  if (process.env.NODE_ENV === 'production') {
    // 生产环境可以发送错误到日志服务器
  }
};

new Vue({
  store,
  render: h => h(App)
}).$mount('#app');