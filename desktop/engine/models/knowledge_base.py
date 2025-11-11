"""
知识库相关数据模型
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Optional, Literal
from pydantic import BaseModel, validator


# ============= 知识库模型 =============

@dataclass
class KnowledgeBase:
    """知识库"""
    id: str
    user_id: str
    name: str
    description: str
    embedding_model: str = "text-embedding-ada-002"
    chunk_size: int = 500
    chunk_overlap: int = 50
    document_count: int = 0
    vector_count: int = 0
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)


@dataclass
class Document:
    """文档"""
    id: str
    knowledge_base_id: str
    name: str
    file_path: str
    file_type: str
    file_size: int
    status: Literal["pending", "processing", "completed", "failed"]
    chunk_count: int = 0
    error_message: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    processed_at: Optional[datetime] = None


@dataclass
class SearchResult:
    """检索结果"""
    content: str
    similarity: float
    document_name: str
    metadata: Dict = field(default_factory=dict)


# ============= 工具模型 =============

@dataclass
class Tool:
    """工具"""
    id: str
    name: str
    description: str
    type: Literal["workflow", "mcp", "http", "system", "builtin"]
    category: str
    parameters_schema: Dict  # JSON Schema
    config: Dict = field(default_factory=dict)
    approval_policy: Literal["auto", "required", "manual"] = "required"
    allowed_agents: List[str] = field(default_factory=list)
    is_enabled: bool = True
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class ToolCall:
    """工具调用"""
    id: str
    tool_id: str
    agent_id: str
    conversation_id: str
    input_params: Dict
    output_result: Optional[Dict] = None
    status: Literal["pending", "approved", "rejected", "executing", "completed", "failed"] = "pending"
    execution_time_ms: Optional[int] = None
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None


# ============= API请求/响应模型 =============

class KnowledgeBaseCreateRequest(BaseModel):
    """知识库创建请求"""
    name: str
    description: str
    embedding_model: str = "text-embedding-ada-002"
    chunk_size: int = 500
    chunk_overlap: int = 50
    
    @validator('name')
    def validate_name(cls, v):
        if len(v) < 2 or len(v) > 100:
            raise ValueError('名称长度必须在2-100之间')
        return v
    
    @validator('chunk_size')
    def validate_chunk_size(cls, v):
        if v < 100 or v > 2000:
            raise ValueError('分块大小必须在100-2000之间')
        return v
    
    @validator('chunk_overlap')
    def validate_chunk_overlap(cls, v):
        if v < 0 or v > 500:
            raise ValueError('分块重叠必须在0-500之间')
        return v


class KnowledgeBaseUpdateRequest(BaseModel):
    """知识库更新请求"""
    name: Optional[str] = None
    description: Optional[str] = None
    embedding_model: Optional[str] = None
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None
    
    @validator('name')
    def validate_name(cls, v):
        if v is not None and (len(v) < 2 or len(v) > 100):
            raise ValueError('名称长度必须在2-100之间')
        return v
    
    @validator('chunk_size')
    def validate_chunk_size(cls, v):
        if v is not None and (v < 100 or v > 2000):
            raise ValueError('分块大小必须在100-2000之间')
        return v
    
    @validator('chunk_overlap')
    def validate_chunk_overlap(cls, v):
        if v is not None and (v < 0 or v > 500):
            raise ValueError('分块重叠必须在0-500之间')
        return v


class DocumentUploadRequest(BaseModel):
    """文档上传请求"""
    knowledge_base_id: str
    file_name: str
    file_type: str
    file_size: int
    metadata: Dict = {}


class SearchRequest(BaseModel):
    """检索请求"""
    query: str
    top_k: int = 5
    min_similarity: float = 0.7
    search_type: Literal["vector", "keyword", "hybrid"] = "vector"
    
    @validator('top_k')
    def validate_top_k(cls, v):
        if v < 1 or v > 50:
            raise ValueError('top_k必须在1-50之间')
        return v
    
    @validator('min_similarity')
    def validate_min_similarity(cls, v):
        if v < 0 or v > 1:
            raise ValueError('相似度阈值必须在0-1之间')
        return v


class ToolRegisterRequest(BaseModel):
    """工具注册请求"""
    id: str
    name: str
    description: str
    type: Literal["workflow", "mcp", "http", "system", "builtin"]
    category: str
    parameters_schema: Dict
    config: Dict = {}
    approval_policy: Literal["auto", "required", "manual"] = "required"
    allowed_agents: List[str] = []


class ToolCallRequest(BaseModel):
    """工具调用请求"""
    agent_id: str
    conversation_id: str
    params: Dict


class ToolApprovalRequest(BaseModel):
    """工具审批请求"""
    action: Literal["approve", "reject"]
    reason: Optional[str] = None
