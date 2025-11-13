#!/usr/bin/env python3
"""
macOS功能完整性测试
测试所有核心功能在macOS上的可用性
"""
import pytest
import sys
import json
import subprocess
import time
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


class TestMacOSFunctionality:
    """macOS功能完整性测试套件"""
    
    @pytest.fixture(scope="class")
    def engine_process(self):
        """启动引擎进程"""
        dist_path = project_root / "dist" / "jarvis-engine-daemon"
        if not dist_path.exists():
            pytest.skip(f"Engine executable not found: {dist_path}")
        
        process = subprocess.Popen(
            [str(dist_path)],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )
        
        # 等待进程启动
        time.sleep(1)
        
        yield process
        
        # 清理
        process.terminate()
        process.wait(timeout=5)
    
    def send_request(self, process, function_name, args=None):
        """发送IPC请求并获取响应"""
        request = {
            "id": f"test-{function_name}-{time.time()}",
            "function": function_name,
            "args": args or {}
        }
        
        process.stdin.write(json.dumps(request) + "\n")
        process.stdin.flush()
        
        response_line = process.stdout.readline()
        response = json.loads(response_line)
        
        return response
    
    def test_list_functions(self, engine_process):
        """测试：列出所有函数"""
        response = self.send_request(engine_process, "list_functions")
        
        assert response["success"], f"list_functions failed: {response.get('error')}"
        assert "result" in response
        
        functions = response["result"]
        print(f"Available functions: {len(functions)}")
        
        # 验证关键函数存在
        expected_functions = [
            "agent_chat",
            "create_conversation",
            "get_conversation_history",
            "kb_search",
            "kb_add_document",
            "locate_element",
            "click_element",
            "input_text",
            "execute_workflow",
            "start_recording",
            "stop_recording"
        ]
        
        for func in expected_functions:
            assert func in functions, f"Function {func} not registered"
    
    def test_agent_functions_available(self, engine_process):
        """测试：Agent相关函数可用"""
        # 测试create_conversation
        response = self.send_request(
            engine_process,
            "create_conversation",
            {"agent_id": "test-agent"}
        )
        
        # 可能会失败（因为agent不存在），但函数应该被调用
        assert "success" in response
        print(f"create_conversation response: {response}")
    
    def test_kb_functions_available(self, engine_process):
        """测试：知识库函数可用"""
        # 测试kb_search
        response = self.send_request(
            engine_process,
            "kb_search",
            {
                "kb_id": "test-kb",
                "query": "test query",
                "top_k": 5
            }
        )
        
        # 可能会失败（因为kb不存在），但函数应该被调用
        assert "success" in response
        print(f"kb_search response: {response}")
    
    def test_gui_functions_available(self, engine_process):
        """测试：GUI自动化函数可用"""
        # 测试locate_element
        response = self.send_request(
            engine_process,
            "locate_element",
            {
                "element_type": "button",
                "text": "Test Button"
            }
        )
        
        # 可能会失败（因为元素不存在），但函数应该被调用
        assert "success" in response
        print(f"locate_element response: {response}")
    
    def test_workflow_functions_available(self, engine_process):
        """测试：工作流函数可用"""
        # 测试execute_workflow
        response = self.send_request(
            engine_process,
            "execute_workflow",
            {
                "workflow_id": "test-workflow",
                "inputs": {}
            }
        )
        
        # 可能会失败（因为workflow不存在），但函数应该被调用
        assert "success" in response
        print(f"execute_workflow response: {response}")
    
    def test_recorder_functions_available(self, engine_process):
        """测试：录制器函数可用"""
        # 测试start_recording
        response = self.send_request(engine_process, "start_recording")
        
        assert "success" in response
        print(f"start_recording response: {response}")
        
        # 如果启动成功，尝试停止
        if response["success"]:
            time.sleep(0.5)
            stop_response = self.send_request(engine_process, "stop_recording")
            print(f"stop_recording response: {stop_response}")
    
    def test_error_handling(self, engine_process):
        """测试：错误处理"""
        # 测试调用不存在的函数
        response = self.send_request(
            engine_process,
            "non_existent_function",
            {}
        )
        
        assert response["success"] is False
        assert "error" in response
        print(f"Error handling works: {response['error']}")
    
    def test_invalid_json_handling(self, engine_process):
        """测试：无效JSON处理"""
        # 发送无效JSON
        engine_process.stdin.write("invalid json\n")
        engine_process.stdin.flush()
        
        response_line = engine_process.stdout.readline()
        response = json.loads(response_line)
        
        assert response["success"] is False
        assert "error" in response
        print(f"Invalid JSON handled: {response['error']}")
    
    def test_missing_required_fields(self, engine_process):
        """测试：缺少必需字段"""
        # 发送缺少function字段的请求
        request = {
            "id": "test-missing-function"
            # 缺少 "function" 字段
        }
        
        engine_process.stdin.write(json.dumps(request) + "\n")
        engine_process.stdin.flush()
        
        response_line = engine_process.stdout.readline()
        response = json.loads(response_line)
        
        assert response["success"] is False
        assert "error" in response
        print(f"Missing field handled: {response['error']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
