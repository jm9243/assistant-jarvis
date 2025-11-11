"""
工具管理API路由
"""
from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
import uuid
from datetime import datetime

from models.knowledge_base import Tool, ToolCall
from core.service.tool import ToolService
from logger import get_logger

logger = get_logger("api.tool")

router = APIRouter(prefix="/tools", tags=["tools"])

# 工具服务实例
_tool_service = ToolService()


@router.post("", status_code=status.HTTP_201_CREATED)
async def register_tool(tool_data: dict):
    """
    注册工具
    
    Args:
        tool_data: 工具定义数据
        
    Returns:
        注册的工具信息
    """
    try:
        # 创建工具对象
        tool = Tool(
            id=tool_data.get("id") or str(uuid.uuid4()),
            name=tool_data["name"],
            description=tool_data["description"],
            type=tool_data["type"],
            category=tool_data.get("category", "general"),
            parameters_schema=tool_data.get("parameters_schema", {}),
            config=tool_data.get("config", {}),
            approval_policy=tool_data.get("approval_policy", "auto"),
            allowed_agents=tool_data.get("allowed_agents", []),
            is_enabled=tool_data.get("is_enabled", True),
            created_at=datetime.now()
        )
        
        # 注册工具
        tool_id = _tool_service.register_tool(tool)
        
        return {
            "code": 0,
            "message": "success",
            "data": {
                "id": tool_id,
                "name": tool.name,
                "type": tool.type
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to register tool: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("")
async def list_tools(
    agent_id: str = None,
    category: str = None,
    enabled_only: bool = True
):
    """
    获取工具列表
    
    Args:
        agent_id: Agent ID（过滤该Agent可用的工具）
        category: 工具分类
        enabled_only: 只返回启用的工具
        
    Returns:
        工具列表
    """
    try:
        tools = _tool_service.list_tools(
            agent_id=agent_id,
            category=category,
            enabled_only=enabled_only
        )
        
        return {
            "code": 0,
            "message": "success",
            "data": [
                {
                    "id": t.id,
                    "name": t.name,
                    "description": t.description,
                    "type": t.type,
                    "category": t.category,
                    "parameters_schema": t.parameters_schema,
                    "approval_policy": t.approval_policy,
                    "is_enabled": t.is_enabled
                }
                for t in tools
            ]
        }
        
    except Exception as e:
        logger.error(f"Failed to list tools: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{tool_id}")
async def get_tool(tool_id: str):
    """
    获取工具详情
    
    Args:
        tool_id: 工具ID
        
    Returns:
        工具信息
    """
    try:
        tool = _tool_service.get_tool(tool_id)
        
        if not tool:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tool {tool_id} not found"
            )
        
        return {
            "code": 0,
            "message": "success",
            "data": {
                "id": tool.id,
                "name": tool.name,
                "description": tool.description,
                "type": tool.type,
                "category": tool.category,
                "parameters_schema": tool.parameters_schema,
                "config": tool.config,
                "approval_policy": tool.approval_policy,
                "allowed_agents": tool.allowed_agents,
                "is_enabled": tool.is_enabled,
                "created_at": tool.created_at.isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get tool {tool_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.patch("/{tool_id}")
async def update_tool(tool_id: str, update_data: dict):
    """
    更新工具
    
    Args:
        tool_id: 工具ID
        update_data: 更新数据
        
    Returns:
        更新后的工具信息
    """
    try:
        tool = _tool_service.get_tool(tool_id)
        
        if not tool:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tool {tool_id} not found"
            )
        
        # 更新字段
        if "name" in update_data:
            tool.name = update_data["name"]
        if "description" in update_data:
            tool.description = update_data["description"]
        if "is_enabled" in update_data:
            tool.is_enabled = update_data["is_enabled"]
        if "approval_policy" in update_data:
            tool.approval_policy = update_data["approval_policy"]
        if "allowed_agents" in update_data:
            tool.allowed_agents = update_data["allowed_agents"]
        if "config" in update_data:
            tool.config.update(update_data["config"])
        
        return {
            "code": 0,
            "message": "success",
            "data": {
                "id": tool.id,
                "name": tool.name,
                "is_enabled": tool.is_enabled
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update tool {tool_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/{tool_id}")
async def unregister_tool(tool_id: str):
    """
    注销工具
    
    Args:
        tool_id: 工具ID
        
    Returns:
        删除结果
    """
    try:
        _tool_service.unregister_tool(tool_id)
        
        return {
            "code": 0,
            "message": "success",
            "data": {"id": tool_id}
        }
        
    except Exception as e:
        logger.error(f"Failed to unregister tool {tool_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/{tool_id}/call")
async def call_tool(
    tool_id: str,
    params: dict,
    agent_id: str = None,
    conversation_id: str = None
):
    """
    调用工具
    
    Args:
        tool_id: 工具ID
        params: 工具参数
        agent_id: Agent ID
        conversation_id: 会话ID
        
    Returns:
        执行结果
    """
    try:
        result = await _tool_service.execute(
            tool_id=tool_id,
            params=params,
            agent_id=agent_id,
            conversation_id=conversation_id
        )
        
        return {
            "code": 0,
            "message": "success",
            "data": result
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to call tool {tool_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/calls/history")
async def get_tool_call_history(
    agent_id: str = None,
    tool_id: str = None,
    status: str = None,
    limit: int = 100
):
    """
    获取工具调用历史
    
    Args:
        agent_id: Agent ID
        tool_id: 工具ID
        status: 状态过滤
        limit: 返回数量
        
    Returns:
        调用历史列表
    """
    try:
        calls = _tool_service.list_tool_calls(
            agent_id=agent_id,
            status=status,
            limit=limit
        )
        
        # 如果指定了tool_id，进行过滤
        if tool_id:
            calls = [c for c in calls if c.tool_id == tool_id]
        
        return {
            "code": 0,
            "message": "success",
            "data": [
                {
                    "id": c.id,
                    "tool_id": c.tool_id,
                    "agent_id": c.agent_id,
                    "conversation_id": c.conversation_id,
                    "input_params": c.input_params,
                    "output_result": c.output_result,
                    "status": c.status,
                    "execution_time_ms": c.execution_time_ms,
                    "created_at": c.created_at.isoformat(),
                    "completed_at": c.completed_at.isoformat() if c.completed_at else None
                }
                for c in calls
            ]
        }
        
    except Exception as e:
        logger.error(f"Failed to get tool call history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/approvals/pending")
async def get_pending_approvals(
    agent_id: str = None,
    conversation_id: str = None
):
    """
    获取待审批的工具调用
    
    Args:
        agent_id: Agent ID
        conversation_id: 会话ID
        
    Returns:
        待审批列表
    """
    try:
        approvals = _tool_service.permission_checker.list_pending_approvals(
            agent_id=agent_id,
            conversation_id=conversation_id
        )
        
        return {
            "code": 0,
            "message": "success",
            "data": approvals
        }
        
    except Exception as e:
        logger.error(f"Failed to get pending approvals: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/approvals/{request_id}/approve")
async def approve_tool_call(request_id: str):
    """
    批准工具调用
    
    Args:
        request_id: 审批请求ID
        
    Returns:
        审批结果
    """
    try:
        success = await _tool_service.permission_checker.approve(request_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Approval request {request_id} not found"
            )
        
        return {
            "code": 0,
            "message": "success",
            "data": {"request_id": request_id, "status": "approved"}
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to approve tool call {request_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/approvals/{request_id}/reject")
async def reject_tool_call(request_id: str, reason: str = None):
    """
    拒绝工具调用
    
    Args:
        request_id: 审批请求ID
        reason: 拒绝原因
        
    Returns:
        审批结果
    """
    try:
        success = await _tool_service.permission_checker.reject(request_id, reason)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Approval request {request_id} not found"
            )
        
        return {
            "code": 0,
            "message": "success",
            "data": {"request_id": request_id, "status": "rejected"}
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to reject tool call {request_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
