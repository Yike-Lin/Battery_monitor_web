<template>
    <header class="glass-header">
      <div class="header-left">
        <span class="time-display">{{ nowTime }}</span>
      </div>

      <div class="header-center">
        <span class="logo-icon">🔋</span>
        <span class="app-title">
          <el-link class="app-title" href="/admin/battery-ledger" underline={false} type="success">
            Battery Monitor Web
          </el-link>

        </span>
        <span class="logo-icon">🪫</span>
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
    justify-content: flex-start;
    padding: 0 24px;
    background: rgba(20, 20, 20, 0.7);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    z-index: 10;
    width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
    position: relative;
  }

  .header-center {
    display: flex;
    align-items: center;
    gap: 8px;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  .logo-icon {
    font-size: 30px;
    color: #fff;
  }

  .app-title {
    color: #fff;
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

  </style>
