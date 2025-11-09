"""执行事件定义"""
from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field


class ExecutionEvent(BaseModel):
    run_id: str
    node_id: str
    status: Literal['pending', 'running', 'completed', 'failed']
    message: str
    timestamp: str
    progress: float | None = None
    payload: dict | None = None


class ExecutionRun(BaseModel):
    id: str
    workflow_id: str
    workflow_name: str
    status: str
    trigger: str = 'manual'
    started_at: str
    finished_at: str | None = None
    priority: Literal['high', 'medium', 'low'] = 'medium'
    progress: float = 0.0
    params: dict = Field(default_factory=dict)
    current_node: str | None = None
    error: str | None = None
    metadata: dict = Field(default_factory=dict)

    @classmethod
    def create(cls, workflow_id: str, workflow_name: str) -> 'ExecutionRun':
        now = datetime.utcnow().isoformat()
        return cls(
            id=str(uuid4()),
            workflow_id=workflow_id,
            workflow_name=workflow_name,
            status='pending',
            started_at=now,
        )
