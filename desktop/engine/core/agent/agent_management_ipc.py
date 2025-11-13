"""
Agent管理相关的IPC函数
包括创建、列表、更新、删除Agent等管理功能
"""
from typing import Dict, Any, List, Optional
from core.storage.simple_db import get_db
from logger import get_logger

logger = get_logger("agent_management_ipc")


def list_agents(
    user_id: Optional[str] = None,
    agent_type: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
) -> Dict[str, Any]:
    """
    列出所有Agent
    
    Args:
        user_id: 用户ID（可选，用于过滤）
        agent_type: Agent类型（可选，用于过滤）
        limit: 返回数量限制
        offset: 偏移量
        
    Returns:
        包含Agent列表的字典
    """
    try:
        logger.info(f"Listing agents: user_id={user_id}, type={agent_type}, limit={limit}")
        
        db = get_db()
        agents = db.list_agents(user_id=user_id, agent_type=agent_type)
        
        # 应用分页
        total = len(agents)
        agents = agents[offset:offset + limit]
        
        logger.info(f"Found {len(agents)} agents (total: {total})")
        
        return {
            "success": True,
            "items": agents,
            "total": total
        }
            
    except Exception as e:
        logger.error(f"List agents error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "items": [],
            "total": 0
        }


def get_agent(agent_id: str) -> Dict[str, Any]:
    """
    获取Agent详情
    
    Args:
        agent_id: Agent ID
        
    Returns:
        包含Agent详情的字典
    """
    try:
        logger.info(f"Getting agent: agent_id={agent_id}")
        
        db = get_db()
        agent = db.get_agent(agent_id)
        
        if agent is None:
            return {
                "success": False,
                "error": f"Agent not found: {agent_id}"
            }
        
        logger.info(f"Agent retrieved: {agent['name']}")
        
        return {
            "success": True,
            "agent": agent
        }
            
    except Exception as e:
        logger.error(f"Get agent error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


def create_agent(
    name: str,
    description: str,
    agent_type: str,
    llm_config: Dict[str, Any],
    system_prompt: Optional[str] = None,
    knowledge_base_ids: Optional[List[str]] = None,
    tool_ids: Optional[List[str]] = None,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    创建Agent
    
    Args:
        name: Agent名称
        description: Agent描述
        agent_type: Agent类型
        llm_config: LLM配置
        system_prompt: 系统提示词（可选）
        knowledge_base_ids: 知识库ID列表（可选）
        tool_ids: 工具ID列表（可选）
        user_id: 用户ID（可选）
        
    Returns:
        包含新创建Agent信息的字典
    """
    try:
        logger.info(f"Creating agent: name={name}, type={agent_type}")
        
        db = get_db()
        agent = db.create_agent({
            "name": name,
            "description": description,
            "type": agent_type,
            "llm_config": llm_config,
            "system_prompt": system_prompt or "",
            "knowledge_base_ids": knowledge_base_ids or [],
            "tool_ids": tool_ids or [],
            "user_id": user_id
        })
        
        logger.info(f"Agent created: id={agent['id']}")
        
        return {
            "success": True,
            "agent": agent
        }
            
    except Exception as e:
        logger.error(f"Create agent error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


def update_agent(
    agent_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    llm_config: Optional[Dict[str, Any]] = None,
    system_prompt: Optional[str] = None,
    knowledge_base_ids: Optional[List[str]] = None,
    tool_ids: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    更新Agent
    
    Args:
        agent_id: Agent ID
        name: 新名称（可选）
        description: 新描述（可选）
        llm_config: 新LLM配置（可选）
        system_prompt: 新系统提示词（可选）
        knowledge_base_ids: 新知识库ID列表（可选）
        tool_ids: 新工具ID列表（可选）
        
    Returns:
        包含更新后Agent信息的字典
    """
    try:
        logger.info(f"Updating agent: agent_id={agent_id}")
        
        db = get_db()
        
        # 构建更新数据
        updates = {}
        if name is not None:
            updates["name"] = name
        if description is not None:
            updates["description"] = description
        if llm_config is not None:
            updates["llm_config"] = llm_config
        if system_prompt is not None:
            updates["system_prompt"] = system_prompt
        if knowledge_base_ids is not None:
            updates["knowledge_base_ids"] = knowledge_base_ids
        if tool_ids is not None:
            updates["tool_ids"] = tool_ids
        
        agent = db.update_agent(agent_id, updates)
        
        if agent is None:
            return {
                "success": False,
                "error": f"Agent not found: {agent_id}"
            }
        
        logger.info(f"Agent updated: id={agent['id']}")
        
        return {
            "success": True,
            "agent": agent
        }
            
    except Exception as e:
        logger.error(f"Update agent error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


def delete_agent(agent_id: str) -> Dict[str, Any]:
    """
    删除Agent
    
    Args:
        agent_id: Agent ID
        
    Returns:
        操作结果字典
    """
    try:
        logger.info(f"Deleting agent: agent_id={agent_id}")
        
        db = get_db()
        success = db.delete_agent(agent_id)
        
        if not success:
            return {
                "success": False,
                "error": f"Agent not found: {agent_id}"
            }
        
        logger.info(f"Agent deleted: id={agent_id}")
        
        return {
            "success": True,
            "agent_id": agent_id
        }
            
    except Exception as e:
        logger.error(f"Delete agent error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }
