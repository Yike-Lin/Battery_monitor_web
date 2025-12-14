<template>
  <div class="dashboard-container">
    <KpiRow :kpi-list="kpiList" />

    <div class="grid-row middle-row">
      
      <div class="middle-side-col">
        <StatusPieCard class="small-card" />
        <AlarmBarCard class="small-card" />
      </div>

      <div class="middle-center-col">
        <RealtimePowerCard class="full-height-card" />
      </div>

      <div class="middle-side-col">
        <StatusPieCard class="small-card" />
        <AlarmBarCard class="small-card" />
      </div>
      
    </div>

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

// 1. 在这里新增两个卡片数据到数组最前面
const kpiList = ref([

  { key: 'health', label: '健康度', value: '98', unit: '分', sub: '优', trend: 1 },
  { key: 'device', label: '监控电池总数', value: '1,280', unit: '台', sub: '+12 (今日)', trend: 1 },
  { key: 'online', label: '在线率', value: '88.3', unit: '%', sub: '稳定运行', trend: 0 },
  { key: 'alarm', label: '待处理告警', value: '3', unit: '条', sub: '需立即关注', trend: -1 },
  { key: 'energy', label: '累计充电', value: '8.32', unit: 'MWh', sub: '+12.5%', trend: 1 },
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
  /* 增加一点内边距防止贴边 */
  padding: 16px; 
  box-sizing: border-box;
}

/* 公共行布局 */
.grid-row {
  display: flex;
  gap: 16px;
}

/* --- 中间行布局核心修改 Start --- */
.middle-row {
  flex: 1;
  min-height: 340px; /* 稍微调高一点，因为变成了三栏，内容可能会挤 */
}

/* 两侧列：占比 1 */
.middle-side-col {
  flex: 1; 
  display: flex;
  flex-direction: column;
  gap: 16px;
  /* 限制最小宽度，防止屏幕缩小时卡片压扁 */
  min-width: 200px; 
}

/* 中间列：占比 2 (这就是你想要的中间大，两边小) */
.middle-center-col {
  flex: 2;
  display: flex;
  flex-direction: column;
}

/* 确保中间的卡片撑满高度 */
.full-height-card {
  flex: 1;
  height: 100%;
}

/* 确保两侧的小卡片平分高度 */
.small-card {
  flex: 1;
}
/* --- 中间行布局核心修改 End --- */

.bottom-row {
  height: 280px;
}
</style>