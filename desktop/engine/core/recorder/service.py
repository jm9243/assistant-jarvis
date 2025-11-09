"""智能录制器服务"""
from __future__ import annotations

import asyncio
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Dict, List
from uuid import uuid4

from loguru import logger


@dataclass
class NodeDraft:
    id: str
    action: str
    target: str
    strategy: str
    created_at: str


class RecorderService:
    def __init__(self) -> None:
        self._status: str = 'idle'
        self._mode: str = 'auto'
        self._steps: List[NodeDraft] = []
        self._subscribers: List[asyncio.Queue[dict]] = []
        self._task: asyncio.Task | None = None

    def subscribe(self) -> asyncio.Queue[dict]:
        queue: asyncio.Queue[dict] = asyncio.Queue()
        self._subscribers.append(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue[dict]) -> None:
        if queue in self._subscribers:
            self._subscribers.remove(queue)

    async def _publish(self, payload: dict) -> None:
        for queue in list(self._subscribers):
            await queue.put(payload)

    async def start(self, mode: str = 'auto') -> None:
        if self._status == 'recording':
            return
        self._status = 'recording'
        self._mode = mode
        self._steps = []
        await self._publish({'type': 'status', 'payload': {'status': 'recording'}})
        logger.info('Recorder started in {} mode', mode)
        if self._task and not self._task.done():
            self._task.cancel()
        self._task = asyncio.create_task(self._simulate_capture())

    async def _simulate_capture(self) -> None:
        for index in range(3):
            if self._status != 'recording':
                break
            node = NodeDraft(
                id=str(uuid4()),
                action=f'Click 按钮 {index + 1}',
                target=f'#demo-button-{index + 1}',
                strategy='AXUI',
                created_at=datetime.utcnow().isoformat(),
            )
            self._steps.append(node)
            await self._publish({'type': 'step', 'payload': asdict(node)})
            await asyncio.sleep(0.3)
        await self._publish({'type': 'status', 'payload': {'status': self._status}})

    async def stop(self) -> List[dict]:
        if self._status == 'idle':
            return []
        self._status = 'idle'
        if self._task and not self._task.done():
            self._task.cancel()
        await self._publish({'type': 'status', 'payload': {'status': 'idle'}})
        logger.info('Recorder stopped, steps=%s', len(self._steps))
        return [asdict(step) for step in self._steps]

    def snapshot(self) -> Dict[str, str]:
        return {'status': self._status, 'mode': self._mode}


recorder_service = RecorderService()
