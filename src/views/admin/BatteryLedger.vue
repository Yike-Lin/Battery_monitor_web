<template>
  <div class="page">
    <!-- 顶部筛选 -->
    <div class="toolbar">
      <el-form :inline="true" class="filter filter-dark" @submit.prevent>
        <el-form-item label="ID">
          <el-input v-model="q.id" placeholder="如：XJTU-B001" clearable />
        </el-form-item>

        <el-form-item label="型号">
          <el-input v-model="q.model" placeholder="如：18650-NCM..." clearable />
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
        <el-button type="primary" @click="onCreateClick">新增入库</el-button>
      </div>
    </div>

    <!-- 列表 -->
    <el-card class="card" shadow="never">
      <el-table :data="tableData" height="calc(100vh - 230px)" stripe>
        <el-table-column prop="batteryCode" label="ID" width="140" />
        <el-table-column prop="modelCode" label="型号" min-width="220" />
        <el-table-column prop="commissioningDate" label="投运日期" width="130" />
        <el-table-column prop="customerName" label="所属客户" min-width="140">
          <template #default="{ row }">
            <span class="muted">{{ row.customerName || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="当前状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTagType(mapStatusFromBackend(row.status))" effect="dark">
              {{ statusText(mapStatusFromBackend(row.status)) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ratedCapacityAh" label="额定容量(Ah)" width="140" />
        <el-table-column prop="sohPercent" label="SOH(%)" width="110">
          <template #default="{ row }">
            <span v-if="row.sohPercent != null" :class="sohClass(row.sohPercent)">
              {{ row.sohPercent.toFixed(1) }}
            </span>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="cycleCount" label="循环数" width="90" />
        <el-table-column prop="lastRecordAt" label="最近记录" min-width="170" />

        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="onEditClick(row)">编辑</el-button>
            <el-button link type="danger" @click="onDeleteClick(row)">删除</el-button>
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

    <!-- 弹窗组件 -->
    <BatteryFormDialog
      v-model:modelValue="dialogVisible"
      :mode="dialogMode"
      :initialForm="dialogForm"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage , ElMessageBox } from 'element-plus'
import axios from 'axios'
import BatteryFormDialog, { type BatteryForm } from '@/components/admin/BatteryFormDialog.vue'

type Status = 'in_service' | 'maintenance' | 'retired'

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

// 查询条件
const q = reactive({
  id: '',
  model: '',
  status: '' as '' | Status,
  dateRange: [] as string[],
})

const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const tableData = ref<BatteryListItemDto[]>([])

// 状态相关工具
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
function mapStatusToBackend(s: Status): number {
  if (s === 'in_service') return 1
  if (s === 'maintenance') return 2
  return 3
}
function mapStatusFromBackend(s: number | null): Status {
  if (s === 1 || s == null) return 'in_service'
  if (s === 2) return 'maintenance'
  return 'retired'
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

// 列表查询
async function doQuery() {
  const params: any = {
    page: page.value - 1,
    size: pageSize.value,
  }
  if (q.id) params.batteryCode = q.id
  if (q.model) params.modelCode = q.model
  if (q.status) params.status = mapStatusToBackend(q.status)
  if (q.dateRange?.length === 2) {
    params.commissioningDateStart = q.dateRange[0]
    params.commissioningDateEnd = q.dateRange[1]
  }

  const resp = await axios.get('/api/batteries', { params })
  const pageData = resp.data
  total.value = pageData.totalElements
  tableData.value = pageData.content as BatteryListItemDto[]
}

function resetQuery() {
  q.id = ''
  q.model = ''
  q.status = ''
  q.dateRange = []
  page.value = 1
  doQuery()
}

onMounted(() => {
  doQuery()
})

/** 弹窗相关 */
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const dialogForm = ref<BatteryForm | undefined>(undefined)

function onCreateClick() {
  dialogMode.value = 'create'
  dialogForm.value = {
    batteryCode: '',
    modelCode: '',
    customerName: '',
    commissioningDate: '2024-01-01',
    statusFrontend: 'in_service',
    ratedCapacityAh: 2.0,
    sohPercent: 100,
    cycleCount: 0,
    lastRecordAt: formatNow(),
  }
  dialogVisible.value = true
}

function onEditClick(row: BatteryListItemDto) {
  dialogMode.value = 'edit'
  dialogForm.value = {
    id: row.id,
    batteryCode: row.batteryCode,
    modelCode: row.modelCode ?? '',
    customerName: row.customerName ?? '',
    commissioningDate: row.commissioningDate ?? '2024-01-01',
    statusFrontend: mapStatusFromBackend(row.status),
    ratedCapacityAh: row.ratedCapacityAh ?? 2.0,
    sohPercent: row.sohPercent ?? 100,
    cycleCount: row.cycleCount ?? 0,
    lastRecordAt: row.lastRecordAt ?? formatNow(),
  }
  dialogVisible.value = true
}

async function onDeleteClick(row: BatteryListItemDto) {
  try {
    await ElMessageBox.confirm(
      `确认删除电池【${row.batteryCode}】吗？`,
      '提示',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      }
    )

    await axios.delete(`/api/batteries/${row.id}`)
    ElMessage.success('已删除')
    doQuery()
  } catch {
    // 取消
  }
}

// 收到子组件的保存事件后，调后端接口
async function handleSave(form: BatteryForm) {
  const payload = {
    // id: from.id,
    batteryCode: form.batteryCode,
    modelCode: form.modelCode,
    customerName: form.customerName,
    commissioningDate: form.commissioningDate,
    status: mapStatusToBackend(form.statusFrontend),
    ratedCapacityAh: form.ratedCapacityAh,
    sohPercent: form.sohPercent,
    cycleCount: form.cycleCount,
    lastRecordAt: form.lastRecordAt,
  }

  // // 新增：统一调用 POST /api/batteries
  // await axios.post('/api/batteries', payload)

try {
    if (dialogMode.value === 'create') {
      await axios.post('/api/batteries', payload)
    } else {
      if (!form.id) {
        ElMessage.error('缺少电池ID，无法编辑')
        return
      }
      await axios.put(`/api/batteries/${form.id}`, payload)
    }

    ElMessage.success('已保存')
    dialogVisible.value = false
    doQuery()
  } catch (error: any) {
    if (error.response) {
      const msg = error.response.data || '保存失败'
      ElMessage.error(msg)
    } else {
      ElMessage.error('网络异常或服务器错误')
    }
  }
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

.soh { font-weight: 600; }
.soh.good { color: #67c23a; }
.soh.mid { color: #e6a23c; }
.soh.bad { color: #909399; }

/* 表格整体深色风格 */
:deep(.el-table) {
  background-color: transparent;
  color: #cfd3dc;
}

/* 表头 */
:deep(.el-table th.el-table__cell) {
  background: #141414;
  color: #cfd3dc;
}

/* 普通行背景 */
:deep(.el-table tr) {
  background: #141414;
}

/* 斑马纹行背景，稍微深一点 */
:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background: #161616;
}

/* 去掉 hover 高亮（改成接近原来的深色） */
:deep(.el-table__body tr:hover > td) {
  background-color: #1a1a1a !important;
}

/* 单元格边框 */
:deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #1f1f1f;
}

/* ========== 顶部筛选表单：只在 .filter-dark 内生效 ========== */

/* el-input 深色 */
:deep(.filter-dark .el-input .el-input__wrapper) {
  background-color: #1c1c1c;
  box-shadow: 0 0 0 1px #303030 inset;
  color: #cfd3dc;
}

/* input 的 placeholder 颜色 */
:deep(.filter-dark .el-input__inner::placeholder) {
  color: #555;
}

/* 聚焦时边框颜色稍微高亮一点 */
:deep(.filter-dark .el-input.is-focus .el-input__wrapper),
:deep(.filter-dark .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset;
}

/* el-select 深色 */
:deep(.filter-dark .el-select .el-select__wrapper) {
  background-color: #1c1c1c;
  box-shadow: 0 0 0 1px #303030 inset;
  color: #cfd3dc;
}

/* el-select placeholder */
:deep(.filter-dark .el-select .el-select__placeholder) {
  color: #555;
}

/* el-date-picker 深色（输入框部分） */
:deep(.filter-dark .el-date-editor.el-input__wrapper) {
  background-color: #1c1c1c;
  box-shadow: 0 0 0 1px #303030 inset;
  color: #cfd3dc;
}

/* 日期文字和 placeholder */
:deep(.filter-dark .el-date-editor .el-input__inner) {
  color: #cfd3dc;
}
:deep(.filter-dark .el-date-editor .el-input__inner::placeholder) {
  color: #555;
}

/* 顶部筛选项标签颜色 */
:deep(.filter-dark .el-form-item__label) {
  color: #cfd3dc;
}
</style>