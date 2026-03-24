// 当地时间
import { ref, onMounted, onUnmounted } from 'vue'

const timeFormatOptions: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: false
}

export function useNowTime() {
  const nowTime = ref('')
  let timer: number | undefined

  const updateTime = () => {
    nowTime.value = new Date().toLocaleString('en-US', timeFormatOptions)
  }

  onMounted(() => {
    updateTime()
    timer = window.setInterval(updateTime, 1000)
  })

  onUnmounted(() => {
    if (timer !== undefined) {
      clearInterval(timer)
    }
  })

  return nowTime
}