from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Set
import asyncio
from loguru import logger

# 创建FastAPI应用
app = FastAPI(
    title="Jarvis Engine API",
    description="助手·贾维斯 Python执行引擎",
    version="1.0.0",
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:1420", "tauri://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket连接管理
class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, event: str, data: dict):
        """广播消息到所有连接"""
        message = {"event": event, "data": data}
        disconnected = set()

        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send message: {e}")
                disconnected.add(connection)

        # 清理断开的连接
        for connection in disconnected:
            self.disconnect(connection)

    async def send_to(self, websocket: WebSocket, event: str, data: dict):
        """发送消息到指定连接"""
        try:
            await websocket.send_json({"event": event, "data": data})
        except Exception as e:
            logger.error(f"Failed to send message: {e}")
            self.disconnect(websocket)


manager = ConnectionManager()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket端点"""
    await manager.connect(websocket)
    try:
        while True:
            # 接收客户端消息
            data = await websocket.receive_json()
            event = data.get("event")
            payload = data.get("data", {})

            logger.debug(f"Received WebSocket message: {event}")

            # 处理不同类型的消息
            if event == "ping":
                await manager.send_to(websocket, "pong", {})

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


@app.get("/")
async def root():
    """根路径"""
    return {
        "name": "Jarvis Engine API",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy"}


# 导入路由
from api.routes import (
    workflow,
    recorder as recorder_routes,
    system,
    agent,
    conversation,
    knowledge_base,
    tool,
    workflow_tool,
)

# 设置 WebSocket 管理器到 recorder
recorder_routes.set_ws_manager(manager)

# 所有路由统一使用 /engine 前缀，避免与云服务API(/api/v1)冲突
# Phase 1 路由
app.include_router(workflow.router, prefix="/engine/workflows", tags=["workflow"])
app.include_router(recorder_routes.router, prefix="/engine/recorder", tags=["recorder"])
app.include_router(system.router, prefix="/engine/system", tags=["system"])

# Phase 2 Agent路由
app.include_router(agent.router, prefix="/engine", tags=["agents"])
app.include_router(conversation.router, prefix="/engine", tags=["conversations"])
app.include_router(knowledge_base.router, prefix="/engine", tags=["knowledge-bases"])
app.include_router(tool.router, prefix="/engine", tags=["tools"])
app.include_router(workflow_tool.router, prefix="/engine", tags=["workflow-tools"])
