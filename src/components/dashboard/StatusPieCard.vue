<!-- 在线状态卡片 -->
<template>
    <div class="bento-card">
      <div class="card-header">
        <span class="card-title">在线状态</span>
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
    green: '#30d158',
    red: '#ff453a',
    offline: '#636366'
  }
  
  const initChart = () => {
    if (!chartRef.value) return
  
    chart = echarts.init(chartRef.value)
    chart.setOption({
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