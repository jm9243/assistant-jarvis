"""执行日志存储"""
from __future__ import annotations

import json
import sqlite3
from datetime import datetime
from pathlib import Path
from threading import Lock
from typing import List

from .events import ExecutionEvent, ExecutionRun
from utils.datastore import generate_id


class ExecutionStorage:
    """基于SQLite的执行记录存储"""

    def __init__(self, db_path: Path) -> None:
        self._db_path = db_path
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = Lock()
        self._ensure_tables()

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self._db_path, check_same_thread=False)

    def _ensure_tables(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS runs (
                    id TEXT PRIMARY KEY,
                    workflow_id TEXT,
                    workflow_name TEXT,
                    status TEXT,
                    trigger TEXT,
                    started_at TEXT,
                    finished_at TEXT,
                    priority TEXT DEFAULT 'medium',
                    progress REAL DEFAULT 0,
                    params TEXT,
                    current_node TEXT,
                    error TEXT,
                    metadata TEXT
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    run_id TEXT,
                    node_id TEXT,
                    status TEXT,
                    message TEXT,
                    timestamp TEXT,
                    payload TEXT
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS templates (
                    id TEXT PRIMARY KEY,
                    workflow_id TEXT,
                    name TEXT,
                    params TEXT,
                    created_at TEXT
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS triggers (
                    id TEXT PRIMARY KEY,
                    workflow_id TEXT,
                    type TEXT,
                    config TEXT,
                    enabled INTEGER,
                    created_at TEXT
                )
                """
            )
            self._ensure_column(conn, 'runs', 'priority', "TEXT DEFAULT 'medium'")
            self._ensure_column(conn, 'runs', 'progress', 'REAL DEFAULT 0')
            self._ensure_column(conn, 'runs', 'params', 'TEXT')
            self._ensure_column(conn, 'runs', 'current_node', 'TEXT')
            self._ensure_column(conn, 'runs', 'error', 'TEXT')
            self._ensure_column(conn, 'runs', 'metadata', 'TEXT')
            self._ensure_column(conn, 'logs', 'payload', 'TEXT')
            conn.commit()

    def _ensure_column(self, conn: sqlite3.Connection, table: str, column: str, definition: str) -> None:
        cursor = conn.execute(f"PRAGMA table_info({table})")
        columns = {row[1] for row in cursor.fetchall()}
        if column not in columns:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")

    # ------------------------- Runs & Logs -------------------------
    def save_run(self, run: ExecutionRun) -> None:
        with self._lock, self._connect() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO runs (
                    id, workflow_id, workflow_name, status, trigger, started_at, finished_at,
                    priority, progress, params, current_node, error, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    run.id,
                    run.workflow_id,
                    run.workflow_name,
                    run.status,
                    run.trigger,
                    run.started_at,
                    run.finished_at,
                    run.priority,
                    run.progress,
                    json.dumps(run.params or {}),
                    run.current_node,
                    run.error,
                    json.dumps(run.metadata or {}),
                ),
            )
            conn.commit()

    def append_log(self, event: ExecutionEvent) -> None:
        with self._lock, self._connect() as conn:
            conn.execute(
                "INSERT INTO logs (run_id, node_id, status, message, timestamp, payload) VALUES (?, ?, ?, ?, ?, ?)",
                (
                    event.run_id,
                    event.node_id,
                    event.status,
                    event.message,
                    event.timestamp,
                    json.dumps(event.payload or {}),
                ),
            )
            conn.commit()

    def fetch_runs(self, limit: int = 20) -> List[ExecutionRun]:
        with self._connect() as conn:
            cursor = conn.execute(
                """
                SELECT id, workflow_id, workflow_name, status, trigger, started_at, finished_at,
                       priority, progress, params, current_node, error, metadata
                FROM runs ORDER BY started_at DESC LIMIT ?
                """,
                (limit,),
            )
            rows = cursor.fetchall()
        return [
            ExecutionRun(
                id=row[0],
                workflow_id=row[1],
                workflow_name=row[2],
                status=row[3],
                trigger=row[4],
                started_at=row[5],
                finished_at=row[6],
                priority=row[7],
                progress=row[8] or 0,
                params=json.loads(row[9] or '{}'),
                current_node=row[10],
                error=row[11],
                metadata=json.loads(row[12] or '{}'),
            )
            for row in rows
        ]

    def fetch_logs(self, run_id: str) -> List[ExecutionEvent]:
        with self._connect() as conn:
            cursor = conn.execute(
                "SELECT run_id, node_id, status, message, timestamp, payload FROM logs WHERE run_id = ? ORDER BY id ASC",
                (run_id,),
            )
            rows = cursor.fetchall()
        return [
            ExecutionEvent(
                run_id=row[0],
                node_id=row[1],
                status=row[2],
                message=row[3],
                timestamp=row[4],
                payload=json.loads(row[5] or '{}'),
            )
            for row in rows
        ]

    def update_status(self, run_id: str, *, status: str, progress: float | None = None, current_node: str | None = None, error: str | None = None, finished_at: str | None = None) -> None:
        with self._lock, self._connect() as conn:
            conn.execute(
                """
                UPDATE runs
                SET status = ?, progress = COALESCE(?, progress), current_node = COALESCE(?, current_node),
                    error = COALESCE(?, error), finished_at = COALESCE(?, finished_at)
                WHERE id = ?
                """,
                (status, progress, current_node, error, finished_at, run_id),
            )
            conn.commit()

    # ------------------------- 参数模板 -------------------------
    def save_template(self, workflow_id: str, name: str, params: dict) -> dict:
        record = {
            'id': generate_id('tpl'),
            'workflow_id': workflow_id,
            'name': name,
            'params': params,
            'created_at': datetime.utcnow().isoformat(),
        }
        with self._lock, self._connect() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO templates (id, workflow_id, name, params, created_at) VALUES (?, ?, ?, ?, ?)",
                (record['id'], workflow_id, name, json.dumps(params), record['created_at']),
            )
            conn.commit()
        return record

    def list_templates(self, workflow_id: str) -> List[dict]:
        with self._connect() as conn:
            cursor = conn.execute(
                "SELECT id, name, params, created_at FROM templates WHERE workflow_id = ? ORDER BY created_at DESC",
                (workflow_id,),
            )
            rows = cursor.fetchall()
        return [
            {'id': row[0], 'workflow_id': workflow_id, 'name': row[1], 'params': json.loads(row[2] or '{}'), 'created_at': row[3]}
            for row in rows
        ]

    def delete_template(self, template_id: str) -> None:
        with self._lock, self._connect() as conn:
            conn.execute('DELETE FROM templates WHERE id = ?', (template_id,))
            conn.commit()

    # ------------------------- 触发器 -------------------------
    def save_trigger(self, workflow_id: str, trigger_type: str, config: dict, enabled: bool = True) -> dict:
        record = {
            'id': generate_id('trg'),
            'workflow_id': workflow_id,
            'type': trigger_type,
            'config': config,
            'enabled': 1 if enabled else 0,
            'created_at': datetime.utcnow().isoformat(),
        }
        with self._lock, self._connect() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO triggers (id, workflow_id, type, config, enabled, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (record['id'], workflow_id, trigger_type, json.dumps(config), record['enabled'], record['created_at']),
            )
            conn.commit()
        return record

    def list_triggers(self, workflow_id: str) -> List[dict]:
        with self._connect() as conn:
            cursor = conn.execute(
                "SELECT id, type, config, enabled, created_at FROM triggers WHERE workflow_id = ?",
                (workflow_id,),
            )
            rows = cursor.fetchall()
        return [
            {
                'id': row[0],
                'workflow_id': workflow_id,
                'type': row[1],
                'config': json.loads(row[2] or '{}'),
                'enabled': bool(row[3]),
                'created_at': row[4],
            }
            for row in rows
        ]

    def delete_trigger(self, trigger_id: str) -> None:
        with self._lock, self._connect() as conn:
            conn.execute('DELETE FROM triggers WHERE id = ?', (trigger_id,))
            conn.commit()
