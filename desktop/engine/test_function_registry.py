#!/usr/bin/env python3
"""
函数注册表测试脚本
用于验证函数注册表的基本功能
"""
import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from function_registry import FunctionRegistry


def test_basic_registration():
    """测试基本的函数注册和调用"""
    print("测试1: 基本函数注册和调用")
    
    registry = FunctionRegistry()
    
    # 定义测试函数
    def add(a: int, b: int) -> int:
        return a + b
    
    # 注册函数
    registry.register("add", add, "加法函数")
    
    # 调用函数
    result = registry.call("add", a=1, b=2)
    assert result == 3, f"Expected 3, got {result}"
    
    print("✓ 基本函数注册和调用测试通过")


def test_function_not_found():
    """测试调用不存在的函数"""
    print("\n测试2: 调用不存在的函数")
    
    registry = FunctionRegistry()
    
    try:
        registry.call("nonexistent_function")
        assert False, "Should raise ValueError"
    except ValueError as e:
        assert "not found" in str(e).lower()
        print(f"✓ 正确抛出异常: {e}")


def test_parameter_validation():
    """测试参数验证"""
    print("\n测试3: 参数验证")
    
    registry = FunctionRegistry()
    
    def greet(name: str, age: int) -> str:
        return f"Hello {name}, you are {age} years old"
    
    registry.register("greet", greet, "问候函数")
    
    # 测试缺少必需参数
    try:
        registry.call("greet", name="Alice")
        assert False, "Should raise ValueError for missing parameter"
    except ValueError as e:
        assert "missing required parameter" in str(e).lower()
        print(f"✓ 正确检测缺少参数: {e}")
    
    # 测试正常调用
    result = registry.call("greet", name="Alice", age=30)
    assert "Alice" in result and "30" in result
    print(f"✓ 正常调用成功: {result}")


def test_list_functions():
    """测试列出所有函数"""
    print("\n测试4: 列出所有函数")
    
    registry = FunctionRegistry()
    
    def func1():
        pass
    
    def func2():
        pass
    
    registry.register("func1", func1, "函数1")
    registry.register("func2", func2, "函数2")
    
    functions = registry.list_functions()
    assert len(functions) == 2
    assert "func1" in functions
    assert "func2" in functions
    
    print(f"✓ 成功列出 {len(functions)} 个函数")
    for name, info in functions.items():
        print(f"  - {name}: {info['description']}")


def test_get_function_info():
    """测试获取函数信息"""
    print("\n测试5: 获取函数信息")
    
    registry = FunctionRegistry()
    
    def multiply(x: int, y: int) -> int:
        """乘法函数"""
        return x * y
    
    registry.register("multiply", multiply, "乘法函数")
    
    info = registry.get_function_info("multiply")
    assert info is not None
    assert info["name"] == "multiply"
    assert info["description"] == "乘法函数"
    assert "x" in info["params"]
    assert "y" in info["params"]
    
    print(f"✓ 成功获取函数信息:")
    print(f"  名称: {info['name']}")
    print(f"  描述: {info['description']}")
    print(f"  参数: {list(info['params'].keys())}")


def test_unregister():
    """测试注销函数"""
    print("\n测试6: 注销函数")
    
    registry = FunctionRegistry()
    
    def temp_func():
        pass
    
    registry.register("temp_func", temp_func)
    assert "temp_func" in registry.functions
    
    # 注销函数
    result = registry.unregister("temp_func")
    assert result is True
    assert "temp_func" not in registry.functions
    
    # 尝试注销不存在的函数
    result = registry.unregister("nonexistent")
    assert result is False
    
    print("✓ 函数注销测试通过")


def main():
    """运行所有测试"""
    print("=" * 60)
    print("函数注册表测试")
    print("=" * 60)
    
    try:
        test_basic_registration()
        test_function_not_found()
        test_parameter_validation()
        test_list_functions()
        test_get_function_info()
        test_unregister()
        
        print("\n" + "=" * 60)
        print("✓ 所有测试通过！")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
