# 性能优化文档

本文档详细说明了Phase 2 Agent系统中实现的性能优化功能。

## 概述

性能优化主要包括三个方面：
1. **并发控制** - 限制并发请求数，避免资源耗尽
2. **向量检索优化** - 使用HNSW索引加速检索
3. **内存优化** - 限制缓存大小，定期清理过期数据

## 1. 并发控制 (Rate Limiting)

### 1.1 RateLimiter

基于信号量的并发控制器，限制同时执行的任务数量。

**特性：**
- 限制最大并发数（默认5个LLM请求）
- 自动排队等待
- 统计信息追踪

**使用示例：**

```python
from core.service.rate_limiter import get_llm_rate_limiter

# 获取LLM速率限制器
rate_limiter = get_llm_rate_limiter(max_concurrent=5)

# 执行受限制的任务
async def my_llm_call():
    # 调用LLM API
    pass

result = await rate_limiter.execute(my_llm_call)

# 查看统计信息
stats = rate_limiter.get_stats()
print(stats)
# {
#     "max_concurrent": 5,
#     "active_count": 2,
#     "total_executed": 100,
#     "avg_wait_time": 0.5
# }
```

### 1.2 TokenBucketRateLimiter

基于令牌桶算法的速率限制器，控制请求速率。

**特性：**
- 平滑的速率控制
- 支持突发流量
- 自动补充令牌

**使用示例：**

```python
from core.service.rate_limiter import TokenBucketRateLimiter

# 创建限制器：每秒10个请求，桶容量20
limiter = TokenBucketRateLimiter(rate=10, capacity=20)

# 等待获取令牌
await limiter.wait_for_token(tokens=1)

# 执行请求
await make_api_call()
```

### 1.3 SlidingWindowRateLimiter

基于滑动窗口的速率限制器，精确控制时间窗口内的请求数。

**特性：**
- 精确的时间窗口控制
- 防止突发流量
- 适合API限流

**使用示例：**

```python
from core.service.rate_limiter import SlidingWindowRateLimiter

# 创建限制器：每分钟最多100个请求
limiter = SlidingWindowRateLimiter(max_requests=100, window_seconds=60)

# 等待获取槽位
await limiter.wait_for_slot()

# 执行请求
await make_api_call()
```

### 1.4 集成到服务

LLM和Embedding服务已自动集成速率限制：

```python
from core.service.llm import LLMService
from models.agent import ModelConfig

# LLM服务自动使用速率限制
config = ModelConfig(provider="openai", model="gpt-3.5-turbo", ...)
llm_service = LLMService(config, use_rate_limiter=True)

# 调用会自动受速率限制
response = await llm_service.chat(messages)
```

## 2. 向量检索优化

### 2.1 HNSW索引

Chroma使用HNSW (Hierarchical Navigable Small World) 索引加速向量检索。

**优化参数：**

```python
{
    "hnsw:space": "cosine",           # 使用余弦相似度
    "hnsw:construction_ef": 200,      # 构建时的搜索范围（越大越精确）
    "hnsw:search_ef": 100,            # 搜索时的范围（越大越精确）
    "hnsw:M": 16                      # 每个节点的连接数（越大越精确）
}
```

**性能提升：**
- 检索速度：从O(n)降低到O(log n)
- 目标：< 500ms（1000个文档）
- 准确率：> 95%

**使用示例：**

```python
from core.service.knowledge_base import KnowledgeBaseService

kb_service = KnowledgeBaseService()

# 创建知识库（自动启用HNSW）
kb_id = await kb_service.create_knowledge_base(
    name="My KB",
    description="Optimized knowledge base"
)

# 检索会自动使用HNSW索引
results = await kb_service.search(kb_id, "query", top_k=5)
```

### 2.2 批量向量化

优化大量文本的向量化过程。

**特性：**
- 自动分批处理
- 并发控制
- 进度追踪

**使用示例：**

```python
from core.service.embedding import EmbeddingService

embedding_service = EmbeddingService()

# 批量向量化500个文本
texts = ["text 1", "text 2", ..., "text 500"]
embeddings = await embedding_service.embed_batch(
    texts,
    batch_size=100  # 每批100个
)
```

### 2.3 批量文档添加

优化大批量文档的添加操作。

**特性：**
- 分批添加到Chroma
- 避免单次操作过大
- 内存友好

**使用示例：**

