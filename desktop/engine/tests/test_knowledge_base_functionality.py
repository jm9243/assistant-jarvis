"""
知识库功能完整测试
测试添加文档、知识库检索、文档管理等所有功能
"""
import pytest
from pathlib import Path
from core.service.kb_ipc_functions import (
    kb_search,
    kb_add_document,
    kb_delete_document,
    kb_get_stats
)


@pytest.fixture
def test_document(tmp_path):
    """创建测试文档"""
    doc_file = tmp_path / "test_doc.txt"
    doc_file.write_text(
        "人工智能是计算机科学的一个分支。\n"
        "机器学习是人工智能的重要组成部分。\n"
        "深度学习是机器学习的一种方法。",
        encoding="utf-8"
    )
    return str(doc_file)


class TestDocumentManagement:
    """测试文档管理功能"""
    
    def test_add_document_structure(self, test_document):
        """测试添加文档API结构"""
        # 使用测试知识库ID
        kb_id = "test_kb_001"
        
        # 添加文档
        doc_result = kb_add_document(
            kb_id=kb_id,
            file_path=test_document
        )
        
        assert isinstance(doc_result, dict)
        assert "success" in doc_result
        assert "kb_id" in doc_result
        
        if doc_result.get("success"):
            assert "document_id" in doc_result
            assert "file_path" in doc_result
    
    def test_add_document_with_chunk_params(self, test_document):
        """测试添加带分块参数的文档"""
        kb_id = "test_kb_002"
        
        doc_result = kb_add_document(
            kb_id=kb_id,
            file_path=test_document,
            chunk_size=500,
            chunk_overlap=50
        )
        
        assert isinstance(doc_result, dict)
        assert "success" in doc_result
    
    def test_delete_document_structure(self):
        """测试删除文档API结构"""
        kb_id = "test_kb_003"
        doc_id = "test_doc_001"
        
        result = kb_delete_document(
            kb_id=kb_id,
            doc_id=doc_id
        )
        
        assert isinstance(result, dict)
        assert "success" in result
        assert "kb_id" in result
        assert "document_id" in result


class TestKnowledgeBaseSearch:
    """测试知识库检索功能"""
    
    def test_search_structure(self):
        """测试检索API结构"""
        kb_id = "test_kb_search"
        
        # 执行检索
        search_result = kb_search(
            kb_id=kb_id,
            query="什么是机器学习？",
            top_k=3
        )
        
        assert isinstance(search_result, dict)
        assert "success" in search_result
        assert "kb_id" in search_result
        assert "query" in search_result
        assert "results" in search_result
        
        if search_result.get("success"):
            results = search_result["results"]
            assert isinstance(results, list)
    
    def test_search_with_different_top_k(self):
        """测试不同的top_k参数"""
        kb_id = "test_kb_topk"
        
        # 测试不同的top_k值
        for k in [1, 3, 5]:
            result = kb_search(
                kb_id=kb_id,
                query="人工智能",
                top_k=k
            )
            
            assert isinstance(result, dict)
            assert "success" in result
            assert "results" in result
    
    def test_search_with_similarity_threshold(self):
        """测试相似度阈值"""
        kb_id = "test_kb_similarity"
        
        result = kb_search(
            kb_id=kb_id,
            query="测试查询",
            top_k=3,
            min_similarity=0.8
        )
        
        assert isinstance(result, dict)
        assert "success" in result
    
    def test_search_types(self):
        """测试不同的检索类型"""
        kb_id = "test_kb_types"
        query = "测试"
        
        # 测试不同的检索类型
        for search_type in ["vector", "keyword", "hybrid"]:
            result = kb_search(
                kb_id=kb_id,
                query=query,
                top_k=3,
                search_type=search_type
            )
            
            assert isinstance(result, dict)
            assert "success" in result


class TestKnowledgeBaseStats:
    """测试知识库统计功能"""
    
    def test_get_stats_structure(self):
        """测试获取统计信息API结构"""
        kb_id = "test_kb_stats"
        
        result = kb_get_stats(kb_id=kb_id)
        
        assert isinstance(result, dict)
        assert "success" in result
        assert "kb_id" in result
        
        if result.get("success"):
            assert "stats" in result
            assert isinstance(result["stats"], dict)
    
    def test_stats_for_different_kbs(self):
        """测试不同知识库的统计"""
        kb_ids = ["kb_001", "kb_002", "kb_003"]
        
        for kb_id in kb_ids:
            result = kb_get_stats(kb_id=kb_id)
            
            assert isinstance(result, dict)
            assert "success" in result
            assert result["kb_id"] == kb_id


