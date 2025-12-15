<template>
  <div class="dashboard-container">

    <!-- KPI Row 使用 Element Plus 栅格 -->
    <KpiRow :kpi-list="kpiList" />

    <!-- 中间三列布局 -->
    <el-row :gutter="16" class="middle-row" style="flex:1;">

      <el-col :span="6" class="side-col">
        <StatusPieCard class="small-card" />
        <AlarmBarCard class="small-card" />
      </el-col>

      <el-col :span="12" class="center-col">
        <RealtimePowerCard class="full-height-card" />
      </el-col>

      <el-col :span="6" class="side-col">
        <StatusPieCard class="small-card" />
        <AlarmBarCard class="small-card" />
      </el-col>

    </el-row>

    <!-- 底部设备表格 -->
    <el-row>
      <el-col :span="24" class="bottom-row">
        <DeviceTableCard :table-data="tableData" />
      </el-col>
    </el-row>

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
  padding: 16px;
  box-sizing: border-box;
}

/* 中间布局 */
.middle-row {
  flex: 1;
  min-height: 340px;
}

/* 左右列 */
.side-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-width: 200px;
}

/* 中间列 */
.center-col {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 卡片高度 */
.full-height-card {
  flex: 1;
}

.small-card {
  flex: 1;
}

/* 底部表格 */
.bottom-row {
  height: 280px;
}

</style>
