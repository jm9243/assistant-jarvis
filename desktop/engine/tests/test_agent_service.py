from core.agent.service import AgentService
from core.knowledge import service as knowledge_module
from core.knowledge.service import KnowledgeService
from utils.config import settings


def test_agent_chat_with_memory(tmp_path):
    original_dir = settings.data_dir
    original_service = knowledge_module.knowledge_service
    try:
        settings.data_dir = tmp_path
        knowledge = KnowledgeService()
        knowledge_module.knowledge_service = knowledge
        knowledge_base = knowledge.create_base({'name': '测试KB'})
        knowledge.add_document(knowledge_base.id, name='指南', content='请及时发送日报')

        service = AgentService()
        agent = service.create_agent({
            'name': '测试Agent',
            'type': 'basic',
            'knowledge_bases': [knowledge_base.id],
        })
        response = service.chat(agent.id, {'message': '需要发送什么内容？'})
        assert 'reply' in response
        assert service.list_memories(agent.id)
    finally:
        settings.data_dir = original_dir
        knowledge_module.knowledge_service = original_service
