"""工作流执行器"""
from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Dict, List

from loguru import logger

from models.workflow import Workflow
from .events import ExecutionEvent, ExecutionRun
from .storage import ExecutionStorage
from utils.config import settings


class WorkflowExecutor:
    """简化版的工作流执行器，顺序执行节点并推送事件"""

    def __init__(self) -> None:
        self._storage = ExecutionStorage(settings.data_dir / 'data' / 'executions.db')
        self._subscribers: List[asyncio.Queue[dict]] = []
        self._locks: Dict[str, asyncio.Lock] = {}
        self._controls: Dict[str, str] = {}
        self._pause_events: Dict[str, asyncio.Event] = {}
        self._active_runs: Dict[str, ExecutionRun] = {}

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

    async def execute(self, workflow: Workflow, params: dict | None = None, priority: str = 'medium') -> ExecutionRun:
        run = ExecutionRun.create(workflow.id, workflow.name)
        run.params = params or {}
        run.priority = priority  # type: ignore[assignment]
        run.metadata['version'] = workflow.version
        self._storage.save_run(run)
        pause_event = asyncio.Event()
        pause_event.set()
        self._pause_events[run.id] = pause_event
        self._controls[run.id] = 'running'
        self._active_runs[run.id] = run
        asyncio.create_task(self._execute_nodes(run, workflow, params or {}))
        return run

    async def _execute_nodes(self, run: ExecutionRun, workflow: Workflow, params: dict) -> None:
        lock = self._locks.setdefault(run.id, asyncio.Lock())
        async with lock:
            logger.info('Executing workflow {} ({})', workflow.name, run.id)
            await self._update_status(run, 'running', progress=0.0)
            total = max(1, len(workflow.nodes))
            for index, node in enumerate(workflow.nodes, start=1):
                await self._wait_if_paused(run.id)
                if self._controls.get(run.id) == 'cancelled':
                    await self._update_status(run, 'cancelled', error='用户取消')
                    self._cleanup(run.id)
                    return
                progress = round((index - 1) / total, 3)
                await self._update_status(run, 'running', progress=progress, current_node=node.id)
                event = ExecutionEvent(
                    run_id=run.id,
                    node_id=node.id,
                    status='running',
                    message=f"执行节点 {node.label} ({node.type})",
                    timestamp=datetime.utcnow().isoformat(),
                    progress=progress,
                    payload={'params': params},
                )
                self._storage.append_log(event)
                await self._publish(event.model_dump())
                await asyncio.sleep(0.1)  # 模拟执行耗时
                completion = ExecutionEvent(
                    run_id=run.id,
                    node_id=node.id,
                    status='completed',
                    message='节点执行完成',
                    timestamp=datetime.utcnow().isoformat(),
                    progress=round(index / total, 3),
                    payload={'result': 'ok'},
                )
                self._storage.append_log(completion)
                await self._publish(completion.model_dump())
            await self._update_status(run, 'completed', progress=1.0)
            logger.info('Workflow {} completed', workflow.name)
            self._cleanup(run.id)

    async def _wait_if_paused(self, run_id: str) -> None:
        event = self._pause_events.get(run_id)
        if event:
            await event.wait()

    async def _update_status(self, run: ExecutionRun, status: str, *, progress: float | None = None, current_node: str | None = None, error: str | None = None) -> None:
        run.status = status
        if progress is not None:
            run.progress = progress
        if current_node is not None:
            run.current_node = current_node
        if error:
            run.error = error
        if status in {'completed', 'failed', 'cancelled'}:
            run.finished_at = datetime.utcnow().isoformat()
        self._storage.save_run(run)
        await self._publish(run.model_dump())

    def _cleanup(self, run_id: str) -> None:
        self._pause_events.pop(run_id, None)
        self._controls.pop(run_id, None)
        self._active_runs.pop(run_id, None)

    def list_runs(self) -> List[ExecutionRun]:
        return self._storage.fetch_runs()

    def get_logs(self, run_id: str) -> List[ExecutionEvent]:
        return self._storage.fetch_logs(run_id)

    async def pause(self, run_id: str) -> None:
        event = self._pause_events.get(run_id)
        run = self._active_runs.get(run_id)
        if not event or not run:
            return
        event.clear()
        self._controls[run_id] = 'paused'
        await self._update_status(run, 'paused', progress=run.progress)

    async def resume(self, run_id: str) -> None:
        event = self._pause_events.get(run_id)
        run = self._active_runs.get(run_id)
        if not event or not run:
            return
        self._controls[run_id] = 'running'
        event.set()
        await self._update_status(run, 'running', progress=run.progress, current_node=run.current_node)

    async def cancel(self, run_id: str) -> None:
        self._controls[run_id] = 'cancelled'
        event = self._pause_events.get(run_id)
        if event:
            event.set()

    def save_template(self, workflow_id: str, name: str, params: dict) -> dict:
        return self._storage.save_template(workflow_id, name, params)

    def list_templates(self, workflow_id: str) -> List[dict]:
        return self._storage.list_templates(workflow_id)

    def save_trigger(self, workflow_id: str, trigger_type: str, config: dict, enabled: bool = True) -> dict:
        return self._storage.save_trigger(workflow_id, trigger_type, config, enabled)

    def list_triggers(self, workflow_id: str) -> List[dict]:
        return self._storage.list_triggers(workflow_id)


executor = WorkflowExecutor()
