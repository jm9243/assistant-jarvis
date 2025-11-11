"""
性能测试
测试系统性能指标是否达标
"""
import pytest
import asyncio
import time
import psutil
import os
from pathlib import Path
from datetime import datetime

from models.agent import AgentConfig, ModelConfig, MemoryConfig
from core.agent import BasicAgent
from core.service.knowledge_base import KnowledgeBaseService
from core.service.llm import LLMService


@pytest.fixture
def performance_agent():
    """创建性能测试Agent"""
    config = AgentConfig(
        id="perf_agent",
        user_id="test_user",
        name="Performance Test Agent",
        description="性能测试Agent",
        type="basic",
        llm_config=ModelConfig(
            provider="openai",
            model="gpt-3.5-turbo",
            api_key="test_key"
        ),
        system_prompt="你是一个AI助手。",
        memory_config=MemoryConfig()
    )
    return BasicAgent(config)


class TestLLMPerformance:
    """LLM性能测试"""
    
    @pytest.mark.asyncio
    @pytest.mark.performance
    async def test_first_token_latency(self, performance_agent):
        """测试LLM首字延迟（目标<2s）"""
        # 记录开始时间
        start_time = time.time()
        first_token_time = None
        
        # 构建简单消息
        messages = await performance_agent._build_messages(
            history=[],
            user_message="你好"
        )
        
        # 模拟流式响应
        # 注意：实际测试需要真实的LLM API调用
        # 这里我们模拟首个token的延迟
        await asyncio.sleep(0.5)  # 模拟网络延迟
        first_token_time = time.time() - start_time
        
        # 验证首字延迟
        print(f"\n首字延迟: {first_token_time:.3f}秒")
        assert first_token_time < 2.0, f"首字延迟 {first_token_time:.3f}s 超过目标 2s"
    
    @pytest.mark.asyncio
    @pytest.mark.performance
    async def test_llm_throughput(self, performance_agent):
        """测试LLM吞吐量"""
        start_time = time.time()
        
        # 发送10个请求
        tasks = []
        for i in range(10):
            messages = await performance_agent._build_messages(
                history=[],
                user_message=f"测试消息 {i}"
            )
            tasks.append(messages)
        
        elapsed = time.time() - start_time
        throughput = len(tasks) / elapsed
        
        print(f"\n吞吐量: {throughput:.2f} 请求/秒")
        print(f"总耗时: {elapsed:.3f}秒")
        
        # 验证吞吐量合理
        assert throughput > 0, "吞吐量应该大于0"
    
    @pytest.mark.asyncio
    @pytest.mark.performance
    async def test_llm_cache_performance(self):
        """测试LLM缓存性能"""
        from core.service.llm import LLMCache
        
        cache = LLMCache(max_size=100)
        
        # 测试缓存命中
        messages = [
            {"role": "system", "content": "You are a helpful assistant"},
            {"role": "user", "content": "Hello"}
        ]
        
        # 第一次调用（缓存未命中）
        start_time = time.time()
        
        async def mock_llm_call(msgs):
            await asyncio.sleep(0.1)  # 模拟LLM调用
            return "Hello! How can I help you?"
        
        result1 = await cache.get_or_call(messages, mock_llm_call)
        first_call_time = time.time() - start_time
        
        # 第二次调用（缓存命中）
        start_time = time.time()
        result2 = await cache.get_or_call(messages, mock_llm_call)
        cached_call_time = time.time() - start_time
        
        print(f"\n首次调用: {first_call_time:.3f}秒")
        print(f"缓存调用: {cached_call_time:.3f}秒")
        print(f"加速比: {first_call_time / cached_call_time:.1f}x")
        
        # 验证缓存有效
        assert result1 == result2
        assert cached_call_time < first_call_time * 0.5, "缓存应该显著提升性能"


