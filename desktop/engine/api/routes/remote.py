"""远程触发 API"""
import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from core.remote.hub import remote_hub
from models.common import Result

router = APIRouter()


class RemoteCommand(BaseModel):
    type: str
    payload: dict | None = None


@router.websocket('/ws')
async def remote_ws(websocket: WebSocket):
    await websocket.accept()
    queue = await remote_hub.subscribe()

    async def listener() -> None:
        while True:
            data = await websocket.receive_json()
            await remote_hub.handle_command(data)

    listener_task = asyncio.create_task(listener())
    try:
        while True:
            payload = await queue.get()
            await websocket.send_json(payload)
    except WebSocketDisconnect:
        pass
    finally:
        listener_task.cancel()
        remote_hub.unsubscribe(queue)


@router.post('/command')
async def remote_command(payload: RemoteCommand):
    result = await remote_hub.handle_command(payload.model_dump())
    return Result(success=True, data=result)
