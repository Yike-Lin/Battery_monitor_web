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
              <el-button
                type="primary"
                :loading="saving"
                :disabled="saving || predictLoading || !form.batteryCode.trim() || form.sohPercent == null"
                @click="onSaveClick"
              >
                保存标注
              </el-button>
              <el-button :disabled="saving" @click="onResetClick">重置</el-button>
            </div>

          </el-form>
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card class="card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>保存结果</span>
            </div>
          </template>

          <div v-if="savedList.length" class="saved-list-outer" v-loading="savedListLoading" element-loading-background="rgba(20, 20, 20, 0.65)">
            <Transition name="ledger-page" mode="out-in">
              <div :key="currentPage" class="saved-list">
                <div v-for="it in pagedSavedList" :key="it.id" class="save-item">
                  <div class="save-body">
                    <div class="save-meta">
                      <div class="save-id mono">#{{ String(it.id).padStart(2, '0') }}</div>
                      <div class="save-time muted">{{ formatCreatedAt(it.createdAt) }}</div>
                    </div>

                    <div class="save-sep" />

                    <div class="save-3col">
                      <div class="col-cell">
                        <div class="col-label muted">电池</div>
                        <div class="col-value mono">{{ it.batteryCode }}</div>
                      </div>
                      <div class="col-cell">
                        <div class="col-label muted">SOH</div>
                        <div class="col-value mono accent">{{ it.sohPercent.toFixed(2) }}%</div>
                      </div>
                      <div class="col-cell">
                        <div class="col-label muted">来源</div>
                        <div class="col-value mono">{{ it.source }}</div>
                      </div>

                      <div class="col-cell">
                        <div class="col-label muted">模型</div>
                        <div class="col-value mono">{{ it.modelVersion || '—' }}</div>
                      </div>
                      <div class="col-cell">
                        <div class="col-label muted">预测</div>
                        <div class="col-value mono accent">
                          {{ it.predictedSohPercent != null ? it.predictedSohPercent.toFixed(2) + '%' : '—' }}
                        </div>
                      </div>
                      <div class="col-cell">
                        <div class="col-label muted">备注</div>
                        <div class="col-value mono">{{ it.note || '—' }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <div v-if="savedList.length" class="pager-wrap">
            <el-pagination
              background
              layout="prev, pager, next"
              :page-size="PAGE_SIZE"
              :total="savedList.length"
              :current-page="currentPage"
              @current-change="onPageChange"
            />
          </div>

          <div v-else class="muted" style="padding: 8px 0; font-size: 12px">
            还没有保存记录。填写好后点击“保存标注”。
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import axios, { isAxiosError } from 'axios'
import { computed, onMounted, reactive, ref, watch } from 'vue'
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

// 保存结果列表项
type SohSavedItem = {
  id: number
  batteryCode: string
  sohPercent: number
  source: string
  modelVersion: string | null
  predictedSohPercent: number | null
  note: string | null
  createdAt: string
}

const savedList = ref<SohSavedItem[]>([])
let inFlightLoadSaved: Promise<void> | null = null
const savedListLoading = ref(false)
const PAGE_SIZE = 10
const currentPage = ref(1)

const pagedSavedList = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return savedList.value.slice(start, start + PAGE_SIZE)
})

function onPageChange(page: number) {
  currentPage.value = page
}

function formatCreatedAt(iso: string) {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString()
  } catch {
    return iso
  }
}

function calcPageForItemId(itemId: number | null | undefined) {
  if (itemId == null) return null
  const idx = savedList.value.findIndex((x) => x.id === Number(itemId))
  if (idx < 0) return null
  return Math.floor(idx / PAGE_SIZE) + 1
}

function messageFromUnknown(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const d = err.response?.data
    if (typeof d === 'string' && d.trim()) return d
    if (d != null) return String(d)
    return err.message || fallback
  }
  return err instanceof Error ? err.message : fallback
}

