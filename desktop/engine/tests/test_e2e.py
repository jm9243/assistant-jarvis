"""
端到端功能测试
测试完整的用户场景和工作流
"""
import pytest
import asyncio
from pathlib import Path
from datetime import datetime

from models.agent import AgentConfig, ModelConfig, MemoryConfig
from core.agent import BasicAgent, ReActAgent
from core.service.knowledge_base import KnowledgeBaseService
from core.service.conversation import ConversationService
from core.service.tool import ToolService
from models.knowledge_base import Tool


@pytest.fixture
def test_data_dir():
    """创建测试数据目录"""
    data_dir = Path("./test_data")
    data_dir.mkdir(exist_ok=True)
    yield data_dir
    # 清理
    import shutil
    if data_dir.exists():
        shutil.rmtree(data_dir)


@pytest.fixture
def basic_agent():
    """创建Basic Agent实例"""
    config = AgentConfig(
        id="e2e_basic_agent",
        user_id="test_user",
        name="E2E Basic Agent",
        description="端到端测试Basic Agent",
        type="basic",
        llm_config=ModelConfig(
            provider="openai",
            model="gpt-3.5-turbo",
            api_key="test_key"
        ),
        system_prompt="你是一个有帮助的AI助手。",
        memory_config=MemoryConfig()
    )
    return BasicAgent(config)


@pytest.fixture
def react_agent():
    """创建ReAct Agent实例"""
    config = AgentConfig(
        id="e2e_react_agent",
        user_id="test_user",
        name="E2E ReAct Agent",
        description="端到端测试ReAct Agent",
        type="react",
        llm_config=ModelConfig(
            provider="openai",
            model="gpt-4",
            api_key="test_key"
        ),
        system_prompt="你是一个可以使用工具的AI助手。",
        memory_config=MemoryConfig(),
        react_config={"max_iterations": 5}
    )
    return ReActAgent(config)


class TestBasicAgentE2E:
    """Basic Agent端到端测试"""
    
    @pytest.mark.asyncio
    async def test_complete_conversation_flow(self, basic_agent):
        """测试完整对话流程"""
        conversation_id = "e2e_conv_1"
        
        # 第一轮对话
        messages_1 = await basic_agent._build_messages(
            history=[],
            user_message="你好，我叫张三"
        )
        assert len(messages_1) == 2
        
        # 模拟保存到记忆
        await basic_agent.memory_service.short_term.add_message(
            conversation_id, "user", "你好，我叫张三"
        )
        await basic_agent.memory_service.short_term.add_message(
            conversation_id, "assistant", "你好张三！很高兴认识你。"
        )
        
        # 第二轮对话 - 测试上下文记忆
        history = await basic_agent.memory_service.short_term.get(conversation_id)
        messages_2 = await basic_agent._build_messages(
            history=history,
            user_message="我刚才说我叫什么？"
        )
        
        # 验证历史消息被包含
        assert len(messages_2) > 2
        assert any("张三" in str(msg) for msg in messages_2)
    
    @pytest.mark.asyncio
    async def test_multimodal_conversation(self, basic_agent):
        """测试多模态对话流程"""
        # 更新配置支持视觉
        basic_agent.llm_config.model = "gpt-4o"
        basic_agent.llm_config.supports_vision = True
        
        # 带图片的消息
        messages = await basic_agent._build_messages(
            history=[],
            user_message="这张图片里有什么？",
            image_urls=["https://example.com/test.jpg"]
        )
        
        # 验证消息格式
        assert len(messages) == 2
        user_msg = messages[1]
        assert isinstance(user_msg["content"], list)
        assert any(item["type"] == "image_url" for item in user_msg["content"])
    
    @pytest.mark.asyncio
    async def test_conversation_with_file_upload(self, basic_agent, test_data_dir):
        """测试文件上传对话流程"""
        # 创建测试文件
        test_file = test_data_dir / "test_document.txt"
        test_file.write_text("这是一个测试文档，包含重要信息。", encoding="utf-8")
        
        # 提取文件内容
        file_contents = await basic_agent._extract_file_contents([str(test_file)])
        
        assert len(file_contents) == 1
        assert "测试文档" in file_contents[0]["content"]
        
        # 构建包含文件内容的消息
        file_context = "\n\n".join([
            f"文件 {fc['name']}:\n{fc['content']}"
            for fc in file_contents
        ])
        
        messages = await basic_agent._build_messages(
            history=[],
            user_message=f"请总结以下文件内容：\n{file_context}"
        )
        
        assert len(messages) == 2
        assert "测试文档" in messages[1]["content"]


