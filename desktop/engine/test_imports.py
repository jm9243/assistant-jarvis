#!/usr/bin/env python3
"""
测试各个模块的导入，找出阻塞的服务
"""
import sys
import time
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

def test_import(module_name, import_statement):
    """测试单个导入"""
    print(f"\n{'='*60}")
    print(f"测试导入: {module_name}")
    print(f"{'='*60}")
    
    start_time = time.time()
    try:
        exec(import_statement)
        elapsed = time.time() - start_time
        print(f"✓ 成功 (耗时: {elapsed:.2f}秒)")
        return True
    except Exception as e:
        elapsed = time.time() - start_time
        print(f"✗ 失败 (耗时: {elapsed:.2f}秒)")
        print(f"  错误: {e}")
        import traceback
        traceback.print_exc()
        return False

# 测试基础模块
print("\n" + "="*60)
print("第1阶段: 测试基础模块")
print("="*60)

test_import("logger", "from logger import get_logger")
test_import("config", "from config import settings")
test_import("function_registry", "from function_registry import FunctionRegistry")

# 测试数据模型
print("\n" + "="*60)
print("第2阶段: 测试数据模型")
print("="*60)

test_import("models.agent", "from models.agent import AgentConfig")
test_import("models.workflow", "from models.workflow import Workflow")
test_import("models.knowledge_base", "from models.knowledge_base import Tool")

# 测试核心服务（这里可能有问题）
print("\n" + "="*60)
print("第3阶段: 测试核心服务（可能阻塞）")
print("="*60)

test_import("core.agent", "from core.agent import BasicAgent")
test_import("core.service.conversation", "from core.service.conversation import ConversationService")
test_import("core.service.memory", "from core.service.memory import MemoryService")

print("\n" + "="*60)
print("第4阶段: 测试知识库服务（最可能阻塞）")
print("="*60)

test_import("core.service.embedding", "from core.service.embedding import EmbeddingService")
test_import("core.service.knowledge_base", "from core.service.knowledge_base import KnowledgeBaseService")

print("\n" + "="*60)
print("第5阶段: 测试GUI和工作流")
print("="*60)

test_import("tools.gui.locator", "from tools.gui.locator import ElementLocator")
test_import("core.workflow.executor", "from core.workflow.executor import WorkflowExecutor")
test_import("core.recorder.recorder", "from core.recorder.recorder import Recorder")

print("\n" + "="*60)
print("第6阶段: 测试IPC函数")
print("="*60)

test_import("core.agent.ipc_functions", "from core.agent.ipc_functions import agent_chat")
test_import("core.service.kb_ipc_functions", "from core.service.kb_ipc_functions import kb_search")
test_import("tools.gui.ipc_functions", "from tools.gui.ipc_functions import locate_element")
test_import("core.workflow.ipc_functions", "from core.workflow.ipc_functions import execute_workflow")
test_import("core.recorder.ipc_functions", "from core.recorder.ipc_functions import start_recording")

print("\n" + "="*60)
print("测试完成")
print("="*60)
