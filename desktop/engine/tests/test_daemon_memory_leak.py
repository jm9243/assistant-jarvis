#!/usr/bin/env python3
"""
Daemon引擎内存泄漏测试

测试内容：
1. 执行1000次调用测试
2. 监控内存增长
3. 验证无内存泄漏
"""
import pytest
import time
import psutil
import os
import sys
import gc
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from function_registry import FunctionRegistry


@pytest.mark.performance
class TestMemoryLeak:
    """内存泄漏测试"""
    
    def get_memory_usage_mb(self):
        """获取当前进程内存使用量（MB）"""
        process = psutil.Process(os.getpid())
        return process.memory_info().rss / 1024 / 1024
    
    def test_no_memory_leak_simple_calls(self):
        """测试简单函数调用无内存泄漏"""
        registry = FunctionRegistry()
        
        # 注册测试函数
        def simple_func(x: int) -> int:
            return x * 2
        
        registry.register("simple_func", simple_func)
        
        # 预热
        for _ in range(100):
            registry.call("simple_func", x=5)
        
        # 强制垃圾回收
        gc.collect()
        
        # 记录初始内存
        initial_memory = self.get_memory_usage_mb()
        print(f"\n初始内存: {initial_memory:.2f}MB")
        
        # 执行1000次调用
        for i in range(1000):
            result = registry.call("simple_func", x=i)
            assert result == i * 2
        
        # 强制垃圾回收
        gc.collect()
        
        # 记录最终内存
        final_memory = self.get_memory_usage_mb()
        memory_increase = final_memory - initial_memory
        
        print(f"最终内存: {final_memory:.2f}MB")
        print(f"内存增长: {memory_increase:.2f}MB")
        
        # 内存增长应该很小（< 5MB）
        assert memory_increase < 5.0, f"内存增长 {memory_increase:.2f}MB 可能存在内存泄漏"
    
    def test_no_memory_leak_with_large_data(self):
        """测试处理大数据时无内存泄漏"""
        registry = FunctionRegistry()
        
        # 注册处理大数据的函数
        def process_large_data(data: list) -> int:
            return len(data)
        
        registry.register("process_large_data", process_large_data)
        
        # 预热
        test_data = list(range(1000))
        for _ in range(10):
            registry.call("process_large_data", data=test_data)
        
        # 强制垃圾回收
        gc.collect()
        
        # 记录初始内存
        initial_memory = self.get_memory_usage_mb()
        print(f"\n初始内存: {initial_memory:.2f}MB")
        
        # 执行1000次调用，每次处理大数据
        for i in range(1000):
            large_data = list(range(10000))  # 每次创建新的大数据
            result = registry.call("process_large_data", data=large_data)
            assert result == 10000
            
            # 每100次调用检查一次内存
            if (i + 1) % 100 == 0:
                gc.collect()
                current_memory = self.get_memory_usage_mb()
                print(f"第{i+1}次调用后内存: {current_memory:.2f}MB")
        
        # 强制垃圾回收
        gc.collect()
        time.sleep(0.1)  # 等待垃圾回收完成
        gc.collect()
        
        # 记录最终内存
        final_memory = self.get_memory_usage_mb()
        memory_increase = final_memory - initial_memory
        
        print(f"最终内存: {final_memory:.2f}MB")
        print(f"内存增长: {memory_increase:.2f}MB")
        
        # 内存增长应该很小（< 10MB）
        assert memory_increase < 10.0, f"内存增长 {memory_increase:.2f}MB 可能存在内存泄漏"
    
    def test_no_memory_leak_function_registration(self):
        """测试函数注册和注销无内存泄漏"""
        registry = FunctionRegistry()
        
        # 强制垃圾回收
        gc.collect()
        
        # 记录初始内存
        initial_memory = self.get_memory_usage_mb()
        print(f"\n初始内存: {initial_memory:.2f}MB")
        
        # 重复注册和注销函数
        for i in range(1000):
            # 注册函数
            def temp_func(x: int = i) -> int:
                return x + 1
            
            func_name = f"temp_func_{i % 100}"  # 只保留100个函数
            registry.register(func_name, temp_func)
            
            # 调用函数
            result = registry.call(func_name, x=i)
            assert result == i + 1
            
            # 注销旧函数
            if i >= 100:
                old_func_name = f"temp_func_{(i - 100) % 100}"
                registry.unregister(old_func_name)
            
            # 每100次检查一次内存
            if (i + 1) % 100 == 0:
                gc.collect()
                current_memory = self.get_memory_usage_mb()
                print(f"第{i+1}次操作后内存: {current_memory:.2f}MB")
        
        # 清空所有函数
        registry.clear()
        
        # 强制垃圾回收
        gc.collect()
        time.sleep(0.1)
        gc.collect()
        
        # 记录最终内存
        final_memory = self.get_memory_usage_mb()
        memory_increase = final_memory - initial_memory
        
        print(f"最终内存: {final_memory:.2f}MB")
        print(f"内存增长: {memory_increase:.2f}MB")
        
        # 内存增长应该很小（< 5MB）
        assert memory_increase < 5.0, f"内存增长 {memory_increase:.2f}MB 可能存在内存泄漏"
    
    def test_no_memory_leak_with_exceptions(self):
        """测试异常处理时无内存泄漏"""
        registry = FunctionRegistry()
        
        # 注册会抛出异常的函数
        def failing_func(should_fail: bool = True):
            if should_fail:
                raise ValueError("Test error")
            return "success"
        
        registry.register("failing_func", failing_func)
        
        # 预热
        for _ in range(10):
            try:
                registry.call("failing_func", should_fail=True)
            except ValueError:
                pass
        
        # 强制垃圾回收
        gc.collect()
        
        # 记录初始内存
        initial_memory = self.get_memory_usage_mb()
        print(f"\n初始内存: {initial_memory:.2f}MB")
        
        # 执行1000次调用，一半成功一半失败
        success_count = 0
        error_count = 0
        
        for i in range(1000):
            try:
                result = registry.call("failing_func", should_fail=(i % 2 == 0))
                success_count += 1
            except ValueError:
                error_count += 1
            
            # 每100次检查一次内存
            if (i + 1) % 100 == 0:
                gc.collect()
                current_memory = self.get_memory_usage_mb()
                print(f"第{i+1}次调用后内存: {current_memory:.2f}MB (成功:{success_count}, 失败:{error_count})")
        
        # 强制垃圾回收
        gc.collect()
        time.sleep(0.1)
        gc.collect()
        
        # 记录最终内存
        final_memory = self.get_memory_usage_mb()
        memory_increase = final_memory - initial_memory
        
        print(f"最终内存: {final_memory:.2f}MB")
        print(f"内存增长: {memory_increase:.2f}MB")
        print(f"总计 - 成功: {success_count}, 失败: {error_count}")
        
        # 验证调用次数
        assert success_count == 500
        assert error_count == 500
        
        # 内存增长应该很小（< 5MB）
        assert memory_increase < 5.0, f"内存增长 {memory_increase:.2f}MB 可能存在内存泄漏"
    
    def test_no_memory_leak_concurrent_pattern(self):
        """测试并发模式下无内存泄漏"""
        registry = FunctionRegistry()
        
        # 注册多个函数
        for i in range(10):
            def func(x: int = i) -> int:
                return x * 2
            registry.register(f"func_{i}", func)
        
        # 预热
        for _ in range(10):
            for j in range(10):
                registry.call(f"func_{j}", x=1)
        
        # 强制垃圾回收
        gc.collect()
        
        # 记录初始内存
        initial_memory = self.get_memory_usage_mb()
        print(f"\n初始内存: {initial_memory:.2f}MB")
        
        # 模拟并发调用模式（快速切换不同函数）
        for round_num in range(100):
            for func_id in range(10):
                result = registry.call(f"func_{func_id}", x=round_num)
                assert result == round_num * 2
            
            # 每10轮检查一次内存
            if (round_num + 1) % 10 == 0:
                gc.collect()
                current_memory = self.get_memory_usage_mb()
                print(f"第{(round_num+1)*10}次调用后内存: {current_memory:.2f}MB")
        
        # 强制垃圾回收
        gc.collect()
        time.sleep(0.1)
        gc.collect()
        
        # 记录最终内存
        final_memory = self.get_memory_usage_mb()
        memory_increase = final_memory - initial_memory
        
        print(f"最终内存: {final_memory:.2f}MB")
        print(f"内存增长: {memory_increase:.2f}MB")
        
        # 内存增长应该很小（< 5MB）
        assert memory_increase < 5.0, f"内存增长 {memory_increase:.2f}MB 可能存在内存泄漏"
    
    def test_memory_stability_over_time(self):
        """测试长时间运行的内存稳定性"""
        registry = FunctionRegistry()
        
        # 注册测试函数
        def stable_func(data: dict) -> int:
            return len(data)
        
        registry.register("stable_func", stable_func)
        
        # 强制垃圾回收
        gc.collect()
        
        # 记录初始内存
        initial_memory = self.get_memory_usage_mb()
        print(f"\n初始内存: {initial_memory:.2f}MB")
        
        memory_samples = []
        
        # 执行1000次调用，定期采样内存
        for i in range(1000):
            test_data = {"key": f"value_{i}", "index": i}
            result = registry.call("stable_func", data=test_data)
            assert result == 2
            
            # 每50次采样一次内存
            if (i + 1) % 50 == 0:
                gc.collect()
                current_memory = self.get_memory_usage_mb()
                memory_samples.append(current_memory)
                print(f"第{i+1}次调用后内存: {current_memory:.2f}MB")
        
        # 强制垃圾回收
        gc.collect()
        time.sleep(0.1)
        gc.collect()
        
        # 记录最终内存
        final_memory = self.get_memory_usage_mb()
        memory_increase = final_memory - initial_memory
        
        print(f"最终内存: {final_memory:.2f}MB")
        print(f"内存增长: {memory_increase:.2f}MB")
        
        # 分析内存趋势
        if len(memory_samples) >= 2:
            # 计算内存增长趋势
            first_half_avg = sum(memory_samples[:len(memory_samples)//2]) / (len(memory_samples)//2)
            second_half_avg = sum(memory_samples[len(memory_samples)//2:]) / (len(memory_samples) - len(memory_samples)//2)
            trend = second_half_avg - first_half_avg
            
            print(f"前半段平均内存: {first_half_avg:.2f}MB")
            print(f"后半段平均内存: {second_half_avg:.2f}MB")
            print(f"内存趋势: {trend:.2f}MB")
            
            # 内存趋势应该很小（< 3MB）
            assert abs(trend) < 3.0, f"内存趋势 {trend:.2f}MB 表明可能存在内存泄漏"
        
        # 总体内存增长应该很小（< 5MB）
        assert memory_increase < 5.0, f"内存增长 {memory_increase:.2f}MB 可能存在内存泄漏"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-m", "performance", "-s"])
