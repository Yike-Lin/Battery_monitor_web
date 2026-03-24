<template>
  <div class="bento-card">
    <div class="card-header">
      <span class="card-title">实时电量分布</span>
    </div>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, nextTick, onUnmounted, ref } from 'vue'
import { useEchart } from '@/composables/useEchart'
import { loadBatteryRows, type BatteryRow } from '@/composables/useBatteryRows'

const { chartRef, setOption } = useEchart()
const batteryData = ref<BatteryRow[]>([])
let timer: number | null = null

const colors = {
  high: '#34d399',
  mid: '#3b82f6',
  low: '#f87171'
}

const processData = (list: BatteryRow[]) => {
  if (!list || list.length === 0) {
    return [{ value: 1, name: '暂无数据', itemStyle: { color: '#555' } }]
  }

  let high = 0
  let mid = 0
  let low = 0
  list.forEach(item => {
    const val = Number(item.soc ?? 0)
    if (val >= 80) high++
    else if (val >= 20) mid++
    else low++
  })

  return [
    { value: high, name: '充足 (>80%)', itemStyle: { color: colors.high } },
    { value: mid, name: '正常 (20-80%)', itemStyle: { color: colors.mid } },
    { value: low, name: '低电量 (<20%)', itemStyle: { color: colors.low } }
  ]
}

const updateChart = () => {
  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(30,30,30,0.9)',
      borderColor: '#444',
      textStyle: { color: '#fff' },
      formatter: '{b} <br/> <b>{c}组</b> ({d}%)'
    },
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
        roseType: 'radius',
        center: ['45%', '50%'],
        radius: ['35%', '80%'],
        itemStyle: { borderRadius: 5, borderColor: '#1e1e1e', borderWidth: 2 },
        label: { show: false, position: 'outside' },
        emphasis: {
          label: { show: true, formatter: '{c}', color: '#fff', fontSize: 16, fontWeight: 'bold' },
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' }
        },
        data: processData(batteryData.value)
      }
    ]
  }
  setOption(option)
}

async function fetchBatterySocData() {
  try {
    const rows = await loadBatteryRows()
    batteryData.value = rows.filter(row => row?.soc != null)
    updateChart()
  } catch {
    batteryData.value = []
    updateChart()
  }
}

onMounted(() => {
  nextTick(() => {
    fetchBatterySocData()
    timer = window.setInterval(fetchBatterySocData, 30000)
  })
})

onUnmounted(() => {
  if (timer != null) {
    window.clearInterval(timer)
    timer = null
  }
})
</script>

<style scoped>

</style>
