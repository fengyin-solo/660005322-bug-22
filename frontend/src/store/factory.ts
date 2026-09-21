import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FactoryData } from '@/types'

export const useFactoryStore = defineStore('factory', () => {
  const data = ref<FactoryData | null>(null)
  const ws = ref<WebSocket | null>(null)
  const connected = ref(false)

  function reset() {
    // 切换设备/重连后不得残留上一轮的健康评分与设备快照
    data.value = null
  }

  function connect() {
    if (ws.value) return
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const s = new WebSocket(`${protocol}//${location.hostname}:8000/ws`)
    s.onopen = () => {
      connected.value = true
      // 重连成功先清空旧轮次数据，再立即拉一份 REST 快照兜底
      reset()
      fetch(`//${location.hostname}:8000/api/devices`)
        .then((r) => r.json())
        .then((json) => {
          // 若 WS 已先到过数据则不覆盖
          if (!data.value) {
            data.value = {
              devices: json.devices || [],
              production: json.devices
                ? json.devices.reduce((sum: number, d: any) => sum + (d.production_count || 0), 0)
                : 0,
              anomalies: json.anomalies || [],
              oee: [],
              health: json.health ?? null,
            }
          }
        })
        .catch(() => {})
      console.log('WS connected')
    }
    s.onmessage = (e) => {
      try { data.value = JSON.parse(e.data) } catch {}
    }
    s.onclose = () => {
      connected.value = false
      ws.value = null
      reset()
    }
    ws.value = s
  }

  function disconnect() {
    ws.value?.close()
    ws.value = null
    connected.value = false
    reset()
  }

  return { data, connected, connect, disconnect }
})
