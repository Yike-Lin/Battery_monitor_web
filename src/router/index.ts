import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'


// 定义路由数组
const routes: RouteRecordRaw[] = [
  {
    // 根路径重定向到dashboard
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    // 懒加载Dashboard组件,优化初始加载速度
    component: () => import('../views/Dashboard.vue'),
  },
]

// 创建路由实例并传递路由配置
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router