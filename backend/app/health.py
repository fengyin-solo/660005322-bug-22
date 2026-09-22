"""设备健康度统一口径（后端为唯一计算方）。

健康评分与在线率只在本模块按"可用性 + 故障次数"折算，
前端通过 /ws 推送与 /api/health 直接读取结果字段，不再自行按
温度/运行时长另算一遍，避免同一台设备各面板数值对不上。
"""

FAULT_PENALTY_PER_CASE = 2.0


def availability_ratio(uptime: float, fault_count: int) -> float:
    """可用性：运行时长占「运行 + 故障」时长的比例，上限 100%。

    与改造前 OEE 计算中的 availability 完全同公式（分母至少为 1），
    uptime 为 0 时返回 0，保证同批数据数值与改造前一致。
    """
    uptime = max(0.0, float(uptime))
    fault_count = max(0, int(fault_count))
    return min(1.0, uptime / max(1.0, uptime + fault_count))


def online_rate(uptime: float, fault_count: int) -> float:
    """在线率(%)，保留一位小数，与 OEE 中的可用性同口径。"""
    return round(availability_ratio(uptime, fault_count) * 100, 1)


def health_score(uptime: float, fault_count: int) -> float:
    """健康评分(0~100)：可用性折算为百分制后，每次累计故障扣 2 分。"""
    score = availability_ratio(uptime, fault_count) * 100 \
        - max(0, int(fault_count)) * FAULT_PENALTY_PER_CASE
    return round(min(100.0, max(0.0, score)), 1)


def health_metrics(uptime: float, fault_count: int) -> dict:
    """一次返回在线率与健康评分，供设备快照(to_dict)与 /api/health 共用。"""
    return {
        "online_rate": online_rate(uptime, fault_count),
        "health_score": health_score(uptime, fault_count),
    }
