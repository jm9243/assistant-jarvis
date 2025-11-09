"""轻量 JSON 数据存储工具"""
from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path
from threading import Lock
from typing import Callable, TypeVar
from uuid import uuid4

T = TypeVar('T')


class JsonStore:
    """线程安全的 JSON 基础存储"""

    def __init__(self, path: Path, default: T) -> None:
        self._path = path
        self._default = default
        self._lock = Lock()
        self._path.parent.mkdir(parents=True, exist_ok=True)

    def _default_copy(self) -> T:
        return deepcopy(self._default)

    def _read_no_lock(self) -> T:
        if not self._path.exists():
            return self._default_copy()
        try:
            with self._path.open('r', encoding='utf-8') as handle:
                return json.load(handle)
        except json.JSONDecodeError:
            return self._default_copy()

    def read(self) -> T:
        with self._lock:
            data = self._read_no_lock()
        return deepcopy(data)

    def write(self, data: T) -> None:
        with self._lock:
            tmp_path = self._path.with_suffix('.tmp')
            with tmp_path.open('w', encoding='utf-8') as handle:
                json.dump(data, handle, ensure_ascii=False, indent=2, default=str)
            tmp_path.replace(self._path)

    def update(self, mutator: Callable[[T], T | None]) -> T:
        with self._lock:
            data = self._read_no_lock()
            result = mutator(data)
            if result is not None:
                data = result
            tmp_path = self._path.with_suffix('.tmp')
            with tmp_path.open('w', encoding='utf-8') as handle:
                json.dump(data, handle, ensure_ascii=False, indent=2, default=str)
            tmp_path.replace(self._path)
            return deepcopy(data)


def generate_id(prefix: str) -> str:
    """统一的ID生成"""
    return f"{prefix}-{uuid4().hex[:8]}"
