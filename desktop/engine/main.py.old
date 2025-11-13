#!/usr/bin/env python3
"""
助手·贾维斯 Python执行引擎
"""
import sys
import uvicorn
from loguru import logger
from pathlib import Path

# 配置日志
logger.remove()
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO",
)

# 添加文件日志
log_dir = Path.home() / ".jarvis" / "logs"
log_dir.mkdir(parents=True, exist_ok=True)
logger.add(
    log_dir / "engine.log",
    rotation="10 MB",
    retention="7 days",
    level="DEBUG",
)


def main():
    """主函数"""
    logger.info("Starting Jarvis Engine...")
    logger.info(f"Python version: {sys.version}")
    logger.info(f"Platform: {sys.platform}")

    try:
        # 启动FastAPI服务器
        uvicorn.run(
            "api.server:app",
            host="127.0.0.1",
            port=8000,
            log_level="info",
            reload=False,
        )
    except KeyboardInterrupt:
        logger.info("Engine stopped by user")
    except Exception as e:
        logger.error(f"Engine crashed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
