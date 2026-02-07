<template>
  <div class="page">
    <!-- 顶部信息 -->
    <el-card class="card" shadow="never">
      <div class="pack-head">
        <div class="title">
          <div class="name">单体电池详情：{{ batteryId }}</div>
          <div class="sub muted">
            {{ packMetaText }}
          </div>
        </div>

        <div class="right">
          <el-button @click="back">返回台账</el-button>
          <el-button type="primary" @click="refresh">刷新</el-button>
        </div>
      </div>

      <div v-if="battery" class="summary">
        <div class="sum-item">
          <div class="k">电池编码</div>
          <div class="v">{{ battery.batteryCode }}</div>
        </div>
        <div class="sum-item">
          <div class="k">型号</div>
          <div class="v">{{ battery.modelCode ?? '—' }}</div>
        </div>
        <div class="sum-item">
          <div class="k">客户</div>
          <div class="v">{{ battery.customerName ?? '—' }}</div>
        </div>
        <div class="sum-item">
          <div class="k">状态</div>
          <div class="v">
            <el-tag :type="statusTagType(battery.status)" effect="dark">
              {{ statusText(battery.status) }}
            </el-tag>
          </div>
        </div>
        <div class="sum-item">
          <div class="k">SOH(%)</div>
          <div class="v">{{ battery.sohPercent ?? '—' }}</div>
        </div>
        <div class="sum-item">
          <div class="k">循环数</div>
          <div class="v">{{ battery.cycleCount ?? '—' }}</div>
        </div>
        <div class="sum-item">
          <div class="k">额定容量(Ah)</div>
          <div class="v">
            {{ battery.ratedCapacityAh != null ? battery.ratedCapacityAh.toFixed(2) : '—' }}
          </div>
        </div>
        <div class="sum-item">
          <div class="k">最近记录时间</div>
          <div class="v">{{ battery.lastRecordAt ?? '—' }}</div>
        </div>
      </div>
      <div v-else class="muted" style="margin-top: 8px;">
        正在加载电池信息...
      </div>

      <!-- 全局错误/提示 -->
      <div v-if="errorMsg" class="muted" style="color: #f56c6c; margin-top: 8px;">
        {{ errorMsg }}
      </div>
    </el-card>

    <!-- 循环选择与记录表格 -->
    <el-card class="card" shadow="never">
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

      <el-table :data="records" height="420" stripe>
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="timeMin" label="时间(min)" width="120" sortable />
        <el-table-column prop="voltage" label="电压(V)" width="120" sortable />
        <el-table-column prop="current" label="电流(A)" width="120" sortable />
        <el-table-column prop="temp" label="温度(℃)" width="120" sortable />
        <el-table-column prop="capacity" label="容量(Ah)" width="120" sortable />
        <el-table-column prop="cycle" label="循环号" width="90" sortable />
        <el-table-column prop="sourceFile" label="来源文件" min-width="180" />
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
  gap: 14px;
}

.card {
  background: #141414;
  border: 1px solid #1f1f1f;
}

.pack-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.title .name {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}
.muted {
  color: #7a7a7a;
}
.right {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.summary {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.sum-item {
  background: #101010;
  border: 1px solid #1f1f1f;
  border-radius: 8px;
  padding: 10px 12px;
}
.sum-item .k {
  font-size: 12px;
  color: #7a7a7a;
}
.sum-item .v {
  margin-top: 6px;
  color: #fff;
  font-weight: 600;
}

.detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  gap: 10px;
}
.card-title {
  color: #fff;
  font-weight: 600;
}

:deep(.el-table) {
  background-color: transparent;
  color: #cfd3dc;
}
:deep(.el-table th.el-table__cell) {
  background: #141414;
  color: #cfd3dc;
}
:deep(.el-table tr) {
  background: #141414;
}
:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background: #121212;
}
:deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #1f1f1f;
}
</style>