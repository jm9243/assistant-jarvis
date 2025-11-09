"""AI 助手模型"""
from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Literal

from pydantic import BaseModel, Field


TaskStatus = Literal['planning', 'awaiting_confirmation', 'executing', 'completed', 'failed']


class PlanStep(BaseModel):
    id: str
    description: str
    target_type: Literal['agent', 'workflow', 'knowledge', 'tool']
    target_id: str | None = None
    status: Literal['pending', 'running', 'done', 'skipped'] = 'pending'
    inputs: Dict[str, str] = Field(default_factory=dict)
    result: str | None = None


class AssistantTask(BaseModel):
    id: str
    intent: str
    query: str
    status: TaskStatus = 'planning'
    confidence: float = 0.0
    steps: List[PlanStep] = Field(default_factory=list)
    result_summary: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
