<template>
  <div class="bento-card matrix-card">
    <div class="card-header">
      <div class="header-left">
        <span class="card-title">PACK 拓扑矩阵监控</span>
        <span class="sub-tag">{{ packId || 'N/A' }} / {{ displayedCells.length }} CELLS</span>
      </div>
      <div class="header-right">
        <div class="legend">
          <span class="dot normal"></span> Normal
          <span class="dot warn"></span> Warn
          <span class="dot alarm"></span> Alarm
        </div>
      </div>
    </div>

    <div class="matrix-container" :style="matrixStyle">
      <div
        v-for="cell in displayedCells"
        :key="cell.cellId"
        class="cell-unit"
        :class="getCellClass(cell.status)"
      >
        <div class="cell-inner">
          <span class="cell-id">{{ cell.cellId }}</span>
          <span class="cell-val">{{ formatV(cell.voltage) }}</span>
        </div>
        <div class="cell-bar" :style="{ width: barWidth(cell.voltage) }"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import axios from 'axios'

type TopologyCell = {
  cellId: string
  status: 'normal' | 'warn' | 'alarm'
  voltage?: number | null
}
type TopologySnapshot = {
  packId?: string | null
  cells?: TopologyCell[]
}

const packId = ref<string>('')
const cells = ref<TopologyCell[]>([])
const MAX_CELLS = 20
let eventSource: EventSource | null = null
let reconnectTimer: number | null = null

const displayedCells = computed(() => cells.value.slice(0, MAX_CELLS))

const matrixStyle = computed(() => {
  const n = displayedCells.value.length
  if (n <= 0) return { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }
  // 小规模时格子更大；最大 20 块时接近 5 列布局
  if (n <= 4) return { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }
  if (n <= 9) return { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }
  if (n <= 16) return { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }
  return { gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }
})

function applySnapshot(s: TopologySnapshot | null | undefined) {
  if (!s) return
  packId.value = s.packId || ''
  cells.value = (s.cells || []).slice()
}

async function fetchSnapshot() {
  try {
    const res = await axios.get<TopologySnapshot>('/api/battery-dashboard/topology/snapshot')
    applySnapshot(res.data)
  } catch {
    // ignore
  }
}

const getCellClass = (status: string) => {
  if (status === 'alarm') return 'status-alarm'
  if (status === 'warn') return 'status-warn'
  return ''
}

const formatV = (v?: number | null) => {
  if (v == null || Number.isNaN(Number(v))) return '--'
  return `${Number(v).toFixed(3)}V`
}

const barWidth = (v?: number | null) => {
  const n = Number(v)
  if (Number.isNaN(n) || n <= 0) return '0%'
  const pct = Math.max(0, Math.min(100, (n / 4.2) * 100))
  return `${pct}%`
}

function connectStream() {
  if (eventSource) eventSource.close()
  eventSource = new EventSource('/api/battery-dashboard/topology/stream')
  eventSource.addEventListener('snapshot', (ev: MessageEvent) => {
    try {
      const payload = JSON.parse(ev.data) as TopologySnapshot
      applySnapshot(payload)
    } catch {
      // ignore invalid event
    }
  })
  eventSource.onerror = () => {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    if (reconnectTimer == null) {
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null
        fetchSnapshot()
        connectStream()
      }, 3000)
    }
  }
}

onMounted(() => {
  fetchSnapshot()
  connectStream()
})

onUnmounted(() => {
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
  if (reconnectTimer != null) {
    window.clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
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
.dot.warn { background: #f56c6c; box-shadow: 0 0 5px #f56c6c; }
.dot.alarm { background: #ff2d2d; box-shadow: 0 0 6px #ff2d2d; }

.matrix-container {
  flex: 1;
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  grid-auto-rows: 1fr;
  gap: 8px;
  overflow: auto;
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
.cell-id {
  font-size: 9px;
  color: #777;
  display: block;
  margin-bottom: 2px;
  max-width: 72px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cell-val { font-size: 11px; color: #ccc; font-family: 'Courier New', monospace; font-weight: bold; }

.status-warn { border-color: #f56c6c; background: rgba(245, 108, 108, 0.15); animation: flash 1s infinite; }
.status-warn .cell-val { color: #f56c6c; }
.status-alarm { border-color: #ff2d2d; background: rgba(255, 45, 45, 0.22); animation: flash 0.7s infinite; }
.status-alarm .cell-val { color: #ff8080; }

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
