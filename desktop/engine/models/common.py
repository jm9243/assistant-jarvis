"""
通用数据模型
"""
from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel


class Status(str, Enum):
    """执行状态"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Result(BaseModel):
    """执行结果"""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    message: Optional[str] = None

