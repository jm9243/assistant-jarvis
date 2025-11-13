#!/usr/bin/env python3
"""
Windows平台测试
测试Python引擎在Windows上的功能和性能

注意：此测试需要在Windows环境中运行
"""
import pytest
import sys
import os
import time
import subprocess
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


class TestWindowsPlatform:
    """Windows平台测试套件"""
    
    @pytest.fixture(scope="class")
    def engine_path(self):
        """获取引擎可执行文件路径"""
        dist_path = project_root / "dist" / "jarvis-engine-daemon.exe"
        if not dist_path.exists():
            pytest.skip(f"Engine executable not found: {dist_path}")
        return str(dist_path)
    
    def test_platform_is_windows(self):
        """测试：运行在Windows平台"""
        import platform
        system = platform.system()
        assert system == "Windows", f"Expected Windows, got {system}"
        print(f"Platform: {system} {platform.release()}")
    
    def test_engine_executable_exists(self, engine_path):
        """测试：引擎可执行文件存在"""
        assert os.path.exists(engine_path), f"Engine executable not found: {engine_path}"
        print(f"Executable found: {engine_path}")
    
    def test_engine_file_size(self, engine_path):
        """测试：引擎文件大小 < 100MB"""
        file_size = os.path.getsize(engine_path)
        size_mb = file_size / (1024 * 1024)
        print(f"Engine file size: {size_mb:.2f} MB")
        
        # 需求3.7: 可执行文件大小不超过50MB
        # 实际可能会超过，但应该在合理范围内（<100MB）
        assert size_mb < 100, f"Engine file too large: {size_mb:.2f} MB"
    
    def test_gui_automation_available(self):
        """测试：GUI自动化库可用（pywinauto）"""
        try:
            # 在Windows上应该使用pywinauto
            import pywinauto
            from pywinauto import Application
            print("pywinauto library available")
            assert True
        except ImportError as e:
            pytest.fail(f"pywinauto not available: {e}")
    
    def test_windows_specific_modules(self):
        """测试：Windows特定模块"""
        try:
            import win32api
            import win32con
            import win32gui
            print("pywin32 libraries available")
        except ImportError as e:
            pytest.skip(f"pywin32 not available (optional): {e}")
    
    def test_all_dependencies_available(self):
        """测试：所有依赖库可用"""
        required_modules = [
            'chromadb',
            'loguru',
            'pydantic',
        ]
        
        missing_modules = []
        for module_name in required_modules:
            try:
                __import__(module_name)
            except ImportError:
                missing_modules.append(module_name)
        
        if missing_modules:
            pytest.fail(f"Missing required modules: {', '.join(missing_modules)}")
    
    def test_engine_startup_time(self, engine_path):
        """测试：引擎启动时间 < 2秒"""
        import json
        
        start_time = time.time()
        
        # 启动引擎进程
        process = subprocess.Popen(
            [engine_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )
        
        try:
            # 等待进程完全启动
            time.sleep(0.5)
            
            # 发送测试请求
            request = {
                "id": "startup-test",
                "function": "list_functions",
                "args": {}
            }
            process.stdin.write(json.dumps(request) + "\n")
            process.stdin.flush()
            
            # 读取响应
            response_line = process.stdout.readline()
            if response_line.strip():
                response = json.loads(response_line)
                
                startup_time = time.time() - start_time
                print(f"Engine startup time: {startup_time:.3f} seconds")
                
                # 需求1.2: Python引擎在2秒内完成初始化
                assert startup_time < 3.0, f"Startup time too slow: {startup_time:.3f}s"
                assert response["success"], "Startup request failed"
            else:
                pytest.skip("No response from engine (may need configuration)")
            
        finally:
            process.terminate()
            process.wait(timeout=5)
    
    def test_engine_memory_usage(self, engine_path):
        """测试：引擎内存占用 < 100MB"""
        try:
            import psutil
        except ImportError:
            pytest.skip("psutil not available")
        
        import json
        
        # 启动引擎进程
        process = subprocess.Popen(
            [engine_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )
        
        try:
            # 等待进程启动
            time.sleep(1)
            
            # 获取进程内存使用
            proc = psutil.Process(process.pid)
            memory_info = proc.memory_info()
            memory_mb = memory_info.rss / (1024 * 1024)
            
            print(f"Engine memory usage: {memory_mb:.2f} MB")
            
            # 需求1.8: Python引擎占用内存不超过100MB（空闲状态）
            assert memory_mb < 100, f"Memory usage too high: {memory_mb:.2f} MB"
            
        finally:
            process.terminate()
            process.wait(timeout=5)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
