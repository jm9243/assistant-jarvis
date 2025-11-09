"""AI 助手 API"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core.assistant.service import assistant_service
from models.common import Result

router = APIRouter()


class PlanRequest(BaseModel):
    query: str


class StepUpdateRequest(BaseModel):
    status: str
    result: str | None = None


class CompleteRequest(BaseModel):
    summary: str


@router.get('/tasks')
async def list_tasks():
    tasks = [task.model_dump() for task in assistant_service.list_tasks()]
    return Result(success=True, data=tasks)


@router.post('/plan')
async def plan(payload: PlanRequest):
    task = assistant_service.plan(payload.query)
    return Result(success=True, data=task.model_dump())


@router.post('/tasks/{task_id}/steps/{step_id}')
async def update_step(task_id: str, step_id: str, payload: StepUpdateRequest):
    task = assistant_service.update_step(task_id, step_id, payload.status, payload.result)
    return Result(success=True, data=task.model_dump())


@router.post('/tasks/{task_id}/complete')
async def complete_task(task_id: str, payload: CompleteRequest):
    task = assistant_service.mark_completed(task_id, payload.summary)
    if not task:
        raise HTTPException(status_code=404, detail='Task不存在')
    return Result(success=True, data=task.model_dump())
