"""
Phase 2 Agent System 集成测试
"""
import pytest
import asyncio
from datetime import datetime

from models.agent import AgentConfig, ModelConfig, MemoryConfig
from core.agent import BasicAgent, ReActAgent, DeepResearchAgent
from core.service.knowledge_base import KnowledgeBaseService
from core.service.tool import ToolService
from models.knowledge_base import Tool


@pytest.fixture
def basic_agent_config():
    """Basic Agent配置"""
    return AgentConfig(
        id="test_basic_agent",
        user_id="test_user",
        name="Test Basic Agent",
        description="测试Basic Agent",
        type="basic",
        llm_config=ModelConfig(
            provider="openai",
            model="gpt-4",
            api_key="test_key"
        ),
        system_prompt="你是一个有帮助的AI助手。",
        memory_config=MemoryConfig()
    )


@pytest.fixture
def react_agent_config():
    """ReAct Agent配置"""
    return AgentConfig(
        id="test_react_agent",
        user_id="test_user",
        name="Test ReAct Agent",
        description="测试ReAct Agent",
        type="react",
        llm_config=ModelConfig(
            provider="openai",
            model="gpt-4",
            api_key="test_key"
        ),
        system_prompt="你是一个可以使用工具的AI助手。",
        memory_config=MemoryConfig(),
        react_config={
            "max_iterations": 5
        }
    )


@pytest.fixture
def research_agent_config():
    """Deep Research Agent配置"""
    return AgentConfig(
        id="test_research_agent",
        user_id="test_user",
        name="Test Research Agent",
        description="测试Deep Research Agent",
        type="deep_research",
        llm_config=ModelConfig(
            provider="openai",
            model="gpt-4",
            api_key="test_key"
        ),
        system_prompt="你是一个深度研究专家。",
        memory_config=MemoryConfig(),
        research_config={
            "complexity_threshold": 0.7,
            "max_subtasks": 5
        }
    )


class TestBasicAgent:
    """Basic Agent测试"""
    
    @pytest.mark.asyncio
    async def test_basic_agent_initialization(self, basic_agent_config):
        """测试Basic Agent初始化"""
        agent = BasicAgent(basic_agent_config)
        
        assert agent.agent_id == "test_basic_agent"
        assert agent.agent_type == "basic"
        assert agent.llm_service is not None
        assert agent.memory_service is not None
    
    @pytest.mark.asyncio
    async def test_basic_agent_message_building(self, basic_agent_config):
        """测试消息构建"""
        agent = BasicAgent(basic_agent_config)
        
        messages = await agent._build_messages(
            history=[],
            user_message="你好"
        )
        
        assert len(messages) == 2  # system + user
        assert messages[0]["role"] == "system"
        assert messages[1]["role"] == "user"
        assert messages[1]["content"] == "你好"
    
    @pytest.mark.asyncio
    async def test_basic_agent_with_images(self, basic_agent_config):
        """测试多模态输入"""
        agent = BasicAgent(basic_agent_config)
        
        messages = await agent._build_messages(
            history=[],
            user_message="这是什么？",
            image_urls=["https://example.com/image.jpg"]
        )
        
        assert len(messages) == 2
        assert isinstance(messages[1]["content"], list)
        assert any(item["type"] == "image_url" for item in messages[1]["content"])


class TestReActAgent:
    """ReAct Agent测试"""
    
    @pytest.mark.asyncio
    async def test_react_agent_initialization(self, react_agent_config):
        """测试ReAct Agent初始化"""
        agent = ReActAgent(react_agent_config)
        
        assert agent.agent_id == "test_react_agent"
        assert agent.agent_type == "react"
        assert agent.tool_service is not None
        assert agent.max_iterations == 5
    
    @pytest.mark.asyncio
    async def test_react_agent_action_parsing(self, react_agent_config):
        """测试工具调用解析"""
        agent = ReActAgent(react_agent_config)
        
        response = """
Thought: 我需要调用计算器工具
Action: calculator
Action Input: {"expression": "2 + 2"}
"""
        
        action = agent._parse_action(response)
        
        assert action is not None
        assert action["tool"] == "calculator"
        assert action["params"]["expression"] == "2 + 2"
    
    @pytest.mark.asyncio
    async def test_react_agent_thought_extraction(self, react_agent_config):
        """测试思考提取"""
        agent = ReActAgent(react_agent_config)
        
        response = """
Thought: 我需要先分析问题
Action: search
"""
        
        thought = agent._extract_thought(response)
        
        assert "分析问题" in thought


class TestDeepResearchAgent:
    """Deep Research Agent测试"""
    
    @pytest.mark.asyncio
    async def test_research_agent_initialization(self, research_agent_config):
        """测试Deep Research Agent初始化"""
        agent = DeepResearchAgent(research_agent_config)
        
        assert agent.agent_id == "test_research_agent"
        assert agent.agent_type == "deep_research"
        assert agent.complexity_threshold == 0.7
        assert agent.max_subtasks == 5


