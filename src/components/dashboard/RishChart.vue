<template>
  <div class="bento-card">
    <div class="card-header">
      <span class="card-title">故障类型统计</span>
    </div>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, nextTick, watch, defineProps } from 'vue'
import * as echarts from 'echarts' // 引入 echarts 为了使用渐变色
import { useEchart } from '@/composables/useEchart'

const props = defineProps({
  batteryData: {
    type: Array,
    default: () => []
  }
})

const { chartRef, setOption } = useEchart()

// 1. 数据处理逻辑
const processData = (list: any[]) => {
  // 如果没数据，使用模拟数据展示效果
  if (!list || list.length === 0) {
    return {
      categories: ['通信中断', '容量过低', '电压异常', '温度过高'],
      values: [2, 5, 3, 4] // 模拟的报警数量
    }
  }

  let tempCount = 0   // 温度 > 45
  let volCount = 0    // 电压 > 4.2 或 < 2.8
  let capCount = 0    // SOH < 70
  let commCount = 0   // 假设 status === 'offline'

  list.forEach(item => {
    // 根据你的实际字段调整判断逻辑
    if (Number(item.temp) > 45) tempCount++
    if (Number(item.voltage) > 4.2 || Number(item.voltage) < 2.8) volCount++
    if (Number(item.soh) < 70) capCount++
    if (item.status === 'offline') commCount++
  })

  return {
    categories: ['通信中断', '容量过低', '电压异常', '温度过高'],
    values: [commCount, capCount, volCount, tempCount]
  }
}

// 2. 更新图表
const updateChart = () => {
  const { categories, values } = processData(props.batteryData)

  const option = {
    // 提示框
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(30,30,30,0.9)',
      borderColor: '#444',
      textStyle: { color: '#fff' },
      axisPointer: { type: 'shadow' }
    },
    // 布局调整：防止文字被切掉
    grid: {
      left: '3%',
      right: '10%',
      bottom: '3%',
      top: '10%',
      containLabel: true // 自动计算边距，保证左边的字显示全
    },
    // X轴：数值轴
    xAxis: {
      type: 'value',
      // 隐藏网格线和坐标轴
      splitLine: { show: false },
      axisLabel: { show: false }
    },
    // Y轴：类别轴
    yAxis: {
      type: 'category',
      data: categories,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#a1a1aa',
        fontSize: 12
      }
    },
    series: [
      {
        name: '报警数量',
        type: 'bar',
        data: values,
        barWidth: 12, // 柱子细一点
        itemStyle: {
          borderRadius: [0, 20, 20, 0], // 右边圆角
          // 漂亮的渐变色：从橙色到红色
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#f56c6c' },  // 红
            { offset: 1, color: '#e6a23c' }   // 橙
          ])
        },
        // 在柱子右侧显示具体数字
        label: {
          show: true,
          position: 'right',
          color: '#fff',
          fontWeight: 'bold'
        },
        // 背景柱子（灰色的底），看起来更有质感
        showBackground: true,
        backgroundStyle: {
          color: 'rgba(255, 255, 255, 0.05)',
          borderRadius: [0, 20, 20, 0]
        }
      }
    ]
  }

  setOption(option)
}

onMounted(() => {
  nextTick(() => {
    updateChart()
  })
})

watch(() => props.batteryData, () => {
  updateChart()
}, { deep: true })
</script>

<style scoped>
/* 暂时无特有样式... */
</style>
