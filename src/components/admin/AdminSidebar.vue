<template>
  <aside
    class="admin-sidebar"
    :class="{ expanded: !isCollapse }"
  >
    <div class="sidebar-header" :class="{ 'collapsed-header': isCollapse }">

      <div class="logo-group" v-show="!isCollapse">
        <div class="sidebar-logo-dot"></div>
        <div class="sidebar-logo-text">
          <div class="logo-title">Battery Monitor</div>
          <div class="logo-subtitle">运营监控 · 后台</div>
        </div>
      </div>

      <div class="toggle-btn" @click="toggleCollapse">
        <el-icon size="20" color="#fff">
          <Expand v-if="isCollapse" />
          <Fold v-else />
        </el-icon>
      </div>
    </div>

    <el-menu
      :default-active="route.path"
      class="el-menu-vertical-demo"
      :collapse="isCollapse"
      router
      background-color="transparent"
      text-color="#c7c7cc"
      active-text-color="#74f2ce"
      :collapse-transition="false"
      style="border-right: none; margin-top: 10px; flex: 1;"
    >
      <el-menu-item
        v-for="item in navItems"
        :key="item.path"
        :index="item.path"
      >
        <el-icon>
          <span style="font-size: 18px; font-style: normal;">{{ item.icon }}</span>
        </el-icon>
        <template #title>{{ item.label }}</template>
      </el-menu-item>
    </el-menu>

    <div class="sidebar-footer">
      <button class="nav-item ghost" type="button">
        <span class="nav-icon">⚙️</span>
        <span class="nav-label" v-show="!isCollapse">系统设置</span>
      </button>

      <div class="user-card" :class="{ 'collapsed': isCollapse }">
        <div class="user-avatar">运</div>
        <div class="user-info" v-show="!isCollapse">
          <div class="user-name">运维管理员</div>
          <div class="user-role">Maintenance</div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { Fold, Expand } from '@element-plus/icons-vue'

const route = useRoute()
// 默认是否折叠：true (收起)
const isCollapse = ref(false)

// 点击切换函数
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const navItems = [
  { label: '运行大屏', path: '/dashboard', icon: '🖥️' },
  { label: '电池管理', path: '/admin/battery', icon: '🔋' },
  { label: '设备管理', path: '/admin/device', icon: '📡' },
  { label: '用户管理', path: '/admin/user', icon: '👤' },
]
</script>

<style scoped>
/* --- 容器 --- */
.admin-sidebar {
  height: 100%;
  width: auto;
  display: flex;
  flex-direction: column;
  padding: 26px 0;
  box-sizing: border-box;

  /* 背景样式 */
  background: rgba(30, 30, 30, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.9);

  /* 宽度过渡动画 */
  transition: width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
}

/* 展开时的宽度 */
.admin-sidebar.expanded {
  width: 210px;
}

/* --- Header 布局调整 --- */
.sidebar-header {
  display: flex;
  align-items: center;
  /* 展开时：两端对齐 (Logo在左，按钮在右) */
  justify-content: space-between;
  padding: 0 18px;
  height: 50px;
  flex-shrink: 0;
  margin-bottom: 10px;
}

/* 收起时的 Header 样式 */
.collapsed-header {
  /* 收起时：居中显示 (只显示按钮) */
  justify-content: center;
  padding: 0;
}

.logo-group {
  display: flex;
  align-items: center;
  gap: 10px;
  /* 防止文字换行 */
  white-space: nowrap;
}

.sidebar-logo-dot {
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background: radial-gradient(circle at 20% 20%, #74f2ce, #1b2f55);
}

.logo-title { font-size: 14px; font-weight: 600; color: #fff; }
.logo-subtitle { font-size: 11px; color: #888; }

/* 切换按钮样式 */
.toggle-btn {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: background 0.2s;
}
.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* --- 菜单样式穿透 --- */
:deep(.el-menu) {
  background-color: transparent !important;
  border-right: none !important;
}
:deep(.el-menu-item) {
  background-color: transparent !important;
  margin: 4px 10px;
  border-radius: 8px;
  height: 44px;
  line-height: 44px;
}
:deep(.el-menu-item:hover) {
  background-color: rgba(116, 242, 206, 0.15) !important;
  color: #fff !important;
}
:deep(.el-menu-item.is-active) {
  background-color: rgba(116, 242, 206, 0.3) !important;
  color: #fff !important;
  box-shadow: 0 0 15px rgba(116, 242, 206, 0.2);
  font-weight: 600;
}
:deep(.el-icon) {
  margin-right: 0 !important;
  text-align: center;
  width: 24px;
}

/* --- 底部 Footer --- */
.sidebar-footer {
  margin-top: auto;
  padding: 0 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.nav-item.ghost {
  display: flex;
  align-items: center;
  width: 100%;
  height: 40px;
  padding: 0 10px;
  border: none;
  background: transparent;
  color: #c7c7cc;
  cursor: pointer;
  border-radius: 8px;
  box-sizing: border-box;
  white-space: nowrap; /* 防止文字溢出 */
}
.nav-item.ghost:hover {
  background: rgba(255,255,255,0.1);
}
.nav-icon { width: 24px; text-align: center; flex-shrink: 0; }

.user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: rgba(255,255,255,0.1);
  border-radius: 20px;
  overflow: hidden;
  height: 42px; /* 固定高度，防止折叠时跳动 */
  box-sizing: border-box;
}
.user-card.collapsed {
  justify-content: center;
  padding: 0;
  background: transparent;
}
.user-avatar {
  width: 26px;
  height: 26px;
  background: linear-gradient(135deg, #5ac8fa, #0a84ff);
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 12px;
}
.user-info {
  white-space: nowrap;
}
.user-name { font-size: 13px; color: #fff; }
.user-role { font-size: 11px; color: #888; }
</style>