```python
# 添加大量文档
chroma_client.add_documents(
    collection_name=kb_id,
    documents=chunks,
    embeddings=embeddings,
    metadatas=metadatas,
    ids=chunk_ids,
    batch_size=1000  # 每批1000个
)
```

## 3. 内存优化

### 3.1 短期记忆优化

**特性：**
- LRU缓存策略（最近最少使用）
- 限制最大会话数（默认100）
- 限制每个会话的消息数（窗口大小 * 2）
- 自动清理空闲会话

**配置：**

```python
# config.py
short_term_memory_window = 10              # 保留最近10轮对话
short_term_memory_max_conversations = 100  # 最多100个会话
```

**使用示例：**

```python
from core.service.memory import ShortTermMemory

memory = ShortTermMemory(
    window_size=10,
    max_conversations=100
)

# 添加消息（自动维护窗口大小）
await memory.add_message(conv_id, "user", "Hello")

# 清理空闲会话
await memory.cleanup_idle_conversations(max_idle_minutes=30)

# 查看统计
stats = memory.get_stats()
```

### 3.2 工作记忆优化

**特性：**
- 限制最大缓存数量（默认1000）
- 自动清理最旧的会话
- 追踪最后访问时间

**配置：**

```python
# config.py
working_memory_max_size = 1000  # 最多1000个会话
```

**使用示例：**

```python
from core.service.memory import WorkingMemory

memory = WorkingMemory(max_size=1000)

# 设置变量（自动管理大小）
memory.set(conv_id, "key", "value")

# 清理空闲会话
memory.cleanup_idle(max_idle_minutes=30)
```

### 3.3 LLM缓存优化

**特性：**
- LRU缓存策略
- 基于消息内容的缓存key
- 可配置缓存大小和TTL

**配置：**

```python
# config.py
llm_cache_size = 1000   # 最多缓存1000个响应
llm_cache_ttl = 3600    # 缓存1小时
```

**使用示例：**

```python
from core.service.llm import get_llm_cache

cache = get_llm_cache()

# 获取或调用LLM
response = await cache.get_or_call(
    messages,
    llm_func,
    config
)

# 查看统计
stats = cache.get_stats()
```

### 3.4 自动内存清理

**特性：**
- 定期自动清理
- 清理空闲会话
- 强制垃圾回收
- 内存监控

**配置：**

```python
# config.py
enable_memory_optimization = True
memory_cleanup_interval = 300    # 5分钟清理一次
memory_max_idle_time = 1800      # 30分钟空闲后清理
memory_threshold_mb = 1000       # 内存阈值1GB
```

**使用示例：**

```python
from core.service.memory_optimizer import get_memory_optimizer, get_memory_monitor

# 启动自动清理
optimizer = get_memory_optimizer()
await optimizer.start()

# 手动触发清理
await optimizer.cleanup()

# 查看统计
stats = optimizer.get_stats()

# 监控内存使用
monitor = get_memory_monitor()
usage = monitor.get_memory_usage()
print(f"Memory usage: {usage['rss_mb']:.2f} MB")

# 检查是否超过阈值
if monitor.check_memory_threshold(threshold_mb=1000):
    print("Memory usage exceeds threshold!")
```

## 4. 性能指标

### 4.1 目标指标

| 指标 | 目标 | 实现方式 |
|------|------|---------|
| LLM首字延迟 | < 2s | 速率限制 + 缓存 |
| 向量检索 | < 500ms | HNSW索引 |
| 文档处理 | > 100页/分钟 | 批量向量化 |
| 内存占用 | < 1GB | LRU缓存 + 自动清理 |
| 启动时间 | < 3s | 延迟加载 |

### 4.2 监控方法

```python
# 1. LLM性能监控
from logger import get_logger
logger = get_logger("llm")
# 自动记录每次调用的延迟和token数

# 2. 速率限制器统计
rate_limiter = get_llm_rate_limiter()
stats = rate_limiter.get_stats()

# 3. 内存使用监控
monitor = get_memory_monitor()
usage = monitor.get_memory_usage()

# 4. 记忆系统统计
memory_service = MemoryService()
stats = memory_service.get_stats()
```

## 5. 最佳实践

### 5.1 LLM调用

```python
# ✅ 推荐：使用速率限制
llm_service = LLMService(config, use_rate_limiter=True)

# ✅ 推荐：使用缓存
cache = get_llm_cache()
response = await cache.get_or_call(messages, llm_func)

# ❌ 避免：无限制的并发调用
tasks = [llm_service.chat(msg) for msg in messages]  # 可能导致限流
```

