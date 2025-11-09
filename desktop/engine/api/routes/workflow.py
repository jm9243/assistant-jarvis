"""工作流相关API"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from core.workflow.executor import executor
from models.common import Result
from models.workflow import Workflow

router = APIRouter()


class WorkflowExecuteRequest(BaseModel):
    workflow: Workflow
    params: dict | None = None
    priority: str = 'medium'


class TemplatePayload(BaseModel):
    name: str
    params: dict


class TriggerPayload(BaseModel):
    type: str
    config: dict
    enabled: bool = True


@router.post("/execute")
async def execute_workflow(payload: WorkflowExecuteRequest):
    """执行工作流"""
    run = await executor.execute(payload.workflow, payload.params, payload.priority)
    return Result(success=True, data=run.model_dump())


@router.get("/runs")
async def list_runs():
    runs = [run.model_dump() for run in executor.list_runs()]
    return Result(success=True, data=runs)


@router.get("/{run_id}/logs")
async def get_logs(run_id: str):
    logs = [log.model_dump() for log in executor.get_logs(run_id)]
    return Result(success=True, data=logs)


@router.post('/runs/{run_id}/pause')
async def pause_run(run_id: str):
    await executor.pause(run_id)
    return Result(success=True, data=True)


@router.post('/runs/{run_id}/resume')
async def resume_run(run_id: str):
    await executor.resume(run_id)
    return Result(success=True, data=True)


@router.post('/runs/{run_id}/cancel')
async def cancel_run(run_id: str):
    await executor.cancel(run_id)
    return Result(success=True, data=True)


@router.get('/{workflow_id}/templates')
async def list_templates(workflow_id: str):
    return Result(success=True, data=executor.list_templates(workflow_id))


@router.post('/{workflow_id}/templates')
async def save_template(workflow_id: str, payload: TemplatePayload):
    template = executor.save_template(workflow_id, payload.name, payload.params)
    return Result(success=True, data=template)


@router.get('/{workflow_id}/triggers')
async def list_triggers(workflow_id: str):
    return Result(success=True, data=executor.list_triggers(workflow_id))


@router.post('/{workflow_id}/triggers')
async def save_trigger(workflow_id: str, payload: TriggerPayload):
    trigger = executor.save_trigger(workflow_id, payload.type, payload.config, payload.enabled)
    return Result(success=True, data=trigger)


@router.websocket("/ws")
async def workflow_ws(websocket: WebSocket):
    await websocket.accept()
    queue = executor.subscribe()
    try:
        while True:
            payload = await queue.get()
            await websocket.send_json(payload)
    except WebSocketDisconnect:
        pass
    finally:
        executor.unsubscribe(queue)
