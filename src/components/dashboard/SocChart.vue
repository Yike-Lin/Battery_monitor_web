<template>
  <div class="bento-card">
    <div class="card-header">
      <span class="card-title">实时电量分布</span>
    </div>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, nextTick, watch, defineProps } from 'vue'
import { useEchart } from '@/composables/useEchart'

const props = defineProps({
  batteryData: {
    type: Array,
    default: () => []
  }
})

const { chartRef, setOption } = useEchart()

// 1. 定义颜色常量 (青色/蓝色/红色)
const colors = {
  high: '#34d399',  // >80% 翡翠绿
  mid:  '#3b82f6',  // 20-80% 科技蓝
  low:  '#f87171'   // <20% 警戒红
}

// 2. 数据处理：统计 SOC 区间
const processData = (list: any[]) => {
  if (!list || list.length === 0) {
    // 模拟数据
    return [
      { value: 45, name: '充足 (>80%)', itemStyle: { color: colors.high } },
      { value: 65, name: '正常 (20-80%)', itemStyle: { color: colors.mid } },
      { value: 18, name: '低电量 (<20%)', itemStyle: { color: colors.low } }
    ]
  }

  let high = 0
  let mid = 0
  let low = 0

  list.forEach(item => {
    const val = Number(item.soc || 0) // 确保你的字段名是 soc
    if (val >= 80) high++
    else if (val >= 20) mid++
    else low++
  })

  return [
    { value: high, name: '充足 (>80%)', itemStyle: { color: colors.high } },
    { value: mid,  name: '正常 (20-80%)', itemStyle: { color: colors.mid } },
    { value: low,  name: '低电量 (<20%)', itemStyle: { color: colors.low } }
  ]
}

// 3. 更新图表
const updateChart = () => {
  const chartData = processData(props.batteryData)

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(30,30,30,0.9)',
      borderColor: '#444',
      textStyle: { color: '#fff' },
      formatter: '{b} <br/> <b>{c}组</b> ({d}%)'
    },

    // 图例保持在右侧，与左上角图表对称
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
        name: 'SOC分布',
        type: 'pie',
        // 关键属性：开启玫瑰图模式
        // 'radius' 表示半径和面积都随数值变化，视觉冲击力更强
        roseType: 'radius',

        // 居中设置 (水平居中，垂直微调)
        center: ['50%', '50%'],

        // 内圆半径15%，外圆半径65%
        radius: ['35%', '80%'],

        itemStyle: {
          borderRadius: 5,
          borderColor: '#1e1e1e', // 产生间隙
          borderWidth: 2
        },

        // 标签配置
        label: {
          show: false, // 默认不显示标签，太乱
          position: 'outside'
        },

        // 鼠标悬停高亮
        emphasis: {
          label: {
            show: true,
            formatter: '{c}', // 悬停时显示数字
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },

        data: chartData
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
