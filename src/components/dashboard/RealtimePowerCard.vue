<!-- 实时功率监测卡片 -->
<template>
    <div class="bento-card">
      <div class="card-header">
        <span class="card-title">实时功率监控</span>
        <div class="card-actions">
          <span class="status-tag">Live</span>
        </div>
      </div>
      <div ref="mainChartRef" class="chart-container"></div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
  import * as echarts from 'echarts'
  
  const mainChartRef = ref<HTMLDivElement | null>(null)
  let mainChart: echarts.ECharts | null = null
  
  const colors = {
    blue: '#0a84ff',
    green: '#30d158',
    grid: 'rgba(255, 255, 255, 0.1)',
    text: '#86868b'
  }
  
  const initChart = () => {
    if (!mainChartRef.value) return
  
    mainChart = echarts.init(mainChartRef.value)
    mainChart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(28, 28, 30, 0.8)',
        borderColor: '#333',
        textStyle: { color: '#fff' }
      },
      grid: { left: 10, right: 10, top: 30, bottom: 10, containLabel: true },
      legend: {
        icon: 'circle',
        right: 10,
        textStyle: { color: colors.text }
      },
      xAxis: {
        type: 'category',
        data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
        axisLabel: { color: colors.text },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: colors.grid } },
        axisLabel: { color: colors.text }
      },
      series: [
        {
          name: '有功功率',
          type: 'line',
          smooth: true,
          showSymbol: false,
          itemStyle: { color: colors.blue },
          lineStyle: { width: 3 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(10, 132, 255, 0.4)' },
              { offset: 1, color: 'rgba(10, 132, 255, 0)' }
            ])
          },
          data: [120, 180, 260, 310, 280, 220, 150]
        },
        {
          name: '电流',
          type: 'line',
          smooth: true,
          showSymbol: false,
          itemStyle: { color: colors.green },
          lineStyle: { width: 3 },
          data: [80, 110, 150, 190, 170, 130, 90]
        }
      ]
    })
  }
  
  const resizeChart = () => {
    mainChart?.resize()
  }
  
  onMounted(() => {
    nextTick(() => {
      initChart()
      window.addEventListener('resize', resizeChart)
    })
  })
  
  onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeChart)
    mainChart?.dispose()
    mainChart = null
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
  
  .status-tag {
    font-size: 10px;
    background: #30d158;
    color: #000;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 700;
  }
  
  .chart-container {
    flex: 1;
    width: 100%;
    min-height: 0;
    padding: 10px;
    box-sizing: border-box;
  }
  </style>