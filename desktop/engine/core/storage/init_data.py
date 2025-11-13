"""
初始化示例数据
"""
from core.storage.simple_db import get_db
from logger import get_logger

logger = get_logger("init_data")


def init_sample_data():
    """初始化示例数据"""
    db = get_db()
    
    # 检查是否已有数据
    if len(db.data["agents"]) > 0:
        logger.info("Data already initialized, skipping")
        return
    
    logger.info("Initializing sample data...")
    
    # 创建示例 Agent
    agent1 = db.create_agent({
        "name": "通用助手",
        "description": "一个通用的AI助手，可以回答各种问题",
        "type": "basic",
        "llm_config": {
            "model": "gpt-3.5-turbo",
            "temperature": 0.7,
            "max_tokens": 2000
        },
        "system_prompt": "你是一个友好、专业的AI助手。",
        "knowledge_base_ids": [],
        "tool_ids": []
    })
    
    agent2 = db.create_agent({
        "name": "代码助手",
        "description": "专门帮助编写和调试代码的AI助手",
        "type": "react",
        "llm_config": {
            "model": "gpt-4",
            "temperature": 0.3,
            "max_tokens": 4000
        },
        "system_prompt": "你是一个专业的编程助手，擅长多种编程语言。",
        "knowledge_base_ids": [],
        "tool_ids": []
    })
    
    logger.info(f"Created agents: {agent1['id']}, {agent2['id']}")
    
    # 创建示例知识库
    kb1 = db.create_knowledge_base({
        "name": "技术文档",
        "description": "存储各种技术文档和API参考",
        "embedding_model": "text-embedding-ada-002",
        "chunk_size": 1000,
        "chunk_overlap": 200
    })
    
    kb2 = db.create_knowledge_base({
        "name": "产品手册",
        "description": "产品使用手册和常见问题",
        "embedding_model": "text-embedding-ada-002",
        "chunk_size": 800,
        "chunk_overlap": 150
    })
    
    logger.info(f"Created knowledge bases: {kb1['id']}, {kb2['id']}")
    
    # 创建示例工具
    tool1 = db.create_tool({
        "name": "网页搜索",
        "description": "在互联网上搜索信息",
        "type": "api",
        "category": "search",
        "is_enabled": True,
        "parameters_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "搜索关键词"}
            },
            "required": ["query"]
        },
        "approval_policy": "none"
    })
    
    tool2 = db.create_tool({
        "name": "文件读取",
        "description": "读取本地文件内容",
        "type": "builtin",
        "category": "file",
        "is_enabled": True,
        "parameters_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "文件路径"}
            },
            "required": ["path"]
        },
        "approval_policy": "required"
    })
    
    tool3 = db.create_tool({
        "name": "代码执行",
        "description": "执行Python代码",
        "type": "builtin",
        "category": "code",
        "is_enabled": False,
        "parameters_schema": {
            "type": "object",
            "properties": {
                "code": {"type": "string", "description": "Python代码"}
            },
            "required": ["code"]
        },
        "approval_policy": "required"
    })
    
    logger.info(f"Created tools: {tool1['id']}, {tool2['id']}, {tool3['id']}")
    
    logger.info("Sample data initialized successfully")


if __name__ == "__main__":
    init_sample_data()
