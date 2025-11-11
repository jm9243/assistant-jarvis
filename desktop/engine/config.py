"""
配置管理模块
"""
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用配置"""
    
    # 服务配置
    host: str = "127.0.0.1"
    port: int = 8000
    
    # Backend配置
    backend_url: str = "http://localhost:8080"
    backend_timeout: int = 30
    
    # LLM配置（通过 Go 后台代理，不再需要直接配置 API Key）
    # API Key 存储在 Go 后台的数据库中
    
    # Embedding配置
    embedding_model: str = "text-embedding-ada-002"
    embedding_dimensions: int = 1536
    
    # 向量数据库配置
    chroma_data_dir: str = str(Path.home() / ".jarvis" / "chroma")
    
    # 性能配置
    max_concurrent_llm_requests: int = 5
    llm_timeout: int = 60
    vector_search_timeout: int = 5
    
    # 记忆配置
    short_term_memory_window: int = 10
    short_term_memory_max_conversations: int = 100
    long_term_memory_retention_days: int = 90
    working_memory_max_size: int = 1000
    
    # 内存优化配置
    enable_memory_optimization: bool = True
    memory_cleanup_interval: int = 300  # 5分钟
    memory_max_idle_time: int = 1800  # 30分钟
    memory_threshold_mb: float = 1000  # 1GB
    
    # 文档处理配置
    chunk_size: int = 500
    chunk_overlap: int = 50
    max_document_size_mb: int = 50
    
    # 缓存配置
    llm_cache_size: int = 1000
    llm_cache_ttl: int = 3600  # 1小时
    
    # 日志配置
    log_level: str = "INFO"
    log_dir: str = str(Path.home() / ".jarvis" / "logs")
    
    # 安全配置
    enable_tool_approval: bool = True
    enable_audit_log: bool = True
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# 全局配置实例
settings = Settings()


def get_settings() -> Settings:
    """获取配置实例"""
    return settings


def init_directories():
    """初始化必要的目录"""
    directories = [
        Path(settings.chroma_data_dir),
        Path(settings.log_dir),
        Path.home() / ".jarvis" / "data",
        Path.home() / ".jarvis" / "temp",
    ]
    
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)
