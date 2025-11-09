"""Multi-Agent 协同模型"""
from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Literal

from pydantic import BaseModel, Field


OrchestrationMode = Literal['workflow', 'organization', 'supervisor', 'meeting']


class Participant(BaseModel):
    id: str
    agent_id: str
    role: Literal['director', 'manager', 'employee', 'moderator', 'participant', 'observer']
    responsibilities: List[str] = Field(default_factory=list)


class Orchestration(BaseModel):
    id: str
    name: str
    mode: OrchestrationMode
    description: str | None = None
    participants: List[Participant] = Field(default_factory=list)
    graph: Dict[str, List[str]] = Field(default_factory=dict)
    status: Literal['draft', 'active', 'completed'] = 'draft'
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class MeetingTurn(BaseModel):
    speaker_agent_id: str
    role: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class Meeting(BaseModel):
    id: str
    orchestration_id: str
    topic: str
    status: Literal['scheduled', 'running', 'completed'] = 'scheduled'
    round: int = 0
    max_rounds: int = 6
    turns: List[MeetingTurn] = Field(default_factory=list)
    summary: str | None = None
