"""
LLM服务 - 通过 Go 后台代理调用 LLM
"""
import asyncio
import time
from typing import List, Dict, AsyncIterator, Optional

from models.agent import ModelConfig
from logger import get_logger, log_llm_call
from core.service.rate_limiter import get_llm_rate_limiter

logger = get_logger("llm")


class LLMService:
    """LLM服务，统一封装不同提供商"""
    
    def __init__(self, config: ModelConfig, use_rate_limiter: bool = True, backend_token: str = None):
        """
        初始化LLM服务
        
        Args:
            config: 模型配置（不包含 API Key）
            use_rate_limiter: 是否使用速率限制器
            backend_token: Go 后台的认证 token（用于调用后台 LLM 接口）
        """
        from config import settings
        
        self.config = config
        self.provider = config.provider
        self.model = config.model
        self.temperature = config.temperature
        self.max_tokens = config.max_tokens
        self.top_p = config.top_p
        self.frequency_penalty = config.frequency_penalty
        self.presence_penalty = config.presence_penalty
        self.backend_token = backend_token
        self.backend_url = settings.backend_url
        
        # 速率限制器
        self.use_rate_limiter = use_rate_limiter
        if use_rate_limiter:
            self.rate_limiter = get_llm_rate_limiter(settings.max_concurrent_llm_requests)
        else:
            self.rate_limiter = None
        
        # 不再直接初始化 LLM 客户端，而是通过 Go 后台代理
        logger.info(f"Initialized LLM service with model {self.model}, will use backend proxy at {self.backend_url}")
    
    async def chat_stream(self, messages: List[Dict]) -> AsyncIterator[str]:
        """
        流式对话
        
        Args:
            messages: 消息列表
            
        Yields:
            响应token
        """
        # 使用速率限制器
        if self.rate_limiter:
            async def _stream_with_limiter():
                async for token in self._chat_stream_impl(messages):
                    yield token
            
            async for token in await self.rate_limiter.execute(_stream_with_limiter):
                yield token
        else:
            async for token in self._chat_stream_impl(messages):
                yield token
    
    async def _chat_stream_impl(self, messages: List[Dict]) -> AsyncIterator[str]:
        """
        流式对话实现（内部方法）- 通过 Go 后台代理
        
        Args:
            messages: 消息列表
            
        Yields:
            响应token
        """
        start_time = time.time()
        total_tokens = 0
        error = None
        
        try:
            # 调用 Go 后台的 LLM 代理接口
            import httpx
            
            request_data = {
                "model": self.model,
                "messages": messages,
                "temperature": self.temperature,
                "max_tokens": self.max_tokens,
                "stream": True
            }
            
            headers = {
                "Content-Type": "application/json"
            }
            
            if self.backend_token:
                headers["Authorization"] = f"Bearer {self.backend_token}"
            
            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "POST",
                    f"{self.backend_url}/api/v1/llm/chat",
                    json=request_data,
                    headers=headers,
                    timeout=60.0
                ) as response:
                    response.raise_for_status()
                    
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data = line[6:]  # 移除 "data: " 前缀
                            if data == "[DONE]":
                                break
                            
                            try:
                                import json
                                chunk = json.loads(data)
                                if "choices" in chunk and len(chunk["choices"]) > 0:
                                    delta = chunk["choices"][0].get("delta", {})
                                    content = delta.get("content", "")
                                    if content:
                                        yield content
                                        total_tokens += 1
                            except json.JSONDecodeError:
                                continue
                                
        except Exception as e:
            error = str(e)
            logger.error(f"LLM stream error: {e}")
            raise
        finally:
            latency_ms = int((time.time() - start_time) * 1000)
            log_llm_call(
                provider=self.provider,
                model=self.model,
                tokens=total_tokens,
                latency_ms=latency_ms,
                error=error
            )
    

    
    async def chat(self, messages: List[Dict]) -> str:
        """
        非流式对话
        
        Args:
            messages: 消息列表
            
        Returns:
            完整响应
        """
        # 使用速率限制器
        if self.rate_limiter:
            return await self.rate_limiter.execute(self._chat_impl, messages)
        else:
            return await self._chat_impl(messages)
    
    async def _chat_impl(self, messages: List[Dict]) -> str:
        """
        非流式对话实现（内部方法）
        
        Args:
            messages: 消息列表
            
        Returns:
            完整响应
        """
        response = ""
        async for token in self._chat_stream_impl(messages):
            response += token
        return response
    
    def count_tokens(self, text: str) -> int:
        """
        估算token数量（简单实现）
        
        Args:
            text: 文本
            
        Returns:
            token数量
        """
        # 简单估算：英文约4字符/token，中文约1.5字符/token
        # 这是一个粗略估算，实际应该使用tiktoken库
        chinese_chars = sum(1 for c in text if '\u4e00' <= c <= '\u9fff')
        other_chars = len(text) - chinese_chars
        
        return int(chinese_chars / 1.5 + other_chars / 4)


