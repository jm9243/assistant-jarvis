"""
知识库服务
"""
import uuid
from typing import List, Dict, Optional
from pathlib import Path

from models.knowledge_base import KnowledgeBase, Document, SearchResult
from core.storage.chroma import get_chroma_client
from core.service.embedding import EmbeddingService
from core.service.document_parser import DocumentParser
from core.storage.backend import BackendClient
from config import settings
from logger import get_logger

logger = get_logger("knowledge_base")


class KnowledgeBaseService:
    """知识库服务"""
    
    def __init__(self):
        """初始化知识库服务"""
        self.chroma_client = get_chroma_client()
        self.embedding_service = EmbeddingService()
        self.document_parser = DocumentParser()
        self.backend_client = BackendClient()
        logger.info("KnowledgeBaseService initialized")
    
    async def create_knowledge_base(
        self,
        name: str,
        description: str,
        user_id: str,
        embedding_model: str = None,
        chunk_size: int = None,
        chunk_overlap: int = None
    ) -> str:
        """
        创建知识库
        
        Args:
            name: 知识库名称
            description: 描述
            user_id: 用户ID
            embedding_model: Embedding模型
            chunk_size: 分块大小
            chunk_overlap: 分块重叠
            
        Returns:
            知识库ID
        """
        kb_id = str(uuid.uuid4())
        
        try:
            # 创建Chroma collection（使用HNSW索引优化）
            self.chroma_client.create_collection(
                name=kb_id,
                metadata={
                    "name": name,
                    "description": description,
                    "embedding_model": embedding_model or settings.embedding_model
                },
                use_hnsw=True  # 启用HNSW索引优化检索性能
            )
            
            # 保存配置到Backend
            kb_config = {
                "id": kb_id,
                "user_id": user_id,
                "name": name,
                "description": description,
                "embedding_model": embedding_model or settings.embedding_model,
                "chunk_size": chunk_size or settings.chunk_size,
                "chunk_overlap": chunk_overlap or settings.chunk_overlap,
                "document_count": 0,
                "vector_count": 0
            }
            
            await self.backend_client.post("/api/v1/knowledge-bases", kb_config)
            
            logger.info(f"Created knowledge base: {name} ({kb_id})")
            return kb_id
            
        except Exception as e:
            logger.error(f"Failed to create knowledge base: {e}")
            raise
    
    async def list_knowledge_bases(
        self,
        user_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict:
        """
        获取知识库列表
        
        Args:
            user_id: 用户ID（可选）
            limit: 返回数量
            offset: 偏移量
            
        Returns:
            知识库列表和总数
        """
        try:
            # 从Backend获取知识库列表
            params = {"limit": limit, "offset": offset}
            if user_id:
                params["user_id"] = user_id
            
            response = await self.backend_client.get("/api/v1/knowledge-bases", params=params)
            return response.get("data", {"items": [], "total": 0})
            
        except Exception as e:
            logger.error(f"Failed to list knowledge bases: {e}")
            # 如果Backend不可用，返回空列表
            return {"items": [], "total": 0}
    
    async def get_knowledge_base(self, kb_id: str) -> Optional[Dict]:
        """
        获取知识库详情
        
        Args:
            kb_id: 知识库ID
            
        Returns:
            知识库信息
        """
        try:
            response = await self.backend_client.get(f"/api/v1/knowledge-bases/{kb_id}")
            return response.get("data")
        except Exception as e:
            logger.error(f"Failed to get knowledge base {kb_id}: {e}")
            return None
    
    async def update_knowledge_base(
        self,
        kb_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None
    ) -> bool:
        """
        更新知识库
        
        Args:
            kb_id: 知识库ID
            name: 新名称
            description: 新描述
            
        Returns:
            是否成功
        """
        try:
            update_data = {}
            if name:
                update_data["name"] = name
            if description:
                update_data["description"] = description
            
            await self.backend_client.patch(f"/api/v1/knowledge-bases/{kb_id}", update_data)
            return True
        except Exception as e:
            logger.error(f"Failed to update knowledge base {kb_id}: {e}")
            return False
    
    async def delete_knowledge_base(self, kb_id: str) -> bool:
        """
        删除知识库
        
        Args:
            kb_id: 知识库ID
            
        Returns:
            是否成功
        """
        try:
            # 删除Chroma collection
            self.chroma_client.delete_collection(kb_id)
            
            # 从Backend删除
            await self.backend_client.delete(f"/api/v1/knowledge-bases/{kb_id}")
            
            logger.info(f"Deleted knowledge base: {kb_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete knowledge base {kb_id}: {e}")
            return False
    
    async def add_document(
        self,
        kb_id: str,
        file_path: str,
        chunk_size: int = None,
        chunk_overlap: int = None
    ) -> str:
        """
        添加文档到知识库
        
        Args:
            kb_id: 知识库ID
            file_path: 文件路径
            chunk_size: 分块大小
            chunk_overlap: 分块重叠
            
        Returns:
            文档ID
        """
        doc_id = str(uuid.uuid4())
        path = Path(file_path)
        
        try:
            logger.info(f"Adding document {path.name} to knowledge base {kb_id}")
            
            # 1. 解析文档
            content = await self.document_parser.parse(file_path)
            
            # 2. 分块
            chunks = self._chunk_text(
                content,
                chunk_size=chunk_size or settings.chunk_size,
                overlap=chunk_overlap or settings.chunk_overlap
            )
            
            logger.info(f"Document split into {len(chunks)} chunks")
            
            # 3. 向量化（批量处理，优化性能）
            embeddings = await self.embedding_service.embed_batch(
                chunks,
                batch_size=100  # 每批100个文本块
            )
            
            # 4. 存储到Chroma（批量操作）
            chunk_ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
            metadatas = [
                {
                    "doc_id": doc_id,
                    "chunk_index": i,
                    "doc_name": path.name
                }
                for i in range(len(chunks))
            ]
            
            self.chroma_client.add_documents(
                collection_name=kb_id,
                documents=chunks,
                embeddings=embeddings,
                metadatas=metadatas,
                ids=chunk_ids,
                batch_size=1000  # 批量添加，优化大文档处理
            )
            
            # 5. 保存文档信息到Backend
            doc_info = {
                "id": doc_id,
                "knowledge_base_id": kb_id,
                "name": path.name,
                "file_path": file_path,
                "file_type": path.suffix,
                "file_size": path.stat().st_size,
                "status": "completed",
                "chunk_count": len(chunks)
            }
            
            await self.backend_client.post(
                f"/api/v1/knowledge-bases/{kb_id}/documents",
                doc_info
            )
            
            logger.info(f"Document {path.name} added successfully ({doc_id})")
            return doc_id
            
        except Exception as e:
            logger.error(f"Failed to add document: {e}")
            # 更新文档状态为失败
            try:
                await self.backend_client.patch(
                    f"/api/v1/documents/{doc_id}",
                    {"status": "failed", "error_message": str(e)}
                )
            except:
                pass
            raise
    
    def _chunk_text(
        self,
        text: str,
        chunk_size: int,
        overlap: int
    ) -> List[str]:
        """
        文本分块
        
        Args:
            text: 文本内容
            chunk_size: 分块大小
            overlap: 分块重叠
            
        Returns:
            文本块列表
        """
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            
            # 确保不在单词中间切断（对于英文）
            if end < len(text) and not text[end].isspace():
                # 向后查找空格
                space_pos = chunk.rfind(' ')
                if space_pos > chunk_size * 0.8:  # 至少保留80%
                    chunk = chunk[:space_pos]
                    end = start + space_pos
            
            chunks.append(chunk.strip())
            start = end - overlap
        
        return [c for c in chunks if c]  # 过滤空块

    
    async def search(
        self,
        kb_id: str,
        query: str,
        top_k: int = 5,
        min_similarity: float = 0.7
    ) -> List[SearchResult]:
        """
        向量检索
        
        Args:
            kb_id: 知识库ID
            query: 查询文本
            top_k: 返回结果数量
            min_similarity: 最小相似度阈值
            
        Returns:
            检索结果列表
        """
        try:
            # 1. 向量化查询
            query_embedding = await self.embedding_service.embed(query)
            
            # 2. 检索
            results = self.chroma_client.query(
                collection_name=kb_id,
                query_embeddings=[query_embedding],
                n_results=top_k
            )
            
            # 3. 处理结果
            search_results = []
            
            if results and results['documents'] and results['documents'][0]:
                for i, doc in enumerate(results['documents'][0]):
                    distance = results['distances'][0][i]
                    similarity = 1 - distance  # 余弦距离转相似度
                    
                    # 过滤低相似度结果
                    if similarity < min_similarity:
                        continue
                    
                    metadata = results['metadatas'][0][i]
                    
                    search_results.append(SearchResult(
                        content=doc,
                        similarity=similarity,
                        document_name=metadata.get('doc_name', 'Unknown'),
                        metadata=metadata
                    ))
            
            logger.info(f"Search in {kb_id} returned {len(search_results)} results")
            return search_results
            
        except Exception as e:
            logger.error(f"Failed to search in knowledge base {kb_id}: {e}")
            raise
    
    async def delete_document(self, kb_id: str, doc_id: str):
        """
        删除文档
        
        Args:
            kb_id: 知识库ID
            doc_id: 文档ID
        """
        try:
            # 获取文档的所有chunk IDs
            collection = self.chroma_client.get_collection(kb_id)
            results = collection.get(
                where={"doc_id": doc_id}
            )
            
            if results and results['ids']:
                # 删除所有chunks
                self.chroma_client.delete_documents(
                    collection_name=kb_id,
                    ids=results['ids']
                )
            
            # 从Backend删除文档记录
            await self.backend_client.delete(f"/api/v1/documents/{doc_id}")
            
            logger.info(f"Deleted document {doc_id} from knowledge base {kb_id}")
            
        except Exception as e:
            logger.error(f"Failed to delete document: {e}")
            raise
    
    async def delete_knowledge_base(self, kb_id: str):
        """
        删除知识库
        
        Args:
            kb_id: 知识库ID
        """
        try:
            # 删除Chroma collection
            self.chroma_client.delete_collection(kb_id)
            
            # 从Backend删除记录
            await self.backend_client.delete(f"/api/v1/knowledge-bases/{kb_id}")
            
            logger.info(f"Deleted knowledge base {kb_id}")
            
        except Exception as e:
            logger.error(f"Failed to delete knowledge base: {e}")
            raise
    
    async def get_knowledge_base_stats(self, kb_id: str) -> Dict:
        """
        获取知识库统计信息
        
        Args:
            kb_id: 知识库ID
            
        Returns:
            统计信息
        """
        try:
            vector_count = self.chroma_client.get_collection_count(kb_id)
            
            # 从Backend获取文档数量
            response = await self.backend_client.get(
                f"/api/v1/knowledge-bases/{kb_id}"
            )
            
            return {
                "vector_count": vector_count,
                "document_count": response.get("document_count", 0),
                **response
            }
            
        except Exception as e:
            logger.error(f"Failed to get stats for knowledge base {kb_id}: {e}")
            raise

    
    async def keyword_search(
        self,
        kb_id: str,
        query: str,
        top_k: int = 5
    ) -> List[SearchResult]:
        """
        关键词检索（简单实现）
        
        Args:
            kb_id: 知识库ID
            query: 查询文本
            top_k: 返回结果数量
            
        Returns:
            检索结果列表
        """
        try:
            collection = self.chroma_client.get_collection(kb_id)
            
            # 使用Chroma的where_document进行简单的文本匹配
            results = collection.get(
                where_document={"$contains": query},
                limit=top_k
            )
            
            search_results = []
            if results and results['documents']:
                for i, doc in enumerate(results['documents']):
                    metadata = results['metadatas'][i] if results['metadatas'] else {}
                    
                    search_results.append(SearchResult(
                        content=doc,
                        similarity=0.8,  # 关键词匹配给固定分数
                        document_name=metadata.get('doc_name', 'Unknown'),
                        metadata=metadata
                    ))
            
            logger.info(f"Keyword search in {kb_id} returned {len(search_results)} results")
            return search_results
            
        except Exception as e:
            logger.warning(f"Keyword search failed, falling back to vector search: {e}")
            # 降级到向量检索
            return await self.search(kb_id, query, top_k)
    
    async def hybrid_search(
        self,
        kb_id: str,
        query: str,
        top_k: int = 10,
        final_k: int = 5
    ) -> List[SearchResult]:
        """
        混合检索（向量+关键词）
        
        Args:
            kb_id: 知识库ID
            query: 查询文本
            top_k: 每种检索方式的结果数量
            final_k: 最终返回结果数量
            
        Returns:
            检索结果列表
        """
        try:
            # 1. 向量检索
            vector_results = await self.search(kb_id, query, top_k, min_similarity=0.6)
            
            # 2. 关键词检索
            keyword_results = await self.keyword_search(kb_id, query, top_k)
            
            # 3. 合并结果（使用RRF - Reciprocal Rank Fusion）
            merged_results = self._merge_results_rrf(
                vector_results,
                keyword_results,
                k=60  # RRF参数
            )
            
            # 4. 返回top final_k
            return merged_results[:final_k]
            
        except Exception as e:
            logger.error(f"Hybrid search failed: {e}")
            # 降级到向量检索
            return await self.search(kb_id, query, final_k)
    
    def _merge_results_rrf(
        self,
        vector_results: List[SearchResult],
        keyword_results: List[SearchResult],
        k: int = 60
    ) -> List[SearchResult]:
        """
        使用RRF算法合并检索结果
        
        Args:
            vector_results: 向量检索结果
            keyword_results: 关键词检索结果
            k: RRF参数
            
        Returns:
            合并后的结果
        """
        # 创建结果字典（使用content作为key去重）
        results_dict = {}
        
        # 处理向量检索结果
        for rank, result in enumerate(vector_results):
            key = result.content[:100]  # 使用前100字符作为key
            if key not in results_dict:
                results_dict[key] = result
                results_dict[key].similarity = 0
            
            # RRF分数
            results_dict[key].similarity += 1 / (rank + k)
        
        # 处理关键词检索结果
        for rank, result in enumerate(keyword_results):
            key = result.content[:100]
            if key not in results_dict:
                results_dict[key] = result
                results_dict[key].similarity = 0
            
            # RRF分数
            results_dict[key].similarity += 1 / (rank + k)
        
        # 按分数排序
        merged_results = sorted(
            results_dict.values(),
            key=lambda x: x.similarity,
            reverse=True
        )
        
        return merged_results
