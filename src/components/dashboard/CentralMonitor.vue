<template>
  <div class="bento-card central-card">
    <div class="card-header">
      <div class="header-left">
        <span class="card-title">双通道实时遥测 (V/A)</span>
        <span class="live-tag">● LIVE</span>
      </div>
      <div class="header-right">
        <div class="legend-box">
          <div class="legend-item"><span class="dot pack-a"></span> Pack-A</div>
          <div class="legend-item"><span class="dot pack-b"></span> Pack-B</div>
        </div>
      </div>
    </div>

    <div class="chart-wrapper">
      <div ref="chartRef" class="chart-canvas"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, shallowRef, nextTick } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'

// --- 核心状态 ---
const chartRef = ref<HTMLElement | null>(null)
const myChart = shallowRef<echarts.ECharts | null>(null)
let timer: any = null
let resizeObserver: ResizeObserver | null = null

// --- 配置参数 ---
const MAX_POINTS = 60
const REFRESH_RATE = 500 // 500ms 刷新一次

// --- 数据队列 ---
const dataQueue = {
  time: [] as string[],
  packA_V: [] as number[],
  packA_C: [] as number[],
  packB_V: [] as number[],
  packB_C: [] as number[]
}

const fetchRealData = async () => {
  try {
    // 假设 Pack A 是 b1c0，Pack B 是 b1c1
    const res = await axios.get('http://localhost:8080/api/battery-dashboard/stream?idA=b1c0&idB=b1c1')
    return res.data // 直接返回后端给的 { time, va, ca, vb, cb }
  } catch (err) {
    console.error("Fetch error:", err)
    // 出错时返回个空数据防止炸裂
    return { time: new Date().toLocaleTimeString(), va: 0, ca: 0, vb: 0, cb: 0 }
  }
}

// 初始化填空数据
const initData = () => {
  for (let i = 0; i < MAX_POINTS; i++) {
    dataQueue.time.push('')
    dataQueue.packA_V.push(0)
    dataQueue.packA_C.push(0)
    dataQueue.packB_V.push(0)
    dataQueue.packB_C.push(0)
  }
}

// --- 2. 实时更新循环 (关键修复点) ---
const startLoop = () => {
  timer = setInterval(async () => {
    // A. 请求真实数据
    const next = await fetchRealData()

    // B. 队列操作 (逻辑不变)
    dataQueue.time.shift(); dataQueue.time.push(next.time)

    // 如果后端返回 null (没数据), 赋 0 或者保持上一个值
    dataQueue.packA_V.shift(); dataQueue.packA_V.push(next.va || 0)
    dataQueue.packA_C.shift(); dataQueue.packA_C.push(next.ca || 0)
    dataQueue.packB_V.shift(); dataQueue.packB_V.push(next.vb || 0)
    dataQueue.packB_C.shift(); dataQueue.packB_C.push(next.cb || 0)

    // C. 渲染
    myChart.value?.setOption({
      xAxis: [
        { data: dataQueue.time },
        { data: dataQueue.time }
      ],
      series: [
        { data: dataQueue.packA_V },
        { data: dataQueue.packA_C },
        { data: dataQueue.packB_V },
        { data: dataQueue.packB_C }
      ]
    })
  }, REFRESH_RATE)
}

