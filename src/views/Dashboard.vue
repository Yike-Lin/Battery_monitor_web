<template>
  <div class="dashboard-container">

    <div class="grid-row kpi-row">
      <div class="bento-card kpi-card" v-for="item in kpiList" :key="item.key">
        <div class="kpi-icon-bg">
          <span class="dot"></span>
        </div>
        <div class="kpi-content">
          <div class="kpi-label">{{ item.label }}</div>
          <div class="kpi-value-group">
            <span class="kpi-value">{{ item.value }}</span>
            <span class="kpi-unit" v-if="item.unit">{{ item.unit }}</span>
          </div>
          <div class="kpi-sub" :class="{ 'trend-up': item.trend > 0 }">
            {{ item.sub }}
          </div>
        </div>
      </div>
    </div>

    <div class="grid-row middle-row">
      <div class="bento-card middle-left">
        <div class="card-header">
          <span class="card-title">实时功率监控</span>
          <div class="card-actions">
             <span class="status-tag">Live</span>
          </div>
        </div>
        <div ref="mainChartRef" class="chart-container"></div>
      </div>

      <div class="middle-right-col">
        <div class="bento-card small-card">
          <div class="card-header">
            <span class="card-title">在线状态</span>
          </div>
          <div ref="statusChartRef" class="chart-container"></div>
        </div>

        <div class="bento-card small-card">
          <div class="card-header">
            <span class="card-title">告警分布</span>
          </div>
          <div ref="alarmChartRef" class="chart-container"></div>
        </div>
      </div>
    </div>

    <div class="grid-row bottom-row">
      <div class="bento-card table-card">
        <div class="card-header">
          <span class="card-title">设备运行列表</span>
          <span class="view-all">View All ></span>
        </div>
        <div class="apple-table-wrapper">
          <el-table :data="tableData" style="width: 100%" height="100%" :header-cell-style="{ background: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.1)' }">
            <el-table-column prop="deviceNo" label="设备 ID" min-width="120" />
            <el-table-column prop="plateNo" label="车牌号" width="120" />
            <el-table-column prop="soc" label="SOC" width="100">
              <template #default="scope">
                <div class="soc-wrapper">
                  <span class="soc-text">{{ scope.row.soc }}%</span>
                  <div class="soc-bar-bg">
                    <div class="soc-bar-fill" :style="{ width: scope.row.soc + '%', background: getSocColor(scope.row.soc) }"></div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="voltage" label="电压 (V)" width="100" />
            <el-table-column prop="current" label="电流 (A)" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <span class="status-badge" :class="getStatusClass(scope.row.status)">
                  {{ scope.row.status }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="alarm" label="告警信息" min-width="150" show-overflow-tooltip />
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'

// --- 数据定义 ---
const kpiList = ref([
  { key: 'device', label: '接入设备', value: '1,280', unit: '台', sub: '+12 (今日)', trend: 1 },
  { key: 'online', label: '在线率', value: '88.3', unit: '%', sub: '稳定运行', trend: 0 },
  { key: 'alarm', label: '待处理告警', value: '3', unit: '条', sub: '需立即关注', trend: -1 },
  { key: 'energy', label: '累计充放电', value: '8.32', unit: 'MWh', sub: '+12.5%', trend: 1 },
])

const tableData = ref([
  { deviceNo: 'DEV-001', plateNo: '粤A·12345', soc: 82, voltage: 356, current: 120, temperature: 28, status: '在线', alarm: '—' },
  { deviceNo: 'DEV-002', plateNo: '粤B·54321', soc: 15, voltage: 340, current: 180, temperature: 42, status: '告警', alarm: '电池温度过高' },
  { deviceNo: 'DEV-003', plateNo: '粤C·88888', soc: 0, voltage: 0, current: 0, temperature: 0, status: '离线', alarm: '通信中断' },
  { deviceNo: 'DEV-004', plateNo: '粤D·66666', soc: 65, voltage: 350, current: 80, temperature: 30, status: '在线', alarm: '—' },
  { deviceNo: 'DEV-005', plateNo: '粤E·99999', soc: 98, voltage: 360, current: 10, temperature: 26, status: '在线', alarm: '—' },
])

// --- 辅助函数 ---
const getSocColor = (val: number) => {
  if (val < 20) return '#ff453a' // Apple Red
  if (val < 50) return '#ff9f0a' // Apple Orange
  return '#30d158' // Apple Green
}

const getStatusClass = (status: string) => {
  if (status === '在线') return 'badge-success'
  if (status === '告警') return 'badge-danger'
  return 'badge-offline'
}

// --- 图表相关 ---
const mainChartRef = ref<HTMLDivElement | null>(null)
const statusChartRef = ref<HTMLDivElement | null>(null)
const alarmChartRef = ref<HTMLDivElement | null>(null)

let mainChart: echarts.ECharts | null = null
let statusChart: echarts.ECharts | null = null
let alarmChart: echarts.ECharts | null = null

// 配色：蓝色, 绿色, 橙色, 红色, 紫色 (借鉴iOS System Colors)
const colors = {
  blue: '#0a84ff',
  green: '#30d158',
  orange: '#ff9f0a',
  red: '#ff453a',
  grid: 'rgba(255, 255, 255, 0.1)',
  text: '#86868b', // Apple secondary text color
  textLight: '#f5f5f7'
}

const initCharts = () => {
  // 1. 大图：功率/电流 (使用平滑曲线 + 区域渐变)
  if (mainChartRef.value) {
    mainChart = echarts.init(mainChartRef.value)
    mainChart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(28, 28, 30, 0.8)',
        borderColor: '#333',
        textStyle: { color: '#fff' }
      },
      grid: { left: 10, right: 10, top: 30, bottom: 10, containLabel: true },
      legend: {
        icon: 'circle',
        right: 10,
        textStyle: { color: colors.text }
      },
      xAxis: {
        type: 'category',
        data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
        axisLabel: { color: colors.text },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      yAxis: [
        {
          type: 'value',
          splitLine: { lineStyle: { type: 'dashed', color: colors.grid } },
          axisLabel: { color: colors.text }
        }
      ],
      series: [
        {
          name: '有功功率',
          type: 'line',
          smooth: true,
          showSymbol: false,
          itemStyle: { color: colors.blue },
          lineStyle: { width: 3 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(10, 132, 255, 0.4)' },
              { offset: 1, color: 'rgba(10, 132, 255, 0)' }
            ])
          },
          data: [120, 180, 260, 310, 280, 220, 150]
        },
        {
          name: '电流',
          type: 'line',
          smooth: true,
          showSymbol: false,
          itemStyle: { color: colors.green },
          lineStyle: { width: 3 },
          data: [80, 110, 150, 190, 170, 130, 90]
        }
      ]
    })
  }

  // 2. 状态分布 (环形图)
  if (statusChartRef.value) {
    statusChart = echarts.init(statusChartRef.value)
    statusChart.setOption({
      tooltip: { trigger: 'item' },
      series: [
        {
          name: '设备状态',
          type: 'pie',
          radius: ['50%', '75%'],
          center: ['50%', '50%'],
          itemStyle: {
            borderRadius: 5,
            borderColor: '#1c1c1e', // Match card bg
            borderWidth: 2
          },
          label: { show: false },
          data: [
            { value: 1100, name: '在线', itemStyle: { color: colors.green } },
            { value: 150, name: '告警', itemStyle: { color: colors.red } },
            { value: 150, name: '离线', itemStyle: { color: '#636366' } },
          ]
        }
      ]
    })
  }

  // 3. 告警分布 (柱状图 - 圆角)
  if (alarmChartRef.value) {
    alarmChart = echarts.init(alarmChartRef.value)
    alarmChart.setOption({
      grid: { left: 0, right: 0, top: 10, bottom: 0, containLabel: true },
      xAxis: {
        type: 'category',
        data: ['一般', '重要', '严重'],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: colors.text }
      },
      yAxis: { show: false },
      series: [
        {
          type: 'bar',
          barWidth: 20,
          itemStyle: {
            borderRadius: [4, 4, 4, 4],
            color: (params: any) => {
               const c = [colors.blue, colors.orange, colors.red];
               return c[params.dataIndex] || colors.blue;
            }
          },
          label: {
            show: true,
            position: 'top',
            color: colors.textLight
          },
          data: [100, 40, 10]
        }
      ]
    })
  }
}

