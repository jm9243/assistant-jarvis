"""
稳定性测试
测试系统长时间运行的稳定性、内存泄漏和崩溃率
"""
import pytest
import asyncio
import time
import psutil
import os
from datetime import datetime, timedelta
from pathlib import Path

from models.agent import AgentConfig, ModelConfig, MemoryConfig
from core.agent import BasicAgent
from core.service.knowledge_base import KnowledgeBaseService
from core.service.conversation import ConversationService
from core.workflow.ipc_functions import execute_workflow


@pytest.fixture
def process():
    """获取当前进程"""
    return psutil.Process(os.getpid())


@pytest.fixture
def test_data_dir(tmp_path):
    """创建测试数据目录"""
    data_dir = tmp_path / "stability_test"
    data_dir.mkdir(exist_ok=True)
    return data_dir


@pytest.fixture
def basic_agent():
    """创建Basic Agent实例"""
    config = AgentConfig(
        id="stability_test_agent",
        user_id="test_user",
        name="Stability Test Agent",
        description="稳定性测试Agent",
        type="basic",
        llm_config=ModelConfig(
            provider="openai",
            model="gpt-3.5-turbo",
            api_key="test_key"
        ),
        system_prompt="你是一个测试助手。",
        memory_config=MemoryConfig()
    )
    return BasicAgent(config)


class TestLongRunning:
    """长时间运行测试"""
    
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_24_hour_continuous_operation(self, basic_agent, test_data_dir, process):
        """
        测试24小时连续运行
        
        注意：这是一个长时间测试，默认情况下会被跳过
        使用 pytest -m slow 来运行
        
        实际测试中，我们运行一个缩短版本（1小时）来验证稳定性
        """
        # 实际测试时间（秒）- 默认1小时，可以通过环境变量调整
        test_duration = int(os.getenv("STABILITY_TEST_DURATION", "3600"))  # 默认1小时
        
        print(f"\n开始稳定性测试，持续时间: {test_duration}秒 ({test_duration/3600:.2f}小时)")
        
        start_time = time.time()
        end_time = start_time + test_duration
        
        # 记录初始内存
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        print(f"初始内存: {initial_memory:.2f} MB")
        
        # 统计信息
        stats = {
            "iterations": 0,
            "errors": 0,
            "total_operations": 0,
            "memory_samples": [],
            "operation_times": []
        }
        
        conv_service = ConversationService()
        kb_service = KnowledgeBaseService()
        
        # 创建测试资源
        conv_id = await conv_service.create(
            agent_id=basic_agent.agent_id,
            title="稳定性测试会话"
        )
        
        kb_id = await kb_service.create_knowledge_base(
            name="稳定性测试知识库",
            description="用于稳定性测试"
        )
        
        try:
            while time.time() < end_time:
                iteration_start = time.time()
                stats["iterations"] += 1
                
                try:
                    # 1. Agent对话操作
                    await conv_service.add_message(
                        conv_id, "user", f"测试消息 {stats['iterations']}"
                    )
                    await conv_service.add_message(
                        conv_id, "assistant", f"回复 {stats['iterations']}"
                    )
                    stats["total_operations"] += 2
                    
                    # 2. 知识库操作
                    if stats["iterations"] % 10 == 0:
                        # 每10次迭代添加一个文档
                        doc_file = test_data_dir / f"doc_{stats['iterations']}.txt"
                        doc_file.write_text(
                            f"测试文档 {stats['iterations']}",
                            encoding="utf-8"
                        )
                        await kb_service.add_document(kb_id, str(doc_file))
                        stats["total_operations"] += 1
                    
                    # 3. 知识库检索
                    if stats["iterations"] % 5 == 0:
                        await kb_service.search(kb_id, "测试", top_k=3)
                        stats["total_operations"] += 1
                    
                    # 4. 工作流执行
                    if stats["iterations"] % 20 == 0:
                        workflow_def = {
                            "id": f"stability_wf_{stats['iterations']}",
                            "user_id": "test_user",
                            "name": "稳定性测试工作流",
                            "nodes": [
                                {
                                    "id": "delay",
                                    "type": "delay",
                                    "position": {"x": 0, "y": 0},
                                    "data": {
                                        "label": "延迟",
                                        "config": {"duration": 10}
                                    }
                                }
                            ],
                            "edges": [],
                            "variables": {},
                            "tags": []
                        }
                        execute_workflow(workflow_def, {})
                        stats["total_operations"] += 1
                    
                except Exception as e:
                    stats["errors"] += 1
                    print(f"迭代 {stats['iterations']} 出错: {e}")
                
                # 记录操作时间
                operation_time = time.time() - iteration_start
                stats["operation_times"].append(operation_time)
                
                # 每100次迭代记录一次内存
                if stats["iterations"] % 100 == 0:
                    current_memory = process.memory_info().rss / 1024 / 1024
                    stats["memory_samples"].append({
                        "iteration": stats["iterations"],
                        "memory_mb": current_memory,
                        "time": time.time() - start_time
                    })
                    
                    elapsed = time.time() - start_time
                    print(f"迭代 {stats['iterations']}, "
                          f"已运行 {elapsed/3600:.2f}小时, "
                          f"内存 {current_memory:.2f} MB, "
                          f"错误 {stats['errors']}")
                
                # 短暂休息，避免过度占用CPU
                await asyncio.sleep(0.1)
        
        finally:
            # 清理
            await conv_service.delete(conv_id)
        
        # 测试结束，分析结果
        final_memory = process.memory_info().rss / 1024 / 1024
        memory_increase = final_memory - initial_memory
        
        print(f"\n稳定性测试完成:")
        print(f"  总迭代次数: {stats['iterations']}")
        print(f"  总操作数: {stats['total_operations']}")
        print(f"  错误次数: {stats['errors']}")
        print(f"  初始内存: {initial_memory:.2f} MB")
        print(f"  最终内存: {final_memory:.2f} MB")
        print(f"  内存增长: {memory_increase:.2f} MB")
        
        if stats["operation_times"]:
            avg_time = sum(stats["operation_times"]) / len(stats["operation_times"])
            print(f"  平均操作时间: {avg_time*1000:.2f} ms")
        
        # 验证稳定性指标
        # 1. 崩溃率应该 < 0.1%
        crash_rate = (stats["errors"] / stats["iterations"]) * 100 if stats["iterations"] > 0 else 0
        print(f"  崩溃率: {crash_rate:.4f}%")
        assert crash_rate < 0.1, f"崩溃率过高: {crash_rate:.4f}%"
        
        # 2. 内存增长应该合理（< 500MB）
        assert memory_increase < 500, f"内存增长过大: {memory_increase:.2f} MB"


