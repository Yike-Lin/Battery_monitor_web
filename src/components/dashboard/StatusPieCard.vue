<template>
  <div class="bento-card">
    <div class="card-header">
      <span class="card-title">电池健康度分布</span>
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
  green: '#30d158',
  red: '#ff453a',
  offline: '#636366'
}

onMounted(() => {
  nextTick(() => {
    const option: echarts.EChartsOption = {
      tooltip: { trigger: 'item' },
      series: [
        {
          name: '设备状态',
          type: 'pie',
          radius: ['50%', '75%'],
          center: ['50%', '50%'],
          itemStyle: {
            borderRadius: 5,
            borderColor: '#1c1c1e',
            borderWidth: 2
          },
          label: { show: false },
          data: [
            { value: 1100, name: '在线', itemStyle: { color: colors.green } },
            { value: 150, name: '告警', itemStyle: { color: colors.red } },
            { value: 150, name: '离线', itemStyle: { color: colors.offline } }
          ]
        }
      ]
    }

    setOption(option)
  })
})
</script>

<style scoped>
/* 暂时无特有样式... */
</style>
