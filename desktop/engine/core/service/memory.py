"""
记忆系统
"""
from datetime import datetime
from typing import List, Dict, Any, Optional
from cachetools import LRUCache

from core.storage.backend import BackendClient
from config import settings
from logger import get_logger

logger = get_logger("memory")


class ShortTermMemory:
    """短期记忆（对话历史）"""
    
    def __init__(self, window_size: int = None, max_conversations: int = 100):
        """
        初始化短期记忆
        
        Args:
            window_size: 窗口大小（保留最近N轮对话）
            max_conversations: 最大会话数量
        """
        self.window_size = window_size or settings.short_term_memory_window
        self.max_conversations = max_conversations
        self.cache = LRUCache(maxsize=max_conversations)
        self.last_access = {}  # 记录每个会话的最后访问时间
        logger.info(
            f"Initialized ShortTermMemory with "
            f"window_size={self.window_size}, "
            f"max_conversations={max_conversations}"
        )
    
    async def add_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        metadata: Dict = None
    ):
        """
        添加消息
        
        Args:
            conversation_id: 会话ID
            role: 角色（user/assistant/system）
            content: 消息内容
            metadata: 元数据（如图片、文件信息）
        """
        if conversation_id not in self.cache:
            self.cache[conversation_id] = []
        
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        }
        
        if metadata:
            message["metadata"] = metadata
        
        self.cache[conversation_id].append(message)
        
        # 更新最后访问时间
        self.last_access[conversation_id] = datetime.now()
        
        # 保持窗口大小（内存优化）
        if len(self.cache[conversation_id]) > self.window_size * 2:
            # 只保留最近的消息
            self.cache[conversation_id] = self.cache[conversation_id][-self.window_size*2:]
        
        logger.debug(f"Added message to conversation {conversation_id}")
    
    async def get(self, conversation_id: str) -> List[Dict]:
        """
        获取最近的消息
        
        Args:
            conversation_id: 会话ID
            
        Returns:
            消息列表
        """
        # 更新最后访问时间
        if conversation_id in self.cache:
            self.last_access[conversation_id] = datetime.now()
        
        return self.cache.get(conversation_id, [])
    
    async def clear(self, conversation_id: str):
        """
        清空会话记忆
        
        Args:
            conversation_id: 会话ID
        """
        if conversation_id in self.cache:
            del self.cache[conversation_id]
            logger.info(f"Cleared short-term memory for conversation {conversation_id}")
    
    async def cleanup_idle_conversations(self, max_idle_minutes: int = 30):
        """
        清理空闲会话（内存优化）
        
        Args:
            max_idle_minutes: 最大空闲时间（分钟）
        """
        now = datetime.now()
        idle_conversations = []
        
        for conv_id, last_time in self.last_access.items():
            if (now - last_time).total_seconds() > max_idle_minutes * 60:
                idle_conversations.append(conv_id)
        
        for conv_id in idle_conversations:
            await self.clear(conv_id)
        
        if idle_conversations:
            logger.info(f"Cleaned up {len(idle_conversations)} idle conversations")
    
    def get_stats(self) -> Dict:
        """获取统计信息"""
        total_messages = sum(len(msgs) for msgs in self.cache.values())
        
        return {
            "total_conversations": len(self.cache),
            "max_conversations": self.max_conversations,
            "total_messages": total_messages,
            "window_size": self.window_size,
            "cache_usage_percent": (len(self.cache) / self.max_conversations * 100) if self.max_conversations > 0 else 0
        }


class LongTermMemory:
    """长期记忆（跨会话）"""
    
    def __init__(self):
        """初始化长期记忆"""
        self.backend_client = BackendClient()
        logger.info("Initialized LongTermMemory")
    
    async def save(
        self,
        agent_id: str,
        key: str,
        value: str,
        importance: float = 0.5,
        metadata: Dict = None
    ):
        """
        保存长期记忆
        
        Args:
            agent_id: Agent ID
            key: 记忆键
            value: 记忆值
            importance: 重要性（0-1）
            metadata: 元数据
        """
        try:
            await self.backend_client.post("/api/v1/memories", {
                "agent_id": agent_id,
                "key": key,
                "value": value,
                "importance": importance,
                "type": "long_term",
                "metadata": metadata or {}
            })
            logger.info(f"Saved long-term memory for agent {agent_id}: {key}")
        except Exception as e:
            logger.error(f"Failed to save long-term memory: {e}")
            raise
    
    async def get(
        self,
        agent_id: str,
        limit: int = 10,
        min_importance: float = 0.0
    ) -> List[Dict]:
        """
        获取长期记忆
        
        Args:
            agent_id: Agent ID
            limit: 返回数量
            min_importance: 最小重要性
            
        Returns:
            记忆列表
        """
        try:
            response = await self.backend_client.get(
                "/api/v1/memories",
                params={
                    "agent_id": agent_id,
                    "type": "long_term",
                    "limit": limit,
                    "min_importance": min_importance
                }
            )
            return response.get("data", [])
        except Exception as e:
            logger.error(f"Failed to get long-term memory: {e}")
            return []
    
    async def search(
        self,
        agent_id: str,
        keyword: str,
        limit: int = 10
    ) -> List[Dict]:
        """
        搜索长期记忆
        
        Args:
            agent_id: Agent ID
            keyword: 关键词
            limit: 返回数量
            
        Returns:
            记忆列表
        """
        try:
            response = await self.backend_client.get(
                "/api/v1/memories/search",
                params={
                    "agent_id": agent_id,
                    "keyword": keyword,
                    "limit": limit
                }
            )
            return response.get("data", [])
        except Exception as e:
            logger.error(f"Failed to search long-term memory: {e}")
            return []
    
    async def delete(self, memory_id: str):
        """
        删除记忆
        
        Args:
            memory_id: 记忆ID
        """
        try:
            await self.backend_client.delete(f"/api/v1/memories/{memory_id}")
            logger.info(f"Deleted long-term memory {memory_id}")
        except Exception as e:
            logger.error(f"Failed to delete long-term memory: {e}")
            raise


