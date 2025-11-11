"""
Agent管理API路由
"""
from fastapi import APIRouter, HTTPException, status
from typing import List
import uuid
from datetime import datetime

from models.agent import (
    AgentConfig,
    AgentCreateRequest,
    AgentUpdateRequest,
    ModelConfig,
    MemoryConfig
)
from core.agent import BasicAgent, ReActAgent, DeepResearchAgent
from logger import get_logger

logger = get_logger("api.agent")

router = APIRouter(prefix="/agents", tags=["agents"])

# 内存中存储Agent配置（实际应该存储到数据库）
_agents: dict[str, AgentConfig] = {}
_agent_instances: dict[str, any] = {}


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_agent(request: AgentCreateRequest):
    """
    创建Agent
    
    Args:
        request: Agent创建请求
        
    Returns:
        创建的Agent配置
    """
    try:
        # 生成Agent ID
        agent_id = str(uuid.uuid4())
        
        # 创建Agent配置
        config = AgentConfig(
            id=agent_id,
            user_id="default_user",  # TODO: 从认证信息获取
            name=request.name,
            description=request.description,
            type=request.type,
            avatar_url=request.avatar_url,
            tags=request.tags,
            llm_config=request.llm_config,
            system_prompt=request.system_prompt,
            prompt_template=request.prompt_template,
            memory_config=request.memory_config or MemoryConfig(),
            knowledge_base_ids=request.knowledge_base_ids,
            tool_ids=request.tool_ids,
            react_config=request.react_config,
            research_config=request.research_config,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        # 保存配置
        _agents[agent_id] = config
        
        # 创建Agent实例
        if config.type == "basic":
            _agent_instances[agent_id] = BasicAgent(config)
        elif config.type == "react":
            _agent_instances[agent_id] = ReActAgent(config)
        elif config.type == "deep_research":
            _agent_instances[agent_id] = DeepResearchAgent(config)
        else:
            raise ValueError(f"Unsupported agent type: {config.type}")
        
        logger.info(f"Created agent {agent_id}: {config.name}")
        
        return {
            "code": 0,
            "message": "success",
            "data": config.dict()
        }
        
    except Exception as e:
        logger.error(f"Failed to create agent: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("")
async def list_agents(
    user_id: str = None,
    type: str = None,
    limit: int = 50,
    offset: int = 0
):
    """
    获取Agent列表
    
    Args:
        user_id: 用户ID（可选）
        type: Agent类型（可选）
        limit: 返回数量
        offset: 偏移量
        
    Returns:
        Agent列表
    """
    try:
        agents = list(_agents.values())
        
        # 过滤
        if user_id:
            agents = [a for a in agents if a.user_id == user_id]
        if type:
            agents = [a for a in agents if a.type == type]
        
        # 分页
        total = len(agents)
        agents = agents[offset:offset + limit]
        
        return {
            "code": 0,
            "message": "success",
            "data": {
                "items": [a.dict() for a in agents],
                "total": total,
                "limit": limit,
                "offset": offset
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to list agents: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{agent_id}")
async def get_agent(agent_id: str):
    """
    获取Agent详情
    
    Args:
        agent_id: Agent ID
        
    Returns:
        Agent配置
    """
    try:
        if agent_id not in _agents:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent {agent_id} not found"
            )
        
        config = _agents[agent_id]
        
        return {
            "code": 0,
            "message": "success",
            "data": config.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get agent {agent_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.patch("/{agent_id}")
async def update_agent(agent_id: str, request: AgentUpdateRequest):
    """
    更新Agent
    
    Args:
        agent_id: Agent ID
        request: 更新请求
        
    Returns:
        更新后的Agent配置
    """
    try:
        if agent_id not in _agents:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent {agent_id} not found"
            )
        
        config = _agents[agent_id]
        
        # 更新字段
        update_data = request.dict(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(config, field):
                setattr(config, field, value)
        
        config.updated_at = datetime.now()
        
        # 更新Agent实例
        if agent_id in _agent_instances:
            await _agent_instances[agent_id].update_config(config)
        
        logger.info(f"Updated agent {agent_id}")
        
        return {
            "code": 0,
            "message": "success",
            "data": config.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update agent {agent_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/{agent_id}")
async def delete_agent(agent_id: str):
    """
    删除Agent
    
    Args:
        agent_id: Agent ID
        
    Returns:
        删除结果
    """
    try:
        if agent_id not in _agents:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent {agent_id} not found"
            )
        
        # 删除Agent实例
        if agent_id in _agent_instances:
            del _agent_instances[agent_id]
        
        # 删除配置
        del _agents[agent_id]
        
        logger.info(f"Deleted agent {agent_id}")
        
        return {
            "code": 0,
            "message": "success",
            "data": {"id": agent_id}
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete agent {agent_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


def get_agent_instance(agent_id: str) -> BasicAgent:
    """
    获取Agent实例（供其他模块使用）
    
    Args:
        agent_id: Agent ID
        
    Returns:
        Agent实例
    """
    if agent_id not in _agent_instances:
        raise ValueError(f"Agent {agent_id} not found or not initialized")
    return _agent_instances[agent_id]
