"""
录制器相关的IPC函数
这些函数将被注册到函数注册表，供Rust层通过IPC调用
"""
from typing import Dict, Any, List
from core.recorder.service import recorder_service
from logger import get_logger
import asyncio

logger = get_logger("recorder_ipc")


def start_recording(mode: str = "auto") -> Dict[str, Any]:
    """
    开始录制
    
    Args:
        mode: 录制模式 (auto/manual)
        
    Returns:
        操作结果字典
    """
    try:
        logger.info(f"Starting recording: mode={mode}")
        
        # 执行开始录制（同步包装异步调用）
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            loop.run_until_complete(recorder_service.start(mode))
            
            logger.info(f"Recording started: mode={mode}")
            
            return {
                "success": True,
                "mode": mode,
                "status": "recording"
            }
            
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"Start recording error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


def stop_recording() -> Dict[str, Any]:
    """
    停止录制
    
    Returns:
        包含录制步骤的字典
    """
    try:
        logger.info("Stopping recording")
        
        # 执行停止录制（同步包装异步调用）
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            nodes = loop.run_until_complete(recorder_service.stop())
            
            logger.info(f"Recording stopped: {len(nodes)} nodes generated")
            
            return {
                "success": True,
                "status": "stopped",
                "nodes": nodes,
                "node_count": len(nodes)
            }
            
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"Stop recording error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "nodes": []
        }


def pause_recording() -> Dict[str, Any]:
    """
    暂停录制
    
    Returns:
        操作结果字典
    """
    try:
        logger.info("Pausing recording")
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            loop.run_until_complete(recorder_service.pause())
            
            logger.info("Recording paused")
            
            return {
                "success": True,
                "status": "paused"
            }
            
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"Pause recording error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


def resume_recording() -> Dict[str, Any]:
    """
    恢复录制
    
    Returns:
        操作结果字典
    """
    try:
        logger.info("Resuming recording")
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            loop.run_until_complete(recorder_service.resume())
            
            logger.info("Recording resumed")
            
            return {
                "success": True,
                "status": "recording"
            }
            
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"Resume recording error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


def get_recording_status() -> Dict[str, Any]:
    """
    获取录制状态
    
    Returns:
        包含录制状态的字典
    """
    try:
        is_recording = recorder_service.is_recording
        is_paused = recorder_service.is_paused
        mode = recorder_service.mode
        step_count = len(recorder_service.steps)
        
        if is_recording:
            if is_paused:
                status = "paused"
            else:
                status = "recording"
        else:
            status = "stopped"
        
        return {
            "success": True,
            "status": status,
            "mode": mode,
            "step_count": step_count,
            "is_recording": is_recording,
            "is_paused": is_paused
        }
        
    except Exception as e:
        logger.error(f"Get recording status error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "status": "unknown"
        }