class WorkingMemory:
    """工作记忆（临时变量）"""
    
    def __init__(self, max_size: int = 1000):
        """
        初始化工作记忆
        
        Args:
            max_size: 最大缓存数量
        """
        self.cache = {}
        self.max_size = max_size
        self.last_access = {}
        logger.info(f"Initialized WorkingMemory with max_size={max_size}")
    
    def set(self, conversation_id: str, key: str, value: Any):
        """
        设置变量
        
        Args:
            conversation_id: 会话ID
            key: 变量名
            value: 变量值
        """
        # 检查缓存大小限制
        if len(self.cache) >= self.max_size and conversation_id not in self.cache:
            # 清理最旧的会话
            self._cleanup_oldest()
        
        if conversation_id not in self.cache:
            self.cache[conversation_id] = {}
        
        self.cache[conversation_id][key] = value
        self.last_access[conversation_id] = datetime.now()
        logger.debug(f"Set working memory {key} for conversation {conversation_id}")
    
    def get(self, conversation_id: str, key: str = None) -> Any:
        """
        获取变量
        
        Args:
            conversation_id: 会话ID
            key: 变量名（如果为None，返回所有变量）
            
        Returns:
            变量值或所有变量字典
        """
        if conversation_id not in self.cache:
            return None if key else {}
        
        # 更新最后访问时间
        self.last_access[conversation_id] = datetime.now()
        
        if key:
            return self.cache[conversation_id].get(key)
        return self.cache[conversation_id]
    
    def clear(self, conversation_id: str):
        """
        清空工作记忆
        
        Args:
            conversation_id: 会话ID
        """
        if conversation_id in self.cache:
            del self.cache[conversation_id]
            logger.info(f"Cleared working memory for conversation {conversation_id}")
    
    def _cleanup_oldest(self):
        """清理最旧的会话（内存优化）"""
        if not self.last_access:
            return
        
        # 找到最旧的会话
        oldest_conv = min(self.last_access.items(), key=lambda x: x[1])[0]
        self.clear(oldest_conv)
        logger.debug(f"Cleaned up oldest working memory: {oldest_conv}")
    
    def cleanup_idle(self, max_idle_minutes: int = 30):
        """
        清理空闲会话
        
        Args:
            max_idle_minutes: 最大空闲时间（分钟）
        """
        now = datetime.now()
        idle_conversations = []
        
        for conv_id, last_time in self.last_access.items():
            if (now - last_time).total_seconds() > max_idle_minutes * 60:
                idle_conversations.append(conv_id)
        
        for conv_id in idle_conversations:
            self.clear(conv_id)
        
        if idle_conversations:
            logger.info(f"Cleaned up {len(idle_conversations)} idle working memories")
    
    def get_stats(self) -> Dict:
        """获取统计信息"""
        total_variables = sum(len(vars) for vars in self.cache.values())
        
        return {
            "total_conversations": len(self.cache),
            "max_size": self.max_size,
            "total_variables": total_variables,
            "cache_usage_percent": (len(self.cache) / self.max_size * 100) if self.max_size > 0 else 0
        }


class MemoryService:
    """记忆服务统一接口"""
    
    def __init__(self):
        """初始化记忆服务"""
        self.short_term = ShortTermMemory()
        self.long_term = LongTermMemory()
        self.working = WorkingMemory()
        logger.info("Initialized MemoryService")
    
    async def get_context(
        self,
        agent_id: str,
        conversation_id: str
    ) -> Dict:
        """
        获取完整上下文
        
        Args:
            agent_id: Agent ID
            conversation_id: 会话ID
            
        Returns:
            完整上下文
        """
        return {
            "short_term": await self.short_term.get(conversation_id),
            "long_term": await self.long_term.get(agent_id),
            "working": self.working.get(conversation_id)
        }
    
    async def clear_conversation(self, conversation_id: str):
        """
        清空会话相关的所有记忆
        
        Args:
            conversation_id: 会话ID
        """
        await self.short_term.clear(conversation_id)
        self.working.clear(conversation_id)
        logger.info(f"Cleared all memory for conversation {conversation_id}")
    
    async def cleanup_idle_memories(self, max_idle_minutes: int = 30):
        """
        清理所有空闲记忆（内存优化）
        
        Args:
            max_idle_minutes: 最大空闲时间（分钟）
        """
        logger.info(f"Cleaning up idle memories (max_idle={max_idle_minutes}min)")
        
        # 清理短期记忆
        await self.short_term.cleanup_idle_conversations(max_idle_minutes)
        
        # 清理工作记忆
        self.working.cleanup_idle(max_idle_minutes)
        
        logger.info("Idle memory cleanup completed")
    
    def get_stats(self) -> Dict:
        """获取所有记忆系统的统计信息"""
        return {
            "short_term": self.short_term.get_stats(),
            "working": self.working.get_stats()
        }
