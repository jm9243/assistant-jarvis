"""MCP 集成 API"""
from fastapi import APIRouter
from pydantic import BaseModel

from core.mcp.service import mcp_service
from models.common import Result
from models.workflow import Workflow

router = APIRouter()


class McpServerPayload(BaseModel):
    name: str
    endpoint: str
    api_key: str | None = None
    metadata: dict | None = None


class WorkflowToolRequest(BaseModel):
    workflow: Workflow
    server_id: str | None = None


@router.get('/servers')
async def list_servers():
    servers = [server.model_dump() for server in mcp_service.list_servers()]
    return Result(success=True, data=servers)


@router.post('/servers')
async def register_server(payload: McpServerPayload):
    server = mcp_service.register_server(payload.model_dump())
    return Result(success=True, data=server.model_dump())


@router.post('/tools/workflow')
async def register_workflow(payload: WorkflowToolRequest):
    result = mcp_service.register_workflow_tool(payload.workflow, server_id=payload.server_id)
    return Result(success=True, data=result)
