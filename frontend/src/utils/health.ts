import type { Device } from '@/types'

/**
 * 健康度取值唯一入口（前端侧）。
 *
 * 在线率与健康评分统一由后端按「可用性 + 故障次数」折算，
 * 随设备快照(WS / /api/devices)及 /api/health 下发；
 * 前端任何面板/页面都只从这里读取，禁止再按温度、运行时长等自行计算，
 * 以保证同一台设备在所有位置展示一致的数值。
 */

export function healthScore(dev: Device | null | undefined): number | null {
  return dev ? (Number.isFinite(dev.health_score) ? dev.health_score : null) : null
}

export function onlineRate(dev: Device | null | undefined): number | null {
  return dev ? (Number.isFinite(dev.online_rate) ? dev.online_rate : null) : null
}

export function healthLevel(score: number | null): 'good' | 'warn' | 'bad' | 'none' {
  if (score === null) return 'none'
  if (score >= 80) return 'good'
  if (score >= 60) return 'warn'
  return 'bad'
}

export const HEALTH_LEVEL_COLORS: Record<ReturnType<typeof healthLevel>, string> = {
  good: '#22c55e',
  warn: '#fbbf24',
  bad: '#ef4444',
  none: '#64748b',
}

export function formatScore(dev: Device | null | undefined): string {
  const v = healthScore(dev)
  return v === null ? '--' : v.toFixed(1)
}

export function formatOnlineRate(dev: Device | null | undefined): string {
  const v = onlineRate(dev)
  return v === null ? '--' : `${v.toFixed(1)}%`
}
