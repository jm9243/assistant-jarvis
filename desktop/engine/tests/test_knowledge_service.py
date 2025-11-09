from core.knowledge.service import KnowledgeService
from utils.config import settings


def test_knowledge_search(tmp_path, monkeypatch):
    original_dir = settings.data_dir
    try:
        settings.data_dir = tmp_path
        service = KnowledgeService()
        base = service.create_base({'name': '测试知识库'})
        service.add_document(base.id, name='销售周报', content='销售周报显示业绩大幅增长')
        results = service.search([base.id], '业绩')
        assert results
        assert results[0].content
    finally:
        settings.data_dir = original_dir
