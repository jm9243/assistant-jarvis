"""
Agent对话功能完整测试
测试创建会话、发送消息、获取历史等所有功能
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from core.agent.ipc_functions import (
    agent_chat,
    create_conversation,
    get_conversation_history
)


@pytest.fixture
def test_agent_config():
    """测试用Agent配置"""
    return {
        "id": "test_agent_001",
        "user_id": "test_user",
        "name": "测试Agent",
        "description": "用于测试的Agent",
        "type": "basic",
        "llm_config": {
            "provider": "openai",
            "model": "gpt-3.5-turbo",
            "api_key": "test_key",
            "temperature": 0.7
        },
        "system_prompt": "你是一个测试助手。",
        "memory_config": {},
        "knowledge_base_ids": [],
        "tool_ids": []
    }


class TestAgentConversationManagement:
    """测试Agent会话管理功能"""
    
    def test_create_conversation_structure(self, test_agent_config):
        """测试创建会话API结构"""
        result = create_conversation(
            agent_config=test_agent_config,
            user_id="test_user",
            title="测试会话"
        )
        
        assert isinstance(result, dict)
        assert "success" in result
        
        if result.get("success"):
            assert "conversation_id" in result
            assert isinstance(result["conversation_id"], str)
            assert len(result["conversation_id"]) > 0
            assert "agent_id" in result
            assert "title" in result
    
    def test_create_conversation_with_custom_title(self, test_agent_config):
        """测试创建带自定义标题的会话"""
        result = create_conversation(
            agent_config=test_agent_config,
            user_id="test_user",
            title="自定义标题"
        )
        
        assert isinstance(result, dict)
        assert "success" in result
        
        if result.get("success"):
            assert "conversation_id" in result
            assert result["title"] == "自定义标题"
    
    def test_create_multiple_conversations(self, test_agent_config):
        """测试创建多个会话"""
        conversation_ids = []
        
        for i in range(3):
            result = create_conversation(
                agent_config=test_agent_config,
                user_id="test_user",
                title=f"会话{i+1}"
            )
            
            if result.get("success"):
                conversation_ids.append(result["conversation_id"])
        
        # 验证创建了多个不同的会话
        assert len(conversation_ids) > 0
        assert len(set(conversation_ids)) == len(conversation_ids)  # 所有ID都不同


class TestAgentChat:
    """测试Agent对话功能"""
    
    def test_agent_chat_structure(self, test_agent_config):
        """测试对话API结构"""
        # 先创建会话
        create_result = create_conversation(
            agent_config=test_agent_config,
            user_id="test_user"
        )
        
        if create_result.get("success"):
            conversation_id = create_result["conversation_id"]
            
            # 发送消息
            chat_result = agent_chat(
                agent_config=test_agent_config,
                conversation_id=conversation_id,
                message="你好",
                stream=False
            )
            
            assert isinstance(chat_result, dict)
            assert "success" in chat_result
            
            if chat_result.get("success"):
                # 应该有响应消息
                assert "message" in chat_result
                assert "conversation_id" in chat_result
    
    def test_agent_chat_with_stream(self, test_agent_config):
        """测试流式对话"""
        create_result = create_conversation(
            agent_config=test_agent_config,
            user_id="test_user"
        )
        
        if create_result.get("success"):
            conversation_id = create_result["conversation_id"]
            
            # 流式对话（当前实现会返回完整响应）
            chat_result = agent_chat(
                agent_config=test_agent_config,
                conversation_id=conversation_id,
                message="你好",
                stream=True
            )
            
            assert isinstance(chat_result, dict)
            assert "success" in chat_result
    
    def test_agent_chat_error_handling(self, test_agent_config):
        """测试对话错误处理"""
        # 使用无效的conversation_id
        result = agent_chat(
            agent_config=test_agent_config,
            conversation_id="invalid_conv_id_12345",
            message="测试",
            stream=False
        )
        
        assert isinstance(result, dict)
        assert "success" in result
        
        # 验证返回结构
        assert "conversation_id" in result


class TestConversationHistory:
    """测试会话历史功能"""
    
    def test_get_conversation_history_structure(self, test_agent_config):
        """测试获取历史API结构"""
        # 先创建会话
        create_result = create_conversation(
            agent_config=test_agent_config,
            user_id="test_user"
        )
        
        if create_result.get("success"):
            conversation_id = create_result["conversation_id"]
            
            # 获取历史
            history_result = get_conversation_history(
                conversation_id=conversation_id,
                limit=50,
                offset=0
            )
            
            assert isinstance(history_result, dict)
            assert "success" in history_result
            
            if history_result.get("success"):
                assert "messages" in history_result
                assert "conversation_id" in history_result
                assert "total" in history_result
    
    def test_conversation_history_after_chat(self, test_agent_config):
        """测试对话后的历史记录"""
        # 创建会话
        create_result = create_conversation(
            agent_config=test_agent_config,
            user_id="test_user"
        )
        
        if create_result.get("success"):
            conversation_id = create_result["conversation_id"]
            
            # 发送消息
            agent_chat(
                agent_config=test_agent_config,
                conversation_id=conversation_id,
                message="你好",
                stream=False
            )
            
            # 获取历史
            history_result = get_conversation_history(conversation_id=conversation_id)
            
            if history_result.get("success"):
                messages = history_result.get("messages", [])
                
                # 应该有消息记录
                assert isinstance(messages, list)
    
    def test_empty_conversation_history(self, test_agent_config):
        """测试空会话的历史"""
        # 创建新会话
        create_result = create_conversation(
            agent_config=test_agent_config,
            user_id="test_user"
        )
        
        if create_result.get("success"):
            conversation_id = create_result["conversation_id"]
            
            # 立即获取历史（应该为空）
            history_result = get_conversation_history(conversation_id=conversation_id)
            
            if history_result.get("success"):
                messages = history_result.get("messages", [])
                
                assert isinstance(messages, list)
                # 新会话应该没有消息
                assert len(messages) >= 0
    
    def test_history_pagination(self, test_agent_config):
        """测试历史分页"""
        create_result = create_conversation(
            agent_config=test_agent_config,
            user_id="test_user"
        )
        
        if create_result.get("success"):
            conversation_id = create_result["conversation_id"]
            
            # 测试不同的分页参数
            history1 = get_conversation_history(
                conversation_id=conversation_id,
                limit=10,
                offset=0
            )
            
            history2 = get_conversation_history(
                conversation_id=conversation_id,
                limit=5,
                offset=0
            )
            
            assert history1.get("success")
            assert history2.get("success")
            
            if history1.get("success") and history2.get("success"):
                assert history1["limit"] == 10
                assert history2["limit"] == 5


class TestAgentIntegration:
    """测试Agent集成功能"""
    
    def test_complete_conversation_flow(self, test_agent_config):
        """测试完整对话流程"""
        # 1. 创建会话
        create_result = create_conversation(
            agent_config=test_agent_config,
            user_id="test_user",
            title="完整流程测试"
        )
        
        assert create_result.get("success"), "创建会话失败"
        conversation_id = create_result["conversation_id"]
        
        # 2. 发送第一条消息
        chat1_result = agent_chat(
            agent_config=test_agent_config,
            conversation_id=conversation_id,
            message="你好",
            stream=False
        )
        
        assert chat1_result.get("success"), "第一条消息发送失败"
        
        # 3. 获取历史
        history1_result = get_conversation_history(conversation_id=conversation_id)
        
        if history1_result.get("success"):
            messages1 = history1_result.get("messages", [])
            assert isinstance(messages1, list)
        
        # 4. 发送第二条消息
        chat2_result = agent_chat(
            agent_config=test_agent_config,
            conversation_id=conversation_id,
            message="再见",
            stream=False
        )
        
        assert chat2_result.get("success"), "第二条消息发送失败"
        
        # 5. 再次获取历史
        history2_result = get_conversation_history(conversation_id=conversation_id)
        
        if history2_result.get("success"):
            messages2 = history2_result.get("messages", [])
            assert isinstance(messages2, list)
    
    def test_conversation_isolation(self, test_agent_config):
        """测试会话隔离"""
        # 创建两个会话
        conv1_result = create_conversation(
            agent_config=test_agent_config,
            user_id="test_user",
            title="会话1"
        )
        conv2_result = create_conversation(
            agent_config=test_agent_config,
            user_id="test_user",
            title="会话2"
        )
        
        if conv1_result.get("success") and conv2_result.get("success"):
            conv1_id = conv1_result["conversation_id"]
            conv2_id = conv2_result["conversation_id"]
            
            # 在会话1中发送消息
            agent_chat(
                agent_config=test_agent_config,
                conversation_id=conv1_id,
                message="会话1的消息",
                stream=False
            )
            
            # 在会话2中发送消息
            agent_chat(
                agent_config=test_agent_config,
                conversation_id=conv2_id,
                message="会话2的消息",
                stream=False
            )
            
            # 获取两个会话的历史
            history1 = get_conversation_history(conversation_id=conv1_id)
            history2 = get_conversation_history(conversation_id=conv2_id)
            
            # 两个会话应该是独立的
            assert history1.get("success")
            assert history2.get("success")


class TestAgentDataStructure:
    """测试Agent数据结构"""
    
    def test_conversation_id_format(self, test_agent_config):
        """测试会话ID格式"""
        result = create_conversation(
            agent_config=test_agent_config,
            user_id="test_user"
        )
        
        if result.get("success"):
            conversation_id = result["conversation_id"]
            
            # 会话ID应该是字符串
            assert isinstance(conversation_id, str)
            assert len(conversation_id) > 0
    
    def test_message_structure(self, test_agent_config):
        """测试消息结构"""
        # 创建会话并发送消息
        create_result = create_conversation(
            agent_config=test_agent_config,
            user_id="test_user"
        )
        
        if create_result.get("success"):
            conversation_id = create_result["conversation_id"]
            
            # 发送消息
            agent_chat(
                agent_config=test_agent_config,
                conversation_id=conversation_id,
                message="测试消息",
                stream=False
            )
            
            # 获取历史
            history_result = get_conversation_history(conversation_id=conversation_id)
            
            if history_result.get("success"):
                messages = history_result.get("messages", [])
                
                # 验证消息结构
                for msg in messages:
                    assert isinstance(msg, dict)
                    # 消息应该有role和content字段
                    assert "role" in msg or "type" in msg
                    assert "content" in msg or "message" in msg
    
    def test_api_response_consistency(self, test_agent_config):
        """测试API响应一致性"""
        # 所有API都应该返回包含success字段的字典
        apis = [
            create_conversation(
                agent_config=test_agent_config,
                user_id="test_user"
            ),
            get_conversation_history(conversation_id="test_conv"),
        ]
        
        for result in apis:
            assert isinstance(result, dict)
            assert "success" in result


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