class TestMemoryLeak:
    """内存泄漏测试"""
    
    @pytest.mark.asyncio
    async def test_conversation_memory_leak(self, basic_agent, process):
        """测试会话操作的内存泄漏"""
        conv_service = ConversationService()
        
        # 记录初始内存
        initial_memory = process.memory_info().rss / 1024 / 1024
        
        # 执行1000次会话操作
        for i in range(1000):
            conv_id = await conv_service.create(
                agent_id=basic_agent.agent_id,
                title=f"测试会话 {i}"
            )
            
            # 添加消息
            await conv_service.add_message(conv_id, "user", f"消息 {i}")
            await conv_service.add_message(conv_id, "assistant", f"回复 {i}")
            
            # 删除会话
            await conv_service.delete(conv_id)
            
            # 每100次检查一次内存
            if i % 100 == 0 and i > 0:
                current_memory = process.memory_info().rss / 1024 / 1024
                memory_increase = current_memory - initial_memory
                print(f"迭代 {i}: 内存增长 {memory_increase:.2f} MB")
        
        # 最终内存检查
        final_memory = process.memory_info().rss / 1024 / 1024
        memory_increase = final_memory - initial_memory
        
        print(f"\n内存泄漏测试完成:")
        print(f"  初始内存: {initial_memory:.2f} MB")
        print(f"  最终内存: {final_memory:.2f} MB")
        print(f"  内存增长: {memory_increase:.2f} MB")
        
        # 验证内存增长在合理范围内（< 100MB）
        assert memory_increase < 100, f"可能存在内存泄漏，内存增长: {memory_increase:.2f} MB"
    
    @pytest.mark.asyncio
    async def test_knowledge_base_memory_leak(self, test_data_dir, process):
        """测试知识库操作的内存泄漏"""
        kb_service = KnowledgeBaseService()
        
        # 记录初始内存
        initial_memory = process.memory_info().rss / 1024 / 1024
        
        # 创建知识库
        kb_id = await kb_service.create_knowledge_base(
            name="内存泄漏测试",
            description="测试知识库内存泄漏"
        )
        
        try:
            # 执行500次文档操作
            for i in range(500):
                # 创建文档
                doc_file = test_data_dir / f"leak_test_{i}.txt"
                doc_file.write_text(f"测试文档 {i}", encoding="utf-8")
                
                # 添加文档
                await kb_service.add_document(kb_id, str(doc_file))
                
                # 执行检索
                if i % 10 == 0:
                    await kb_service.search(kb_id, "测试", top_k=3)
                
                # 每50次检查一次内存
                if i % 50 == 0 and i > 0:
                    current_memory = process.memory_info().rss / 1024 / 1024
                    memory_increase = current_memory - initial_memory
                    print(f"迭代 {i}: 内存增长 {memory_increase:.2f} MB")
            
            # 最终内存检查
            final_memory = process.memory_info().rss / 1024 / 1024
            memory_increase = final_memory - initial_memory
            
            print(f"\n知识库内存泄漏测试完成:")
            print(f"  初始内存: {initial_memory:.2f} MB")
            print(f"  最终内存: {final_memory:.2f} MB")
            print(f"  内存增长: {memory_increase:.2f} MB")
            
            # 验证内存增长在合理范围内（< 200MB，因为知识库会缓存数据）
            assert memory_increase < 200, f"可能存在内存泄漏，内存增长: {memory_increase:.2f} MB"
        
        finally:
            # 清理（如果有清理方法）
            pass
    
    @pytest.mark.asyncio
    async def test_workflow_memory_leak(self, process):
        """测试工作流执行的内存泄漏"""
        # 记录初始内存
        initial_memory = process.memory_info().rss / 1024 / 1024
        
        workflow_def = {
            "id": "memory_leak_test",
            "user_id": "test_user",
            "name": "内存泄漏测试工作流",
            "nodes": [
                {
                    "id": "delay",
                    "type": "delay",
                    "position": {"x": 0, "y": 0},
                    "data": {
                        "label": "延迟",
                        "config": {"duration": 10}
                    }
                }
            ],
            "edges": [],
            "variables": {},
            "tags": []
        }
        
        # 执行1000次工作流
        for i in range(1000):
            execute_workflow(workflow_def, {})
            
            # 每100次检查一次内存
            if i % 100 == 0 and i > 0:
                current_memory = process.memory_info().rss / 1024 / 1024
                memory_increase = current_memory - initial_memory
                print(f"迭代 {i}: 内存增长 {memory_increase:.2f} MB")
        
        # 最终内存检查
        final_memory = process.memory_info().rss / 1024 / 1024
        memory_increase = final_memory - initial_memory
        
        print(f"\n工作流内存泄漏测试完成:")
        print(f"  初始内存: {initial_memory:.2f} MB")
        print(f"  最终内存: {final_memory:.2f} MB")
        print(f"  内存增长: {memory_increase:.2f} MB")
        
        # 验证内存增长在合理范围内（< 50MB）
        assert memory_increase < 50, f"可能存在内存泄漏，内存增长: {memory_increase:.2f} MB"


