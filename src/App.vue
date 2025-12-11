<template>
  <div class="screen-root">
    <header class="glass-header">

      <div class="header-left">
        <span class="time-display">{{ nowTime }}</span>
      </div>


      <div class="header-center">
        <span class="logo-icon">🔋🪫</span>
        <span class="app-title">电池运营监控系统</span>
      </div>


      <div class="header-right">
        <div class="status-pill">
          <span class="pill-dot ok"></span>
          <span>System Normal</span>
        </div>

        <div class="user-avatar">Root</div>
      </div>
    </header>

    <main class="mac-content">
      <Dashboard />
    </main>
  </div>
</template>



<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Dashboard from './views/Dashboard.vue'

const nowTime = ref('')

const updateTime = () => {
  const d = new Date()
  // 简单的格式化，形如 "Oct 24 10:30 AM"
  const options: Intl.DateTimeFormatOptions = {
    month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false
  }
  nowTime.value = d.toLocaleString('en-US', options)
}

onMounted(() => {
  updateTime()
  setInterval(updateTime, 1000)
})
</script>

<style>
/* 全局重置 */
body, html {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: #000; /* 全局黑底 */
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
</style>

<style scoped>
.screen-root {
  width: 100vw;
  height: 100vh;
  /* 背景：深空黑 + 极光隐约渐变 */
  background: radial-gradient(circle at 50% 0%, #1c1c1e 0%, #000000 70%);
  display: flex;
  flex-direction: column;
  color: #f5f5f7;
}

/* 顶部栏 - 极简磨砂 */
.glass-header {
  height: 70px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: rgba(20, 20, 20, 0.7); /* 低透明度黑 */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 10;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 8px;
}
.logo-icon {
  font-size: 30px;
  color: #fff;
}
.app-title {
  font-size: 30px;
  font-weight: 600;
  letter-spacing: 2px;
}

.header-left {
  font-size: 20px;
  font-weight: 500;
  color: #86868b;
  font-variant-numeric: tabular-nums; /* 数字等宽，避免跳动 */
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-pill {
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.pill-dot.ok {
  width: 10px;
  height: 10px;
  background: #30d158;
  border-radius: 50%;
  box-shadow: 0 0 5px #30d158;
}

.user-avatar {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #0a84ff, #5e5ce6);
  border-radius: 50%;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

/* 主区域 - 留出边距 */
.mac-content {
  flex: 1;
  padding: 20px;
  overflow: hidden;
}
</style>