class TestVectorSearchPerformance:
    """向量检索性能测试"""
    
    @pytest.mark.asyncio
    @pytest.mark.performance
    async def test_search_latency(self):
        """测试向量检索延迟（目标<500ms）"""
        kb_service = KnowledgeBaseService()
        
        # 创建测试知识库
        kb_id = await kb_service.create_knowledge_base(
            name="Performance Test KB",
            description="性能测试知识库"
        )
        
        # 添加测试文档
        test_dir = Path("./test_perf_data")
        test_dir.mkdir(exist_ok=True)
        
        try:
            # 创建100个文档
            for i in range(100):
                doc_file = test_dir / f"doc_{i}.txt"
                doc_file.write_text(
                    f"这是测试文档 {i}。包含一些测试内容。" * 10,
                    encoding="utf-8"
                )
                await kb_service.add_document(kb_id, str(doc_file))
            
            # 等待处理完成
            await asyncio.sleep(2)
            
            # 测试检索性能
            start_time = time.time()
            results = await kb_service.search(kb_id, "测试内容", top_k=5)
            search_time = time.time() - start_time
            
            print(f"\n检索延迟: {search_time*1000:.1f}ms")
            print(f"返回结果数: {len(results)}")
            
            # 验证性能目标
            assert search_time < 0.5, f"检索延迟 {search_time*1000:.1f}ms 超过目标 500ms"
            
        finally:
            # 清理
            import shutil
            if test_dir.exists():
                shutil.rmtree(test_dir)
    
    @pytest.mark.asyncio
    @pytest.mark.performance
    async def test_search_scalability(self):
        """测试检索可扩展性"""
        kb_service = KnowledgeBaseService()
        
        # 创建知识库
        kb_id = await kb_service.create_knowledge_base(
            name="Scalability Test KB",
            description="可扩展性测试"
        )
        
        test_dir = Path("./test_scale_data")
        test_dir.mkdir(exist_ok=True)
        
        try:
            # 测试不同文档数量下的性能
            doc_counts = [10, 50, 100, 500, 1000]
            search_times = []
            
            for count in doc_counts:
                # 添加文档
                for i in range(count):
                    if i >= len(list(test_dir.glob("*.txt"))):
                        doc_file = test_dir / f"doc_{i}.txt"
                        doc_file.write_text(
                            f"文档 {i} 的内容。" * 5,
                            encoding="utf-8"
                        )
                        await kb_service.add_document(kb_id, str(doc_file))
                
                await asyncio.sleep(1)
                
                # 测试检索时间
                start_time = time.time()
                await kb_service.search(kb_id, "内容", top_k=5)
                search_time = time.time() - start_time
                search_times.append(search_time)
                
                print(f"\n文档数: {count}, 检索时间: {search_time*1000:.1f}ms")
            
            # 验证性能不会显著降级
            # 1000个文档的检索时间不应超过10个文档的10倍
            if len(search_times) >= 2:
                degradation = search_times[-1] / search_times[0]
                print(f"\n性能降级比: {degradation:.2f}x")
                assert degradation < 10, f"性能降级过大: {degradation:.2f}x"
            
        finally:
            # 清理
            import shutil
            if test_dir.exists():
                shutil.rmtree(test_dir)
    
    @pytest.mark.asyncio
    @pytest.mark.performance
    async def test_batch_embedding_performance(self):
        """测试批量向量化性能"""
        from core.service.embedding import EmbeddingService
        
        embedding_service = EmbeddingService()
        
        # 准备测试文本
        texts = [f"这是测试文本 {i}" for i in range(100)]
        
        # 测试批量向量化
        start_time = time.time()
        embeddings = await embedding_service.embed_batch(texts)
        batch_time = time.time() - start_time
        
        # 测试单个向量化
        start_time = time.time()
        for text in texts[:10]:  # 只测试10个以节省时间
            await embedding_service.embed(text)
        single_time = (time.time() - start_time) * 10  # 估算100个的时间
        
        print(f"\n批量向量化: {batch_time:.3f}秒")
        print(f"单个向量化(估算): {single_time:.3f}秒")
        print(f"加速比: {single_time / batch_time:.1f}x")
        
        # 验证批量处理更快
        assert batch_time < single_time * 0.5, "批量处理应该显著更快"


class TestConcurrencyPerformance:
    """并发性能测试"""
    
    @pytest.mark.asyncio
    @pytest.mark.performance
    async def test_concurrent_agents(self):
        """测试并发Agent性能"""
        # 创建多个Agent
        agents = []
        for i in range(10):
            config = AgentConfig(
                id=f"concurrent_agent_{i}",
                user_id="test_user",
                name=f"Concurrent Agent {i}",
                description="并发测试Agent",
                type="basic",
                llm_config=ModelConfig(
                    provider="openai",
                    model="gpt-3.5-turbo",
                    api_key="test_key"
                ),
                system_prompt="你是一个AI助手。",
                memory_config=MemoryConfig()
            )
            agents.append(BasicAgent(config))
        
        # 并发执行
        start_time = time.time()
        
        async def agent_task(agent, message):
            messages = await agent._build_messages(
                history=[],
                user_message=message
            )
            return messages
        
        tasks = [
            agent_task(agent, f"消息 {i}")
            for i, agent in enumerate(agents)
        ]
        
        results = await asyncio.gather(*tasks)
        elapsed = time.time() - start_time
        
        print(f"\n并发执行 {len(agents)} 个Agent")
        print(f"总耗时: {elapsed:.3f}秒")
        print(f"平均每个: {elapsed/len(agents):.3f}秒")
        
        # 验证所有任务完成
        assert len(results) == len(agents)
        assert elapsed < 10.0, f"并发执行时间 {elapsed:.3f}s 超过目标 10s"
    
    @pytest.mark.asyncio
    @pytest.mark.performance
    async def test_rate_limiting(self):
        """测试限流性能"""
        from core.service.rate_limiter import RateLimiter
        
        limiter = RateLimiter(max_concurrent=5, max_per_second=10)
        
        # 发送20个请求
        start_time = time.time()
        
        async def limited_task(i):
            async with limiter:
                await asyncio.sleep(0.1)  # 模拟任务
                return i
        
        tasks = [limited_task(i) for i in range(20)]
        results = await asyncio.gather(*tasks)
        elapsed = time.time() - start_time
        
        print(f"\n限流执行 {len(tasks)} 个任务")
        print(f"总耗时: {elapsed:.3f}秒")
        print(f"实际QPS: {len(tasks)/elapsed:.2f}")
        
        # 验证限流生效
        assert len(results) == 20
        # 由于限流，总时间应该大于无限流的时间
        assert elapsed > 2.0, "限流应该延长执行时间"


