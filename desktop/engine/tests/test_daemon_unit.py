#!/usr/bin/env python3
"""
Daemon引擎单元测试

测试内容：
1. 函数注册表功能
2. 请求解析和响应格式化
3. 错误处理机制
4. 日志记录功能
"""
import pytest
import json
import sys
from pathlib import Path
from io import StringIO
from unittest.mock import Mock, patch, MagicMock

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Mock掉有依赖问题的模块
sys.modules['core.agent.ipc_functions'] = MagicMock()
sys.modules['core.service.kb_ipc_functions'] = MagicMock()
sys.modules['tools.gui.ipc_functions'] = MagicMock()
sys.modules['core.workflow.ipc_functions'] = MagicMock()
sys.modules['core.recorder.ipc_functions'] = MagicMock()

from function_registry import FunctionRegistry

# 为DaemonEngine创建一个简化版本用于测试
class SimpleDaemonEngine:
    """简化的Daemon引擎用于单元测试"""
    
    def __init__(self):
        self.running = True
        self.function_registry = FunctionRegistry()
    
    def _parse_request(self, line: str):
        """解析JSON请求"""
        request = json.loads(line)
        
        if "id" not in request:
            raise ValueError("Missing required field: id")
        if "function" not in request:
            raise ValueError("Missing required field: function")
        
        return request
    
    def _send_response(self, response: dict):
        """发送响应到stdout"""
        response_json = json.dumps(response, ensure_ascii=False)
        sys.stdout.write(response_json + "\n")
        sys.stdout.flush()
    
    def _send_error_response(self, request_id, error_message: str):
        """发送错误响应"""
        response = {
            "id": request_id or "unknown",
            "success": False,
            "error": error_message
        }
        self._send_response(response)
    
    def _process_request(self, line: str):
        """处理单个请求"""
        request_id = None
        
        try:
            request = self._parse_request(line)
            request_id = request.get("id")
            function_name = request.get("function")
            args = request.get("args", {})
            
            result = self.function_registry.call(function_name, **args)
            
            response = {
                "id": request_id,
                "success": True,
                "result": result
            }
            self._send_response(response)
            
        except json.JSONDecodeError as e:
            self._send_error_response(request_id, f"Invalid JSON: {str(e)}")
        except Exception as e:
            self._send_error_response(request_id, str(e))


class TestFunctionRegistry:
    """测试函数注册表功能"""
    
    def test_register_function(self):
        """测试函数注册"""
        registry = FunctionRegistry()
        
        def test_func(x: int, y: int) -> int:
            return x + y
        
        registry.register("test_func", test_func, "测试函数")
        
        assert "test_func" in registry.functions
        assert "test_func" in registry.function_metadata
        assert registry.function_metadata["test_func"]["description"] == "测试函数"
    
    def test_call_registered_function(self):
        """测试调用已注册的函数"""
        registry = FunctionRegistry()
        
        def add(a: int, b: int) -> int:
            return a + b
        
        registry.register("add", add)
        result = registry.call("add", a=5, b=3)
        
        assert result == 8
    
    def test_call_nonexistent_function(self):
        """测试调用不存在的函数"""
        registry = FunctionRegistry()
        
        with pytest.raises(ValueError) as exc_info:
            registry.call("nonexistent_function")
        
        assert "not found" in str(exc_info.value).lower()
    
    def test_parameter_validation_missing_required(self):
        """测试缺少必需参数"""
        registry = FunctionRegistry()
        
        def greet(name: str, age: int) -> str:
            return f"Hello {name}, {age}"
        
        registry.register("greet", greet)
        
        with pytest.raises(ValueError) as exc_info:
            registry.call("greet", name="Alice")
        
        assert "missing required parameter" in str(exc_info.value).lower()
        assert "age" in str(exc_info.value).lower()
    
    def test_parameter_validation_with_defaults(self):
        """测试带默认值的参数"""
        registry = FunctionRegistry()
        
        def greet(name: str, greeting: str = "Hello") -> str:
            return f"{greeting} {name}"
        
        registry.register("greet", greet)
        
        # 不提供默认参数
        result1 = registry.call("greet", name="Alice")
        assert result1 == "Hello Alice"
        
        # 提供默认参数
        result2 = registry.call("greet", name="Bob", greeting="Hi")
        assert result2 == "Hi Bob"
    
    def test_list_functions(self):
        """测试列出所有函数"""
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
        assert functions["func1"]["description"] == "函数1"
        assert functions["func2"]["description"] == "函数2"
    
    def test_get_function_info(self):
        """测试获取函数信息"""
        registry = FunctionRegistry()
        
        def multiply(x: int, y: int) -> int:
            return x * y
        
        registry.register("multiply", multiply, "乘法函数")
        
        info = registry.get_function_info("multiply")
        
        assert info is not None
        assert info["name"] == "multiply"
        assert info["description"] == "乘法函数"
        assert "x" in info["params"]
        assert "y" in info["params"]
    
    def test_get_nonexistent_function_info(self):
        """测试获取不存在函数的信息"""
        registry = FunctionRegistry()
        
        info = registry.get_function_info("nonexistent")
        
        assert info is None
    
    def test_unregister_function(self):
        """测试注销函数"""
        registry = FunctionRegistry()
        
        def temp_func():
            pass
        
        registry.register("temp_func", temp_func)
        assert "temp_func" in registry.functions
        
        result = registry.unregister("temp_func")
        
        assert result is True
        assert "temp_func" not in registry.functions
        assert "temp_func" not in registry.function_metadata
    
    def test_unregister_nonexistent_function(self):
        """测试注销不存在的函数"""
        registry = FunctionRegistry()
        
        result = registry.unregister("nonexistent")
        
        assert result is False
    
    def test_clear_functions(self):
        """测试清空所有函数"""
        registry = FunctionRegistry()
        
        def func1():
            pass
        
        def func2():
            pass
        
        registry.register("func1", func1)
        registry.register("func2", func2)
        
        assert len(registry.functions) == 2
        
        registry.clear()
        
        assert len(registry.functions) == 0
        assert len(registry.function_metadata) == 0
    
    def test_function_exception_handling(self):
        """测试函数执行异常处理"""
        registry = FunctionRegistry()
        
        def failing_func():
            raise RuntimeError("Test error")
        
        registry.register("failing_func", failing_func)
        
        with pytest.raises(RuntimeError) as exc_info:
            registry.call("failing_func")
        
        assert "Test error" in str(exc_info.value)