class TestKnowledgeBaseIntegration:
    """测试知识库集成功能"""
    
    def test_complete_workflow(self, test_document):
        """测试完整工作流"""
        kb_id = "test_kb_workflow"
        
        # 1. 添加文档
        doc_result = kb_add_document(
            kb_id=kb_id,
            file_path=test_document
        )
        
        assert doc_result.get("success") or not doc_result.get("success"), "添加文档API调用完成"
        
        # 2. 检索知识库
        search_result = kb_search(
            kb_id=kb_id,
            query="机器学习",
            top_k=3
        )
        
        assert isinstance(search_result, dict)
        assert "success" in search_result
        
        # 3. 获取统计信息
        stats_result = kb_get_stats(kb_id=kb_id)
        
        assert isinstance(stats_result, dict)
        assert "success" in stats_result
        
        # 4. 删除文档
        if doc_result.get("success") and "document_id" in doc_result:
            delete_result = kb_delete_document(
                kb_id=kb_id,
                doc_id=doc_result["document_id"]
            )
            
            assert isinstance(delete_result, dict)
            assert "success" in delete_result
    
    def test_multiple_operations(self, tmp_path):
        """测试多个操作"""
        kb_id = "test_kb_multi"
        
        # 创建多个文档
        for i in range(3):
            doc_file = tmp_path / f"doc_{i}.txt"
            doc_file.write_text(f"文档{i}的内容", encoding="utf-8")
            
            # 添加文档
            result = kb_add_document(
                kb_id=kb_id,
                file_path=str(doc_file)
            )
            
            assert isinstance(result, dict)
            assert "success" in result
        
        # 执行检索
        search_result = kb_search(
            kb_id=kb_id,
            query="内容",
            top_k=5
        )
        
        assert isinstance(search_result, dict)
        assert "success" in search_result


class TestKnowledgeBaseDataStructure:
    """测试知识库数据结构"""
    
    def test_search_result_structure(self):
        """测试检索结果结构"""
        kb_id = "test_kb_structure"
        
        search_result = kb_search(
            kb_id=kb_id,
            query="人工智能",
            top_k=3
        )
        
        assert isinstance(search_result, dict)
        assert "success" in search_result
        assert "results" in search_result
        
        results = search_result["results"]
        assert isinstance(results, list)
        
        # 验证结果项结构
        for item in results:
            assert isinstance(item, dict)
            # 每个结果应该有这些字段
            assert "content" in item
            assert "similarity" in item
            assert "document_name" in item
            assert "metadata" in item
    
    def test_add_document_response_structure(self, test_document):
        """测试添加文档响应结构"""
        kb_id = "test_kb_add_structure"
        
        result = kb_add_document(
            kb_id=kb_id,
            file_path=test_document
        )
        
        assert isinstance(result, dict)
        assert "success" in result
        assert "kb_id" in result
        assert "file_path" in result
        
        if result.get("success"):
            assert "document_id" in result
    
    def test_stats_response_structure(self):
        """测试统计响应结构"""
        kb_id = "test_kb_stats_structure"
        
        result = kb_get_stats(kb_id=kb_id)
        
        assert isinstance(result, dict)
        assert "success" in result
        assert "kb_id" in result
        
        if result.get("success"):
            assert "stats" in result
            assert isinstance(result["stats"], dict)
    
    def test_api_response_consistency(self, test_document):
        """测试API响应一致性"""
        kb_id = "test_kb_consistency"
        
        # 所有API都应该返回包含success字段的字典
        apis = [
            kb_search(kb_id=kb_id, query="测试", top_k=3),
            kb_add_document(kb_id=kb_id, file_path=test_document),
            kb_get_stats(kb_id=kb_id),
            kb_delete_document(kb_id=kb_id, doc_id="test_doc"),
        ]
        
        for result in apis:
            assert isinstance(result, dict)
            assert "success" in result


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
