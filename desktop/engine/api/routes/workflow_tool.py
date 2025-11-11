"""
工作流工具注册API路由
"""
from fastapi import APIRouter, HTTPException, status
from typing import List, Dict

from core.service.workflow_tool_registry import get_workflow_tool_registry
from core.service.tool import ToolService
from logger import get_logger

logger = get_logger("api.workflow_tool")

router = APIRouter(prefix="/workflow-tools", tags=["workflow-tools"])

# 获取工作流工具注册器
_tool_service = ToolService()
_registry = get_workflow_tool_registry(_tool_service)


@router.post("/register")
async def register_workflow_tool(workflow_config: Dict):
    """
    注册工作流为工具
    
    Args:
        workflow_config: 工作流配置
        
    Returns:
        注册的工具信息
    """
    try:
        tool_id = _registry.auto_register_from_workflow_config(workflow_config)
        
        return {
            "code": 0,
            "message": "success",
            "data": {
                "tool_id": tool_id,
                "workflow_id": workflow_config.get("id")
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to register workflow tool: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/register-manual")
async def register_workflow_tool_manual(
    workflow_id: str,
    workflow_name: str,
    workflow_description: str,
    workflow_params: List[Dict],
    approval_required: bool = False,
    allowed_agents: List[str] = None
):
    """
    手动注册工作流为工具
    
    Args:
        workflow_id: 工作流ID
        workflow_name: 工作流名称
        workflow_description: 工作流描述
        workflow_params: 工作流参数
        approval_required: 是否需要审批
        allowed_agents: 允许的Agent列表
        
    Returns:
        注册的工具信息
    """
    try:
        tool_id = _registry.register_workflow_as_tool(
            workflow_id=workflow_id,
            workflow_name=workflow_name,
            workflow_description=workflow_description,
            workflow_params=workflow_params,
            approval_required=approval_required,
            allowed_agents=allowed_agents or []
        )
        
        return {
            "code": 0,
            "message": "success",
            "data": {
                "tool_id": tool_id,
                "workflow_id": workflow_id
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to register workflow tool: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/{workflow_id}")
async def unregister_workflow_tool(workflow_id: str):
    """
    注销工作流工具
    
    Args:
        workflow_id: 工作流ID
        
    Returns:
        删除结果
    """
    try:
        _registry.unregister_workflow_tool(workflow_id)
        
        return {
            "code": 0,
            "message": "success",
            "data": {"workflow_id": workflow_id}
        }
        
    except Exception as e:
        logger.error(f"Failed to unregister workflow tool: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.patch("/{workflow_id}")
async def update_workflow_tool(
    workflow_id: str,
    workflow_name: str = None,
    workflow_description: str = None,
    workflow_params: List[Dict] = None,
    approval_required: bool = None,
    is_enabled: bool = None
):
    """
    更新工作流工具
    
    Args:
        workflow_id: 工作流ID
        workflow_name: 新名称
        workflow_description: 新描述
        workflow_params: 新参数
        approval_required: 是否需要审批
        is_enabled: 是否启用
        
    Returns:
        更新结果
    """
    try:
        _registry.update_workflow_tool(
            workflow_id=workflow_id,
            workflow_name=workflow_name,
            workflow_description=workflow_description,
            workflow_params=workflow_params,
            approval_required=approval_required,
            is_enabled=is_enabled
        )
        
        return {
            "code": 0,
            "message": "success",
            "data": {"workflow_id": workflow_id}
        }
        
    except Exception as e:
        logger.error(f"Failed to update workflow tool: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("")
async def list_workflow_tools():
    """
    列出所有工作流工具
    
    Returns:
        工作流工具列表
    """
    try:
        workflow_tools = _registry.list_workflow_tools()
        
        return {
            "code": 0,
            "message": "success",
            "data": workflow_tools
        }
        
    except Exception as e:
        logger.error(f"Failed to list workflow tools: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{workflow_id}/tool-id")
async def get_workflow_tool_id(workflow_id: str):
    """
    获取工作流对应的工具ID
    
    Args:
        workflow_id: 工作流ID
        
    Returns:
        工具ID
    """
    try:
        tool_id = _registry.get_workflow_tool_id(workflow_id)
        
        if not tool_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Workflow {workflow_id} not registered as tool"
            )
        
        return {
            "code": 0,
            "message": "success",
            "data": {
                "workflow_id": workflow_id,
                "tool_id": tool_id
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get workflow tool ID: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{workflow_id}/is-registered")
async def check_workflow_registered(workflow_id: str):
    """
    检查工作流是否已注册为工具
    
    Args:
        workflow_id: 工作流ID
        
    Returns:
        是否已注册
    """
    try:
        is_registered = _registry.is_workflow_registered(workflow_id)
        
        return {
            "code": 0,
            "message": "success",
            "data": {
                "workflow_id": workflow_id,
                "is_registered": is_registered
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to check workflow registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
