<template>
  <div class="page">
    <div class="toolbar">
      <el-form :inline="true" class="filter" @submit.prevent>
        <el-form-item label="型号">
          <el-input v-model="q.model" placeholder="如：LFP-280Ah" clearable />
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
      <el-table :data="tableData" height="calc(100vh - 230px)" class="dark-table" stripe>
        <el-table-column prop="id" label="ID" width="110" />
        <el-table-column prop="model" label="型号" min-width="160" />
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

        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="goDetail(row)">查看详情</el-button>
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button
              link
              type="danger"
              :disabled="row.status === 'retired'"
              @click="markRetired(row)"
            >
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
    <el-dialog v-model="dlg.visible" :title="dlg.mode === 'create' ? '新增入库' : '编辑电池信息'" width="520px">
      <el-form :model="dlg.form" label-width="90px">
        <el-form-item label="ID">
          <el-input v-model="dlg.form.id" :disabled="dlg.mode === 'edit'" placeholder="如：P0001" />
        </el-form-item>
        <el-form-item label="型号">
          <el-input v-model="dlg.form.model" placeholder="如：LFP-280Ah" />
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
        </el-form-item>
        <el-form-item label="额定容量">
          <el-input-number v-model="dlg.form.ratedCapacityAh" :min="0" :step="10" />
          <span class="muted" style="margin-left: 10px">Ah</span>
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
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

type Status = 'in_service' | 'maintenance' | 'retired'
type BatteryPack = {
  id: string
  model: string
  commissionDate: string
  customer?: string
  status: Status
  ratedCapacityAh: number
}

const router = useRouter()

// 查询条件
const q = reactive({
  model: '',
  status: '' as '' | Status,
  dateRange: [] as string[],
})

const page = ref(1)
const pageSize = ref(10)
const total = ref(3)

// mock 数据（后续接 API）
const allData = ref<BatteryPack[]>([
  { id: 'P0001', model: 'LFP-280Ah', commissionDate: '2024-03-01', status: 'in_service', ratedCapacityAh: 280 },
  { id: 'P0002', model: 'LFP-314Ah', commissionDate: '2023-11-15', status: 'maintenance', ratedCapacityAh: 314 },
  { id: 'P0003', model: 'NMC-200Ah', commissionDate: '2022-06-20', status: 'retired', ratedCapacityAh: 200 },
])

const tableData = computed(() => {
  let data = [...allData.value]
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
  // 接 API 时：带上 q + page + pageSize
}

function resetQuery() {
  q.model = ''
  q.status = ''
  q.dateRange = []
  page.value = 1
  doQuery()
}

function statusText(s: Status) {
  return s === 'in_service' ? '在役' : s === 'maintenance' ? '维护' : '退役'
}
function statusTagType(s: Status) {
  return s === 'in_service' ? 'success' : s === 'maintenance' ? 'warning' : 'info'
}

function goDetail(row: BatteryPack) {
  router.push(`/assets/cells/${row.id}`)
}

const dlg = reactive({
  visible: false,
  mode: 'create' as 'create' | 'edit',
  form: {
    id: '',
    model: '',
    commissionDate: '',
    status: 'in_service' as Status,
    ratedCapacityAh: 280,
  },
})

function openCreate() {
  dlg.mode = 'create'
  dlg.form = { id: '', model: '', commissionDate: '', status: 'in_service', ratedCapacityAh: 280 }
  dlg.visible = true
}

function openEdit(row: BatteryPack) {
  dlg.mode = 'edit'
  dlg.form = { ...row }
  dlg.visible = true
}

function save() {
  if (!dlg.form.id || !dlg.form.model) {
    ElMessage.warning('请填写 ID 和 型号')
    return
  }

  if (dlg.mode === 'create') {
    if (allData.value.some(i => i.id === dlg.form.id)) {
      ElMessage.error('ID 已存在')
      return
    }
    allData.value.unshift({ ...(dlg.form as any) })
  } else {
    const idx = allData.value.findIndex(i => i.id === dlg.form.id)
    if (idx >= 0) allData.value[idx] = { ...(dlg.form as any) }
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

.card {
  background: #141414;
  border: 1px solid #1f1f1f;
}

.pager { display: flex; justify-content: flex-end; padding-top: 12px; }
.muted { color: #7a7a7a; }

:deep(.el-table) { background-color: transparent; color: #cfd3dc; }
:deep(.el-table th.el-table__cell) { background: #141414; color: #cfd3dc; }
:deep(.el-table tr) { background: #141414; }
:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background: #121212;
}
:deep(.el-table td.el-table__cell) { border-bottom: 1px solid #1f1f1f; }
</style>