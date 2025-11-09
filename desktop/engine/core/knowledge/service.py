"""知识库服务"""
from __future__ import annotations

import math
import re
from datetime import datetime
from typing import Iterable, List

from loguru import logger

from models.knowledge import ChunkConfig, DocumentChunk, KnowledgeBase, KnowledgeDocument, RetrievalResult
from utils.config import settings
from utils.datastore import JsonStore, generate_id


class KnowledgeService:
    def __init__(self) -> None:
        data_dir = settings.data_dir / 'data'
        self._base_store = JsonStore(data_dir / 'knowledge_bases.json', [])
        self._doc_store = JsonStore(data_dir / 'knowledge_docs.json', [])

    # ------------------------- 基本能力 -------------------------
    def list_bases(self) -> List[KnowledgeBase]:
        return [KnowledgeBase.model_validate(item) for item in self._base_store.read()]

    def get_base(self, base_id: str) -> KnowledgeBase | None:
        for kb in self.list_bases():
            if kb.id == base_id:
                return kb
        return None

    def create_base(self, payload: dict) -> KnowledgeBase:
        base = KnowledgeBase(
            id=payload.get('id', generate_id('kb')),
            name=payload['name'],
            description=payload.get('description'),
            embedding_model=payload.get('embedding_model', 'text-embedding-3-small'),
            chunk_config=ChunkConfig(**payload.get('chunk_config', {})),
            tags=payload.get('tags', []),
        )
        bases = self.list_bases()
        bases.append(base)
        self._base_store.write([item.model_dump() for item in bases])
        return base

    def update_base_stats(self, base_id: str) -> None:
        docs = [doc for doc in self.list_documents(base_id)]
        chunk_count = sum(len(doc.chunks) for doc in docs)
        bases = []
        for kb in self.list_bases():
            if kb.id == base_id:
                kb.stats['documents'] = len(docs)
                kb.stats['chunks'] = chunk_count
                kb.updated_at = datetime.utcnow()
            bases.append(kb)
        self._base_store.write([item.model_dump() for item in bases])

    # ------------------------- 文档管理 -------------------------
    def list_documents(self, base_id: str | None = None) -> List[KnowledgeDocument]:
        docs = [KnowledgeDocument.model_validate(item) for item in self._doc_store.read()]
        if base_id:
            return [doc for doc in docs if doc.base_id == base_id]
        return docs

    def add_document(self, base_id: str, *, name: str, content: str, mime: str = 'text/plain') -> KnowledgeDocument:
        kb = self.get_base(base_id)
        if not kb:
            raise ValueError('知识库不存在')
        document = KnowledgeDocument(
            id=generate_id('doc'),
            base_id=base_id,
            name=name,
            mime=mime,
            size=len(content.encode('utf-8')),
            status='processing',
        )
        chunks = self._chunk_text(content, kb.chunk_config.size, kb.chunk_config.overlap)
        document.chunks = [
            DocumentChunk(
                id=generate_id('chunk'),
                document_id=document.id,
                content=chunk,
                embedding=self._embed(chunk),
                position=index,
            )
            for index, chunk in enumerate(chunks)
        ]
        document.status = 'completed'
        documents = self.list_documents()
        documents.append(document)
        self._doc_store.write([item.model_dump() for item in documents])

        kb.document_ids.append(document.id)
        kb.stats['documents'] = len(self.list_documents(base_id))
        kb.stats['chunks'] = sum(len(doc.chunks) for doc in self.list_documents(base_id))
        kb.updated_at = datetime.utcnow()
        bases = []
        for item in self.list_bases():
            if item.id == base_id:
                bases.append(kb)
            else:
                bases.append(item)
        self._base_store.write([base.model_dump() for base in bases])
        logger.info('Knowledge base %s ingest document %s (%s chunks)', base_id, document.id, len(document.chunks))
        return document

    def delete_document(self, document_id: str) -> None:
        documents = [doc for doc in self.list_documents() if doc.id != document_id]
        self._doc_store.write([doc.model_dump() for doc in documents])

    # ------------------------- 检索 -------------------------
    def search(self, base_ids: Iterable[str], query: str, top_k: int = 5) -> List[RetrievalResult]:
        if not query.strip():
            return []
        wanted = set(base_ids)
        chunks: List[DocumentChunk] = []
        docs = self.list_documents()
        for doc in docs:
            if doc.base_id in wanted:
                chunks.extend(doc.chunks)
        if not chunks:
            return []
        query_vec = self._embed(query)
        scored: List[tuple[float, DocumentChunk]] = []
        for chunk in chunks:
            score = self._similarity(query_vec, chunk.embedding)
            scored.append((score, chunk))
        scored.sort(key=lambda item: item[0], reverse=True)
        results = []
        for score, chunk in scored[:top_k]:
            doc = next((doc for doc in docs if doc.id == chunk.document_id), None)
            if not doc:
                continue
            results.append(
                RetrievalResult(
                    base_id=doc.base_id,
                    document_id=doc.id,
                    chunk_id=chunk.id,
                    score=score,
                    content=chunk.content,
                )
            )
        self._increment_query_stats(wanted, results)
        return results

    def _increment_query_stats(self, base_ids: set[str], results: List[RetrievalResult]) -> None:
        bases = []
        for base in self.list_bases():
            if base.id in base_ids:
                base.stats['queries'] = base.stats.get('queries', 0) + 1
                if results:
                    avg = sum(result.score for result in results) / len(results)
                    base.stats['avg_score'] = round((base.stats.get('avg_score', 0) + avg) / 2, 3)
            bases.append(base)
        self._base_store.write([item.model_dump() for item in bases])

    # ------------------------- 工具方法 -------------------------
    def _chunk_text(self, text: str, size: int, overlap: int) -> List[str]:
        tokens = re.split(r"(。|！|？|\n)", text)
        merged = [''.join(tokens[i:i + 2]) for i in range(0, len(tokens), 2)]
        chunks: List[str] = []
        buffer = ''
        for sentence in merged:
            if len(buffer) + len(sentence) > size and buffer:
                chunks.append(buffer)
                buffer = sentence[-overlap:]
            buffer += sentence
        if buffer:
            chunks.append(buffer)
        return chunks or [text]

    def _embed(self, text: str) -> List[float]:
        # 简易 embedding：根据字符编码生成 8 维向量
        cleaned = text.strip().lower()
        vector = [0.0] * 8
        for index, char in enumerate(cleaned[:512]):
            vector[index % 8] += (ord(char) % 32) / 100
        norm = math.sqrt(sum(value * value for value in vector)) or 1.0
        return [round(value / norm, 4) for value in vector]

    def _similarity(self, left: List[float], right: List[float]) -> float:
        score = sum(a * b for a, b in zip(left, right))
        return round(score, 4)


knowledge_service = KnowledgeService()
