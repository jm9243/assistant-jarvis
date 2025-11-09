"""
配置管理模块
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用配置"""
    
    # 服务配置
    host: str = "127.0.0.1"
    port: int = 8000
    log_level: str = "INFO"
    
    # 数据目录
    data_dir: Path = Path(os.environ.get("JARVIS_DATA_DIR", Path.home() / ".jarvis"))
    log_file: Path = Path(os.environ.get("JARVIS_LOG_FILE", str(Path.home() / ".jarvis" / "logs" / "engine.log")))
    
    # Supabase配置
    supabase_url: str = ""
    supabase_key: str = ""
    
    # AI服务配置
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# 全局配置实例
settings = Settings()

# 确保数据目录存在
settings.data_dir.mkdir(parents=True, exist_ok=True)
(settings.data_dir / "logs").mkdir(exist_ok=True)
(settings.data_dir / "data").mkdir(exist_ok=True)
(settings.data_dir / "cache").mkdir(exist_ok=True)
