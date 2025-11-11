"""
Agent相关数据模型
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Optional, Literal, Any
from pydantic import BaseModel, validator


# ============= 配置模型 =============

class ModelConfig(BaseModel):
    """模型配置（客户端版本 - 不包含敏感信息）"""
    provider: Literal["openai", "claude"]
    model: str
    temperature: float = 0.7
    max_tokens: int = 2000
    top_p: float = 1.0
    frequency_penalty: float = 0.0
    presence_penalty: float = 0.0
    # API Key 和 base_url 由后台统一管理，从环境变量读取
    supports_vision: bool = False  # 是否支持视觉输入
    
    def model_post_init(self, __context):
        """Pydantic V2的初始化后钩子"""
        # 自动检测视觉支持
        if not self.supports_vision:
            self.supports_vision = self._detect_vision_support()
    
    def _detect_vision_support(self) -> bool:
        """检测模型是否支持视觉"""
        vision_models = [
            'gpt-4-vision',
            'gpt-4-turbo',
            'gpt-4o',
            'claude-3-opus',
            'claude-3-sonnet',
            'claude-3-haiku'
        ]
        return any(vm in self.model.lower() for vm in vision_models)


class MemoryConfig(BaseModel):
    """记忆配置"""
    short_term: Dict = field(default_factory=lambda: {
        "enabled": True,
        "window_size": 10
    })
    long_term: Dict = field(default_factory=lambda: {
        "enabled": True,
        "retention_days": 90
    })
    working: Dict = field(default_factory=lambda: {
        "enabled": True
    })


class AgentConfig(BaseModel):
    """Agent配置"""
    model_config = {}  # Pydantic V2配置，必须在类定义开始
    
    id: str
    user_id: str
    name: str
    description: str
    type: Literal["basic", "react", "deep_research"]
    avatar_url: Optional[str] = None
    tags: List[str] = []
    
    # LLM模型配置（避免与Pydantic的model_config冲突）
    llm_config: ModelConfig
    
    # Prompt配置
    system_prompt: str
    prompt_template: Optional[str] = None
    
    # 记忆配置
    memory_config: MemoryConfig = MemoryConfig()
    
    # 知识库绑定
    knowledge_base_ids: List[str] = []
    
    # 工具绑定
    tool_ids: List[str] = []
    
    # ReAct特定配置
    react_config: Optional[Dict] = None
    
    # Research特定配置
    research_config: Optional[Dict] = None
    
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    
    @validator('name')
    def validate_name(cls, v):
        if len(v) < 2 or len(v) > 100:
            raise ValueError('名称长度必须在2-100之间')
        return v
    
    @validator('description')
    def validate_description(cls, v):
        if len(v) > 500:
            raise ValueError('描述长度不能超过500')
        return v


# ============= 会话和消息模型 =============

@dataclass
class Conversation:
    """会话"""
    id: str
    agent_id: str
    user_id: str
    title: str
    summary: Optional[str] = None
    message_count: int = 0
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)


@dataclass
class Message:
    """消息"""
    id: str
    conversation_id: str
    role: Literal["system", "user", "assistant", "function"]
    content: str
    metadata: Dict = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class StreamChunk:
    """流式响应块"""
    delta: str
    finish_reason: Optional[str] = None


# ============= API请求/响应模型 =============

class AgentCreateRequest(BaseModel):
    """Agent创建请求"""
    name: str
    description: str
    type: Literal["basic", "react", "deep_research"]
    avatar_url: Optional[str] = None
    tags: List[str] = []
    llm_config: ModelConfig
    system_prompt: str
    prompt_template: Optional[str] = None
    memory_config: Optional[MemoryConfig] = None
    knowledge_base_ids: List[str] = []
    tool_ids: List[str] = []
    react_config: Optional[Dict] = None
    research_config: Optional[Dict] = None
    
    @validator('name')
    def validate_name(cls, v):
        if len(v) < 2 or len(v) > 100:
            raise ValueError('名称长度必须在2-100之间')
        return v
    
    @validator('description')
    def validate_description(cls, v):
        if len(v) > 500:
            raise ValueError('描述长度不能超过500')
        return v


class AgentUpdateRequest(BaseModel):
    """Agent更新请求"""
    name: Optional[str] = None
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    tags: Optional[List[str]] = None
    llm_config: Optional[ModelConfig] = None
    system_prompt: Optional[str] = None
    prompt_template: Optional[str] = None
    memory_config: Optional[MemoryConfig] = None
    knowledge_base_ids: Optional[List[str]] = None
    tool_ids: Optional[List[str]] = None
    react_config: Optional[Dict] = None
    research_config: Optional[Dict] = None


class ConversationCreateRequest(BaseModel):
    """会话创建请求"""
    agent_id: str
    title: Optional[str] = "新对话"


class MessageSendRequest(BaseModel):
    """消息发送请求"""
    content: str
    stream: bool = True
    attachments: List[Dict] = []
