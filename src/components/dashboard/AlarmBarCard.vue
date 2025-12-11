<!-- 告警分布卡片 -->
<template>
    <div class="bento-card">
      <div class="card-header">
        <span class="card-title">告警分布</span>
      </div>
      <div ref="chartRef" class="chart-container"></div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
  import * as echarts from 'echarts'
  
  const chartRef = ref<HTMLDivElement | null>(null)
  let chart: echarts.ECharts | null = null
  
  const colors = {
    blue: '#0a84ff',
    orange: '#ff9f0a',
    red: '#ff453a',
    textLight: '#f5f5f7',
    text: '#86868b'
  }
  
  const initChart = () => {
    if (!chartRef.value) return
  
    chart = echarts.init(chartRef.value)
    chart.setOption({
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
    })
  }
  
  const resizeChart = () => {
    chart?.resize()
  }
  
  onMounted(() => {
    nextTick(() => {
      initChart()
      window.addEventListener('resize', resizeChart)
    })
  })
  
  onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeChart)
    chart?.dispose()
    chart = null
  })
  </script>
  
  <style scoped>
  .bento-card {
    background: rgba(30, 30, 30, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    color: #f5f5f7;
    transition: border-color 0.2s ease;
  }
  
  .bento-card:hover {
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  .card-header {
    height: 48px;
    padding: 0 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: #f5f5f7;
    letter-spacing: 0.5px;
  }
  
  .chart-container {
    flex: 1;
    width: 100%;
    min-height: 0;
    padding: 10px;
    box-sizing: border-box;
  }
  </style>