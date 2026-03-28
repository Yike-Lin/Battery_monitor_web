<template>
  <div class="bento-card">
    <div class="card-header">
      <span class="card-title">电池健康度分布</span>
    </div>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import type { EChartsOption } from 'echarts'
import { useEchart } from '@/composables/useEchart'
import type { BatteryRow } from '@/composables/useBatteryRows'

const { chartRef, setOption } = useEchart()
const props = defineProps<{ batteryData?: BatteryRow[] }>()

const colors = {
  excellent: '#67c23a',
  good: '#409eff',
  fair: '#e6a23c',
  poor: '#f56c6c'
}

const processData = (list: BatteryRow[]) => {
  if (!list || list.length === 0) {
    return []
  }

  let gradeA = 0, gradeB = 0, gradeC = 0, gradeD = 0

  list.forEach(item => {
    const val = Number(item.sohPercent ?? 0)
    if (val >= 90) gradeA++
    else if (val >= 80) gradeB++
    else if (val >= 70) gradeC++
    else gradeD++
  })

  return [
    { value: gradeA, name: '优 (≥90)', itemStyle: { color: colors.excellent } },
    { value: gradeB, name: '良 (80-90)', itemStyle: { color: colors.good } },
    { value: gradeC, name: '中 (70-80)', itemStyle: { color: colors.fair } },
    { value: gradeD, name: '差 (<70)', itemStyle: { color: colors.poor } }
  ]
}

const updateChart = () => {
  const chartData = processData(props.batteryData || [])
  const finalData = chartData.length > 0 ? chartData : [
    { value: 1, name: '暂无数据', itemStyle: { color: '#555' } }
  ]

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(30,30,30,0.9)',
      borderColor: '#444',
      textStyle: { color: '#fff' },
      formatter: '{b}: <br/><b>{c}组</b> ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '0%',
      top: 'center',
      icon: 'circle',
      textStyle: { color: '#a1a1aa', fontSize: 12 },
      itemGap: 10
    },
    series: [
      {
        name: 'SOH分布',
        type: 'pie',
        radius: ['50%', '85%'],
        center: ['45%', '50%'],

        itemStyle: {
          borderRadius: 5,
          borderColor: '#1e1e1e',
          borderWidth: 2
        },

        label: {
          show: false,
        },

        emphasis: {
          label: {
            show: true,
            fontSize: 12,
            fontWeight: 'bold',
            color: '#fff',
            formatter: '{b}\n{c}'
          },
          scale: true,
          scaleSize: 10
        },

        data: finalData
      }
    ]
  }

  setOption(option)
}

onMounted(() => {
  updateChart()
})

watch(() => props.batteryData, updateChart, { deep: false })
</script>

<style scoped>
/* 暂时无特有样式... */
</style>
