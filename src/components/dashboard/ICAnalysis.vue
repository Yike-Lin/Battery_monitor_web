<template>
  <div class="bento-card ic-card">
    <div class="card-header">
      <div class="header-left">
        <span class="card-title">IC 增量容量分析</span>
      </div>
      <div class="header-right">
        <div class="soh-badge" :class="getHealthColor">
          <span class="label">SOH</span>
          <span class="value">{{ currentSOH.toFixed(1) }}%</span>
        </div>
      </div>
    </div>

    <div ref="chartRef" class="chart-container"></div>

    <div class="analysis-footer">
      <div class="legend-item">
        <span class="line ref-line"></span> Reference (Cycle 1)
      </div>
      <div class="legend-item">
        <span class="line curr-line"></span> Current (Cycle {{ currentCycle }})
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, nextTick, toRaw } from 'vue' // 1. 引入 toRaw
import * as echarts from 'echarts'
import { useEchart } from '@/composables/useEchart'

// 注意：如果你的 useEchart 返回的是 { instance }，这里解构别名要注意
// 为了安全，直接用 setOption，因为通常已经封装好了
const { chartRef, setOption, chartInstance } = useEchart() 

let animationTimer: any = null
const currentSOH = ref(100.0)
const currentCycle = ref(1)

// --- 物理模拟参数 ---
const PEAK_1_V = 3.9
const PEAK_2_V = 4.15

const generateICCurve = (shift: number, degradation: number, noiseLevel: number) => {
  const data = []
  for (let v = 3.5; v <= 4.3; v += 0.01) {
    const p1 = (1.0 * degradation) * Math.exp(-Math.pow(v - (PEAK_1_V + shift), 2) / (2 * 0.005))
    const p2 = (0.6 * degradation) * Math.exp(-Math.pow(v - (PEAK_2_V + shift), 2) / (2 * 0.004))
    let dQdV = p1 + p2 + (Math.random() - 0.5) * noiseLevel
    dQdV += 0.1
    data.push([Number(v.toFixed(2)), Number(dQdV.toFixed(3))])
  }
  return data
}

const referenceData = generateICCurve(0, 1.0, 0)

const initChart = () => {
  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    grid: { left: '10%', right: '10%', top: '15%', bottom: '15%' },
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    xAxis: {
      name: 'Voltage (V)',
      nameLocation: 'middle',
      nameGap: 25,
      type: 'value',
      min: 3.5, max: 4.3,
      splitLine: { show: false },
      axisLabel: { color: '#666', fontSize: 10 },
      axisLine: { lineStyle: { color: '#444' } }
    },
    yAxis: {
      name: 'dQ/dV (Ah/V)',
      type: 'value',
      splitLine: { show: true, lineStyle: { color: '#222', type: 'dashed' } },
      axisLabel: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        name: 'Reference (BOL)',
        type: 'line',
        data: referenceData,
        symbol: 'none',
        lineStyle: { color: '#555', width: 2, type: 'dashed', opacity: 0.6 },
        z: 1
      },
      {
        name: 'Current State',
        type: 'line',
        data: referenceData,
        symbol: 'none',
        smooth: 0.3,
        lineStyle: { width: 3, color: '#bd34fe' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(189, 52, 254, 0.4)' },
            { offset: 1, color: 'rgba(189, 52, 254, 0)' }
          ])
        },
        markPoint: {
          data: [{ type: 'max', name: 'Main Peak' }],
          itemStyle: { color: '#fff' },
          symbolSize: 40,
          label: { show: true, fontSize: 10, color: '#000', formatter: 'Peak' }
        },
        z: 2
      }
    ]
  }
  setOption(option)
}

// --- 修复重点在 startAgingDemo ---
let ageTick = 0
const startAgingDemo = () => {
  animationTimer = setInterval(() => {
    ageTick += 0.05
    
    // 模拟老化计算
    const vShift = (Math.sin(ageTick) + 1) * 0.04
    const degradation = 1.0 - ((Math.sin(ageTick) + 1) * 0.15)
    currentSOH.value = 100 * degradation
    currentCycle.value = Math.floor(1 + (Math.sin(ageTick) + 1) * 1000)

    const newData = generateICCurve(vShift, degradation, 0.02)

    // 修复 1: 优先使用 hook 提供的 setOption 函数
    // 修复 2: 如果必须用实例，必须使用 toRaw 剥离 Vue 的代理，否则会报错 "Main Process"
    
    // 方案 A：直接使用 hook 导出的 setOption (它通常已经处理了非空逻辑)
    setOption({
      series: [
        {}, 
        {
          data: newData,
          lineStyle: { color: currentSOH.value > 80 ? '#bd34fe' : '#f56c6c' },
          areaStyle: {
             color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: currentSOH.value > 80 ? 'rgba(189, 52, 254, 0.4)' : 'rgba(245, 108, 108, 0.4)' },
              { offset: 1, color: 'transparent' }
            ])
          }
        }
      ]
    })

  }, 100)
}

const getHealthColor = computed(() => {
  if (currentSOH.value > 90) return 'good'
  if (currentSOH.value > 80) return 'fair'
  return 'poor'
})

onMounted(() => {
  nextTick(() => {
    initChart()
    startAgingDemo()
  })
})

onUnmounted(() => {
  clearInterval(animationTimer)
})
</script>

<style scoped>
.ic-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.4);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.card-title { font-size: 13px; font-weight: 700; color: #ccc; }

/* SOH Badge */
.soh-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1;
}
.soh-badge .label { font-size: 9px; color: #666; font-weight: bold; margin-bottom: 2px;}
.soh-badge .value { font-size: 16px; font-weight: 800; font-family: 'Courier New', monospace; }

.soh-badge.good .value { color: #74f2ce; }
.soh-badge.fair .value { color: #e6a23c; }
.soh-badge.poor .value { color: #f56c6c; }

.chart-container { flex: 1; min-height: 0; margin: 10px 0; }

.analysis-footer {
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #888;
  background: rgba(0,0,0,0.2);
}
.legend-item { display: flex; align-items: center; gap: 6px; }
.line { width: 12px; height: 2px; display: inline-block; }
.ref-line { border-top: 2px dashed #555; }
.curr-line { background: #bd34fe; height: 3px; border-radius: 2px;}
</style>
