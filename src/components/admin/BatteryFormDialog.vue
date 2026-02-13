<template>
  <el-dialog
    v-model="visibleInner"
    :title="mode === 'create' ? '新增入库' : '编辑电池信息'"
    width="520px"
    @closed="onClosed"
  >
    <el-form :model="form" label-width="100px">
      <el-form-item label="ID">
        <el-input
          v-model="form.batteryCode"
          :disabled="mode === 'edit'"
          placeholder="如：XJTU-B001"
        />
      </el-form-item>

      <el-form-item label="型号">
        <el-input v-model="form.modelCode" placeholder="电芯型号" />
      </el-form-item>

      <el-form-item label="投运日期">
        <el-date-picker
          v-model="form.commissioningDate"
          type="date"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item label="所属客户">
        <el-input v-model="form.customerName" placeholder="客户名称" />
      </el-form-item>

      <el-form-item label="状态">
        <el-select v-model="form.statusFrontend" style="width: 180px">
          <el-option label="在役" value="in_service" />
          <el-option label="维护" value="maintenance" />
          <el-option label="退役" value="retired" />
        </el-select>
      </el-form-item>

      <el-form-item label="额定容量">
        <el-input-number v-model="form.ratedCapacityAh" :min="0" :step="0.1" />
        <span class="muted" style="margin-left: 10px">Ah</span>
      </el-form-item>

      <el-divider content-position="left">循环数据（CSV）</el-divider>

      <el-form-item label="上传CSV">
        <el-upload
          :show-file-list="false"
          :http-request="handleCsvUpload"
          accept=".csv"
        >
          <el-button>选择 CSV 文件</el-button>
        </el-upload>
        <span class="muted" style="margin-left: 10px">
          将上传的循环数据用于自动预测 SOH、填充数据
        </span>
      </el-form-item>

      <!-- 只显示当前选择的 CSV 文件名 -->
      <el-form-item v-if="csvFileName" label="当前文件">
        <span>{{ csvFileName }}</span>
      </el-form-item>

      <el-form-item label="SOH(%)">
        <el-input-number
          v-model="form.sohPercent"
          :min="0"
          :max="120"
          :step="0.1"
          :disabled="!!form.uploadToken"/>
        <span class="muted" style="margin-left: 10px">
          <template v-if="form.uploadToken">
            已绑定 CSV，SOH 将由系统自动预测
          </template>
          <template v-else>
            可手动填写，或通过上传 CSV 自动预测
          </template>
        </span>
      </el-form-item>

      <el-form-item label="循环数">
        <el-input-number v-model="form.cycleCount" :min="0" :step="10" />
      </el-form-item>

      <el-form-item label="最近记录">
        <el-date-picker
          v-model="form.lastRecordAt"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="onSaveClick">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

type Status = 'in_service' | 'maintenance' | 'retired'

export type BatteryForm = {
  id?: number
  batteryCode: string
  modelCode: string
  customerName: string
  commissioningDate: string
  statusFrontend: Status
  ratedCapacityAh: number
  sohPercent: number | null
  cycleCount: number
  lastRecordAt: string
  uploadToken?: string
}

// 组件 Props 和 Emits
const props = defineProps<{
  modelValue: boolean        // 控制弹窗显隐 v-model:modelValue
  mode: 'create' | 'edit'   // 模式
  initialForm?: BatteryForm // 初始表单数据
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'save', payload: BatteryForm): void
}>()

// 内部控制 dialog 可见性
const visibleInner = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})

// 内部表单对象
const form = reactive<BatteryForm>({
  batteryCode: '',
  modelCode: '',
  customerName: '',
  commissioningDate: '2024-01-01',
  statusFrontend: 'in_service',
  ratedCapacityAh: 2.0,
  sohPercent: null,
  cycleCount: 0,
  lastRecordAt: formatNow(),
  uploadToken: '',
})

// 当前选择的 CSV 文件名
const csvFileName = ref<string>('')

// 当父组件传入 initialForm 时，同步到内部 form
watch(
  () => props.initialForm,
  (val) => {
    if (!val) return
    Object.assign(form, val)
    // 打开弹窗时清空文件名（不回显旧文件）
    csvFileName.value = ''
  },
  { immediate: true },
)

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

function close() {
  visibleInner.value = false
}

function onClosed() {
  // 关闭时重置文件名（可选）
  csvFileName.value = ''
}

// 上传 CSV → 调用 /api/battery-csv/upload
async function handleCsvUpload(option: any) {
  const file: File = option.file
  csvFileName.value = file.name

  const formData = new FormData()
  formData.append('file', file)

  try {
    const resp = await axios.post('/api/batteries/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    console.log('CSV upload response:', resp.data)

    const draft = resp.data as {
      batteryCode?: string
      modelCode?: string
      customerName?: string
      ratedCapacityAh?: number
      cycleCount?: number
      sohPercent?: number | null
      lastRecordAt?: string
      uploadToken?: string
    }

    
    if (draft.uploadToken) {
      form.uploadToken = draft.uploadToken
    }

    
    if (draft.cycleCount != null) {
      form.cycleCount = draft.cycleCount
    }
    if (draft.lastRecordAt) {
      form.lastRecordAt = draft.lastRecordAt
    }
    if (draft.sohPercent != null) {
      form.sohPercent = Number(draft.sohPercent)
    }

    // 如果后端未来也自动解析 batteryCode / modelCode 等，也可以填：
    // if (draft.batteryCode) form.batteryCode = draft.batteryCode
    // if (draft.modelCode) form.modelCode = draft.modelCode
    // if (draft.customerName) form.customerName = draft.customerName
    // if (draft.ratedCapacityAh != null) form.ratedCapacityAh = draft.ratedCapacityAh

    ElMessage.success('CSV 解析成功，已绑定预测数据')
    option.onSuccess && option.onSuccess(resp.data, file)
  } catch (e) {
    console.error('CSV 上传异常:', e)
    ElMessage.error('CSV 解析失败')
    option.onError && option.onError(e)
  }
}

function onSaveClick() {
  if (!form.batteryCode || !form.commissioningDate) {
    ElMessage.warning('请填写 ID 和投运日期')
    return
  }
  emit('save', { ...form })
}
</script>

<style scoped>
.muted { color: #7a7a7a; }
</style>