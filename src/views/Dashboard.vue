<template>
  <div class="dashboard-container">
    <!-- Row 1: KPI -->
    <KpiRow :kpi-list="kpiList" />

    <!-- Row 2: Charts -->
    <div class="grid-row middle-row">
      <RealtimePowerCard class="middle-left" />

      <div class="middle-right-col">
        <StatusPieCard class="small-card" />
        <AlarmBarCard class="small-card" />
      </div>
    </div>

    <!-- Row 3: Table -->
    <div class="grid-row bottom-row">
      <DeviceTableCard :table-data="tableData" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import KpiRow from '@/components/dashboard/KpiRow.vue'
import RealtimePowerCard from '@/components/dashboard/RealtimePowerCard.vue'
import StatusPieCard from '@/components/dashboard/StatusPieCard.vue'
import AlarmBarCard from '@/components/dashboard/AlarmBarCard.vue'
import DeviceTableCard from '@/components/dashboard/DeviceTableCard.vue'

const kpiList = ref([
  { key: 'device', label: '接入设备', value: '1,280', unit: '台', sub: '+12 (今日)', trend: 1 },
  { key: 'online', label: '在线率', value: '88.3', unit: '%', sub: '稳定运行', trend: 0 },
  { key: 'alarm', label: '待处理告警', value: '3', unit: '条', sub: '需立即关注', trend: -1 },
  { key: 'energy', label: '累计充电', value: '8.32', unit: 'MWh', sub: '+12.5%', trend: 1 },
  { key: 'energy', label: '累计放电', value: '9.12', unit: 'MWh', sub: '+9.0%', trend: 1 }
])

const tableData = ref([
  { deviceNo: 'DEV-001', plateNo: '粤A·12345', soc: 82, voltage: 356, current: 120, temperature: 28, status: '在线', alarm: '—' },
  { deviceNo: 'DEV-002', plateNo: '粤B·54321', soc: 15, voltage: 340, current: 180, temperature: 42, status: '告警', alarm: '电池温度过高' },
  { deviceNo: 'DEV-003', plateNo: '粤C·88888', soc: 0, voltage: 0, current: 0, temperature: 0, status: '离线', alarm: '通信中断' },
  { deviceNo: 'DEV-004', plateNo: '粤D·66666', soc: 65, voltage: 350, current: 80, temperature: 30, status: '在线', alarm: '—' },
  { deviceNo: 'DEV-005', plateNo: '粤E·99999', soc: 98, voltage: 360, current: 10, temperature: 26, status: '在线', alarm: '—' },
])
</script>

<style scoped>
.dashboard-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 公共行布局 */
.grid-row {
  display: flex;
  gap: 16px;
}

/* Row1 固定高度；具体高度在 KpiRow 控制也可以，这里指定布局就行 */
.middle-row {
  flex: 1;
  min-height: 300px;
}

.middle-left {
  flex: 2;
}

.middle-right-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.small-card {
  flex: 1;
}

.bottom-row {
  height: 280px;
}
</style>