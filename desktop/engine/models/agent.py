"""Agent数据模型"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal

from pydantic import BaseModel, Field


class AgentMetrics(BaseModel):
    """Agent运行指标"""

    calls: int = 0
    avg_latency_ms: float = 0.0
    success_rate: float = 1.0
    token_usage: int = 0
    tool_invocations: int = 0


class AgentConfig(BaseModel):
    """Agent配置"""

    model: str = "gpt-4o-mini"
    temperature: float = 0.7
    max_tokens: int = 2000
    system_prompt: str = ""
    max_iterations: int = 4
    tool_strategy: Literal['auto', 'manual', 'approval'] = 'auto'
    timeout_ms: int = 120_000
    memory_policy: Dict[str, int] = Field(
        default_factory=lambda: {'short_term': 6, 'long_term': 50}
    )


class AgentMessage(BaseModel):
    """对话消息"""

    role: Literal['user', 'assistant', 'tool', 'system']
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    references: List[str] = Field(default_factory=list)


class AgentSession(BaseModel):
    """对话会话"""

    id: str
    agent_id: str
    title: str
    messages: List[AgentMessage] = Field(default_factory=list)
    summary: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class AgentMemory(BaseModel):
    """记忆片段"""

    id: str
    agent_id: str
    scope: Literal['short_term', 'long_term', 'working']
    content: str
    importance: Literal['low', 'medium', 'high'] = 'low'
    tags: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AgentTemplate(BaseModel):
    """Agent模板定义"""

    id: str
    name: str
    description: str
    type: Literal['basic', 'react', 'research']
    tags: List[str] = Field(default_factory=list)
    preset: AgentConfig
    recommended_tools: List[str] = Field(default_factory=list)
    recommended_kbs: List[str] = Field(default_factory=list)


class Agent(BaseModel):
    """Agent定义"""

    id: str
    name: str
    type: Literal['basic', 'react', 'research']
    status: Literal['idle', 'running', 'offline'] = 'idle'
    description: str | None = None
    avatar: str | None = None
    tags: List[str] = Field(default_factory=list)
    config: AgentConfig
    knowledge_bases: List[str] = Field(default_factory=list)
    tools: List[str] = Field(default_factory=list)
    permissions: List[str] = Field(default_factory=list)
    metrics: AgentMetrics = Field(default_factory=AgentMetrics)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
