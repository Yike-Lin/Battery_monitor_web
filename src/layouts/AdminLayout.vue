<template>
  <div class="admin-shell">
    <!-- 左侧侧边栏 -->
    <AdminSidebar />

    <!-- 右侧主体 -->
    <div class="admin-main-column">
      <header class="admin-header">
        <div class="header-left">
          <span class="header-title">{{ currentTitle }}</span>
          <span class="header-sub">{{ route.path }}</span>
        </div>

        <div class="header-right">
          <span class="header-chip status">运行中</span>
          <span class="header-chip env">生产环境</span>
          <span class="header-user">运维管理员</span>
        </div>
      </header>

      <main class="admin-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AdminSidebar from '../components/admin/AdminSidebar.vue'

const route = useRoute()
const currentTitle = computed(() => (route.meta.title as string) || '后台管理')
</script>

<style scoped>
.admin-shell {
  height: 100%;
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  padding: 4px 4px 10px 4px;
  box-sizing: border-box;
}

/* 右侧整体 */
.admin-main-column {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 22px;
  background: radial-gradient(
    circle at 100% 0,
    rgba(72, 84, 118, 0.35),
    rgba(9, 10, 16, 0.96)
  );
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 18px 45px rgba(0, 0, 0, 0.85),
    0 0 0 1px rgba(0, 0, 0, 0.7);
  overflow: hidden;
}

/* 顶部条 */
.admin-header {
  flex-shrink: 0;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at 0 0, rgba(111, 185, 255, 0.12), transparent 55%),
    rgba(7, 8, 15, 0.98);
  color: #f5f5f7;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.header-title {
  font-size: 15px;
  font-weight: 600;
}

.header-sub {
  font-size: 11px;
  color: #8e8e93;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.header-chip {
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.header-chip.status {
  background: rgba(48, 209, 88, 0.12);
  color: #30d158;
  border-color: rgba(48, 209, 88, 0.4);
}

.header-chip.env {
  background: rgba(10, 132, 255, 0.12);
  color: #0a84ff;
  border-color: rgba(10, 132, 255, 0.5);
}

.header-user {
  color: #c7c7cc;
}

/* 内容区域 */
.admin-main {
  flex: 1;
  min-height: 0;
  padding: 14px 16px 16px;
  box-sizing: border-box;
  overflow: auto;
}
</style>
