"""
工具管理相关的IPC函数
包括列表、获取、更新、调用工具等功能
"""
from typing import Dict, Any, Optional
from core.storage.simple_db import get_db
from logger import get_logger

logger = get_logger("tool_management_ipc")


def list_tools(
    agent_id: Optional[str] = None,
    category: Optional[str] = None,
    enabled_only: bool = False
) -> Dict[str, Any]:
    """
    列出所有工具
    
    Args:
        agent_id: Agent ID（可选，用于过滤）
        category: 工具类别（可选，用于过滤）
        enabled_only: 是否只返回启用的工具
        
    Returns:
        包含工具列表的字典
    """
    try:
        logger.info(f"Listing tools: agent_id={agent_id}, category={category}, enabled_only={enabled_only}")
        
        db = get_db()
        tools = db.list_tools(agent_id=agent_id, category=category, enabled_only=enabled_only)
        
        logger.info(f"Found {len(tools)} tools")
        
        return {
            "success": True,
            "tools": tools,
            "count": len(tools)
        }
            
    except Exception as e:
        logger.error(f"List tools error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "tools": []
        }


def get_tool(tool_id: str) -> Dict[str, Any]:
    """
    获取工具详情
    
    Args:
        tool_id: 工具ID
        
    Returns:
        包含工具详情的字典
    """
    try:
        logger.info(f"Getting tool: tool_id={tool_id}")
        
        db = get_db()
        tool = db.get_tool(tool_id)
        
        if tool is None:
            return {
                "success": False,
                "error": f"Tool not found: {tool_id}"
            }
        
        logger.info(f"Tool retrieved: {tool['name']}")
        
        return {
            "success": True,
            "tool": tool
        }
            
    except Exception as e:
        logger.error(f"Get tool error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


def update_tool(
    tool_id: str,
    is_enabled: Optional[bool] = None,
    approval_policy: Optional[str] = None
) -> Dict[str, Any]:
    """
    更新工具
    
    Args:
        tool_id: 工具ID
        is_enabled: 是否启用（可选）
        approval_policy: 审批策略（可选）
        
    Returns:
        包含更新后工具信息的字典
    """
    try:
        logger.info(f"Updating tool: tool_id={tool_id}, is_enabled={is_enabled}, approval_policy={approval_policy}")
        
        db = get_db()
        
        # 构建更新数据
        updates = {}
        if is_enabled is not None:
            updates["is_enabled"] = is_enabled
        if approval_policy is not None:
            updates["approval_policy"] = approval_policy
        
        tool = db.update_tool(tool_id, updates)
        
        if tool is None:
            return {
                "success": False,
                "error": f"Tool not found: {tool_id}"
            }
        
        logger.info(f"Tool updated: id={tool['id']}")
        
        return {
            "success": True,
            "tool": tool
        }
            
    except Exception as e:
        logger.error(f"Update tool error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


def call_tool(
    tool_id: str,
    params: Dict[str, Any],
    agent_id: Optional[str] = None,
    conversation_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    调用工具
    
    Args:
        tool_id: 工具ID
        params: 工具参数
        agent_id: Agent ID（可选）
        conversation_id: 会话ID（可选）
        
    Returns:
        包含工具执行结果的字典
    """
    try:
        logger.info(f"Calling tool: tool_id={tool_id}, agent_id={agent_id}")
        
        db = get_db()
        tool = db.get_tool(tool_id)
        
        if tool is None:
            return {
                "success": False,
                "error": f"Tool not found: {tool_id}",
                "tool_id": tool_id
            }
        
        if not tool.get("is_enabled", False):
            return {
                "success": False,
                "error": f"Tool is disabled: {tool_id}",
                "tool_id": tool_id
            }
        
        # TODO: 实现实际的工具调用逻辑
        # 这里只是一个占位符
        logger.info(f"Tool called successfully: tool_id={tool_id}")
        
        # 更新使用统计
        db.update_tool(tool_id, {
            "usage_count": tool.get("usage_count", 0) + 1
        })
        
        return {
            "success": True,
            "tool_id": tool_id,
            "result": {
                "message": f"Tool {tool['name']} executed successfully",
                "params": params
            }
        }
            
    except Exception as e:
        logger.error(f"Call tool error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "tool_id": tool_id
        }
