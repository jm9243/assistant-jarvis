"""节点执行器实现 - 23种核心节点"""

import asyncio
import time
import json
import subprocess
from typing import Dict, Any
from loguru import logger

from models import Node
from .nodes import NodeExecutor
from tools.gui.locator import element_locator


# ============================================================================
# UI 自动化节点 (7个)
# ============================================================================

class ClickNodeExecutor(NodeExecutor):
    """点击节点执行器"""

    async def execute(self, node: Node, context: Any) -> Any:
        config = node.data.config
        locator = node.data.locator
        
        if not locator:
            raise ValueError("Click node requires locator")
        
        # 定位元素
        element = element_locator.locate(locator, timeout=config.get("timeout", 5))
        if not element:
            raise RuntimeError("Failed to locate element")
        
        # 获取点击类型
        click_type = config.get("clickType", "single")
        
        # 执行点击
        import pyautogui
        center_x, center_y = element.center
        
        if click_type == "single":
            pyautogui.click(center_x, center_y)
        elif click_type == "double":
            pyautogui.doubleClick(center_x, center_y)
        elif click_type == "right":
            pyautogui.rightClick(center_x, center_y)
        
        # 等待
        wait_after = config.get("waitAfter", 500)
        await asyncio.sleep(wait_after / 1000)
        
        logger.info(f"Clicked at ({center_x}, {center_y}) with {click_type} click")
        return {"x": center_x, "y": center_y, "type": click_type}


class InputNodeExecutor(NodeExecutor):
    """输入节点执行器"""

    async def execute(self, node: Node, context: Any) -> Any:
        config = node.data.config
        locator = node.data.locator
        text = config.get("text", "")
        
        if not locator:
            raise ValueError("Input node requires locator")
        
        # 定位元素
        element = element_locator.locate(locator, timeout=config.get("timeout", 5))
        if not element:
            raise RuntimeError("Failed to locate element")
        
        # 点击元素获取焦点
        import pyautogui
        center_x, center_y = element.center
        pyautogui.click(center_x, center_y)
        await asyncio.sleep(0.2)
        
        # 是否清空
        if config.get("clearBefore", False):
            pyautogui.hotkey('ctrl', 'a')
            await asyncio.sleep(0.1)
        
        # 输入文本
        pyautogui.write(text, interval=0.05)
        
        # 等待
        wait_after = config.get("waitAfter", 500)
        await asyncio.sleep(wait_after / 1000)
        
        logger.info(f"Input text: {text}")
        return {"text": text}


class DragDropNodeExecutor(NodeExecutor):
    """拖拽节点执行器"""

    async def execute(self, node: Node, context: Any) -> Any:
        config = node.data.config
        from_locator = config.get("fromLocator")
        to_locator = config.get("toLocator")
        
        if not from_locator or not to_locator:
            raise ValueError("DragDrop node requires fromLocator and toLocator")
        
        # 定位起始元素
        from_element = element_locator.locate(from_locator, timeout=config.get("timeout", 5))
        if not from_element:
            raise RuntimeError("Failed to locate from element")
        
        # 定位目标元素
        to_element = element_locator.locate(to_locator, timeout=config.get("timeout", 5))
        if not to_element:
            raise RuntimeError("Failed to locate to element")
        
        # 执行拖拽
        import pyautogui
        from_x, from_y = from_element.center
        to_x, to_y = to_element.center
        
        pyautogui.moveTo(from_x, from_y)
        await asyncio.sleep(0.2)
        pyautogui.drag(to_x - from_x, to_y - from_y, duration=0.5)
        
        logger.info(f"Dragged from ({from_x}, {from_y}) to ({to_x}, {to_y})")
        return {"from": (from_x, from_y), "to": (to_x, to_y)}


class ScrollNodeExecutor(NodeExecutor):
    """滚动节点执行器"""

    async def execute(self, node: Node, context: Any) -> Any:
        config = node.data.config
        direction = config.get("direction", "down")
        amount = config.get("amount", 3)
        
        import pyautogui
        
        if direction == "down":
            pyautogui.scroll(-amount * 100)
        elif direction == "up":
            pyautogui.scroll(amount * 100)
        
        await asyncio.sleep(0.5)
        
        logger.info(f"Scrolled {direction} by {amount}")
        return {"direction": direction, "amount": amount}


