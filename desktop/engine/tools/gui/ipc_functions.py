"""
GUI自动化相关的IPC函数
这些函数将被注册到函数注册表，供Rust层通过IPC调用
"""
from typing import Dict, Any, Optional
from tools.gui.locator import element_locator, ElementRect
from logger import get_logger
import platform
import time

logger = get_logger("gui_ipc")


def locate_element(
    locator: Dict[str, Any],
    timeout: int = 5
) -> Dict[str, Any]:
    """
    定位GUI元素
    
    Args:
        locator: 定位器配置，包含strategies列表
        timeout: 超时时间（秒）
        
    Returns:
        包含元素位置信息的字典
    """
    try:
        logger.info(f"Locating element with strategies: {[s.get('type') for s in locator.get('strategies', [])]}")
        
        # 使用元素定位器定位
        rect = element_locator.locate(locator, timeout)
        
        if rect:
            logger.info(f"Element located: x={rect.x}, y={rect.y}, width={rect.width}, height={rect.height}")
            
            return {
                "success": True,
                "found": True,
                "x": rect.x,
                "y": rect.y,
                "width": rect.width,
                "height": rect.height,
                "center_x": rect.center[0],
                "center_y": rect.center[1]
            }
        else:
            logger.warning("Element not found")
            
            return {
                "success": True,
                "found": False,
                "message": "Element not found within timeout"
            }
            
    except Exception as e:
        logger.error(f"Locate element error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "found": False
        }


