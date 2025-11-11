"""数据库管理"""

import sqlite3
import json
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime
from loguru import logger


class Database:
    """SQLite 数据库管理器"""

    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            # 默认数据库路径
            data_dir = Path.home() / ".jarvis" / "data"
            data_dir.mkdir(parents=True, exist_ok=True)
            db_path = str(data_dir / "jarvis.db")

        self.db_path = db_path
        self.conn: Optional[sqlite3.Connection] = None
        logger.info(f"Database path: {db_path}")

    def connect(self):
        """连接数据库"""
        if self.conn is None:
            self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
            self.conn.row_factory = sqlite3.Row
            logger.info("Database connected")

    def close(self):
        """关闭数据库连接"""
        if self.conn:
            self.conn.close()
            self.conn = None
            logger.info("Database closed")

    def init_tables(self):
        """初始化数据库表"""
        self.connect()

        # 工作流表
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS workflows (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                version TEXT DEFAULT '1.0.0',
                nodes TEXT NOT NULL,
                edges TEXT NOT NULL,
                variables TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 执行记录表
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS executions (
                id TEXT PRIMARY KEY,
                workflow_id TEXT NOT NULL,
                status TEXT NOT NULL,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP,
                logs TEXT,
                screenshots TEXT,
                variables TEXT,
                error TEXT,
                FOREIGN KEY (workflow_id) REFERENCES workflows(id)
            )
        """)

        # 日志表
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                level TEXT NOT NULL,
                message TEXT NOT NULL,
                source TEXT,
                execution_id TEXT,
                FOREIGN KEY (execution_id) REFERENCES executions(id)
            )
        """)

        # 录制步骤表
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS recording_steps (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                step_index INTEGER NOT NULL,
                type TEXT NOT NULL,
                action TEXT NOT NULL,
                element TEXT,
                config TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        self.conn.commit()
        logger.info("Database tables initialized")

    # ==================== 工作流操作 ====================

    def save_workflow(self, workflow: Dict[str, Any]) -> bool:
        """保存工作流"""
        try:
            self.connect()

            # 检查是否已存在
            existing = self.conn.execute(
                "SELECT id FROM workflows WHERE id = ?", (workflow["id"],)
            ).fetchone()

            if existing:
                # 更新
                self.conn.execute(
                    """
                    UPDATE workflows
                    SET name = ?, description = ?, version = ?,
                        nodes = ?, edges = ?, variables = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                    """,
                    (
                        workflow["name"],
                        workflow.get("description"),
                        workflow.get("version", "1.0.0"),
                        json.dumps(workflow["nodes"]),
                        json.dumps(workflow["edges"]),
                        json.dumps(workflow.get("variables", {})),
                        workflow["id"],
                    ),
                )
            else:
                # 插入
                self.conn.execute(
                    """
                    INSERT INTO workflows (id, name, description, version, nodes, edges, variables)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        workflow["id"],
                        workflow["name"],
                        workflow.get("description"),
                        workflow.get("version", "1.0.0"),
                        json.dumps(workflow["nodes"]),
                        json.dumps(workflow["edges"]),
                        json.dumps(workflow.get("variables", {})),
                    ),
                )

            self.conn.commit()
            logger.info(f"Workflow saved: {workflow['id']}")
            return True

        except Exception as e:
            logger.error(f"Failed to save workflow: {e}")
            return False

    def get_workflow(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """获取工作流"""
        try:
            self.connect()
            row = self.conn.execute(
                "SELECT * FROM workflows WHERE id = ?", (workflow_id,)
            ).fetchone()

            if row:
                return {
                    "id": row["id"],
                    "name": row["name"],
                    "description": row["description"],
                    "version": row["version"],
                    "nodes": json.loads(row["nodes"]),
                    "edges": json.loads(row["edges"]),
                    "variables": json.loads(row["variables"]) if row["variables"] else {},
                    "created_at": row["created_at"],
                    "updated_at": row["updated_at"],
                }

            return None

        except Exception as e:
            logger.error(f"Failed to get workflow: {e}")
            return None

    def list_workflows(self) -> List[Dict[str, Any]]:
        """列出所有工作流"""
        try:
            self.connect()
            rows = self.conn.execute(
                "SELECT * FROM workflows ORDER BY updated_at DESC"
            ).fetchall()

            return [
                {
                    "id": row["id"],
                    "name": row["name"],
                    "description": row["description"],
                    "version": row["version"],
                    "nodes": json.loads(row["nodes"]),
                    "edges": json.loads(row["edges"]),
                    "variables": json.loads(row["variables"]) if row["variables"] else {},
                    "created_at": row["created_at"],
                    "updated_at": row["updated_at"],
                }
                for row in rows
            ]

        except Exception as e:
            logger.error(f"Failed to list workflows: {e}")
            return []

    def delete_workflow(self, workflow_id: str) -> bool:
        """删除工作流"""
        try:
            self.connect()
            self.conn.execute("DELETE FROM workflows WHERE id = ?", (workflow_id,))
            self.conn.commit()
            logger.info(f"Workflow deleted: {workflow_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete workflow: {e}")
            return False

    # ==================== 执行记录操作 ====================

    def save_execution(self, execution: Dict[str, Any]) -> bool:
        """保存执行记录"""
        try:
            self.connect()

            self.conn.execute(
                """
                INSERT OR REPLACE INTO executions
                (id, workflow_id, status, start_time, end_time, logs, screenshots, variables, error)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    execution["id"],
                    execution["workflow_id"],
                    execution["status"],
                    execution["start_time"],
                    execution.get("end_time"),
                    json.dumps(execution.get("logs", [])),
                    json.dumps(execution.get("screenshots", [])),
                    json.dumps(execution.get("variables", {})),
                    json.dumps(execution.get("error")) if execution.get("error") else None,
                ),
            )

            self.conn.commit()
            logger.debug(f"Execution saved: {execution['id']}")
            return True

        except Exception as e:
            logger.error(f"Failed to save execution: {e}")
            return False

    def get_execution(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """获取执行记录"""
        try:
            self.connect()
            row = self.conn.execute(
                "SELECT * FROM executions WHERE id = ?", (execution_id,)
            ).fetchone()

            if row:
                return {
                    "id": row["id"],
                    "workflow_id": row["workflow_id"],
                    "status": row["status"],
                    "start_time": row["start_time"],
                    "end_time": row["end_time"],
                    "logs": json.loads(row["logs"]) if row["logs"] else [],
                    "screenshots": json.loads(row["screenshots"]) if row["screenshots"] else [],
                    "variables": json.loads(row["variables"]) if row["variables"] else {},
                    "error": json.loads(row["error"]) if row["error"] else None,
                }

            return None

        except Exception as e:
            logger.error(f"Failed to get execution: {e}")
            return None

    def list_executions(
        self, workflow_id: Optional[str] = None, limit: int = 100
    ) -> List[Dict[str, Any]]:
        """列出执行记录"""
        try:
            self.connect()

            if workflow_id:
                rows = self.conn.execute(
                    "SELECT * FROM executions WHERE workflow_id = ? ORDER BY start_time DESC LIMIT ?",
                    (workflow_id, limit),
                ).fetchall()
            else:
                rows = self.conn.execute(
                    "SELECT * FROM executions ORDER BY start_time DESC LIMIT ?",
                    (limit,),
                ).fetchall()

            return [
                {
                    "id": row["id"],
                    "workflow_id": row["workflow_id"],
                    "status": row["status"],
                    "start_time": row["start_time"],
                    "end_time": row["end_time"],
                    "logs": json.loads(row["logs"]) if row["logs"] else [],
                    "screenshots": json.loads(row["screenshots"]) if row["screenshots"] else [],
                    "variables": json.loads(row["variables"]) if row["variables"] else {},
                    "error": json.loads(row["error"]) if row["error"] else None,
                }
                for row in rows
            ]

        except Exception as e:
            logger.error(f"Failed to list executions: {e}")
            return []

    # ==================== 日志操作 ====================

    def add_log(
        self,
        level: str,
        message: str,
        source: Optional[str] = None,
        execution_id: Optional[str] = None,
    ) -> bool:
        """添加日志"""
        try:
            self.connect()

            self.conn.execute(
                "INSERT INTO logs (level, message, source, execution_id) VALUES (?, ?, ?, ?)",
                (level, message, source, execution_id),
            )

            self.conn.commit()
            return True

        except Exception as e:
            logger.error(f"Failed to add log: {e}")
            return False

    def get_logs(
        self,
        level: Optional[str] = None,
        execution_id: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """获取日志"""
        try:
            self.connect()

            query = "SELECT * FROM logs WHERE 1=1"
            params = []

            if level:
                query += " AND level = ?"
                params.append(level)

            if execution_id:
                query += " AND execution_id = ?"
                params.append(execution_id)

            query += " ORDER BY timestamp DESC LIMIT ?"
            params.append(limit)

            rows = self.conn.execute(query, params).fetchall()

            return [
                {
                    "id": row["id"],
                    "timestamp": row["timestamp"],
                    "level": row["level"],
                    "message": row["message"],
                    "source": row["source"],
                    "execution_id": row["execution_id"],
                }
                for row in rows
            ]

        except Exception as e:
            logger.error(f"Failed to get logs: {e}")
            return []


# 全局数据库实例
db = Database()
db.init_tables()
