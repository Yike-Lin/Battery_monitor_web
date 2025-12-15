<template>
  <div class="bento-card">
    <div class="card-header">
      <span class="card-title">剩余寿命预测</span>
    </div>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, nextTick, watch, defineProps } from 'vue'
import * as echarts from 'echarts'
import { useEchart } from '@/composables/useEchart'

const props = defineProps({
  batteryData: {
    type: Array,
    default: () => []
  }
})

const { chartRef, setOption } = useEchart()

// 1. 数据处理：将 RUL 分桶统计
const processData = (list: any[]) => {
  if (!list || list.length === 0) {
    // 模拟数据 (单位: 循环次数 Cycles)
    return {
      categories: ['<50周', '50-200', '200-500', '>500周'],
      values: [5, 12, 45, 66] // 这里的 '5' 就是急需更换的
    }
  }

  // 定义四个区间计数器
  let critical = 0 // < 50
  let short = 0    // 50 - 200
  let medium = 0   // 200 - 500
  let long = 0     // > 500

  list.forEach(item => {
    // 假设你的数据里有 rul 字段，如果没有，用 (soh - 70) * 10 估算一下
    const val = Number(item.rul || 0)

    if (val < 50) critical++
    else if (val < 200) short++
    else if (val < 500) medium++
    else long++
  })

  return {
    categories: ['<50次', '50-200', '200-500', '>500次'],
    values: [critical, short, medium, long]
  }
}

// 2. 更新图表
const updateChart = () => {
  const { categories, values } = processData(props.batteryData)

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(30,30,30,0.9)',
      borderColor: '#444',
      textStyle: { color: '#fff' },
      axisPointer: { type: 'shadow' } // 鼠标悬停时显示阴影指示器
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    // X轴：类别
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { show: false }, // 隐藏轴线
      axisTick: { show: false }, // 隐藏刻度
      axisLabel: {
        color: '#a1a1aa',
        fontSize: 11,
        interval: 0 // 强制显示所有标签
      }
    },
    // Y轴：数值
    yAxis: {
      type: 'value',
      splitLine: {
        show: false,
        lineStyle: { color: '#27272a', type: 'dashed' } // 虚线网格
      },
      axisLabel: { show: false } // 不显示Y轴数字，让画面更干净
    },
    series: [
      {
        name: '电池数量',
        type: 'bar',
        data: values,
        barWidth: 16, // 柱子宽度

        // 核心视觉：紫色渐变
        itemStyle: {
          borderRadius: [4, 4, 0, 0], // 顶部圆角
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#8b5cf6' },  // 亮紫 (Top)
            { offset: 1, color: '#6366f1' }   // 靛蓝 (Bottom)
          ]),
          // 加一点荧光效果
          shadowBlur: 10,
          shadowColor: 'rgba(139, 92, 246, 0.3)'
        },

        // 在柱子顶部显示数字
        label: {
          show: true,
          position: 'top',
          color: '#a1a1aa',
          fontSize: 12
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

</style>
