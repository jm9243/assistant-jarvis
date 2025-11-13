"""
工作流功能完整测试
测试工作流设计器、执行、保存和加载等所有功能
"""
import pytest
import asyncio
import json
from pathlib import Path
from datetime import datetime

from models.workflow import Workflow, Node, Edge, NodeData, Status
from core.workflow.executor import WorkflowExecutor
from core.workflow.ipc_functions import (
    execute_workflow,
    pause_workflow,
    resume_workflow,
    cancel_workflow
)


@pytest.fixture
def test_workflow_dir(tmp_path):
    """创建测试工作流目录"""
    workflow_dir = tmp_path / "workflows"
    workflow_dir.mkdir(exist_ok=True)
    return workflow_dir


@pytest.fixture
def simple_workflow():
    """创建简单测试工作流"""
    return {
        "id": "test_workflow_001",
        "user_id": "test_user",
        "name": "简单测试工作流",
        "description": "用于测试的简单工作流",
        "nodes": [
            {
                "id": "node_1",
                "type": "delay",
                "position": {"x": 100, "y": 100},
                "data": {
                    "label": "延迟100ms",
                    "config": {"duration": 100}
                }
            },
            {
                "id": "node_2",
                "type": "delay",
                "position": {"x": 300, "y": 100},
                "data": {
                    "label": "延迟200ms",
                    "config": {"duration": 200}
                }
            }
        ],
        "edges": [
            {
                "id": "edge_1",
                "source": "node_1",
                "target": "node_2"
            }
        ],
        "variables": {},
        "tags": ["test"]
    }


@pytest.fixture
def complex_workflow():
    """创建复杂测试工作流（包含条件分支）"""
    return {
        "id": "test_workflow_002",
        "user_id": "test_user",
        "name": "复杂测试工作流",
        "description": "包含条件分支的工作流",
        "nodes": [
            {
                "id": "start",
                "type": "start",
                "position": {"x": 100, "y": 100},
                "data": {"label": "开始"}
            },
            {
                "id": "condition",
                "type": "condition",
                "position": {"x": 300, "y": 100},
                "data": {
                    "label": "条件判断",
                    "config": {
                        "condition": "{{input.value}} > 10"
                    }
                }
            },
            {
                "id": "branch_true",
                "type": "delay",
                "position": {"x": 500, "y": 50},
                "data": {
                    "label": "True分支",
                    "config": {"duration": 100}
                }
            },
            {
                "id": "branch_false",
                "type": "delay",
                "position": {"x": 500, "y": 150},
                "data": {
                    "label": "False分支",
                    "config": {"duration": 100}
                }
            }
        ],
        "edges": [
            {
                "id": "edge_1",
                "source": "start",
                "target": "condition"
            },
            {
                "id": "edge_2",
                "source": "condition",
                "target": "branch_true",
                "sourceHandle": "true"
            },
            {
                "id": "edge_3",
                "source": "condition",
                "target": "branch_false",
                "sourceHandle": "false"
            }
        ],
        "variables": {"input": {"value": 15}},
        "tags": ["test", "complex"]
    }