const resizeCharts = () => {
  mainChart?.resize()
  statusChart?.resize()
  alarmChart?.resize()
}

onMounted(() => {
  nextTick(() => {
    initCharts()
    window.addEventListener('resize', resizeCharts)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  mainChart?.dispose()
  statusChart?.dispose()
  alarmChart?.dispose()
})
</script>

<style scoped>
/* --- 布局容器 --- */
.dashboard-container {
  height: 100%;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px; /* 增加间距，增加呼吸感 */
}

/* --- 通用 Bento 卡片风格 --- */
.bento-card {
  background: rgba(30, 30, 30, 0.6); /* 深灰半透明 */
  backdrop-filter: blur(20px);         /* 毛玻璃核心 */
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;                 /* 大圆角 */
  border: 1px solid rgba(255, 255, 255, 0.08); /* 极细微的白边 */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);   /* 柔和阴影 */
  overflow: hidden;
  display: flex;
  flex-direction: column;
  color: #f5f5f7;
  transition: transform 0.2s ease;
}

/* 鼠标悬停微动效，增加质感 */
.bento-card:hover {
  border-color: rgba(255, 255, 255, 0.15);
}

.card-header {
  height: 48px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #f5f5f7;
  letter-spacing: 0.5px;
}

.view-all {
  font-size: 12px;
  color: #86868b;
  cursor: pointer;
}

.status-tag {
  font-size: 10px;
  background: #30d158;
  color: #000;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 700;
}

.chart-container {
  flex: 1;
  width: 100%;
  min-height: 0; /* 防止 flex 子项溢出 */
  padding: 10px;
  box-sizing: border-box;
}

/* --- Row 1: KPI --- */
.kpi-row {
  height: 110px;
  display: flex;
  gap: 16px;
}

.kpi-card {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: row; /* 横向布局 */
  align-items: flex-start;
  justify-content: space-between;
}

.kpi-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
}

