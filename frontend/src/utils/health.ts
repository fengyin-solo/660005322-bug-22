/**
 * 健康度统一口径 —— 与后端 backend/app/health.py 公式严格一致
 *
 * 唯一入口：所有面板/页面都通过这里取健康评分与在线率，
 * 不允许再按温度、运行时长等自行折算，避免同一台设备两处对不上。
 *
 * - availability = uptime / (uptime + fault_count) * 100   （两者皆 0 视为 100）
 * - health_score = clamp(availability - 3 * fault_count, 0, 100)，保留 1 位小数
 * - online_rate  = 非 OFFLINE 设备占比 * 100，保留 1 位小数
 */
import type { Device, HealthSummary } from '@/types'

export const FAULT_PENALTY = 3

/** 四舍五入到 1 位小数，与 Python 端 _round1 对齐 */
export function round1(x: number): number {
  return Math.round(x * 10) / 10
}

/** 按可用性与故障次数折算（0~100），与后端 availability_rate 同口径 */
export function availabilityOf(dev: Pick<Device, 'uptime' | 'fault_count'>): number {
  const uptime = dev.uptime ?? 0
  const faultCount = dev.fault_count ?? 0
  const denominator = uptime + faultCount
  if (denominator <= 0) return 100
  return Math.min(100, (uptime / denominator) * 100)
}

/**
 * 统一健康评分（0~100，1 位小数）。
 * 优先取后端下发的 health_score（真正的唯一数据源）；
 * 仅当快照缺字段（如 REST 旧数据）时，才按同一公式兜底，保证口径一致。
 */
export function healthOf(dev: Device): number {
  if (typeof dev.health_score === 'number' && Number.isFinite(dev.health_score)) {
    return dev.health_score
  }
  const score = availabilityOf(dev) - FAULT_PENALTY * (dev.fault_count ?? 0)
  return round1(Math.min(100, Math.max(0, score)))
}

/** 设备是否在线（与后端 device_health 同口径） */
export function isOnline(dev: Device): boolean {
  if (typeof dev.online === 'boolean') return dev.online
  return dev.status !== 'OFFLINE'
}

/** 整批设备的在线率/平均健康分，与后端 health_summary 同口径 */
export function summarizeHealth(devices: Device[]): HealthSummary | null {
  if (!devices.length) return null
  const onlineCount = devices.filter(isOnline).length
  const avgHealth = devices.reduce((sum, d) => sum + healthOf(d), 0) / devices.length
  return {
    online_rate: round1((onlineCount / devices.length) * 100),
    avg_health: round1(avgHealth),
    total: devices.length,
    online_count: onlineCount,
  }
}

/** 取整批设备的健康概览：优先用后端下发值，缺失时按统一口径现场汇总 */
export function useHealthSummary(devices: Device[], summary?: HealthSummary | null): HealthSummary | null {
  if (summary) return summary
  return summarizeHealth(devices)
}

/** 健康分配色（沿用面板既有色系，不改样式） */
export function healthColor(score: number): string {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#fbbf24'
  if (score >= 40) return '#f97316'
  return '#ef4444'
}
