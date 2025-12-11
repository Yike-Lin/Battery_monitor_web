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

defineProps<{
  tableData: DeviceRow[]
}>()

const getSocColor = (val: number) => {
  if (val < 20) return '#ff453a'
  if (val < 50) return '#ff9f0a'
  return '#30d158'
}

const getStatusClass = (status: string) => {
  if (status === '在线') return 'badge-success'
  if (status === '告警') return 'badge-danger'
  return 'badge-offline'
}
</script>

<style scoped>
.table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
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