class TestCrashRate:
    """崩溃率测试"""
    
    @pytest.mark.asyncio
    async def test_crash_rate_under_load(self, basic_agent):
        """测试负载下的崩溃率"""
        conv_service = ConversationService()
        
        total_operations = 10000
        errors = 0
        
        print(f"\n开始崩溃率测试，总操作数: {total_operations}")
        
        for i in range(total_operations):
            try:
                # 创建会话
                conv_id = await conv_service.create(
                    agent_id=basic_agent.agent_id,
                    title=f"崩溃测试 {i}"
                )
                
                # 添加消息
                await conv_service.add_message(conv_id, "user", f"消息 {i}")
                
                # 删除会话
                await conv_service.delete(conv_id)
                
            except Exception as e:
                errors += 1
                if errors <= 10:  # 只打印前10个错误
                    print(f"操作 {i} 失败: {e}")
            
            # 每1000次报告进度
            if (i + 1) % 1000 == 0:
                crash_rate = (errors / (i + 1)) * 100
                print(f"进度: {i+1}/{total_operations}, 当前崩溃率: {crash_rate:.4f}%")
        
        # 计算最终崩溃率
        crash_rate = (errors / total_operations) * 100
        
        print(f"\n崩溃率测试完成:")
        print(f"  总操作数: {total_operations}")
        print(f"  失败次数: {errors}")
        print(f"  崩溃率: {crash_rate:.4f}%")
        
        # 验证崩溃率 < 0.1%
        assert crash_rate < 0.1, f"崩溃率过高: {crash_rate:.4f}%"
    
    @pytest.mark.asyncio
    async def test_concurrent_operations_crash_rate(self, basic_agent):
        """测试并发操作的崩溃率"""
        conv_service = ConversationService()
        
        total_batches = 100
        batch_size = 10
        total_operations = total_batches * batch_size
        errors = 0
        
        print(f"\n开始并发崩溃率测试，总批次: {total_batches}, 每批: {batch_size}")
        
        for batch in range(total_batches):
            # 创建并发任务
            tasks = []
            for i in range(batch_size):
                async def operation():
                    conv_id = await conv_service.create(
                        agent_id=basic_agent.agent_id,
                        title=f"并发测试 {batch}_{i}"
                    )
                    await conv_service.add_message(conv_id, "user", "测试")
                    await conv_service.delete(conv_id)
                
                tasks.append(operation())
            
            # 执行并发任务
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # 统计错误
            batch_errors = sum(1 for r in results if isinstance(r, Exception))
            errors += batch_errors
            
            if (batch + 1) % 10 == 0:
                crash_rate = (errors / ((batch + 1) * batch_size)) * 100
                print(f"批次: {batch+1}/{total_batches}, 当前崩溃率: {crash_rate:.4f}%")
        
        # 计算最终崩溃率
        crash_rate = (errors / total_operations) * 100
        
        print(f"\n并发崩溃率测试完成:")
        print(f"  总操作数: {total_operations}")
        print(f"  失败次数: {errors}")
        print(f"  崩溃率: {crash_rate:.4f}%")
        
        # 验证崩溃率 < 0.1%
        assert crash_rate < 0.1, f"并发崩溃率过高: {crash_rate:.4f}%"


