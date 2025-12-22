<template>
  <div class="page">
    <el-card class="card" shadow="never">
      <div class="pack-head">
        <div class="title">
          <div class="name">电池组：{{ packId }}</div>
          <div class="sub muted">用于查看每个电芯一致性（电压压差、温度分布）</div>
        </div>
        <div class="right">
          <el-button @click="back">返回台账</el-button>
          <el-button type="primary" @click="refresh">刷新</el-button>
        </div>
      </div>
    </el-card>

    <div class="grid">
      <el-card class="card" shadow="never">
        <div class="card-title">电压压差分布（示例）</div>
        <div ref="voltageEl" class="chart"></div>
      </el-card>

      <el-card class="card" shadow="never">
        <div class="card-title">温度分布热力图（示例）</div>
        <div ref="tempEl" class="chart"></div>
      </el-card>
    </div>

    <el-card class="card" shadow="never">
      <div class="card-title">单体明细（示例）</div>
      <el-table :data="cells" height="320" stripe>
        <el-table-column prop="index" label="电芯序号" width="100" />
        <el-table-column prop="voltage" label="电压(V)" width="120" />
        <el-table-column prop="temp" label="温度(°C)" width="120" />
        <el-table-column prop="deltaV" label="相对压差(mV)" width="140" />
        <el-table-column prop="note" label="备注" min-width="160" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as echarts from 'echarts'

const route = useRoute()
const router = useRouter()

const packId = computed(() => route.params.packId as string)

const voltageEl = ref<HTMLDivElement | null>(null)
const tempEl = ref<HTMLDivElement | null>(null)

let voltageChart: echarts.ECharts | null = null
let tempChart: echarts.ECharts | null = null

// mock 单体数据：48 节
const cells = ref(
  Array.from({ length: 48 }).map((_, i) => {
    const voltage = 3.25 + (Math.random() - 0.5) * 0.03
    const temp = 25 + (Math.random() - 0.5) * 6
    return {
      index: i + 1,
      voltage: +voltage.toFixed(3),
      temp: +temp.toFixed(1),
      deltaV: 0, // 后面算
      note: '',
    }
  }),
)

function calcDeltaV() {
  const vs = cells.value.map(c => c.voltage)
  const avg = vs.reduce((a, b) => a + b, 0) / vs.length
  cells.value = cells.value.map(c => ({
    ...c,
    deltaV: Math.round((c.voltage - avg) * 1000),
    note: Math.abs((c.voltage - avg) * 1000) > 10 ? '压差偏大' : '',
  }))
}

function renderVoltage() {
  if (!voltageEl.value) return
  voltageChart = echarts.init(voltageEl.value, undefined, { renderer: 'canvas' })

  const data = cells.value.map(c => c.deltaV)

  voltageChart.setOption({
    backgroundColor: 'transparent',
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: {
      type: 'category',
      data: cells.value.map(c => String(c.index)),
      axisLabel: { color: '#a6a6a6', interval: 5 },
      axisLine: { lineStyle: { color: '#333' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#a6a6a6' },
      splitLine: { lineStyle: { color: '#222' } },
    },
    tooltip: { trigger: 'axis' },
    series: [
      {
        type: 'bar',
        data,
        itemStyle: { color: '#409eff' },
      },
    ],
  })
}

function renderTempHeatmap() {
  if (!tempEl.value) return
  tempChart = echarts.init(tempEl.value, undefined, { renderer: 'canvas' })

  // 假设 8x6 排布（48 节）
  const cols = 8
  const rows = 6
  const heatData: [number, number, number][] = []
  cells.value.forEach((c, idx) => {
    const x = idx % cols
    const y = Math.floor(idx / cols)
    heatData.push([x, y, c.temp])
  })

  tempChart.setOption({
    backgroundColor: 'transparent',
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: {
      type: 'category',
      data: Array.from({ length: cols }).map((_, i) => `列${i + 1}`),
      axisLabel: { color: '#a6a6a6' },
      axisLine: { lineStyle: { color: '#333' } },
    },
    yAxis: {
      type: 'category',
      data: Array.from({ length: rows }).map((_, i) => `行${i + 1}`),
      axisLabel: { color: '#a6a6a6' },
      axisLine: { lineStyle: { color: '#333' } },
    },
    visualMap: {
      min: 15,
      max: 40,
      calculable: true,
      right: 0,
      textStyle: { color: '#a6a6a6' },
    },
    tooltip: {
      formatter: (p: any) => `温度：${p.value[2]} °C`,
    },
    series: [
      {
        type: 'heatmap',
        data: heatData,
        label: { show: true, color: '#111' },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.4)' } },
      },
    ],
  })
}

function resize() {
  voltageChart?.resize()
  tempChart?.resize()
}

function refresh() {
  // 实际接入：调用 API 拉 packId 的单体数据
  // 这里演示重新随机
  cells.value = cells.value.map(c => {
    const voltage = 3.25 + (Math.random() - 0.5) * 0.03
    const temp = 25 + (Math.random() - 0.5) * 6
    return { ...c, voltage: +voltage.toFixed(3), temp: +temp.toFixed(1), note: '' }
  })
  calcDeltaV()
  nextTick(() => {
    renderVoltage()
    renderTempHeatmap()
  })
}

function back() {
  router.push('/assets/batteries')
}

onMounted(() => {
  calcDeltaV()
  nextTick(() => {
    renderVoltage()
    renderTempHeatmap()
  })
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  voltageChart?.dispose()
  tempChart?.dispose()
  voltageChart = null
  tempChart = null
})
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 14px; }

.card {
  background: #141414;
  border: 1px solid #1f1f1f;
}

.pack-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.title .name { font-size: 16px; font-weight: 600; color: #fff; }
.muted { color: #7a7a7a; }
.right { display: flex; gap: 10px; }

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.card-title {
  color: #fff;
  font-weight: 600;
  margin-bottom: 10px;
}

.chart { height: 320px; width: 100%; }

:deep(.el-table) { background-color: transparent; color: #cfd3dc; }
:deep(.el-table th.el-table__cell) { background: #141414; color: #cfd3dc; }
:deep(.el-table tr) { background: #141414; }
:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) { background: #121212; }
:deep(.el-table td.el-table__cell) { border-bottom: 1px solid #1f1f1f; }

@media (max-width: 1200px) {
  .grid { grid-template-columns: 1fr; }
}
</style>