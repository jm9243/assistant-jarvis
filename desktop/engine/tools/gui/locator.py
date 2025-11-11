"""元素定位器 - 支持多种定位策略"""

import platform
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass
from loguru import logger


@dataclass
class ElementRect:
    """元素矩形区域"""
    x: int
    y: int
    width: int
    height: int

    @property
    def center(self) -> Tuple[int, int]:
        """获取中心点坐标"""
        return (self.x + self.width // 2, self.y + self.height // 2)


class ElementLocator:
    """元素定位器基类"""

    def __init__(self):
        self.system = platform.system()
        logger.info(f"Initialized ElementLocator for {self.system}")

    def locate(self, locator: Dict[str, Any], timeout: int = 5) -> Optional[ElementRect]:
        """定位元素
        
        Args:
            locator: 定位器配置
            timeout: 超时时间（秒）
            
        Returns:
            元素矩形区域，未找到返回 None
        """
        strategies = locator.get("strategies", [])
        
        for strategy in strategies:
            strategy_type = strategy.get("type")
            
            try:
                if strategy_type == "axui":
                    result = self._locate_by_axui(strategy, timeout)
                elif strategy_type == "ocr":
                    result = self._locate_by_ocr(strategy, timeout)
                elif strategy_type == "image":
                    result = self._locate_by_image(strategy, timeout)
                elif strategy_type == "position":
                    result = self._locate_by_position(strategy)
                else:
                    logger.warning(f"Unknown locator strategy: {strategy_type}")
                    continue
                
                if result:
                    logger.info(f"Element located using {strategy_type} strategy")
                    return result
                    
            except Exception as e:
                logger.warning(f"Failed to locate using {strategy_type}: {e}")
                continue
        
        logger.error("Failed to locate element with all strategies")
        return None

    def _locate_by_axui(self, strategy: Dict[str, Any], timeout: int) -> Optional[ElementRect]:
        """使用 AXUI 定位元素（最优先）"""
        if self.system == "Darwin":
            return self._locate_by_axui_macos(strategy, timeout)
        elif self.system == "Windows":
            return self._locate_by_axui_windows(strategy, timeout)
        else:
            logger.warning(f"AXUI not supported on {self.system}")
            return None

    def _locate_by_axui_macos(self, strategy: Dict[str, Any], timeout: int) -> Optional[ElementRect]:
        """macOS AXUI 定位"""
        try:
            # TODO: 使用 pyobjc 实现
            # from AppKit import NSWorkspace
            # from Quartz import CGWindowListCopyWindowInfo, kCGWindowListOptionAll
            
            logger.debug("macOS AXUI locator not fully implemented yet")
            return None
            
        except Exception as e:
            logger.error(f"macOS AXUI locator error: {e}")
            return None

    def _locate_by_axui_windows(self, strategy: Dict[str, Any], timeout: int) -> Optional[ElementRect]:
        """Windows AXUI 定位"""
        try:
            # TODO: 使用 pywinauto 实现
            # from pywinauto import Application
            
            logger.debug("Windows AXUI locator not fully implemented yet")
            return None
            
        except Exception as e:
            logger.error(f"Windows AXUI locator error: {e}")
            return None

    def _locate_by_ocr(self, strategy: Dict[str, Any], timeout: int) -> Optional[ElementRect]:
        """使用 OCR 定位元素（备选）"""
        try:
            import pytesseract
            from PIL import ImageGrab
            
            text = strategy.get("text", "")
            if not text:
                return None
            
            # 截取屏幕
            screenshot = ImageGrab.grab()
            
            # OCR 识别
            data = pytesseract.image_to_data(screenshot, output_type=pytesseract.Output.DICT)
            
            # 查找匹配文字
            for i, word in enumerate(data['text']):
                if text.lower() in word.lower():
                    return ElementRect(
                        x=data['left'][i],
                        y=data['top'][i],
                        width=data['width'][i],
                        height=data['height'][i]
                    )
            
            return None
            
        except Exception as e:
            logger.error(f"OCR locator error: {e}")
            return None

    def _locate_by_image(self, strategy: Dict[str, Any], timeout: int) -> Optional[ElementRect]:
        """使用图像匹配定位元素（备选）"""
        try:
            import cv2
            import numpy as np
            from PIL import ImageGrab
            
            template_path = strategy.get("template")
            threshold = strategy.get("threshold", 0.8)
            
            if not template_path:
                return None
            
            # 读取模板图片
            template = cv2.imread(template_path)
            if template is None:
                logger.error(f"Failed to load template: {template_path}")
                return None
            
            # 截取屏幕
            screenshot = ImageGrab.grab()
            screenshot_np = np.array(screenshot)
            screenshot_cv = cv2.cvtColor(screenshot_np, cv2.COLOR_RGB2BGR)
            
            # 模板匹配
            result = cv2.matchTemplate(screenshot_cv, template, cv2.TM_CCOEFF_NORMED)
            min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)
            
            if max_val >= threshold:
                h, w = template.shape[:2]
                return ElementRect(
                    x=max_loc[0],
                    y=max_loc[1],
                    width=w,
                    height=h
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Image locator error: {e}")
            return None

    def _locate_by_position(self, strategy: Dict[str, Any]) -> Optional[ElementRect]:
        """使用坐标定位元素（兜底）"""
        try:
            x = strategy.get("x")
            y = strategy.get("y")
            width = strategy.get("width", 10)
            height = strategy.get("height", 10)
            
            if x is None or y is None:
                return None
            
            return ElementRect(x=x, y=y, width=width, height=height)
            
        except Exception as e:
            logger.error(f"Position locator error: {e}")
            return None


# 全局定位器实例
element_locator = ElementLocator()
