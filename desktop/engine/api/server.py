"""
FastAPI服务器
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from api.routes import (
    workflow,
    agent,
    recorder,
    system,
    auth,
    knowledge,
    tools,
    voice,
    assistant,
    mcp,
    multiagent,
    remote,
)


def create_app() -> FastAPI:
    """创建FastAPI应用"""
    
    app = FastAPI(
        title="Jarvis Engine API",
        description="贾维斯引擎API服务",
        version="0.1.0",
    )
    
    # CORS中间件
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # 注册路由
    app.include_router(workflow.router, prefix="/api/workflow", tags=["workflow"])
    app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    app.include_router(agent.router, prefix="/api/agent", tags=["agent"])
    app.include_router(recorder.router, prefix="/api/recorder", tags=["recorder"])
    app.include_router(system.router, prefix="/api/system", tags=["system"])
    app.include_router(knowledge.router, prefix="/api/knowledge", tags=["knowledge"])
    app.include_router(tools.router, prefix="/api/tools", tags=["tools"])
    app.include_router(voice.router, prefix="/api/voice", tags=["voice"])
    app.include_router(assistant.router, prefix="/api/assistant", tags=["assistant"])
    app.include_router(mcp.router, prefix="/api/mcp", tags=["mcp"])
    app.include_router(multiagent.router, prefix="/api/multi-agent", tags=["multi-agent"])
    app.include_router(remote.router, prefix="/api/remote", tags=["remote"])
    
    @app.get("/")
    async def root():
        return {"message": "Jarvis Engine is running"}
    
    @app.get("/health")
    async def health():
        return {"status": "ok"}
    
    logger.info("FastAPI application created")
    
    return app
