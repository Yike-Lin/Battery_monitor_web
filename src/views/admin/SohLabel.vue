<template>
  <div class="page">
    <el-row :gutter="16" class="section">
      <el-col :span="10">
        <el-card class="card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>标注对象</span>
            </div>
          </template>

          <el-form :model="form" label-width="90px" class="filter-dark" @submit.prevent>
            <el-form-item label="电池ID">
              <el-autocomplete
                v-model="form.batteryCode"
                clearable
                :fetch-suggestions="queryBatterySuggestions"
                value-key="value"
                placeholder="输入电池ID关键词并选择（例如：batch2_b1c）"
                @select="onBatterySelected"
              />
            </el-form-item>

            <el-form-item label="SOH(%)">
              <el-input-number v-model="form.sohPercent" :min="0" :max="100" :step="0.1" controls-position="right" style="width: 100%" />
            </el-form-item>

            <div class="predicted-row">
              <span class="muted">预测值：</span>
              <span class="mono">
                {{ predictedSohPercent != null ? predictedSohPercent.toFixed(2) + '%' : '—' }}
              </span>
            </div>

            <el-form-item label="来源">
              <el-select v-model="form.source" placeholder="请选择" size="large" style="width: 100%">
                <el-option label="人工标注" value="manual" />
                <el-option label="实验室结果" value="lab" />
                <el-option label="模型预测" value="predicted" />
                <el-option label="导入/迁移" value="imported" />
              </el-select>
            </el-form-item>

            <el-form-item label="模型版本">
              <el-input v-model="form.modelVersion" placeholder="例如：model_v1 / sohnet_2026_03" clearable />
            </el-form-item>

            <el-form-item label="备注">
              <el-input v-model="form.note" type="textarea" :rows="3" placeholder="可选：标注原因/来源" />
            </el-form-item>

            <div class="form-actions">
              <el-button
                type="primary"
                :loading="predictLoading"
                @click="loadPredicted"
              >
                获取预测 SOH
              </el-button>
              <el-button type="primary" :disabled="saving" @click="onSaveClick">
                保存标注
              </el-button>
              <el-button :disabled="saving" @click="onResetClick">重置</el-button>
            </div>

            <div class="hint">
              点击“保存标注”后会写入后端 `soh_annotation` 表（标注来源/模型版本可追溯）。
            </div>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card class="card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>标注说明</span>
            </div>
          </template>

          <div class="desc">
            该页面用于给电池台账补充 SOH 真值标签，并保留来源与模型版本，便于后续训练/评估。
          </div>

          <el-divider />

          <div class="placeholder-steps">
            <div class="step">1. 选择电池（可选：会自动获取预测）</div>
            <div class="step">2. 填写 SOH(%)、来源与模型版本</div>
            <div class="step">3. 保存后写入 `soh_annotation`（后续可用于训练）</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

type SohLabelForm = {
  batteryCode: string
  sohPercent: number | null
  source: string
  modelVersion: string
  note: string
}

const form = reactive<SohLabelForm>({
  batteryCode: '',
  sohPercent: null,
  source: 'manual',
  modelVersion: '',
  note: '',
})

const saving = ref(false)
const predictLoading = ref(false)
const predictedSohPercent = ref<number | null>(null)

let inFlightPredict: Promise<void> | null = null

type BatteryListPageResp = {
  content?: Array<{
    id: number
    batteryCode?: string
    sohPercent?: number | null
  }>
}

async function loadPredicted() {
  if (inFlightPredict) return

  const code = (form.batteryCode || '').trim()
  if (!code) {
    ElMessage.warning('请先填写电池ID')
    return
  }

  predictLoading.value = true
  const codeAtStart = code
  // 先清空旧显示，避免用户切换电池后看到“上一个电池的预测值”
  predictedSohPercent.value = null
  form.sohPercent = null

  inFlightPredict = (async () => {
    try {
      // 复用台账列表的 SOH 预测结果：/api/batteries 会直接返回 sohPercent
      const resp = await axios.get<BatteryListPageResp>('/api/batteries', {
        params: { page: 0, size: 10, batteryCode: code },
      })

      const row = resp.data?.content?.[0]
      if (!row) {
        ElMessage.error(`未找到电池：${code}`)
        return
      }

      if (row.sohPercent != null) {
        const v = Number(row.sohPercent)
        if ((form.batteryCode || '').trim() === codeAtStart) {
          predictedSohPercent.value = v
          form.sohPercent = v
          form.source = 'predicted'
        }
        return
      }

      // sohPercent 为空时：复用后端预测入口 /{id}/soh-recalculate
      const updated = await axios.post(`/api/batteries/${row.id}/soh-recalculate`)
      const soh = updated.data?.sohPercent != null ? Number(updated.data.sohPercent) : null
      if ((form.batteryCode || '').trim() === codeAtStart) {
        predictedSohPercent.value = soh
        form.sohPercent = soh
        form.source = 'predicted'
      }
    } catch (e: any) {
      const msg = e?.response?.data || e?.message || '获取预测失败'
      ElMessage.error(msg)
    }
  })()
    .finally(() => {
      inFlightPredict = null
      predictLoading.value = false
    })

  return inFlightPredict
}

