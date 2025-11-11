"""
Chroma向量数据库客户端
"""
import chromadb
from chromadb.config import Settings as ChromaSettings
from pathlib import Path
from typing import List, Dict, Optional
import uuid

from config import settings
from logger import get_logger

logger = get_logger("chroma")


def init_chroma() -> chromadb.PersistentClient:
    """
    初始化Chroma数据库
    
    Returns:
        Chroma客户端实例
    """
    # 创建数据目录
    data_dir = Path(settings.chroma_data_dir)
    data_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"Initializing Chroma database at {data_dir}")
    
    # 创建持久化客户端
    client = chromadb.PersistentClient(
        path=str(data_dir),
        settings=ChromaSettings(
            anonymized_telemetry=False,
            allow_reset=True
        )
    )
    
    logger.info("Chroma database initialized successfully")
    return client


class ChromaClient:
    """Chroma客户端封装"""
    
    def __init__(self):
        """初始化客户端"""
        self.client = init_chroma()
        logger.info("ChromaClient initialized")
    
    def create_collection(
        self,
        name: str,
        metadata: Optional[Dict] = None,
        use_hnsw: bool = True
    ) -> chromadb.Collection:
        """
        创建集合（优化版本，使用HNSW索引）
        
        Args:
            name: 集合名称
            metadata: 元数据
            use_hnsw: 是否使用HNSW索引（默认True，性能更好）
            
        Returns:
            集合对象
        """
        try:
            # 合并元数据，添加HNSW配置
            collection_metadata = metadata or {}
            
            if use_hnsw:
                # HNSW索引配置，优化检索性能
                collection_metadata.update({
                    "hnsw:space": "cosine",  # 使用余弦相似度
                    "hnsw:construction_ef": 200,  # 构建时的搜索范围（越大越精确但越慢）
                    "hnsw:search_ef": 100,  # 搜索时的范围（越大越精确但越慢）
                    "hnsw:M": 16  # 每个节点的连接数（越大越精确但占用更多内存）
                })
                logger.info(f"Creating collection {name} with HNSW index optimization")
            
            collection = self.client.create_collection(
                name=name,
                metadata=collection_metadata,
                embedding_function=None  # 我们自己处理embedding
            )
            logger.info(f"Created collection: {name}")
            return collection
        except Exception as e:
            logger.error(f"Failed to create collection {name}: {e}")
            raise
    
    def get_collection(self, name: str) -> chromadb.Collection:
        """
        获取集合
        
        Args:
            name: 集合名称
            
        Returns:
            集合对象
        """
        try:
            collection = self.client.get_collection(name=name)
            return collection
        except Exception as e:
            logger.error(f"Failed to get collection {name}: {e}")
            raise
    
    def get_or_create_collection(
        self,
        name: str,
        metadata: Optional[Dict] = None,
        use_hnsw: bool = True
    ) -> chromadb.Collection:
        """
        获取或创建集合（优化版本）
        
        Args:
            name: 集合名称
            metadata: 元数据
            use_hnsw: 是否使用HNSW索引
            
        Returns:
            集合对象
        """
        try:
            # 合并元数据，添加HNSW配置
            collection_metadata = metadata or {}
            
            if use_hnsw:
                collection_metadata.update({
                    "hnsw:space": "cosine",
                    "hnsw:construction_ef": 200,
                    "hnsw:search_ef": 100,
                    "hnsw:M": 16
                })
            
            collection = self.client.get_or_create_collection(
                name=name,
                metadata=collection_metadata,
                embedding_function=None
            )
            return collection
        except Exception as e:
            logger.error(f"Failed to get or create collection {name}: {e}")
            raise
    
    def delete_collection(self, name: str):
        """
        删除集合
        
        Args:
            name: 集合名称
        """
        try:
            self.client.delete_collection(name=name)
            logger.info(f"Deleted collection: {name}")
        except Exception as e:
            logger.error(f"Failed to delete collection {name}: {e}")
            raise
    
    def list_collections(self) -> List[chromadb.Collection]:
        """
        列出所有集合
        
        Returns:
            集合列表
        """
        try:
            collections = self.client.list_collections()
            return collections
        except Exception as e:
            logger.error(f"Failed to list collections: {e}")
            raise
    
    def add_documents(
        self,
        collection_name: str,
        documents: List[str],
        embeddings: List[List[float]],
        metadatas: Optional[List[Dict]] = None,
        ids: Optional[List[str]] = None,
        batch_size: int = 1000
    ):
        """
        添加文档到集合（优化版本，支持批量操作）
        
        Args:
            collection_name: 集合名称
            documents: 文档内容列表
            embeddings: 向量列表
            metadatas: 元数据列表
            ids: 文档ID列表
            batch_size: 批次大小（默认1000，避免单次操作过大）
        """
        try:
            collection = self.get_collection(collection_name)
            
            # 生成ID（如果未提供）
            if ids is None:
                ids = [str(uuid.uuid4()) for _ in documents]
            
            # 确保元数据列表长度正确
            if metadatas is None:
                metadatas = [{}] * len(documents)
            
            # 分批添加文档（优化大批量操作）
            total_added = 0
            for i in range(0, len(documents), batch_size):
                batch_end = min(i + batch_size, len(documents))
                
                collection.add(
                    ids=ids[i:batch_end],
                    embeddings=embeddings[i:batch_end],
                    documents=documents[i:batch_end],
                    metadatas=metadatas[i:batch_end]
                )
                
                total_added += (batch_end - i)
                logger.debug(f"Added batch {i//batch_size + 1}, total: {total_added}/{len(documents)}")
            
            logger.info(f"Added {len(documents)} documents to collection {collection_name}")
        except Exception as e:
            logger.error(f"Failed to add documents to {collection_name}: {e}")
            raise
    
    def query(
        self,
        collection_name: str,
        query_embeddings: List[List[float]],
        n_results: int = 5,
        where: Optional[Dict] = None,
        where_document: Optional[Dict] = None
    ) -> Dict:
        """
        查询集合
        
        Args:
            collection_name: 集合名称
            query_embeddings: 查询向量列表
            n_results: 返回结果数量
            where: 元数据过滤条件
            where_document: 文档内容过滤条件
            
        Returns:
            查询结果
        """
        try:
            collection = self.get_collection(collection_name)
            
            results = collection.query(
                query_embeddings=query_embeddings,
                n_results=n_results,
                where=where,
                where_document=where_document
            )
            
            logger.info(f"Queried collection {collection_name}, found {len(results['ids'][0])} results")
            return results
        except Exception as e:
            logger.error(f"Failed to query collection {collection_name}: {e}")
            raise
    
    def delete_documents(
        self,
        collection_name: str,
        ids: List[str]
    ):
        """
        删除文档
        
        Args:
            collection_name: 集合名称
            ids: 文档ID列表
        """
        try:
            collection = self.get_collection(collection_name)
            collection.delete(ids=ids)
            logger.info(f"Deleted {len(ids)} documents from collection {collection_name}")
        except Exception as e:
            logger.error(f"Failed to delete documents from {collection_name}: {e}")
            raise
    
    def get_collection_count(self, collection_name: str) -> int:
        """
        获取集合中的文档数量
        
        Args:
            collection_name: 集合名称
            
        Returns:
            文档数量
        """
        try:
            collection = self.get_collection(collection_name)
            return collection.count()
        except Exception as e:
            logger.error(f"Failed to get count for collection {collection_name}: {e}")
            raise
    
    def reset(self):
        """重置数据库（仅用于测试）"""
        try:
            self.client.reset()
            logger.warning("Chroma database has been reset")
        except Exception as e:
            logger.error(f"Failed to reset database: {e}")
            raise


# 全局客户端实例
_chroma_client: Optional[ChromaClient] = None


def get_chroma_client() -> ChromaClient:
    """
    获取全局Chroma客户端实例
    
    Returns:
        ChromaClient实例
    """
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = ChromaClient()
    return _chroma_client
