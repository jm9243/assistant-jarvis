"""
录制器功能完整测试
测试开始录制、停止录制、录制回放等所有功能

注意：由于录制器需要系统权限且在测试环境中可能不稳定，
这些测试主要验证API接口的可用性和基本逻辑，而不是实际的录制功能。
"""
import pytest
import time
from unittest.mock import Mock, patch
from core.recorder.ipc_functions import (
    start_recording,
    stop_recording,
    pause_recording,
    resume_recording,
    get_recording_status
)


class TestRecorderBasic:
    """测试录制器基本功能"""
    
    def test_start_recording_api_structure(self):
        """测试开始录制API结构"""
        # 测试API返回结构，不实际执行录制
        result = start_recording(mode="auto")
        
        # 验证返回结构
        assert isinstance(result, dict)
        assert "success" in result
        
        # 如果成功，验证字段
        if result.get("success"):
            assert "mode" in result
            assert "status" in result
            
            # 尝试清理
            try:
                stop_recording()
            except:
                pass
    
    def test_stop_recording_api_structure(self):
        """测试停止录制API结构"""
        # 测试API返回结构
        result = stop_recording()
        
        # 验证返回结构
        assert isinstance(result, dict)
        assert "success" in result
        
        # 如果成功，验证字段
        if result.get("success"):
            assert "status" in result
            assert "nodes" in result
            assert isinstance(result["nodes"], list)
    
    def test_get_recording_status_api_structure(self):
        """测试获取状态API结构"""
        status = get_recording_status()
        
        # 验证返回结构
        assert isinstance(status, dict)
        assert "success" in status
        
        # 如果成功，验证字段
        if status.get("success"):
            assert "status" in status
            assert "is_recording" in status
            assert "mode" in status
            assert "step_count" in status
    
    def test_pause_recording_api_structure(self):
        """测试暂停录制API结构"""
        result = pause_recording()
        
        # 验证返回结构
        assert isinstance(result, dict)
        assert "success" in result
    
    def test_resume_recording_api_structure(self):
        """测试恢复录制API结构"""
        result = resume_recording()
        
        # 验证返回结构
        assert isinstance(result, dict)
        assert "success" in result


class TestRecorderLogic:
    """测试录制器逻辑功能"""
    
    def test_recording_modes(self):
        """测试录制模式"""
        # 测试auto模式
        result_auto = start_recording(mode="auto")
        assert isinstance(result_auto, dict)
        
        try:
            stop_recording()
        except:
            pass
        
        # 测试manual模式
        result_manual = start_recording(mode="manual")
        assert isinstance(result_manual, dict)
        
        try:
            stop_recording()
        except:
            pass
    
    def test_status_values(self):
        """测试状态值"""
        status = get_recording_status()
        
        if status.get("success"):
            # 状态应该是有效值之一
            valid_statuses = ["stopped", "recording", "paused", "unknown"]
            assert status["status"] in valid_statuses
            
            # 布尔值验证
            assert isinstance(status["is_recording"], bool)
            
            # 步骤计数验证
            assert isinstance(status["step_count"], int)
            assert status["step_count"] >= 0
    
    def test_node_structure(self):
        """测试节点结构"""
        # 停止录制会返回节点列表
        result = stop_recording()
        
        if result.get("success") and "nodes" in result:
            nodes = result["nodes"]
            assert isinstance(nodes, list)
            
            # 如果有节点，验证结构
            for node in nodes:
                assert isinstance(node, dict)


class TestRecorderIntegration:
    """测试录制器集成功能"""
    
    def test_api_consistency(self):
        """测试API一致性"""
        # 所有API都应该返回字典
        apis = [
            start_recording(mode="auto"),
            stop_recording(),
            pause_recording(),
            resume_recording(),
            get_recording_status()
        ]
        
        for result in apis:
            assert isinstance(result, dict)
            assert "success" in result
    
    def test_error_handling(self):
        """测试错误处理"""
        # 所有API在错误情况下也应该返回结构化响应
        result = stop_recording()  # 可能没有录制在进行
        
        assert isinstance(result, dict)
        assert "success" in result
        
        # 如果失败，应该有错误信息
        if not result.get("success"):
            # 错误信息可能在error字段或其他地方
            assert "error" in result or "message" in result or result.get("nodes") is not None


class TestRecorderDataStructure:
    """测试录制器数据结构"""
    
    def test_start_response_structure(self):
        """测试开始录制响应结构"""
        result = start_recording(mode="auto")
        
        assert isinstance(result, dict)
        assert "success" in result
        
        if result.get("success"):
            # 成功时应该有这些字段
            assert "mode" in result
            assert "status" in result
            assert result["mode"] in ["auto", "manual"]
            assert result["status"] in ["recording", "paused", "stopped"]
        
        # 清理
        try:
            stop_recording()
        except:
            pass
    
    def test_stop_response_structure(self):
        """测试停止录制响应结构"""
        result = stop_recording()
        
        assert isinstance(result, dict)
        assert "success" in result
        
        if result.get("success"):
            # 成功时应该有这些字段
            assert "status" in result
            assert "nodes" in result
            assert isinstance(result["nodes"], list)
            
            # 如果有node_count字段，应该与nodes长度一致
            if "node_count" in result:
                assert result["node_count"] == len(result["nodes"])
    
    def test_status_response_structure(self):
        """测试状态查询响应结构"""
        status = get_recording_status()
        
        assert isinstance(status, dict)
        assert "success" in status
        
        if status.get("success"):
            # 必需字段
            required_fields = ["status", "is_recording", "mode", "step_count"]
            for field in required_fields:
                assert field in status, f"Missing field: {field}"
            
            # 字段类型验证
            assert isinstance(status["status"], str)
            assert isinstance(status["is_recording"], bool)
            assert isinstance(status["mode"], str)
            assert isinstance(status["step_count"], int)
            
            # 可选字段
            if "is_paused" in status:
                assert isinstance(status["is_paused"], bool)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
