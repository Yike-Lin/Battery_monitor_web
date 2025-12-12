<template>
  <aside
    class="admin-sidebar"
    :class="{ expanded: isExpanded }"
    @mouseenter="isExpanded = true"
    @mouseleave="isExpanded = false"
  >
    <!-- 顶部 Logo -->
    <div class="sidebar-header">
      <div class="sidebar-logo-dot"></div>

      <!-- 文本始终存在，只做淡入淡出+位移动画 -->
      <div class="sidebar-logo-text smooth-text">
        <div class="logo-title">NF Battery</div>
        <div class="logo-subtitle">运营监控 · 后台</div>
      </div>
    </div>

    <!-- 导航 -->
    <nav class="sidebar-nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: route.path.startsWith(item.activeMatch) }"
      >
        <span class="nav-icon">
          {{ item.icon }}
        </span>
        <span class="nav-label smooth-text">
          {{ item.label }}
        </span>
      </RouterLink>
    </nav>

    <!-- 底部：设置 + 用户 -->
    <div class="sidebar-footer">
      <button class="nav-item ghost" type="button">
        <span class="nav-icon">⚙️</span>
        <span class="nav-label smooth-text">系统设置</span>
      </button>

      <div class="user-card">
        <div class="user-avatar">运</div>
        <div class="user-info smooth-text">
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

const route = useRoute()
const isExpanded = ref(false)

const navItems = [
  { label: '运行大屏', path: '/dashboard', activeMatch: '/dashboard', icon: '🖥️' },
  { label: '电池管理', path: '/admin/battery', activeMatch: '/admin/battery', icon: '🔋' },
  { label: '设备管理', path: '/admin/device', activeMatch: '/admin/device', icon: '📡' },
  { label: '用户管理', path: '/admin/user', activeMatch: '/admin/user', icon: '👤' },
]
</script>

<style scoped>
.admin-sidebar {
  position: relative;
  height: 100%;
  width: 72px;
  padding: 16px 12px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  /* justify-content: space-between; */
  justify-content: flex-start;

  background: radial-gradient(circle at 0 0, #141824 0, #050509 55%, #020308 100%);
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.9);

  transition:
    width 0.28s cubic-bezier(0.25, 0.8, 0.25, 1),
    box-shadow 0.3s ease;
  overflow: hidden;
}

.admin-sidebar.expanded {
  width: 230px;
  box-shadow:
    0 24px 70px rgba(0, 0, 0, 0.95),
    0 0 0 1px rgba(116, 242, 206, 0.2);
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sidebar-logo-dot {
  width: 26px;
  height: 26px;
  border-radius: 12px;
  background: radial-gradient(circle at 20% 20%, #74f2ce, #1b2f55);
  box-shadow: 0 0 18px rgba(116, 242, 206, 0.7);
}

.sidebar-logo-text .logo-title {
  font-size: 14px;
  font-weight: 600;
  color: #f5f5f7;
}

.sidebar-logo-text .logo-subtitle {
  font-size: 11px;
  color: #8e8e93;
}

/* 文本的丝滑动画 */
.smooth-text {
  opacity: 0;
  transform: translateX(-6px);
  transition:
    opacity 0.28s ease,
    transform 0.28s ease;
  white-space: nowrap;
  pointer-events: none;
}

.admin-sidebar.expanded .smooth-text {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

/* 导航 */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 18px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 999px;

  color: #c7c7cc;
  text-decoration: none;
  font-size: 13px;

  border: 1px solid transparent;
  background: transparent;

  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.15s ease,
    color 0.15s ease;
}

.nav-icon {
  width: 22px;
  text-align: center;
  flex-shrink: 0;
}

.nav-item:hover {
  background: rgba(116, 242, 206, 0.18);
  border-color: rgba(116, 242, 206, 0.45);
  color: #ffffff;
  transform: translateY(-1px);
}

.nav-item.active {
  background: rgba(116, 242, 206, 0.32);
  border-color: rgba(116, 242, 206, 0.7);
  color: #ffffff;
  box-shadow: 0 0 25px rgba(16, 185, 129, 0.5);
}

/* 底部 */
.sidebar-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 4px;
  margin-top: auto;
}

.nav-item.ghost {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
}

.user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.1);
}

.user-avatar {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  background: linear-gradient(135deg, #5ac8fa, #0a84ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #ffffff;
  font-weight: 600;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 13px;
  color: #f5f5f7;
}

.user-role {
  font-size: 11px;
  color: #a1a1a6;
}
</style>
