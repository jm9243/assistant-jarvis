"""MCP 集成服务"""
from __future__ import annotations

from typing import List

from models.mcp import McpServer
from models.workflow import Workflow
from utils.config import settings
from utils.datastore import JsonStore, generate_id

from core.tools.registry import tool_registry


class McpService:
    def __init__(self) -> None:
        data_dir = settings.data_dir / 'data'
        self._server_store = JsonStore(data_dir / 'mcp_servers.json', [])

    def list_servers(self) -> List[McpServer]:
        return [McpServer.model_validate(item) for item in self._server_store.read()]

    def register_server(self, payload: dict) -> McpServer:
        server = McpServer(
            id=payload.get('id', generate_id('mcp')),
            name=payload['name'],
            endpoint=payload['endpoint'],
            api_key=payload.get('api_key'),
            metadata=payload.get('metadata', {}),
        )
        servers = self.list_servers()
        servers.append(server)
        self._server_store.write([item.model_dump() for item in servers])
        return server

    def register_workflow_tool(self, workflow: Workflow, *, server_id: str | None = None) -> dict:
        definition = tool_registry.register_tool({
            'name': workflow.name,
            'type': 'workflow',
            'description': workflow.description or 'Workflow exported as MCP tool',
            'entrypoint': workflow.id,
            'approval_required': False,
            'tags': ['workflow', 'mcp'],
        })
        if server_id:
            servers = []
            for server in self.list_servers():
                if server.id == server_id:
                    server.tools.append(definition.id)
                servers.append(server)
            self._server_store.write([item.model_dump() for item in servers])
        return {
            'tool': definition.model_dump(),
            'server': server_id,
        }


mcp_service = McpService()
