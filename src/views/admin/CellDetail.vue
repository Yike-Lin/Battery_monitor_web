<template>
  <div class="page">
    <!-- 顶部信息 -->
    <el-card class="card" shadow="never">
      <div class="pack-head">
        <div class="title">
          <div class="name">单体一致性详情：{{ packId }}</div>
          <div class="sub muted">
            {{ packMetaText }}
          </div>
        </div>

        <div class="right">
          <el-button @click="back">返回台账</el-button>
          <el-button @click="randomizeOnce">模拟下一次采样</el-button>
          <el-button type="primary" @click="refresh">刷新</el-button>
        </div>
      </div>

      <div class="summary">
        <div class="sum-item">
          <div class="k">当前状态</div>
          <div class="v">
            <el-tag :type="statusTagType(pack?.status)" effect="dark">
              {{ statusText(pack?.status) }}
            </el-tag>
          </div>
        </div>
        <div class="sum-item">
          <div class="k">SOH</div>
          <div class="v" :class="sohClass(pack?.health?.soh)">{{ fmt1(pack?.health?.soh) }}%</div>
        </div>
        <div class="sum-item">
          <div class="k">循环数</div>
          <div class="v">{{ pack?.health?.cycleCount ?? '—' }}</div>
        </div>
        <div class="sum-item">
          <div class="k">额定容量</div>
          <div class="v">{{ pack?.ratedCapacityAh?.toFixed?.(2) ?? '—' }} Ah</div>
        </div>
        <div class="sum-item">
          <div class="k">最近记录</div>
          <div class="v">{{ pack?.health?.lastRecordAt ?? '—' }}</div>
        </div>
      </div>
    </el-card>

    <!-- 控制栏 -->
    <el-card class="card" shadow="never">
      <div class="controls">
        <el-form :inline="true" @submit.prevent>
          <el-form-item label="观测循环">
            <el-slider
              v-model="cyclePoint"
              :min="0"
              :max="maxCycle"
              :step="10"
              show-input
              style="width: 420px"
              @change="recomputeAndRender"
            />
          </el-form-item>

          <el-form-item label="热力图布局">
            <el-select v-model="layoutKey" style="width: 120px" @change="recomputeAndRender">
              <el-option label="8×6" value="8x6" />
              <el-option label="12×4" value="12x4" />
              <el-option label="16×3" value="16x3" />
            </el-select>
          </el-form-item>

          <el-form-item label="异常阈值">
            <el-tooltip content="压差绝对值超过该阈值( mV )标红" placement="top">
              <el-input-number v-model="alarm.mv" :min="1" :max="100" :step="1" @change="recomputeAndRender" />
            </el-tooltip>
            <span class="muted" style="margin: 0 10px">mV</span>
            <el-tooltip content="温度超过均值该阈值(℃)标红" placement="top">
              <el-input-number v-model="alarm.dt" :min="0.5" :max="20" :step="0.5" @change="recomputeAndRender" />
            </el-tooltip>
            <span class="muted" style="margin-left: 10px">℃</span>
          </el-form-item>
        </el-form>

        <div class="metrics">
          <div class="metric">
            <div class="k">Vmax/Vmin/ΔV</div>
            <div class="v" :class="deltaVClass">{{ metrics.vMax.toFixed(3) }} / {{ metrics.vMin.toFixed(3) }} / {{ metrics.deltaVmv }} mV</div>
          </div>
          <div class="metric">
            <div class="k">Tmax/Tmin/ΔT</div>
            <div class="v" :class="deltaTClass">{{ metrics.tMax.toFixed(1) }} / {{ metrics.tMin.toFixed(1) }} / {{ metrics.deltaT.toFixed(1) }} ℃</div>
          </div>
          <div class="metric">
            <div class="k">异常电芯数</div>
            <div class="v">{{ abnormalCount }}</div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 图表 -->
    <div class="grid">
      <el-card class="card" shadow="never">
        <div class="card-title">电压压差分布（相对均值，mV）</div>
        <div ref="voltageEl" class="chart"></div>
      </el-card>

      <el-card class="card" shadow="never">
        <div class="card-title">温度分布热力图（℃）</div>
        <div ref="tempEl" class="chart"></div>
      </el-card>
    </div>

    <!-- 明细 -->
    <el-card class="card" shadow="never">
      <div class="detail-head">
        <div class="card-title" style="margin: 0">单体明细</div>
        <div class="detail-actions">
          <el-switch v-model="onlyAbnormal" active-text="仅看异常" @change="recomputeAndRender" />
          <el-button @click="exportCsv">导出CSV（示例）</el-button>
        </div>
      </div>

      <el-table :data="filteredCells" height="320" stripe>
        <el-table-column prop="index" label="序号" width="70" sortable />
        <el-table-column prop="voltage" label="电压(V)" width="110" sortable />
        <el-table-column prop="temp" label="温度(℃)" width="110" sortable />
        <el-table-column prop="deltaV" label="相对压差(mV)" width="140" sortable>
          <template #default="{ row }">
            <span :class="row.abV ? 'bad' : ''">{{ row.deltaV }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="deltaT" label="相对温升(℃)" width="140" sortable>
          <template #default="{ row }">
            <span :class="row.abT ? 'bad' : ''">{{ row.deltaT.toFixed(1) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="note" label="备注" min-width="200">
          <template #default="{ row }">
            <el-tag v-if="row.abV || row.abT" type="danger" effect="dark">异常</el-tag>
            <span class="muted" style="margin-left: 8px">{{ row.note }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as echarts from 'echarts'

type Status = 'in_service' | 'maintenance' | 'retired'
type BatteryPack = {
  id: string
  model: string
  commissionDate: string
  customer?: string
  status: Status
  ratedCapacityAh: number
  dataset?: { source: string; temperatureC: number; profile: string; rawBatteryNo: number }
  health?: { soh: number; cycleCount: number; lastRecordAt: string }
}

type CellRow = {
  index: number
  voltage: number
  temp: number
  deltaV: number // mV
  deltaT: number // ℃（相对均值）
  abV: boolean
  abT: boolean
  note: string
}

const route = useRoute()
const router = useRouter()
const packId = computed(() => route.params.packId as string)

// 从台账（localStorage）读取 pack 元信息（与你前面 BatteryLedger 的 STORAGE_KEY 对齐）
const STORAGE_KEY = 'bms_battery_ledger_xjtu_mock_v1'
const pack = ref<BatteryPack | null>(null)

function loadPackMeta() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const list: BatteryPack[] = JSON.parse(raw)
    pack.value = list.find(i => i.id === packId.value) ?? null
  } catch {
    pack.value = null
  }
}

const packMetaText = computed(() => {
  const p = pack.value
  if (!p) return '用于查看每个电芯一致性（电压压差、温度分布）'
  const t = p.dataset?.temperatureC != null ? `${p.dataset.temperatureC}℃` : '—'
  const prof = p.dataset?.profile ?? '—'
  return `型号：${p.model} · 温度：${t} · 工况：${prof}`
})

function statusText(s?: Status) {
  if (!s) return '—'
  return s === 'in_service' ? '在役' : s === 'maintenance' ? '维护' : '退役'
}
function statusTagType(s?: Status) {
  if (!s) return 'info'
  return s === 'in_service' ? 'success' : s === 'maintenance' ? 'warning' : 'info'
}
function fmt1(v?: number) {
  return typeof v === 'number' ? v.toFixed(1) : '—'
}
function sohClass(soh?: number) {
  if (typeof soh !== 'number') return ''
  if (soh < 80) return 'bad'
  if (soh < 90) return 'mid'
  return 'good'
}

// 图表 DOM
const voltageEl = ref<HTMLDivElement | null>(null)
const tempEl = ref<HTMLDivElement | null>(null)
let voltageChart: echarts.ECharts | null = null
let tempChart: echarts.ECharts | null = null

// 模拟“电池组内单体数量”（工程上常见 48/96 等；这里默认 48）
const cellCount = ref(48)

// 观测点：循环
const maxCycle = ref(1000)
const cyclePoint = ref(200)

// 告警阈值
const alarm = reactive({ mv: 10, dt: 3 })

// 布局
const layoutKey = ref<'8x6' | '12x4' | '16x3'>('8x6')
function layoutSize(key: typeof layoutKey.value) {
  if (key === '8x6') return { cols: 8, rows: 6 }
  if (key === '12x4') return { cols: 12, rows: 4 }
  return { cols: 16, rows: 3 }
}

// 明细数据
const cells = ref<CellRow[]>([])
const onlyAbnormal = ref(false)

// 指标
const metrics = reactive({
  vMax: 0,
  vMin: 0,
  deltaVmv: 0,
  tMax: 0,
  tMin: 0,
  deltaT: 0,
})

const abnormalCount = computed(() => cells.value.filter(c => c.abV || c.abT).length)
const filteredCells = computed(() => (onlyAbnormal.value ? cells.value.filter(c => c.abV || c.abT) : cells.value))

const deltaVClass = computed(() => (metrics.deltaVmv > alarm.mv ? 'bad' : ''))
const deltaTClass = computed(() => (metrics.deltaT > alarm.dt ? 'bad' : ''))

/**
 * 用“XJTU 风格”的逻辑模拟：循环越大，波动越大；温度越高，离散性更强
 * 注意：这只是为了让前端看起来像真实数据趋势，后续你会替换成后端真实计算结果。
 */
function generateCellsByCycle() {
  const tempC = pack.value?.dataset?.temperatureC ?? 25
  const tempFactor = tempC === 25 ? 1 : tempC === 35 ? 1.15 : 1.35

  const baseV = 3.25
  const baseT = tempC

  // 随循环增加离散程度
  const spreadV = (0.006 + cyclePoint.value / 1000 * 0.018) * tempFactor // V 波动
  const spreadT = (1.5 + cyclePoint.value / 1000 * 4.0) * tempFactor      // ℃波动

  const arr: CellRow[] = Array.from({ length: cellCount.value }).map((_, i) => {
    // 让少数电芯更“差”，更像真实一致性问题
    const outlier = Math.random() < 0.06
    const v = baseV + (Math.random() - 0.5) * spreadV + (outlier ? (Math.random() > 0.5 ? 0.015 : -0.015) : 0)
    const t = baseT + (Math.random() - 0.5) * spreadT + (outlier ? randomBetween(1.5, 4.5) : 0)

    return {
      index: i + 1,
      voltage: +v.toFixed(3),
      temp: +t.toFixed(1),
      deltaV: 0,
      deltaT: 0,
      abV: false,
      abT: false,
      note: '',
    }
  })

  // 计算均值、相对压差/温升
  const avgV = arr.reduce((s, c) => s + c.voltage, 0) / arr.length
  const avgT = arr.reduce((s, c) => s + c.temp, 0) / arr.length

  for (const c of arr) {
    const dv = Math.round((c.voltage - avgV) * 1000) // mV
    const dt = c.temp - avgT
    c.deltaV = dv
    c.deltaT = dt
    c.abV = Math.abs(dv) >= alarm.mv
    c.abT = Math.abs(dt) >= alarm.dt
    c.note = [
      c.abV ? `压差≥${alarm.mv}mV` : '',
      c.abT ? `温差≥${alarm.dt}℃` : '',
    ].filter(Boolean).join('；')
  }

  // 指标
  const vs = arr.map(c => c.voltage)
  const ts = arr.map(c => c.temp)
  metrics.vMax = Math.max(...vs)
  metrics.vMin = Math.min(...vs)
  metrics.deltaVmv = Math.round((metrics.vMax - metrics.vMin) * 1000)

  metrics.tMax = Math.max(...ts)
  metrics.tMin = Math.min(...ts)
  metrics.deltaT = metrics.tMax - metrics.tMin

  cells.value = arr
}

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a)
}

