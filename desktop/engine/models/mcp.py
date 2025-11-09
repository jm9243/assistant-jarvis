"""MCP服务器模型"""
from __future__ import annotations

from datetime import datetime
from typing import Dict, List

from pydantic import BaseModel, Field


class McpServer(BaseModel):
    id: str
    name: str
    endpoint: str
    api_key: str | None = None
    metadata: Dict[str, str] = Field(default_factory=dict)
    tools: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
