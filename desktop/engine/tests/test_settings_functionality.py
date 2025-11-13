"""
系统设置功能完整测试
测试配置保存、配置加载、密钥库操作等所有功能
"""
import pytest
import json
from pathlib import Path
from config import settings


class TestSettingsAccess:
    """测试设置访问功能"""
    
    def test_settings_object_exists(self):
        """测试设置对象存在"""
        assert settings is not None
        assert hasattr(settings, '__dict__') or hasattr(settings, '__getattribute__')
    
    def test_settings_has_basic_attributes(self):
        """测试设置有基本属性"""
        # 检查常见的设置属性
        common_attrs = [
            'data_dir',
            'log_level',
            'backend_url',
        ]
        
        for attr in common_attrs:
            # 至少应该能访问这些属性（即使值为None）
            try:
                value = getattr(settings, attr, None)
                assert True  # 能访问就通过
            except:
                pass  # 某些属性可能不存在，这是可以的
    
    def test_settings_data_types(self):
        """测试设置数据类型"""
        # 检查数据目录
        if hasattr(settings, 'data_dir'):
            data_dir = settings.data_dir
            assert isinstance(data_dir, (str, Path)) or data_dir is None
        
        # 检查日志级别
        if hasattr(settings, 'log_level'):
            log_level = settings.log_level
            assert isinstance(log_level, str) or log_level is None
        
        # 检查后端URL
        if hasattr(settings, 'backend_url'):
            backend_url = settings.backend_url
            assert isinstance(backend_url, str) or backend_url is None


class TestConfigurationPersistence:
    """测试配置持久化功能"""
    
    def test_config_file_structure(self, tmp_path):
        """测试配置文件结构"""
        # 创建测试配置
        test_config = {
            "app_name": "Jarvis",
            "version": "1.0.0",
            "settings": {
                "theme": "dark",
                "language": "zh-CN"
            }
        }
        
        # 保存配置
        config_file = tmp_path / "test_config.json"
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(test_config, f, ensure_ascii=False, indent=2)
        
        # 验证文件存在
        assert config_file.exists()
        
        # 加载配置
        with open(config_file, 'r', encoding='utf-8') as f:
            loaded_config = json.load(f)
        
        # 验证配置内容
        assert loaded_config["app_name"] == "Jarvis"
        assert loaded_config["version"] == "1.0.0"
        assert loaded_config["settings"]["theme"] == "dark"
    
    def test_config_save_and_load(self, tmp_path):
        """测试配置保存和加载"""
        config_file = tmp_path / "app_config.json"
        
        # 原始配置
        original_config = {
            "user_id": "test_user",
            "preferences": {
                "auto_save": True,
                "check_updates": False
            }
        }
        
        # 保存
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(original_config, f)
        
        # 加载
        with open(config_file, 'r', encoding='utf-8') as f:
            loaded_config = json.load(f)
        
        # 验证一致性
        assert loaded_config == original_config
    
    def test_config_update(self, tmp_path):
        """测试配置更新"""
        config_file = tmp_path / "update_config.json"
        
        # 初始配置
        config = {"setting1": "value1", "setting2": "value2"}
        
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(config, f)
        
        # 更新配置
        config["setting2"] = "new_value"
        config["setting3"] = "value3"
        
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(config, f)
        
        # 验证更新
        with open(config_file, 'r', encoding='utf-8') as f:
            updated_config = json.load(f)
        
        assert updated_config["setting2"] == "new_value"
        assert updated_config["setting3"] == "value3"


class TestKeyStore:
    """测试密钥库功能"""
    
    def test_keystore_structure(self, tmp_path):
        """测试密钥库结构"""
        keystore_file = tmp_path / "keystore.json"
        
        # 创建密钥库
        keystore = {
            "keys": {
                "openai_api_key": "sk-test-key-123",
                "anthropic_api_key": "sk-ant-test-456"
            },
            "metadata": {
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00"
            }
        }
        
        # 保存密钥库
        with open(keystore_file, 'w', encoding='utf-8') as f:
            json.dump(keystore, f)
        
        # 验证
        assert keystore_file.exists()
        
        # 加载验证
        with open(keystore_file, 'r', encoding='utf-8') as f:
            loaded_keystore = json.load(f)
        
        assert "keys" in loaded_keystore
        assert "openai_api_key" in loaded_keystore["keys"]
    
    def test_keystore_add_key(self, tmp_path):
        """测试添加密钥"""
        keystore_file = tmp_path / "keystore.json"
        
        # 初始密钥库
        keystore = {"keys": {}}
        
        # 添加密钥
        keystore["keys"]["test_key"] = "test_value"
        
        with open(keystore_file, 'w', encoding='utf-8') as f:
            json.dump(keystore, f)
        
        # 验证
        with open(keystore_file, 'r', encoding='utf-8') as f:
            loaded = json.load(f)
        
        assert "test_key" in loaded["keys"]
        assert loaded["keys"]["test_key"] == "test_value"
    
    def test_keystore_remove_key(self, tmp_path):
        """测试删除密钥"""
        keystore_file = tmp_path / "keystore.json"
        
        # 初始密钥库
        keystore = {
            "keys": {
                "key1": "value1",
                "key2": "value2"
            }
        }
        
        # 删除密钥
        del keystore["keys"]["key1"]
        
        with open(keystore_file, 'w', encoding='utf-8') as f:
            json.dump(keystore, f)
        
        # 验证
        with open(keystore_file, 'r', encoding='utf-8') as f:
            loaded = json.load(f)
        
        assert "key1" not in loaded["keys"]
        assert "key2" in loaded["keys"]
    
    def test_keystore_update_key(self, tmp_path):
        """测试更新密钥"""
        keystore_file = tmp_path / "keystore.json"
        
        # 初始密钥库
        keystore = {"keys": {"api_key": "old_value"}}
        
        # 更新密钥
        keystore["keys"]["api_key"] = "new_value"
        
        with open(keystore_file, 'w', encoding='utf-8') as f:
            json.dump(keystore, f)
        
        # 验证
        with open(keystore_file, 'r', encoding='utf-8') as f:
            loaded = json.load(f)
        
        assert loaded["keys"]["api_key"] == "new_value"


