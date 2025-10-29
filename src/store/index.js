import Vue from 'vue';
import Vuex from 'vuex';
import game from './modules/game';
import quantum from './modules/quantum';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    game,
    quantum
  },
  state: {
    notification: null
  },
  mutations: {
    SET_NOTIFICATION(state, notification) {
      state.notification = notification;
    }
  },
  actions: {
    showNotification({ commit }, { title, message, type = 'info', duration = 3000 }) {
      commit('SET_NOTIFICATION', { title, message, type });
      
      setTimeout(() => {
        commit('SET_NOTIFICATION', null);
      }, duration);
    }
  },
  strict: process.env.NODE_ENV !== 'production'
});