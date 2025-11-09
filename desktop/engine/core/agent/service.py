"""Agent 服务实现"""
from __future__ import annotations

from datetime import datetime
from typing import List

from loguru import logger

from models.agent import (
    Agent,
    AgentConfig,
    AgentMemory,
    AgentMessage,
    AgentSession,
    AgentTemplate,
)
from utils.config import settings
from utils.datastore import JsonStore, generate_id


AGENT_TEMPLATES: List[AgentTemplate] = [
    AgentTemplate(
        id='tpl-basic-support',
        name='客服应答',
        description='面向客服问答的 Basic Agent，强调耐心和准确性',
        type='basic',
        tags=['客服', 'FAQ'],
        preset=AgentConfig(system_prompt='你是一名耐心的客服，需要引用知识库回答'),
        recommended_tools=['notification'],
    ),
    AgentTemplate(
        id='tpl-react-automation',
        name='流程执行官',
        description='具备多步推理与工具调用的 ReAct Agent',
        type='react',
        tags=['自动化', 'RPA'],
        preset=AgentConfig(tool_strategy='auto', max_iterations=6),
        recommended_tools=['workflow', 'http'],
    ),
    AgentTemplate(
        id='tpl-research',
        name='深度研究员',
        description='自动拆解研究任务并生成报告',
        type='research',
        tags=['研究', '报告'],
        preset=AgentConfig(system_prompt='你是一名研究员，需要结构化输出', max_tokens=4000),
        recommended_tools=['knowledge-search'],
    ),
]


