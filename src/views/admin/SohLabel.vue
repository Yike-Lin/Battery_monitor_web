<template>
  <div class="page">
    <el-card class="card compact-header" shadow="never">
      <div class="head">
        <div class="head-title">
          <span class="title">电池SOH标注</span>
          <el-tag type="info" effect="dark" size="small" class="tag">
            功能开发中
          </el-tag>
        </div>
        <div class="head-sub">用于人工/算法标注电池 SOH 相关标签，便于后续训练与评估。</div>
      </div>
    </el-card>

    <el-row :gutter="16" class="section">
      <el-col :span="10">
        <el-card class="card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>标注对象</span>
            </div>
          </template>

          <el-form :model="form" label-width="90px" class="form-dark" @submit.prevent>
            <el-form-item label="电池ID">
              <el-input v-model="form.batteryCode" placeholder="例如：batch2_b1c12" clearable />
            </el-form-item>

            <el-form-item label="SOH(%)">
              <el-input-number v-model="form.sohPercent" :min="0" :max="100" :step="0.1" controls-position="right" style="width: 100%" />
            </el-form-item>

            <el-form-item label="备注">
              <el-input v-model="form.note" type="textarea" :rows="3" placeholder="可选：标注原因/来源" />
            </el-form-item>

            <div class="form-actions">
              <el-button type="primary" :disabled="saving" @click="onSaveClick">
                保存标注
              </el-button>
              <el-button :disabled="saving" @click="onResetClick">重置</el-button>
            </div>

            <div class="hint">
              当前页面只搭建前端界面与路由入口，保存逻辑尚未接入后端接口。
            </div>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card class="card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>历史标注</span>
            </div>
          </template>

          <el-empty description="暂无历史标注数据（占位）" />

          <el-divider />

          <div class="placeholder-steps">
            <div class="step">1. 选择电池与标注 SOH</div>
            <div class="step">2. 保存后写入标注表（后端待实现）</div>
            <div class="step">3. 用于 SOH 训练/校准（后续扩展）</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

type SohLabelForm = {
  batteryCode: string
  sohPercent: number | null
  note: string
}

const form = reactive<SohLabelForm>({
  batteryCode: '',
  sohPercent: null,
  note: '',
})

const saving = ref(false)

const onSaveClick = async () => {
  saving.value = true
  try {
    ElMessage.warning('SOH标注功能开发中：保存逻辑暂未接入后端。')
  } finally {
    saving.value = false
  }
}

const onResetClick = () => {
  form.batteryCode = ''
  form.sohPercent = null
  form.note = ''
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
  flex: 1;
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
}

.section {
  margin-top: 16px;
}

.form-dark {
  width: 100%;
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

.placeholder-steps {
  padding: 6px 2px;
}

.step {
  color: #a0a0a0;
  font-size: 12px;
  line-height: 24px;
}
</style>

