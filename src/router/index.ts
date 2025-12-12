import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'


// 定义路由数组
const routes: RouteRecordRaw[] = [
  {
    // 重定向
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    // 懒加载Dashboard组件,优化初始加载速度
    component: () => import('../views/Dashboard.vue'),
  },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    redirect: '/admin/battery',
    children: [
      {
        path: 'battery',
        name: 'AdminBattery',
        component: () => import('../views/admin/BatteryList.vue'),
        meta: { title: '电池管理' },
      },
      {
        path: 'device',
        name: 'AdminDevice',
        component: () => import('../views/admin/DeviceList.vue'),
        meta: { title: '设备管理' },
      },
      {
        path: 'user',
        name: 'AdminUser',
        component: () => import('../views/admin/UserList.vue'),
        meta: { title: '用户管理' },
      },
    ],
  },
]

// 创建路由实例并传递路由配置
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router