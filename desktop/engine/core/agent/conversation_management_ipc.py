"""
会话管理相关的IPC函数
包括创建、列表、更新、删除会话等功能
"""
from typing import Dict, Any, Optional
from core.storage.simple_db import get_db
from logger import get_logger

logger = get_logger("conversation_management_ipc")


def list_conversations(
    agent_id: Optional[str] = None,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    列出所有会话
    
    Args:
        agent_id: Agent ID（可选，用于过滤）
        user_id: 用户ID（可选，用于过滤）
        
    Returns:
        包含会话列表的字典
    """
    try:
        logger.info(f"Listing conversations: agent_id={agent_id}, user_id={user_id}")
        
        db = get_db()
        conversations = db.list_conversations(agent_id=agent_id, user_id=user_id)
        
        logger.info(f"Found {len(conversations)} conversations")
        
        return {
            "success": True,
            "conversations": conversations,
            "count": len(conversations)
        }
            
    except Exception as e:
        logger.error(f"List conversations error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "conversations": []
        }


def get_conversation(conversation_id: str) -> Dict[str, Any]:
    """
    获取会话详情
    
    Args:
        conversation_id: 会话ID
        
    Returns:
        包含会话详情的字典
    """
    try:
        logger.info(f"Getting conversation: conversation_id={conversation_id}")
        
        db = get_db()
        conversation = db.get_conversation(conversation_id)
        
        if conversation is None:
            return {
                "success": False,
                "error": f"Conversation not found: {conversation_id}"
            }
        
        logger.info(f"Conversation retrieved: {conversation['id']}")
        
        return {
            "success": True,
            "conversation": conversation
        }
            
    except Exception as e:
        logger.error(f"Get conversation error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


def update_conversation(
    conversation_id: str,
    title: Optional[str] = None,
    summary: Optional[str] = None
) -> Dict[str, Any]:
    """
    更新会话
    
    Args:
        conversation_id: 会话ID
        title: 新标题（可选）
        summary: 新摘要（可选）
        
    Returns:
        包含更新后会话信息的字典
    """
    try:
        logger.info(f"Updating conversation: conversation_id={conversation_id}")
        
        db = get_db()
        
        # 构建更新数据
        updates = {}
        if title is not None:
            updates["title"] = title
        if summary is not None:
            updates["summary"] = summary
        
        conversation = db.update_conversation(conversation_id, updates)
        
        if conversation is None:
            return {
                "success": False,
                "error": f"Conversation not found: {conversation_id}"
            }
        
        logger.info(f"Conversation updated: id={conversation['id']}")
        
        return {
            "success": True,
            "conversation": conversation
        }
            
    except Exception as e:
        logger.error(f"Update conversation error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


def delete_conversation(conversation_id: str) -> Dict[str, Any]:
    """
    删除会话
    
    Args:
        conversation_id: 会话ID
        
    Returns:
        操作结果字典
    """
    try:
        logger.info(f"Deleting conversation: conversation_id={conversation_id}")
        
        db = get_db()
        success = db.delete_conversation(conversation_id)
        
        if not success:
            return {
                "success": False,
                "error": f"Conversation not found: {conversation_id}"
            }
        
        logger.info(f"Conversation deleted: id={conversation_id}")
        
        return {
            "success": True,
            "conversation_id": conversation_id
        }
            
    except Exception as e:
        logger.error(f"Delete conversation error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


def get_messages(conversation_id: str) -> Dict[str, Any]:
    """
    获取会话的所有消息
    
    Args:
        conversation_id: 会话ID
        
    Returns:
        包含消息列表的字典
    """
    try:
        logger.info(f"Getting messages: conversation_id={conversation_id}")
        
        db = get_db()
        messages = db.list_messages(conversation_id)
        
        logger.info(f"Found {len(messages)} messages")
        
        return {
            "success": True,
            "messages": messages,
            "count": len(messages)
        }
            
    except Exception as e:
        logger.error(f"Get messages error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "messages": []
        }