// 拉取 SOH 标注记录（添加顺序：createdAt 升序）
async function loadSaved(limit = 2000, focusId?: number | null) {
  if (inFlightLoadSaved) return
  savedListLoading.value = true
  inFlightLoadSaved = (async () => {
    const resp = await axios.get('/api/batteries/soh-annotations', { params: { limit } })
    const raw = resp.data
    const list = Array.isArray(raw) ? raw : []
    savedList.value = (list as Record<string, unknown>[]).map(
      (x): SohSavedItem => ({
        id: Number(x.id),
        batteryCode: String(x.batteryCode ?? ''),
        sohPercent: x.sohPercent != null ? Number(x.sohPercent) : 0,
        source: String(x.source ?? ''),
        modelVersion: x.modelVersion != null ? String(x.modelVersion) : null,
        predictedSohPercent: x.predictedSohPercent != null ? Number(x.predictedSohPercent) : null,
        note: x.note != null ? String(x.note) : null,
        createdAt: x.createdAt != null ? String(x.createdAt) : new Date().toISOString(),
      }),
    )

    // 有 focusId 时，立即跳转到该记录所在页；否则保持当前页（超界时夹到最后一页）
    const pages = Math.max(1, Math.ceil(savedList.value.length / PAGE_SIZE))
    const focusedPage = calcPageForItemId(focusId)
    if (focusedPage != null) {
      currentPage.value = focusedPage
    } else {
      currentPage.value = Math.min(Math.max(currentPage.value, 1), pages)
    }
  })()

  try {
    await inFlightLoadSaved
  } finally {
    inFlightLoadSaved = null
    savedListLoading.value = false
  }
}

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
    } catch (e: unknown) {
      ElMessage.error(messageFromUnknown(e, '获取预测失败'))
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

    const resp = await axios.post('/api/batteries/soh-annotations', payload)
    ElMessage.success('保存标注成功' + (resp.data != null ? `（id=${resp.data}）` : ''))
    onResetClick()

    await loadSaved(2000, Number(resp.data))
  } catch (e: unknown) {
    ElMessage.error(messageFromUnknown(e, '保存失败'))
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
    const resp = await axios.get<{ content?: Array<Record<string, unknown>> }>('/api/batteries', {
      params: { page: 0, size: 10, batteryCode: q },
    })

    if (seq !== searchSeq) return

    const content = resp.data?.content ?? []
    const list = content
      .map((r) => r.batteryCode)
      .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)

    cb(list.slice(0, 10).map((x: string) => ({ value: x })))
  } catch {
    cb([])
  }
}

async function onBatterySelected() {
  // 选择后自动获取一次预测 SOH（并发由 inFlightPredict 锁保护）
  await loadPredicted()
}

onMounted(() => {
  loadSaved()
})
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

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #e5e7eb;
}

/* 去掉“标注对象/保存结果”下方的默认细分割线 */
.card :deep(.el-card__header) {
  border-bottom: none !important;
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

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 6px;
  flex-wrap: wrap;
}


.saved-list-outer {
  position: relative;
  min-height: 120px;
}

.saved-list {
  max-height: 560px;
  overflow: auto;
  padding-right: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  scrollbar-color: #3a3a3a transparent; /* Firefox */
  scrollbar-width: thin;
}

/* 与电池台账分页一致：淡出 → 淡入 + 轻微位移 */
.ledger-page-enter-active,
.ledger-page-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.ledger-page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.ledger-page-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.pager-wrap {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.saved-list::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.saved-list::-webkit-scrollbar-track {
  background: transparent;
}

.saved-list::-webkit-scrollbar-thumb {
  background-color: #3a3a3a;
  border-radius: 4px;
}

.saved-list::-webkit-scrollbar-thumb:hover {
  background-color: #555;
}

.save-item {
  border: 1px solid #1f1f1f;
  border-radius: 10px;
  padding: 9px 12px;
  background: #141414;
}

.save-body {
  display: flex;
  gap: 24px;
  align-items: center;
}

.save-meta {
  width: 220px;
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.save-id {
  font-size: 14px;
  line-height: 20px;
  margin-top: 0;
  color: #e5e7eb;
}

.save-id.mono {
  font-size: 18px !important;
  line-height: 20px !important;
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', Arial, sans-serif !important;
}

.save-time {
  font-size: 16px;
  line-height: 22px;
  margin-top: 6px;
  white-space: nowrap;
}

.save-time.muted {
  font-size: 18px !important;
  line-height: 22px !important;
  margin-top: 6px !important;
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', Arial, sans-serif !important;
}

.save-sep {
  width: 1px;
  background: #2a2a2a;
  margin: 0;
  flex: 0 0 auto;
  align-self: stretch;
}

.save-3col {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  column-gap: 18px;
  row-gap: 6px;
  align-items: start;
}

.col-cell {
  min-width: 0;
}

.col-label {
  font-size: 18px !important;
  line-height: 22px !important;
  margin-bottom: 2px;
  color: #8f99a8;
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', Arial, sans-serif !important;
}

.col-value {
  font-size: 18px !important;
  line-height: 22px !important;
  word-break: break-all;
  color: #ffffff;
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', Arial, sans-serif !important;
}

.accent {
  color: #38d0bd !important;
}

.save-item .muted {
  color: #8f99a8;
  font-size: 18px !important;
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', Arial, sans-serif !important;
}

.save-item .mono {
  font-size: 18px !important;
  color: #ffffff;
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', Arial, sans-serif !important;
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

.filter-dark .el-autocomplete-suggestion__wrap::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.filter-dark .el-autocomplete-suggestion__wrap::-webkit-scrollbar-track {
  background: transparent;
}

.filter-dark .el-autocomplete-suggestion__wrap::-webkit-scrollbar-thumb {
  background-color: #333;
  border-radius: 4px;
}

.filter-dark .el-autocomplete-suggestion__wrap::-webkit-scrollbar-thumb:hover {
  background-color: #555;
}
</style>

