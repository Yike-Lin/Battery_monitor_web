<template>
  <aside class="admin-sidebar" :class="{ expanded: !isCollapse }">
    <div class="toggle-header" @click="toggleCollapse">
      <el-icon size="20" color="#666">
        <Expand v-if="isCollapse" />
        <Fold v-else />
      </el-icon>
    </div>

    <el-menu
      :default-active="route.path"
      class="el-menu-vertical-demo"
      :collapse="isCollapse"
      router
      background-color="transparent"
      text-color="#ffffff"
      active-text-color="#ffffff"
      :collapse-transition="false"
    >
      <el-menu-item
        v-for="item in navItems"
        :key="item.path"
        :index="item.path"
      >
        <el-icon>
          <span style="font-size: 18px;">{{ item.icon }}</span>
        </el-icon>
        <template #title>
          <span class="menu-text">{{ item.label }}</span>
        </template>
      </el-menu-item>
    </el-menu>
    

  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { Fold, Expand } from '@element-plus/icons-vue'

const route = useRoute()
// 默认是否折叠
const isCollapse = ref(false)

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const navItems = [
  { label: '运行大屏', path: '/dashboard', icon: '🖥️' },
  { label: '电池管理', path: '/admin/battery', icon: '🔋' }, // 图片中选中的项
  { label: '设备管理', path: '/admin/device', icon: '📡' },
  { label: '用户管理', path: '/admin/user', icon: '👤' },
]
</script>

<style scoped>
/* --- 容器：极简深色风格 --- */
.admin-sidebar {
  height: 100%;
  /* 默认展开宽度，稍微宽一点以容纳文字 */
  width: 230px; 
  display: flex;
  flex-direction: column;
  padding: 10px 0;
  box-sizing: border-box;

  /* 核心背景色：图片中的深黑色 */
  background-color: #141414; 
  /* 去掉边框，保持沉浸感 */
  border-right: 1px solid #222; 

  /* 宽度过渡动画 */
  transition: width 0.3s ease;
  overflow: hidden;
}

/* 折叠时的宽度 */
.admin-sidebar:not(.expanded) {
  width: 64px;
}

/* --- 顶部折叠按钮区域 --- */
.toggle-header {
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-bottom: 5px;
}
.toggle-header:hover .el-icon {
  color: #fff;
}

/* --- 菜单样式重写 --- */
:deep(.el-menu) {
  border-right: none !important;
  width: 100%;
  padding: 0 8px; /* 左右留白，让按钮居中悬浮 */
  box-sizing: border-box;
}

:deep(.el-menu-item) {
  margin: 4px 0;
  border-radius: 8px; /* 圆角矩形 */
  height: 46px;
  line-height: 46px;
  color: #a0a0a0 !important; /* 未选中文字偏灰 */
}

:deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.08) !important; /* 悬停微亮 */
  color: #fff !important;
}

/* --- 核心：选中状态 (复刻图片的绿色) --- */
:deep(.el-menu-item.is-active) {
  /* 图片中的墨绿色背景 */
  background-color: #345e4f !important; 
  color: #ffffff !important;
  font-weight: 600;
}

:deep(.el-icon) {
  margin-right: 5px;
  text-align: center;
  vertical-align: middle;
}

.menu-text {
  font-size: 14px;
  margin-left: 4px;
}
</style>