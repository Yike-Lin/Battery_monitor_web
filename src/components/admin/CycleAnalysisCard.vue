<template>
  <el-card class="card viz-card" shadow="never">
    <div class="card-header flex-between">
      <div class="left-tools">
        <span class="title">单次循环分析</span>
        <el-input-number 
          v-model="internalCycle" 
          :min="1" 
          :max="cycleMax" 
          size="small" 
          controls-position="right"
          class="cycle-input"
          @change="onCycleChange"
        >
          <template #prefix>Cycle</template>
        </el-input-number>
      </div>
      
      <div class="cycle-stats-bar">
        <span class="stat">Max V: <b>{{ stats.maxV }}V</b></span>
        <span class="stat">Min V: <b>{{ stats.minV }}V</b></span>
        <span class="stat">Max T: <b class="warn">{{ stats.maxT }}℃</b></span>
        <span class="stat">Time: <b>{{ stats.duration }}min</b></span>
      </div>
    </div>

    <div class="chart-placeholder cycle-chart" ref="chartRef"></div>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps<{
  modelValue: number
  cycleMax: number
  records: any[]
}>()

const emit = defineEmits(['update:modelValue', 'change'])

const internalCycle = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const onCycleChange = (val: number | undefined) => {
  if (val) emit('change', val)
}


const stats = computed(() => {
  const data = props.records
  if (!data || data.length === 0) {
    return { maxV: '-', minV: '-', maxT: '-', duration: '-' }
  }

  let maxV = -Infinity
  let minV = Infinity
  let maxT = -Infinity
  const duration = data[data.length - 1]?.timeMin ?? '-'

  for (const rec of data) {
    if (rec.voltage > maxV) maxV = rec.voltage
    if (rec.voltage < minV) minV = rec.voltage
    if (rec.temp !== undefined && rec.temp > maxT) maxT = rec.temp
  }

  return {
    maxV: maxV === -Infinity ? '-' : maxV.toFixed(2),
    minV: minV === Infinity ? '-' : minV.toFixed(2),
    maxT: maxT === -Infinity ? '-' : maxT.toFixed(1),
    duration: duration
  }
})


const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const initChart = () => {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value, 'dark', { backgroundColor: 'transparent' })
    updateChart()
    window.addEventListener('resize', resizeChart)
  }
}

const updateChart = () => {
  if (!chartInstance) return
  const data = props.records

  if (!data || data.length === 0) {
    chartInstance.clear()
    chartInstance.setOption({
      title: { text: '暂无当前循环数据', left: 'center', top: 'center', textStyle: { color: '#999', fontSize: 14, fontWeight: 'normal' } },
      backgroundColor: 'transparent'
    })
    return
  }

  const times = data.map(item => item.timeMin)
  const voltages = data.map(item => item.voltage)
  const currents = data.map(item => item.current)

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross'},
        formatter: (params: any) => {
        if (!params || !params.length) return ''
        const first = params[0]
        const xRaw = Number(first.axisValue)
        const x = isNaN(xRaw) ? first.axisValue : xRaw.toFixed(0)

        let html = `Time: ${x} min<br/>`
        params.forEach((p: any) => {
            const valNum = Number(p.data)
            const val = isNaN(valNum) ? p.data : valNum.toFixed(3)
            html += `${p.marker}${p.seriesName}: ${val}<br/>`
        })
        return html
        },
    },
    legend: { data: ['电压 (V)', '电流 (A)'], textStyle: { color: '#ccc' }, top: 5 },
    grid: { top: 40, bottom: 30, left: 50, right: 50, containLabel: true },
    xAxis: {
        type: 'category',
        boundaryGap: false,
        data: times,
        name: '时间(min)',
        nameLocation: 'middle',
        nameGap: 25,
        axisLabel: {
            interval: 10,
            formatter: (value: string | number) => {
                const num = Number(value)
                return isNaN(num) ? value : num.toFixed(0)
            },
        },
    },
    yAxis: [{
        type: 'value',
        name: '电压 (V)',
        position: 'left',
        axisLine: { show: true, lineStyle: { color: '#409eff' } },
        splitLine: { lineStyle: { color: '#333', type: 'dashed' } },
        axisLabel: {
            formatter: (value: number) => value.toFixed(2),
        },
    },
    {
        type: 'value',
        name: '电流 (A)',
        position: 'right',
        axisLine: { show: true, lineStyle: { color: '#67c23a' } },
        splitLine: { show: false },
        axisLabel: {
            formatter: (value: number) => value.toFixed(2),
        },
    }],
    series: [
      { name: '电压 (V)', type: 'line', yAxisIndex: 0, showSymbol: false, smooth: true, itemStyle: { color: '#409eff' }, data: voltages },
      { name: '电流 (A)', type: 'line', yAxisIndex: 1, showSymbol: false, smooth: true, itemStyle: { color: '#67c23a' }, data: currents }
    ]
  }
  chartInstance.setOption(option, true)
}

const resizeChart = () => chartInstance?.resize()

// 监听 records 数据变化，更新图表
watch(() => props.records, () => {
  nextTick(() => updateChart())
}, { deep: true })

onMounted(() => nextTick(() => initChart()))

onUnmounted(() => {
  window.removeEventListener('resize', resizeChart)
  chartInstance?.dispose()
})
</script>

<style scoped>
.card { background: #141414; border: 1px solid #2a2a2a; border-radius: 10px; }
.viz-card { height: 340px; display: flex; flex-direction: column; }
.viz-card :deep(.el-card__body) { padding: 0; height: 100%; display: flex; flex-direction: column; }
.card-header { padding: 1px 15px; border-bottom: 1px solid #252525; background: #181818; font-size: 16px; font-weight: 600; color: #eee; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.left-tools { display: flex; align-items: center; gap: 12px; }
.cycle-input { width: 110px; }
.cycle-stats-bar { display: flex; gap: 15px; font-size: 12px; color: #999; }
.cycle-stats-bar b { color: #eee; margin-left: 2px; }
.cycle-stats-bar b.warn { color: #e6a23c; }
.chart-placeholder { flex: 1; width: 100%; position: relative; background: linear-gradient(180deg, #141414 0%, #181818 100%); display: flex; align-items: center; justify-content: center; }
</style>