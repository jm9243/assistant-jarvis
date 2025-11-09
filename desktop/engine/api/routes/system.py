"""系统相关API"""
import platform
from fastapi import APIRouter
from pydantic import BaseModel

from core.system.events import system_event_bus
from core.system.monitor import monitor
from core.system.scanner import scanner
from models.common import Result

router = APIRouter()


class NotificationPayload(BaseModel):
    title: str
    message: str
    category: str = 'system'


class DownloadPayload(BaseModel):
    name: str
    url: str


@router.get("/info")
async def get_system_info():
    return Result(
        success=True,
        data={
            "platform": platform.system(),
            "version": "0.1.0",
        }
    )


@router.get("/status")
async def get_status():
    return Result(success=True, data=monitor.get_status())


@router.post("/scan")
async def scan_apps():
    items = scanner.scan()
    return Result(success=True, data=items)


@router.get('/notifications')
async def notifications():
    return Result(success=True, data=system_event_bus.list_notifications())


@router.post('/notifications')
async def push_notification(payload: NotificationPayload):
    data = system_event_bus.push_notification(payload.title, payload.message, payload.category)
    return Result(success=True, data=data)


@router.post('/notifications/{notification_id}/read')
async def read_notification(notification_id: str):
    system_event_bus.mark_notification(notification_id, True)
    return Result(success=True, data=True)


@router.get('/downloads')
async def list_downloads():
    return Result(success=True, data=system_event_bus.list_downloads())


@router.post('/downloads')
async def track_download(payload: DownloadPayload):
    record = system_event_bus.track_download(payload.name, payload.url)
    return Result(success=True, data=record)


@router.get('/updates/check')
async def check_update():
    return Result(success=True, data={'current': '0.1.0', 'latest': '0.1.0', 'channel': 'stable'})
