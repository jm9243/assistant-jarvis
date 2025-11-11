"""
Agent基类
"""
from abc import ABC, abstractmethod
from typing import AsyncIterator, List, Dict, Optional

from models.agent import AgentConfig
from core.service.llm import LLMService
from core.service.memory import MemoryService
from core.service.knowledge_base import KnowledgeBaseService
from logger import get_logger, log_agent_action

logger = get_logger("agent")


class BaseAgent(ABC):
    """Agent基类"""
    
    def __init__(self, config: AgentConfig):
        """
        初始化Agent
        
        Args:
            config: Agent配置
        """
        self.config = config
        self.agent_id = config.id
        self.agent_type = config.type
        
        # 初始化服务
        self.llm_service = LLMService(config.llm_config)
        self.memory_service = MemoryService()
        self.kb_service = KnowledgeBaseService() if config.knowledge_base_ids else None
        
        logger.info(f"Initialized {self.__class__.__name__} (ID: {self.agent_id})")
        log_agent_action(self.agent_id, "initialized", {"type": self.agent_type})
    
    @abstractmethod
    async def chat(
        self,
        message: str,
        conversation_id: str,
        **kwargs
    ) -> AsyncIterator[str]:
        """
        处理用户消息（抽象方法）
        
        Args:
            message: 用户消息
            conversation_id: 会话ID
            **kwargs: 其他参数
            
        Yields:
            响应token
        """
        pass
    
    async def _build_messages(
        self,
        history: List[Dict],
        user_message: str,
        system_prompt: str = None,
        image_urls: list = None
    ) -> List[Dict]:
        """
        构建LLM消息列表（支持多模态）
        
        Args:
            history: 对话历史
            user_message: 用户消息
            system_prompt: 系统提示词
            image_urls: 图片URL列表（用于视觉模型）
            
        Returns:
            消息列表
        """
        messages = []
        
        # 添加系统提示词
        if system_prompt or self.config.system_prompt:
            messages.append({
                "role": "system",
                "content": system_prompt or self.config.system_prompt
            })
        
        # 添加历史消息
        messages.extend(history)
        
        # 添加用户消息（支持多模态）
        if image_urls and len(image_urls) > 0:
            # 构建多模态消息（OpenAI Vision格式）
            content = [
                {
                    "type": "text",
                    "text": user_message
                }
            ]
            
            # 添加图片
            for image_url in image_urls:
                content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": image_url
                    }
                })
            
            messages.append({
                "role": "user",
                "content": content
            })
        else:
            # 纯文本消息
            messages.append({
                "role": "user",
                "content": user_message
            })
        
        return messages
    
    async def _retrieve_knowledge(
        self,
        query: str,
        top_k: int = 3
    ) -> List[Dict]:
        """
        从知识库检索相关信息
        
        Args:
            query: 查询文本
            top_k: 返回结果数量
            
        Returns:
            检索结果列表
        """
        if not self.kb_service or not self.config.knowledge_base_ids:
            return []
        
        all_results = []
        
        try:
            # 从所有绑定的知识库检索
            for kb_id in self.config.knowledge_base_ids:
                results = await self.kb_service.search(
                    kb_id=kb_id,
                    query=query,
                    top_k=top_k
                )
                all_results.extend(results)
            
            # 按相似度排序并返回top_k
            all_results.sort(key=lambda x: x.similarity, reverse=True)
            return all_results[:top_k]
            
        except Exception as e:
            logger.error(f"Failed to retrieve knowledge: {e}")
            return []
    
    async def _inject_knowledge_to_prompt(
        self,
        user_message: str,
        knowledge_results: List
    ) -> str:
        """
        将知识库检索结果注入到prompt
        
        Args:
            user_message: 用户消息
            knowledge_results: 检索结果
            
        Returns:
            增强后的消息
        """
        if not knowledge_results:
            return user_message
        
        # 构建知识上下文
        knowledge_context = "\n\n参考信息：\n"
        for i, result in enumerate(knowledge_results, 1):
            knowledge_context += f"\n[{i}] 来源：{result.document_name}\n"
            knowledge_context += f"内容：{result.content}\n"
            knowledge_context += f"相关度：{result.similarity:.2f}\n"
        
        # 将知识注入到用户消息
        enhanced_message = f"{knowledge_context}\n\n用户问题：{user_message}\n\n请基于以上参考信息回答用户问题，并在回答中标注引用来源。"
        
        return enhanced_message
    
    def _extract_citations(self, response: str) -> tuple[str, List[Dict]]:
        """
        从响应中提取引用信息
        
        Args:
            response: Agent响应
            
        Returns:
            (响应文本, 引用列表)
        """
        # 简单实现：查找[数字]格式的引用
        # 实际应该更复杂的解析
        citations = []
        # TODO: 实现引用提取逻辑
        return response, citations
    
    async def get_config(self) -> AgentConfig:
        """获取Agent配置"""
        return self.config
    
    async def update_config(self, config: AgentConfig):
        """
        更新Agent配置
        
        Args:
            config: 新配置
        """
        self.config = config
        self.llm_service = LLMService(config.llm_config)
        logger.info(f"Updated config for agent {self.agent_id}")
        log_agent_action(self.agent_id, "config_updated", {})
