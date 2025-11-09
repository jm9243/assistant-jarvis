"""高亮展示占位"""
from __future__ import annotations

from loguru import logger


def show_highlight(selector: str) -> None:
    logger.debug('Highlight element %s', selector)


def hide_highlight() -> None:
    logger.debug('Hide highlight')
