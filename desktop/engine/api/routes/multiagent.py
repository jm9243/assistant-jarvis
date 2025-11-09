"""Multi-Agent API"""
from fastapi import APIRouter
from pydantic import BaseModel

from core.multiagent.orchestrator import multi_agent_orchestrator
from models.common import Result

router = APIRouter()


class OrchestrationPayload(BaseModel):
    name: str
    mode: str = 'workflow'
    description: str | None = None
    participants: list[dict] = []
    graph: dict = {}


class MeetingRequest(BaseModel):
    orchestration_id: str
    topic: str
    max_rounds: int = 6


class MeetingTurnRequest(BaseModel):
    agent_id: str
    role: str
    content: str


@router.get('/orchestrations')
async def list_orchestrations():
    data = [item.model_dump() for item in multi_agent_orchestrator.list_orchestrations()]
    return Result(success=True, data=data)


@router.post('/orchestrations')
async def create_orchestration(payload: OrchestrationPayload):
    orchestration = multi_agent_orchestrator.create_orchestration(payload.model_dump())
    return Result(success=True, data=orchestration.model_dump())


@router.put('/orchestrations/{orchestration_id}/graph')
async def update_graph(orchestration_id: str, payload: dict):
    orchestration = multi_agent_orchestrator.update_graph(orchestration_id, payload)
    return Result(success=True, data=orchestration.model_dump())


@router.get('/meetings')
async def list_meetings():
    meetings = [meeting.model_dump() for meeting in multi_agent_orchestrator.list_meetings()]
    return Result(success=True, data=meetings)


@router.post('/meetings')
async def start_meeting(payload: MeetingRequest):
    meeting = multi_agent_orchestrator.start_meeting(payload.orchestration_id, payload.topic, payload.max_rounds)
    return Result(success=True, data=meeting.model_dump())


@router.post('/meetings/{meeting_id}/turns')
async def record_turn(meeting_id: str, payload: MeetingTurnRequest):
    meeting = multi_agent_orchestrator.record_turn(meeting_id, agent_id=payload.agent_id, role=payload.role, content=payload.content)
    return Result(success=True, data=meeting.model_dump())
