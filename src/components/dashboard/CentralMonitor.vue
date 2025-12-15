<template>
  <div class="bento-card central-card">
    <div class="card-header">
      <div class="header-left">
        <span class="card-title">双通道实时遥测 (V/A)</span>
        <span class="live-tag">● LIVE</span>
      </div>
      <div class="header-right">
        <div class="legend-box">
          <span class="dot pack-a"></span> Batch-1
          <span class="dot pack-b"></span> Batch-2
        </div>
      </div>
    </div>

    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useEchart } from '@/composables/useEchart'

const { chartRef, setOption, chartInstance } = useEchart()
let timer: any = null

// --- 配置参数 ---
const MAX_POINTS = 60 // X轴显示点数
const REFRESH_RATE = 200 // 刷新间隔 (ms)

// --- 数据结构 ---
// 我们模拟两组电池：Pack A 和 Pack B
const dataQueue = {
  time: [] as string[],
  packA_V: [] as number[], // A组电压
  packA_C: [] as number[], // A组电流
  packB_V: [] as number[], // B组电压
  packB_C: [] as number[]  // B组电流
}

let tick = 0

// --- 模拟数据生成 (模拟真实的充放电波动) ---
const generateData = () => {
  tick += 0.2
  const now = new Date().toLocaleTimeString().replace(/^\D*/, '')

  // 模拟 Pack A: 电压较稳，电流波动大
  // 电压：基准 3.8V + 正弦波 + 噪点
  const va = 3.8 + Math.sin(tick) * 0.1 + (Math.random() - 0.5) * 0.05
  // 电流：基准 12A + 较大的波动
  const ca = 12 + Math.cos(tick * 1.5) * 5 + Math.random() * 2

  // 模拟 Pack B:
  const vb = 3.65 + Math.sin(tick + 2) * 0.15 + (Math.random() - 0.5) * 0.05
  const cb = 8 + Math.cos(tick) * 3 + Math.random() * 2

  return {
    time: now,
    va: Number(va.toFixed(3)),
    ca: Number(ca.toFixed(2)),
    vb: Number(vb.toFixed(3)),
    cb: Number(cb.toFixed(2))
  }
}

// 初始化先填充一点数据
const initData = () => {
  for (let i = 0; i < MAX_POINTS; i++) {
    const d = generateData()
    dataQueue.time.push(d.time)
    dataQueue.packA_V.push(d.va)
    dataQueue.packA_C.push(d.ca)
    dataQueue.packB_V.push(d.vb)
    dataQueue.packB_C.push(d.cb)
  }
}

