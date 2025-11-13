"""
Agent管理器 - 管理Agent实例和会话
"""
from typing import Dict, Optional, AsyncIterator
from models.agent import AgentConfig, Conversation, Message
from core.agent.basic import BasicAgent
from core.agent.react import ReActAgent
from logger import get_logger
import uuid
from datetime import datetime

logger = get_logger("agent_manager")


class AgentManager:
    """Agent管理器 - 单例模式"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self.agents: Dict[str, BasicAgent] = {}
        self.conversations: Dict[str, Conversation] = {}
        self._initialized = True
        logger.info("AgentManager initialized")
    
    def get_or_create_agent(self, config: AgentConfig) -> BasicAgent:
        """
        获取或创建Agent实例
        
        Args:
            config: Agent配置
            
        Returns:
            Agent实例
        """
        agent_id = config.id
        
        # 如果Agent已存在，检查配置是否变化
        if agent_id in self.agents:
            existing_agent = self.agents[agent_id]
            # 简单比较：如果配置的updated_at更新，则重新创建
            if config.updated_at > existing_agent.config.updated_at:
                logger.info(f"Agent {agent_id} config updated, recreating")
                del self.agents[agent_id]
            else:
                return existing_agent
        
        # 创建新Agent
        if config.type == "basic":
            agent = BasicAgent(config)
        elif config.type == "react":
            agent = ReActAgent(config)
        else:
            logger.warning(f"Unknown agent type: {config.type}, using BasicAgent")
            agent = BasicAgent(config)
        
        self.agents[agent_id] = agent
        logger.info(f"Created agent: {config.name} ({agent_id})")
        
        return agent
    
    def get_agent(self, agent_id: str) -> Optional[BasicAgent]:
        """
        获取Agent实例
        
        Args:
            agent_id: Agent ID
            
        Returns:
            Agent实例，如果不存在则返回None
        """
        return self.agents.get(agent_id)
    
    def create_conversation(
        self,
        agent_id: str,
        user_id: str,
        title: str = "新对话"
    ) -> Conversation:
        """
        创建会话
        
        Args:
            agent_id: Agent ID
            user_id: 用户ID
            title: 会话标题
            
        Returns:
            会话对象
        """
        conversation_id = str(uuid.uuid4())
        
        conversation = Conversation(
            id=conversation_id,
            agent_id=agent_id,
            user_id=user_id,
            title=title,
            message_count=0,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        self.conversations[conversation_id] = conversation
        logger.info(f"Created conversation: {conversation_id} for agent {agent_id}")
        
        return conversation
    
    def get_conversation(self, conversation_id: str) -> Optional[Conversation]:
        """
        获取会话
        
        Args:
            conversation_id: 会话ID
            
        Returns:
            会话对象，如果不存在则返回None
        """
        return self.conversations.get(conversation_id)
    
    def remove_agent(self, agent_id: str):
        """
        移除Agent实例
        
        Args:
            agent_id: Agent ID
        """
        if agent_id in self.agents:
            del self.agents[agent_id]
            logger.info(f"Removed agent: {agent_id}")
    
    def clear(self):
        """清空所有Agent和会话"""
        self.agents.clear()
        self.conversations.clear()
        logger.info("Cleared all agents and conversations")


# 全局Agent管理器实例
agent_manager = AgentManager()
