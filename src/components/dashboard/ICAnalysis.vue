<template>
  <div class="bento-card ic-card">
    <div class="card-header">
      <div class="header-left">
        <span class="card-title">IC 增量容量分析</span>
        <span class="cell-tag">当前: {{ currentCellId || '-' }}</span>
      </div>
      <div class="header-right">
        <div class="pack-switch-wrap">
          <div class="pack-switch">
            <button :class="{ active: selectedPack === 'A' }" @click="switchPack('A')">Pack-A</button>
            <button :class="{ active: selectedPack === 'B' }" @click="switchPack('B')">Pack-B</button>
          </div>
        </div>
        <div class="soh-badge" :class="getHealthColor">
          <span class="label">SOH</span>
          <span class="value">{{ currentSOH != null ? currentSOH.toFixed(1) : '--' }}%</span>
        </div>
      </div>
    </div>

    <div ref="chartRef" class="chart-container"></div>

    <div class="analysis-footer">
      <div class="legend-item">
        <span class="line ref-line"></span> Reference (Cycle 1)
      </div>
      <div class="legend-item">
        <span class="line curr-line"></span> Current (Cycle {{ currentCycle || '-' }})
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, nextTick } from 'vue'
import axios from 'axios'
import * as echarts from 'echarts'
import { useEchart } from '@/composables/useEchart'

const { chartRef, setOption } = useEchart()

type StreamResp = { cellIdA?: string; cellIdB?: string }
type BatteryRow = { batteryCode?: string; sohPercent?: number | null }
type IcPoint = { voltage?: number; dqdv?: number }
type IcResp = {
  cellId?: string
  refCycle?: number
  currCycle?: number
  refCurve?: IcPoint[]
  currCurve?: IcPoint[]
}

const refreshMs = 30000
let timer: number | null = null

const selectedPack = ref<'A' | 'B'>('A')
const cellIdA = ref('')
const cellIdB = ref('')
const currentCellId = ref('')
const currentSOH = ref<number | null>(null)
const currentCycle = ref<number | null>(null)

const getHealthColor = computed(() => {
  if (currentSOH.value == null) return 'fair'
  if (currentSOH.value > 90) return 'good'
  if (currentSOH.value > 80) return 'fair'
  return 'poor'
})

function renderChart(refData: number[][], currData: number[][]) {
  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    grid: { left: '10%', right: '10%', top: '15%', bottom: '15%' },
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    xAxis: {
      name: 'Voltage (V)',
      nameLocation: 'middle',
      nameGap: 25,
      type: 'value',
      min: 3.5, max: 4.3,
      splitLine: { show: false },
      axisLabel: { color: '#666', fontSize: 10 },
      axisLine: { lineStyle: { color: '#444' } }
    },
    yAxis: {
      name: 'dQ/dV (Ah/V)',
      type: 'value',
      splitLine: { show: true, lineStyle: { color: '#222', type: 'dashed' } },
      axisLabel: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        name: 'Reference (BOL)',
        type: 'line',
        data: refData,
        symbol: 'none',
        lineStyle: { color: '#555', width: 2, type: 'dashed', opacity: 0.6 },
        z: 1
      },
      {
        name: 'Current State',
        type: 'line',
        data: currData,
        symbol: 'none',
        smooth: 0.3,
        lineStyle: { width: 3, color: '#bd34fe' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(189, 52, 254, 0.4)' },
            { offset: 1, color: 'rgba(189, 52, 254, 0)' }
          ])
        },
        z: 2
      }
    ]
  }
  setOption(option)
}

function toSeries(list: IcPoint[] | undefined) {
  return (list || [])
    .filter(p => p?.voltage != null && p?.dqdv != null)
    .map(p => [Number(p.voltage), Number(p.dqdv)])
}

async function refreshCellIds() {
  try {
    const res = await axios.get<StreamResp>('http://localhost:8080/api/battery-dashboard/stream')
    cellIdA.value = res.data?.cellIdA || ''
    cellIdB.value = res.data?.cellIdB || ''
    currentCellId.value = selectedPack.value === 'A' ? cellIdA.value : cellIdB.value
  } catch {
    cellIdA.value = ''
    cellIdB.value = ''
    currentCellId.value = ''
  }
}

async function refreshIc() {
  if (!currentCellId.value) {
    renderChart([], [])
    currentCycle.value = null
    currentSOH.value = null
    return
  }
  try {
    const res = await axios.get<IcResp>('http://localhost:8080/api/battery-dashboard/ic', {
      params: { cellId: currentCellId.value, smooth: 9 },
    })
    const refData = toSeries(res.data?.refCurve)
    const currData = toSeries(res.data?.currCurve)
    renderChart(refData, currData)
    currentCycle.value = res.data?.currCycle ?? null
    currentSOH.value = null
  } catch {
    renderChart([], [])
    currentCycle.value = null
    currentSOH.value = null
  }
}

async function refreshRealSoh() {
  if (!currentCellId.value) return
  try {
    const resp = await axios.get<{ content?: BatteryRow[] }>('/api/batteries', { params: { page: 0, size: 500 } })
    const rows = resp.data?.content || []
    const target = currentCellId.value.toLowerCase()
    const row = rows.find(r => {
      const code = (r?.batteryCode || '').toLowerCase()
      return code === target || code.endsWith(`_${target}`)
    })
    if (row?.sohPercent != null) {
      currentSOH.value = Number(row.sohPercent)
    }
  } catch {
    // ignore - fallback to IC estimated SOH
  }
}

async function refreshAll() {
  await refreshCellIds()
  await refreshIc()
  await refreshRealSoh()
}

async function switchPack(pack: 'A' | 'B') {
  selectedPack.value = pack
  currentCellId.value = pack === 'A' ? cellIdA.value : cellIdB.value
  await refreshIc()
  await refreshRealSoh()
}

onMounted(() => {
  nextTick(() => {
    refreshAll()
    timer = window.setInterval(refreshAll, refreshMs)
  })
})

onUnmounted(() => {
  if (timer != null) {
    window.clearInterval(timer)
    timer = null
  }
})
</script>

<style scoped>
.ic-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.4);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.card-title { font-size: 13px; font-weight: 700; color: #ccc; }
.cell-tag {
  font-size: 11px;
  color: #999;
  margin-left: 8px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

/* SOH Badge */
.pack-switch-wrap {
  display: flex;
  align-items: center;
  margin-right: 4px;
}
.pack-switch {
  display: flex;
  gap: 6px;
}
.pack-switch button {
  border: 1px solid #444;
  background: #1c1c1c;
  color: #bbb;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  cursor: pointer;
}
.pack-switch button.active {
  border-color: #7c4dff;
  color: #fff;
  background: #2a1f4d;
}

.soh-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1;
}
.soh-badge .label { font-size: 9px; color: #666; font-weight: bold; margin-bottom: 2px;}
.soh-badge .value { font-size: 16px; font-weight: 800; font-family: 'Courier New', monospace; }

.soh-badge.good .value { color: #74f2ce; }
.soh-badge.fair .value { color: #e6a23c; }
.soh-badge.poor .value { color: #f56c6c; }

.chart-container { flex: 1; min-height: 0; margin: 10px 0; }

.analysis-footer {
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #888;
  background: rgba(0,0,0,0.2);
}
.legend-item { display: flex; align-items: center; gap: 6px; }
.line { width: 12px; height: 2px; display: inline-block; }
.ref-line { border-top: 2px dashed #555; }
.curr-line { background: #bd34fe; height: 3px; border-radius: 2px;}
</style>
