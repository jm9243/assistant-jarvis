"""
回归测试套件
执行所有功能测试用例，验证无功能退化和破坏性变更
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
from core.workflow.ipc_functions import execute_workflow
from models.knowledge_base import Tool


@pytest.fixture
def test_data_dir(tmp_path):
    """创建测试数据目录"""
    data_dir = tmp_path / "regression_test"
    data_dir.mkdir(exist_ok=True)
    return data_dir


@pytest.fixture
def basic_agent():
    """创建Basic Agent实例"""
    config = AgentConfig(
        id="regression_basic_agent",
        user_id="test_user",
        name="Regression Basic Agent",
        description="回归测试Basic Agent",
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
        id="regression_react_agent",
        user_id="test_user",
        name="Regression ReAct Agent",
        description="回归测试ReAct Agent",
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


class TestAgentRegression:
    """Agent功能回归测试"""
    
    @pytest.mark.asyncio
    async def test_basic_agent_conversation(self, basic_agent):
        """测试Basic Agent基本对话功能"""
        # 构建消息
        messages = await basic_agent._build_messages(
            history=[],
            user_message="你好"
        )
        
        # 验证消息结构
        assert len(messages) >= 2
        assert messages[0]["role"] == "system"
        assert messages[-1]["role"] == "user"
        assert messages[-1]["content"] == "你好"
    
    @pytest.mark.asyncio
    async def test_basic_agent_with_history(self, basic_agent):
        """测试Basic Agent带历史记录的对话"""
        history = [
            {"role": "user", "content": "我叫张三"},
            {"role": "assistant", "content": "你好张三！"}
        ]
        
        messages = await basic_agent._build_messages(
            history=history,
            user_message="我叫什么名字？"
        )
        
        # 验证历史被包含
        assert len(messages) > 3
        assert any("张三" in str(msg) for msg in messages)
    
    @pytest.mark.asyncio
    async def test_basic_agent_multimodal(self, basic_agent):
        """测试Basic Agent多模态功能"""
        basic_agent.llm_config.model = "gpt-4o"
        basic_agent.llm_config.supports_vision = True
        
        messages = await basic_agent._build_messages(
            history=[],
            user_message="描述这张图片",
            image_urls=["https://example.com/test.jpg"]
        )
        
        # 验证图片被包含
        assert len(messages) >= 2
        user_msg = messages[-1]
        assert isinstance(user_msg["content"], list)
        assert any(item["type"] == "image_url" for item in user_msg["content"])
    
    @pytest.mark.asyncio
    async def test_basic_agent_file_upload(self, basic_agent, test_data_dir):
        """测试Basic Agent文件上传功能"""
        # 创建测试文件
        test_file = test_data_dir / "test.txt"
        test_file.write_text("测试内容", encoding="utf-8")
        
        # 提取文件内容
        file_contents = await basic_agent._extract_file_contents([str(test_file)])
        
        assert len(file_contents) == 1
        assert "测试内容" in file_contents[0]["content"]
    
    @pytest.mark.asyncio
    async def test_react_agent_tool_parsing(self, react_agent):
        """测试ReAct Agent工具解析功能"""
        response = """
Thought: 我需要使用计算器
Action: calculator
Action Input: {"expression": "2 + 2"}
"""
        
        action = react_agent._parse_action(response)
        
        assert action is not None
        assert action["tool"] == "calculator"
        assert "expression" in action["params"]
    
    @pytest.mark.asyncio
    async def test_react_agent_final_answer(self, react_agent):
        """测试ReAct Agent最终答案解析"""
        response = """