async def retry_with_backoff(
    func,
    max_retries: int = 3,
    initial_delay: float = 1.0,
    backoff_factor: float = 2.0
):
    """
    指数退避重试
    
    Args:
        func: 异步函数
        max_retries: 最大重试次数
        initial_delay: 初始延迟（秒）
        backoff_factor: 退避因子
        
    Returns:
        函数执行结果
    """
    delay = initial_delay
    
    for attempt in range(max_retries):
        try:
            return await func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            
            logger.warning(f"Attempt {attempt + 1} failed: {e}, retrying in {delay}s")
            await asyncio.sleep(delay)
            delay *= backoff_factor



import hashlib
import json
from cachetools import LRUCache
from config import settings


class LLMCache:
    """LLM响应缓存"""
    
    def __init__(self, max_size: int = None):
        """
        初始化缓存
        
        Args:
            max_size: 最大缓存数量
        """
        self.max_size = max_size or settings.llm_cache_size
        self.cache = LRUCache(maxsize=self.max_size)
        self.ttl = settings.llm_cache_ttl
        logger.info(f"Initialized LLM cache with size {self.max_size}")
    
    def get_cache_key(self, messages: List[Dict], config: Dict = None) -> str:
        """
        生成缓存key
        
        Args:
            messages: 消息列表
            config: 配置参数
            
        Returns:
            缓存key
        """
        # 将消息和配置序列化为JSON
        cache_data = {
            "messages": messages,
            "config": config or {}
        }
        cache_str = json.dumps(cache_data, sort_keys=True)
        
        # 生成MD5哈希
        return hashlib.md5(cache_str.encode()).hexdigest()
    
    def get(self, key: str) -> Optional[str]:
        """
        获取缓存
        
        Args:
            key: 缓存key
            
        Returns:
            缓存的响应，如果不存在返回None
        """
        if key in self.cache:
            logger.debug(f"Cache hit for key {key[:8]}...")
            return self.cache[key]
        logger.debug(f"Cache miss for key {key[:8]}...")
        return None
    
    def set(self, key: str, value: str):
        """
        设置缓存
        
        Args:
            key: 缓存key
            value: 响应内容
        """
        self.cache[key] = value
        logger.debug(f"Cached response for key {key[:8]}...")
    
    async def get_or_call(
        self,
        messages: List[Dict],
        llm_func,
        config: Dict = None
    ) -> str:
        """
        获取缓存或调用LLM
        
        Args:
            messages: 消息列表
            llm_func: LLM调用函数
            config: 配置参数
            
        Returns:
            响应内容
        """
        key = self.get_cache_key(messages, config)
        
        # 尝试从缓存获取
        cached_response = self.get(key)
        if cached_response is not None:
            return cached_response
        
        # 调用LLM
        response = await llm_func(messages)
        
        # 缓存响应
        self.set(key, response)
        
        return response
    
    def clear(self):
        """清空缓存"""
        self.cache.clear()
        logger.info("LLM cache cleared")
    
    def get_stats(self) -> Dict:
        """
        获取缓存统计信息
        
        Returns:
            统计信息
        """
        return {
            "size": len(self.cache),
            "max_size": self.max_size,
            "hit_rate": getattr(self.cache, 'hit_rate', 0)
        }


# 全局缓存实例
_llm_cache: Optional[LLMCache] = None


def get_llm_cache() -> LLMCache:
    """
    获取全局LLM缓存实例
    
    Returns:
        LLMCache实例
    """
    global _llm_cache
    if _llm_cache is None:
        _llm_cache = LLMCache()
    return _llm_cache
