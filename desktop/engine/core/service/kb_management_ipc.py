"""
知识库管理相关的IPC函数
包括创建、列表、更新、删除知识库等管理功能
"""
from typing import Dict, Any, Optional
from core.storage.simple_db import get_db
from logger import get_logger

logger = get_logger("kb_management_ipc")


def list_knowledge_bases(user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    列出所有知识库
    
    Args:
        user_id: 用户ID（可选，用于过滤）
        
    Returns:
        包含知识库列表的字典
    """
    try:
        logger.info(f"Listing knowledge bases: user_id={user_id}")
        
        db = get_db()
        kbs = db.list_knowledge_bases(user_id=user_id)
        
        logger.info(f"Found {len(kbs)} knowledge bases")
        
        return {
            "success": True,
            "knowledge_bases": kbs,
            "count": len(kbs)
        }
            
    except Exception as e:
        logger.error(f"List knowledge bases error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "knowledge_bases": []
        }


def get_knowledge_base(kb_id: str) -> Dict[str, Any]:
    """
    获取知识库详情
    
    Args:
        kb_id: 知识库ID
        
    Returns:
        包含知识库详情的字典
    """
    try:
        logger.info(f"Getting knowledge base: kb_id={kb_id}")
        
        db = get_db()
        kb = db.get_knowledge_base(kb_id)
        
        if kb is None:
            return {
                "success": False,
                "error": f"Knowledge base not found: {kb_id}"
            }
        
        logger.info(f"Knowledge base retrieved: {kb['name']}")
        
        return {
            "success": True,
            "knowledge_base": kb
        }
            
    except Exception as e:
        logger.error(f"Get knowledge base error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


def create_knowledge_base(
    name: str,
    description: str,
    embedding_model: Optional[str] = None,
    chunk_size: Optional[int] = None,
    chunk_overlap: Optional[int] = None,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    创建知识库
    
    Args:
        name: 知识库名称
        description: 知识库描述
        embedding_model: 嵌入模型（可选）
        chunk_size: 分块大小（可选）
        chunk_overlap: 分块重叠（可选）
        user_id: 用户ID（可选）
        
    Returns:
        包含新创建知识库信息的字典
    """
    try:
        logger.info(f"Creating knowledge base: name={name}")
        
        db = get_db()
        kb = db.create_knowledge_base({
            "name": name,
            "description": description,
            "embedding_model": embedding_model or "text-embedding-ada-002",
            "chunk_size": chunk_size or 1000,
            "chunk_overlap": chunk_overlap or 200,
            "user_id": user_id
        })
        
        logger.info(f"Knowledge base created: id={kb['id']}")
        
        return {
            "success": True,
            "knowledge_base": kb
        }
            
    except Exception as e:
        logger.error(f"Create knowledge base error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


def update_knowledge_base(
    kb_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None
) -> Dict[str, Any]:
    """
    更新知识库
    
    Args:
        kb_id: 知识库ID
        name: 新名称（可选）
        description: 新描述（可选）
        
    Returns:
        包含更新后知识库信息的字典
    """
    try:
        logger.info(f"Updating knowledge base: kb_id={kb_id}")
        
        db = get_db()
        
        # 构建更新数据
        updates = {}
        if name is not None:
            updates["name"] = name
        if description is not None:
            updates["description"] = description
        
        kb = db.update_knowledge_base(kb_id, updates)
        
        if kb is None:
            return {
                "success": False,
                "error": f"Knowledge base not found: {kb_id}"
            }
        
        logger.info(f"Knowledge base updated: id={kb['id']}")
        
        return {
            "success": True,
            "knowledge_base": kb
        }
            
    except Exception as e:
        logger.error(f"Update knowledge base error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


def delete_knowledge_base(kb_id: str) -> Dict[str, Any]:
    """
    删除知识库
    
    Args:
        kb_id: 知识库ID
        
    Returns:
        操作结果字典
    """
    try:
        logger.info(f"Deleting knowledge base: kb_id={kb_id}")
        
        db = get_db()
        success = db.delete_knowledge_base(kb_id)
        
        if not success:
            return {
                "success": False,
                "error": f"Knowledge base not found: {kb_id}"
            }
        
        logger.info(f"Knowledge base deleted: id={kb_id}")
        
        return {
            "success": True,
            "kb_id": kb_id
        }
            
    except Exception as e:
        logger.error(f"Delete knowledge base error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


def list_documents(kb_id: str) -> Dict[str, Any]:
    """
    列出知识库中的所有文档
    
    Args:
        kb_id: 知识库ID
        
    Returns:
        包含文档列表的字典
    """
    try:
        logger.info(f"Listing documents: kb_id={kb_id}")
        
        # TODO: 实现实际的文档列表查询
        # 目前返回空列表
        return {
            "success": True,
            "kb_id": kb_id,
            "documents": [],
            "count": 0
        }
            
    except Exception as e:
        logger.error(f"List documents error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "documents": []
        }
