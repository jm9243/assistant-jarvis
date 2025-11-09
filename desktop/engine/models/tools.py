"""工具与治理模型"""
from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Literal

from pydantic import BaseModel, Field


ToolType = Literal['workflow', 'mcp', 'http', 'system', 'custom']
ApprovalStatus = Literal['pending', 'approved', 'rejected']
AuditStatus = Literal['success', 'failed', 'cancelled']


class ToolDefinition(BaseModel):
    id: str
    name: str
    type: ToolType
    description: str
    entrypoint: str | None = None
    config: Dict[str, str] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    enabled: bool = True
    approval_required: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ToolApproval(BaseModel):
    id: str
    tool_id: str
    reason: str
    params: Dict[str, str] = Field(default_factory=dict)
    status: ApprovalStatus = 'pending'
    requested_by: str
    reviewer: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    decided_at: datetime | None = None
    decision_note: str | None = None


class ToolAudit(BaseModel):
    id: str
    tool_id: str
    triggered_by: str
    duration_ms: int
    status: AuditStatus
    created_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, str] = Field(default_factory=dict)
