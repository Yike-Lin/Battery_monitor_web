<template>
  <div class="dashboard-container">
    <KpiRow :kpi-list="kpiList" />
    <el-row :gutter="16" class="middle-row" style="flex:1;">
      <el-col :span="6" class="side-col">
        <SohChart class="small-card" />
        <RishChart class="small-card" />
      </el-col>

      <el-col :span="12" class="center-col">
        <CentralMonitor class="full-height-card" />
      </el-col>

      <el-col :span="6" class="side-col">
        <SocChart class="small-card" />
        <RulChart class="small-card" />
      </el-col>
    </el-row>
    <el-row :gutter="16" class="bottom-row-container">
      <el-col :span="6" class="bottom-left">
        <ICAnalysis />
      </el-col>

      <el-col :span="12" class="bottom-center">
        <CellMatrix :table-data="tableData" />
      </el-col>

      <el-col :span="6" class="bottom-right">
        <DataCleaning />
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import axios from 'axios'
import KpiRow from '@/components/dashboard/KpiRow.vue'
import SohChart from '@/components/dashboard/SohChart.vue'
import SocChart from '@/components/dashboard/SocChart.vue'
import RishChart from '@/components/dashboard/RishChart.vue'
import RulChart from '@/components/dashboard/RulChart.vue'
import CentralMonitor from '@/components/dashboard/CentralMonitor.vue'
import ICAnalysis from '@/components/dashboard/ICAnalysis.vue'
import CellMatrix from '@/components/dashboard/CellMatrix.vue'
import DataCleaning from '@/components/dashboard/DataCleaning.vue'

type BatteryPageResp = {
  content?: Array<{ sohPercent?: number | null; lastRecordAt?: string | null }>
  totalElements?: number
}
type BatteryRow = { sohPercent?: number | null; lastRecordAt?: string | null }
type BatteryMetrics = {
  avgSoh: number
  sohCount: number
  highRisk: number
  midRisk: number
  activeCount: number
  replacementCount: number
}

const kpiList = ref([
  {
    key: 'total',
    label: '接入电池组总数',
    value: '0',
    unit: 'Sets',
    sub: '暂无入库电池',
    status: 'normal',
    trend: 0,
  },
  {
    key: 'avg_soh',
    label: '机组平均健康度',
    value: '0.0',
    unit: '%',
    sub: '暂无SOH数据',
    status: 'success',
    trend: 0,
  },
  {
    key: 'risk',
    label: '风险预警/热失控',
    value: '0',
    unit: 'Alerts',
    sub: '暂无风险预警',
    status: 'danger',
    trend: 0,
  },
  {
    key: 'charging',
    label: '实时运行状态',
    value: '0/0',
    unit: 'Active',
    sub: '近 5 分钟无活跃数据',
    status: 'warning',
    trend: 0,
  },
  {
    key: 'replacement',
    label: '待更换建议 (EOL)',
    value: '0',
    unit: 'Units',
    sub: '暂无更换建议',
    status: 'info',
    trend: 0,
  }
])

let totalTimer: number | null = null
const ACTIVE_WINDOW_MS = 5 * 60 * 1000
const tableData = ref<any[]>([])

function getKpiItem(key: string) {
  return kpiList.value.find(item => item.key === key)
}

function updateTotal(total: number) {
  const item = getKpiItem('total')
  if (!item) return
  item.value = String(total)
  item.sub = total > 0 ? `已入库 ${total} 组` : '暂无入库电池'
}

function updateAvgSoh(metrics: BatteryMetrics) {
  const item = getKpiItem('avg_soh')
  if (!item) return
  item.value = metrics.avgSoh.toFixed(1)
  item.sub = metrics.sohCount > 0 ? `基于 ${metrics.sohCount} 组电池` : '暂无SOH数据'
}

function updateRisk(metrics: BatteryMetrics) {
  const item = getKpiItem('risk')
  if (!item) return
  const totalRisk = metrics.highRisk + metrics.midRisk
  item.value = String(totalRisk)
  item.sub = totalRisk === 0 ? '暂无风险预警' : `${metrics.highRisk} 高风险 / ${metrics.midRisk} 中风险`
}

function updateActive(metrics: BatteryMetrics, total: number) {
  const item = getKpiItem('charging')
  if (!item) return
  item.value = `${metrics.activeCount}/${total}`
  item.sub = metrics.activeCount > 0 ? `近 5 分钟活跃 ${metrics.activeCount} 组` : '近 5 分钟无活跃数据'
}

function updateReplacement(metrics: BatteryMetrics) {
  const item = getKpiItem('replacement')
  if (!item) return
  item.value = String(metrics.replacementCount)
  item.sub = metrics.replacementCount > 0 ? 'SOH < 80% 建议更换' : '暂无更换建议'
}

function calcMetrics(rows: BatteryRow[]): BatteryMetrics {
  let sum = 0
  let sohCount = 0
  let highRisk = 0
  let midRisk = 0
  let activeCount = 0
  let replacementCount = 0

  for (const row of rows) {
    const soh = Number(row?.sohPercent)
    if (!Number.isNaN(soh) && row?.sohPercent != null) {
      sum += soh
      sohCount += 1
      if (soh < 75) highRisk += 1
      else if (soh < 85) midRisk += 1
      if (soh < 80) replacementCount += 1
    }

    const ts = row?.lastRecordAt ? Date.parse(row.lastRecordAt) : NaN
    if (!Number.isNaN(ts) && Date.now() - ts <= ACTIVE_WINDOW_MS) {
      activeCount += 1
    }
  }

  return {
    avgSoh: sohCount > 0 ? sum / sohCount : 0,
    sohCount,
    highRisk,
    midRisk,
    activeCount,
    replacementCount,
  }
}

async function loadAllBatteryRows(total: number) {
  if (total <= 0) return [] as BatteryRow[]
  const pageSize = 200
  const totalPages = Math.ceil(total / pageSize)
  const rows: BatteryRow[] = []
  for (let page = 0; page < totalPages; page++) {
    const pageResp = await axios.get<BatteryPageResp>('/api/batteries', {
      params: { page, size: pageSize },
    })
    rows.push(...(pageResp.data?.content || []))
  }
  return rows
}

async function refreshKpiData() {
  try {
    const totalResp = await axios.get<BatteryPageResp>('/api/batteries', { params: { page: 0, size: 1 } })
    const total = Number(totalResp.data?.totalElements ?? 0)
    updateTotal(total)
    const rows = await loadAllBatteryRows(total)
    const metrics = calcMetrics(rows)
    updateAvgSoh(metrics)
    updateRisk(metrics)
    updateActive(metrics, total)
    updateReplacement(metrics)
  } catch {}
}

onMounted(() => {
  refreshKpiData()
  totalTimer = window.setInterval(refreshKpiData, 30000)
})

onUnmounted(() => {
  if (totalTimer != null) {
    window.clearInterval(totalTimer)
    totalTimer = null
  }
})
</script>

<style scoped>
.dashboard-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  box-sizing: border-box;
}

.middle-row {
  flex: 1;
  min-height: 0;
}

.side-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.center-col {
  height: 100%;
}

.full-height-card {
  height: 100%;
}

.small-card {
  flex: 1;
  min-height: 0;
}

.bottom-row-container {
  height: 250px;
  flex-shrink: 0;
}
</style>
