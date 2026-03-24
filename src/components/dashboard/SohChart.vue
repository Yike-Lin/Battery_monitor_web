<template>
  <div class="bento-card">
    <div class="card-header">
      <span class="card-title">电池健康度分布</span>
    </div>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, nextTick, watch, defineProps } from 'vue'
import { useEchart } from '@/composables/useEchart'

// 1. 接收父组件传来的电池列表数据
const props = defineProps({
  batteryData: {
    type: Array,
    default: () => []
  }
})

// 2. 初始化 ECharts
const { chartRef, setOption } = useEchart()

// 3. 定义颜色常量 (对应 优/良/中/差)
const colors = {
  excellent: '#67c23a', // 绿色
  good:     '#409eff',  // 蓝色
  fair:     '#e6a23c',  // 黄色
  poor:     '#f56c6c'   // 红色
}

// 4. 数据处理函数：把 [SoH: 92, SoH: 85...] 转换成 图表需要的格式
const processData = (list: any[]) => {
  // 暂时模拟
  if (!list || list.length === 0) {
    return [
      { value: 75, name: '优 (≥90)', itemStyle: { color: colors.excellent } },
      { value: 10, name: '良 (80-90)', itemStyle: { color: colors.good } },
      { value: 10, name: '中 (70-80)', itemStyle: { color: colors.fair } },
      { value: 5,  name: '差 (<70)', itemStyle: { color: colors.poor } }
    ]
  }

  let gradeA = 0, gradeB = 0, gradeC = 0, gradeD = 0

  list.forEach(item => {
    const val = Number(item.soh || 0)
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

// 5. 核心渲染函数
const updateChart = () => {
  const chartData = processData(props.batteryData)

  // 计算总数 (用于中间显示)
  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  const option = {
    // 提示框
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(30,30,30,0.9)',
      borderColor: '#444',
      textStyle: { color: '#fff' },
      formatter: '{b}: <br/><b>{c}组</b> ({d}%)' // 格式化显示
    },
    // 图例 (放右边)
    legend: {
      orient: 'vertical',
      right: '0%', // 靠右对齐
      top: 'center',
      icon: 'circle',
      textStyle: { color: '#a1a1aa', fontSize: 12 },
      itemGap: 10
    },
    series: [
      {
        name: 'SOH分布',
        type: 'pie',
        // 调整圆环大小和位置，给右侧图例留空间
        radius: ['50%', '85%'],
        center: ['45%', '50%'],

        itemStyle: {
          borderRadius: 5,
          borderColor: '#1e1e1e', // 边框颜色跟背景色一致，产生间隙感
          borderWidth: 2
        },

        // 默认标签逻辑：中间显示总数
        label: {
          show: false,
          // position: 'center'
        },

        // 鼠标移上去高亮显示具体数值
        emphasis: {
          label: {
            show: true,
            fontSize: 12,
            fontWeight: 'bold',
            color: '#fff',
            formatter: '{b}\n{c}' // 显示名字和数值
          },
          scale: true,
          scaleSize: 10
        },

        data: chartData
      }
    ]
  }

  setOption(option)
}

// 6. 生命周期
onMounted(() => {
  nextTick(() => {
    updateChart()
  })
})

// 7. 监听数据变化 (当父组件数据刷新时，图表也要动)
watch(() => props.batteryData, () => {
  updateChart()
}, { deep: true })
</script>

<style scoped>
/* 暂时无特有样式... */
</style>
