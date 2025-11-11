"""
性能优化使用示例

展示如何使用速率限制、内存优化和向量检索优化
"""
import asyncio
from typing import List

from core.service.rate_limiter import get_llm_rate_limiter, get_embedding_rate_limiter
from core.service.memory_optimizer import get_memory_optimizer, get_memory_monitor
from core.service.llm import LLMService
from core.service.embedding import EmbeddingService
from core.service.knowledge_base import KnowledgeBaseService
from core.service.memory import MemoryService
from models.agent import ModelConfig
from config import settings
from logger import get_logger

logger = get_logger("performance_example")


async def example_rate_limited_llm_calls():
    """示例：使用速率限制的LLM调用"""
    logger.info("=== Rate Limited LLM Calls Example ===")
    
    # 创建LLM服务（自动使用速率限制）
    # API Key 从环境变量读取，不需要在配置中指定
    config = ModelConfig(
        provider="openai",
        model="gpt-3.5-turbo",
        temperature=0.7
    )
    llm_service = LLMService(config, use_rate_limiter=True)
    
    # 并发发送多个请求（会被速率限制器控制）
    async def make_request(i: int):
        messages = [{"role": "user", "content": f"Hello {i}"}]
        response = await llm_service.chat(messages)
        logger.info(f"Request {i} completed: {response[:50]}...")
        return response
    
    # 发送10个并发请求，但只有5个会同时执行
    tasks = [make_request(i) for i in range(10)]
    responses = await asyncio.gather(*tasks)
    
    # 查看速率限制器统计
    rate_limiter = get_llm_rate_limiter()
    stats = rate_limiter.get_stats()
    logger.info(f"Rate limiter stats: {stats}")
    
    return responses


async def example_optimized_vector_search():
    """示例：优化的向量检索"""
    logger.info("=== Optimized Vector Search Example ===")
    
    kb_service = KnowledgeBaseService()
    
    # 创建知识库（自动使用HNSW索引）
    kb_id = await kb_service.create_knowledge_base(
        name="Test KB",
        description="Test knowledge base with HNSW optimization",
        user_id="test_user"
    )
    
    logger.info(f"Created knowledge base with HNSW index: {kb_id}")
    
    # 添加文档（使用批量向量化）
    # await kb_service.add_document(kb_id, "path/to/document.pdf")
    
    # 执行检索（HNSW索引会加速检索）
    results = await kb_service.search(
        kb_id=kb_id,
        query="test query",
        top_k=5
    )
    
    logger.info(f"Search completed, found {len(results)} results")
    
    return results


async def example_memory_optimization():
    """示例：内存优化"""
    logger.info("=== Memory Optimization Example ===")
    
    # 获取内存监控器
    monitor = get_memory_monitor()
    
    # 记录初始内存使用
    initial_usage = monitor.get_memory_usage()
    logger.info(f"Initial memory usage: {initial_usage}")
    
    # 创建记忆服务
    memory_service = MemoryService()
    
    # 添加一些测试数据
    for i in range(100):
        await memory_service.short_term.add_message(
            conversation_id=f"conv_{i}",
            role="user",
            content=f"Test message {i}"
        )
    
    # 查看记忆统计
    stats = memory_service.get_stats()
    logger.info(f"Memory stats: {stats}")
    
    # 清理空闲记忆
    await memory_service.cleanup_idle_memories(max_idle_minutes=0)  # 立即清理
    
    # 查看清理后的统计
    stats_after = memory_service.get_stats()
    logger.info(f"Memory stats after cleanup: {stats_after}")
    
    # 记录最终内存使用
    final_usage = monitor.get_memory_usage()
    logger.info(f"Final memory usage: {final_usage}")
    
    return stats_after


async def example_auto_memory_cleanup():
    """示例：自动内存清理"""
    logger.info("=== Auto Memory Cleanup Example ===")
    
    # 获取内存优化器
    optimizer = get_memory_optimizer()
    
    # 启动自动清理
    await optimizer.start()
    
    logger.info("Memory optimizer started, will cleanup every 5 minutes")
    
    # 模拟运行一段时间
    await asyncio.sleep(10)
    
    # 手动触发清理
    await optimizer.cleanup()
    
    # 查看统计
    stats = optimizer.get_stats()
    logger.info(f"Optimizer stats: {stats}")
    
    # 停止自动清理
    await optimizer.stop()
    
    return stats


async def example_batch_embedding():
    """示例：批量向量化"""
    logger.info("=== Batch Embedding Example ===")
    
    embedding_service = EmbeddingService(use_rate_limiter=True)
    
    # 准备大量文本
    texts = [f"This is test text number {i}" for i in range(500)]
    
    # 批量向量化（自动分批处理，使用速率限制）
    embeddings = await embedding_service.embed_batch(
        texts,
        batch_size=100  # 每批100个
    )
    
    logger.info(f"Generated {len(embeddings)} embeddings")
    
    # 查看速率限制器统计
    rate_limiter = get_embedding_rate_limiter()
    stats = rate_limiter.get_stats()
    logger.info(f"Embedding rate limiter stats: {stats}")
    
    return embeddings


async def run_all_examples():
    """运行所有示例"""
    logger.info("Starting performance optimization examples...")
    
    try:
        # 1. 速率限制示例
        # await example_rate_limited_llm_calls()
        
        # 2. 向量检索优化示例
        # await example_optimized_vector_search()
        
        # 3. 内存优化示例
        await example_memory_optimization()
        
        # 4. 自动内存清理示例
        # await example_auto_memory_cleanup()
        
        # 5. 批量向量化示例
        # await example_batch_embedding()
        
        logger.info("All examples completed successfully!")
        
    except Exception as e:
        logger.error(f"Error running examples: {e}")
        raise


if __name__ == "__main__":
    # 运行示例
    asyncio.run(run_all_examples())
