#!/usr/bin/env python3
"""
Daemon引擎性能测试

测试内容：
1. 测试启动时间 < 2秒
2. 测试单次调用延迟 < 5ms
3. 测试100次连续调用无错误
4. 测试内存占用 < 100MB
"""
import pytest
import time
import psutil
import os
import sys
import json
import subprocess
from pathlib import Path
from io import StringIO
from unittest.mock import patch

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from function_registry import FunctionRegistry


@pytest.mark.performance
class TestDaemonPerformance:
    """Daemon引擎性能测试"""
    
    def test_startup_time(self):
        """测试启动时间 < 2秒"""
        # 测试函数注册表初始化时间
        start_time = time.time()
        
        registry = FunctionRegistry()
        
        # 注册多个函数模拟真实场景
        for i in range(20):
            def dummy_func():
                pass
            registry.register(f"func_{i}", dummy_func, f"测试函数{i}")
        
        elapsed_time = time.time() - start_time
        
        print(f"\n启动时间: {elapsed_time:.3f}秒")
        assert elapsed_time < 2.0, f"启动时间 {elapsed_time:.3f}s 超过2秒"
    
    def test_single_call_latency(self):
        """测试单次调用延迟 < 5ms"""
        registry = FunctionRegistry()
        
        # 注册一个简单的函数
        def fast_func(x: int) -> int:
            return x * 2
        
        registry.register("fast_func", fast_func)
        
        # 预热
        for _ in range(10):
            registry.call("fast_func", x=5)
        
        # 测试单次调用延迟
        latencies = []
        for _ in range(100):
            start_time = time.perf_counter()
            result = registry.call("fast_func", x=5)
            elapsed_time = (time.perf_counter() - start_time) * 1000  # 转换为毫秒
            latencies.append(elapsed_time)
            assert result == 10
        
        avg_latency = sum(latencies) / len(latencies)
        max_latency = max(latencies)
        min_latency = min(latencies)
        
        print(f"\n平均延迟: {avg_latency:.3f}ms")
        print(f"最大延迟: {max_latency:.3f}ms")
        print(f"最小延迟: {min_latency:.3f}ms")
        
        assert avg_latency < 5.0, f"平均延迟 {avg_latency:.3f}ms 超过5ms"
        assert max_latency < 10.0, f"最大延迟 {max_latency:.3f}ms 超过10ms"
    
    def test_continuous_calls_no_error(self):
        """测试100次连续调用无错误"""
        registry = FunctionRegistry()
        
        # 注册测试函数
        call_count = 0
        
        def counter_func():
            nonlocal call_count
            call_count += 1
            return call_count
        
        registry.register("counter_func", counter_func)
        
        # 执行100次连续调用
        start_time = time.time()
        errors = []
        
        for i in range(100):
            try:
                result = registry.call("counter_func")
                assert result == i + 1, f"Expected {i+1}, got {result}"
            except Exception as e:
                errors.append((i, str(e)))
        
        elapsed_time = time.time() - start_time
        
        print(f"\n100次调用总时间: {elapsed_time:.3f}秒")
        print(f"平均每次调用: {elapsed_time/100*1000:.3f}ms")
        print(f"错误数量: {len(errors)}")
        
        assert len(errors) == 0, f"发现 {len(errors)} 个错误: {errors[:5]}"
        assert call_count == 100, f"Expected 100 calls, got {call_count}"
    
    def test_memory_usage(self):
        """测试内存占用 < 100MB"""
        # 获取当前进程
        process = psutil.Process(os.getpid())
        
        # 记录初始内存
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # 创建函数注册表并注册函数
        registry = FunctionRegistry()
        
        # 注册多个函数
        for i in range(50):
            def test_func(x: int = 0) -> int:
                return x + i
            registry.register(f"func_{i}", test_func)
        
        # 执行一些调用
        for i in range(100):
            registry.call(f"func_{i % 50}", x=i)
        
        # 记录最终内存
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        print(f"\n初始内存: {initial_memory:.2f}MB")
        print(f"最终内存: {final_memory:.2f}MB")
        print(f"内存增长: {memory_increase:.2f}MB")
        
        # 验证内存增长不超过100MB
        assert memory_increase < 100, f"内存增长 {memory_increase:.2f}MB 超过100MB"
    
    def test_request_parsing_performance(self):
        """测试请求解析性能"""
        # 创建测试请求
        request_data = {
            "id": "test-123",
            "function": "test_func",
            "args": {"x": 1, "y": 2, "z": 3}
        }
        request_json = json.dumps(request_data)
        
        # 测试解析性能
        parse_times = []
        for _ in range(1000):
            start_time = time.perf_counter()
            parsed = json.loads(request_json)
            elapsed_time = (time.perf_counter() - start_time) * 1000000  # 微秒
            parse_times.append(elapsed_time)
        
        avg_parse_time = sum(parse_times) / len(parse_times)
        
        print(f"\n平均解析时间: {avg_parse_time:.2f}μs")
        
        # 解析时间应该很快（< 100微秒）
        assert avg_parse_time < 100, f"解析时间 {avg_parse_time:.2f}μs 过慢"
    
    def test_response_formatting_performance(self):
        """测试响应格式化性能"""
        # 创建测试响应
        response_data = {
            "id": "test-123",
            "success": True,
            "result": {"message": "success", "data": list(range(100))}
        }
        
        # 测试格式化性能
        format_times = []
        for _ in range(1000):
            start_time = time.perf_counter()
            response_json = json.dumps(response_data, ensure_ascii=False)
            elapsed_time = (time.perf_counter() - start_time) * 1000000  # 微秒
            format_times.append(elapsed_time)
        
        avg_format_time = sum(format_times) / len(format_times)
        
        print(f"\n平均格式化时间: {avg_format_time:.2f}μs")
        
        # 格式化时间应该很快（< 200微秒）
        assert avg_format_time < 200, f"格式化时间 {avg_format_time:.2f}μs 过慢"
    
    def test_concurrent_function_calls(self):
        """测试并发函数调用性能"""
        registry = FunctionRegistry()
        
        # 注册多个函数
        for i in range(10):
            def func(x: int = i) -> int:
                return x * 2
            registry.register(f"func_{i}", func)
        
        # 模拟并发调用（顺序执行，但快速切换）
        start_time = time.time()
        results = []
        
        for round_num in range(10):
            for func_id in range(10):
                result = registry.call(f"func_{func_id}", x=round_num)
                results.append(result)
        
        elapsed_time = time.time() - start_time
        
        print(f"\n100次调用总时间: {elapsed_time:.3f}秒")
        print(f"平均每次调用: {elapsed_time/100*1000:.3f}ms")
        
        assert len(results) == 100
        assert elapsed_time < 1.0, f"100次调用耗时 {elapsed_time:.3f}s 过长"
    
    def test_function_registry_scalability(self):
        """测试函数注册表可扩展性"""
        registry = FunctionRegistry()
        
        # 测试注册大量函数的性能
        start_time = time.time()
        
        for i in range(1000):
            def func():
                return i
            registry.register(f"func_{i}", func, f"函数{i}")
        
        registration_time = time.time() - start_time
        
        print(f"\n注册1000个函数耗时: {registration_time:.3f}秒")
        
        # 测试查找函数的性能
        lookup_times = []
        for i in range(100):
            func_name = f"func_{i * 10}"
            start_time = time.perf_counter()
            info = registry.get_function_info(func_name)
            elapsed_time = (time.perf_counter() - start_time) * 1000000  # 微秒
            lookup_times.append(elapsed_time)
            assert info is not None
        
        avg_lookup_time = sum(lookup_times) / len(lookup_times)
        
        print(f"平均查找时间: {avg_lookup_time:.2f}μs")
        
        assert registration_time < 5.0, f"注册时间 {registration_time:.3f}s 过长"
        assert avg_lookup_time < 10, f"查找时间 {avg_lookup_time:.2f}μs 过长"


