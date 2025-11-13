"""
Agent相关的IPC函数
这些函数将被注册到函数注册表，供Rust层通过IPC调用
"""
from typing import Dict, Any, List, Optional
from models.agent import AgentConfig, MemoryConfig, ModelConfig
from core.agent.manager import agent_manager
from core.service.memory import MemoryService
from logger import get_logger
import asyncio

logger = get_logger("agent_ipc")

# 延迟初始化记忆服务
_memory_service: Optional[MemoryService] = None


def _get_memory_service() -> MemoryService:
    """获取记忆服务实例（延迟初始化）"""
    global _memory_service
    if _memory_service is None:
        _memory_service = MemoryService()
    return _memory_service


def agent_chat(
    agent_config: Dict[str, Any],
    conversation_id: str,
    message: str,
    stream: bool = False,
    use_knowledge: bool = True,
    image_urls: List[str] = None,
    file_paths: List[str] = None
) -> Dict[str, Any]:
    """
    Agent对话函数
    
    Args:
        agent_config: Agent配置字典
        conversation_id: 会话ID
        message: 用户消息
        stream: 是否流式返回（当前版本暂不支持，返回完整响应）
        use_knowledge: 是否使用知识库
        image_urls: 图片URL列表
        file_paths: 文件路径列表
        
    Returns:
        包含响应消息的字典
    """
    try:
        logger.info(f"Agent chat: conversation_id={conversation_id}, message_length={len(message)}")
        
        # 解析Agent配置
        config = _parse_agent_config(agent_config)
        
        # 获取或创建Agent实例
        agent = agent_manager.get_or_create_agent(config)
        
        # 执行对话（同步包装异步调用）
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # 收集流式响应
            response_text = ""
            async_gen = agent.chat(
                message=message,
                conversation_id=conversation_id,
                use_knowledge=use_knowledge,
                image_urls=image_urls or [],
                file_paths=file_paths or []
            )
            
            async def collect_response():
                nonlocal response_text
                async for token in async_gen:
                    response_text += token
            
            loop.run_until_complete(collect_response())
            
            logger.info(f"Agent chat completed: response_length={len(response_text)}")
            
            return {
                "success": True,
                "message": response_text,
                "conversation_id": conversation_id
            }
            
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"Agent chat error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "conversation_id": conversation_id
        }


def create_conversation(
    agent_config: Dict[str, Any],
    user_id: str = "default_user",
    title: str = "新对话"
) -> Dict[str, Any]:
    """
    创建会话
    
    Args:
        agent_config: Agent配置字典
        user_id: 用户ID
        title: 会话标题
        
    Returns:
        包含会话ID的字典
    """
    try:
        logger.info(f"Creating conversation: agent_id={agent_config.get('id')}, title={title}")
        
        # 解析Agent配置
        config = _parse_agent_config(agent_config)
        
        # 创建会话
        conversation = agent_manager.create_conversation(
            agent_id=config.id,
            user_id=user_id,
            title=title
        )
        
        logger.info(f"Conversation created: {conversation.id}")
        
        return {
            "success": True,
            "conversation_id": conversation.id,
            "agent_id": config.id,
            "title": conversation.title,
            "created_at": conversation.created_at.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Create conversation error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


def get_conversation_history(
    conversation_id: str,
    limit: int = 50,
    offset: int = 0
) -> Dict[str, Any]:
    """
    获取会话历史
    
    Args:
        conversation_id: 会话ID
        limit: 返回消息数量限制
        offset: 偏移量
        
    Returns:
        包含消息列表的字典
    """
    try:
        logger.info(f"Getting conversation history: conversation_id={conversation_id}")
        
        # 从记忆服务获取历史
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            history = loop.run_until_complete(
                _get_memory_service().short_term.get(conversation_id)
            )
            
            # 应用分页
            total = len(history)
            paginated_history = history[offset:offset + limit]
            
            logger.info(f"Retrieved {len(paginated_history)} messages from conversation {conversation_id}")
            
            return {
                "success": True,
                "conversation_id": conversation_id,
                "messages": paginated_history,
                "total": total,
                "limit": limit,
                "offset": offset
            }
            
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"Get conversation history error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "conversation_id": conversation_id,
            "messages": []
        }


def _parse_agent_config(config_dict: Dict[str, Any]) -> AgentConfig:
    """
    解析Agent配置字典为AgentConfig对象
    
    Args:
        config_dict: 配置字典
        
    Returns:
        AgentConfig对象
    """
    # 解析LLM配置
    llm_config_dict = config_dict.get("llm_config", {})
    llm_config = ModelConfig(**llm_config_dict)
    
    # 解析记忆配置
    memory_config_dict = config_dict.get("memory_config", {})
    memory_config = MemoryConfig(**memory_config_dict) if memory_config_dict else MemoryConfig()
    
    # 构建AgentConfig
    config = AgentConfig(
        id=config_dict["id"],
        user_id=config_dict.get("user_id", "default_user"),
        name=config_dict["name"],
        description=config_dict.get("description", ""),
        type=config_dict.get("type", "basic"),
        avatar_url=config_dict.get("avatar_url"),
        tags=config_dict.get("tags", []),
        llm_config=llm_config,
        system_prompt=config_dict.get("system_prompt", ""),
        prompt_template=config_dict.get("prompt_template"),
        memory_config=memory_config,
        knowledge_base_ids=config_dict.get("knowledge_base_ids", []),
        tool_ids=config_dict.get("tool_ids", []),
        react_config=config_dict.get("react_config"),
        research_config=config_dict.get("research_config")
    )
    
    return config
