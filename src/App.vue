<template>
  <div class="screen-root">
    <AppHeader :now-time="nowTime" />

    <main class="mac-content">
      <!-- 所有页面都通过 router 渲染 -->
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import { useNowTime } from './composables/useNowTime'

const nowTime = useNowTime()
</script>

<style>
/* 全局重置：这里先这样放吧，之后再调整到全局 */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: #000;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
</style>

<style scoped>
.screen-root {
  width: 100vw;
  height: 100vh;
  background: radial-gradient(circle at 50% 0%, #1c1c1e 0%, #000000 70%);
  display: flex;
  flex-direction: column;
  color: #f5f5f7;
}

.mac-content {
  flex: 1;
  padding: 20px;
  overflow: hidden;
}
</style>
