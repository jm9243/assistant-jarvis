from fastapi import APIRouter
from models import Result
from loguru import logger
from core.recorder import RecorderService
from typing import Dict, Any

router = APIRouter()

# 全局录制器实例
recorder = RecorderService()

# WebSocket 管理器（从 server.py 导入）
_ws_manager = None

def set_ws_manager(manager):
    """设置 WebSocket 管理器"""
    global _ws_manager
    _ws_manager = manager
    
    # 注册录制器事件回调
    async def on_recorder_event(event_type: str, data: Dict[str, Any]):
        if _ws_manager:
            await _ws_manager.broadcast(event_type, data)
    
    recorder.add_event_callback(on_recorder_event)


@router.post("/start", response_model=Result[None])
async def start_recording(mode: str = "auto"):
    """开始录制"""
    try:
        await recorder.start(mode)
        logger.info(f"Started recording in {mode} mode")
        return Result.ok()
    except Exception as e:
        logger.error(f"Failed to start recording: {e}")
        return Result.fail(str(e))


@router.post("/stop", response_model=Result[dict])
async def stop_recording():
    """停止录制"""
    try:
        nodes = await recorder.stop()
        logger.info(f"Stopped recording. Generated {len(nodes)} nodes")
        return Result.ok({"nodes": nodes})
    except Exception as e:
        logger.error(f"Failed to stop recording: {e}")
        return Result.fail(str(e))


@router.post("/pause", response_model=Result[None])
async def pause_recording():
    """暂停录制"""
    try:
        await recorder.pause()
        logger.info("Paused recording")
        return Result.ok()
    except Exception as e:
        logger.error(f"Failed to pause recording: {e}")
        return Result.fail(str(e))


@router.post("/resume", response_model=Result[None])
async def resume_recording():
    """恢复录制"""
    try:
        await recorder.resume()
        logger.info("Resumed recording")
        return Result.ok()
    except Exception as e:
        logger.error(f"Failed to resume recording: {e}")
        return Result.fail(str(e))


@router.get("/status", response_model=Result[dict])
async def get_recorder_status():
    """获取录制器状态"""
    try:
        return Result.ok({
            "is_recording": recorder.is_recording,
            "is_paused": recorder.is_paused,
            "mode": recorder.mode,
            "steps_count": len(recorder.steps),
        })
    except Exception as e:
        logger.error(f"Failed to get recorder status: {e}")
        return Result.fail(str(e))