@pytest.mark.performance
class TestEndToEndPerformance:
    """端到端性能测试"""
    
    def test_full_request_response_cycle(self):
        """测试完整的请求-响应周期性能"""
        from tests.test_daemon_unit import SimpleDaemonEngine
        
        engine = SimpleDaemonEngine()
        
        # 注册测试函数
        def echo_func(message: str) -> str:
            return message
        
        engine.function_registry.register("echo", echo_func)
        
        # 测试完整周期
        cycle_times = []
        
        for i in range(100):
            request = {
                "id": f"req-{i}",
                "function": "echo",
                "args": {"message": f"test message {i}"}
            }
            request_json = json.dumps(request)
            
            start_time = time.perf_counter()
            
            # 模拟完整流程：解析 -> 调用 -> 格式化
            parsed_request = engine._parse_request(request_json)
            result = engine.function_registry.call(
                parsed_request["function"],
                **parsed_request["args"]
            )
            response = {
                "id": parsed_request["id"],
                "success": True,
                "result": result
            }
            response_json = json.dumps(response)
            
            elapsed_time = (time.perf_counter() - start_time) * 1000  # 毫秒
            cycle_times.append(elapsed_time)
        
        avg_cycle_time = sum(cycle_times) / len(cycle_times)
        max_cycle_time = max(cycle_times)
        
        print(f"\n平均周期时间: {avg_cycle_time:.3f}ms")
        print(f"最大周期时间: {max_cycle_time:.3f}ms")
        
        # 完整周期应该 < 5ms
        assert avg_cycle_time < 5.0, f"平均周期时间 {avg_cycle_time:.3f}ms 超过5ms"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-m", "performance"])
