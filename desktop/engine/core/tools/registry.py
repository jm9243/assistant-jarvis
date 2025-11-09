"""工具与治理服务"""
from __future__ import annotations

from datetime import datetime
from statistics import mean
from typing import Dict, List

from models.tools import ApprovalStatus, ToolApproval, ToolAudit, ToolDefinition
from utils.config import settings
from utils.datastore import JsonStore, generate_id


class ToolRegistry:
    def __init__(self) -> None:
        data_dir = settings.data_dir / 'data'
        self._tool_store = JsonStore(data_dir / 'tools.json', [])
        self._approval_store = JsonStore(data_dir / 'tool_approvals.json', [])
        self._audit_store = JsonStore(data_dir / 'tool_audits.json', [])

    # ------------------------- 工具管理 -------------------------
    def list_tools(self) -> List[ToolDefinition]:
        return [ToolDefinition.model_validate(item) for item in self._tool_store.read()]

    def get_tool(self, tool_id: str) -> ToolDefinition | None:
        for tool in self.list_tools():
            if tool.id == tool_id:
                return tool
        return None

    def register_tool(self, payload: dict) -> ToolDefinition:
        tool = ToolDefinition(
            id=payload.get('id', generate_id('tool')),
            name=payload['name'],
            type=payload.get('type', 'workflow'),
            description=payload.get('description', ''),
            entrypoint=payload.get('entrypoint'),
            config=payload.get('config', {}),
            tags=payload.get('tags', []),
            enabled=payload.get('enabled', True),
            approval_required=payload.get('approval_required', False),
        )
        tools = self.list_tools()
        tools.append(tool)
        self._tool_store.write([item.model_dump() for item in tools])
        return tool

    def update_tool(self, tool_id: str, updates: dict) -> ToolDefinition:
        tools = []
        updated: ToolDefinition | None = None
        for tool in self.list_tools():
            if tool.id == tool_id:
                updated = tool.model_copy(update={**updates, 'updated_at': datetime.utcnow()})
                tools.append(updated)
            else:
                tools.append(tool)
        if not updated:
            raise ValueError('Tool not found')
        self._tool_store.write([item.model_dump() for item in tools])
        return updated

    def delete_tool(self, tool_id: str) -> None:
        tools = [tool for tool in self.list_tools() if tool.id != tool_id]
        self._tool_store.write([item.model_dump() for item in tools])

    # ------------------------- 审批 -------------------------
    def list_approvals(self, status: ApprovalStatus | None = None) -> List[ToolApproval]:
        approvals = [ToolApproval.model_validate(item) for item in self._approval_store.read()]
        if status:
            return [approval for approval in approvals if approval.status == status]
        return approvals

    def request_approval(self, tool_id: str, *, reason: str, params: Dict[str, str], requested_by: str) -> ToolApproval:
        approval = ToolApproval(
            id=generate_id('approval'),
            tool_id=tool_id,
            reason=reason,
            params=params,
            requested_by=requested_by,
        )
        approvals = self.list_approvals()
        approvals.append(approval)
        self._approval_store.write([item.model_dump() for item in approvals])
        return approval

    def review_approval(self, approval_id: str, *, reviewer: str, decision: ApprovalStatus, note: str | None = None) -> ToolApproval:
        approvals = []
        updated: ToolApproval | None = None
        for approval in self.list_approvals():
            if approval.id == approval_id:
                updated = approval.model_copy(update={
                    'status': decision,
                    'reviewer': reviewer,
                    'decision_note': note,
                    'decided_at': datetime.utcnow(),
                })
                approvals.append(updated)
            else:
                approvals.append(approval)
        if not updated:
            raise ValueError('Approval not found')
        self._approval_store.write([item.model_dump() for item in approvals])
        return updated

    # ------------------------- 审计 -------------------------
    def list_audits(self, tool_id: str | None = None) -> List[ToolAudit]:
        audits = [ToolAudit.model_validate(item) for item in self._audit_store.read()]
        if tool_id:
            return [audit for audit in audits if audit.tool_id == tool_id]
        return audits

    def record_audit(self, tool_id: str, *, triggered_by: str, duration_ms: int, status: str, metadata: Dict[str, str] | None = None) -> ToolAudit:
        status_value = status if status in {'success', 'failed', 'cancelled'} else 'failed'
        audit = ToolAudit(
            id=generate_id('audit'),
            tool_id=tool_id,
            triggered_by=triggered_by,
            duration_ms=duration_ms,
            status=status_value,  # type: ignore[arg-type]
            metadata=metadata or {},
        )
        audits = self.list_audits()
        audits.append(audit)
        self._audit_store.write([item.model_dump() for item in audits])
        return audit

    # ------------------------- 运营指标 -------------------------
    def kpis(self) -> Dict[str, float]:
        audits = self.list_audits()
        if not audits:
            return {'calls': 0, 'success_rate': 1.0, 'avg_duration': 0.0}
        calls = len(audits)
        success = len([audit for audit in audits if audit.status == 'success']) or 1
        avg_duration = mean(audit.duration_ms for audit in audits)
        return {
            'calls': calls,
            'success_rate': round(success / calls, 2),
            'avg_duration': round(avg_duration, 2),
        }


tool_registry = ToolRegistry()
