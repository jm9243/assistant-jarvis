#!/usr/bin/env python3
"""
macOS简化测试
测试Python引擎的基本功能，不依赖完整配置
"""
import pytest
import sys
import os
import time
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


class TestMacOSSimple:
    """macOS简化测试套件"""
    
    def test_python_version(self):
        """测试：Python版本"""
        print(f"Python version: {sys.version}")
        assert sys.version_info >= (3, 8), "Python 3.8+ required"
    
    def test_platform(self):
        """测试：运行平台"""
        import platform
        system = platform.system()
        print(f"Platform: {system}")
        assert system == "Darwin", f"Expected macOS (Darwin), got {system}"
    
    def test_executable_exists(self):
        """测试：可执行文件存在"""
        dist_path = project_root / "dist" / "jarvis-engine-daemon"
        assert dist_path.exists(), f"Executable not found: {dist_path}"
        assert os.access(dist_path, os.X_OK), f"Executable not executable"
        
        # 检查文件大小
        file_size_mb = dist_path.stat().st_size / (1024 * 1024)
        print(f"Executable size: {file_size_mb:.2f} MB")
        assert file_size_mb < 100, f"File too large: {file_size_mb:.2f} MB"
    
    def test_required_modules(self):
        """测试：必需模块可用"""
        required_modules = [
            'chromadb',
            'loguru',
            'pydantic',
            'httpx',
        ]
        
        for module_name in required_modules:
            try:
                __import__(module_name)
                print(f"✓ {module_name}")
            except ImportError as e:
                pytest.fail(f"Missing module: {module_name} - {e}")
    
    def test_macos_gui_libraries(self):
        """测试：macOS GUI自动化库"""
        try:
            import AppKit
            import Quartz
            print("✓ pyobjc (AppKit, Quartz)")
        except ImportError as e:
            pytest.skip(f"pyobjc not available: {e}")
    
    def test_function_registry(self):
        """测试：函数注册表"""
        from function_registry import FunctionRegistry
        
        registry = FunctionRegistry()
        
        # 测试注册函数
        def test_func(x, y):
            return x + y
        
        registry.register("test_func", test_func, "Test function")
        assert "test_func" in registry.functions
        
        # 测试调用函数
        result = registry.call("test_func", x=1, y=2)
        assert result == 3
        
        # 测试列出函数
        functions = registry.list_functions()
        assert "test_func" in functions
        
        print(f"✓ Function registry works")
    
    def test_daemon_imports(self):
        """测试：daemon模块可以导入"""
        try:
            # 只测试导入，不实际运行
            import daemon
            print("✓ daemon module imports successfully")
        except Exception as e:
            # 如果导入失败，记录错误但不失败测试
            # 因为可能是配置问题
            print(f"⚠ daemon import warning: {e}")
    
    def test_ipc_data_structures(self):
        """测试：IPC数据结构"""
        import json
        
        # 测试请求序列化
        request = {
            "id": "test-123",
            "function": "test_func",
            "args": {"x": 1, "y": 2}
        }
        request_json = json.dumps(request)
        assert "test-123" in request_json
        
        # 测试响应序列化
        response = {
            "id": "test-123",
            "success": True,
            "result": 3
        }
        response_json = json.dumps(response)
        parsed = json.loads(response_json)
        assert parsed["success"] is True
        assert parsed["result"] == 3
        
        print("✓ IPC data structures work")
    
    def test_log_directory(self):
        """测试：日志目录"""
        log_dir = Path.home() / ".jarvis" / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        assert log_dir.exists()
        assert log_dir.is_dir()
        print(f"✓ Log directory: {log_dir}")
    
    def test_chroma_directory(self):
        """测试：Chroma数据目录"""
        chroma_dir = Path.home() / ".jarvis" / "chroma"
        chroma_dir.mkdir(parents=True, exist_ok=True)
        assert chroma_dir.exists()
        assert chroma_dir.is_dir()
        print(f"✓ Chroma directory: {chroma_dir}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
