from enum import Enum
from typing import Generic, TypeVar, Optional
from pydantic import BaseModel


class Status(str, Enum):
    """执行状态枚举"""

    IDLE = "idle"
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


T = TypeVar("T")


class Result(BaseModel, Generic[T]):
    """统一响应模型"""

    success: bool
    data: Optional[T] = None
    error: Optional[str] = None
    error_code: Optional[str] = None

    @classmethod
    def ok(cls, data: Optional[T] = None) -> "Result[T]":
        """成功响应"""
        return cls(success=True, data=data)

    @classmethod
    def fail(cls, error: str, error_code: Optional[str] = None) -> "Result[T]":
        """失败响应"""
        return cls(success=False, error=error, error_code=error_code)
