"""元素定位占位实现"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class LocatorResult:
    selector: str
    confidence: float


def locate_by_axui(query: str) -> LocatorResult:
    # TODO: 集成真实 AXUI / UIAutomation
    return LocatorResult(selector=query, confidence=0.9)


def locate_by_ocr(text: str) -> LocatorResult:
    return LocatorResult(selector=f"ocr:{text}", confidence=0.75)


def locate_by_image(image_hash: str) -> LocatorResult:
    return LocatorResult(selector=f"image:{image_hash}", confidence=0.7)
