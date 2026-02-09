<template>
  <div class="page">
    <!-- 顶部信息 -->
    <el-card class="card compact-header" shadow="never">

      <div class="header-row">
        <div class="header-left">
          <div class="main-title">
            <span class="id-text">{{ batteryId }}</span>
            <el-tag :type="statusTagType(battery?.status)" effect="dark" size="small" class="status-tag">
              {{ statusText(battery?.status) }}
            </el-tag>
          </div>
          <div class="sub-meta">
            <span>编码: {{ battery?.batteryCode || '--' }}</span>
            <el-divider direction="vertical" />
            <span>型号: {{ battery?.modelCode || '--' }}</span>
            <el-divider direction="vertical" />
            <span>客户: {{ battery?.customerName || '--' }}</span>
          </div>
        </div>

        <div class="header-metrics">
          <div class="metric-item">
            <div class="lbl">SOH</div>
            <div class="val">{{ battery?.sohPercent ?? '-' }} <span class="unit">%</span></div>
          </div>
          <div class="metric-item">
            <div class="lbl">额定容量</div>
            <div class="val">{{ battery?.ratedCapacityAh?.toFixed(2) ?? '-' }} <span class="unit">Ah</span></div>
          </div>
          <div class="metric-item">
            <div class="lbl">循环次数</div>
            <div class="val">{{ battery?.cycleCount ?? '-' }}</div>
          </div>
          <div class="metric-item">
            <div class="lbl">更新时间</div>
            <div class="val date">{{ battery?.lastRecordAt?.split(' ')[0] ?? '-' }}</div>
          </div>
        </div>

        <div class="header-actions">
          <el-button @click="back" size="small">返回</el-button>
          <el-button type="primary" @click="refresh" size="small">刷新</el-button>
        </div>
      </div>
    </el-card>

    <!-- 全生命周期曲线 -->
    <el-row :gutter="12" class="viz-section">
      <el-col :span="8">
        <el-card class="card viz-card" shadow="never">
          <div class="card-header">
            <span class="title">全生命周期趋势 (SOH/Capacity)</span>
          </div>
          <div class="chart-placeholder trend-chart">
            <div class="placeholder-text">Lifecycle Trend Chart Container</div>
          </div>
        </el-card>
      </el-col>

      <!-- 单次循环分析 -->
      <el-col :span="16">
        <el-card class="card viz-card" shadow="never">
          <div class="card-header flex-between">
            <div class="left-tools">
              <span class="title">单次循环分析</span>
              <el-input-number 
                v-model="cyclePoint" 
                :min="1" :max="cycleMax" 
                size="small" 
                controls-position="right"
                class="cycle-input"
                @change="onCycleChange"
              >
                <template #prefix>Cycle</template>
              </el-input-number>
            </div>
            
            <div class="cycle-stats-bar">
              <span class="stat">Max V: <b>3.65V</b></span>
              <span class="stat">Max T: <b class="warn">42℃</b></span>
              <span class="stat">Cap: <b>102Ah</b></span>
              <span class="stat">Time: <b>120min</b></span>
            </div>
          </div>

          <div class="chart-placeholder cycle-chart">
             <div class="placeholder-text">Current Cycle Charge/Discharge Curve Container</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 循环选择与记录表格 -->
    <el-card class="card flex-fill" shadow="never">
      <div class="detail-head">
        <div class="card-title" style="margin: 0">
          当前循环：
          <el-input-number
            v-model="cyclePoint"
            :min="1"
            :max="cycleMax"
            :step="1"
            @change="onCycleChange"
          />
        </div>
      </div>

      <div v-if="loadingRecords" class="muted" style="margin-bottom: 8px;">
        正在加载采样数据...
      </div>
      <div v-else-if="!records.length" class="muted" style="margin-bottom: 8px;">
        当前循环暂无采样数据
      </div>

      <el-table :data="records" style="width: 100%" class="fill-table" stripe>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="timeMin" label="时间(min)" min-width="120" sortable />
        <el-table-column prop="voltage" label="电压(V)" min-width="120" sortable />
        <el-table-column prop="current" label="电流(A)" min-width="120" sortable />
        <el-table-column prop="temp" label="温度(℃)" min-width="120" sortable />
        <el-table-column prop="capacity" label="容量(Ah)" min-width="120" sortable />
        <el-table-column prop="cycle" label="循环号" min-width="90" sortable />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

type Status = 1 | 2 | 3

type BatteryListItemDto = {
  id: number
  batteryCode: string
  modelCode: string | null
  customerName: string | null
  commissioningDate: string | null
  status: number | null
  ratedCapacityAh: number | null
  sohPercent: number | null
  cycleCount: number | null
  lastRecordAt: string | null
}

type BatteryDetailDto = BatteryListItemDto

type BatteryRecordDto = {
  id: number | null
  batteryId: number
  cycle: number
  timeMin: number
  voltage: number
  current: number
  temp?: number
  capacity?: number
  sourceFile?: string
  uploadBatch?: string
}

const route = useRoute()
const router = useRouter()

// 对应路由: /admin/cell-detail/:batteryId
const rawId = computed(() => route.params.batteryId)
const batteryId = computed<number | null>(() => {
  const v = Number(rawId.value)
  return Number.isNaN(v) ? null : v
})

const battery = ref<BatteryDetailDto | null>(null)
const loadingDetail = ref(false)
const loadingRecords = ref(false)
const errorMsg = ref<string | null>(null)
const cyclePoint = ref<number>(1)
const cycleMax = ref<number>(1)

const records = ref<BatteryRecordDto[]>([])

