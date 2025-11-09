"""系统通知与下载管理"""
from __future__ import annotations

from datetime import datetime
from typing import List

from utils.config import settings
from utils.datastore import JsonStore, generate_id


class SystemEventBus:
    def __init__(self) -> None:
        data_dir = settings.data_dir / 'data'
        self._notification_store = JsonStore(data_dir / 'notifications.json', [])
        self._download_store = JsonStore(data_dir / 'downloads.json', [])

    def list_notifications(self) -> List[dict]:
        return self._notification_store.read()

    def push_notification(self, title: str, message: str, category: str = 'system') -> dict:
        notification = {
            'id': generate_id('notice'),
            'title': title,
            'message': message,
            'category': category,
            'read': False,
            'created_at': datetime.utcnow().isoformat(),
        }
        data = self._notification_store.read()
        data.append(notification)
        self._notification_store.write(data)
        return notification

    def mark_notification(self, notification_id: str, read: bool = True) -> None:
        data = self._notification_store.read()
        patched = []
        for item in data:
            if item['id'] == notification_id:
                item['read'] = read
            patched.append(item)
        self._notification_store.write(patched)

    def list_downloads(self) -> List[dict]:
        return self._download_store.read()

    def track_download(self, name: str, url: str) -> dict:
        record = {
            'id': generate_id('download'),
            'name': name,
            'url': url,
            'status': 'completed',
            'created_at': datetime.utcnow().isoformat(),
        }
        data = self._download_store.read()
        data.append(record)
        self._download_store.write(data)
        return record


system_event_bus = SystemEventBus()