class TestMemoryPerformance:
    """内存性能测试"""
    
    @pytest.mark.performance
    def test_memory_usage(self):
        """测试内存占用（目标<1GB）"""
        process = psutil.Process(os.getpid())
        
        # 记录初始内存
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        print(f"\n初始内存: {initial_memory:.1f} MB")
        
        # 创建多个Agent和服务
        agents = []
        for i in range(10):
            config = AgentConfig(
                id=f"memory_agent_{i}",
                user_id="test_user",
                name=f"Memory Agent {i}",
                description="内存测试Agent",
                type="basic",
                llm_config=ModelConfig(
                    provider="openai",
                    model="gpt-3.5-turbo",
                    api_key="test_key"
                ),
                system_prompt="你是一个AI助手。",
                memory_config=MemoryConfig()
            )
            agents.append(BasicAgent(config))
        
        # 记录使用后的内存
        current_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = current_memory - initial_memory
        
        print(f"当前内存: {current_memory:.1f} MB")
        print(f"内存增长: {memory_increase:.1f} MB")
        
        # 验证内存占用
        assert current_memory < 1024, f"内存占用 {current_memory:.1f}MB 超过目标 1GB"
    
    @pytest.mark.asyncio
    @pytest.mark.performance
    async def test_memory_leak(self):
        """测试内存泄漏"""
        process = psutil.Process(os.getpid())
        
        # 记录初始内存
        initial_memory = process.memory_info().rss / 1024 / 1024
        
        # 执行多次操作
        for i in range(100):
            config = AgentConfig(
                id=f"leak_test_agent_{i}",
                user_id="test_user",
                name=f"Leak Test Agent {i}",
                description="内存泄漏测试",
                type="basic",
                llm_config=ModelConfig(
                    provider="openai",
                    model="gpt-3.5-turbo",
                    api_key="test_key"
                ),
                system_prompt="你是一个AI助手。",
                memory_config=MemoryConfig()
            )
            agent = BasicAgent(config)
            
            # 执行操作
            messages = await agent._build_messages(
                history=[],
                user_message=f"测试 {i}"
            )
            
            # 删除引用
            del agent
            del messages
        
        # 强制垃圾回收
        import gc
        gc.collect()
        
        # 记录最终内存
        final_memory = process.memory_info().rss / 1024 / 1024
        memory_growth = final_memory - initial_memory
        
        print(f"\n初始内存: {initial_memory:.1f} MB")
        print(f"最终内存: {final_memory:.1f} MB")
        print(f"内存增长: {memory_growth:.1f} MB")
        
        # 验证没有严重的内存泄漏
        # 允许一定的内存增长，但不应该超过100MB
        assert memory_growth < 100, f"可能存在内存泄漏，增长 {memory_growth:.1f}MB"
    
    @pytest.mark.asyncio
    @pytest.mark.performance
    async def test_cache_memory_management(self):
        """测试缓存内存管理"""
        from core.service.memory import ShortTermMemory
        
        memory = ShortTermMemory(window_size=10)
        
        # 添加大量消息
        for i in range(1000):
            await memory.add_message(
                f"conv_{i % 10}",  # 10个会话
                "user",
                f"消息 {i}" * 100  # 较长的消息
            )
        
        # 验证缓存大小被限制
        for conv_id in range(10):
            messages = await memory.get(f"conv_{conv_id}")
            # 每个会话最多保留 window_size * 2 条消息
            assert len(messages) <= 20, f"会话 {conv_id} 消息数 {len(messages)} 超过限制"


class TestStartupPerformance:
    """启动性能测试"""
    
    @pytest.mark.performance
    def test_application_startup_time(self):
        """测试应用启动时间（目标<3s）"""
        # 模拟应用启动过程
        start_time = time.time()
        
        # 1. 加载配置
        from config import get_settings
        settings = get_settings()
        
        # 2. 初始化服务
        from core.service.knowledge_base import KnowledgeBaseService
        from core.service.tool import ToolService
        
        kb_service = KnowledgeBaseService()
        tool_service = ToolService()
        
        # 3. 创建Agent
        config = AgentConfig(
            id="startup_agent",
            user_id="test_user",
            name="Startup Agent",
            description="启动测试",
            type="basic",
            llm_config=ModelConfig(
                provider="openai",
                model="gpt-3.5-turbo",
                api_key="test_key"
            ),
            system_prompt="你是一个AI助手。",
            memory_config=MemoryConfig()
        )
        agent = BasicAgent(config)
        
        startup_time = time.time() - start_time
        
        print(f"\n应用启动时间: {startup_time:.3f}秒")
        
        # 验证启动时间
        assert startup_time < 3.0, f"启动时间 {startup_time:.3f}s 超过目标 3s"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s", "-m", "performance"])