def click_element(
    x: int,
    y: int,
    button: str = "left",
    click_count: int = 1,
    wait_after: int = 500
) -> Dict[str, Any]:
    """
    点击GUI元素
    
    Args:
        x: X坐标
        y: Y坐标
        button: 鼠标按钮 (left/right/middle)
        click_count: 点击次数（1=单击，2=双击）
        wait_after: 点击后等待时间（毫秒）
        
    Returns:
        操作结果字典
    """
    try:
        logger.info(f"Clicking at ({x}, {y}) with {button} button, count={click_count}")
        
        system = platform.system()
        
        if system == "Darwin":  # macOS
            _click_macos(x, y, button, click_count)
        elif system == "Windows":
            _click_windows(x, y, button, click_count)
        else:
            raise NotImplementedError(f"Click not supported on {system}")
        
        # 等待
        if wait_after > 0:
            time.sleep(wait_after / 1000.0)
        
        logger.info(f"Click completed at ({x}, {y})")
        
        return {
            "success": True,
            "x": x,
            "y": y,
            "button": button,
            "click_count": click_count
        }
        
    except Exception as e:
        logger.error(f"Click element error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


def input_text(
    text: str,
    clear_before: bool = False,
    wait_after: int = 100
) -> Dict[str, Any]:
    """
    输入文本
    
    Args:
        text: 要输入的文本
        clear_before: 是否先清空（Cmd+A / Ctrl+A + Delete）
        wait_after: 输入后等待时间（毫秒）
        
    Returns:
        操作结果字典
    """
    try:
        logger.info(f"Inputting text: length={len(text)}, clear_before={clear_before}")
        
        system = platform.system()
        
        if system == "Darwin":  # macOS
            _input_text_macos(text, clear_before)
        elif system == "Windows":
            _input_text_windows(text, clear_before)
        else:
            raise NotImplementedError(f"Input text not supported on {system}")
        
        # 等待
        if wait_after > 0:
            time.sleep(wait_after / 1000.0)
        
        logger.info(f"Text input completed: length={len(text)}")
        
        return {
            "success": True,
            "text_length": len(text),
            "clear_before": clear_before
        }
        
    except Exception as e:
        logger.error(f"Input text error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


def press_key(
    key: str,
    modifiers: list = None,
    wait_after: int = 100
) -> Dict[str, Any]:
    """
    按键
    
    Args:
        key: 按键名称（如 'enter', 'tab', 'a'等）
        modifiers: 修饰键列表（如 ['cmd'], ['ctrl', 'shift']）
        wait_after: 按键后等待时间（毫秒）
        
    Returns:
        操作结果字典
    """
    try:
        logger.info(f"Pressing key: {key}, modifiers={modifiers}")
        
        system = platform.system()
        
        if system == "Darwin":  # macOS
            _press_key_macos(key, modifiers or [])
        elif system == "Windows":
            _press_key_windows(key, modifiers or [])
        else:
            raise NotImplementedError(f"Press key not supported on {system}")
        
        # 等待
        if wait_after > 0:
            time.sleep(wait_after / 1000.0)
        
        logger.info(f"Key press completed: {key}")
        
        return {
            "success": True,
            "key": key,
            "modifiers": modifiers or []
        }
        
    except Exception as e:
        logger.error(f"Press key error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


# ============= 平台特定实现 =============

def _click_macos(x: int, y: int, button: str, click_count: int):
    """macOS点击实现"""
    try:
        import Quartz
        
        # 转换按钮类型
        if button == "left":
            down_event = Quartz.kCGEventLeftMouseDown
            up_event = Quartz.kCGEventLeftMouseUp
        elif button == "right":
            down_event = Quartz.kCGEventRightMouseDown
            up_event = Quartz.kCGEventRightMouseUp
        else:
            down_event = Quartz.kCGEventOtherMouseDown
            up_event = Quartz.kCGEventOtherMouseUp
        
        # 执行点击
        for _ in range(click_count):
            # 按下
            event = Quartz.CGEventCreateMouseEvent(
                None, down_event, (x, y), Quartz.kCGMouseButtonLeft
            )
            Quartz.CGEventPost(Quartz.kCGHIDEventTap, event)
            
            # 释放
            event = Quartz.CGEventCreateMouseEvent(
                None, up_event, (x, y), Quartz.kCGMouseButtonLeft
            )
            Quartz.CGEventPost(Quartz.kCGHIDEventTap, event)
            
            if click_count > 1:
                time.sleep(0.1)  # 双击间隔
                
    except ImportError:
        logger.warning("Quartz not available, using pynput fallback")
        _click_fallback(x, y, button, click_count)


def _click_windows(x: int, y: int, button: str, click_count: int):
    """Windows点击实现"""
    try:
        import win32api
        import win32con
        
        # 移动鼠标
        win32api.SetCursorPos((x, y))
        
        # 转换按钮类型
        if button == "left":
            down_flag = win32con.MOUSEEVENTF_LEFTDOWN
            up_flag = win32con.MOUSEEVENTF_LEFTUP
        elif button == "right":
            down_flag = win32con.MOUSEEVENTF_RIGHTDOWN
            up_flag = win32con.MOUSEEVENTF_RIGHTUP
        else:
            down_flag = win32con.MOUSEEVENTF_MIDDLEDOWN
            up_flag = win32con.MOUSEEVENTF_MIDDLEUP
        
        # 执行点击
        for _ in range(click_count):
            win32api.mouse_event(down_flag, x, y, 0, 0)
            win32api.mouse_event(up_flag, x, y, 0, 0)
            
            if click_count > 1:
                time.sleep(0.1)  # 双击间隔
                
    except ImportError:
        logger.warning("win32api not available, using pynput fallback")
        _click_fallback(x, y, button, click_count)


def _click_fallback(x: int, y: int, button: str, click_count: int):
    """跨平台点击降级实现（使用pynput）"""
    from pynput.mouse import Controller, Button
    
    mouse = Controller()
    mouse.position = (x, y)
    
    # 转换按钮
    if button == "right":
        btn = Button.right
    elif button == "middle":
        btn = Button.middle
    else:
        btn = Button.left
    
    # 执行点击
    mouse.click(btn, click_count)


def _input_text_macos(text: str, clear_before: bool):
    """macOS文本输入实现"""
    try:
        import Quartz
        
        # 清空
        if clear_before:
            _press_key_macos('a', ['cmd'])
            time.sleep(0.05)
            _press_key_macos('delete', [])
            time.sleep(0.05)
        
        # 输入文本
        for char in text:
            event = Quartz.CGEventCreateKeyboardEvent(None, 0, True)
            Quartz.CGEventKeyboardSetUnicodeString(event, len(char), char)
            Quartz.CGEventPost(Quartz.kCGHIDEventTap, event)
            
            event = Quartz.CGEventCreateKeyboardEvent(None, 0, False)
            Quartz.CGEventPost(Quartz.kCGHIDEventTap, event)
            
    except ImportError:
        logger.warning("Quartz not available, using pynput fallback")
        _input_text_fallback(text, clear_before)


def _input_text_windows(text: str, clear_before: bool):
    """Windows文本输入实现"""
    try:
        import win32api
        import win32con
        
        # 清空
        if clear_before:
            _press_key_windows('a', ['ctrl'])
            time.sleep(0.05)
            _press_key_windows('delete', [])
            time.sleep(0.05)
        
        # 输入文本（使用剪贴板更可靠）
        import win32clipboard
        
        win32clipboard.OpenClipboard()
        win32clipboard.EmptyClipboard()
        win32clipboard.SetClipboardText(text)
        win32clipboard.CloseClipboard()
        
        # Ctrl+V粘贴
        _press_key_windows('v', ['ctrl'])
        
    except ImportError:
        logger.warning("win32api not available, using pynput fallback")
        _input_text_fallback(text, clear_before)


def _input_text_fallback(text: str, clear_before: bool):
    """跨平台文本输入降级实现（使用pynput）"""
    from pynput.keyboard import Controller, Key
    
    keyboard = Controller()
    
    # 清空
    if clear_before:
        system = platform.system()
        if system == "Darwin":
            keyboard.press(Key.cmd)
            keyboard.press('a')
            keyboard.release('a')
            keyboard.release(Key.cmd)
        else:
            keyboard.press(Key.ctrl)
            keyboard.press('a')
            keyboard.release('a')
            keyboard.release(Key.ctrl)
        
        time.sleep(0.05)
        keyboard.press(Key.delete)
        keyboard.release(Key.delete)
        time.sleep(0.05)
    
    # 输入文本
    keyboard.type(text)


def _press_key_macos(key: str, modifiers: list):
    """macOS按键实现"""
    try:
        import Quartz
        
        # 按下修饰键
        for mod in modifiers:
            if mod == 'cmd':
                event = Quartz.CGEventCreateKeyboardEvent(None, 55, True)  # Cmd
                Quartz.CGEventPost(Quartz.kCGHIDEventTap, event)
        
        # 按键映射（简化版）
        key_codes = {
            'enter': 36,
            'return': 36,
            'tab': 48,
            'delete': 51,
            'escape': 53,
            'space': 49,
        }
        
        key_code = key_codes.get(key.lower(), ord(key.upper()) if len(key) == 1 else 0)
        
        # 按下按键
        event = Quartz.CGEventCreateKeyboardEvent(None, key_code, True)
        Quartz.CGEventPost(Quartz.kCGHIDEventTap, event)
        
        # 释放按键
        event = Quartz.CGEventCreateKeyboardEvent(None, key_code, False)
        Quartz.CGEventPost(Quartz.kCGHIDEventTap, event)
        
        # 释放修饰键
        for mod in modifiers:
            if mod == 'cmd':
                event = Quartz.CGEventCreateKeyboardEvent(None, 55, False)
                Quartz.CGEventPost(Quartz.kCGHIDEventTap, event)
                
    except ImportError:
        logger.warning("Quartz not available, using pynput fallback")
        _press_key_fallback(key, modifiers)


def _press_key_windows(key: str, modifiers: list):
    """Windows按键实现"""
    try:
        import win32api
        import win32con
        
        # 按键映射
        key_codes = {
            'enter': win32con.VK_RETURN,
            'return': win32con.VK_RETURN,
            'tab': win32con.VK_TAB,
            'delete': win32con.VK_DELETE,
            'escape': win32con.VK_ESCAPE,
            'space': win32con.VK_SPACE,
        }
        
        # 修饰键映射
        mod_codes = {
            'ctrl': win32con.VK_CONTROL,
            'shift': win32con.VK_SHIFT,
            'alt': win32con.VK_MENU,
        }
        
        # 按下修饰键
        for mod in modifiers:
            if mod in mod_codes:
                win32api.keybd_event(mod_codes[mod], 0, 0, 0)
        
        # 按键
        key_code = key_codes.get(key.lower(), ord(key.upper()) if len(key) == 1 else 0)
        win32api.keybd_event(key_code, 0, 0, 0)
        win32api.keybd_event(key_code, 0, win32con.KEYEVENTF_KEYUP, 0)
        
        # 释放修饰键
        for mod in modifiers:
            if mod in mod_codes:
                win32api.keybd_event(mod_codes[mod], 0, win32con.KEYEVENTF_KEYUP, 0)
                
    except ImportError:
        logger.warning("win32api not available, using pynput fallback")
        _press_key_fallback(key, modifiers)


def _press_key_fallback(key: str, modifiers: list):
    """跨平台按键降级实现（使用pynput）"""
    from pynput.keyboard import Controller, Key
    
    keyboard = Controller()
    
    # 修饰键映射
    mod_keys = {
        'cmd': Key.cmd,
        'ctrl': Key.ctrl,
        'shift': Key.shift,
        'alt': Key.alt,
    }
    
    # 按键映射
    special_keys = {
        'enter': Key.enter,
        'return': Key.enter,
        'tab': Key.tab,
        'delete': Key.delete,
        'escape': Key.esc,
        'space': Key.space,
    }
    
    # 按下修饰键
    for mod in modifiers:
        if mod in mod_keys:
            keyboard.press(mod_keys[mod])
    
    # 按键
    if key.lower() in special_keys:
        keyboard.press(special_keys[key.lower()])
        keyboard.release(special_keys[key.lower()])
    else:
        keyboard.press(key)
        keyboard.release(key)
    
    # 释放修饰键
    for mod in modifiers:
        if mod in mod_keys:
            keyboard.release(mod_keys[mod])
