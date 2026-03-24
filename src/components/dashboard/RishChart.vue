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
import * as echarts from 'echarts'
import { useEchart } from '@/composables/useEchart'

const props = defineProps({
  batteryData: {
    type: Array,
    default: () => []
  }
})

const { chartRef, setOption } = useEchart()

const ACTIVE_WINDOW_MS = 2 * 60 * 1000

const THRESHOLDS = {
  sohLow: 80,
  voltageHigh: 4.15,
  voltageLow: 3.00,
  temperatureHigh: 35,
}

// 1. 数据处理逻辑
const processData = (list: any[]) => {
  const categories = ['通信中断', '容量过低', '电压异常', '温度过高']
  if (!list || list.length === 0) return { categories, values: [0, 0, 0, 0] }

  let commCount = 0 // 近 2 分钟无数据
  let capCount = 0  // SOH < 80%
  let volCount = 0  // voltage >= 4.15 或 <= 3.00
  let tempCount = 0 // temperature >= 35

  const now = Date.now()

  list.forEach((item: any) => {
    // 通信中断：用 lastRecordAt 推断离线
    const ts = item?.lastRecordAt ? Date.parse(item.lastRecordAt) : NaN
    if (Number.isNaN(ts) || now - ts > ACTIVE_WINDOW_MS) commCount += 1

    // 容量过低：用 sohPercent
    if (item?.sohPercent != null && Number(item.sohPercent) < THRESHOLDS.sohLow) capCount += 1

    // 电压异常 / 温度过高：只有当列表里真的带了 voltage/temperature 字段时才统计（避免凭空模拟）
    if (item?.voltage != null) {
      const v = Number(item.voltage)
      if (!Number.isNaN(v) && (v >= THRESHOLDS.voltageHigh || v <= THRESHOLDS.voltageLow)) volCount += 1
    }
    if (item?.temperature != null) {
      const t = Number(item.temperature)
      if (!Number.isNaN(t) && t >= THRESHOLDS.temperatureHigh) tempCount += 1
    }
  })

  return { categories, values: [commCount, capCount, volCount, tempCount] }
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
    
    grid: {
      left: '3%',
      right: '10%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    // X轴：数值轴
    xAxis: {
      type: 'value',
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
        barWidth: 12,
        itemStyle: {
          borderRadius: [0, 20, 20, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#f56c6c' },
            { offset: 1, color: '#e6a23c' }
          ])
        },
        // 在柱子右侧显示具体数字
        label: {
          show: true,
          position: 'right',
          color: '#fff',
          fontWeight: 'bold'
        },
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
