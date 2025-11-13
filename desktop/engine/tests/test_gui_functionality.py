"""
GUI自动化功能完整测试
测试元素定位、点击操作、文本输入等所有功能
"""
import pytest
from tools.gui.ipc_functions import (
    locate_element,
    click_element,
    input_text,
    press_key
)


class TestElementLocation:
    """测试元素定位功能"""
    
    def test_locate_element_structure(self):
        """测试定位元素API结构"""
        locator = {
            "strategies": [
                {"type": "text", "value": "测试按钮"}
            ]
        }
        
        result = locate_element(
            locator=locator,
            timeout=1  # 短超时用于测试
        )
        
        assert isinstance(result, dict)
        assert "success" in result
        assert "found" in result
        
        if result.get("found"):
            # 如果找到元素，应该有位置信息
            assert "x" in result
            assert "y" in result
            assert "width" in result
            assert "height" in result
    
    def test_locate_element_with_multiple_strategies(self):
        """测试多策略定位"""
        locator = {
            "strategies": [
                {"type": "text", "value": "按钮"},
                {"type": "image", "value": "button.png"}
            ]
        }
        
        result = locate_element(locator=locator, timeout=1)
        
        assert isinstance(result, dict)
        assert "success" in result
        assert "found" in result
    
    def test_locate_element_timeout(self):
        """测试定位超时"""
        locator = {
            "strategies": [
                {"type": "text", "value": "不存在的元素12345"}
            ]
        }
        
        result = locate_element(locator=locator, timeout=1)
        
        assert isinstance(result, dict)
        assert "success" in result
        # 超时后found应该为False
        if result.get("success"):
            assert result.get("found") == False


class TestClickOperations:
    """测试点击操作功能"""
    
    def test_click_element_structure(self):
        """测试点击元素API结构"""
        result = click_element(
            x=100,
            y=100,
            button="left",
            click_count=1
        )
        
        assert isinstance(result, dict)
        assert "success" in result
        
        if result.get("success"):
            assert "x" in result
            assert "y" in result
            assert "button" in result
            assert "click_count" in result
    
    def test_click_different_buttons(self):
        """测试不同的鼠标按钮"""
        buttons = ["left", "right", "middle"]
        
        for button in buttons:
            result = click_element(
                x=100,
                y=100,
                button=button,
                click_count=1
            )
            
            assert isinstance(result, dict)
            assert "success" in result
    
    def test_double_click(self):
        """测试双击"""
        result = click_element(
            x=100,
            y=100,
            button="left",
            click_count=2
        )
        
        assert isinstance(result, dict)
        assert "success" in result
        
        if result.get("success"):
            assert result["click_count"] == 2
    
    def test_click_with_wait(self):
        """测试带等待的点击"""
        result = click_element(
            x=100,
            y=100,
            button="left",
            click_count=1,
            wait_after=100  # 100ms
        )
        
        assert isinstance(result, dict)
        assert "success" in result


class TestTextInput:
    """测试文本输入功能"""
    
    def test_input_text_structure(self):
        """测试输入文本API结构"""
        result = input_text(
            text="测试文本",
            clear_before=False
        )
        
        assert isinstance(result, dict)
        assert "success" in result
        
        if result.get("success"):
            assert "text_length" in result
            assert "clear_before" in result
    
    def test_input_text_with_clear(self):
        """测试清空后输入"""
        result = input_text(
            text="新文本",
            clear_before=True
        )
        
        assert isinstance(result, dict)
        assert "success" in result
        
        if result.get("success"):
            assert result["clear_before"] == True
    
    def test_input_different_text_types(self):
        """测试不同类型的文本"""
        test_texts = [
            "简单文本",
            "Text with spaces",
            "123456",
            "特殊字符!@#$%",
            "多行\n文本"
        ]
        
        for text in test_texts:
            result = input_text(text=text, clear_before=False)
            
            assert isinstance(result, dict)
            assert "success" in result
            
            if result.get("success"):
                assert result["text_length"] == len(text)
    
    def test_input_with_wait(self):
        """测试带等待的输入"""
        result = input_text(
            text="测试",
            clear_before=False,
            wait_after=100
        )
        
        assert isinstance(result, dict)
        assert "success" in result


