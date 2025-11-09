"""Multi-Agent 协作服务"""
from __future__ import annotations

from datetime import datetime
from typing import List

from models.multiagent import Meeting, MeetingTurn, Orchestration, Participant
from utils.config import settings
from utils.datastore import JsonStore, generate_id


class MultiAgentOrchestrator:
    def __init__(self) -> None:
        data_dir = settings.data_dir / 'data'
        self._orchestration_store = JsonStore(data_dir / 'orchestrations.json', [])
        self._meeting_store = JsonStore(data_dir / 'meetings.json', [])

    # ------------------------- Orchestrations -------------------------
    def list_orchestrations(self) -> List[Orchestration]:
        return [Orchestration.model_validate(item) for item in self._orchestration_store.read()]

    def create_orchestration(self, payload: dict) -> Orchestration:
        orchestration = Orchestration(
            id=payload.get('id', generate_id('orch')),
            name=payload['name'],
            mode=payload.get('mode', 'workflow'),
            description=payload.get('description'),
            participants=[Participant(**participant) for participant in payload.get('participants', [])],
            graph=payload.get('graph', {}),
        )
        data = self.list_orchestrations()
        data.append(orchestration)
        self._orchestration_store.write([item.model_dump() for item in data])
        return orchestration

    def update_graph(self, orchestration_id: str, graph: dict) -> Orchestration:
        data = []
        updated: Orchestration | None = None
        for orch in self.list_orchestrations():
            if orch.id == orchestration_id:
                updated = orch.model_copy(update={'graph': graph, 'updated_at': datetime.utcnow()})
                data.append(updated)
            else:
                data.append(orch)
        if not updated:
            raise ValueError('Orchestration not found')
        self._orchestration_store.write([item.model_dump() for item in data])
        return updated

    # ------------------------- Meetings -------------------------
    def list_meetings(self, orchestration_id: str | None = None) -> List[Meeting]:
        meetings = [Meeting.model_validate(item) for item in self._meeting_store.read()]
        if orchestration_id:
            return [meeting for meeting in meetings if meeting.orchestration_id == orchestration_id]
        return meetings

    def start_meeting(self, orchestration_id: str, topic: str, max_rounds: int = 6) -> Meeting:
        meeting = Meeting(
            id=generate_id('meeting'),
            orchestration_id=orchestration_id,
            topic=topic,
            status='running',
            max_rounds=max_rounds,
        )
        meetings = self.list_meetings()
        meetings.append(meeting)
        self._meeting_store.write([item.model_dump() for item in meetings])
        return meeting

    def record_turn(self, meeting_id: str, *, agent_id: str, role: str, content: str) -> Meeting:
        meetings = []
        updated: Meeting | None = None
        for meeting in self.list_meetings():
            if meeting.id == meeting_id:
                turn = MeetingTurn(speaker_agent_id=agent_id, role=role, content=content)
                meeting.turns.append(turn)
                meeting.round = min(meeting.max_rounds, meeting.round + 1)
                updated = meeting
            meetings.append(meeting)
        if not updated:
            raise ValueError('Meeting not found')
        if updated.round >= updated.max_rounds:
            updated.status = 'completed'
            updated.summary = '会议达到最大轮次，等待人工总结'
        self._meeting_store.write([item.model_dump() for item in meetings])
        return updated


multi_agent_orchestrator = MultiAgentOrchestrator()