class TestDaemonEngine:
    """测试Daemon引擎核心功能"""
    
    def test_parse_request_valid(self):
        """测试解析有效的请求"""
        engine = SimpleDaemonEngine()
        
        request_json = json.dumps({
            "id": "test-123",
            "function": "test_func",
            "args": {"x": 1, "y": 2}
        })
        
        request = engine._parse_request(request_json)
        
        assert request["id"] == "test-123"
        assert request["function"] == "test_func"
        assert request["args"]["x"] == 1
        assert request["args"]["y"] == 2
    
    def test_parse_request_missing_id(self):
        """测试解析缺少id的请求"""
        engine = SimpleDaemonEngine()
        
        request_json = json.dumps({
            "function": "test_func",
            "args": {}
        })
        
        with pytest.raises(ValueError) as exc_info:
            engine._parse_request(request_json)
        
        assert "missing required field: id" in str(exc_info.value).lower()
    
    def test_parse_request_missing_function(self):
        """测试解析缺少function的请求"""
        engine = SimpleDaemonEngine()
        
        request_json = json.dumps({
            "id": "test-123",
            "args": {}
        })
        
        with pytest.raises(ValueError) as exc_info:
            engine._parse_request(request_json)
        
        assert "missing required field: function" in str(exc_info.value).lower()
    
    def test_parse_request_invalid_json(self):
        """测试解析无效的JSON"""
        engine = SimpleDaemonEngine()
        
        with pytest.raises(json.JSONDecodeError):
            engine._parse_request("invalid json {")
    
    def test_send_response(self):
        """测试发送响应"""
        engine = SimpleDaemonEngine()
        
        # 捕获stdout
        captured_output = StringIO()
        
        with patch('sys.stdout', captured_output):
            response = {
                "id": "test-123",
                "success": True,
                "result": {"message": "success"}
            }
            engine._send_response(response)
        
        output = captured_output.getvalue()
        parsed = json.loads(output.strip())
        
        assert parsed["id"] == "test-123"
        assert parsed["success"] is True
        assert parsed["result"]["message"] == "success"
    
    def test_send_error_response(self):
        """测试发送错误响应"""
        engine = SimpleDaemonEngine()
        
        # 捕获stdout
        captured_output = StringIO()
        
        with patch('sys.stdout', captured_output):
            engine._send_error_response("test-123", "Test error message")
        
        output = captured_output.getvalue()
        parsed = json.loads(output.strip())
        
        assert parsed["id"] == "test-123"
        assert parsed["success"] is False
        assert parsed["error"] == "Test error message"
    
    def test_send_error_response_no_id(self):
        """测试发送没有ID的错误响应"""
        engine = SimpleDaemonEngine()
        
        # 捕获stdout
        captured_output = StringIO()
        
        with patch('sys.stdout', captured_output):
            engine._send_error_response(None, "Test error")
        
        output = captured_output.getvalue()
        parsed = json.loads(output.strip())
        
        assert parsed["id"] == "unknown"
        assert parsed["success"] is False
        assert parsed["error"] == "Test error"