// 当电池ID被清空/切换时，顺便把上一次的预测 SOH 重置掉，避免出现“输入框空了但 SOH 还显示上一个电池”的错位。
watch(
  () => form.batteryCode,
  (nv) => {
    const code = (nv || '').trim()
    if (!code) {
      predictedSohPercent.value = null
      form.sohPercent = null
    }
  },
)

const onSaveClick = async () => {
  if (!form.batteryCode.trim()) {
    ElMessage.warning('请填写电池ID')
    return
  }
  if (form.sohPercent == null) {
    ElMessage.warning('请填写 SOH(%)')
    return
  }

  saving.value = true
  try {
    const payload = {
      batteryCode: form.batteryCode.trim(),
      sohPercent: form.sohPercent,
      source: form.source,
      modelVersion: form.modelVersion ? form.modelVersion.trim() : null,
      predictedSohPercent: predictedSohPercent.value,
      note: form.note ? form.note.trim() : null,
    }

    await axios.post('/api/batteries/soh-annotations', payload)
    ElMessage.success('保存标注成功')
    onResetClick()
  } catch (e: any) {
    const msg = e?.response?.data || e?.message || '保存失败'
    ElMessage.error(msg)
  } finally {
    saving.value = false
  }
}

const onResetClick = () => {
  form.batteryCode = ''
  form.sohPercent = null
  form.note = ''
  form.source = 'manual'
  form.modelVersion = ''
  predictedSohPercent.value = null
}

type BatteryCodeSuggestion = { value: string }

let inFlightSearch: Promise<void> | null = null
let searchSeq = 0

// el-autocomplete：输入关键词后去台账搜索匹配电池ID
async function queryBatterySuggestions(queryString: string, cb: (sugs: BatteryCodeSuggestion[]) => void) {
  const q = (queryString || '').trim()
  if (!q) {
    cb([])
    return
  }

  const seq = ++searchSeq
  try {
    const resp = await axios.get('/api/batteries', {
      params: { page: 0, size: 10, batteryCode: q },
    })

    if (seq !== searchSeq) return

    const content = resp.data?.content || []
    const list = (content || [])
      .map((r: any) => r?.batteryCode as string)
      .filter((x: any) => typeof x === 'string' && x.trim().length > 0)

    cb(list.slice(0, 10).map((x) => ({ value: x })))
  } catch {
    cb([])
  }
}

async function onBatterySelected() {
  // 选择后自动获取一次预测 SOH（并发由 inFlightPredict 锁保护）
  await loadPredicted()
}
</script>

<style scoped>
.page {
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 1px 24px 24px 14px;
  box-sizing: border-box;
  overflow: hidden;
}

.card {
  background: #141414;
  border: 1px solid #1f1f1f;
  flex: 0 0 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.compact-header :deep(.el-card__body) {
  padding: 16px 18px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #e5e7eb;
}

::deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px 16px;
  overflow: hidden;
}

.card :deep(.el-card__body) {
  padding: 12px 16px;
  overflow: auto;
}

.section {
  margin-top: 4px;
}

.filter-dark {
  width: 100%;
}

::deep(.filter-dark .el-form-item) {
  margin-bottom: 10px !important;
}

::deep(.filter-dark .el-form-item__label) {
  color: #cfd3dc;
}

::deep(.filter-dark .el-input .el-input__wrapper) {
  background-color: #1c1c1c;
  box-shadow: 0 0 0 1px #303030 inset;
  color: #cfd3dc;
}

::deep(.filter-dark .el-input__inner) {
  color: #cfd3dc;
}

::deep(.filter-dark .el-input__inner::placeholder) {
  color: #555;
}

::deep(.filter-dark .el-input.is-focus .el-input__wrapper),
::deep(.filter-dark .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset;
}

