<template>
  <el-container class="layout-wrapper dark-theme">
    <el-aside width="230px" class="layout-sidebar">
      <el-menu
        :default-active="activeMenu"
        :default-openeds="['/admin/assets']"
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

        <el-sub-menu index="/admin/assets">
          <template #title>
            <el-icon><Files /></el-icon>
            <span>电池管理</span>
          </template>

          <el-menu-item index="/admin/battery-ledger">
            <span>电池台账列表</span>
          </el-menu-item>

          <el-menu-item index="/admin/soh-label">
            <span>电池SOH标注</span>
          </el-menu-item>
          
          
          <el-menu-item :index="`/admin/cell-detail/${demoPackId}`">
            <span>单体电池详情</span>
          </el-menu-item>

        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item
              v-for="(item, idx) in breadcrumbItems"
              :key="`${item.label}-${idx}`"
              :to="item.to"
            >
              <span class="breadcrumb-text" :class="{ active: idx === breadcrumbItems.length - 1 }">
                {{ item.label }}
              </span>
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <el-icon class="action-icon"><Search /></el-icon>
          <el-icon class="action-icon"><FullScreen /></el-icon>
          <el-icon class="action-icon"><Bell /></el-icon>
        </div>
      </el-header>

      <el-main class="layout-main">
        <div class="admin-page-host">
          <router-view v-slot="{ Component }">
            <Transition name="admin-page" mode="out-in">
              <component :is="Component" :key="route.fullPath" />
            </Transition>
          </router-view>
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Monitor,Files, Search, FullScreen, Bell } from '@element-plus/icons-vue'

const route = useRoute()

// 当前路由自动高亮
const activeMenu = computed(() => route.path)

type Crumb = { label: string; to?: string }

// 动态面包屑：首页 / 分组 / 当前页
const breadcrumbItems = computed<Crumb[]>(() => {
  const items: Crumb[] = [{ label: '首页', to: '/dashboard' }]

  const group = (route.meta?.group as string) || ''
  if (group) {
    const groupLabel = group === '资产管理' ? '电池管理' : group
    items.push({ label: groupLabel, to: '/admin/battery-ledger' })
  }

  const title = (route.meta?.title as string) || '页面'
  items.push({ label: title })

  return items
})

const demoPackId = 'P0001'
</script>

<style scoped>
.layout-wrapper {
  height: 100%;
  width: 100%;
  background-color: #0d0d0d;
  color: #cfd3dc;
  overflow: hidden;
  box-sizing: border-box;
}

/* sidebar */
.layout-sidebar {
  background-color: #141414;
  border-right: 1px solid #1f1f1f;
  display: flex;
  flex-direction: column;
}

.sidebar-logo {
  height: 48px;
  display: flex;
  align-items: center;
  padding-left: 20px;
  gap: 10px;
  border-bottom: 1px solid #1f1f1f;
}
.logo-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; }
.drop-shape {
  width: 20px; height: 20px;
  background: linear-gradient(135deg, #2d8cf0 0%, #74b9ff 100%);
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
}
.logo-text { font-size: 16px; font-weight: 700; color: #fff; }

.sidebar-menu { border-right: none; padding: 10px; margin-top: 5px; }

:deep(.el-sub-menu__title) {
  border-radius: 6px;
  color: #a6a6a6;
}
:deep(.el-sub-menu__title:hover) {
  background-color: rgba(255, 255, 255, 0.05) !important;
  color: #fff;
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
:deep(.el-menu-item.is-active) {
  background-color: #3a5f50 !important;
  color: #ffffff !important;
  font-weight: 500;
}

/* header */
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

.layout-main {
  background-color: #0d0d0d;
  padding: 20px;
  overflow: hidden;
  box-sizing: border-box;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 子页面切换动画：仅短时 opacity + translate，out-in 避免两页同屏叠化加重绘制 */
.admin-page-host {
  flex: 1;
  min-height: 0;
  width: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.admin-page-enter-active,
.admin-page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.admin-page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.admin-page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .admin-page-enter-active,
  .admin-page-leave-active {
    transition-duration: 0.01ms;
  }
  .admin-page-enter-from,
  .admin-page-leave-to {
    transform: none;
  }
}
</style>