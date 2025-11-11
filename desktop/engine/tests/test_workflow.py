"""工作流执行器测试"""

import pytest
from models import Workflow, Node, NodeData, Status


def test_workflow_creation():
    """测试工作流创建"""
    workflow = Workflow(
        id="test_workflow",
        name="测试工作流",
        version="1.0.0",
        nodes=[],
        edges=[],
        variables={},
    )

    assert workflow.id == "test_workflow"
    assert workflow.name == "测试工作流"
    assert len(workflow.nodes) == 0


def test_node_creation():
    """测试节点创建"""
    node = Node(
        id="node_1",
        type="click",
        position={"x": 0, "y": 0},
        data=NodeData(
            label="点击按钮",
            config={"clickType": "single"},
        ),
    )

    assert node.id == "node_1"
    assert node.type == "click"
    assert node.data.label == "点击按钮"


@pytest.mark.asyncio
async def test_workflow_execution():
    """测试工作流执行"""
    from core.workflow import WorkflowExecutor

    workflow = Workflow(
        id="test_workflow",
        name="测试工作流",
        version="1.0.0",
        nodes=[
            Node(
                id="node_1",
                type="delay",
                position={"x": 0, "y": 0},
                data=NodeData(
                    label="延迟1秒",
                    config={"duration": 100},  # 100ms for testing
                ),
            )
        ],
        edges=[],
        variables={},
    )

    executor = WorkflowExecutor()
    events = []

    async for event in executor.execute(workflow, {}):
        events.append(event)

    # 应该有开始、节点执行、完成三个事件
    assert len(events) >= 3
    assert events[0].status == Status.RUNNING
    assert events[-1].status == Status.COMPLETED