::deep(.filter-dark .el-textarea__inner) {
  background-color: #1c1c1c;
  color: #cfd3dc;
}

::deep(.filter-dark .el-textarea__inner::placeholder) {
  color: #555;
}

::deep(.filter-dark .el-select .el-select__wrapper) {
  background-color: #1c1c1c;
  box-shadow: 0 0 0 1px #303030 inset;
  color: #cfd3dc;
}

::deep(.filter-dark .el-select .el-select__placeholder) {
  color: #555;
}

::deep(.filter-dark .el-input-number .el-input-number__wrapper) {
  background-color: #1c1c1c;
  box-shadow: 0 0 0 1px #303030 inset;
  color: #cfd3dc;
}

::deep(.form-dark .el-form-item) {
  margin-bottom: 10px !important;
}

::deep(.form-dark .el-form-item__label) {
  color: #cfd3dc;
}

::deep(.form-dark .el-input .el-input__wrapper),
::deep(.form-dark .el-textarea .el-textarea__inner),
::deep(.form-dark .el-input-number .el-input-number__decrease),
::deep(.form-dark .el-input-number .el-input-number__increase) {
  background-color: #1c1c1c;
  box-shadow: 0 0 0 1px #303030 inset;
  color: #cfd3dc;
}

::deep(.form-dark .el-input__inner::placeholder),
::deep(.form-dark .el-textarea__inner::placeholder) {
  color: #555;
}

::deep(.form-dark .el-input.is-focus .el-input__wrapper),
::deep(.form-dark .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset;
}

::deep(.form-dark .el-textarea__inner) {
  background-color: #1c1c1c;
  color: #cfd3dc;
}

.head {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.head-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title {
  font-size: 18px;
  font-weight: 800;
  color: #e5e7eb;
}

.tag {
  margin-top: 2px;
}

.head-sub {
  color: #a0a0a0;
  font-size: 13px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.hint {
  margin-top: 10px;
  color: #9aa3af;
  font-size: 12px;
}

.desc {
  color: #a0a0a0;
  font-size: 12px;
  line-height: 18px;
  padding: 2px 2px 10px 2px;
}

.placeholder-steps {
  padding: 6px 2px;
}

.step {
  color: #a0a0a0;
  font-size: 12px;
  line-height: 24px;
}

.predicted-row {
  margin-top: -4px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.muted {
  color: #9aa3af;
  font-size: 12px;
}

.mono {
  color: #e5e7eb;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}
</style>

<style>
.filter-dark .el-input__wrapper {
  background-color: #1c1c1c !important;
  box-shadow: 0 0 0 1px #303030 inset !important;
  color: #cfd3dc !important;
}

.filter-dark .el-input__inner {
  background-color: #1c1c1c !important;
  color: #cfd3dc !important;
}

.filter-dark .el-input__inner::placeholder {
  color: #555 !important;
}

.filter-dark .el-input.is-focus .el-input__wrapper,
.filter-dark .el-input__wrapper.is-focus {
  box-shadow: 0 0 0 1px #409eff inset !important;
}

.filter-dark .el-textarea__inner {
  background-color: #1c1c1c !important;
  color: #cfd3dc !important;
}

.filter-dark .el-textarea__inner::placeholder {
  color: #555 !important;
}

.filter-dark .el-select__wrapper {
  background-color: #1c1c1c !important;
  box-shadow: 0 0 0 1px #303030 inset !important;
  color: #cfd3dc !important;
}

.filter-dark .el-select__placeholder {
  color: #555 !important;
}

.filter-dark .el-input-number__wrapper {
  background-color: #1c1c1c !important;
  box-shadow: 0 0 0 1px #303030 inset !important;
  color: #cfd3dc !important;
}

.filter-dark .el-autocomplete__wrapper {
  background-color: #1c1c1c !important;
  box-shadow: 0 0 0 1px #303030 inset !important;
  color: #cfd3dc !important;
}

.filter-dark .el-autocomplete__input {
  background-color: #1c1c1c !important;
  color: #cfd3dc !important;
}

.filter-dark .el-autocomplete-suggestion__wrap {
  background-color: #141414 !important;
  border: 1px solid #1f1f1f !important;
}

.filter-dark .el-autocomplete-suggestion__item {
  color: #cfd3dc !important;
}

.filter-dark .el-autocomplete-suggestion__item:hover {
  background-color: rgba(64, 158, 255, 0.12) !important;
}
</style>

