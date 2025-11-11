"""录制器服务 - 智能元素识别和录制"""

import asyncio
from typing import List, Dict, Any, Optional, Callable
from datetime import datetime
from loguru import logger
import platform


class RecorderService:
    """录制器服务 - 支持实时元素高亮和智能识别"""

    def __init__(self):
        self.is_recording = False
        self.is_paused = False
        self.mode = "auto"
        self.steps: List[Dict[str, Any]] = []
        self.monitor_task: Optional[asyncio.Task] = None
        self.highlight_task: Optional[asyncio.Task] = None
        self.event_callbacks: List[Callable] = []
        self.last_event_time = None
        self.event_debounce_ms = 100  # 事件去抖动时间
        self.current_mouse_pos = (0, 0)
        self.current_element = None

    def add_event_callback(self, callback: Callable):
        """添加事件回调"""
        self.event_callbacks.append(callback)

    async def _notify_event(self, event_type: str, data: Dict[str, Any]):
        """通知事件"""
        for callback in self.event_callbacks:
            try:
                await callback(event_type, data)
            except Exception as e:
                logger.error(f"事件回调异常: {e}")

    async def start(self, mode: str = "auto"):
        """开始录制"""
        if self.is_recording:
            logger.warning("录制器已在运行")
            return

        self.is_recording = True
        self.is_paused = False
        self.mode = mode
        self.steps = []
        self.last_event_time = None
        self.current_element = None

        logger.info(f"开始录制，模式: {mode}")

        # 通知录制开始
        await self._notify_event("recorder_started", {"mode": mode})

        # 启动监听任务
        self.monitor_task = asyncio.create_task(self._monitor_events())
        
        # 启动元素高亮任务
        self.highlight_task = asyncio.create_task(self._highlight_loop())

    async def stop(self) -> List[Dict[str, Any]]:
        """停止录制"""
        if not self.is_recording:
            logger.warning("录制器未运行")
            return []

        self.is_recording = False
        self.is_paused = False

        # 取消监听任务
        if self.monitor_task:
            self.monitor_task.cancel()
            try:
                await self.monitor_task
            except asyncio.CancelledError:
                pass
        
        # 取消高亮任务
        if self.highlight_task:
            self.highlight_task.cancel()
            try:
                await self.highlight_task
            except asyncio.CancelledError:
                pass

        logger.info(f"停止录制，共录制 {len(self.steps)} 步")

        # 清除高亮
        await self._notify_event("element_highlight", {"rect": None, "element": None})

        # 通知录制停止
        await self._notify_event("recorder_stopped", {"steps_count": len(self.steps)})

        # 转换步骤为节点
        nodes = self._convert_steps_to_nodes()

        return nodes

    async def pause(self):
        """暂停录制"""
        if self.is_recording:
            self.is_paused = True
            logger.info("暂停录制")

    async def resume(self):
        """恢复录制"""
        if self.is_recording:
            self.is_paused = False
            logger.info("恢复录制")

    async def _monitor_events(self):
        """监听事件"""
        try:
            system = platform.system()

            if system == "Darwin":  # macOS
                await self._monitor_macos()
            elif system == "Windows":
                await self._monitor_windows()
            else:
                logger.warning(f"不支持的操作系统: {system}")

        except asyncio.CancelledError:
            logger.debug("监听任务已取消")
        except Exception as e:
            logger.error(f"监听事件异常: {e}")

    async def _highlight_loop(self):
        """元素高亮循环 - 实时跟踪鼠标并高亮元素"""
        try:
            logger.info("启动元素高亮循环")
            
            while self.is_recording:
                if not self.is_paused:
                    # 获取当前鼠标位置的元素
                    x, y = self.current_mouse_pos
                    element_info = self._get_element_at_position(x, y)
                    window_info = self._get_window_at_position(x, y)
                    
                    # 如果元素变化，发送高亮事件
                    if element_info != self.current_element:
                        self.current_element = element_info
                        
                        # 构建高亮矩形
                        rect = element_info.get("bounds", {
                            "x": x - 50,
                            "y": y - 25,
                            "width": 100,
                            "height": 50,
                        })
                        
                        # 发送高亮事件到前端
                        await self._notify_event("element_highlight", {
                            "rect": rect,
                            "element": {
                                **element_info,
                                "window": window_info,
                            }
                        })
                
                # 降低CPU占用
                await asyncio.sleep(0.05)  # 20fps
                
        except asyncio.CancelledError:
            logger.debug("元素高亮循环已取消")
        except Exception as e:
            logger.error(f"元素高亮循环异常: {e}")

    async def _monitor_macos(self):
        """监听macOS事件"""
        logger.info("启动macOS事件监听")

        try:
            from pynput import mouse, keyboard
            
            # 鼠标移动事件处理
            def on_move(x, y):
                if not self.is_recording or self.is_paused:
                    return
                self.current_mouse_pos = (x, y)
            
            # 鼠标事件处理
            def on_click(x, y, button, pressed):
                if not self.is_recording or self.is_paused:
                    return
                
                if pressed:
                    step = {
                        "id": f"step_{len(self.steps) + 1}",
                        "type": "click",
                        "action": f"点击 ({x}, {y})",
                        "element": {
                            "x": x,
                            "y": y,
                        },
                        "config": {
                            "clickType": "right" if button == mouse.Button.right else "single",
                        },
                        "timestamp": datetime.now().isoformat(),
                    }
                    self.steps.append(step)
                    logger.debug(f"捕获点击: ({x}, {y})")
            
            # 键盘事件处理
            def on_press(key):
                if not self.is_recording or self.is_paused:
                    return
                
                try:
                    key_name = key.char if hasattr(key, 'char') else str(key)
                    step = {
                        "id": f"step_{len(self.steps) + 1}",
                        "type": "keyboard",
                        "action": f"按键 {key_name}",
                        "config": {
                            "key": key_name,
                        },
                        "timestamp": datetime.now().isoformat(),
                    }
                    self.steps.append(step)
                    logger.debug(f"捕获按键: {key_name}")
                except:
                    pass
            
            # 启动监听器
            mouse_listener = mouse.Listener(on_click=on_click)
            keyboard_listener = keyboard.Listener(on_press=on_press)
            
            mouse_listener.start()
            keyboard_listener.start()
            
            # 保持运行
            while self.is_recording:
                await asyncio.sleep(0.1)
            
            # 停止监听器
            mouse_listener.stop()
            keyboard_listener.stop()
            
        except Exception as e:
            logger.error(f"macOS 事件监听异常: {e}")
            # 降级到模拟模式
            await self._monitor_fallback()

    async def _monitor_windows(self):
        """监听Windows事件"""
        logger.info("启动Windows事件监听")

        try:
            from pynput import mouse, keyboard
            
            # 鼠标移动事件处理
            def on_move(x, y):
                if not self.is_recording or self.is_paused:
                    return
                self.current_mouse_pos = (x, y)
            
            # 鼠标事件处理
            def on_click(x, y, button, pressed):
                if not self.is_recording or self.is_paused:
                    return
                
                if pressed:
                    step = {
                        "id": f"step_{len(self.steps) + 1}",
                        "type": "click",
                        "action": f"点击 ({x}, {y})",
                        "element": {
                            "x": x,
                            "y": y,
                        },
                        "config": {
                            "clickType": "right" if button == mouse.Button.right else "single",
                        },
                        "timestamp": datetime.now().isoformat(),
                    }
                    self.steps.append(step)
                    logger.debug(f"捕获点击: ({x}, {y})")
            
            # 键盘事件处理
            def on_press(key):
                if not self.is_recording or self.is_paused:
                    return
                
                try:
                    key_name = key.char if hasattr(key, 'char') else str(key)
                    step = {
                        "id": f"step_{len(self.steps) + 1}",
                        "type": "keyboard",
                        "action": f"按键 {key_name}",
                        "config": {
                            "key": key_name,
                        },
                        "timestamp": datetime.now().isoformat(),
                    }
                    self.steps.append(step)
                    logger.debug(f"捕获按键: {key_name}")
                except:
                    pass
            
            # 启动监听器
            mouse_listener = mouse.Listener(on_click=on_click, on_move=on_move)
            keyboard_listener = keyboard.Listener(on_press=on_press)
            
            mouse_listener.start()
            keyboard_listener.start()
            
            # 保持运行
            while self.is_recording:
                await asyncio.sleep(0.1)
            
            # 停止监听器
            mouse_listener.stop()
            keyboard_listener.stop()
            
        except Exception as e:
            logger.error(f"Windows 事件监听异常: {e}")
            # 降级到模拟模式
            await self._monitor_fallback()
    
    async def _monitor_fallback(self):
        """降级监听模式（模拟数据）"""
        logger.warning("使用降级监听模式")
        while self.is_recording:
            if not self.is_paused:
                await asyncio.sleep(2)
                step = {
                    "id": f"step_{len(self.steps) + 1}",
                    "type": "click",
                    "action": "模拟点击",
                    "element": {"x": 100, "y": 100},
                    "timestamp": datetime.now().isoformat(),
                }
                self.steps.append(step)
            await asyncio.sleep(0.1)

    def _convert_steps_to_nodes(self) -> List[Dict[str, Any]]:
        """将录制步骤转换为工作流节点"""
        nodes = []

        for i, step in enumerate(self.steps):
            node = {
                "id": f"node_{i + 1}",
                "type": step["type"],
                "position": {"x": 100, "y": 100 + i * 100},
                "data": {
                    "label": step["action"],
                    "description": f"录制于 {step['timestamp']}",
                    "config": self._extract_config(step),
                },
            }

            nodes.append(node)

        return nodes

    def _extract_config(self, step: Dict[str, Any]) -> Dict[str, Any]:
        """从步骤中提取配置"""
        config = step.get("config", {})

        if step["type"] == "click":
            config.setdefault("clickType", "single")
            config.setdefault("waitAfter", 500)

        elif step["type"] == "input":
            config.setdefault("text", step.get("text", ""))
            config.setdefault("clearBefore", True)

        elif step["type"] == "keyboard":
            config.setdefault("key", step.get("key", ""))

        return config

    def _get_window_at_position(self, x: int, y: int) -> Dict[str, Any]:
        """获取指定位置的窗口信息"""
        try:
            system = platform.system()
            
            if system == "Darwin":  # macOS
                return self._get_window_macos(x, y)
            elif system == "Windows":
                return self._get_window_windows(x, y)
            else:
                return {"name": "Unknown", "app": "Unknown"}
                
        except Exception as e:
            logger.debug(f"获取窗口信息失败: {e}")
            return {"name": "Unknown", "app": "Unknown"}

    def _get_window_macos(self, x: int, y: int) -> Dict[str, Any]:
        """获取macOS窗口信息"""
        try:
            import Quartz
            
            # 获取鼠标位置的窗口
            window_list = Quartz.CGWindowListCopyWindowInfo(
                Quartz.kCGWindowListOptionOnScreenOnly | Quartz.kCGWindowListExcludeDesktopElements,
                Quartz.kCGNullWindowID
            )
            
            for window in window_list:
                bounds = window.get('kCGWindowBounds', {})
                if (bounds.get('X', 0) <= x <= bounds.get('X', 0) + bounds.get('Width', 0) and
                    bounds.get('Y', 0) <= y <= bounds.get('Y', 0) + bounds.get('Height', 0)):
                    return {
                        "name": window.get('kCGWindowName', 'Unknown'),
                        "app": window.get('kCGWindowOwnerName', 'Unknown'),
                        "bounds": bounds,
                    }
            
            return {"name": "Unknown", "app": "Unknown"}
            
        except Exception as e:
            logger.debug(f"获取macOS窗口信息失败: {e}")
            return {"name": "Unknown", "app": "Unknown"}

    def _get_window_windows(self, x: int, y: int) -> Dict[str, Any]:
        """获取Windows窗口信息"""
        try:
            import win32gui
            import win32process
            import psutil
            
            hwnd = win32gui.WindowFromPoint((x, y))
            if hwnd:
                window_text = win32gui.GetWindowText(hwnd)
                _, pid = win32process.GetWindowThreadProcessId(hwnd)
                
                try:
                    process = psutil.Process(pid)
                    app_name = process.name()
                except:
                    app_name = "Unknown"
                
                return {
                    "name": window_text or "Unknown",
                    "app": app_name,
                    "hwnd": hwnd,
                }
            
            return {"name": "Unknown", "app": "Unknown"}
            
        except Exception as e:
            logger.debug(f"获取Windows窗口信息失败: {e}")
            return {"name": "Unknown", "app": "Unknown"}

    def _get_element_at_position(self, x: int, y: int) -> Dict[str, Any]:
        """获取指定位置的元素信息"""
        try:
            system = platform.system()
            
            if system == "Darwin":  # macOS
                return self._get_element_macos(x, y)
            elif system == "Windows":
                return self._get_element_windows(x, y)
            else:
                return {"name": f"Position ({x}, {y})"}
                
        except Exception as e:
            logger.debug(f"获取元素信息失败: {e}")
            return {"name": f"Position ({x}, {y})"}

    def _get_element_macos(self, x: int, y: int) -> Dict[str, Any]:
        """获取macOS元素信息（使用Accessibility API）"""
        try:
            # 尝试使用 pyobjc 获取 Accessibility 元素
            try:
                from AppKit import NSWorkspace
                from Quartz import CGWindowListCopyWindowInfo, kCGWindowListOptionOnScreenOnly, kCGNullWindowID
                import Cocoa
                
                # 获取鼠标位置的窗口
                window_list = CGWindowListCopyWindowInfo(
                    kCGWindowListOptionOnScreenOnly,
                    kCGNullWindowID
                )
                
                for window in window_list:
                    bounds = window.get('kCGWindowBounds', {})
                    wx, wy = bounds.get('X', 0), bounds.get('Y', 0)
                    ww, wh = bounds.get('Width', 0), bounds.get('Height', 0)
                    
                    if wx <= x <= wx + ww and wy <= y <= wy + wh:
                        # 找到窗口，尝试获取 AX 元素
                        element_info = {
                            "name": window.get('kCGWindowName', f"Element at ({x}, {y})"),
                            "type": "window",
                            "role": "AXWindow",
                            "app": window.get('kCGWindowOwnerName', 'Unknown'),
                            "bounds": {
                                "x": wx,
                                "y": wy,
                                "width": ww,
                                "height": wh,
                            },
                            "locator": {
                                "strategy": "axui",
                                "role": "AXWindow",
                                "title": window.get('kCGWindowName', ''),
                            }
                        }
                        return element_info
                
            except ImportError:
                logger.debug("pyobjc 未安装，使用基础元素识别")
            
            # 降级方案
            return {
                "name": f"Element at ({x}, {y})",
                "type": "unknown",
                "role": "unknown",
                "locator": {
                    "strategy": "position",
                    "x": x,
                    "y": y,
                }
            }
            
        except Exception as e:
            logger.debug(f"获取macOS元素信息失败: {e}")
            return {
                "name": f"Position ({x}, {y})",
                "locator": {
                    "strategy": "position",
                    "x": x,
                    "y": y,
                }
            }

    def _get_element_windows(self, x: int, y: int) -> Dict[str, Any]:
        """获取Windows元素信息（使用UI Automation）"""
        try:
            # 尝试使用 pywinauto 获取 UI Automation 元素
            try:
                import win32gui
                import win32api
                
                # 获取鼠标位置的窗口句柄
                hwnd = win32gui.WindowFromPoint((x, y))
                
                if hwnd:
                    # 获取窗口信息
                    window_text = win32gui.GetWindowText(hwnd)
                    class_name = win32gui.GetClassName(hwnd)
                    rect = win32gui.GetWindowRect(hwnd)
                    
                    element_info = {
                        "name": window_text or f"Element at ({x}, {y})",
                        "type": "window",
                        "control_type": class_name,
                        "hwnd": hwnd,
                        "bounds": {
                            "x": rect[0],
                            "y": rect[1],
                            "width": rect[2] - rect[0],
                            "height": rect[3] - rect[1],
                        },
                        "locator": {
                            "strategy": "axui",
                            "control_type": class_name,
                            "name": window_text,
                        }
                    }
                    
                    # 尝试使用 pywinauto 获取更详细的元素信息
                    try:
                        from pywinauto import Desktop
                        
                        # 这里可以进一步获取子元素信息
                        # 简化实现，只返回窗口信息
                        
                    except ImportError:
                        logger.debug("pywinauto 未安装，使用基础元素识别")
                    
                    return element_info
                    
            except ImportError:
                logger.debug("win32gui 未安装，使用基础元素识别")
            
            # 降级方案
            return {
                "name": f"Element at ({x}, {y})",
                "type": "unknown",
                "control_type": "unknown",
                "locator": {
                    "strategy": "position",
                    "x": x,
                    "y": y,
                }
            }
            
        except Exception as e:
            logger.debug(f"获取Windows元素信息失败: {e}")
            return {
                "name": f"Position ({x}, {y})",
                "locator": {
                    "strategy": "position",
                    "x": x,
                    "y": y,
                }
            }


# 全局录制器实例
recorder_service = RecorderService()
