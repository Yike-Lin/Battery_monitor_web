<!-- 设备运行列表卡片 -->
<template>
    <div class="bento-card table-card">
      <div class="card-header">
        <span class="card-title">设备运行列表</span>
        <span class="view-all">View All ></span>
      </div>
      <div class="apple-table-wrapper">
        <el-table
          :data="tableData"
          style="width: 100%"
          height="100%"
          :header-cell-style="{
            background: 'transparent',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }"
        >
          <el-table-column prop="deviceNo" label="设备 ID" min-width="120" />
          <el-table-column prop="plateNo" label="车牌号" width="120" />
          <el-table-column prop="soc" label="SOC" width="100">
            <template #default="scope">
              <div class="soc-wrapper">
                <span class="soc-text">{{ scope.row.soc }}%</span>
                <div class="soc-bar-bg">
                  <div
                    class="soc-bar-fill"
                    :style="{
                      width: scope.row.soc + '%',
                      background: getSocColor(scope.row.soc)
                    }"
                  ></div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="voltage" label="电压 (V)" width="100" />
          <el-table-column prop="current" label="电流 (A)" width="100" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <span
                class="status-badge"
                :class="getStatusClass(scope.row.status)"
              >
                {{ scope.row.status }}
              </span>
            </template>
          </el-table-column>
          <el-table-column
            prop="alarm"
            label="告警信息"
            min-width="150"
            show-overflow-tooltip
          />
        </el-table>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  interface DeviceRow {
    deviceNo: string
    plateNo: string
    soc: number
    voltage: number
    current: number
    temperature: number
    status: string
    alarm: string
  }
  
  const props = defineProps<{
    tableData: DeviceRow[]
  }>()
  
  const getSocColor = (val: number) => {
    if (val < 20) return '#ff453a' // Red
    if (val < 50) return '#ff9f0a' // Orange
    return '#30d158' // Green
  }
  
  const getStatusClass = (status: string) => {
    if (status === '在线') return 'badge-success'
    if (status === '告警') return 'badge-danger'
    return 'badge-offline'
  }
  </script>
  
  <style scoped>
  .bento-card {
    background: rgba(30, 30, 30, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    color: #f5f5f7;
    transition: border-color 0.2s ease;
  }
  
  .bento-card:hover {
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  .table-card {
    flex: 1;
    display: flex;
    flex-direction: column;
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
  
  .apple-table-wrapper {
    flex: 1;
    padding: 0 10px 10px 10px;
    overflow: hidden;
  }
  
  /* Element Plus 表格苹果风 */
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
  
  /* SOC 条 */
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
    background: rgba(255, 255, 255, 0.1);
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
  .badge-success {
    background: rgba(48, 209, 88, 0.15);
    color: #30d158;
  }
  .badge-danger {
    background: rgba(255, 69, 58, 0.15);
    color: #ff453a;
  }
  .badge-offline {
    background: rgba(142, 142, 147, 0.15);
    color: #98989d;
  }
  </style>