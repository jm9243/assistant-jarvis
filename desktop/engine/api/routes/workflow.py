from fastapi import APIRouter, HTTPException
from typing import List, Optional
from models import Result, Workflow
from loguru import logger
from database import db

router = APIRouter()


@router.get("/list", response_model=Result[List[dict]])
async def list_workflows():
    """获取工作流列表"""
    try:
        workflows = db.list_workflows()
        return Result.ok(workflows)
    except Exception as e:
        logger.error(f"Failed to list workflows: {e}")
        return Result.fail(str(e))


@router.get("/{workflow_id}", response_model=Result[dict])
async def get_workflow(workflow_id: str):
    """获取工作流详情"""
    try:
        workflow = db.get_workflow(workflow_id)
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        return Result.ok(workflow)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get workflow: {e}")
        return Result.fail(str(e))


@router.post("/create", response_model=Result[dict])
async def create_workflow(workflow: Workflow):
    """创建工作流"""
    try:
        workflow_dict = workflow.dict()
        db.save_workflow(workflow_dict)
        logger.info(f"Created workflow: {workflow.id}")
        return Result.ok(workflow_dict)
    except Exception as e:
        logger.error(f"Failed to create workflow: {e}")
        return Result.fail(str(e))


@router.put("/{workflow_id}", response_model=Result[dict])
async def update_workflow(workflow_id: str, workflow: Workflow):
    """更新工作流"""
    try:
        existing = db.get_workflow(workflow_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Workflow not found")

        workflow_dict = workflow.dict()
        db.save_workflow(workflow_dict)
        logger.info(f"Updated workflow: {workflow_id}")
        return Result.ok(workflow_dict)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update workflow: {e}")
        return Result.fail(str(e))


@router.delete("/{workflow_id}", response_model=Result[None])
async def delete_workflow(workflow_id: str):
    """删除工作流"""
    try:
        existing = db.get_workflow(workflow_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Workflow not found")

        db.delete_workflow(workflow_id)
        logger.info(f"Deleted workflow: {workflow_id}")
        return Result.ok()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete workflow: {e}")
        return Result.fail(str(e))


@router.post("/{workflow_id}/execute", response_model=Result[dict])
async def execute_workflow(workflow_id: str, params: Optional[dict] = None):
    """执行工作流"""
    try:
        workflow_dict = db.get_workflow(workflow_id)
        if not workflow_dict:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # 转换为 Workflow 对象
        workflow = Workflow(**workflow_dict)

        from core.workflow import WorkflowExecutor
        from api.server import manager

        executor = WorkflowExecutor()
        params = params or {}

        # 启动异步执行
        async def execute_and_broadcast():
            async for event in executor.execute(workflow, params):
                # 通过WebSocket广播执行事件
                await manager.broadcast("execution_event", event.dict())

        # 在后台执行
        import asyncio
        asyncio.create_task(execute_and_broadcast())

        # 立即返回run_id
        run_id = f"run_{workflow_id}_{int(time.time())}"
        logger.info(f"Starting workflow execution: {run_id}")

        return Result.ok({"runId": run_id})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to execute workflow: {e}")
        return Result.fail(str(e))


@router.post("/execution/{run_id}/pause", response_model=Result[None])
async def pause_execution(run_id: str):
    """暂停执行"""
    try:
        # TODO: 实现暂停逻辑
        logger.info(f"Pausing execution: {run_id}")
        return Result.ok()
    except Exception as e:
        logger.error(f"Failed to pause execution: {e}")
        return Result.fail(str(e))


@router.post("/execution/{run_id}/resume", response_model=Result[None])
async def resume_execution(run_id: str):
    """恢复执行"""
    try:
        # TODO: 实现恢复逻辑
        logger.info(f"Resuming execution: {run_id}")
        return Result.ok()
    except Exception as e:
        logger.error(f"Failed to resume execution: {e}")
        return Result.fail(str(e))


@router.post("/execution/{run_id}/cancel", response_model=Result[None])
async def cancel_execution(run_id: str):
    """取消执行"""
    try:
        # TODO: 实现取消逻辑
        logger.info(f"Cancelling execution: {run_id}")
        return Result.ok()
    except Exception as e:
        logger.error(f"Failed to cancel execution: {e}")
        return Result.fail(str(e))


import time