/** 图1：压差柱状图 */
function renderVoltage() {
  if (!voltageEl.value) return
  if (!voltageChart) voltageChart = echarts.init(voltageEl.value)

  const xs = cells.value.map(c => String(c.index))
  const ys = cells.value.map(c => c.deltaV)

  voltageChart.setOption({
    backgroundColor: 'transparent',
    grid: { left: 48, right: 16, top: 30, bottom: 34 },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params?.[0]
        return `电芯 ${p.axisValue}<br/>压差：${p.data} mV`
      },
    },
    xAxis: {
      type: 'category',
      data: xs,
      axisLabel: { color: '#a6a6a6', interval: 5 },
      axisLine: { lineStyle: { color: '#333' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#a6a6a6' },
      splitLine: { lineStyle: { color: '#222' } },
    },
    series: [
      {
        type: 'bar',
        data: ys,
        barMaxWidth: 16,
        itemStyle: {
          color: (p: any) => (Math.abs(p.value) >= alarm.mv ? '#f56c6c' : '#409eff'),
        },
        markLine: {
          silent: true,
          lineStyle: { color: '#666' },
          data: [{ yAxis: alarm.mv }, { yAxis: -alarm.mv }],
          label: { color: '#a6a6a6' },
        },
      },
    ],
  })
}

