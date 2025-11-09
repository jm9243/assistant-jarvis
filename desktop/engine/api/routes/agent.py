"""Agent相关API"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core.agent.service import agent_service
from models.common import Result

router = APIRouter()


class AgentCreateRequest(BaseModel):
    name: str
    type: str = 'basic'
    description: str | None = None
    avatar: str | None = None
    tags: list[str] = []
    config: dict = {}
    knowledge_bases: list[str] = []
    tools: list[str] = []
    permissions: list[str] = []


class AgentUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    avatar: str | None = None
    tags: list[str] | None = None
    config: dict | None = None
    knowledge_bases: list[str] | None = None
    tools: list[str] | None = None
    permissions: list[str] | None = None


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None
    title: str | None = None


@router.get('/')
async def list_agents():
    agents = [agent.model_dump() for agent in agent_service.list_agents()]
    return Result(success=True, data=agents)


@router.post('/')
async def create_agent(payload: AgentCreateRequest):
    agent = agent_service.create_agent(payload.model_dump())
    return Result(success=True, data=agent.model_dump())


@router.get('/templates')
async def list_templates():
    templates = [template.model_dump() for template in agent_service.list_templates()]
    return Result(success=True, data=templates)


@router.get('/{agent_id}')
async def get_agent(agent_id: str):
    agent = agent_service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail='Agent不存在')
    return Result(success=True, data=agent.model_dump())


@router.put('/{agent_id}')
async def update_agent(agent_id: str, payload: AgentUpdateRequest):
    agent = agent_service.update_agent(agent_id, {k: v for k, v in payload.model_dump().items() if v is not None})
    return Result(success=True, data=agent.model_dump())


@router.delete('/{agent_id}')
async def delete_agent(agent_id: str):
    agent_service.delete_agent(agent_id)
    return Result(success=True, data=True)


@router.get('/{agent_id}/sessions')
async def list_sessions(agent_id: str):
    sessions = [session.model_dump() for session in agent_service.list_sessions(agent_id)]
    return Result(success=True, data=sessions)


@router.get('/{agent_id}/memories')
async def list_memories(agent_id: str):
    memories = [memory.model_dump() for memory in agent_service.list_memories(agent_id)]
    return Result(success=True, data=memories)


@router.post('/{agent_id}/chat')
async def chat(agent_id: str, payload: ChatRequest):
    reply = agent_service.chat(agent_id, payload.model_dump())
    return Result(success=True, data=reply)
