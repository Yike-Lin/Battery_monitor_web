<template>
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
  </template>
  
  <script setup lang="ts">
  defineProps<{
    nowTime: string
  }>()
  </script>
  
  <style scoped>
  .glass-header {
    height: 70px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    background: rgba(20, 20, 20, 0.7);
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
    font-variant-numeric: tabular-nums;
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
  </style>