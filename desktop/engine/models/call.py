"""语音通话模型"""
from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Literal

from pydantic import BaseModel, Field


class AudioDevice(BaseModel):
    id: str
    name: str
    type: Literal['input', 'output']
    is_virtual: bool = False
    selected: bool = False


class CallTranscript(BaseModel):
    role: Literal['caller', 'assistant', 'system']
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class CallRecord(BaseModel):
    id: str
    contact: str
    channel: Literal['wechat', 'wecom', 'voip', 'phone']
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: datetime | None = None
    duration_seconds: int = 0
    status: Literal['active', 'completed', 'failed', 'missed'] = 'active'
    hangup_reason: str | None = None
    transcript: List[CallTranscript] = Field(default_factory=list)
    summary: str | None = None
    tags: List[str] = Field(default_factory=list)
    stats: Dict[str, float] = Field(default_factory=dict)
