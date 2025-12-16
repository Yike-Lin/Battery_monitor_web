<template>
  <el-container class="layout-wrapper dark-theme">
    <el-aside width="230px" class="layout-sidebar">

      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        background-color="transparent"
        text-color="#a6a6a6"
        active-text-color="#ffffff"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><Monitor /></el-icon>
          <span>运行大屏</span>
        </el-menu-item>

        <el-menu-item index="/battery">
          <el-icon><Files /></el-icon> <span>电池管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item><span class="breadcrumb-text">首页</span></el-breadcrumb-item>
            <el-breadcrumb-item><span class="breadcrumb-text active">电池管理</span></el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <el-icon class="action-icon"><Search /></el-icon>
          <el-icon class="action-icon"><FullScreen /></el-icon>
          <el-icon class="action-icon"><Bell /></el-icon>
        </div>
      </el-header>

      <div class="tags-view">
        <span class="tag-item">首页</span>
        <span class="tag-item active">电池管理</span>
      </div>

      <el-main class="layout-main">
        <div class="empty-placeholder">
          <router-view /> 
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Monitor, Files, Search, FullScreen, Bell } from '@element-plus/icons-vue'

// 模拟当前选中的菜单项，为了还原图片效果，默认选中“电池管理”
const activeMenu = ref('/battery')
</script>

<style scoped>
/* --- 全局深色变量 --- */
.layout-wrapper {
  height: 100vh;
  width: 100vw;
  background-color: #0d0d0d; /* 整体极黑背景 */
  color: #cfd3dc;
  overflow: hidden;
}

/* --- 1. 侧边栏样式 --- */
.layout-sidebar {
  background-color: #141414; /* 侧边栏背景 */
  border-right: 1px solid #1f1f1f;
  display: flex;
  flex-direction: column;
}

/* Logo */
.sidebar-logo {
  height: 48px;
  display: flex;
  align-items: center;
  padding-left: 20px;
  gap: 10px;
}
.logo-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; }
.drop-shape {
  width: 20px; height: 20px;
  background: linear-gradient(135deg, #2d8cf0 0%, #74b9ff 100%);
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
}
.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

/* 菜单项 */
.sidebar-menu {
  border-right: none;
  padding: 10px;
  margin-top: 5px;
}

:deep(.el-menu-item) {
  height: 44px;
  line-height: 44px;
  margin-bottom: 4px;
  border-radius: 6px;
  color: #a6a6a6;
}

:deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.05) !important;
  color: #fff;
}

/* 【关键复刻】选中项样式：墨绿色背景 */
:deep(.el-menu-item.is-active) {
  background-color: #3a5f50 !important; /* 复刻图片的绿色 */
  color: #ffffff !important;
  font-weight: 500;
}

/* --- 2. Header 样式 --- */
.layout-header {
  height: 48px;
  background-color: #141414;
  border-bottom: 1px solid #1f1f1f;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.breadcrumb-text { color: #666; font-size: 14px; }
.breadcrumb-text.active { color: #fff; }

.header-right { display: flex; align-items: center; gap: 15px; }
.action-icon { font-size: 18px; cursor: pointer; color: #a6a6a6; }
.action-icon:hover { color: #fff; }
.user-info { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.username { font-size: 14px; color: #fff; }

/* --- 3. Tags View 样式 --- */
.tags-view {
  height: 34px;
  background-color: #141414; /* 深色背景 */
  border-bottom: 1px solid #1f1f1f;
  display: flex;
  align-items: center;
  padding: 0 10px;
  gap: 6px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  padding: 0 10px;
  font-size: 12px;
  color: #a6a6a6;
  border: 1px solid #333;
  border-radius: 2px;
  cursor: pointer;
  background: #1d1e1f;
}

/* 选中标签：图片中是亮蓝色 */
.tag-item.active {
  background-color: #409eff; 
  color: #fff;
  border-color: #409eff;
}

/* --- 4. Main 区域 --- */
.layout-main {
  background-color: #0d0d0d; /* 极黑内容背景 */
  padding: 20px;
}
.empty-placeholder {
  width: 100%;
  height: 100%;
  /* 可以在这里放空的 router-view */
}
</style>