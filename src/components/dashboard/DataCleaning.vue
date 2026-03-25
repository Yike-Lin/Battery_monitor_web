<template>
  <div class="bento-card cleaning-card">
    <div class="card-header">
      <div class="header-left">
        <span class="card-title">实时信号降噪</span>
        <span class="algo-tag">后端 EMA + 阶跃限幅 · {{ cellLabel }}</span>
      </div>
    </div>

    <div class="chart-wrapper">
      <div ref="chartDom" class="chart-canvas"></div>
    </div>

    <div class="stats-footer">
      <div class="stat-item">
        <span class="label">|ΔV| 平滑</span>
        <span class="value">{{ noiseLevel.toFixed(4) }}</span>
      </div>
      <div class="stat-item">
        <span class="label">SNR(估)</span>
        <span class="value highlight">{{ snrDisplay }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, shallowRef } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'

type StreamResp = {
  time?: string
  cellIdA?: string
  va?: number
  vaRaw?: number
}

const chartDom = ref<HTMLElement | null>(null)
const myChart = shallowRef<echarts.ECharts | null>(null)
const noiseLevel = ref(0)
const snrDisplay = ref('— dB')
const cellLabel = ref('Pack-A V')

let intervalId: number | null = null
let resizeObserver: ResizeObserver | null = null
let onVis: (() => void) | null = null

const MAX_POINTS = 50
const REFRESH_MS = 500
const dataX: string[] = []
const dataRaw: number[] = []
const dataFiltered: number[] = []

for (let i = 0; i < MAX_POINTS; i++) {
  dataX.push('')
  dataRaw.push(0)
  dataFiltered.push(0)
}

let noiseEma = 0

const fetchStream = async () => {
  const res = await axios.get<StreamResp>('/api/battery-dashboard/stream')
  return res.data
}

const pump = async () => {
  if (!myChart.value) return
  try {
    const d = await fetchStream()
    const t = d.time || new Date().toLocaleTimeString()
    const raw = d.vaRaw != null && d.vaRaw !== undefined ? Number(d.vaRaw) : Number(d.va ?? 0)
    const filtered = Number(d.va ?? raw)
    if (d.cellIdA) {
      const short = d.cellIdA.length > 14 ? `…${d.cellIdA.slice(-12)}` : d.cellIdA
      cellLabel.value = `Pack-A ${short}`
    }

    const diff = Math.abs(filtered - raw)
    noiseEma = noiseEma === 0 ? diff : noiseEma * 0.85 + diff * 0.15
    noiseLevel.value = noiseEma

    const sig = Math.max(1e-6, Math.abs(filtered))
    const n = Math.max(1e-6, diff)
    const snr = 20 * Math.log10(sig / n)
    snrDisplay.value = `${Number.isFinite(snr) ? Math.min(60, Math.max(-20, snr)).toFixed(1) : '—'} dB`

    dataX.shift()
    dataX.push(t)
    dataRaw.shift()
    dataRaw.push(raw)
    dataFiltered.shift()
    dataFiltered.push(filtered)

    myChart.value.setOption({
      xAxis: { data: dataX },
      series: [{ data: dataRaw }, { data: dataFiltered }],
    })
  } catch {
    // 保持上次曲线，不刷屏
  }
}

const initChart = () => {
  if (!chartDom.value) return

  myChart.value = echarts.init(chartDom.value)

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    grid: { left: 5, right: 5, top: 28, bottom: 5, containLabel: false },
    animation: false,
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const arr = params as { axisValue?: string; seriesIndex?: number; value?: number }[]
        const t = arr?.[0]?.axisValue ?? ''
        const r = arr?.find(p => p.seriesIndex === 0)?.value
        const f = arr?.find(p => p.seriesIndex === 1)?.value
        return [
          `<div style="margin-bottom:4px;color:#888;font-size:10px">${t}</div>`,
          `<div style="color:#888">Raw: ${r != null ? r.toFixed(4) : '—'} V</div>`,
          `<div style="color:#409eff">Filtered: ${f != null ? f.toFixed(4) : '—'} V</div>`,
        ].join('')
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      show: false,
    },
    yAxis: {
      type: 'value',
      scale: true,
      splitLine: { show: false },
      axisLabel: { show: false },
    },
    series: [
      {
        name: 'Raw',
        type: 'line',
        showSymbol: false,
        smooth: false,
        data: dataRaw,
        lineStyle: { width: 1, color: '#666', type: 'dashed' },
      },
      {
        name: 'Filtered',
        type: 'line',
        showSymbol: false,
        smooth: true,
        data: dataFiltered,
        lineStyle: { width: 2, color: '#409eff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.35)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0)' },
          ]),
        },
        z: 2,
      },
    ],
  }

  myChart.value.setOption(option)
}

function startLoop() {
  if (intervalId != null) return
  void pump()
  intervalId = window.setInterval(pump, REFRESH_MS)
}

function stopLoop() {
  if (intervalId == null) return
  window.clearInterval(intervalId)
  intervalId = null
}

onMounted(() => {
  nextTick(() => {
    initChart()
    startLoop()

    onVis = () => {
      if (document.visibilityState === 'hidden') {
        stopLoop()
        return
      }
      void pump()
      startLoop()
    }
    document.addEventListener('visibilitychange', onVis)

    if (chartDom.value) {
      resizeObserver = new ResizeObserver(() => {
        myChart.value?.resize()
      })
      resizeObserver.observe(chartDom.value)
    }
  })
})

onUnmounted(() => {
  stopLoop()
  if (onVis) {
    document.removeEventListener('visibilitychange', onVis)
    onVis = null
  }
  resizeObserver?.disconnect()
  myChart.value?.dispose()
})
</script>

<style scoped>
.cleaning-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  background: rgba(0,0,0,0.2);
  flex-shrink: 0;
  padding: 0 10px;
  min-height: 36px;
}

.header-left { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.card-title { font-size: 12px; font-weight: 600; color: #eee; }
.algo-tag { font-size: 9px; color: #67c23a; font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.chart-wrapper {
  flex: 1;
  width: 100%;
  min-height: 0;
  position: relative;
}

.chart-canvas {
  width: 100%;
  height: 100%;
}

.stats-footer {
  flex-shrink: 0;
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
</style>
