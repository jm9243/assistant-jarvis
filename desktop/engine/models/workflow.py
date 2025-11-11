from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from .common import Status


class NodeData(BaseModel):
    """节点数据"""

    label: str
    description: Optional[str] = None
    config: Dict[str, Any] = Field(default_factory=dict)
    locator: Optional[Dict[str, Any]] = None


class Node(BaseModel):
    """工作流节点"""

    id: str
    type: str
    position: Dict[str, float]
    data: NodeData


class Edge(BaseModel):
    """节点连接"""

    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None


class Workflow(BaseModel):
    """工作流定义"""

    id: str
    name: str
    description: Optional[str] = None
    version: str = "1.0.0"
    nodes: List[Node] = Field(default_factory=list)
    edges: List[Edge] = Field(default_factory=list)
    variables: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class ExecutionEvent(BaseModel):
    """执行事件"""

    run_id: str
    node_id: str
    status: Status
    log: Optional[str] = None
    snapshot: Optional[Dict[str, Any]] = None
    progress: Optional[float] = None
    timestamp: datetime = Field(default_factory=datetime.now)


class ExecutionRecord(BaseModel):
    """执行记录"""

    id: str
    workflow_id: str
    status: Status
    start_time: datetime
    end_time: Optional[datetime] = None
    logs: List[Dict[str, Any]] = Field(default_factory=list)
    screenshots: List[str] = Field(default_factory=list)
    variables: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[Dict[str, str]] = None
