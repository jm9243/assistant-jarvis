from typing import List, Literal, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from .common import Status


class Alert(BaseModel):
    """系统告警"""

    id: str
    level: Literal["info", "warn", "error"]
    message: str
    timestamp: datetime = Field(default_factory=datetime.now)


class SystemMetric(BaseModel):
    """系统指标"""

    cpu: float
    memory: float
    sidecarStatus: Status
    alerts: List[Alert] = Field(default_factory=list)


class SoftwareItem(BaseModel):
    """软件项"""

    id: str
    name: str
    version: Optional[str] = None
    platform: Literal["macos", "windows"]
    compatibility: Literal["full", "partial", "unknown"]
    capabilities: List[str] = Field(default_factory=list)
