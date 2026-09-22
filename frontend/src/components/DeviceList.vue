<template>
  <div class="panel">
    <h4>📋 设备状态</h4>
    <div class="dev-list">
      <div
        v-for="dev in devices"
        :key="dev.id"
        class="dev-row"
        :class="{ active: store.selectedDeviceId === dev.id }"
        :style="{borderLeftColor: STATUS_COLORS[dev.status]}"
        @click="store.selectDevice(dev.id)"
      >
        <div class="dev-line">
          <div class="dev-info">
            <span class="dev-type">{{ dev.type }}</span>
            <span class="dev-id">#{{ dev.id }}</span>
          </div>
          <div class="dev-metrics">
            <span class="metric">{{ dev.temperature.toFixed(1) }}°C</span>
            <span class="metric">{{ dev.vibration.toFixed(2) }}mm/s</span>
          </div>
          <el-tag size="small" :type="tagType(dev.status)">{{ dev.status }}</el-tag>
        </div>
        <div class="dev-health">
          <span class="h-metric" :style="{ color: healthColor(healthScore(dev)) }">健康 {{ formatScore(dev) }}</span>
          <span class="h-metric online">在线率 {{ formatOnlineRate(dev) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFactoryStore } from '../store/factory'
import { STATUS_COLORS } from '../types'
import {
  healthScore, healthLevel, HEALTH_LEVEL_COLORS,
  formatScore, formatOnlineRate,
} from '../utils/health'
const store = useFactoryStore()
const devices = computed(() => store.data?.devices || [])

function healthColor(score: number | null) {
  return HEALTH_LEVEL_COLORS[healthLevel(score)]
}

function tagType(s: string) {
  const m: Record<string, any> = { RUNNING: 'success', IDLE: 'warning', FAULT: 'danger' }
  return m[s] || 'info'
}
</script>

<style scoped>
.panel{background:#0d1b2a;border-radius:8px;padding:12px;border:1px solid #1e3a5f}
.panel h4{color:#64b5f6;margin-bottom:8px;font-size:13px}
.dev-list{display:flex;flex-direction:column;gap:4px;max-height:250px;overflow-y:auto}
.dev-row{padding:6px 8px;background:#112233;border-radius:4px;border-left:3px solid #666;cursor:pointer}
.dev-row.active{outline:1px solid #64b5f666}
.dev-line{display:flex;justify-content:space-between;align-items:center}
.dev-info{display:flex;gap:6px;align-items:center}
.dev-type{font-size:12px;color:#e0e6ed;font-weight:600}
.dev-id{font-size:11px;color:#64748b}
.dev-metrics{display:flex;gap:10px;font-size:11px;color:#94a3b8}
.dev-health{display:flex;gap:10px;margin-top:3px;font-size:11px;font-weight:600}
.h-metric.online{color:#94a3b8;font-weight:400}
</style>
