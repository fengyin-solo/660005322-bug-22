<template>
  <div class="panel">
    <h4>❤️ 设备健康度</h4>
    <div v-if="!dev" class="empty">点击上方设备查看健康详情</div>
    <template v-else>
      <div class="head">
        <span class="dev-type">{{ dev.type }}</span>
        <span class="dev-id">#{{ dev.id }}</span>
        <el-tag size="small" :type="tagType(dev.status)">{{ dev.status }}</el-tag>
      </div>
      <div class="score-grid">
        <div class="score-item">
          <span class="label">健康评分</span>
          <span class="value" :style="{color: healthColor}">{{ formatScore(dev) }}</span>
        </div>
        <div class="score-item">
          <span class="label">在线率</span>
          <span class="value online">{{ formatOnlineRate(dev) }}</span>
        </div>
      </div>
      <div class="sub">按可用性与累计故障次数折算（统一口径由后端下发）· 累计故障 {{ dev.fault_count }} 次</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFactoryStore } from '../store/factory'
import {
  healthScore, healthLevel, HEALTH_LEVEL_COLORS,
  formatScore, formatOnlineRate,
} from '../utils/health'
const store = useFactoryStore()
const dev = computed(() => store.selectedDevice)
const healthColor = computed(() =>
  HEALTH_LEVEL_COLORS[healthLevel(healthScore(dev.value))],
)

function tagType(s: string) {
  const m: Record<string, any> = { RUNNING: 'success', IDLE: 'warning', FAULT: 'danger' }
  return m[s] || 'info'
}
</script>

<style scoped>
.panel{background:#0d1b2a;border-radius:8px;padding:12px;border:1px solid #1e3a5f}
.panel h4{color:#64b5f6;margin-bottom:8px;font-size:13px}
.empty{color:#64748b;font-size:12px}
.head{display:flex;gap:8px;align-items:center;margin-bottom:8px}
.dev-type{font-size:12px;color:#e0e6ed;font-weight:600}
.dev-id{font-size:11px;color:#64748b}
.score-grid{display:flex;gap:12px}
.score-item{flex:1;background:#112233;border-radius:4px;padding:8px;display:flex;flex-direction:column;gap:2px;align-items:center}
.score-item .label{font-size:11px;color:#94a3b8}
.score-item .value{font-size:18px;font-weight:700}
.score-item .value.online{color:#94a3b8}
.sub{margin-top:6px;font-size:11px;color:#64748b}
</style>
