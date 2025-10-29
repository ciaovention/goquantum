<template>
  <transition name="fade">
    <div v-if="notification" class="notification" :class="notification.type">
      <h4>{{ notification.title }}</h4>
      <p>{{ notification.message }}</p>
    </div>
  </transition>
</template>

<script>
import { mapState } from 'vuex';
export default {
  name: 'Notification',
  computed: {
    ...mapState(['notification'])
  }
};
</script>

<style scoped>
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.3);
  max-width: 300px;
  animation: fadein 0.3s;
  z-index: 1000;
}

.notification.success { border-left: 5px solid #4caf50; }
.notification.info { border-left: 5px solid #2196f3; }
.notification.warning { border-left: 5px solid #ff9800; }
@keyframes fadein { from { opacity: 0; right: -50px; } to { opacity: 1; right: 20px; } }
</style>