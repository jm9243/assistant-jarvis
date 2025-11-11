"""
会话管理服务
"""
from typing import List, Dict, Optional
from datetime import datetime

from core.storage.backend import BackendClient
from logger import get_logger

logger = get_logger("conversation")


class ConversationService:
    """会话服务"""
    
    def __init__(self):
        """初始化会话服务"""
        self.backend_client = BackendClient()
        logger.info("Initialized ConversationService")
    
    async def create(
        self,
        agent_id: str,
        user_id: str,
        title: str = None
    ) -> str:
        """
        创建会话
        
        Args:
            agent_id: Agent ID
            user_id: 用户ID
            title: 会话标题
            
        Returns:
            会话ID
        """
        try:
            response = await self.backend_client.post("/api/v1/conversations", {
                "agent_id": agent_id,
                "user_id": user_id,
                "title": title or "新对话"
            })
            conversation_id = response["data"]["id"]
            logger.info(f"Created conversation {conversation_id} for agent {agent_id}")
            return conversation_id
        except Exception as e:
            logger.error(f"Failed to create conversation: {e}")
            raise
    
    async def get(self, conversation_id: str) -> Dict:
        """
        获取会话详情
        
        Args:
            conversation_id: 会话ID
            
        Returns:
            会话信息
        """
        try:
            response = await self.backend_client.get(
                f"/api/v1/conversations/{conversation_id}"
            )
            return response["data"]
        except Exception as e:
            logger.error(f"Failed to get conversation {conversation_id}: {e}")
            raise
    
    async def list(
        self,
        user_id: str = None,
        agent_id: str = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict]:
        """
        获取会话列表
        
        Args:
            user_id: 用户ID（可选）
            agent_id: Agent ID（可选）
            limit: 返回数量
            offset: 偏移量
            
        Returns:
            会话列表
        """
        try:
            params = {
                "limit": limit,
                "offset": offset
            }
            if user_id:
                params["user_id"] = user_id
            if agent_id:
                params["agent_id"] = agent_id
            
            response = await self.backend_client.get(
                "/api/v1/conversations",
                params=params
            )
            return response["data"]
        except Exception as e:
            logger.error(f"Failed to list conversations: {e}")
            return []
    
    async def get_messages(
        self,
        conversation_id: str,
        limit: int = 100,
        before_id: str = None
    ) -> List[Dict]:
        """
        获取会话消息
        
        Args:
            conversation_id: 会话ID
            limit: 返回数量
            before_id: 在此消息之前的消息
            
        Returns:
            消息列表
        """
        try:
            params = {"limit": limit}
            if before_id:
                params["before_id"] = before_id
            
            response = await self.backend_client.get(
                f"/api/v1/conversations/{conversation_id}/messages",
                params=params
            )
            return response["data"]
        except Exception as e:
            logger.error(f"Failed to get messages for conversation {conversation_id}: {e}")
            return []
    
    async def add_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        metadata: Dict = None
    ) -> str:
        """
        添加消息
        
        Args:
            conversation_id: 会话ID
            role: 角色（user/assistant/system）
            content: 消息内容
            metadata: 元数据
            
        Returns:
            消息ID
        """
        try:
            response = await self.backend_client.post(
                f"/api/v1/conversations/{conversation_id}/messages",
                {
                    "role": role,
                    "content": content,
                    "metadata": metadata or {}
                }
            )
            message_id = response["data"]["id"]
            logger.debug(f"Added message {message_id} to conversation {conversation_id}")
            return message_id
        except Exception as e:
            logger.error(f"Failed to add message to conversation {conversation_id}: {e}")
            raise
    
    async def update(
        self,
        conversation_id: str,
        title: str = None,
        summary: str = None
    ) -> Dict:
        """
        更新会话
        
        Args:
            conversation_id: 会话ID
            title: 新标题
            summary: 摘要
            
        Returns:
            更新后的会话信息
        """
        try:
            data = {}
            if title is not None:
                data["title"] = title
            if summary is not None:
                data["summary"] = summary
            
            response = await self.backend_client.patch(
                f"/api/v1/conversations/{conversation_id}",
                data
            )
            logger.info(f"Updated conversation {conversation_id}")
            return response["data"]
        except Exception as e:
            logger.error(f"Failed to update conversation {conversation_id}: {e}")
            raise
    
    async def delete(self, conversation_id: str):
        """
        删除会话
        
        Args:
            conversation_id: 会话ID
        """
        try:
            await self.backend_client.delete(
                f"/api/v1/conversations/{conversation_id}"
            )
            logger.info(f"Deleted conversation {conversation_id}")
        except Exception as e:
            logger.error(f"Failed to delete conversation {conversation_id}: {e}")
            raise
    
    async def export(
        self,
        conversation_id: str,
        format: str = "json"
    ) -> Dict:
        """
        导出会话
        
        Args:
            conversation_id: 会话ID
            format: 导出格式（json/txt/md）
            
        Returns:
            导出数据
        """
        try:
            # 获取会话信息
            conversation = await self.get(conversation_id)
            
            # 获取所有消息
            messages = await self.get_messages(conversation_id, limit=1000)
            
            if format == "json":
                return {
                    "conversation": conversation,
                    "messages": messages
                }
            elif format == "txt":
                # 生成纯文本格式
                lines = [
                    f"会话: {conversation['title']}",
                    f"创建时间: {conversation['created_at']}",
                    "=" * 50,
                    ""
                ]
                for msg in messages:
                    lines.append(f"{msg['role']}: {msg['content']}")
                    lines.append("")
                return {"content": "\n".join(lines)}
            elif format == "md":
                # 生成Markdown格式
                lines = [
                    f"# {conversation['title']}",
                    "",
                    f"**创建时间**: {conversation['created_at']}",
                    "",
                    "---",
                    ""
                ]
                for msg in messages:
                    role_name = {"user": "用户", "assistant": "助手", "system": "系统"}.get(msg['role'], msg['role'])
                    lines.append(f"### {role_name}")
                    lines.append("")
                    lines.append(msg['content'])
                    lines.append("")
                return {"content": "\n".join(lines)}
            else:
                raise ValueError(f"Unsupported format: {format}")
                
        except Exception as e:
            logger.error(f"Failed to export conversation {conversation_id}: {e}")
            raise
    
    async def close(self):
        """关闭服务"""
        await self.backend_client.close()
        logger.info("ConversationService closed")
