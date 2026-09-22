import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Device, FactoryData } from '@/types'

export const useFactoryStore = defineStore('factory', () => {
  const data = ref<FactoryData | null>(null)
  const ws = ref<WebSocket | null>(null)
  const connected = ref(false)
  const selectedDeviceId = ref<number | null>(null)

  // 选中设备完全由当前快照派生，切换设备/重连后不保留任何本地评分缓存
  const selectedDevice = computed<Device | null>(
    () => data.value?.devices.find(d => d.id === selectedDeviceId.value) ?? null,
  )

  function selectDevice(id: number | null) {
    selectedDeviceId.value = id
  }

  function connect() {
    if (ws.value) return
    // 重连时丢弃上一轮快照，避免评分/在线率残留
    data.value = null
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const s = new WebSocket(`${protocol}//${location.hostname}:8000/ws`)
    s.onopen = () => { connected.value = true; console.log('WS connected') }
    s.onmessage = (e) => {
      try { data.value = JSON.parse(e.data) } catch {}
    }
    s.onclose = () => {
      connected.value = false
      ws.value = null
      data.value = null
    }
    ws.value = s
  }

  function disconnect() {
    ws.value?.close()
    ws.value = null
    connected.value = false
    data.value = null
  }

  return { data, connected, selectedDeviceId, selectedDevice, selectDevice, connect, disconnect }
})
