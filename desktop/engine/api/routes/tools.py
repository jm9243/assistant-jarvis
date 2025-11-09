"""工具治理 API"""
from fastapi import APIRouter
from pydantic import BaseModel

from core.tools.registry import tool_registry
from models.common import Result

router = APIRouter()


class ToolPayload(BaseModel):
    name: str
    type: str = 'workflow'
    description: str
    entrypoint: str | None = None
    config: dict = {}
    tags: list[str] = []
    enabled: bool = True
    approval_required: bool = False


class ApprovalRequest(BaseModel):
    reason: str
    params: dict = {}
    requested_by: str = 'system'


class ApprovalReview(BaseModel):
    decision: str
    reviewer: str
    note: str | None = None


class AuditRecord(BaseModel):
    tool_id: str
    triggered_by: str
    duration_ms: int
    status: str
    metadata: dict | None = None


@router.get('/')
async def list_tools():
    tools = [tool.model_dump() for tool in tool_registry.list_tools()]
    return Result(success=True, data=tools)


@router.post('/')
async def register_tool(payload: ToolPayload):
    tool = tool_registry.register_tool(payload.model_dump())
    return Result(success=True, data=tool.model_dump())


@router.put('/{tool_id}')
async def update_tool(tool_id: str, payload: ToolPayload):
    tool = tool_registry.update_tool(tool_id, payload.model_dump())
    return Result(success=True, data=tool.model_dump())


@router.delete('/{tool_id}')
async def delete_tool(tool_id: str):
    tool_registry.delete_tool(tool_id)
    return Result(success=True, data=True)


@router.post('/{tool_id}/approval')
async def request_approval(tool_id: str, payload: ApprovalRequest):
    approval = tool_registry.request_approval(tool_id, reason=payload.reason, params=payload.params, requested_by=payload.requested_by)
    return Result(success=True, data=approval.model_dump())


@router.post('/approvals/{approval_id}/review')
async def review_approval(approval_id: str, payload: ApprovalReview):
    approval = tool_registry.review_approval(approval_id, reviewer=payload.reviewer, decision=payload.decision, note=payload.note)
    return Result(success=True, data=approval.model_dump())


@router.get('/approvals')
async def list_approvals():
    approvals = [approval.model_dump() for approval in tool_registry.list_approvals()]
    return Result(success=True, data=approvals)


@router.get('/audits')
async def list_audits():
    audits = [audit.model_dump() for audit in tool_registry.list_audits()]
    return Result(success=True, data=audits)


@router.post('/audits')
async def record_audit(payload: AuditRecord):
    audit = tool_registry.record_audit(payload.tool_id, triggered_by=payload.triggered_by, duration_ms=payload.duration_ms, status=payload.status, metadata=payload.metadata)
    return Result(success=True, data=audit.model_dump())


@router.get('/kpi')
async def governance_kpi():
    return Result(success=True, data=tool_registry.kpis())