class TestKeyPress:
    """测试按键功能"""
    
    def test_press_key_structure(self):
        """测试按键API结构"""
        result = press_key(
            key="enter",
            modifiers=[],
            wait_after=50
        )
        
        assert isinstance(result, dict)
        assert "success" in result
        
        if result.get("success"):
            assert "key" in result
            assert "modifiers" in result
    
    def test_press_special_keys(self):
        """测试特殊按键"""
        special_keys = ["enter", "tab", "escape", "space", "delete"]
        
        for key in special_keys:
            result = press_key(key=key, modifiers=[])
            
            assert isinstance(result, dict)
            assert "success" in result
    
    def test_press_key_with_modifiers(self):
        """测试带修饰键的按键"""
        # 测试Cmd+C (macOS) 或 Ctrl+C (Windows/Linux)
        result = press_key(
            key="c",
            modifiers=["cmd"]
        )
        
        assert isinstance(result, dict)
        assert "success" in result
        
        if result.get("success"):
            assert "cmd" in result["modifiers"] or "ctrl" in result["modifiers"]
    
    def test_press_key_combinations(self):
        """测试组合键"""
        combinations = [
            {"key": "a", "modifiers": ["cmd"]},
            {"key": "c", "modifiers": ["cmd"]},
            {"key": "v", "modifiers": ["cmd"]},
            {"key": "z", "modifiers": ["cmd"]},
        ]
        
        for combo in combinations:
            result = press_key(
                key=combo["key"],
                modifiers=combo["modifiers"]
            )
            
            assert isinstance(result, dict)
            assert "success" in result


class TestGUIIntegration:
    """测试GUI自动化集成功能"""
    
    def test_locate_and_click_workflow(self):
        """测试定位并点击工作流"""
        # 1. 定位元素
        locator = {
            "strategies": [
                {"type": "text", "value": "确定"}
            ]
        }
        
        locate_result = locate_element(locator=locator, timeout=1)
        
        assert isinstance(locate_result, dict)
        assert "success" in locate_result
        
        # 2. 如果找到元素，点击它
        if locate_result.get("found"):
            x = locate_result["center_x"]
            y = locate_result["center_y"]
            
            click_result = click_element(x=x, y=y, button="left")
            
            assert isinstance(click_result, dict)
            assert "success" in click_result
    
    def test_click_and_input_workflow(self):
        """测试点击并输入工作流"""
        # 1. 点击输入框位置
        click_result = click_element(x=200, y=200, button="left")
        
        assert isinstance(click_result, dict)
        
        # 2. 输入文本
        if click_result.get("success"):
            input_result = input_text(
                text="测试输入",
                clear_before=True
            )
            
            assert isinstance(input_result, dict)
            assert "success" in input_result
    
    def test_input_and_submit_workflow(self):
        """测试输入并提交工作流"""
        # 1. 输入文本
        input_result = input_text(text="搜索内容", clear_before=True)
        
        assert isinstance(input_result, dict)
        
        # 2. 按Enter提交
        if input_result.get("success"):
            press_result = press_key(key="enter", modifiers=[])
            
            assert isinstance(press_result, dict)
            assert "success" in press_result


class TestGUIDataStructure:
    """测试GUI自动化数据结构"""
    
    def test_locate_result_coordinates(self):
        """测试定位结果坐标"""
        locator = {
            "strategies": [
                {"type": "text", "value": "测试"}
            ]
        }
        
        result = locate_element(locator=locator, timeout=1)
        
        if result.get("found"):
            # 验证坐标是数字
            assert isinstance(result["x"], (int, float))
            assert isinstance(result["y"], (int, float))
            assert isinstance(result["width"], (int, float))
            assert isinstance(result["height"], (int, float))
            
            # 验证坐标合理性
            assert result["x"] >= 0
            assert result["y"] >= 0
            assert result["width"] > 0
            assert result["height"] > 0
    
    def test_click_coordinates(self):
        """测试点击坐标"""
        result = click_element(x=100, y=200, button="left")
        
        if result.get("success"):
            assert result["x"] == 100
            assert result["y"] == 200
    
    def test_api_response_consistency(self):
        """测试API响应一致性"""
        # 所有API都应该返回包含success字段的字典
        apis = [
            locate_element(
                locator={"strategies": [{"type": "text", "value": "test"}]},
                timeout=1
            ),
            click_element(x=100, y=100, button="left"),
            input_text(text="test", clear_before=False),
            press_key(key="enter", modifiers=[]),
        ]
        
        for result in apis:
            assert isinstance(result, dict)
            assert "success" in result


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
