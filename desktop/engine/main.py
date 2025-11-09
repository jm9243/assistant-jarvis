"""
Jarvis Engine - Python Sidecar入口文件
"""
import sys
import uvicorn
from loguru import logger

from api.server import create_app
from utils.config import settings


def setup_logger():
    """配置日志"""
    logger.remove()
    logger.add(
        sys.stderr,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level=settings.log_level,
    )
    logger.add(
        settings.log_file,
        rotation="10 MB",
        retention="30 days",
        level=settings.log_level,
    )


def main():
    """主函数"""
    setup_logger()
    logger.info("Jarvis Engine starting...")
    
    # 创建FastAPI应用
    app = create_app()
    
    # 启动服务
    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level.lower(),
    )


if __name__ == "__main__":
    main()