class TestResourceCleanup:
    """资源清理测试"""
    
    @pytest.mark.asyncio
    async def test_resource_cleanup_after_operations(self, basic_agent, test_data_dir, process):
        """测试操作后的资源清理"""
        conv_service = ConversationService()
        kb_service = KnowledgeBaseService()
        
        # 记录初始状态
        initial_memory = process.memory_info().rss / 1024 / 1024
        initial_threads = process.num_threads()
        
        # 执行大量操作
        for i in range(100):
            # 创建和删除会话
            conv_id = await conv_service.create(
                agent_id=basic_agent.agent_id,
                title=f"清理测试 {i}"
            )
            await conv_service.add_message(conv_id, "user", "测试")
            await conv_service.delete(conv_id)
            
            # 创建和使用知识库
            if i % 10 == 0:
                kb_id = await kb_service.create_knowledge_base(
                    name=f"清理测试KB {i}",
                    description="测试"
                )
                
                doc_file = test_data_dir / f"cleanup_{i}.txt"
                doc_file.write_text("测试", encoding="utf-8")
                await kb_service.add_document(kb_id, str(doc_file))
        
        # 等待资源清理
        await asyncio.sleep(2)
        
        # 检查最终状态
        final_memory = process.memory_info().rss / 1024 / 1024
        final_threads = process.num_threads()
        
        memory_increase = final_memory - initial_memory
        thread_increase = final_threads - initial_threads
        
        print(f"\n资源清理测试完成:")
        print(f"  内存增长: {memory_increase:.2f} MB")
        print(f"  线程增长: {thread_increase}")
        
        # 验证资源被正确清理
        assert memory_increase < 100, f"内存未正确清理，增长: {memory_increase:.2f} MB"
        assert abs(thread_increase) < 10, f"线程未正确清理，增长: {thread_increase}"


if __name__ == "__main__":
    # 运行稳定性测试
    # 使用 pytest -m slow 运行长时间测试
    # 使用 pytest -m "not slow" 跳过长时间测试
    pytest.main([__file__, "-v", "-s", "-m", "not slow"])
