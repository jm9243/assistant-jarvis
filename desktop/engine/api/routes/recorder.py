"""录制器相关API"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from models.common import Result
from core.recorder.service import recorder_service

router = APIRouter()


@router.post("/start")
async def start_recording(payload: dict | None = None):
    mode = (payload or {}).get('mode', 'auto')
    await recorder_service.start(mode)
    return Result(success=True, message="录制已开始")


@router.post("/stop")
async def stop_recording():
    steps = await recorder_service.stop()
    return Result(success=True, data={"steps": steps})


@router.websocket("/ws")
async def recorder_ws(websocket: WebSocket):
    await websocket.accept()
    queue = recorder_service.subscribe()
    try:
        while True:
            payload = await queue.get()
            await websocket.send_json(payload)
    except WebSocketDisconnect:
        pass
    finally:
        recorder_service.unsubscribe(queue)
