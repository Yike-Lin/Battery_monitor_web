<template>
  <div class="bento-card matrix-card">
    <div class="card-header">
      <div class="header-left">
        <span class="card-title">PACK 拓扑矩阵监控</span>
        <span class="sub-tag">32 CELLS / SERIES</span>
      </div>
      <div class="header-right">
        <div class="legend">
          <span class="dot normal"></span> Norm
          <span class="dot balance"></span> Bal
          <span class="dot warn"></span> Err
        </div>
      </div>
    </div>

    <div class="matrix-container">
      <div
        v-for="(cell, i) in cells"
        :key="i"
        class="cell-unit"
        :class="getCellClass(cell.status)"
      >
        <div class="cell-inner">
          <span class="cell-id">#{{ i + 1 }}</span>
          <span class="cell-val">{{ cell.volts.toFixed(2) }}V</span>
        </div>
        <div class="cell-bar" :style="{ width: (cell.volts / 4.2) * 100 + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, onUnmounted } from 'vue'

const cells = reactive(Array.from({ length: 32 }, () => ({ status: 'normal', volts: 3.7 })))
let timer: any = null

// 模拟数据跳动
const updateCells = () => {
  // 随机挑选几个电芯进行状态变化
  const targetIdx = Math.floor(Math.random() * 32)
  const rand = Math.random()

  // 恢复之前的状态
  cells.forEach(c => { if(Math.random() > 0.3) c.status = 'normal' })

  if (rand > 0.9) cells[targetIdx].status = 'warn'
  else if (rand > 0.7) cells[targetIdx].status = 'balancing'

  // 模拟电压微小波动
  cells.forEach(c => {
    c.volts = 3.6 + Math.random() * 0.6 // 3.6 ~ 4.2V
  })
}

const getCellClass = (status: string) => {
  if (status === 'warn') return 'status-warn'
  if (status === 'balancing') return 'status-bal'
  return ''
}

onMounted(() => {
  timer = setInterval(updateCells, 800)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped>
.matrix-card {
  width: 100%;
  height: 100%;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  background: rgba(0,0,0,0.2);
}
.card-title { color: #fff; font-weight: 600; font-size: 13px; }
.sub-tag { font-size: 10px; color: #666; margin-left: 8px; font-family: monospace; }

.legend { display: flex; gap: 8px; font-size: 10px; color: #888; }
.dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
.dot.normal { background: rgba(255,255,255,0.2); }
.dot.balance { background: #409eff; box-shadow: 0 0 5px #409eff; }
.dot.warn { background: #f56c6c; box-shadow: 0 0 5px #f56c6c; }

/* 矩阵布局: 8列 x 4行 */
.matrix-container {
  flex: 1;
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 8px;
}

.cell-unit {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 4px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: all 0.3s;
  cursor: default;
}

.cell-inner { z-index: 2; text-align: center; }
.cell-id { font-size: 9px; color: #555; display: block; margin-bottom: 2px; }
.cell-val { font-size: 11px; color: #ccc; font-family: 'Courier New', monospace; font-weight: bold; }

/* 状态样式 */
.status-bal { border-color: #409eff; background: rgba(64, 158, 255, 0.1); }
.status-bal .cell-val { color: #409eff; }

.status-warn { border-color: #f56c6c; background: rgba(245, 108, 108, 0.15); animation: flash 1s infinite; }
.status-warn .cell-val { color: #f56c6c; }

/* 底部进度条 */
.cell-bar {
  position: absolute; bottom: 0; left: 0; height: 2px;
  background: #74f2ce; opacity: 0.3; transition: width 0.5s;
}

@keyframes flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
