"""AI 助手服务"""
from __future__ import annotations

from datetime import datetime
from typing import List

from models.assistant import AssistantTask, PlanStep
from utils.config import settings
from utils.datastore import JsonStore, generate_id


class AssistantService:
    def __init__(self) -> None:
        data_dir = settings.data_dir / 'data'
        self._task_store = JsonStore(data_dir / 'assistant_tasks.json', [])

    def list_tasks(self) -> List[AssistantTask]:
        return [AssistantTask.model_validate(item) for item in self._task_store.read()]

    def get_task(self, task_id: str) -> AssistantTask | None:
        for task in self.list_tasks():
            if task.id == task_id:
                return task
        return None

    def plan(self, query: str) -> AssistantTask:
        intent = self._infer_intent(query)
        steps = self._build_steps(intent, query)
        task = AssistantTask(
            id=generate_id('task'),
            intent=intent,
            query=query,
            confidence=0.82,
            steps=steps,
        )
        tasks = self.list_tasks()
        tasks.append(task)
        self._task_store.write([item.model_dump() for item in tasks])
        return task

    def update_step(self, task_id: str, step_id: str, status: str, result: str | None = None) -> AssistantTask:
        tasks = []
        updated: AssistantTask | None = None
        for task in self.list_tasks():
            if task.id == task_id:
                new_steps = []
                for step in task.steps:
                    if step.id == step_id:
                        new_steps.append(step.model_copy(update={'status': status, 'result': result}))
                    else:
                        new_steps.append(step)
                updated = task.model_copy(update={'steps': new_steps, 'updated_at': datetime.utcnow()})
                tasks.append(updated)
            else:
                tasks.append(task)
        if not updated:
            raise ValueError('Task not found')
        self._task_store.write([item.model_dump() for item in tasks])
        return updated

    def mark_completed(self, task_id: str, summary: str) -> AssistantTask:
        tasks = []
        updated: AssistantTask | None = None
        for task in self.list_tasks():
            if task.id == task_id:
                updated = task.model_copy(update={
                    'status': 'completed',
                    'result_summary': summary,
                    'updated_at': datetime.utcnow(),
                })
                tasks.append(updated)
            else:
                tasks.append(task)
        if not updated:
            raise ValueError('Task not found')
        self._task_store.write([item.model_dump() for item in tasks])
        return updated

    def _infer_intent(self, query: str) -> str:
        lowered = query.lower()
        if any(keyword in lowered for keyword in ['知识库', '文档', 'rag']):
            return 'knowledge'
        if any(keyword in lowered for keyword in ['通话', '语音', 'tts', 'asr']):
            return 'voice'
        if 'agent' in lowered or '多智能体' in lowered:
            return 'agent'
        return 'workflow'

    def _build_steps(self, intent: str, query: str) -> List[PlanStep]:
        steps: List[PlanStep] = []
        steps.append(
            PlanStep(
                id=generate_id('step'),
                description='解析用户自然语言意图并抽取关键参数',
                target_type='knowledge',
                status='running',
                inputs={'query': query},
            )
        )
        if intent == 'workflow':
            steps.append(
                PlanStep(
                    id=generate_id('step'),
                    description='在工作流库中定位匹配模板并准备参数',
                    target_type='workflow',
                )
            )
            steps.append(
                PlanStep(
                    id=generate_id('step'),
                    description='执行工作流并流式返回日志',
                    target_type='tool',
                )
            )
        elif intent == 'knowledge':
            steps.append(
                PlanStep(
                    id=generate_id('step'),
                    description='召回知识库片段，进行RAG总结',
                    target_type='knowledge',
                )
            )
        elif intent == 'agent':
            steps.append(
                PlanStep(
                    id=generate_id('step'),
                    description='挑选合适的Agent模板并绑定工具',
                    target_type='agent',
                )
            )
        else:  # voice
            steps.append(
                PlanStep(
                    id=generate_id('step'),
                    description='校验虚拟音频设备并配置 ASR/TTS',
                    target_type='tool',
                )
            )
        return steps


assistant_service = AssistantService()
