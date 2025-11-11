"""
Embedding服务
"""
from typing import List
from openai import AsyncOpenAI

from config import settings
from logger import get_logger
from core.service.rate_limiter import get_embedding_rate_limiter

logger = get_logger("embedding")


class EmbeddingService:
    """Embedding服务"""
    
    def __init__(self, api_key: str = None, model: str = None, use_rate_limiter: bool = True):
        """
        初始化Embedding服务
        
        Args:
            api_key: OpenAI API Key
            model: Embedding模型名称
            use_rate_limiter: 是否使用速率限制器
        """
        self.api_key = api_key or settings.openai_api_key
        self.model = model or settings.embedding_model
        
        # 速率限制器
        self.use_rate_limiter = use_rate_limiter
        if use_rate_limiter:
            self.rate_limiter = get_embedding_rate_limiter(10)  # Embedding可以有更高的并发
        else:
            self.rate_limiter = None
        
        # 创建OpenAI客户端，使用自定义httpx客户端以避免代理问题
        import httpx
        http_client = httpx.AsyncClient(trust_env=False)
        
        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url=settings.openai_base_url,
            http_client=http_client
        )
        
        logger.info(f"Initialized Embedding service with model {self.model}")
    
    async def embed(self, text: str) -> List[float]:
        """
        生成单个文本的向量
        
        Args:
            text: 文本内容
            
        Returns:
            向量
        """
        if self.rate_limiter:
            return await self.rate_limiter.execute(self._embed_impl, text)
        else:
            return await self._embed_impl(text)
    
    async def _embed_impl(self, text: str) -> List[float]:
        """
        生成单个文本的向量（内部实现）
        
        Args:
            text: 文本内容
            
        Returns:
            向量
        """
        try:
            response = await self.client.embeddings.create(
                model=self.model,
                input=text
            )
            
            embedding = response.data[0].embedding
            logger.debug(f"Generated embedding for text (length: {len(text)})")
            return embedding
            
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise
    
    async def embed_batch(
        self,
        texts: List[str],
        batch_size: int = 100
    ) -> List[List[float]]:
        """
        批量生成向量（优化版本，支持并发）
        
        Args:
            texts: 文本列表
            batch_size: 批次大小
            
        Returns:
            向量列表
        """
        if self.rate_limiter:
            return await self.rate_limiter.execute(self._embed_batch_impl, texts, batch_size)
        else:
            return await self._embed_batch_impl(texts, batch_size)
    
    async def _embed_batch_impl(
        self,
        texts: List[str],
        batch_size: int = 100
    ) -> List[List[float]]:
        """
        批量生成向量（内部实现）
        
        Args:
            texts: 文本列表
            batch_size: 批次大小
            
        Returns:
            向量列表
        """
        embeddings = []
        
        try:
            # 分批处理
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i+batch_size]
                
                response = await self.client.embeddings.create(
                    model=self.model,
                    input=batch
                )
                
                batch_embeddings = [item.embedding for item in response.data]
                embeddings.extend(batch_embeddings)
                
                logger.info(f"Generated embeddings for batch {i//batch_size + 1}, size: {len(batch)}")
            
            logger.info(f"Generated {len(embeddings)} embeddings in total")
            return embeddings
            
        except Exception as e:
            logger.error(f"Failed to generate batch embeddings: {e}")
            raise
    
    def get_dimensions(self) -> int:
        """
        获取向量维度
        
        Returns:
            向量维度
        """
        return settings.embedding_dimensions