.kpi-label {
  font-size: 13px;
  color: #86868b;
  font-weight: 500;
  margin-bottom: 4px;
}

.kpi-value-group {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.kpi-value {
  font-size: 28px;
  font-weight: 700; /* Apple 数字通常较粗 */
  font-family: "SF Pro Display", -apple-system, sans-serif;
  color: #fff;
}

.kpi-unit {
  font-size: 13px;
  color: #86868b;
}

.kpi-sub {
  margin-top: 6px;
  font-size: 12px;
  color: #86868b;
}

.kpi-icon-bg .dot {
  width: 8px;
  height: 8px;
  background: #0a84ff;
  border-radius: 50%;
  display: block;
  box-shadow: 0 0 10px rgba(10, 132, 255, 0.5);
}

/* --- Row 2: Charts --- */
.middle-row {
  flex: 1;
  min-height: 300px;
  display: flex;
  gap: 16px;
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

/* --- Row 3: Table --- */
.bottom-row {
  height: 280px;
  display: flex;
}

.table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.apple-table-wrapper {
  flex: 1;
  padding: 0 10px 10px 10px;
  overflow: hidden;
}

/* --- 重写 Element Plus 表格为苹果风格 --- */
:deep(.el-table) {
  background-color: transparent !important;
  color: #f5f5f7;
  --el-table-border-color: rgba(255, 255, 255, 0.05);
  --el-table-header-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(255, 255, 255, 0.08) !important;
}

:deep(.el-table th.el-table__cell) {
  background: transparent !important;
  color: #86868b;
  font-weight: 500;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

:deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
}

:deep(.el-table--enable-row-transition .el-table__body td.el-table__cell) {
  background: transparent;
}

/* SOC 进度条 */
.soc-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}
.soc-text {
  width: 32px;
  font-size: 12px;
  font-weight: 600;
}
.soc-bar-bg {
  flex: 1;
  height: 4px;
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
  overflow: hidden;
}
.soc-bar-fill {
  height: 100%;
  border-radius: 2px;
}

/* 状态徽标 */
.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}
.badge-success { background: rgba(48, 209, 88, 0.15); color: #30d158; }
.badge-danger { background: rgba(255, 69, 58, 0.15); color: #ff453a; }
.badge-offline { background: rgba(142, 142, 147, 0.15); color: #98989d; }

</style>
