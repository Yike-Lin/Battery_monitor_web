<template>
    <div class="bento-card">
      <div class="card-header">
        <span class="card-title">实时功率监控</span>
        <div class="card-actions">
          <span class="status-tag">Live</span>
        </div>
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
    blue: '#0a84ff',
    green: '#30d158',
    grid: 'rgba(255, 255, 255, 0.1)',
    text: '#86868b'
  }
  
  onMounted(() => {
    nextTick(() => {
      const option: echarts.EChartsOption = {
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
      }
  
      setOption(option)
    })
  })
  </script>
  
  <style scoped>
  .card-actions {
    display: flex;
    align-items: center;
  }
  </style>