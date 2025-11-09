"""知识库API"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core.knowledge.service import knowledge_service
from models.common import Result

router = APIRouter()


class KnowledgeBaseCreate(BaseModel):
    name: str
    description: str | None = None
    embedding_model: str | None = None
    chunk_config: dict | None = None
    tags: list[str] | None = None


class UploadDocumentRequest(BaseModel):
    name: str
    content: str
    mime: str = 'text/plain'


class KnowledgeSearchRequest(BaseModel):
    base_ids: list[str]
    query: str
    top_k: int = 5


@router.get('/bases')
async def list_bases():
    bases = [base.model_dump() for base in knowledge_service.list_bases()]
    return Result(success=True, data=bases)


@router.post('/bases')
async def create_base(payload: KnowledgeBaseCreate):
    base = knowledge_service.create_base(payload.model_dump())
    return Result(success=True, data=base.model_dump())


@router.get('/bases/{base_id}/documents')
async def list_documents(base_id: str):
    documents = [doc.model_dump() for doc in knowledge_service.list_documents(base_id)]
    return Result(success=True, data=documents)


@router.post('/bases/{base_id}/documents')
async def upload_document(base_id: str, payload: UploadDocumentRequest):
    if not knowledge_service.get_base(base_id):
        raise HTTPException(status_code=404, detail='知识库不存在')
    document = knowledge_service.add_document(base_id, name=payload.name, content=payload.content, mime=payload.mime)
    return Result(success=True, data=document.model_dump())


@router.delete('/documents/{document_id}')
async def delete_document(document_id: str):
    knowledge_service.delete_document(document_id)
    return Result(success=True, data=True)


@router.post('/search')
async def search(payload: KnowledgeSearchRequest):
    results = [result.model_dump() for result in knowledge_service.search(payload.base_ids, payload.query, payload.top_k)]
    return Result(success=True, data=results)
