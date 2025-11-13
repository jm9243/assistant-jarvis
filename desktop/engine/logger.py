"""
日志配置模块
"""
import logging
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler
from datetime import datetime

from config import settings


def setup_logger(name: str = "jarvis") -> logging.Logger:
    """
    配置日志系统
    
    Args:
        name: 日志器名称
        
    Returns:
        配置好的日志器
    """
    # 创建日志目录
    log_dir = Path(settings.log_dir)
    log_dir.mkdir(parents=True, exist_ok=True)
    
    # 创建日志器
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, settings.log_level.upper()))
    
    # 避免重复添加处理器
    if logger.handlers:
        return logger
    
    # 日志格式
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # 文件处理器 - 主日志
    main_log_file = log_dir / "agent.log"
    file_handler = RotatingFileHandler(
        main_log_file,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)
    
    # 文件处理器 - 错误日志
    error_log_file = log_dir / "error.log"
    error_handler = RotatingFileHandler(
        error_log_file,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    
    # 控制台处理器 - 使用stderr避免干扰stdout的IPC通信
    console_handler = logging.StreamHandler(sys.stderr)
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter(
        '%(levelname)s - %(message)s'
    )
    console_handler.setFormatter(console_formatter)
    
    # 添加处理器
    logger.addHandler(file_handler)
    logger.addHandler(error_handler)
    logger.addHandler(console_handler)
    
    return logger


def get_logger(name: str = "jarvis") -> logging.Logger:
    """
    获取日志器
    
    Args:
        name: 日志器名称
        
    Returns:
        日志器实例
    """
    logger = logging.getLogger(name)
    if not logger.handlers:
        return setup_logger(name)
    return logger


# 创建默认日志器
default_logger = setup_logger()


def log_agent_action(agent_id: str, action: str, details: dict = None):
    """
    记录Agent操作日志
    
    Args:
        agent_id: Agent ID
        action: 操作类型
        details: 详细信息
    """
    logger = get_logger("agent")
    logger.info(f"Agent[{agent_id}] - {action}", extra={"details": details or {}})


def log_tool_call(tool_id: str, agent_id: str, params: dict, result: any = None, error: str = None):
    """
    记录工具调用日志
    
    Args:
        tool_id: 工具ID
        agent_id: Agent ID
        params: 调用参数
        result: 执行结果
        error: 错误信息
    """
    logger = get_logger("tool")
    status = "success" if error is None else "failed"
    logger.info(
        f"Tool[{tool_id}] called by Agent[{agent_id}] - {status}",
        extra={
            "params": params,
            "result": result,
            "error": error
        }
    )


def log_llm_call(provider: str, model: str, tokens: int = None, latency_ms: int = None, error: str = None):
    """
    记录LLM调用日志
    
    Args:
        provider: 提供商
        model: 模型名称
        tokens: Token数量
        latency_ms: 延迟（毫秒）
        error: 错误信息
    """
    logger = get_logger("llm")
    status = "success" if error is None else "failed"
    logger.info(
        f"LLM[{provider}/{model}] - {status}",
        extra={
            "tokens": tokens,
            "latency_ms": latency_ms,
            "error": error
        }
    )