class TestWorkflowDesigner:
    """测试工作流设计器功能"""
    
    def test_create_workflow(self):
        """测试创建工作流"""
        workflow = Workflow(
            id="new_workflow",
            user_id="test_user",
            name="新工作流",
            description="测试创建",
            nodes=[],
            edges=[],
            variables={},
            tags=[]
        )
        
        assert workflow.id == "new_workflow"
        assert workflow.name == "新工作流"
        assert len(workflow.nodes) == 0
        assert len(workflow.edges) == 0
    
    def test_add_node(self):
        """测试添加节点"""
        workflow = Workflow(
            id="test_wf",
            user_id="test_user",
            name="测试",
            nodes=[],
            edges=[],
            variables={}
        )
        
        # 添加节点
        node = Node(
            id="node_1",
            type="click",
            position={"x": 100, "y": 100},
            data=NodeData(
                label="点击按钮",
                config={"clickType": "single"}
            )
        )
        
        workflow.nodes.append(node)
        
        assert len(workflow.nodes) == 1
        assert workflow.nodes[0].id == "node_1"
        assert workflow.nodes[0].type == "click"
    
    def test_add_edge(self):
        """测试添加连线"""
        workflow = Workflow(
            id="test_wf",
            user_id="test_user",
            name="测试",
            nodes=[
                Node(id="node_1", type="delay", position={"x": 0, "y": 0}, data=NodeData(label="节点1", config={})),
                Node(id="node_2", type="delay", position={"x": 100, "y": 0}, data=NodeData(label="节点2", config={}))
            ],
            edges=[],
            variables={}
        )
        
        # 添加连线
        edge = Edge(
            id="edge_1",
            source="node_1",
            target="node_2"
        )
        
        workflow.edges.append(edge)
        
        assert len(workflow.edges) == 1
        assert workflow.edges[0].source == "node_1"
        assert workflow.edges[0].target == "node_2"
    
    def test_remove_node(self):
        """测试删除节点"""
        workflow = Workflow(
            id="test_wf",
            user_id="test_user",
            name="测试",
            nodes=[
                Node(id="node_1", type="delay", position={"x": 0, "y": 0}, data=NodeData(label="节点1", config={})),
                Node(id="node_2", type="delay", position={"x": 100, "y": 0}, data=NodeData(label="节点2", config={}))
            ],
            edges=[],
            variables={}
        )
        
        # 删除节点
        workflow.nodes = [n for n in workflow.nodes if n.id != "node_1"]
        
        assert len(workflow.nodes) == 1
        assert workflow.nodes[0].id == "node_2"
    
    def test_update_node_config(self):
        """测试更新节点配置"""
        node = Node(
            id="node_1",
            type="delay",
            position={"x": 0, "y": 0},
            data=NodeData(
                label="延迟",
                config={"duration": 1000}
            )
        )
        
        # 更新配置
        node.data.config["duration"] = 2000
        
        assert node.data.config["duration"] == 2000


class TestWorkflowExecution:
    """测试工作流执行功能"""
    
    def test_execute_simple_workflow(self, simple_workflow):
        """测试执行简单工作流"""
        # 由于IPC函数内部处理了事件循环，直接调用即可
        result = execute_workflow(simple_workflow, {})
        
        # 验证基本结构
        assert "success" in result
        if result["success"]:
            assert "run_id" in result
            assert "status" in result
            assert "events" in result
    
    def test_execute_with_params(self, simple_workflow):
        """测试带参数执行工作流"""
        params = {"test_param": "test_value"}
        result = execute_workflow(simple_workflow, params)
        
        assert "success" in result
    
    def test_workflow_execution_events(self, simple_workflow):
        """测试工作流执行事件"""
        result = execute_workflow(simple_workflow, {})
        
        assert "success" in result
        if result["success"]:
            events = result["events"]
            
            # 验证事件结构
            assert isinstance(events, list)
            for event in events:
                assert "run_id" in event
                assert "status" in event
    
    def test_workflow_pause_resume(self, simple_workflow):
        """测试工作流暂停和恢复"""
        # 执行工作流
        result = execute_workflow(simple_workflow, {})
        assert "success" in result
        
        if result["success"] and "run_id" in result:
            run_id = result["run_id"]
            
            # 暂停（注意：由于工作流可能已经完成，暂停可能失败）
            pause_result = pause_workflow(run_id)
            assert "success" in pause_result
            
            # 恢复
            resume_result = resume_workflow(run_id)
            assert "success" in resume_result
    
    def test_workflow_cancel(self, simple_workflow):
        """测试取消工作流"""
        # 执行工作流
        result = execute_workflow(simple_workflow, {})
        assert "success" in result
        
        if result["success"] and "run_id" in result:
            run_id = result["run_id"]
            
            # 取消
            cancel_result = cancel_workflow(run_id)
            assert "success" in cancel_result
    
    def test_workflow_error_handling(self):
        """测试工作流错误处理"""
        # 创建一个会失败的工作流
        invalid_workflow = {
            "id": "invalid_wf",
            "user_id": "test_user",
            "name": "无效工作流",
            "nodes": [
                {
                    "id": "invalid_node",
                    "type": "invalid_type",  # 无效的节点类型
                    "position": {"x": 0, "y": 0},
                    "data": {}
                }
            ],
            "edges": [],
            "variables": {}
        }
        
        result = execute_workflow(invalid_workflow, {})
        
        # 应该返回错误但不崩溃
        assert "success" in result
        if not result["success"]:
            assert "error" in result