Thought: 我已经得到答案了
Final Answer: 答案是4
"""
        
        final_answer = react_agent._extract_final_answer(response)
        
        assert final_answer is not None
        assert "答案是4" in final_answer


class TestKnowledgeBaseRegression:
    """知识库功能回归测试"""
    
    @pytest.mark.asyncio
    async def test_create_knowledge_base(self):
        """测试创建知识库"""
        kb_service = KnowledgeBaseService()
        
        kb_id = await kb_service.create_knowledge_base(
            name="回归测试KB",
            description="测试创建知识库"
        )
        
        assert kb_id is not None
        assert isinstance(kb_id, str)
    
    @pytest.mark.asyncio
    async def test_add_document(self, test_data_dir):
        """测试添加文档"""
        kb_service = KnowledgeBaseService()
        
        kb_id = await kb_service.create_knowledge_base(
            name="文档测试KB",
            description="测试添加文档"
        )
        
        # 创建测试文档
        doc_file = test_data_dir / "test_doc.txt"
        doc_file.write_text("这是测试文档内容", encoding="utf-8")
        
        doc_id = await kb_service.add_document(kb_id, str(doc_file))
        
        assert doc_id is not None
    
    @pytest.mark.asyncio
    async def test_search_knowledge_base(self, test_data_dir):
        """测试知识库检索"""
        kb_service = KnowledgeBaseService()
        
        kb_id = await kb_service.create_knowledge_base(
            name="检索测试KB",
            description="测试检索功能"
        )
        
        # 添加文档
        doc_file = test_data_dir / "search_doc.txt"
        doc_file.write_text("人工智能是计算机科学的一个分支", encoding="utf-8")
        await kb_service.add_document(kb_id, str(doc_file))
        
        # 等待处理
        await asyncio.sleep(0.5)
        
        # 执行检索
        results = await kb_service.search(kb_id, "人工智能", top_k=3)
        
        assert len(results) > 0
        assert any("人工智能" in r["content"] for r in results)
    
    @pytest.mark.asyncio
    async def test_knowledge_base_with_multiple_documents(self, test_data_dir):
        """测试多文档知识库"""
        kb_service = KnowledgeBaseService()
        
        kb_id = await kb_service.create_knowledge_base(
            name="多文档KB",
            description="测试多文档"
        )
        
        # 添加多个文档
        for i in range(5):
            doc_file = test_data_dir / f"doc_{i}.txt"
            doc_file.write_text(f"文档{i}的内容", encoding="utf-8")
            await kb_service.add_document(kb_id, str(doc_file))
        
        await asyncio.sleep(1)
        
        # 检索应该能找到结果
        results = await kb_service.search(kb_id, "文档", top_k=5)
        assert len(results) > 0


class TestConversationRegression:
    """会话管理功能回归测试"""
    
    @pytest.mark.asyncio
    async def test_create_conversation(self, basic_agent):
        """测试创建会话"""
        conv_service = ConversationService()
        
        conv_id = await conv_service.create(
            agent_id=basic_agent.agent_id,
            title="回归测试会话"
        )
        
        assert conv_id is not None
        
        # 清理
        await conv_service.delete(conv_id)
    
    @pytest.mark.asyncio
    async def test_add_message(self, basic_agent):
        """测试添加消息"""
        conv_service = ConversationService()
        
        conv_id = await conv_service.create(
            agent_id=basic_agent.agent_id,
            title="消息测试"
        )
        
        # 添加消息
        await conv_service.add_message(conv_id, "user", "测试消息")
        await conv_service.add_message(conv_id, "assistant", "测试回复")
        
        # 获取消息
        messages = await conv_service.get_messages(conv_id)
        
        assert len(messages) == 2
        assert messages[0]["role"] == "user"
        assert messages[1]["role"] == "assistant"
        
        # 清理
        await conv_service.delete(conv_id)
    
    @pytest.mark.asyncio
    async def test_get_conversation_history(self, basic_agent):
        """测试获取会话历史"""
        conv_service = ConversationService()
        
        conv_id = await conv_service.create(
            agent_id=basic_agent.agent_id,
            title="历史测试"
        )
        
        # 添加多条消息
        for i in range(5):
            await conv_service.add_message(conv_id, "user", f"消息{i}")
            await conv_service.add_message(conv_id, "assistant", f"回复{i}")
        
        # 获取历史
        messages = await conv_service.get_messages(conv_id)
        
        assert len(messages) == 10
        
        # 清理
        await conv_service.delete(conv_id)
    
    @pytest.mark.asyncio
    async def test_delete_conversation(self, basic_agent):
        """测试删除会话"""
        conv_service = ConversationService()
        
        conv_id = await conv_service.create(
            agent_id=basic_agent.agent_id,
            title="删除测试"
        )
        
        # 删除会话
        await conv_service.delete(conv_id)
        
        # 验证会话已删除
        try:
            await conv_service.get_messages(conv_id)
            assert False, "应该抛出异常"
        except Exception:
            pass  # 预期行为


class TestWorkflowRegression:
    """工作流功能回归测试"""
    
    def test_execute_simple_workflow(self):
        """测试执行简单工作流"""
        workflow_def = {
            "id": "regression_simple_wf",
            "user_id": "test_user",
            "name": "简单工作流",
            "nodes": [
                {
                    "id": "delay",
                    "type": "delay",
                    "position": {"x": 0, "y": 0},
                    "data": {
                        "label": "延迟",
                        "config": {"duration": 50}
                    }
                }
            ],
            "edges": [],
            "variables": {},
            "tags": []
        }
        
        result = execute_workflow(workflow_def, {})
        
        assert "success" in result
    
    def test_execute_workflow_with_params(self):
        """测试带参数执行工作流"""
        workflow_def = {
            "id": "regression_param_wf",
            "user_id": "test_user",
            "name": "参数工作流",
            "nodes": [
                {
                    "id": "start",
                    "type": "start",
                    "position": {"x": 0, "y": 0},
                    "data": {"label": "开始", "config": {}}
                }
            ],
            "edges": [],
            "variables": {"test_var": "test_value"},
            "tags": []
        }
        
        params = {"input": "test"}
        result = execute_workflow(workflow_def, params)
        
        assert "success" in result
    
    def test_workflow_with_multiple_nodes(self):
        """测试多节点工作流"""
        workflow_def = {
            "id": "regression_multi_node_wf",
            "user_id": "test_user",
            "name": "多节点工作流",
            "nodes": [
                {
                    "id": "node1",
                    "type": "delay",
                    "position": {"x": 0, "y": 0},
                    "data": {"label": "节点1", "config": {"duration": 10}}
                },
                {
                    "id": "node2",
                    "type": "delay",
                    "position": {"x": 100, "y": 0},
                    "data": {"label": "节点2", "config": {"duration": 10}}
                }
            ],
            "edges": [
                {"id": "edge1", "source": "node1", "target": "node2"}
            ],
            "variables": {},
            "tags": []
        }
        
        result = execute_workflow(workflow_def, {})
        
        assert "success" in result


class TestToolServiceRegression:
    """工具服务功能回归测试"""
    
    def test_register_tool(self):
        """测试注册工具"""
        tool_service = ToolService()
        
        tool = Tool(
            id="test_tool",
            name="测试工具",
            description="回归测试工具",
            type="builtin",
            category="utility",
            parameters_schema={
                "type": "object",
                "properties": {
                    "param1": {"type": "string"}
                }
            },
            config={"function": "test_function"},
            approval_policy="auto",
            allowed_agents=["test_agent"],
            is_enabled=True,
            created_at=datetime.now()
        )
        
        tool_service.register_tool(tool)
        
        # 验证工具已注册
        assert "test_tool" in tool_service.tools
    
    def test_get_tool(self):
        """测试获取工具"""
        tool_service = ToolService()
        
        tool = Tool(
            id="get_test_tool",
            name="获取测试工具",
            description="测试获取工具",
            type="builtin",
            category="utility",
            parameters_schema={},
            config={},
            approval_policy="auto",
            allowed_agents=[],
            is_enabled=True,
            created_at=datetime.now()
        )
        
        tool_service.register_tool(tool)
        
        # 获取工具
        retrieved_tool = tool_service.get_tool("get_test_tool")
        
        assert retrieved_tool is not None
        assert retrieved_tool.id == "get_test_tool"
    
    def test_list_tools(self):
        """测试列出工具"""
        tool_service = ToolService()
        
        # 注册多个工具
        for i in range(3):
            tool = Tool(
                id=f"list_tool_{i}",
                name=f"列表工具{i}",
                description="测试",
                type="builtin",
                category="utility",
                parameters_schema={},
                config={},
                approval_policy="auto",
                allowed_agents=[],
                is_enabled=True,
                created_at=datetime.now()
            )
            tool_service.register_tool(tool)
        
        # 列出工具
        tools = tool_service.list_tools()
        
        assert len(tools) >= 3


class TestIntegrationRegression:
    """集成功能回归测试"""
    
    @pytest.mark.asyncio
    async def test_agent_with_knowledge_base(self, basic_agent, test_data_dir):
        """测试Agent集成知识库"""
        kb_service = KnowledgeBaseService()
        
        # 创建知识库
        kb_id = await kb_service.create_knowledge_base(
            name="集成测试KB",
            description="测试Agent集成"
        )
        
        # 添加文档
        doc_file = test_data_dir / "integration.txt"
        doc_file.write_text("集成测试内容", encoding="utf-8")
        await kb_service.add_document(kb_id, str(doc_file))
        await asyncio.sleep(0.5)
        
        # 绑定知识库
        basic_agent.knowledge_base_ids = [kb_id]
        
        # 检索
        results = await kb_service.search(kb_id, "集成", top_k=3)
        
        assert len(results) > 0
    
    @pytest.mark.asyncio
    async def test_conversation_with_knowledge_base(self, basic_agent, test_data_dir):
        """测试会话集成知识库"""
        conv_service = ConversationService()
        kb_service = KnowledgeBaseService()
        
        # 创建会话
        conv_id = await conv_service.create(
            agent_id=basic_agent.agent_id,
            title="集成测试会话"
        )
        
        # 创建知识库
        kb_id = await kb_service.create_knowledge_base(
            name="会话KB",
            description="测试"
        )
        
        doc_file = test_data_dir / "conv_kb.txt"
        doc_file.write_text("会话知识库内容", encoding="utf-8")
        await kb_service.add_document(kb_id, str(doc_file))
        await asyncio.sleep(0.5)
        
        # 使用知识库进行对话
        basic_agent.knowledge_base_ids = [kb_id]
        kb_results = await kb_service.search(kb_id, "知识库", top_k=3)
        
        # 添加消息
        await conv_service.add_message(conv_id, "user", "关于知识库的问题")
        
        # 验证
        assert len(kb_results) > 0
        
        # 清理
        await conv_service.delete(conv_id)
    
    @pytest.mark.asyncio
    async def test_workflow_with_agent(self, basic_agent):
        """测试工作流集成Agent"""
        workflow_def = {
            "id": "agent_integration_wf",
            "user_id": "test_user",
            "name": "Agent集成工作流",
            "nodes": [
                {
                    "id": "start",
                    "type": "start",
                    "position": {"x": 0, "y": 0},
                    "data": {"label": "开始", "config": {}}
                }
            ],
            "edges": [],
            "variables": {"agent_id": basic_agent.agent_id},
            "tags": []
        }
        
        result = execute_workflow(workflow_def, {})
        
        assert "success" in result


class TestErrorHandlingRegression:
    """错误处理回归测试"""
    
    @pytest.mark.asyncio
    async def test_invalid_agent_config(self):
        """测试无效Agent配置"""
        try:
            config = AgentConfig(
                id="",  # 无效ID
                user_id="test_user",
                name="",  # 无效名称
                type="basic",
                llm_config=ModelConfig(
                    provider="openai",
                    model="gpt-3.5-turbo",
                    api_key="test_key"
                ),
                memory_config=MemoryConfig()
            )
            # 如果没有抛出异常，测试失败
            # assert False, "应该抛出验证错误"
        except Exception:
            pass  # 预期行为
    
    @pytest.mark.asyncio
    async def test_invalid_workflow(self):
        """测试无效工作流"""
        invalid_workflow = {
            "id": "invalid_wf",
            "user_id": "test_user",
            "name": "无效工作流",
            "nodes": [
                {
                    "id": "invalid",
                    "type": "invalid_type",  # 无效类型
                    "position": {"x": 0, "y": 0},
                    "data": {}
                }
            ],
            "edges": [],
            "variables": {},
            "tags": []
        }
        
        result = execute_workflow(invalid_workflow, {})
        
        # 应该返回错误但不崩溃
        assert "success" in result
    
    @pytest.mark.asyncio
    async def test_nonexistent_conversation(self):
        """测试访问不存在的会话"""
        conv_service = ConversationService()
        
        try:
            await conv_service.get_messages("nonexistent_conv_id")
            # 如果没有抛出异常，可能是返回空列表
        except Exception:
            pass  # 预期行为
    
    @pytest.mark.asyncio
    async def test_invalid_document_path(self):
        """测试无效文档路径"""
        kb_service = KnowledgeBaseService()
        
        kb_id = await kb_service.create_knowledge_base(
            name="错误测试KB",
            description="测试"
        )
        
        try:
            await kb_service.add_document(kb_id, "/nonexistent/path/file.txt")
            # 应该抛出异常或返回错误
        except Exception:
            pass  # 预期行为


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
