<template>
  <div class="bento-card">
    <div class="card-header">
      <span class="card-title">实时功率监控</span>
      <div class="card-actions">
        <span class="status-dot"></span>
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
      // grid 用于控制图表距离容器边缘的距离，这里稍微调了一下适应卡片
      grid: { left: 10, right: 20, top: 40, bottom: 10, containLabel: true },
      legend: {
        icon: 'circle',
        right: 20,
        top: 10,
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
/* 核心容器样式：复用 Bento 风格 */
.bento-card {
  height: 100%; /* 关键：撑满父容器(中间列)的高度 */
  width: 100%;
  background: rgba(30, 30, 30, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.bento-card:hover {
  border-color: rgba(255, 255, 255, 0.15);
}

/* 头部样式 */
.card-header {
  padding: 16px 20px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0; /* 防止头部被压缩 */
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #f5f5f7;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(48, 209, 88, 0.1);
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid rgba(48, 209, 88, 0.2);
}

.status-dot {
  width: 6px;
  height: 6px;
  background-color: #30d158;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(48, 209, 88, 0.6);
  animation: pulse 2s infinite;
}

.status-tag {
  font-size: 12px;
  color: #30d158;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* 图表容器样式 */
.chart-container {
  flex: 1;      /* 关键：自动占据剩余高度 */
  width: 100%;
  min-height: 0; /* 关键：防止 Flex 子项内容溢出 */
  margin-top: 10px;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
</style>