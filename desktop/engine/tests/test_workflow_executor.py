from models.workflow import Workflow, Node, Edge
from core.workflow.executor import executor
import asyncio
import pytest


@pytest.mark.asyncio
async def test_executor_creates_run_and_logs(tmp_path, monkeypatch):
    workflow = Workflow(
        id="wf-test",
        name="测试工作流",
        nodes=[Node(id="n1", type="click", label="Click", config={}, position={})],
        edges=[],
        variables={},
    )
    run = await executor.execute(workflow, {})
    assert run.workflow_id == "wf-test"
    await asyncio.sleep(0.2)
    logs = executor.get_logs(run.id)
    assert any(log.node_id == "n1" for log in logs)