/** 图2：温度热力图 */
function renderTempHeatmap() {
  if (!tempEl.value) return
  if (!tempChart) tempChart = echarts.init(tempEl.value)

  const { cols, rows } = layoutSize(layoutKey.value)
  // 若 cellCount != cols*rows，可选择截断/补齐；这里简单按最小值映射
  const n = Math.min(cells.value.length, cols * rows)

  const heatData: [number, number, number][] = []
  for (let idx = 0; idx < n; idx++) {
    const x = idx % cols
    const y = Math.floor(idx / cols)
    heatData.push([x, y, cells.value[idx].temp])
  }

  const temps = cells.value.map(c => c.temp)
  const minT = Math.min(...temps)
  const maxT = Math.max(...temps)

  tempChart.setOption({
    backgroundColor: 'transparent',
    grid: { left: 56, right: 20, top: 30, bottom: 34 },
    tooltip: {
      formatter: (p: any) => `位置：(${p.value[0] + 1}, ${p.value[1] + 1})<br/>温度：${p.value[2]} ℃`,
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: cols }).map((_, i) => `${i + 1}`),
      axisLabel: { color: '#a6a6a6' },
      axisLine: { lineStyle: { color: '#333' } },
      splitArea: { show: true, areaStyle: { color: ['rgba(255,255,255,0.01)', 'rgba(255,255,255,0.03)'] } },
    },
    yAxis: {
      type: 'category',
      data: Array.from({ length: rows }).map((_, i) => `${i + 1}`),
      axisLabel: { color: '#a6a6a6' },
      axisLine: { lineStyle: { color: '#333' } },
      splitArea: { show: true, areaStyle: { color: ['rgba(255,255,255,0.01)', 'rgba(255,255,255,0.03)'] } },
    },
    visualMap: {
      min: Math.floor(minT),
      max: Math.ceil(maxT),
      right: 0,
      calculable: true,
      textStyle: { color: '#a6a6a6' },
    },
    series: [
      {
        type: 'heatmap',
        data: heatData,
        label: { show: true, color: '#111', formatter: (p: any) => p.value[2].toFixed(1) },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.4)' } },
      },
    ],
  })
}

