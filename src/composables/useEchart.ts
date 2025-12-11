// 通用图表-echarts所有的生命周期逻辑在这里维护

import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'


export function useEchart() {
  const chartRef = ref<HTMLDivElement | null>(null)
  let chart: echarts.ECharts | null = null

  const ensureInstance = () => {
    if (!chartRef.value) return null
    if (!chart) {
      chart = echarts.init(chartRef.value)
    }
    return chart
  }

  const setOption = (option: echarts.EChartsOption) => {
    const instance = ensureInstance()
    if (!instance) return
    instance.setOption(option)
  }

  const resize = () => {
    chart?.resize()
  }

  onMounted(() => {
    window.addEventListener('resize', resize)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', resize)
    chart?.dispose()
    chart = null
  })

  return {
    chartRef,
    setOption,
    resize,
  }
}