// --- 3. 初始化图表 ---
const initChart = () => {
  if (!chartRef.value) return

  myChart.value = echarts.init(chartRef.value)

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',

    animation: false, // 开启动画

    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0,0,0,0.9)',
      borderColor: '#333',
      textStyle: { color: '#eee', fontSize: 12 },
      axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } },
      formatter: (params: any) => {
        let html = `<div style="margin-bottom:4px;color:#aaa;font-size:11px">${params[0].axisValue}</div>`
        html += `<div style="display:flex;gap:20px;">`
        // Left Column: Pack A
        html += `<div><div style="color:#74f2ce;font-weight:bold;font-size:11px;margin-bottom:2px">PACK A</div>`
        html += `<div>V: ${params[0].value} V</div>`
        html += `<div>A: ${params[1].value} A</div></div>`
        // Right Column: Pack B
        html += `<div><div style="color:#409eff;font-weight:bold;font-size:11px;margin-bottom:2px">PACK B</div>`
        html += `<div>V: ${params[2].value} V</div>`
        html += `<div>A: ${params[3].value} A</div></div>`
        html += `</div>`
        return html
      }
    },
    // 双 Grid 布局
    grid: [
      { left: 50, right: 20, top: '12%', height: '35%' }, // 上：电压
      { left: 50, right: 20, top: '58%', height: '35%' }  // 下：电流
    ],
    xAxis: [
      { gridIndex: 0, type: 'category', data: dataQueue.time, show: false, boundaryGap: false },
      { gridIndex: 1, type: 'category', data: dataQueue.time, boundaryGap: false, axisLabel: { color: '#666', fontSize: 10 }, axisLine: { lineStyle: { color: '#333' } } }
    ],
    // , min: 3.0, max: 4.5   , min: 0, max: 25
    yAxis: [
      { gridIndex: 0, name: 'VOLTAGE (V)', type: 'value', scale: true, splitLine: { show: true, lineStyle: { color: '#222' } }, axisLabel: { color: '#888' } },
      { gridIndex: 1, name: 'CURRENT (A)', type: 'value', scale: true, splitLine: { show: true, lineStyle: { color: '#222' } }, axisLabel: { color: '#888' } }
    ],
    series: [
      // Pack A
      { name: 'AV', type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: dataQueue.packA_V, showSymbol: false, smooth: true, lineStyle: { width: 2, color: '#74f2ce' }, areaStyle: { opacity: 0.1, color: '#74f2ce' } },
      { name: 'AC', type: 'line', xAxisIndex: 1, yAxisIndex: 1, data: dataQueue.packA_C, showSymbol: false, smooth: true, lineStyle: { width: 1, color: '#74f2ce', type: 'dashed' } },
      // Pack B
      { name: 'BV', type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: dataQueue.packB_V, showSymbol: false, smooth: true, lineStyle: { width: 2, color: '#409eff' } },
      { name: 'BC', type: 'line', xAxisIndex: 1, yAxisIndex: 1, data: dataQueue.packB_C, showSymbol: false, smooth: true, lineStyle: { width: 1, color: '#409eff', type: 'dashed' } }
    ]
  }

  myChart.value.setOption(option)
}

// --- 生命周期 ---
onMounted(() => {
  initData()
  nextTick(() => {
    initChart()
    startLoop()

    // 自动 Resize 监听
    if (chartRef.value) {
      resizeObserver = new ResizeObserver(() => myChart.value?.resize())
      resizeObserver.observe(chartRef.value)
    }
  })
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (resizeObserver) resizeObserver.disconnect()
  myChart.value?.dispose()
})
</script>

<style scoped>
.central-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  /* 更酷炫的深色背景 */
  background: radial-gradient(circle at center, #1f2029 0%, #101012 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
}

/* 头部样式 */
.card-header {
  flex-shrink: 0;
  height: 40px;
  padding: 0 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255,255,255,0.02);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.header-left { display: flex; align-items: center; gap: 10px; }
.card-title { font-size: 14px; font-weight: 700; color: #eee; letter-spacing: 0.5px; }
.live-tag {
  font-size: 10px; color: #ff4d4f;
  background: rgba(255, 77, 79, 0.15);
  padding: 2px 6px; border-radius: 4px;
  font-weight: bold;
  animation: pulse 2s infinite;
}

.legend-box { display: flex; gap: 12px; }
.legend-item { font-size: 11px; color: #888; display: flex; align-items: center; gap: 4px; }
.dot { width: 6px; height: 6px; border-radius: 50%; }
.dot.pack-a { background: #74f2ce; box-shadow: 0 0 4px #74f2ce; }
.dot.pack-b { background: #409eff; box-shadow: 0 0 4px #409eff; }

/* 图表区域：关键修正 */
.chart-wrapper {
  flex: 1; /* 自动占据剩余高度 */
  width: 100%;
  min-height: 0; /* 防止溢出 */
  position: relative;
}

.chart-canvas {
  width: 100%;
  height: 100%;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}
</style>
