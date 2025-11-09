"""知识库与文档模型"""
from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Literal

from pydantic import BaseModel, Field


class ChunkConfig(BaseModel):
    size: int = 512
    overlap: int = 64
    strategy: Literal['sentence', 'token', 'markdown'] = 'sentence'


class DocumentChunk(BaseModel):
    id: str
    document_id: str
    content: str
    embedding: List[float]
    position: int
    metadata: Dict[str, str] = Field(default_factory=dict)


class KnowledgeDocument(BaseModel):
    id: str
    base_id: str
    name: str
    mime: str
    size: int
    status: Literal['pending', 'processing', 'completed', 'failed'] = 'pending'
    chunks: List[DocumentChunk] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    failure_reason: str | None = None


class KnowledgeBase(BaseModel):
    id: str
    name: str
    description: str | None = None
    embedding_model: str = 'text-embedding-3-small'
    chunk_config: ChunkConfig = Field(default_factory=ChunkConfig)
    tags: List[str] = Field(default_factory=list)
    document_ids: List[str] = Field(default_factory=list)
    stats: Dict[str, float] = Field(
        default_factory=lambda: {
            'documents': 0,
            'chunks': 0,
            'queries': 0,
            'avg_score': 0.0,
        }
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class RetrievalResult(BaseModel):
    base_id: str
    document_id: str
    chunk_id: str
    score: float
    content: str
    metadata: Dict[str, str] = Field(default_factory=dict)
