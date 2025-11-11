"""
内存优化服务 - 定期清理过期数据和优化内存使用
"""
import asyncio
import time
from datetime import datetime, timedelta
from typing import Optional

from logger import get_logger

logger = get_logger("memory_optimizer")


class MemoryOptimizer:
    """内存优化器"""
    
    def __init__(
        self,
        cleanup_interval: int = 300,  # 5分钟
        max_idle_time: int = 1800,  # 30分钟
        enable_auto_cleanup: bool = True
    ):
        """
        初始化内存优化器
        
        Args:
            cleanup_interval: 清理间隔（秒）
            max_idle_time: 最大空闲时间（秒）
            enable_auto_cleanup: 是否启用自动清理
        """
        self.cleanup_interval = cleanup_interval
        self.max_idle_time = max_idle_time
        self.enable_auto_cleanup = enable_auto_cleanup
        self.last_cleanup = time.time()
        self.cleanup_task: Optional[asyncio.Task] = None
        self.is_running = False
        
        logger.info(
            f"Initialized MemoryOptimizer with "
            f"cleanup_interval={cleanup_interval}s, "
            f"max_idle_time={max_idle_time}s"
        )
    
    async def start(self):
        """启动自动清理任务"""
        if not self.enable_auto_cleanup:
            logger.info("Auto cleanup is disabled")
            return
        
        if self.is_running:
            logger.warning("Memory optimizer is already running")
            return
        
        self.is_running = True
        self.cleanup_task = asyncio.create_task(self._cleanup_loop())
        logger.info("Memory optimizer started")
    
    async def stop(self):
        """停止自动清理任务"""
        if not self.is_running:
            return
        
        self.is_running = False
        if self.cleanup_task:
            self.cleanup_task.cancel()
            try:
                await self.cleanup_task
            except asyncio.CancelledError:
                pass
        
        logger.info("Memory optimizer stopped")
    
    async def _cleanup_loop(self):
        """清理循环"""
        while self.is_running:
            try:
                await asyncio.sleep(self.cleanup_interval)
                await self.cleanup()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in cleanup loop: {e}")
    
    async def cleanup(self):
        """执行清理"""
        start_time = time.time()
        logger.info("Starting memory cleanup...")
        
        try:
            # 1. 清理短期记忆中的过期会话
            await self._cleanup_short_term_memory()
            
            # 2. 清理工作记忆中的过期会话
            await self._cleanup_working_memory()
            
            # 3. 清理LLM缓存中的过期项
            await self._cleanup_llm_cache()
            
            # 4. 强制垃圾回收（可选）
            await self._force_gc()
            
            elapsed = time.time() - start_time
            self.last_cleanup = time.time()
            
            logger.info(f"Memory cleanup completed in {elapsed:.2f}s")
            
        except Exception as e:
            logger.error(f"Failed to cleanup memory: {e}")
    
    async def _cleanup_short_term_memory(self):
        """清理短期记忆"""
        try:
            from core.service.memory import ShortTermMemory
            
            # 获取全局短期记忆实例
            # 注意：这里需要访问全局实例，实际实现中可能需要依赖注入
            logger.debug("Cleaning up short-term memory...")
            
            # 短期记忆使用LRU缓存，会自动清理，这里只记录统计信息
            # 实际清理由LRUCache自动完成
            
        except Exception as e:
            logger.error(f"Failed to cleanup short-term memory: {e}")
    
    async def _cleanup_working_memory(self):
        """清理工作记忆"""
        try:
            from core.service.memory import WorkingMemory
            
            logger.debug("Cleaning up working memory...")
            
            # 工作记忆中的过期会话会在会话结束时清理
            # 这里可以添加额外的清理逻辑
            
        except Exception as e:
            logger.error(f"Failed to cleanup working memory: {e}")
    
    async def _cleanup_llm_cache(self):
        """清理LLM缓存"""
        try:
            from core.service.llm import get_llm_cache
            
            cache = get_llm_cache()
            
            # LLM缓存使用LRU策略，会自动清理
            # 这里可以获取统计信息
            stats = cache.get_stats()
            logger.debug(f"LLM cache stats: {stats}")
            
            # 如果缓存使用率过高，可以手动清理一部分
            if stats['size'] > stats['max_size'] * 0.9:
                logger.info("LLM cache is nearly full, consider increasing cache size")
            
        except Exception as e:
            logger.error(f"Failed to cleanup LLM cache: {e}")
    
    async def _force_gc(self):
        """强制垃圾回收"""
        try:
            import gc
            
            # 执行垃圾回收
            collected = gc.collect()
            logger.debug(f"Garbage collection: collected {collected} objects")
            
        except Exception as e:
            logger.error(f"Failed to force garbage collection: {e}")
    
    def get_stats(self) -> dict:
        """获取统计信息"""
        return {
            "is_running": self.is_running,
            "cleanup_interval": self.cleanup_interval,
            "max_idle_time": self.max_idle_time,
            "last_cleanup": datetime.fromtimestamp(self.last_cleanup).isoformat(),
            "time_since_last_cleanup": time.time() - self.last_cleanup
        }


class MemoryMonitor:
    """内存监控器"""
    
    def __init__(self):
        """初始化内存监控器"""
        self.start_time = time.time()
        logger.info("Initialized MemoryMonitor")
    
    def get_memory_usage(self) -> dict:
        """
        获取内存使用情况
        
        Returns:
            内存使用统计
        """
        try:
            import psutil
            import os
            
            process = psutil.Process(os.getpid())
            memory_info = process.memory_info()
            
            return {
                "rss_mb": memory_info.rss / 1024 / 1024,  # 物理内存
                "vms_mb": memory_info.vms / 1024 / 1024,  # 虚拟内存
                "percent": process.memory_percent(),
                "uptime_seconds": time.time() - self.start_time
            }
        except ImportError:
            # psutil未安装，返回基本信息
            import sys
            return {
                "python_version": sys.version,
                "uptime_seconds": time.time() - self.start_time
            }
        except Exception as e:
            logger.error(f"Failed to get memory usage: {e}")
            return {}
    
    def check_memory_threshold(self, threshold_mb: float = 1000) -> bool:
        """
        检查内存使用是否超过阈值
        
        Args:
            threshold_mb: 阈值（MB）
            
        Returns:
            是否超过阈值
        """
        try:
            usage = self.get_memory_usage()
            rss_mb = usage.get("rss_mb", 0)
            
            if rss_mb > threshold_mb:
                logger.warning(
                    f"Memory usage ({rss_mb:.2f}MB) exceeds threshold ({threshold_mb}MB)"
                )
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to check memory threshold: {e}")
            return False
    
    def log_memory_stats(self):
        """记录内存统计信息"""
        try:
            usage = self.get_memory_usage()
            logger.info(f"Memory usage: {usage}")
        except Exception as e:
            logger.error(f"Failed to log memory stats: {e}")


# 全局实例
_memory_optimizer: Optional[MemoryOptimizer] = None
_memory_monitor: Optional[MemoryMonitor] = None


def get_memory_optimizer() -> MemoryOptimizer:
    """
    获取全局内存优化器实例
    
    Returns:
        MemoryOptimizer实例
    """
    global _memory_optimizer
    if _memory_optimizer is None:
        _memory_optimizer = MemoryOptimizer()
    return _memory_optimizer


def get_memory_monitor() -> MemoryMonitor:
    """
    获取全局内存监控器实例
    
    Returns:
        MemoryMonitor实例
    """
    global _memory_monitor
    if _memory_monitor is None:
        _memory_monitor = MemoryMonitor()
    return _memory_monitor
