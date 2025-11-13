"""
简单的数据库管理器
使用 JSON 文件存储数据，便于快速实现
"""
import json
import uuid
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
from logger import get_logger

logger = get_logger("simple_db")


class SimpleDB:
    """简单的 JSON 数据库"""
    
    def __init__(self, db_path: str = None):
        """初始化数据库"""
        if db_path is None:
            db_path = Path.home() / ".jarvis" / "data" / "db.json"
        
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        
        self.data = self._load()
        logger.info(f"SimpleDB initialized at {self.db_path}")
    
    def _load(self) -> Dict[str, Any]:
        """加载数据"""
        if self.db_path.exists():
            try:
                with open(self.db_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load database: {e}")
                return self._init_data()
        return self._init_data()
    
    def _init_data(self) -> Dict[str, Any]:
        """初始化数据结构"""
        return {
            "agents": {},
            "knowledge_bases": {},
            "tools": {},
            "conversations": {},
            "messages": {},
            "workflows": {},
        }
    
    def _save(self):
        """保存数据"""
        try:
            with open(self.db_path, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Failed to save database: {e}")
    
    # Agent 操作
    def list_agents(self, user_id: Optional[str] = None, agent_type: Optional[str] = None) -> List[Dict]:
        """列出所有 Agent"""
        agents = list(self.data["agents"].values())
        
        if user_id:
            agents = [a for a in agents if a.get("user_id") == user_id]
        
        if agent_type:
            agents = [a for a in agents if a.get("type") == agent_type]
        
        return agents
    
    def get_agent(self, agent_id: str) -> Optional[Dict]:
        """获取 Agent"""
        return self.data["agents"].get(agent_id)
    
    def create_agent(self, agent_data: Dict) -> Dict:
        """创建 Agent"""
        agent_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        agent = {
            "id": agent_id,
            "created_at": now,
            "updated_at": now,
            **agent_data
        }
        
        self.data["agents"][agent_id] = agent
        self._save()
        
        return agent
    
    def update_agent(self, agent_id: str, updates: Dict) -> Optional[Dict]:
        """更新 Agent"""
        if agent_id not in self.data["agents"]:
            return None
        
        agent = self.data["agents"][agent_id]
        agent.update(updates)
        agent["updated_at"] = datetime.now().isoformat()
        
        self._save()
        return agent
    
    def delete_agent(self, agent_id: str) -> bool:
        """删除 Agent"""
        if agent_id in self.data["agents"]:
            del self.data["agents"][agent_id]
            self._save()
            return True
        return False
    
    # 知识库操作
    def list_knowledge_bases(self, user_id: Optional[str] = None) -> List[Dict]:
        """列出所有知识库"""
        kbs = list(self.data["knowledge_bases"].values())
        
        if user_id:
            kbs = [kb for kb in kbs if kb.get("user_id") == user_id]
        
        return kbs
    
    def get_knowledge_base(self, kb_id: str) -> Optional[Dict]:
        """获取知识库"""
        return self.data["knowledge_bases"].get(kb_id)
    
    def create_knowledge_base(self, kb_data: Dict) -> Dict:
        """创建知识库"""
        kb_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        kb = {
            "id": kb_id,
            "document_count": 0,
            "total_size": 0,
            "created_at": now,
            "updated_at": now,
            **kb_data
        }
        
        self.data["knowledge_bases"][kb_id] = kb
        self._save()
        
        return kb
    
    def update_knowledge_base(self, kb_id: str, updates: Dict) -> Optional[Dict]:
        """更新知识库"""
        if kb_id not in self.data["knowledge_bases"]:
            return None
        
        kb = self.data["knowledge_bases"][kb_id]
        kb.update(updates)
        kb["updated_at"] = datetime.now().isoformat()
        
        self._save()
        return kb
    
    def delete_knowledge_base(self, kb_id: str) -> bool:
        """删除知识库"""
        if kb_id in self.data["knowledge_bases"]:
            del self.data["knowledge_bases"][kb_id]
            self._save()
            return True
        return False
    
    # 工具操作
    def list_tools(self, agent_id: Optional[str] = None, category: Optional[str] = None, enabled_only: bool = False) -> List[Dict]:
        """列出所有工具"""
        tools = list(self.data["tools"].values())
        
        if agent_id:
            tools = [t for t in tools if agent_id in t.get("agent_ids", [])]
        
        if category:
            tools = [t for t in tools if t.get("category") == category]
        
        if enabled_only:
            tools = [t for t in tools if t.get("is_enabled", False)]
        
        return tools
    
    def get_tool(self, tool_id: str) -> Optional[Dict]:
        """获取工具"""
        return self.data["tools"].get(tool_id)
    
    def create_tool(self, tool_data: Dict) -> Dict:
        """创建工具"""
        tool_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        tool = {
            "id": tool_id,
            "is_enabled": True,
            "usage_count": 0,
            "success_rate": 0.0,
            "created_at": now,
            "updated_at": now,
            **tool_data
        }
        
        self.data["tools"][tool_id] = tool
        self._save()
        
        return tool
    
    def update_tool(self, tool_id: str, updates: Dict) -> Optional[Dict]:
        """更新工具"""
        if tool_id not in self.data["tools"]:
            return None
        
        tool = self.data["tools"][tool_id]
        tool.update(updates)
        tool["updated_at"] = datetime.now().isoformat()
        
        self._save()
        return tool
    
    def delete_tool(self, tool_id: str) -> bool:
        """删除工具"""
        if tool_id in self.data["tools"]:
            del self.data["tools"][tool_id]
            self._save()
            return True
        return False
    
    # 会话操作
    def list_conversations(self, agent_id: Optional[str] = None, user_id: Optional[str] = None) -> List[Dict]:
        """列出所有会话"""
        conversations = list(self.data["conversations"].values())
        
        if agent_id:
            conversations = [c for c in conversations if c.get("agent_id") == agent_id]
        
        if user_id:
            conversations = [c for c in conversations if c.get("user_id") == user_id]
        
        # 按更新时间倒序排序
        conversations.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
        
        return conversations
    
    def get_conversation(self, conversation_id: str) -> Optional[Dict]:
        """获取会话"""
        return self.data["conversations"].get(conversation_id)
    
    def create_conversation(self, conversation_data: Dict) -> Dict:
        """创建会话"""
        conversation_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        conversation = {
            "id": conversation_id,
            "message_count": 0,
            "created_at": now,
            "updated_at": now,
            **conversation_data
        }
        
        self.data["conversations"][conversation_id] = conversation
        self._save()
        
        return conversation
    
    def update_conversation(self, conversation_id: str, updates: Dict) -> Optional[Dict]:
        """更新会话"""
        if conversation_id not in self.data["conversations"]:
            return None
        
        conversation = self.data["conversations"][conversation_id]
        conversation.update(updates)
        conversation["updated_at"] = datetime.now().isoformat()
        
        self._save()
        return conversation
    
    def delete_conversation(self, conversation_id: str) -> bool:
        """删除会话"""
        if conversation_id in self.data["conversations"]:
            # 同时删除相关消息
            self.data["messages"] = {
                k: v for k, v in self.data["messages"].items()
                if v.get("conversation_id") != conversation_id
            }
            del self.data["conversations"][conversation_id]
            self._save()
            return True
        return False
    
    # 消息操作
    def list_messages(self, conversation_id: str) -> List[Dict]:
        """列出会话的所有消息"""
        messages = [
            msg for msg in self.data["messages"].values()
            if msg.get("conversation_id") == conversation_id
        ]
        
        # 按创建时间排序
        messages.sort(key=lambda x: x.get("created_at", ""))
        
        return messages
    
    def add_message(self, message_data: Dict) -> Dict:
        """添加消息"""
        message_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        message = {
            "id": message_id,
            "created_at": now,
            **message_data
        }
        
        self.data["messages"][message_id] = message
        
        # 更新会话的消息计数和更新时间
        conversation_id = message_data.get("conversation_id")
        if conversation_id and conversation_id in self.data["conversations"]:
            conversation = self.data["conversations"][conversation_id]
            conversation["message_count"] = conversation.get("message_count", 0) + 1
            conversation["updated_at"] = now
        
        self._save()
        
        return message


# 全局数据库实例
_db_instance: Optional[SimpleDB] = None


def get_db() -> SimpleDB:
    """获取数据库实例"""
    global _db_instance
    if _db_instance is None:
        _db_instance = SimpleDB()
    return _db_instance