class AgentService:
    def __init__(self) -> None:
        data_dir = settings.data_dir / 'data'
        self._agent_store = JsonStore(data_dir / 'agents.json', [])
        self._session_store = JsonStore(data_dir / 'agent_sessions.json', [])
        self._memory_store = JsonStore(data_dir / 'agent_memories.json', [])

    # ------------------------- Agent CRUD -------------------------
    def list_agents(self) -> List[Agent]:
        return [Agent.model_validate(item) for item in self._agent_store.read()]

    def get_agent(self, agent_id: str) -> Agent | None:
        for agent in self.list_agents():
            if agent.id == agent_id:
                return agent
        return None

    def create_agent(self, payload: dict) -> Agent:
        agent = Agent(
            id=payload.get('id', generate_id('agent')),
            name=payload['name'],
            type=payload.get('type', 'basic'),
            description=payload.get('description'),
            avatar=payload.get('avatar'),
            tags=payload.get('tags', []),
            config=AgentConfig(**payload.get('config', {})),
            knowledge_bases=payload.get('knowledge_bases', []),
            tools=payload.get('tools', []),
            permissions=payload.get('permissions', []),
        )
        agents = self.list_agents()
        agents.append(agent)
        self._agent_store.write([item.model_dump() for item in agents])
        logger.info('Created agent {}', agent.id)
        return agent

    def update_agent(self, agent_id: str, updates: dict) -> Agent:
        agents = self.list_agents()
        updated_agent: Agent | None = None
        patched: List[Agent] = []
        for agent in agents:
            if agent.id == agent_id:
                updated_agent = agent.model_copy(update={
                    **updates,
                    'config': AgentConfig(**(updates.get('config') or agent.config.model_dump())),
                    'updated_at': datetime.utcnow(),
                })
                patched.append(updated_agent)
            else:
                patched.append(agent)
        if not updated_agent:
            raise ValueError('Agent not found')
        self._agent_store.write([item.model_dump() for item in patched])
        return updated_agent

    def delete_agent(self, agent_id: str) -> None:
        agents = [agent for agent in self.list_agents() if agent.id != agent_id]
        self._agent_store.write([item.model_dump() for item in agents])

    # ------------------------- Templates -------------------------
    def list_templates(self) -> List[AgentTemplate]:
        return AGENT_TEMPLATES

    # ------------------------- Sessions -------------------------
    def list_sessions(self, agent_id: str | None = None) -> List[AgentSession]:
        sessions = [AgentSession.model_validate(item) for item in self._session_store.read()]
        if agent_id:
            return [session for session in sessions if session.agent_id == agent_id]
        return sessions

    def get_session(self, session_id: str) -> AgentSession | None:
        for session in self.list_sessions():
            if session.id == session_id:
                return session
        return None

    def create_session(self, agent_id: str, title: str | None = None) -> AgentSession:
        session = AgentSession(id=generate_id('session'), agent_id=agent_id, title=title or '新会话')
        sessions = self.list_sessions()
        sessions.append(session)
        self._session_store.write([item.model_dump() for item in sessions])
        return session

    def _persist_session(self, session: AgentSession) -> None:
        sessions = []
        for existing in self.list_sessions():
            if existing.id == session.id:
                sessions.append(session)
            else:
                sessions.append(existing)
        self._session_store.write([item.model_dump() for item in sessions])

    # ------------------------- Memory -------------------------
    def list_memories(self, agent_id: str | None = None) -> List[AgentMemory]:
        memories = [AgentMemory.model_validate(item) for item in self._memory_store.read()]
        if agent_id:
            return [memory for memory in memories if memory.agent_id == agent_id]
        return memories

    def record_memory(self, agent_id: str, scope: str, content: str, importance: str = 'low') -> AgentMemory:
        scope_value = scope if scope in {'short_term', 'long_term', 'working'} else 'short_term'
        importance_value = importance if importance in {'low', 'medium', 'high'} else 'low'
        memory = AgentMemory(
            id=generate_id('memory'),
            agent_id=agent_id,
            scope=scope_value,  # type: ignore[arg-type]
            content=content,
            importance=importance_value,  # type: ignore[arg-type]
        )
        memories = self.list_memories()
        memories.append(memory)
        self._memory_store.write([item.model_dump() for item in memories])
        return memory

    # ------------------------- Chatting -------------------------
    def chat(self, agent_id: str, payload: dict) -> dict:
        agent = self.get_agent(agent_id)
        if not agent:
            raise ValueError('Agent 不存在')

        session_id = payload.get('session_id')
        session = self.get_session(session_id) if session_id else None
        if not session:
            session = self.create_session(agent_id, title=payload.get('title'))

        user_message = AgentMessage(role='user', content=payload['message'])
        session.messages.append(user_message)

        context_fragments: List[str] = []
        if agent.knowledge_bases:
            try:
                from core.knowledge.service import knowledge_service  # 延迟导入避免循环

                results = knowledge_service.search(agent.knowledge_bases, payload['message'], top_k=2)
                context_fragments = [result.content for result in results]
            except Exception as error:  # pragma: no cover - 防御性
                logger.warning('知识检索失败: {}', error)

        response_text = self._build_response(agent, payload['message'], context_fragments)
        assistant_message = AgentMessage(
            role='assistant',
            content=response_text,
            references=agent.knowledge_bases[:2],
        )
        session.messages.append(assistant_message)
        session.updated_at = datetime.utcnow()
        self._persist_session(session)

        self._update_metrics(agent, len(response_text))
        self.record_memory(agent_id, 'short_term', content=payload['message'])

        return {
            'session': session.model_dump(),
            'reply': assistant_message.model_dump(),
            'context': context_fragments,
        }

    def _build_response(self, agent: Agent, prompt: str, context: List[str]) -> str:
        preface = '当前暂无相关知识，已基于模型能力回复。'
        if context:
            preface = '结合知识库引用，给出如下建议：'
        summary = prompt[:100]
        context_summary = '\n'.join(f'- {fragment[:120]}' for fragment in context)
        return (
            f"{preface}\n"
            f"用户意图：{summary}\n"
            f"Agent({agent.type}) 建议：请按既定流程执行，并注意安全校验。\n"
            f"参考：\n{context_summary if context_summary else '- 无可靠引用'}"
        )

    def _update_metrics(self, agent: Agent, tokens: int) -> None:
        total_calls = agent.metrics.calls + 1
        avg_latency = (agent.metrics.avg_latency_ms * agent.metrics.calls + 1200) / total_calls
        success_rate = min(1.0, (agent.metrics.success_rate * agent.metrics.calls + 1) / total_calls)
        updated = agent.model_copy(update={
            'metrics': {
                'calls': total_calls,
                'avg_latency_ms': avg_latency,
                'success_rate': success_rate,
                'token_usage': agent.metrics.token_usage + tokens,
                'tool_invocations': agent.metrics.tool_invocations,
            },
            'updated_at': datetime.utcnow(),
        })
        self.update_agent(agent.id, updated.model_dump())


agent_service = AgentService()