class HoverNodeExecutor(NodeExecutor):
    """悬停节点执行器"""

    async def execute(self, node: Node, context: Any) -> Any:
        config = node.data.config
        locator = node.data.locator
        
        if not locator:
            raise ValueError("Hover node requires locator")
        
        # 定位元素
        element = element_locator.locate(locator, timeout=config.get("timeout", 5))
        if not element:
            raise RuntimeError("Failed to locate element")
        
        # 移动鼠标到元素
        import pyautogui
        center_x, center_y = element.center
        pyautogui.moveTo(center_x, center_y, duration=0.3)
        
        # 等待
        wait_after = config.get("waitAfter", 1000)
        await asyncio.sleep(wait_after / 1000)
        
        logger.info(f"Hovered at ({center_x}, {center_y})")
        return {"x": center_x, "y": center_y}


class KeyboardNodeExecutor(NodeExecutor):
    """键盘节点执行器"""

    async def execute(self, node: Node, context: Any) -> Any:
        config = node.data.config
        key = config.get("key", "")
        modifiers = config.get("modifiers", [])
        
        import pyautogui
        
        if modifiers:
            # 组合键
            pyautogui.hotkey(*modifiers, key)
        else:
            # 单键
            pyautogui.press(key)
        
        await asyncio.sleep(0.2)
        
        logger.info(f"Pressed key: {modifiers + [key]}")
        return {"key": key, "modifiers": modifiers}


class DelayNodeExecutor(NodeExecutor):
    """延迟节点执行器"""

    async def execute(self, node: Node, context: Any) -> Any:
        config = node.data.config
        duration = config.get("duration", 1000)  # 毫秒
        
        await asyncio.sleep(duration / 1000)
        
        logger.info(f"Delayed for {duration}ms")
        return {"duration": duration}


# ============================================================================
# 流程控制节点 (3个)
# ============================================================================

class VariableNodeExecutor(NodeExecutor):
    """变量节点执行器"""

    async def execute(self, node: Node, context: Any) -> Any:
        config = node.data.config
        operation = config.get("operation", "set")
        var_name = config.get("name", "")
        value = config.get("value")
        
        if operation == "set":
            context.set_variable(var_name, value)
            logger.info(f"Set variable {var_name} = {value}")
            return {var_name: value}
        
        elif operation == "get":
            result = context.get_variable(var_name)
            logger.info(f"Get variable {var_name} = {result}")
            return {var_name: result}
        
        elif operation == "delete":
            context.variables.pop(var_name, None)
            logger.info(f"Deleted variable {var_name}")
            return {"deleted": var_name}
        
        return None


class CompareNodeExecutor(NodeExecutor):
    """比较节点执行器"""

    async def execute(self, node: Node, context: Any) -> Any:
        config = node.data.config
        left = config.get("left")
        right = config.get("right")
        operator = config.get("operator", "==")
        
        # 支持变量引用
        if isinstance(left, str) and left.startswith("$"):
            left = context.get_variable(left[1:])
        if isinstance(right, str) and right.startswith("$"):
            right = context.get_variable(right[1:])
        
        # 执行比较
        result = False
        if operator == "==":
            result = left == right
        elif operator == "!=":
            result = left != right
        elif operator == ">":
            result = left > right
        elif operator == "<":
            result = left < right
        elif operator == ">=":
            result = left >= right
        elif operator == "<=":
            result = left <= right
        elif operator == "contains":
            result = str(right) in str(left)
        
        logger.info(f"Compare: {left} {operator} {right} = {result}")
        return {"result": result, "left": left, "right": right}


class DataExtractNodeExecutor(NodeExecutor):
    """数据提取节点执行器"""

    async def execute(self, node: Node, context: Any) -> Any:
        config = node.data.config
        source = config.get("source", "")
        pattern = config.get("pattern", "")
        extract_type = config.get("type", "regex")
        
        # 支持变量引用
        if source.startswith("$"):
            source = context.get_variable(source[1:], "")
        
        result = None
        
        if extract_type == "regex":
            import re
            match = re.search(pattern, str(source))
            if match:
                result = match.group(1) if match.groups() else match.group(0)
        
        elif extract_type == "json":
            try:
                data = json.loads(source)
                # 使用 JSONPath 或简单的键访问
                keys = pattern.split(".")
                result = data
                for key in keys:
                    result = result.get(key) if isinstance(result, dict) else None
            except:
                result = None
        
        logger.info(f"Extracted data: {result}")
        return {"result": result}


# ============================================================================
# 集成节点 (2个)
# ============================================================================

class HTTPRequestNodeExecutor(NodeExecutor):
    """HTTP请求节点执行器"""

    async def execute(self, node: Node, context: Any) -> Any:
        config = node.data.config
        url = config.get("url", "")
        method = config.get("method", "GET")
        headers = config.get("headers", {})
        body = config.get("body")
        
        import httpx
        
        async with httpx.AsyncClient() as client:
            if method == "GET":
                response = await client.get(url, headers=headers)
            elif method == "POST":
                response = await client.post(url, headers=headers, json=body)
            elif method == "PUT":
                response = await client.put(url, headers=headers, json=body)
            elif method == "DELETE":
                response = await client.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
        
        result = {
            "status_code": response.status_code,
            "headers": dict(response.headers),
            "body": response.text
        }
        
        logger.info(f"HTTP {method} {url} -> {response.status_code}")
        return result


