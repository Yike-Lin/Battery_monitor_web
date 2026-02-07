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
    redirect: '/admin/battery-ledger',
    children: [
      // 资产管理 - 电池台账列表
      {
        path: 'battery-ledger',
        name: 'BatteryLedger',
        component: () => import('../views/admin/BatteryLedger.vue'),
        meta: { title: '电池台账列表', group: '资产管理' },
      },

      // 资产管理 - 单体电池详情
      {
        path: 'cell-detail/:batteryId',
        name: 'CellDetail',
        component: () => import('../views/admin/CellDetail.vue'),
        meta: { title: '单体电池详情', group: '资产管理' },
      },

      // 资产管理 - 拓扑结构管理
      {
        path: 'topology',
        name: 'TopologyManager',
        component: () => import('../views/admin/TopologyManager.vue'),
        meta: { title: '拓扑结构管理', group: '资产管理' },
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