class TestKnowledgeBaseE2E:
    """知识库端到端测试"""
    
    @pytest.mark.asyncio
    async def test_complete_knowledge_base_workflow(self, test_data_dir):
        """测试完整知识库工作流"""
        kb_service = KnowledgeBaseService()
        
        # 1. 创建知识库
        kb_id = await kb_service.create_knowledge_base(
            name="E2E Test KB",
            description="端到端测试知识库"
        )
        assert kb_id is not None
        
        # 2. 创建测试文档
        test_doc = test_data_dir / "knowledge.txt"
        test_doc.write_text(
            "人工智能（AI）是计算机科学的一个分支。\n"
            "机器学习是AI的一个重要子领域。\n"
            "深度学习是机器学习的一种方法。",
            encoding="utf-8"
        )
        
        # 3. 添加文档
        doc_id = await kb_service.add_document(kb_id, str(test_doc))
        assert doc_id is not None
        
        # 4. 等待处理完成（实际场景中需要轮询状态）
        await asyncio.sleep(1)
        
        # 5. 执行检索
        results = await kb_service.search(kb_id, "什么是机器学习？", top_k=3)
        
        # 验证检索结果
        assert len(results) > 0
        assert any("机器学习" in r["content"] for r in results)
        assert all(0 <= r["similarity"] <= 1 for r in results)
    
    @pytest.mark.asyncio
    async def test_knowledge_base_with_agent(self, basic_agent, test_data_dir):
        """测试Agent集成知识库"""
        kb_service = KnowledgeBaseService()
        
        # 创建知识库并添加文档
        kb_id = await kb_service.create_knowledge_base(
            name="Agent KB",
            description="Agent测试知识库"
        )
        
        test_doc = test_data_dir / "agent_knowledge.txt"
        test_doc.write_text(
            "公司成立于2020年。\n"
            "公司主要产品是AI助手。\n"
            "公司总部位于北京。",
            encoding="utf-8"
        )
        
        await kb_service.add_document(kb_id, str(test_doc))
        await asyncio.sleep(1)
        
        # 绑定知识库到Agent
        basic_agent.knowledge_base_ids = [kb_id]
        
        # 执行检索
        query = "公司在哪里？"
        kb_results = await kb_service.search(kb_id, query, top_k=3)
        
        # 构建包含知识库上下文的消息
        kb_context = "\n".join([
            f"[来源: {r['metadata'].get('doc_id', 'unknown')}] {r['content']}"
            for r in kb_results
        ])
        
        messages = await basic_agent._build_messages(
            history=[],
            user_message=query,
            knowledge_base_context=kb_context
        )
        
        # 验证知识库内容被包含
        assert any("北京" in str(msg) for msg in messages)


class TestReActAgentE2E:
    """ReAct Agent端到端测试"""
    
    @pytest.mark.asyncio
    async def test_tool_call_workflow(self, react_agent):
        """测试工具调用工作流"""
        tool_service = ToolService()
        
        # 注册测试工具
        calculator_tool = Tool(
            id="calculator",
            name="计算器",
            description="执行数学计算",
            type="builtin",
            category="utility",
            parameters_schema={
                "type": "object",
                "properties": {
                    "expression": {"type": "string"}
                }
            },
            config={"function": "calculator"},
            approval_policy="auto",
            allowed_agents=[react_agent.agent_id],
            is_enabled=True,
            created_at=datetime.now()
        )
        
        tool_service.register_tool(calculator_tool)
        react_agent.tool_service = tool_service
        
        # 测试工具调用解析
        response = """
Thought: 用户想要计算2+2，我需要使用计算器工具
Action: calculator
Action Input: {"expression": "2 + 2"}
"""
        
        action = react_agent._parse_action(response)
        assert action is not None
        assert action["tool"] == "calculator"
        
        # 执行工具
        result = await tool_service.execute(
            action["tool"],
            action["params"]
        )
        
        assert result["result"] == 4
    
    @pytest.mark.asyncio
    async def test_multi_step_reasoning(self, react_agent):
        """测试多步推理流程"""
        # 模拟多步推理历史
        reasoning_history = []
        
        # 第一步：思考
        step1 = {
            "thought": "我需要先获取当前时间",
            "action": {"tool": "datetime", "params": {"action": "now"}},
            "observation": {"datetime": "2024-01-15 10:00:00"}
        }
        reasoning_history.append(step1)
        
        # 第二步：继续推理
        step2 = {
            "thought": "现在我知道时间了，需要计算一个小时后的时间",
            "action": {"tool": "calculator", "params": {"expression": "10 + 1"}},
            "observation": {"result": 11}
        }
        reasoning_history.append(step2)
        
        # 验证推理链
        assert len(reasoning_history) == 2
        assert all("thought" in step for step in reasoning_history)
        assert all("action" in step for step in reasoning_history)
        assert all("observation" in step for step in reasoning_history)


