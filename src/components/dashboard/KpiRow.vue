<template>
  <div
    class="kpi-grid-container"
    :style="{ gridTemplateColumns: `repeat(${kpiList.length}, 1fr)` }"
  >
    <div
      v-for="item in kpiList"
      :key="item.key"
      class="bento-card kpi-card"
    >

      <div class="kpi-content">
        <div class="kpi-label">{{ item.label }}</div>

        <div class="kpi-value-group">
          <span class="kpi-value">{{ item.value }}</span>
          <span class="kpi-unit" v-if="item.unit">{{ item.unit }}</span>
        </div>

        <div class="kpi-sub">{{ item.sub }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface KpiItem {
  key: string
  label: string
  value: string
  unit?: string
  sub: string
  trend: number
}

defineProps<{ kpiList: KpiItem[] }>()
</script>

<style scoped>
.kpi-grid-container {
  display: grid;
  gap: 14px;
  height: 100px;
  width: 100%;
  margin-top: -5px;
}

.bento-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  min-width: 0;
  box-sizing: border-box;
  background: rgba(30, 30, 30, 0.6);
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.1);
  text-align: center;
  padding: 16px;
}




.kpi-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}


.kpi-value-group {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 4px;
}

.kpi-value {
    font-size: 32px;
    font-weight: 700;
    color: #fff;
    line-height: 1.1;
}
.kpi-unit {
    font-size: 16px;
    color: #86868b;
    font-weight: normal;
}

.kpi-label {
    color: #86868b;
    font-size: 14px;
}

.kpi-sub {
    color: #666;
    font-size: 13px;
    margin-top: 2px;
}

@media (max-width: 1200px) {
  .kpi-value { font-size: 28px; }
  .bento-card { padding: 12px; }
}
</style>