const packMetaText = computed(() => {
  const b = battery.value
  if (!b) return '用于查看单体电池台账信息与采样记录'
  return `编号：${b.batteryCode ?? '—'} · 型号：${b.modelCode ?? '—'} · 客户：${b.customerName ?? '—'}`
})

function statusText(s?: Status) {
  if (!s) return '—'
  if (s === 1) return '在役'
  if (s === 2) return '维护'
  return '退役'
}

function statusTagType(s?: Status) {
  if (!s) return 'info'
  if (s === 1) return 'success'
  if (s === 2) return 'warning'
  return 'info'
}

async function loadBatteryDetail() {
  if (!batteryId.value) {
    errorMsg.value = '路由中缺少有效的电池ID'
    console.warn('batteryId is invalid, params:', route.params)
    return
  }
  try {
    loadingDetail.value = true
    errorMsg.value = null
    const resp = await axios.get<BatteryDetailDto>(`/api/batteries/${batteryId.value}`)
    battery.value = resp.data
    console.log('battery detail:', battery.value)

    if (battery.value.cycleCount && battery.value.cycleCount > 0) {
      cycleMax.value = battery.value.cycleCount
      cyclePoint.value = battery.value.cycleCount
    } else {
      cycleMax.value = 1
      cyclePoint.value = 1
    }
  } catch (e: any) {
    console.error('加载电池详情失败', e)
    errorMsg.value = e?.response?.data?.message || '加载电池详情失败'
  } finally {
    loadingDetail.value = false
  }
}

async function loadRecordsByCycle(cycle: number) {
  if (!batteryId.value || !cycle) {
    console.warn('batteryId 或 cycle 为空', batteryId.value, cycle, route.params)
    return
  }
  try {
    loadingRecords.value = true
    errorMsg.value = null
    const resp = await axios.get<BatteryRecordDto[]>(`/api/batteries/${batteryId.value}/records/by-cycle`, {
      params: { cycle },
    })
    records.value = resp.data || []
    console.log(`records for cycle ${cycle}:`, records.value)
  } catch (e: any) {
    console.error('加载记录失败', e)
    errorMsg.value = e?.response?.data?.message || '加载记录失败'
    records.value = []
  } finally {
    loadingRecords.value = false
  }
}

async function refresh() {
  await loadBatteryDetail()
  await loadRecordsByCycle(cyclePoint.value)
}

async function onCycleChange() {
  await loadRecordsByCycle(cyclePoint.value)
}

function back() {
  router.push('/admin/battery-ledger')
}

onMounted(async () => {
  console.log('CellDetail mounted, route.params = ', route.params)
  await loadBatteryDetail()
  await loadRecordsByCycle(cyclePoint.value)
})
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 40px);
  gap: 12px;
  color: #cfd3dc;
}

.card {
  background: #141414;
  border: 1px solid #2a2a2a;
  border-radius: 4px;
}

/* 1. 顶部 Header 样式 */
.compact-header :deep(.el-card__body) {
  padding: 12px 20px;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.main-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.id-text {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.5px;
}

.sub-meta {
  font-size: 12px;
  color: #7a7a7a;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 中间指标栏 */
.header-metrics {
  display: flex;
  gap: 30px;
  background: #1a1a1a;
  padding: 6px 20px;
  border-radius: 4px;
  border: 1px solid #252525;
}

.metric-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.metric-item .lbl {
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
}
.metric-item .val {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
  margin-top: 2px;
}
.metric-item .val.date {
  font-size: 14px;
  color: #ccc;
}
.metric-item .unit {
  font-size: 11px;
  color: #666;
  font-weight: normal;
}

/* 2. 可视化区域样式 */
.viz-section {
  flex-shrink: 0;
}

.viz-card {
  height: 340px;
  display: flex;
  flex-direction: column;
}

.viz-card :deep(.el-card__body) {
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  padding: 10px 15px;
  border-bottom: 1px solid #252525;
  background: #181818;
  font-size: 14px;
  font-weight: 600;
  color: #eee;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-tools {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cycle-input {
  width: 110px;
}

/* 统计摘要条 */
.cycle-stats-bar {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #999;
}
.cycle-stats-bar b {
  color: #eee;
  margin-left: 2px;
}
.cycle-stats-bar b.warn {
  color: #e6a23c;
}

/* 图表占位符通用样式 */
.chart-placeholder {
  flex: 1;
  width: 100%;
  position: relative;
  background: linear-gradient(180deg, #141414 0%, #181818 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-text {
  color: #333;
  font-weight: 700;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* 3. 表格区域 */
.flex-fill {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border-bottom: none;
}

/* 强制让 el-card 的 body 区域填满父容器 */
.flex-fill :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  height: 100%;
  overflow: hidden;
}

.detail-head {
  padding: 10px 15px;
  background: #181818;
  border-bottom: 1px solid #252525;
  flex-shrink: 0;
}


.flex-fill :deep(.el-table) {
  flex: 1;
  width: 100%;
  height: 100% !important;
  
 
  background-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #1a1a1a;
  --el-table-border-color: #252525;
  color: #cfd3dc;
}


.flex-fill :deep(.el-table th.el-table__cell) {
  background: #1a1a1a;
  color: #999;
  font-weight: normal;
  border-bottom: 1px solid #252525;
}


.flex-fill :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #252525;
  padding: 8px 0; /* 调整行高 */
}


.flex-fill :deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background-color: transparent !important;
}


.flex-fill :deep(.el-table__body tr:hover > td.el-table__cell) {
  background-color: transparent !important;
}


.flex-fill :deep(.el-table__inner-wrapper::before) {
  display: none;
}
</style>