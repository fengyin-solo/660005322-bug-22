"""健康度统一口径（前后端共用同一份定义）

健康评分与在线率只在本模块计算一次：
- availability：可用性，按运行时长与故障次数折算，取值 0~100
    availability = uptime / (uptime + fault_count) * 100
    （uptime 与故障次数都为 0 的新设备视为 100）
- health_score：在可用性基础上按故障次数扣分，截断到 0~100
    health = clamp(availability - 3 * fault_count, 0, 100)，保留 1 位小数
- online_rate：在线率，非 OFFLINE 设备占比，取值 0~100，保留 1 位小数

前端 src/utils/health.ts 必须与本文件公式保持一致，不得再按温度/运行时长另算。
"""
from __future__ import annotations

from typing import Iterable, Optional

FAULT_PENALTY = 3.0  # 每次故障在可用性基础上扣 3 分


def availability_rate(uptime: float, fault_count: int) -> float:
    """按可用性与故障次数折算在线可用率（0~100）。"""
    denominator = uptime + fault_count
    if denominator <= 0:
        return 100.0
    return min(100.0, uptime / denominator * 100.0)


def _round1(x: float) -> float:
    # 与前端 Math.round 对齐：四舍五入到 1 位小数（避免银行家舍入差异）
    sign = -1.0 if x < 0 else 1.0
    return sign * int(abs(x) * 10.0 + 0.5) / 10.0


def health_score(uptime: float, fault_count: int) -> float:
    """统一健康评分（0~100，1 位小数）。"""
    score = availability_rate(uptime, fault_count) - FAULT_PENALTY * (fault_count or 0)
    return _round1(min(100.0, max(0.0, score)))


def device_health(dev) -> dict:
    """生成设备的健康度字段，挂到设备快照与接口响应上。"""
    uptime = getattr(dev, "uptime", 0.0) or 0.0
    fault_count = getattr(dev, "fault_count", 0) or 0
    availability = _round1(availability_rate(uptime, fault_count))
    return {
        "availability": availability,
        "health_score": health_score(uptime, fault_count),
        "online": getattr(dev, "status", "OFFLINE") != "OFFLINE",
    }


def health_summary(devices: Iterable) -> Optional[dict]:
    """整批设备的在线率与平均健康分，供各面板统一取值。"""
    devs = list(devices)
    if not devs:
        return None
    metrics = [device_health(d) for d in devs]
    online = sum(1 for m in metrics if m["online"])
    return {
        "online_rate": _round1(online / len(devs) * 100.0),
        "avg_health": _round1(sum(m["health_score"] for m in metrics) / len(metrics)),
        "total": len(devs),
        "online_count": online,
    }
