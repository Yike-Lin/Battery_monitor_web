<template>
  <div class="page">
    <div class="toolbar">
      <el-form :inline="true" class="filter" @submit.prevent>
        <el-form-item label="ID">
          <el-input v-model="q.id" placeholder="如：XJTU-B001" clearable />
        </el-form-item>

        <el-form-item label="型号">
          <el-input v-model="q.model" placeholder="如：XJTU-18650-NCM-25℃-DST" clearable />
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="q.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="在役" value="in_service" />
            <el-option label="维护" value="maintenance" />
            <el-option label="退役" value="retired" />
          </el-select>
        </el-form-item>

        <el-form-item label="投运日期">
          <el-date-picker
            v-model="q.dateRange"
            type="daterange"
            range-separator="~"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="doQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="actions">
        <el-button type="primary" @click="openCreate">新增入库</el-button>
      </div>
    </div>

    <el-card class="card" shadow="never">
      <el-table :data="tableData" height="calc(100vh - 230px)" stripe>
        <!-- 你要求的字段 -->
        <el-table-column prop="id" label="ID" width="120" />
        <el-table-column prop="model" label="型号" min-width="220">
          <template #default="{ row }">
            <div class="model-cell">
              <div class="model-main">{{ row.model }}</div>
              <div class="model-sub muted">
                温度 {{ row.dataset.temperatureC }}℃ · 工况 {{ row.dataset.profile }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="commissionDate" label="投运日期" width="130" />
        <el-table-column prop="customer" label="所属客户" min-width="140">
          <template #default="{ row }">
            <span class="muted">{{ row.customer || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="当前状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" effect="dark">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ratedCapacityAh" label="额定容量(Ah)" width="140" />

        <!-- 可选增强（更贴近 XJTU 数据集） -->
        <el-table-column prop="health.soh" label="SOH(%)" width="110">
          <template #default="{ row }">
            <span :class="sohClass(row.health.soh)">{{ row.health.soh.toFixed(1) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="health.cycleCount" label="循环数" width="90" />
        <el-table-column prop="health.lastRecordAt" label="最近记录" width="170" />

        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="goDetail(row)">查看详情</el-button>
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" :disabled="row.status === 'retired'" @click="markRetired(row)">
              退役标记
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="total"
          :page-size="pageSize"
          v-model:current-page="page"
          @current-change="doQuery"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dlg.visible"
      :title="dlg.mode === 'create' ? '新增入库（模拟 XJTU 数据）' : '编辑电池信息'"
      width="620px"
    >
      <el-form :model="dlg.form" label-width="100px">
        <el-divider content-position="left">基础信息</el-divider>

        <el-form-item label="ID">
          <el-input v-model="dlg.form.id" :disabled="dlg.mode === 'edit'" placeholder="如：XJTU-B001" />
        </el-form-item>

        <el-form-item label="投运日期">
          <el-date-picker v-model="dlg.form.commissionDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="dlg.form.status" style="width: 180px">
            <el-option label="在役" value="in_service" />
            <el-option label="维护" value="maintenance" />
            <el-option label="退役" value="retired" />
          </el-select>
          <span class="muted" style="margin-left: 10px">（也可由 SOH 自动推断）</span>
        </el-form-item>

        <el-form-item label="额定容量">
          <el-input-number v-model="dlg.form.ratedCapacityAh" :min="0" :step="0.1" />
          <span class="muted" style="margin-left: 10px">Ah</span>
        </el-form-item>

        <el-divider content-position="left">XJTU 数据集映射（用于模拟真实台账）</el-divider>

        <el-form-item label="温度(℃)">
          <el-select v-model="dlg.form.dataset.temperatureC" style="width: 180px">
            <el-option :value="25" label="25℃" />
            <el-option :value="35" label="35℃" />
            <el-option :value="45" label="45℃" />
          </el-select>
        </el-form-item>

        <el-form-item label="工况">
          <el-select v-model="dlg.form.dataset.profile" style="width: 180px">
            <el-option value="DST" label="DST" />
            <el-option value="FUDS" label="FUDS" />
            <el-option value="US06" label="US06" />
          </el-select>
          <span class="muted" style="margin-left: 10px">（示例：常见动态工况命名）</span>
        </el-form-item>

        <el-form-item label="型号(自动)">
          <el-input v-model="dlg.form.model" disabled />
          <el-button style="margin-left: 10px" @click="regenModel">重新生成</el-button>
        </el-form-item>

        <el-divider content-position="left">健康概览（可选）</el-divider>

        <el-form-item label="SOH(%)">
          <el-input-number v-model="dlg.form.health.soh" :min="0" :max="120" :step="0.1" />
          <el-button style="margin-left: 10px" @click="applyStatusBySOH">按 SOH 推断状态</el-button>
        </el-form-item>

        <el-form-item label="循环数">
          <el-input-number v-model="dlg.form.health.cycleCount" :min="0" :step="10" />
        </el-form-item>

        <el-form-item label="最近记录">
          <el-date-picker
            v-model="dlg.form.health.lastRecordAt"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dlg.visible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

type Status = 'in_service' | 'maintenance' | 'retired'

type DatasetMeta = {
  source: 'XJTU-SOHbenchmark'
  // 这两个维度是 XJTU/同类SOH基准数据常见的实验条件维度（温度、工况）
  temperatureC: 25 | 35 | 45
  profile: 'DST' | 'FUDS' | 'US06'
  rawBatteryNo: number // Battery1..N（模拟）
}

type HealthMeta = {
  soh: number // 0~100
  cycleCount: number
  lastRecordAt: string
}

type BatteryPack = {
  id: string
  model: string
  commissionDate: string
  customer?: string
  status: Status
  ratedCapacityAh: number

  // 为了贴近数据集：扩展字段
  dataset: DatasetMeta
  health: HealthMeta
}

const router = useRouter()

/** ---------------------------
 *  XJTU 风格模拟数据生成
 *  --------------------------- */
function pad3(n: number) {
  return String(n).padStart(3, '0')
}

function formatNow(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
}

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a)
}

// 常见退役阈值：SOH < 80%
function statusBySOH(soh: number): Status {
  if (soh < 80) return 'retired'
  if (soh < 90) return 'maintenance'
  return 'in_service'
}

function genModel(meta: DatasetMeta, ratedCapacityAh: number) {
  // “型号”这里用：来源-电芯类型-温度-工况-容量，模拟真实台账命名
  // XJTU 常被用作 18650 NCM 电芯寿命数据（论文/基准常见设定）
  return `XJTU-18650-NCM-${meta.temperatureC}℃-${meta.profile}-${ratedCapacityAh.toFixed(1)}Ah`
}

function genOne(idx: number): BatteryPack {
  const temperatureC = ([25, 35, 45] as const)[idx % 3]
  const profile = (['DST', 'FUDS', 'US06'] as const)[idx % 3]
  const rawBatteryNo = idx + 1

  // 模拟：SOH 随循环降低，温度越高衰减越快（仅用于“像数据集”）
  const cycleCount = Math.floor(randomBetween(50, 900))
  const tempFactor = temperatureC === 25 ? 1 : temperatureC === 35 ? 1.15 : 1.35
  const soh = Math.max(60, 102 - cycleCount * 0.035 * tempFactor + randomBetween(-1.5, 1.5))

  // 额定容量：XJTU/18650 常见 2.0Ah（这里给 2.0 做主值，略随机）
  const ratedCapacityAh = +(randomBetween(1.95, 2.05)).toFixed(2)

  const dataset: DatasetMeta = {
    source: 'XJTU-SOHbenchmark',
    temperatureC,
    profile,
    rawBatteryNo,
  }

  const model = genModel(dataset, ratedCapacityAh)

  // 投运日期：按“最近记录往前推”模拟
  const commissionDate = `2024-${String((idx % 9) + 1).padStart(2, '0')}-${String((idx % 26) + 1).padStart(2, '0')}`

  return {
    id: `XJTU-B${pad3(rawBatteryNo)}`,
    model,
    commissionDate,
    customer: '',
    status: statusBySOH(soh),
    ratedCapacityAh,
    dataset,
    health: {
      soh: +soh.toFixed(1),
      cycleCount,
      lastRecordAt: formatNow(),
    },
  }
}

/** ---------------------------
 *  本地持久化（模拟后台）
 *  --------------------------- */
const STORAGE_KEY = 'bms_battery_ledger_xjtu_mock_v1'

function loadFromStorage(): BatteryPack[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}
function saveToStorage(list: BatteryPack[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

/** ---------------------------
 *  查询与分页
 *  --------------------------- */
const q = reactive({
  id: '',
  model: '',
  status: '' as '' | Status,
  dateRange: [] as string[],
})

const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const allData = ref<BatteryPack[]>(
  loadFromStorage() ??
    // 默认生成 18 条，接近数据集 “多个电池编号” 的感觉
    Array.from({ length: 18 }).map((_, i) => genOne(i)),
)

watch(
  () => allData.value,
  (val) => saveToStorage(val),
  { deep: true },
)

const tableData = computed(() => {
  let data = [...allData.value]

  if (q.id) data = data.filter(i => i.id.toLowerCase().includes(q.id.toLowerCase()))
  if (q.model) data = data.filter(i => i.model.toLowerCase().includes(q.model.toLowerCase()))
  if (q.status) data = data.filter(i => i.status === q.status)

  if (q.dateRange?.length === 2) {
    const [s, e] = q.dateRange
    data = data.filter(i => i.commissionDate >= s && i.commissionDate <= e)
  }

  total.value = data.length
  const start = (page.value - 1) * pageSize.value
  return data.slice(start, start + pageSize.value)
})

function doQuery() {
  // 现在用 computed 实时过滤，这里留作接口对接点
}

function resetQuery() {
  q.id = ''
  q.model = ''
  q.status = ''
  q.dateRange = []
  page.value = 1
  doQuery()
}

/** ---------------------------
 *  状态显示
 *  --------------------------- */
function statusText(s: Status) {
  return s === 'in_service' ? '在役' : s === 'maintenance' ? '维护' : '退役'
}
function statusTagType(s: Status) {
  return s === 'in_service' ? 'success' : s === 'maintenance' ? 'warning' : 'info'
}
function sohClass(soh: number) {
  if (soh < 80) return 'soh bad'
  if (soh < 90) return 'soh mid'
  return 'soh good'
}

/** ---------------------------
 *  跳转详情（注意你的路由前缀是 /admin）
 *  --------------------------- */
function goDetail(row: BatteryPack) {
  router.push(`/admin/cell-detail/${row.id}`)
}

/** ---------------------------
 *  新增/编辑
 *  --------------------------- */
const dlg = reactive({
  visible: false,
  mode: 'create' as 'create' | 'edit',
  form: null as BatteryPack | null,
})

function newForm(): BatteryPack {
  const dataset: DatasetMeta = {
    source: 'XJTU-SOHbenchmark',
    temperatureC: 25,
    profile: 'DST',
    rawBatteryNo: allData.value.length + 1,
  }

  const ratedCapacityAh = 2.0
  return {
    id: `XJTU-B${pad3(dataset.rawBatteryNo)}`,
    model: genModel(dataset, ratedCapacityAh),
    commissionDate: '2024-01-01',
    customer: '',
    status: 'in_service',
    ratedCapacityAh,
    dataset,
    health: {
      soh: 100,
      cycleCount: 0,
      lastRecordAt: formatNow(),
    },
  }
}

function openCreate() {
  dlg.mode = 'create'
  dlg.form = newForm()
  dlg.visible = true
}

function openEdit(row: BatteryPack) {
  dlg.mode = 'edit'
  // 深拷贝，避免弹窗里改动直接影响表格
  dlg.form = JSON.parse(JSON.stringify(row))
  dlg.visible = true
}

function regenModel() {
  if (!dlg.form) return
  dlg.form.model = genModel(dlg.form.dataset, dlg.form.ratedCapacityAh)
}

function applyStatusBySOH() {
  if (!dlg.form) return
  dlg.form.status = statusBySOH(dlg.form.health.soh)
}

function save() {
  if (!dlg.form) return
  if (!dlg.form.id || !dlg.form.commissionDate) {
    ElMessage.warning('请填写 ID 和投运日期')
    return
  }

  // 保存前：自动刷新型号（保持一致）
  dlg.form.model = genModel(dlg.form.dataset, dlg.form.ratedCapacityAh)

  if (dlg.mode === 'create') {
    if (allData.value.some(i => i.id === dlg.form!.id)) {
      ElMessage.error('ID 已存在')
      return
    }
    allData.value.unshift(dlg.form)
  } else {
    const idx = allData.value.findIndex(i => i.id === dlg.form!.id)
    if (idx >= 0) allData.value[idx] = dlg.form
  }

  dlg.visible = false
  ElMessage.success('已保存')
}

async function markRetired(row: BatteryPack) {
  await ElMessageBox.confirm(`确认将电池组 ${row.id} 标记为退役？`, '退役确认', { type: 'warning' })
  row.status = 'retired'
  ElMessage.success('已标记退役')
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 14px; }
.toolbar { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.filter { flex: 1; }
.actions { flex: 0 0 auto; }

.card { background: #141414; border: 1px solid #1f1f1f; }

.pager { display: flex; justify-content: flex-end; padding-top: 12px; }
.muted { color: #7a7a7a; }

.model-cell { display: flex; flex-direction: column; gap: 2px; }
.model-main { color: #cfd3dc; }
.model-sub { font-size: 12px; }

.soh { font-weight: 600; }
.soh.good { color: #67c23a; }
.soh.mid { color: #e6a23c; }
.soh.bad { color: #909399; }

:deep(.el-table) { background-color: transparent; color: #cfd3dc; }
:deep(.el-table th.el-table__cell) { background: #141414; color: #cfd3dc; }
:deep(.el-table tr) { background: #141414; }
:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background: #121212;
}
:deep(.el-table td.el-table__cell) { border-bottom: 1px solid #1f1f1f; }
</style>