class TestKnowledgeBaseService:
    """知识库服务测试"""
    
    @pytest.mark.asyncio
    async def test_knowledge_base_creation(self):
        """测试知识库创建"""
        kb_service = KnowledgeBaseService()
        
        kb_id = await kb_service.create_knowledge_base(
            name="Test KB",
            description="测试知识库"
        )
        
        assert kb_id is not None
        assert len(kb_id) > 0
    
    @pytest.mark.asyncio
    async def test_text_chunking(self):
        """测试文本分块"""
        kb_service = KnowledgeBaseService()
        
        text = "这是一段测试文本。" * 100
        chunks = kb_service._chunk_text(text, chunk_size=100, overlap=20)
        
        assert len(chunks) > 1
        # 验证重叠
        if len(chunks) > 1:
            assert chunks[0][-20:] in chunks[1]


class TestToolService:
    """工具服务测试"""
    
    @pytest.mark.asyncio
    async def test_tool_registration(self):
        """测试工具注册"""
        tool_service = ToolService()
        
        tool = Tool(
            id="test_tool",
            name="Test Tool",
            description="测试工具",
            type="builtin",
            category="test",
            parameters_schema={},
            config={"function": "calculator"},
            approval_policy="auto",
            allowed_agents=[],
            is_enabled=True,
            created_at=datetime.now()
        )
        
        tool_id = tool_service.register_tool(tool)
        
        assert tool_id == "test_tool"
        assert tool_service.get_tool(tool_id) is not None
    
    @pytest.mark.asyncio
    async def test_tool_listing(self):
        """测试工具列表"""
        tool_service = ToolService()
        
        # 注册测试工具
        tool = Tool(
            id="test_tool_2",
            name="Test Tool 2",
            description="测试工具2",
            type="builtin",
            category="test",
            parameters_schema={},
            config={},
            approval_policy="auto",
            allowed_agents=[],
            is_enabled=True,
            created_at=datetime.now()
        )
        
        tool_service.register_tool(tool)
        
        tools = tool_service.list_tools()
        
        assert len(tools) > 0
    
    @pytest.mark.asyncio
    async def test_builtin_calculator(self):
        """测试内置计算器工具"""
        tool_service = ToolService()
        
        result = await tool_service._builtin_calculator({
            "expression": "2 + 2"
        })
        
        assert result["result"] == 4
    
    @pytest.mark.asyncio
    async def test_builtin_datetime(self):
        """测试内置日期时间工具"""
        tool_service = ToolService()
        
        result = await tool_service._builtin_datetime({
            "action": "now"
        })
        
        assert "datetime" in result


class TestMemorySystem:
    """记忆系统测试"""
    
    @pytest.mark.asyncio
    async def test_short_term_memory(self):
        """测试短期记忆"""
        from core.service.memory import ShortTermMemory
        
        memory = ShortTermMemory(window_size=3)
        
        # 添加消息
        await memory.add_message("conv_1", "user", "消息1")
        await memory.add_message("conv_1", "assistant", "回复1")
        await memory.add_message("conv_1", "user", "消息2")
        
        # 获取消息
        messages = await memory.get("conv_1")
        
        assert len(messages) == 3
        assert messages[0]["content"] == "消息1"
    
    @pytest.mark.asyncio
    async def test_working_memory(self):
        """测试工作记忆"""
        from core.service.memory import WorkingMemory
        
        memory = WorkingMemory()
        
        # 设置变量
        memory.set("conv_1", "key1", "value1")
        memory.set("conv_1", "key2", "value2")
        
        # 获取变量
        variables = memory.get("conv_1")
        
        assert variables["key1"] == "value1"
        assert variables["key2"] == "value2"
        
        # 清空
        memory.clear("conv_1")
        assert memory.get("conv_1") == {}


class TestPermissionChecker:
    """权限检查器测试"""
    
    @pytest.mark.asyncio
    async def test_permission_check(self):
        """测试权限检查"""
        from core.service.tool import ToolPermissionChecker
        
        checker = ToolPermissionChecker()
        
        tool = Tool(
            id="test_tool",
            name="Test Tool",
            description="测试工具",
            type="builtin",
            category="test",
            parameters_schema={},
            config={},
            approval_policy="auto",
            allowed_agents=["agent_1"],
            is_enabled=True,
            created_at=datetime.now()
        )
        
        # 允许的Agent
        assert await checker.check_permission(tool, "agent_1") == True
        
        # 不允许的Agent
        assert await checker.check_permission(tool, "agent_2") == False
    
    @pytest.mark.asyncio
    async def test_approval_workflow(self):
        """测试审批流程"""
        from core.service.tool import ToolPermissionChecker
        
        checker = ToolPermissionChecker()
        
        tool = Tool(
            id="test_tool",
            name="Test Tool",
            description="测试工具",
            type="system",
            category="test",
            parameters_schema={},
            config={},
            approval_policy="required",
            allowed_agents=[],
            is_enabled=True,
            created_at=datetime.now()
        )
        
        # 需要审批
        assert checker.requires_approval(tool) == True
        
        # 创建审批请求
        request_id = await checker.request_approval(
            tool=tool,
            params={},
            agent_id="agent_1",
            conversation_id="conv_1"
        )
        
        assert request_id is not None
        
        # 批准
        success = await checker.approve(request_id)
        assert success == True
        
        # 验证状态
        request = checker.get_approval_request(request_id)
        assert request["status"] == "approved"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
