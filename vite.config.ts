import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const root = fileURLToPath(new URL('.', import.meta.url))
  const env = loadEnv(mode, root, '')
  // 默认用 IPv4，避免 Windows 上 localhost 优先走 ::1 而后端只监听 127.0.0.1 时偶发连不上
  const apiTarget = env.VITE_API_TARGET || 'http://127.0.0.1:8080'

  return {
    plugins: [
      vue(),
      vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          // 拓扑 SSE 长连接；避免代理默认超时把流掐断出现 read ECONNRESET
          timeout: 0,
          proxyTimeout: 0,
        },
      },
    },
  }
})
