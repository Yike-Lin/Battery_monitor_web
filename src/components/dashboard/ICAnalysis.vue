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
import { onMounted, onUnmounted, ref, computed, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useEchart } from '@/composables/useEchart'

const { chartRef, setOption, chartInstance } = useEchart()
let animationTimer: any = null

// --- 状态数据 ---
const currentSOH = ref(100.0)
const currentCycle = ref(1)

// --- 物理模拟参数 ---
// 我们用高斯函数 (Gaussian) 模拟 dQ/dV 的特征峰
// 真实的锂电池通常在 3.9V 和 4.1V 附近有两个主要氧化还原峰
const PEAK_1_V = 3.9
const PEAK_2_V = 4.15

// 1. 生成高斯曲线数据 (模拟 IC 曲线)
// mean: 峰值电压, height: 峰值强度, sigma: 峰宽, noise: 噪声大小
const generateICCurve = (shift: number, degradation: number, noiseLevel: number) => {
  const data = []
  // 电压范围 3.5V -> 4.3V
  for (let v = 3.5; v <= 4.3; v += 0.01) {
    // 峰 1 (主峰)
    const p1 = (1.0 * degradation) * Math.exp(-Math.pow(v - (PEAK_1_V + shift), 2) / (2 * 0.005))
    // 峰 2 (次峰)
    const p2 = (0.6 * degradation) * Math.exp(-Math.pow(v - (PEAK_2_V + shift), 2) / (2 * 0.004))

    // 叠加 + 随机噪声 (模拟真实数据的毛刺感)
    let dQdV = p1 + p2 + (Math.random() - 0.5) * noiseLevel

    // 基础底噪 (Base capacity)
    dQdV += 0.1

    data.push([Number(v.toFixed(2)), Number(dQdV.toFixed(3))])
  }
  return data
}

// 初始健康曲线 (Cycle 1) - 作为背景参考
const referenceData = generateICCurve(0, 1.0, 0)

// --- 初始化图表 ---
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
      axisLabel: { show: false }, // 隐藏具体数值，看趋势即可
      axisTick: { show: false }
    },
    series: [
      // 1. 参考曲线 (虚影) - 代表出厂状态
      {
        name: 'Reference (BOL)',
        type: 'line',
        data: referenceData,
        symbol: 'none',
        lineStyle: { color: '#555', width: 2, type: 'dashed', opacity: 0.6 },
        z: 1
      },
      // 2. 当前曲线 (实线) - 动态变化
      {
        name: 'Current State',
        type: 'line',
        data: referenceData, // 初始也是满血
        symbol: 'none',
        smooth: 0.3, // 稍微平滑一点
        lineStyle: { width: 3, color: '#bd34fe' }, // 赛博紫
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(189, 52, 254, 0.4)' },
            { offset: 1, color: 'rgba(189, 52, 254, 0)' }
          ])
        },
        // 标记最大峰值点 (视觉焦点)
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

// --- 模拟老化过程 (Peak Shifting Animation) ---
// 随着时间推移，峰值向右移动 (shift increase)，高度降低 (degradation decrease)
let ageTick = 0
const startAgingDemo = () => {
  animationTimer = setInterval(() => {
    ageTick += 0.05

    // 模拟老化计算
    // 1. 峰值偏移: 随着老化，内阻增加，峰值电压会右移
    const vShift = (Math.sin(ageTick) + 1) * 0.04 // 0 ~ 0.08V 偏移

    // 2. 高度衰减: 锂离子的活性材料损失 (LLI)
    const degradation = 1.0 - ((Math.sin(ageTick) + 1) * 0.15) // 1.0 ~ 0.7 (30% 衰减)

    // 3. 计算 SOH
    currentSOH.value = 100 * degradation
    currentCycle.value = Math.floor(1 + (Math.sin(ageTick) + 1) * 1000)

    // 生成新曲线 (加一点点噪声模拟实时采样)
    const newData = generateICCurve(vShift, degradation, 0.02)

    chartInstance.value?.setOption({
      series: [
        {}, // 索引0 是参考线，不动
        {
          data: newData,
          // 动态改变颜色：健康时紫色，老化严重变红色
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
