<template>
  <div class="bento-card cleaning-card">
    <div class="card-header">
      <div class="header-left">
        <span class="card-title">实时信号降噪</span>
        <span class="algo-tag">ALGO: KALMAN_V2</span>
      </div>

      <div class="toggle-wrapper" @click="toggleRaw">
        <span class="toggle-label">RAW</span>
        <div class="toggle-switch" :class="{ active: showRaw }">
          <div class="toggle-knob"></div>
        </div>
      </div>
    </div>

    <div class="chart-wrapper">
      <div ref="chartDom" class="chart-canvas"></div>
    </div>

    <div class="stats-footer">
      <div class="stat-item">
        <span class="label">NOISE</span>
        <span class="value">{{ noiseLevel.toFixed(3) }}</span>
      </div>
      <div class="stat-item">
        <span class="label">SNR</span>
        <span class="value highlight">{{ snrValue.toFixed(1) }} dB</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, shallowRef } from 'vue'
import * as echarts from 'echarts'

// --- 核心变量 ---
const chartDom = ref<HTMLElement | null>(null)
const myChart = shallowRef<echarts.ECharts | null>(null)
const showRaw = ref(true)
const noiseLevel = ref(0.05)
const snrValue = ref(45.0)

let intervalId: any = null
let resizeObserver: ResizeObserver | null = null

// --- 数据生成逻辑 (保证数据一定在 3.0 ~ 4.5 之间) ---
const MAX_POINTS = 50
let xTick = 0
const dataX: string[] = []
const dataRaw: number[] = []
const dataFiltered: number[] = []

// 初始化一些假数据，防止刚打开是空的
for (let i = 0; i < MAX_POINTS; i++) {
  dataX.push(i.toString())
  dataRaw.push(3.7)
  dataFiltered.push(3.7)
}

const generateNextPoint = () => {
  xTick++
  const nowStr = new Date().toLocaleTimeString()

  // 1. 基础波形：正弦波 (3.7V 基准，上下浮动 0.3V)
  const baseSignal = 3.7 + Math.sin(xTick * 0.2) * 0.3

  // 2. 噪声：随机 (-0.15 ~ +0.15)
  const noise = (Math.random() - 0.5) * 0.3

  // 3. 计算值
  const raw = baseSignal + noise
  const filtered = baseSignal + (noise * 0.1) // 滤波后噪声很小

  // 更新界面数值
  noiseLevel.value = Math.abs(noise)
  snrValue.value = 40 + Math.random() * 5

  return { time: nowStr, raw, filtered }
}

const updateChart = () => {
  if (!myChart.value) return

  const point = generateNextPoint()

  // 队列先进先出
  dataX.shift(); dataX.push(point.time)
  dataRaw.shift(); dataRaw.push(point.raw)
  dataFiltered.shift(); dataFiltered.push(point.filtered)

  myChart.value.setOption({
    xAxis: { data: dataX },
    series: [
      { data: dataRaw, lineStyle: { opacity: showRaw.value ? 1 : 0 } }, // 原始数据
      { data: dataFiltered } // 滤波数据
    ]
  })
}

// --- ECharts 初始化配置 ---
const initChart = () => {
  if (!chartDom.value) return

  myChart.value = echarts.init(chartDom.value)

  const option: echarts.EChartsOption = {
    // 关键：背景透明
    backgroundColor: 'transparent',
    // 关键：布局充满，防止留白太多导致线看不见
    grid: { left: 5, right: 5, top: 30, bottom: 5, containLabel: false },
    animation: false, // 关闭动画以提高实时性能
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      show: false
    },
    yAxis: {
      type: 'value',
      // ❗❗❗ 核心修正：scale: true 让 ECharts 自动判断范围，不要写死 min/max
      scale: true,
      splitLine: { show: false },
      axisLabel: { show: false }
    },
    series: [
      {
        name: 'Raw',
        type: 'line',
        showSymbol: false,
        smooth: false,
        data: dataRaw,
        lineStyle: { width: 1, color: '#666', type: 'dashed' }
      },
      {
        name: 'Filtered',
        type: 'line',
        showSymbol: false,
        smooth: true,
        data: dataFiltered,
        lineStyle: { width: 2, color: '#409eff' },
        // 渐变填充，让线更明显
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.4)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0)' }
          ])
        },
        z: 2
      }
    ]
  }

  myChart.value.setOption(option)
}

// --- 生命周期管理 ---
const toggleRaw = () => { showRaw.value = !showRaw.value }

onMounted(() => {
  nextTick(() => {
    initChart()
    intervalId = setInterval(updateChart, 100) // 100ms 刷新一次

    // 监听容器大小变化，自动 resize
    if (chartDom.value) {
      resizeObserver = new ResizeObserver(() => {
        myChart.value?.resize()
      })
      resizeObserver.observe(chartDom.value)
    }
  })
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
  if (resizeObserver) resizeObserver.disconnect()
  if (myChart.value) myChart.value.dispose()
})
</script>

<style scoped>
.cleaning-card {
  width: 100%;
  height: 100%; /* 依赖父级高度 */
  display: flex;
  flex-direction: column;
  background: radial-gradient(circle at bottom right, #25252b 0%, #151518 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  background: rgba(0,0,0,0.2);
  flex-shrink: 0; /* 防止头部被压缩 */
}

.header-left { display: flex; flex-direction: column; }
.card-title { font-size: 12px; font-weight: 600; color: #eee; }
.algo-tag { font-size: 9px; color: #409eff; font-family: monospace; }

/* ❗ 图表容器：强制占满剩余空间 */
.chart-wrapper {
  flex: 1;
  width: 100%;
  min-height: 0; /* 关键：防止Flex溢出 */
  position: relative;
}

.chart-canvas {
  width: 100%;
  height: 100%;
  /* 如果还看不见，把下面这行注释解开，如果是红色说明 CSS 没问题，是 ECharts 配置问题 */
  /* background: rgba(255, 0, 0, 0.1); */
}

/* 底部 */
.stats-footer {
  flex-shrink: 0; /* 防止底部被压缩 */
  display: flex;
  justify-content: space-between;
  padding: 6px 12px;
  background: rgba(0,0,0,0.15);
  border-top: 1px solid rgba(255,255,255,0.05);
}
.stat-item { display: flex; flex-direction: column; align-items: flex-end; }
.stat-item .label { font-size: 9px; color: #666; }
.stat-item .value { font-family: monospace; font-size: 11px; color: #ccc; }
.stat-item .value.highlight { color: #409eff; }

/* 开关样式 */
.toggle-wrapper { display: flex; align-items: center; gap: 6px; cursor: pointer; }
.toggle-label { font-size: 9px; color: #666; font-weight: bold; }
.toggle-switch {
  width: 24px; height: 12px; background: #333; border-radius: 6px;
  position: relative; transition: 0.3s; border: 1px solid #555;
}
.toggle-switch.active { background: #409eff; border-color: #409eff; }
.toggle-knob {
  width: 8px; height: 8px; background: #fff; border-radius: 50%;
  position: absolute; top: 1px; left: 1px; transition: 0.3s;
}
.toggle-switch.active .toggle-knob { left: 13px; }
</style>
