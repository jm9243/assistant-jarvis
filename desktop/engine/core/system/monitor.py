"""系统监控"""
from __future__ import annotations

from datetime import datetime
from typing import List

import psutil

from core.system.events import system_event_bus
from utils.config import settings


class SystemMonitor:
    def __init__(self) -> None:
        self._alerts: List[dict] = []

    def get_status(self) -> dict:
        cpu = psutil.cpu_percent(interval=None)
        memory = psutil.virtual_memory().percent
        disk = psutil.disk_usage('/')
        net = psutil.net_io_counters()
        return {
            'cpu': round(cpu, 2),
            'memory': round(memory, 2),
            'disk': round(disk.percent, 2),
            'network': {
                'sent': net.bytes_sent,
                'received': net.bytes_recv,
            },
            'notifications': len([item for item in system_event_bus.list_notifications() if not item['read']]),
            'sidecarStatus': 'running',
            'alerts': self._alerts[-5:],
        }

    def add_alert(self, level: str, message: str) -> None:
        self._alerts.append({
            'id': f'alert-{len(self._alerts) + 1}',
            'level': level,
            'message': message,
            'created_at': datetime.utcnow().isoformat(),
        })


monitor = SystemMonitor()
