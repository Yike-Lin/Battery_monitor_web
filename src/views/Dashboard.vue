<template>
  <div class="dashboard-container">

    <!-- KPI Row 使用 Element Plus 栅格 -->
    <KpiRow :kpi-list="kpiList" />

    <!-- 中间三列布局 -->
    <el-row :gutter="16" class="middle-row" style="flex:1;">

      <el-col :span="6" class="side-col">
        <SohChart class="small-card" />
        <RishChart class="small-card" />
      </el-col>

      <el-col :span="12" class="center-col">
        <CentralMonitor class="full-height-card" />
      </el-col>

      <el-col :span="6" class="side-col">
        <SocChart class="small-card" />
        <RulChart class="small-card" />
      </el-col>

    </el-row>

    <!-- 底部设备表格 -->
    <el-row :gutter="16" class="bottom-row-container">

      <el-col :span="6" class="bottom-left">
        <ICAnalysis />
      </el-col>

      <el-col :span="12" class="bottom-center">
        <CellMatrix :table-data="tableData" />
      </el-col>

      <el-col :span="6" class="bottom-right">
        <DataCleaning />
      </el-col>

    </el-row>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import KpiRow from '@/components/dashboard/KpiRow.vue'
import SohChart from '@/components/dashboard/SohChart.vue'
import SocChart from '@/components/dashboard/SocChart.vue'
import RishChart from '@/components/dashboard/RishChart.vue'
import RulChart from '@/components/dashboard/RulChart.vue'
import CentralMonitor from '@/components/dashboard/CentralMonitor.vue'
import ICAnalysis from '@/components/dashboard/ICAnalysis.vue'
import CellMatrix from '@/components/dashboard/CellMatrix.vue'
import DataCleaning from '@/components/dashboard/DataCleaning.vue'


const kpiList = ref([

  {
    key: 'total',
    label: '接入电池组总数',
    value: '128',          // 你的系统中当前连接的所有电池数量
    unit: 'Sets',
    sub: '在线率 98.4%',   // 表示系统连接稳定性
    status: 'normal'      // 正常颜色
  },
  {
    key: 'avg_soh',
    label: '机组平均健康度',
    value: '89.2',         // 所有电池 SOH 的平均值
    unit: '%',
    sub: '整体状态良好',    // 根据平均值判断：>90优秀，>80良好
    status: 'success'     // 绿色
  },
  {
    key: 'risk',
    label: '风险预警/热失控',
    value: '3',            // 重点！监控温度或电压超标的数量
    unit: 'Alerts',
    sub: '2 高温 / 1 过压', // 简要描述报警原因
    status: 'danger'      // 红色，非常醒目，这通常是管理员第一眼要看的
  },
  {
    key: 'charging',
    label: '实时运行状态',
    value: '45/128',       // 正在充电或放电的数量 / 总数
    unit: 'Active',
    sub: '当前处于工作循环',
    status: 'warning'     // 黄色或蓝色，表示动态
  },
  {
    key: 'replacement',
    label: '待更换建议 (EOL)',
    value: '5',            // 根据 RUL 预测，寿命即将耗尽的数量
    unit: 'Units',
    sub: 'RUL < 100 周期', // 筛选出 RUL 很低的电池，提示运维去换
    status: 'info'        // 提示性颜色
  }
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
  min-height: 0;
}

/* 左右列 */
.side-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

/* 中间列 */
.center-col {
  height: 100%;
}

/* 卡片高度 */
.full-height-card {
  height: 100%;
}

.small-card {
  flex: 1;
  min-height: 0;
}

/* --- 底部行 (固定高度) --- */
.bottom-row-container {
  height: 250px; /* ❗给底部一个明确的高度，否则图表会变成 0px */
  flex-shrink: 0; /* 防止被挤压 */
}

.bottom-item {
  height: 100%; /* 让内部组件填满这 250px */
}

</style>
