<template>
  <el-card class="card viz-card" shadow="never">
    <div class="card-header">
      <span class="title">全生命周期容量趋势</span>
      <span v-if="!points || !points.length" class="small-hint">暂无生命周期数据</span>
    </div>

    <div class="chart-placeholder" ref="chartRef"></div>
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps<{
  points: { cycle: number; capacityAh: number | null }[]
}>()

const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const initChart = () => {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value, 'dark', { backgroundColor: 'transparent' })
  updateChart()
  window.addEventListener('resize', resizeChart)
}

const resizeChart = () => {
  if (!chartInstance) return
  chartInstance.resize()
}

const updateChart = () => {
  if (!chartInstance) return

  const data = props.points || []
  console.log('LifecycleCapacityCard updateChart, points:', data)

  if (!data.length) {
    chartInstance.clear()
    chartInstance.setOption({
      title: {
        text: '暂无生命周期数据',
        left: 'center',
        top: 'center',
        textStyle: { color: '#999', fontSize: 14, fontWeight: 'normal' },
      },
      backgroundColor: 'transparent',
    })
    return
  }

  const cycles = data.map(d => d.cycle)
  const capacities = data.map(d =>
    d.capacityAh == null ? null : Number(d.capacityAh.toFixed(3)),
  )

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      formatter: (params: any) => {
        if (!params || !params.length) return ''
        const p = params[0]
        const cycle = p.axisValue
        const valNum = Number(p.data)
        const val = Number.isNaN(valNum) ? '-' : valNum.toFixed(3)
        return `Cycle: ${cycle}<br/>容量: ${val} Ah`
      },
    },
    grid: { top: 30, bottom: 30, left: 55, right: 20, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: cycles,
      name: '循环号',
      nameLocation: 'middle',
      nameGap: 25,
      axisTick: { alignWithLabel: true },
      axisLabel: {
        formatter: (value: string | number) => {
          const num = Number(value)
          return Number.isNaN(num) ? value : num.toFixed(0)
        },
      },
    },
    yAxis: {
      type: 'value',
      name: '容量 (Ah)',
      axisLine: { show: true, lineStyle: { color: '#409eff' } },
      splitLine: { lineStyle: { color: '#333', type: 'dashed' } },
      axisLabel: {
        formatter: (value: number) => value.toFixed(3),
      },
    },
    series: [
      {
        name: '容量 (Ah)',
        type: 'line',
        showSymbol: true,
        smooth: false,
        symbolSize: 6,
        itemStyle: { color: '#409eff' },
        lineStyle: { width: 2 },
        data: capacities,
      },
    ],
  }

  chartInstance.setOption(option, true)
}

watch(
  () => props.points,
  () => {
    nextTick(() => updateChart())
  },
  { deep: true },
)

onMounted(async () => {
  await nextTick()
  initChart()
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeChart)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.card {
  background: #141414;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
}
.viz-card {
  height: 260px;
  display: flex;
  flex-direction: column;
}
.viz-card :deep(.el-card__body) {
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.card-header {
  padding: 4px 12px;
  border-bottom: 1px solid #252525;
  background: #181818;
  font-size: 14px;
  font-weight: 600;
  color: #eee;
}
.chart-placeholder {
  flex: 1;
  width: 100%;
}
</style>