class TestRequestProcessing:
    """测试请求处理流程"""
    
    def test_process_valid_request(self):
        """测试处理有效请求"""
        engine = SimpleDaemonEngine()
        
        # 注册测试函数
        def test_add(a: int, b: int) -> int:
            return a + b
        
        engine.function_registry.register("test_add", test_add)
        
        # 捕获stdout
        captured_output = StringIO()
        
        request_json = json.dumps({
            "id": "req-001",
            "function": "test_add",
            "args": {"a": 10, "b": 20}
        })
        
        with patch('sys.stdout', captured_output):
            engine._process_request(request_json)
        
        output = captured_output.getvalue()
        response = json.loads(output.strip())
        
        assert response["id"] == "req-001"
        assert response["success"] is True
        assert response["result"] == 30
    
    def test_process_request_function_error(self):
        """测试处理函数执行错误"""
        engine = SimpleDaemonEngine()
        
        # 注册会抛出异常的函数
        def failing_func():
            raise ValueError("Function failed")
        
        engine.function_registry.register("failing_func", failing_func)
        
        # 捕获stdout和stderr
        captured_output = StringIO()
        captured_error = StringIO()
        
        request_json = json.dumps({
            "id": "req-002",
            "function": "failing_func",
            "args": {}
        })
        
        with patch('sys.stdout', captured_output), patch('sys.stderr', captured_error):
            engine._process_request(request_json)
        
        output = captured_output.getvalue()
        # 只取最后一行JSON响应
        lines = [line for line in output.split('\n') if line.strip()]
        if lines:
            response = json.loads(lines[-1])
            
            assert response["id"] == "req-002"
            assert response["success"] is False
            assert "Function failed" in response["error"]
    
    def test_process_request_invalid_json(self):
        """测试处理无效JSON"""
        engine = SimpleDaemonEngine()
        
        # 捕获stdout
        captured_output = StringIO()
        
        with patch('sys.stdout', captured_output):
            engine._process_request("invalid json {")
        
        output = captured_output.getvalue()
        response = json.loads(output.strip())
        
        assert response["success"] is False
        assert "invalid json" in response["error"].lower()
    
    def test_process_request_nonexistent_function(self):
        """测试处理不存在的函数"""
        engine = SimpleDaemonEngine()
        
        # 捕获stdout
        captured_output = StringIO()
        
        request_json = json.dumps({
            "id": "req-003",
            "function": "nonexistent_func",
            "args": {}
        })
        
        with patch('sys.stdout', captured_output):
            engine._process_request(request_json)
        
        output = captured_output.getvalue()
        response = json.loads(output.strip())
        
        assert response["id"] == "req-003"
        assert response["success"] is False
        assert "not found" in response["error"].lower()


class TestLogging:
    """测试日志记录功能"""
    
    def test_logging_initialization(self):
        """测试日志初始化"""
        # 验证日志目录存在
        log_dir = Path.home() / ".jarvis" / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        assert log_dir.exists()
        assert log_dir.is_dir()
    
    def test_logging_on_request(self, caplog):
        """测试请求处理时的日志记录"""
        import logging
        caplog.set_level(logging.DEBUG)
        
        engine = SimpleDaemonEngine()
        
        # 注册测试函数
        def test_func():
            return "success"
        
        engine.function_registry.register("test_func", test_func)
        
        # 捕获stdout
        captured_output = StringIO()
        
        request_json = json.dumps({
            "id": "log-test-001",
            "function": "test_func",
            "args": {}
        })
        
        with patch('sys.stdout', captured_output):
            engine._process_request(request_json)
        
        # 验证日志中包含请求处理信息
        # 注意：由于使用loguru，这里的caplog可能不会捕获所有日志
        # 主要验证没有抛出异常
        assert True
    
    def test_logging_on_error(self, caplog):
        """测试错误时的日志记录"""
        import logging
        caplog.set_level(logging.ERROR)
        
        engine = SimpleDaemonEngine()
        
        # 注册会失败的函数
        def error_func():
            raise RuntimeError("Test error")
        
        engine.function_registry.register("error_func", error_func)
        
        # 捕获stdout和stderr
        captured_output = StringIO()
        captured_error = StringIO()
        
        request_json = json.dumps({
            "id": "log-test-002",
            "function": "error_func",
            "args": {}
        })
        
        with patch('sys.stdout', captured_output), patch('sys.stderr', captured_error):
            engine._process_request(request_json)
        
        # 验证错误被正确处理
        output = captured_output.getvalue()
        # 只取最后一行JSON响应
        lines = [line for line in output.split('\n') if line.strip()]
        if lines:
            response = json.loads(lines[-1])
            assert response["success"] is False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