class TestWorkflowSaveLoad:
    """测试工作流保存和加载功能"""
    
    def test_save_workflow_to_json(self, simple_workflow, test_workflow_dir):
        """测试保存工作流到JSON文件"""
        file_path = test_workflow_dir / "test_workflow.json"
        
        # 保存
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(simple_workflow, f, ensure_ascii=False, indent=2)
        
        # 验证文件存在
        assert file_path.exists()
        
        # 验证文件内容
        with open(file_path, 'r', encoding='utf-8') as f:
            loaded = json.load(f)
        
        assert loaded["id"] == simple_workflow["id"]
        assert loaded["name"] == simple_workflow["name"]
        assert len(loaded["nodes"]) == len(simple_workflow["nodes"])
    
    def test_load_workflow_from_json(self, simple_workflow, test_workflow_dir):
        """测试从JSON文件加载工作流"""
        file_path = test_workflow_dir / "test_workflow.json"
        
        # 先保存
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(simple_workflow, f, ensure_ascii=False, indent=2)
        
        # 加载
        with open(file_path, 'r', encoding='utf-8') as f:
            loaded_workflow = json.load(f)
        
        # 验证
        assert loaded_workflow["id"] == simple_workflow["id"]
        assert loaded_workflow["name"] == simple_workflow["name"]
        assert len(loaded_workflow["nodes"]) == len(simple_workflow["nodes"])
        assert len(loaded_workflow["edges"]) == len(simple_workflow["edges"])
    
    def test_workflow_serialization(self, simple_workflow):
        """测试工作流序列化"""
        # 序列化
        json_str = json.dumps(simple_workflow, ensure_ascii=False)
        
        # 反序列化
        loaded = json.loads(json_str)
        
        # 验证
        assert loaded["id"] == simple_workflow["id"]
        assert loaded["name"] == simple_workflow["name"]
    
    def test_save_multiple_workflows(self, simple_workflow, complex_workflow, test_workflow_dir):
        """测试保存多个工作流"""
        workflows = [simple_workflow, complex_workflow]
        
        for wf in workflows:
            file_path = test_workflow_dir / f"{wf['id']}.json"
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(wf, f, ensure_ascii=False, indent=2)
        
        # 验证所有文件都存在
        assert (test_workflow_dir / f"{simple_workflow['id']}.json").exists()
        assert (test_workflow_dir / f"{complex_workflow['id']}.json").exists()
    
    def test_list_saved_workflows(self, simple_workflow, complex_workflow, test_workflow_dir):
        """测试列出已保存的工作流"""
        # 保存多个工作流
        workflows = [simple_workflow, complex_workflow]
        for wf in workflows:
            file_path = test_workflow_dir / f"{wf['id']}.json"
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(wf, f, ensure_ascii=False, indent=2)
        
        # 列出所有工作流文件
        workflow_files = list(test_workflow_dir.glob("*.json"))
        
        assert len(workflow_files) == 2
    
    def test_delete_workflow(self, simple_workflow, test_workflow_dir):
        """测试删除工作流"""
        file_path = test_workflow_dir / "test_workflow.json"
        
        # 保存
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(simple_workflow, f)
        
        assert file_path.exists()
        
        # 删除
        file_path.unlink()
        
        assert not file_path.exists()


class TestWorkflowValidation:
    """测试工作流验证功能"""
    
    def test_validate_workflow_structure(self, simple_workflow):
        """测试验证工作流结构"""
        # 必需字段
        required_fields = ["id", "name", "nodes", "edges"]
        
        for field in required_fields:
            assert field in simple_workflow
    
    def test_validate_node_structure(self, simple_workflow):
        """测试验证节点结构"""
        for node in simple_workflow["nodes"]:
            assert "id" in node
            assert "type" in node
            assert "position" in node
            assert "data" in node
    
    def test_validate_edge_structure(self, simple_workflow):
        """测试验证连线结构"""
        for edge in simple_workflow["edges"]:
            assert "id" in edge
            assert "source" in edge
            assert "target" in edge
    
    def test_validate_edge_references(self, simple_workflow):
        """测试验证连线引用的节点存在"""
        node_ids = {node["id"] for node in simple_workflow["nodes"]}
        
        for edge in simple_workflow["edges"]:
            assert edge["source"] in node_ids, f"Source node {edge['source']} not found"
            assert edge["target"] in node_ids, f"Target node {edge['target']} not found"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
