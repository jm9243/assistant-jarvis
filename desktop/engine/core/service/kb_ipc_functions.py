"""
知识库相关的IPC函数
这些函数将被注册到函数注册表，供Rust层通过IPC调用
"""
from typing import Dict, Any, List, Optional
from core.service.knowledge_base import KnowledgeBaseService
from logger import get_logger
import asyncio

logger = get_logger("kb_ipc")

# 延迟初始化知识库服务
_kb_service: Optional[KnowledgeBaseService] = None


def _get_kb_service() -> KnowledgeBaseService:
    """获取知识库服务实例（延迟初始化）"""
    global _kb_service
    if _kb_service is None:
        _kb_service = KnowledgeBaseService()
    return _kb_service


def kb_search(
    kb_id: str,
    query: str,
    top_k: int = 5,
    min_similarity: float = 0.7,
    search_type: str = "vector"
) -> Dict[str, Any]:
    """
    知识库检索函数
    
    Args:
        kb_id: 知识库ID
        query: 查询文本
        top_k: 返回结果数量
        min_similarity: 最小相似度阈值
        search_type: 检索类型 (vector/keyword/hybrid)
        
    Returns:
        包含检索结果的字典
    """
    try:
        logger.info(f"KB search: kb_id={kb_id}, query_length={len(query)}, top_k={top_k}")
        
        # 执行检索（同步包装异步调用）
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            service = _get_kb_service()
            if search_type == "hybrid":
                results = loop.run_until_complete(
                    service.hybrid_search(
                        kb_id=kb_id,
                        query=query,
                        top_k=top_k * 2,  # 混合检索获取更多结果
                        final_k=top_k
                    )
                )
            elif search_type == "keyword":
                results = loop.run_until_complete(
                    service.keyword_search(
                        kb_id=kb_id,
                        query=query,
                        top_k=top_k
                    )
                )
            else:  # vector (default)
                results = loop.run_until_complete(
                    service.search(
                        kb_id=kb_id,
                        query=query,
                        top_k=top_k,
                        min_similarity=min_similarity
                    )
                )
            
            # 转换结果为字典格式
            results_dict = [
                {
                    "content": result.content,
                    "similarity": result.similarity,
                    "document_name": result.document_name,
                    "metadata": result.metadata
                }
                for result in results
            ]
            
            logger.info(f"KB search completed: found {len(results_dict)} results")
            
            return {
                "success": True,
                "kb_id": kb_id,
                "query": query,
                "results": results_dict,
                "count": len(results_dict)
            }
            
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"KB search error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "kb_id": kb_id,
            "results": []
        }


def kb_add_document(
    kb_id: str,
    file_path: str,
    chunk_size: int = None,
    chunk_overlap: int = None
) -> Dict[str, Any]:
    """
    添加文档到知识库
    
    Args:
        kb_id: 知识库ID
        file_path: 文件路径
        chunk_size: 分块大小（可选）
        chunk_overlap: 分块重叠（可选）
        
    Returns:
        包含文档ID和分块数量的字典
    """
    try:
        logger.info(f"Adding document to KB: kb_id={kb_id}, file_path={file_path}")
        
        # 执行添加文档（同步包装异步调用）
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            service = _get_kb_service()
            doc_id = loop.run_until_complete(
                service.add_document(
                    kb_id=kb_id,
                    file_path=file_path,
                    chunk_size=chunk_size,
                    chunk_overlap=chunk_overlap
                )
            )
            
            logger.info(f"Document added successfully: doc_id={doc_id}")
            
            return {
                "success": True,
                "kb_id": kb_id,
                "document_id": doc_id,
                "file_path": file_path
            }
            
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"Add document error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "kb_id": kb_id,
            "file_path": file_path
        }


def kb_delete_document(
    kb_id: str,
    doc_id: str
) -> Dict[str, Any]:
    """
    从知识库删除文档
    
    Args:
        kb_id: 知识库ID
        doc_id: 文档ID
        
    Returns:
        操作结果字典
    """
    try:
        logger.info(f"Deleting document from KB: kb_id={kb_id}, doc_id={doc_id}")
        
        # 执行删除（同步包装异步调用）
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            service = _get_kb_service()
            loop.run_until_complete(
                service.delete_document(
                    kb_id=kb_id,
                    doc_id=doc_id
                )
            )
            
            logger.info(f"Document deleted successfully: doc_id={doc_id}")
            
            return {
                "success": True,
                "kb_id": kb_id,
                "document_id": doc_id
            }
            
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"Delete document error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "kb_id": kb_id,
            "document_id": doc_id
        }


def kb_get_stats(kb_id: str) -> Dict[str, Any]:
    """
    获取知识库统计信息
    
    Args:
        kb_id: 知识库ID
        
    Returns:
        包含统计信息的字典
    """
    try:
        logger.info(f"Getting KB stats: kb_id={kb_id}")
        
        # 执行获取统计（同步包装异步调用）
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            service = _get_kb_service()
            stats = loop.run_until_complete(
                service.get_knowledge_base_stats(kb_id)
            )
            
            logger.info(f"KB stats retrieved: {stats}")
            
            return {
                "success": True,
                "kb_id": kb_id,
                "stats": stats
            }
            
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"Get KB stats error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "kb_id": kb_id
        }