### 5.2 向量检索

```python
# ✅ 推荐：使用HNSW索引
kb_service.create_knowledge_base(name, desc)  # 自动启用HNSW

# ✅ 推荐：批量向量化
embeddings = await embedding_service.embed_batch(texts, batch_size=100)

# ❌ 避免：逐个向量化
for text in texts:
    embedding = await embedding_service.embed(text)  # 太慢
```

### 5.3 内存管理

```python
# ✅ 推荐：启用自动清理
optimizer = get_memory_optimizer()
await optimizer.start()

# ✅ 推荐：定期检查内存
monitor = get_memory_monitor()
if monitor.check_memory_threshold(1000):
    await optimizer.cleanup()

# ✅ 推荐：及时清理不用的会话
await memory_service.clear_conversation(conv_id)
```

## 6. 故障排查

### 6.1 LLM调用慢

**可能原因：**
- 并发数过高
- 网络延迟
- API限流

**解决方案：**
```python
# 1. 检查速率限制器统计
rate_limiter = get_llm_rate_limiter()
stats = rate_limiter.get_stats()
print(f"Average wait time: {stats['avg_wait_time']:.2f}s")

# 2. 调整并发数
# config.py
max_concurrent_llm_requests = 3  # 降低并发数

# 3. 启用缓存
llm_cache_size = 2000  # 增加缓存大小
```

### 6.2 向量检索慢

**可能原因：**
- 文档数量过多
- HNSW参数不优化
- 未使用批量操作

**解决方案：**
```python
# 1. 检查集合大小
count = chroma_client.get_collection_count(kb_id)
print(f"Collection size: {count}")

# 2. 优化HNSW参数（在创建时）
# 增加search_ef可以提高准确率但会降低速度
metadata = {
    "hnsw:search_ef": 150  # 默认100
}

# 3. 使用批量操作
chroma_client.add_documents(..., batch_size=1000)
```

### 6.3 内存占用高

**可能原因：**
- 缓存过大
- 未清理空闲会话
- 内存泄漏

**解决方案：**
```python
# 1. 检查内存使用
monitor = get_memory_monitor()
usage = monitor.get_memory_usage()
print(f"Memory: {usage['rss_mb']:.2f} MB")

# 2. 检查缓存统计
memory_service = MemoryService()
stats = memory_service.get_stats()
print(stats)

# 3. 手动清理
await memory_service.cleanup_idle_memories(max_idle_minutes=10)

# 4. 调整配置
# config.py
short_term_memory_max_conversations = 50  # 降低最大会话数
llm_cache_size = 500  # 降低缓存大小
```

## 7. 配置参考

完整的性能相关配置：

```python
# config.py

# 性能配置
max_concurrent_llm_requests = 5      # LLM最大并发数
llm_timeout = 60                     # LLM超时时间（秒）
vector_search_timeout = 5            # 向量检索超时时间（秒）

# 记忆配置
short_term_memory_window = 10                    # 短期记忆窗口大小
short_term_memory_max_conversations = 100        # 最大会话数
long_term_memory_retention_days = 90             # 长期记忆保留天数
working_memory_max_size = 1000                   # 工作记忆最大大小

# 缓存配置
llm_cache_size = 1000                # LLM缓存大小
llm_cache_ttl = 3600                 # LLM缓存TTL（秒）

# 内存优化配置
enable_memory_optimization = True    # 启用内存优化
memory_cleanup_interval = 300        # 清理间隔（秒）
memory_max_idle_time = 1800          # 最大空闲时间（秒）
memory_threshold_mb = 1000           # 内存阈值（MB）

# 文档处理配置
chunk_size = 500                     # 文本块大小
chunk_overlap = 50                   # 文本块重叠
max_document_size_mb = 50            # 最大文档大小（MB）
```

## 8. 总结

通过实现这些性能优化，系统能够：

1. **高效处理并发请求** - 避免资源耗尽和API限流
2. **快速检索向量** - HNSW索引提供近似最近邻搜索
3. **控制内存使用** - LRU缓存和自动清理保持内存在合理范围
4. **提供良好的用户体验** - 快速响应和流畅交互

所有优化都是自动启用的，开发者只需要正常使用服务即可享受性能提升。
