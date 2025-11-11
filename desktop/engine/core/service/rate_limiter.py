"""
并发控制和速率限制
"""
import asyncio
import time
from typing import Callable, Any, Optional
from collections import deque

from logger import get_logger

logger = get_logger("rate_limiter")


class RateLimiter:
    """并发控制器"""
    
    def __init__(self, max_concurrent: int = 5):
        """
        初始化并发控制器
        
        Args:
            max_concurrent: 最大并发数
        """
        self.max_concurrent = max_concurrent
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.active_count = 0
        self.total_executed = 0
        self.total_wait_time = 0.0
        logger.info(f"Initialized RateLimiter with max_concurrent={max_concurrent}")
    
    async def execute(self, func: Callable, *args, **kwargs) -> Any:
        """
        执行函数（受并发限制）
        
        Args:
            func: 异步函数
            *args: 位置参数
            **kwargs: 关键字参数
            
        Returns:
            函数执行结果
        """
        wait_start = time.time()
        
        async with self.semaphore:
            wait_time = time.time() - wait_start
            self.total_wait_time += wait_time
            
            if wait_time > 0.1:  # 等待超过100ms记录日志
                logger.debug(f"Waited {wait_time:.2f}s for rate limiter")
            
            self.active_count += 1
            self.total_executed += 1
            
            try:
                result = await func(*args, **kwargs)
                return result
            finally:
                self.active_count -= 1
    
    def get_stats(self) -> dict:
        """
        获取统计信息
        
        Returns:
            统计信息字典
        """
        return {
            "max_concurrent": self.max_concurrent,
            "active_count": self.active_count,
            "total_executed": self.total_executed,
            "avg_wait_time": (
                self.total_wait_time / self.total_executed 
                if self.total_executed > 0 else 0
            )
        }
    
    async def wait_for_capacity(self):
        """等待直到有可用容量"""
        while self.active_count >= self.max_concurrent:
            await asyncio.sleep(0.1)


class TokenBucketRateLimiter:
    """令牌桶速率限制器"""
    
    def __init__(
        self,
        rate: float,
        capacity: int,
        refill_interval: float = 1.0
    ):
        """
        初始化令牌桶速率限制器
        
        Args:
            rate: 每秒生成的令牌数
            capacity: 桶容量
            refill_interval: 补充令牌的间隔（秒）
        """
        self.rate = rate
        self.capacity = capacity
        self.refill_interval = refill_interval
        self.tokens = capacity
        self.last_refill = time.time()
        self.lock = asyncio.Lock()
        logger.info(
            f"Initialized TokenBucketRateLimiter with "
            f"rate={rate}, capacity={capacity}"
        )
    
    async def acquire(self, tokens: int = 1) -> bool:
        """
        获取令牌
        
        Args:
            tokens: 需要的令牌数
            
        Returns:
            是否成功获取
        """
        async with self.lock:
            await self._refill()
            
            if self.tokens >= tokens:
                self.tokens -= tokens
                return True
            return False
    
    async def wait_for_token(self, tokens: int = 1):
        """
        等待直到获取到令牌
        
        Args:
            tokens: 需要的令牌数
        """
        while not await self.acquire(tokens):
            # 计算需要等待的时间
            wait_time = tokens / self.rate
            await asyncio.sleep(min(wait_time, self.refill_interval))
    
    async def _refill(self):
        """补充令牌"""
        now = time.time()
        elapsed = now - self.last_refill
        
        if elapsed >= self.refill_interval:
            # 计算应该补充的令牌数
            tokens_to_add = int(elapsed * self.rate)
            self.tokens = min(self.capacity, self.tokens + tokens_to_add)
            self.last_refill = now
    
    def get_stats(self) -> dict:
        """获取统计信息"""
        return {
            "rate": self.rate,
            "capacity": self.capacity,
            "current_tokens": self.tokens
        }


class SlidingWindowRateLimiter:
    """滑动窗口速率限制器"""
    
    def __init__(self, max_requests: int, window_seconds: float):
        """
        初始化滑动窗口速率限制器
        
        Args:
            max_requests: 窗口内最大请求数
            window_seconds: 窗口大小（秒）
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = deque()
        self.lock = asyncio.Lock()
        logger.info(
            f"Initialized SlidingWindowRateLimiter with "
            f"max_requests={max_requests}, window={window_seconds}s"
        )
    
    async def acquire(self) -> bool:
        """
        尝试获取请求许可
        
        Returns:
            是否允许请求
        """
        async with self.lock:
            now = time.time()
            
            # 移除窗口外的请求
            while self.requests and self.requests[0] < now - self.window_seconds:
                self.requests.popleft()
            
            # 检查是否超过限制
            if len(self.requests) < self.max_requests:
                self.requests.append(now)
                return True
            return False
    
    async def wait_for_slot(self):
        """等待直到有可用槽位"""
        while not await self.acquire():
            # 计算需要等待的时间
            if self.requests:
                oldest_request = self.requests[0]
                wait_time = (oldest_request + self.window_seconds) - time.time()
                if wait_time > 0:
                    await asyncio.sleep(wait_time + 0.01)  # 稍微多等一点
            else:
                await asyncio.sleep(0.1)
    
    def get_stats(self) -> dict:
        """获取统计信息"""
        now = time.time()
        # 计算当前窗口内的请求数
        recent_requests = sum(
            1 for req_time in self.requests 
            if req_time >= now - self.window_seconds
        )
        
        return {
            "max_requests": self.max_requests,
            "window_seconds": self.window_seconds,
            "current_requests": recent_requests
        }


# 全局速率限制器实例
_llm_rate_limiter: Optional[RateLimiter] = None
_embedding_rate_limiter: Optional[RateLimiter] = None


def get_llm_rate_limiter(max_concurrent: int = 5) -> RateLimiter:
    """
    获取LLM速率限制器
    
    Args:
        max_concurrent: 最大并发数
        
    Returns:
        RateLimiter实例
    """
    global _llm_rate_limiter
    if _llm_rate_limiter is None:
        _llm_rate_limiter = RateLimiter(max_concurrent)
    return _llm_rate_limiter


def get_embedding_rate_limiter(max_concurrent: int = 10) -> RateLimiter:
    """
    获取Embedding速率限制器
    
    Args:
        max_concurrent: 最大并发数
        
    Returns:
        RateLimiter实例
    """
    global _embedding_rate_limiter
    if _embedding_rate_limiter is None:
        _embedding_rate_limiter = RateLimiter(max_concurrent)
    return _embedding_rate_limiter