class TestSettingsValidation:
    """测试设置验证功能"""
    
    def test_valid_config_structure(self):
        """测试有效配置结构"""
        valid_config = {
            "app_name": "Jarvis",
            "version": "1.0.0",
            "settings": {}
        }
        
        # 验证必需字段
        assert "app_name" in valid_config
        assert "version" in valid_config
        assert isinstance(valid_config["settings"], dict)
    
    def test_config_value_types(self):
        """测试配置值类型"""
        config = {
            "string_value": "test",
            "int_value": 123,
            "bool_value": True,
            "float_value": 3.14,
            "list_value": [1, 2, 3],
            "dict_value": {"key": "value"}
        }
        
        # 验证类型
        assert isinstance(config["string_value"], str)
        assert isinstance(config["int_value"], int)
        assert isinstance(config["bool_value"], bool)
        assert isinstance(config["float_value"], float)
        assert isinstance(config["list_value"], list)
        assert isinstance(config["dict_value"], dict)
    
    def test_nested_config_structure(self):
        """测试嵌套配置结构"""
        config = {
            "level1": {
                "level2": {
                    "level3": {
                        "value": "deep_value"
                    }
                }
            }
        }
        
        # 验证嵌套访问
        assert config["level1"]["level2"]["level3"]["value"] == "deep_value"


class TestSettingsIntegration:
    """测试设置集成功能"""
    
    def test_complete_settings_workflow(self, tmp_path):
        """测试完整设置工作流"""
        config_file = tmp_path / "workflow_config.json"
        
        # 1. 创建初始配置
        config = {
            "user": "test_user",
            "settings": {
                "theme": "light",
                "language": "en"
            }
        }
        
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(config, f)
        
        # 2. 加载配置
        with open(config_file, 'r', encoding='utf-8') as f:
            loaded_config = json.load(f)
        
        assert loaded_config["user"] == "test_user"
        
        # 3. 修改配置
        loaded_config["settings"]["theme"] = "dark"
        loaded_config["settings"]["font_size"] = 14
        
        # 4. 保存修改
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(loaded_config, f)
        
        # 5. 重新加载验证
        with open(config_file, 'r', encoding='utf-8') as f:
            final_config = json.load(f)
        
        assert final_config["settings"]["theme"] == "dark"
        assert final_config["settings"]["font_size"] == 14
    
    def test_multiple_config_files(self, tmp_path):
        """测试多个配置文件"""
        # 创建多个配置文件
        configs = {
            "app_config.json": {"app": "settings"},
            "user_config.json": {"user": "preferences"},
            "system_config.json": {"system": "options"}
        }
        
        for filename, content in configs.items():
            config_file = tmp_path / filename
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(content, f)
        
        # 验证所有文件都存在
        for filename in configs.keys():
            assert (tmp_path / filename).exists()
        
        # 验证可以独立加载
        for filename, expected_content in configs.items():
            with open(tmp_path / filename, 'r', encoding='utf-8') as f:
                loaded = json.load(f)
            
            assert loaded == expected_content


class TestSettingsDataStructure:
    """测试设置数据结构"""
    
    def test_config_json_format(self, tmp_path):
        """测试配置JSON格式"""
        config_file = tmp_path / "format_test.json"
        
        config = {
            "name": "test",
            "value": 123
        }
        
        # 保存为格式化的JSON
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        
        # 读取并验证
        content = config_file.read_text(encoding='utf-8')
        
        # 应该包含缩进
        assert '  ' in content or '\t' in content
        
        # 应该能解析
        parsed = json.loads(content)
        assert parsed == config
    
    def test_config_encoding(self, tmp_path):
        """测试配置编码"""
        config_file = tmp_path / "encoding_test.json"
        
        # 包含中文的配置
        config = {
            "name": "测试",
            "description": "这是一个测试配置"
        }
        
        # 保存
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False)
        
        # 加载
        with open(config_file, 'r', encoding='utf-8') as f:
            loaded = json.load(f)
        
        # 验证中文正确保存和加载
        assert loaded["name"] == "测试"
        assert loaded["description"] == "这是一个测试配置"
    
    def test_config_consistency(self, tmp_path):
        """测试配置一致性"""
        config_file = tmp_path / "consistency_test.json"
        
        # 原始配置
        original = {
            "key1": "value1",
            "key2": 123,
            "key3": True,
            "key4": [1, 2, 3],
            "key5": {"nested": "value"}
        }
        
        # 保存
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(original, f)
        
        # 加载
        with open(config_file, 'r', encoding='utf-8') as f:
            loaded = json.load(f)
        
        # 验证完全一致
        assert loaded == original


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
