"""远程触发 Hub"""
from __future__ import annotations

import asyncio
from typing import Any, Dict, List

from loguru import logger

from core.workflow.executor import executor
from models.workflow import Workflow


class RemoteHub:
    def __init__(self) -> None:
        self._subscribers: List[asyncio.Queue[dict]] = []

    async def subscribe(self) -> asyncio.Queue[dict]:
        queue: asyncio.Queue[dict] = asyncio.Queue()
        self._subscribers.append(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue[dict]) -> None:
        if queue in self._subscribers:
            self._subscribers.remove(queue)

    async def broadcast(self, payload: dict) -> None:
        for queue in list(self._subscribers):
            await queue.put(payload)

    async def handle_command(self, command: Dict[str, Any]) -> dict:
        """处理远程命令，支持执行工作流等"""
        cmd_type = command.get('type')
        if cmd_type == 'execute_workflow':
            workflow_payload = command.get('workflow')
            if not workflow_payload:
                raise ValueError('workflow payload missing')
            workflow = Workflow.model_validate(workflow_payload)
            params = command.get('params', {})
            run = await executor.execute(workflow, params)
            await self.broadcast({'type': 'execution_started', 'run': run.model_dump()})
            return {'status': 'accepted', 'run': run.model_dump()}
        raise ValueError(f'Unknown remote command {cmd_type}')


remote_hub = RemoteHub()