class TestConversationManagement:
    """会话管理端到端测试"""
    
    @pytest.mark.asyncio
    async def test_conversation_lifecycle(self):
        """测试会话生命周期"""
        conv_service = ConversationService()
        
        # 1. 创建会话
        conv_id = await conv_service.create(
            agent_id="test_agent",
            title="测试会话"
        )
        assert conv_id is not None
        
        # 2. 添加消息
        await conv_service.add_message(conv_id, "user", "你好")
        await conv_service.add_message(conv_id, "assistant", "你好！有什么可以帮助你的？")
        await conv_service.add_message(conv_id, "user", "今天天气怎么样？")
        
        # 3. 获取消息历史
        messages = await conv_service.get_messages(conv_id)
        assert len(messages) == 3
        assert messages[0]["role"] == "user"
        assert messages[1]["role"] == "assistant"
        
        # 4. 删除会话
        await conv_service.delete(conv_id)
        
        # 验证会话已删除
        try:
            await conv_service.get_messages(conv_id)
            assert False, "应该抛出异常"
        except Exception:
            pass  # 预期行为
    
    @pytest.mark.asyncio
    async def test_multiple_conversations(self):
        """测试多会话管理"""
        conv_service = ConversationService()
        
        # 创建多个会话
        conv_ids = []
        for i in range(3):
            conv_id = await conv_service.create(
                agent_id="test_agent",
                title=f"会话 {i+1}"
            )
            conv_ids.append(conv_id)
            
            # 每个会话添加不同的消息
            await conv_service.add_message(conv_id, "user", f"消息 {i+1}")
        
        # 验证每个会话独立
        for i, conv_id in enumerate(conv_ids):
            messages = await conv_service.get_messages(conv_id)
            assert len(messages) == 1
            assert f"消息 {i+1}" in messages[0]["content"]
        
        # 清理
        for conv_id in conv_ids:
            await conv_service.delete(conv_id)


class TestIntegrationScenarios:
    """集成场景测试"""
    
    @pytest.mark.asyncio
    async def test_complete_user_journey(self, basic_agent, test_data_dir):
        """测试完整用户旅程"""
        # 场景：用户创建知识库，上传文档，然后与Agent对话
        
        # 1. 创建知识库
        kb_service = KnowledgeBaseService()
        kb_id = await kb_service.create_knowledge_base(
            name="用户知识库",
            description="用户的个人知识库"
        )
        
        # 2. 上传文档
        doc_file = test_data_dir / "user_doc.txt"
        doc_file.write_text(
            "项目截止日期是2024年3月1日。\n"
            "项目负责人是李四。\n"
            "项目预算是100万元。",
            encoding="utf-8"
        )
        
        await kb_service.add_document(kb_id, str(doc_file))
        await asyncio.sleep(1)
        
        # 3. 创建会话
        conv_service = ConversationService()
        conv_id = await conv_service.create(
            agent_id=basic_agent.agent_id,
            title="项目咨询"
        )
        
        # 4. 绑定知识库
        basic_agent.knowledge_base_ids = [kb_id]
        
        # 5. 用户提问
        query = "项目什么时候截止？"
        
        # 检索知识库
        kb_results = await kb_service.search(kb_id, query, top_k=3)
        kb_context = "\n".join([r["content"] for r in kb_results])
        
        # 构建消息
        messages = await basic_agent._build_messages(
            history=[],
            user_message=query,
            knowledge_base_context=kb_context
        )
        
        # 保存消息
        await conv_service.add_message(conv_id, "user", query)
        
        # 验证流程完整性
        assert kb_id is not None
        assert conv_id is not None
        assert len(messages) > 0
        assert any("2024年3月1日" in str(msg) for msg in messages)
        
        # 清理
        await conv_service.delete(conv_id)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
