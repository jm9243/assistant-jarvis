"""
知识库管理API路由
"""
from fastapi import APIRouter, HTTPException, status, UploadFile, File
from typing import List
import uuid
import os
from pathlib import Path

from models.knowledge_base import (
    KnowledgeBaseCreateRequest,
    KnowledgeBaseUpdateRequest,
    DocumentUploadRequest,
    SearchRequest
)
from core.service.knowledge_base import KnowledgeBaseService
from logger import get_logger

logger = get_logger("api.knowledge_base")

router = APIRouter(prefix="/knowledge-bases", tags=["knowledge-bases"])

# 知识库服务实例
_kb_service = KnowledgeBaseService()


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_knowledge_base(request: KnowledgeBaseCreateRequest):
    """
    创建知识库
    
    Args:
        request: 知识库创建请求
        
    Returns:
        创建的知识库信息
    """
    try:
        kb_id = await _kb_service.create_knowledge_base(
            name=request.name,
            description=request.description,
            embedding_model=request.embedding_model,
            chunk_size=request.chunk_size,
            chunk_overlap=request.chunk_overlap
        )
        
        return {
            "code": 0,
            "message": "success",
            "data": {
                "id": kb_id,
                "name": request.name,
                "description": request.description
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to create knowledge base: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("")
async def list_knowledge_bases(
    user_id: str = None,
    limit: int = 50,
    offset: int = 0
):
    """
    获取知识库列表
    
    Args:
        user_id: 用户ID（可选）
        limit: 返回数量
        offset: 偏移量
        
    Returns:
        知识库列表
    """
    try:
        knowledge_bases = await _kb_service.list_knowledge_bases(
            user_id=user_id,
            limit=limit,
            offset=offset
        )
        
        return {
            "code": 0,
            "message": "success",
            "data": knowledge_bases
        }
        
    except Exception as e:
        logger.error(f"Failed to list knowledge bases: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{kb_id}")
async def get_knowledge_base(kb_id: str):
    """
    获取知识库详情
    
    Args:
        kb_id: 知识库ID
        
    Returns:
        知识库信息
    """
    try:
        kb = await _kb_service.get_knowledge_base(kb_id)
        
        return {
            "code": 0,
            "message": "success",
            "data": kb
        }
        
    except Exception as e:
        logger.error(f"Failed to get knowledge base {kb_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.patch("/{kb_id}")
async def update_knowledge_base(kb_id: str, request: KnowledgeBaseUpdateRequest):
    """
    更新知识库
    
    Args:
        kb_id: 知识库ID
        request: 更新请求
        
    Returns:
        更新后的知识库信息
    """
    try:
        kb = await _kb_service.update_knowledge_base(
            kb_id=kb_id,
            name=request.name,
            description=request.description
        )
        
        return {
            "code": 0,
            "message": "success",
            "data": kb
        }
        
    except Exception as e:
        logger.error(f"Failed to update knowledge base {kb_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/{kb_id}")
async def delete_knowledge_base(kb_id: str):
    """
    删除知识库
    
    Args:
        kb_id: 知识库ID
        
    Returns:
        删除结果
    """
    try:
        await _kb_service.delete_knowledge_base(kb_id)
        
        return {
            "code": 0,
            "message": "success",
            "data": {"id": kb_id}
        }
        
    except Exception as e:
        logger.error(f"Failed to delete knowledge base {kb_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/{kb_id}/documents")
async def upload_document(
    kb_id: str,
    file: UploadFile = File(...)
):
    """
    上传文档到知识库
    
    Args:
        kb_id: 知识库ID
        file: 上传的文件
        
    Returns:
        文档信息
    """
    try:
        # 保存上传的文件
        temp_dir = Path.home() / ".jarvis" / "temp"
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = temp_dir / f"{uuid.uuid4()}_{file.filename}"
        
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # 添加文档到知识库
        doc_id = await _kb_service.add_document(
            kb_id=kb_id,
            file_path=str(file_path),
            file_name=file.filename
        )
        
        # 删除临时文件
        try:
            os.remove(file_path)
        except:
            pass
        
        return {
            "code": 0,
            "message": "success",
            "data": {
                "id": doc_id,
                "name": file.filename,
                "status": "processing"
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to upload document to knowledge base {kb_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{kb_id}/documents")
async def list_documents(
    kb_id: str,
    limit: int = 50,
    offset: int = 0
):
    """
    获取知识库文档列表
    
    Args:
        kb_id: 知识库ID
        limit: 返回数量
        offset: 偏移量
        
    Returns:
        文档列表
    """
    try:
        documents = await _kb_service.list_documents(
            kb_id=kb_id,
            limit=limit,
            offset=offset
        )
        
        return {
            "code": 0,
            "message": "success",
            "data": documents
        }
        
    except Exception as e:
        logger.error(f"Failed to list documents for knowledge base {kb_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{kb_id}/documents/{doc_id}")
async def get_document(kb_id: str, doc_id: str):
    """
    获取文档详情
    
    Args:
        kb_id: 知识库ID
        doc_id: 文档ID
        
    Returns:
        文档信息
    """
    try:
        document = await _kb_service.get_document(kb_id, doc_id)
        
        return {
            "code": 0,
            "message": "success",
            "data": document
        }
        
    except Exception as e:
        logger.error(f"Failed to get document {doc_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete("/{kb_id}/documents/{doc_id}")
async def delete_document(kb_id: str, doc_id: str):
    """
    删除文档
    
    Args:
        kb_id: 知识库ID
        doc_id: 文档ID
        
    Returns:
        删除结果
    """
    try:
        await _kb_service.delete_document(kb_id, doc_id)
        
        return {
            "code": 0,
            "message": "success",
            "data": {"id": doc_id}
        }
        
    except Exception as e:
        logger.error(f"Failed to delete document {doc_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/{kb_id}/search")
async def search_knowledge_base(kb_id: str, request: SearchRequest):
    """
    检索知识库
    
    Args:
        kb_id: 知识库ID
        request: 检索请求
        
    Returns:
        检索结果
    """
    try:
        results = await _kb_service.search(
            kb_id=kb_id,
            query=request.query,
            top_k=request.top_k,
            min_similarity=request.min_similarity
        )
        
        return {
            "code": 0,
            "message": "success",
            "data": {
                "query": request.query,
                "results": [
                    {
                        "content": r.content,
                        "similarity": r.similarity,
                        "document_name": r.document_name,
                        "metadata": r.metadata
                    }
                    for r in results
                ]
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to search knowledge base {kb_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{kb_id}/stats")
async def get_knowledge_base_stats(kb_id: str):
    """
    获取知识库统计信息
    
    Args:
        kb_id: 知识库ID
        
    Returns:
        统计信息
    """
    try:
        stats = await _kb_service.get_stats(kb_id)
        
        return {
            "code": 0,
            "message": "success",
            "data": stats
        }
        
    except Exception as e:
        logger.error(f"Failed to get stats for knowledge base {kb_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