function resize() {
  voltageChart?.resize()
  tempChart?.resize()
}

function recomputeAndRender() {
  generateCellsByCycle()
  nextTick(() => {
    renderVoltage()
    renderTempHeatmap()
  })
}

function refresh() {
  // 真实场景：请求后端 /packs/:id/cells?cycle=...
  // 这里：重新计算（趋势由 cyclePoint 控制）
  recomputeAndRender()
}

function randomizeOnce() {
  // 仅让图表“像实时刷新”：轻微扰动，不改 cyclePoint
  // （真实场景对应：新一次采样/最新一帧）
  cells.value = cells.value.map(c => ({
    ...c,
    voltage: +(c.voltage + (Math.random() - 0.5) * 0.002).toFixed(3),
    temp: +(c.temp + (Math.random() - 0.5) * 0.3).toFixed(1),
  }))
  // 重新按均值计算 delta 与告警
  recomputeAndRender()
}

function back() {
  router.push('/admin/battery-ledger')
}

function exportCsv() {
  const header = ['index', 'voltage(V)', 'temp(℃)', 'deltaV(mV)', 'deltaT(℃)', 'abV', 'abT', 'note']
  const rows = filteredCells.value.map(r => [
    r.index, r.voltage, r.temp, r.deltaV, r.deltaT.toFixed(1), r.abV ? 1 : 0, r.abT ? 1 : 0, r.note,
  ])
  const csv = [header, ...rows].map(r => r.join(',')).join('\n')
  console.log('CSV:\n' + csv)
}

onMounted(() => {
  loadPackMeta()

  // 根据台账循环数，设置 slider 的默认点（更像“从列表点进来看到当前状态”）
  if (typeof pack.value?.health?.cycleCount === 'number') {
    cyclePoint.value = Math.min(pack.value.health.cycleCount, maxCycle.value)
  }

  recomputeAndRender()

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

.card { background: #141414; border: 1px solid #1f1f1f; }

.pack-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.title .name { font-size: 16px; font-weight: 600; color: #fff; }
.muted { color: #7a7a7a; }
.right { display: flex; gap: 10px; flex-wrap: wrap; }

.summary {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}
.sum-item { background: #101010; border: 1px solid #1f1f1f; border-radius: 8px; padding: 10px 12px; }
.sum-item .k { font-size: 12px; color: #7a7a7a; }
.sum-item .v { margin-top: 6px; color: #fff; font-weight: 600; }

.controls { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.metrics { display: flex; gap: 10px; flex-wrap: wrap; }
.metric { background: #101010; border: 1px solid #1f1f1f; border-radius: 8px; padding: 10px 12px; min-width: 220px; }
.metric .k { font-size: 12px; color: #7a7a7a; }
.metric .v { margin-top: 6px; color: #fff; font-weight: 600; }

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.card-title { color: #fff; font-weight: 600; margin-bottom: 10px; }
.chart { height: 340px; width: 100%; }

.detail-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; gap: 10px; }
.detail-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

.good { color: #67c23a; }
.mid { color: #e6a23c; }
.bad { color: #f56c6c; }

:deep(.el-table) { background-color: transparent; color: #cfd3dc; }
:deep(.el-table th.el-table__cell) { background: #141414; color: #cfd3dc; }
:deep(.el-table tr) { background: #141414; }
:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) { background: #121212; }
:deep(.el-table td.el-table__cell) { border-bottom: 1px solid #1f1f1f; }

@media (max-width: 1200px) {
  .grid { grid-template-columns: 1fr; }
  .summary { grid-template-columns: repeat(2, 1fr); }
}
</style>