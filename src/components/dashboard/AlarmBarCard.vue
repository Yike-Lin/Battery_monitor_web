<template>
  <div class="bento-card">
    <div class="card-header">
      <span class="card-title">告警分布</span>
    </div>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useEchart } from '@/composables/useEchart'

const { chartRef, setOption } = useEchart()

const colors = {
  blue: '#0a84ff',
  orange: '#ff9f0a',
  red: '#ff453a',
  textLight: '#f5f5f7',
  text: '#86868b'
}

onMounted(() => {
  nextTick(() => {
    const option: echarts.EChartsOption = {
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
              const c = [colors.blue, colors.orange, colors.red]
              return c[params.dataIndex] || colors.blue
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
    }

    setOption(option)
  })
})
</script>

<style scoped>
/* 暂时无特有样式 */
</style>