class SubworkflowNodeExecutor(NodeExecutor):
    """子工作流节点执行器"""

    async def execute(self, node: Node, context: Any) -> Any:
        config = node.data.config
        workflow_id = config.get("workflowId", "")
        params = config.get("params", {})
        
        # TODO: 实现子工作流调用
        logger.info(f"Subworkflow {workflow_id} execution not fully implemented")
        return {"workflow_id": workflow_id, "status": "skipped"}


# ============================================================================
# 文件操作节点 (2个)
# ============================================================================

class FileSelectorNodeExecutor(NodeExecutor):
    """文件选择节点执行器"""

    async def execute(self, node: Node, context: Any) -> Any:
        config = node.data.config
        mode = config.get("mode", "open")  # open, save
        file_types = config.get("fileTypes", [])
        
        # TODO: 实现文件选择对话框
        logger.info(f"File selector ({mode}) not fully implemented")
        return {"path": "/tmp/selected_file.txt", "mode": mode}


class FileOperationNodeExecutor(NodeExecutor):
    """文件操作节点执行器"""

    async def execute(self, node: Node, context: Any) -> Any:
        config = node.data.config
        operation = config.get("operation", "read")
        path = config.get("path", "")
        content = config.get("content", "")
        
        import os
        
        if operation == "read":
            with open(path, 'r', encoding='utf-8') as f:
                result = f.read()
            logger.info(f"Read file: {path}")
            return {"content": result}
        
        elif operation == "write":
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            logger.info(f"Wrote file: {path}")
            return {"path": path, "size": len(content)}
        
        elif operation == "append":
            with open(path, 'a', encoding='utf-8') as f:
                f.write(content)
            logger.info(f"Appended to file: {path}")
            return {"path": path}
        
        elif operation == "delete":
            os.remove(path)
            logger.info(f"Deleted file: {path}")
            return {"path": path}
        
        elif operation == "exists":
            result = os.path.exists(path)
            logger.info(f"File exists: {path} = {result}")
            return {"exists": result}
        
        return None


# ============================================================================
# 系统操作节点 (3个)
# ============================================================================

class ClipboardNodeExecutor(NodeExecutor):
    """剪贴板节点执行器"""

    async def execute(self, node: Node, context: Any) -> Any:
        config = node.data.config
        operation = config.get("operation", "get")
        text = config.get("text", "")
        
        import pyperclip
        
        if operation == "get":
            result = pyperclip.paste()
            logger.info(f"Got clipboard: {result[:50]}...")
            return {"content": result}
        
        elif operation == "set":
            pyperclip.copy(text)
            logger.info(f"Set clipboard: {text[:50]}...")
            return {"content": text}
        
        return None


class ShellCommandNodeExecutor(NodeExecutor):
    """Shell命令节点执行器"""

    async def execute(self, node: Node, context: Any) -> Any:
        config = node.data.config
        command = config.get("command", "")
        shell = config.get("shell", True)
        timeout = config.get("timeout", 30)
        
        try:
            result = subprocess.run(
                command,
                shell=shell,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            
            output = {
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode
            }
            
            logger.info(f"Executed command: {command[:50]}... -> {result.returncode}")
            return output
            
        except subprocess.TimeoutExpired:
            logger.error(f"Command timeout: {command}")
            raise RuntimeError(f"Command timeout after {timeout}s")


class AppControlNodeExecutor(NodeExecutor):
    """应用控制节点执行器"""

    async def execute(self, node: Node, context: Any) -> Any:
        config = node.data.config
        operation = config.get("operation", "launch")
        app_name = config.get("appName", "")
        app_path = config.get("appPath", "")
        
        import platform
        system = platform.system()
        
        if operation == "launch":
            if system == "Darwin":  # macOS
                subprocess.Popen(["open", "-a", app_name or app_path])
            elif system == "Windows":
                subprocess.Popen([app_path or app_name])
            
            logger.info(f"Launched app: {app_name or app_path}")
            return {"app": app_name or app_path, "status": "launched"}
        
        elif operation == "close":
            # TODO: 实现应用关闭
            logger.info(f"Close app not fully implemented")
            return {"app": app_name, "status": "skipped"}
        
        elif operation == "focus":
            # TODO: 实现应用聚焦
            logger.info(f"Focus app not fully implemented")
            return {"app": app_name, "status": "skipped"}
        
        return None