// --- ECharts 配置 (双Grid核心) ---
const updateChart = () => {
  const option: echarts.EChartsOption = {
    animation: false, // 实时图必须关动画
    backgroundColor: 'transparent',

    // 提示框：同时显示所有数据
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0,0,0,0.85)',
      borderColor: '#444',
      textStyle: { color: '#eee', fontSize: 12 },
      axisPointer: { type: 'line', lineStyle: { color: '#fff', type: 'dashed' } },
      formatter: function (params: any) {
        // 自定义 tooltip 格式
        let html = `<div style="margin-bottom:5px;color:#aaa">${params[0].axisValue}</div>`
        // 分组显示
        html += `<div style="color:#74f2ce;font-weight:bold">Pack A:</div>`
        html += `<div>Voltage: ${params[0].value} V</div>`
        html += `<div>Current: ${params[1].value} A</div><br/>`

        html += `<div style="color:#409eff;font-weight:bold">Pack B:</div>`
        html += `<div>Voltage: ${params[2].value} V</div>`
        html += `<div>Current: ${params[3].value} A</div>`
        return html
      }
    },

    // 核心：定义两个绘图区域 (Grid)
    grid: [
      // 上半部分：显示电压
      {
        left: '50', right: '20', top: '10%', height: '35%',
        containLabel: false
      },
      // 下半部分：显示电流
      {
        left: '50', right: '20', top: '60%', height: '35%',
        containLabel: false
      }
    ],

    // 定义两个 X 轴
    xAxis: [
      {
        gridIndex: 0, // 属于第一个 grid
        type: 'category',
        data: dataQueue.time,
        axisLabel: { show: false }, // 上面的图不显示时间文字，为了省空间
        axisTick: { show: false },
        axisLine: { show: false },
        boundaryGap: false
      },
      {
        gridIndex: 1, // 属于第二个 grid
        type: 'category',
        data: dataQueue.time,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#333' } },
        axisLabel: { color: '#666', fontSize: 10 }
      }
    ],

    // 定义两个 Y 轴
    yAxis: [
      {
        gridIndex: 0, // 电压轴
        name: 'Voltage (V)',
        nameTextStyle: { color: '#888', padding: [0, 0, 0, -30] },
        type: 'value',
        min: 3.0, max: 4.5, // 锁定电压范围
        splitLine: { show: true, lineStyle: { color: '#1f1f1f' } },
        axisLabel: { color: '#888' }
      },
      {
        gridIndex: 1, // 电流轴
        name: 'Current (A)',
        nameTextStyle: { color: '#888', padding: [0, 0, 0, -30] },
        type: 'value',
        min: 0, max: 20, // 锁定电流范围
        splitLine: { show: true, lineStyle: { color: '#1f1f1f' } },
        axisLabel: { color: '#888' },
        axisLabel: { formatter: '{value} A' }
      }
    ],

    // 系列数据
    series: [
      // --- Pack A ---
      {
        name: 'PackA-V',
        type: 'line',
        xAxisIndex: 0, yAxisIndex: 0, // 放在上面
        data: dataQueue.packA_V,
        showSymbol: false,
        smooth: true,
        lineStyle: { width: 2, color: '#74f2ce' }, // 青色实线
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(116, 242, 206, 0.2)' },
            { offset: 1, color: 'rgba(116, 242, 206, 0)' }
          ])
        }
      },
      {
        name: 'PackA-C',
        type: 'line',
        xAxisIndex: 1, yAxisIndex: 1, // 放在下面
        data: dataQueue.packA_C,
        showSymbol: false,
        smooth: true,
        lineStyle: { width: 2, color: '#74f2ce', type: 'dashed' } // 青色虚线代表电流
      },

      // --- Pack B ---
      {
        name: 'PackB-V',
        type: 'line',
        xAxisIndex: 0, yAxisIndex: 0, // 放在上面
        data: dataQueue.packB_V,
        showSymbol: false,
        smooth: true,
        lineStyle: { width: 2, color: '#409eff' } // 蓝色实线
      },
      {
        name: 'PackB-C',
        type: 'line',
        xAxisIndex: 1, yAxisIndex: 1, // 放在下面
        data: dataQueue.packB_C,
        showSymbol: false,
        smooth: true,
        lineStyle: { width: 2, color: '#409eff', type: 'dashed' } // 蓝色虚线
      }
    ]
  }
  setOption(option)
}

// --- 实时循环 ---
const startLoop = () => {
  timer = setInterval(() => {
    // 1. 生成新数据
    const next = generateData()

    // 2. 队列操作 (移除头，加入尾)
    dataQueue.time.shift(); dataQueue.time.push(next.time)
    dataQueue.packA_V.shift(); dataQueue.packA_V.push(next.va)
    dataQueue.packA_C.shift(); dataQueue.packA_C.push(next.ca)
    dataQueue.packB_V.shift(); dataQueue.packB_V.push(next.vb)
    dataQueue.packB_C.shift(); dataQueue.packB_C.push(next.cb)

    // 3. 增量更新图表
    if (chartInstance.value) {
      chartInstance.value.setOption({
        xAxis: [
          { data: dataQueue.time }, // 更新上X轴
          { data: dataQueue.time }  // 更新下X轴
        ],
        series: [
          { data: dataQueue.packA_V },
          { data: dataQueue.packA_C },
          { data: dataQueue.packB_V },
          { data: dataQueue.packB_C }
        ]
      })
    }
  }, REFRESH_RATE)
}

onMounted(() => {
  initData()
  nextTick(() => {
    updateChart()
    startLoop()
  })
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.bento-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: radial-gradient(circle at center, rgba(35,35,40,0.9) 0%, rgba(20,20,20,0.95) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 20px rgba(0,0,0,0.6);
  border-radius: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.5px;
}

.live-tag {
  font-size: 10px;
  color: #ff453a;
  background: rgba(255, 69, 58, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
  animation: blink 1s infinite;
}

.header-right {
  display: flex;
  align-items: center;
}

.legend-box {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #888;
}

.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
}
.dot.pack-a { background: #74f2ce; box-shadow: 0 0 5px #74f2ce; }
.dot.pack-b { background: #409eff; box-shadow: 0 0 5px #409eff; }

.chart-container {
  flex: 1;
  width: 100%;
  min-height: 250px;
}

@keyframes blink {
  0% { opacity: 0.4; }
  50% { opacity: 1; }
  100% { opacity: 0.4; }
}
</style>
