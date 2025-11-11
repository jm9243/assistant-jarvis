"""
测试多模态输入支持
"""
import pytest
import asyncio
from pathlib import Path

from models.agent import AgentConfig, ModelConfig, MemoryConfig
from core.agent.basic import BasicAgent


@pytest.fixture
def agent_config():
    """创建测试Agent配置"""
    return AgentConfig(
        id="test_agent_multimodal",
        user_id="test_user",
        name="Test Multimodal Agent",
        description="测试多模态Agent",
        type="basic",
        llm_config=ModelConfig(
            provider="openai",
            model="gpt-4o",  # 支持视觉的模型
            api_key="test_key",
            supports_vision=True
        ),
        system_prompt="You are a helpful assistant that can understand images and documents.",
        memory_config=MemoryConfig()
    )


@pytest.mark.asyncio
async def test_chat_with_images(agent_config):
    """测试带图片的对话"""
    agent = BasicAgent(agent_config)
    
    # 模拟图片URL
    image_urls = [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg"
    ]
    
    # 测试构建消息
    messages = await agent._build_messages(
        history=[],
        user_message="What do you see in these images?",
        image_urls=image_urls
    )
    
    # 验证消息格式
    assert len(messages) == 2  # system + user
    user_message = messages[1]
    assert user_message["role"] == "user"
    assert isinstance(user_message["content"], list)
    
    # 验证包含文本和图片
    content_types = [item["type"] for item in user_message["content"]]
    assert "text" in content_types
    assert "image_url" in content_types
    assert len([t for t in content_types if t == "image_url"]) == 2


@pytest.mark.asyncio
async def test_extract_file_contents(agent_config):
    """测试文件内容提取"""
    agent = BasicAgent(agent_config)
    
    # 创建测试文件
    test_dir = Path("./test_files")
    test_dir.mkdir(exist_ok=True)
    
    # 创建文本文件
    txt_file = test_dir / "test.txt"
    txt_file.write_text("This is a test file.", encoding="utf-8")
    
    # 创建Markdown文件
    md_file = test_dir / "test.md"
    md_file.write_text("# Test Markdown\n\nThis is a test.", encoding="utf-8")
    
    try:
        # 提取文件内容
        file_contents = await agent._extract_file_contents([
            str(txt_file),
            str(md_file)
        ])
        
        # 验证结果
        assert len(file_contents) == 2
        assert file_contents[0]["name"] == "test.txt"
        assert "This is a test file" in file_contents[0]["content"]
        assert file_contents[1]["name"] == "test.md"
        assert "Test Markdown" in file_contents[1]["content"]
        
    finally:
        # 清理测试文件
        txt_file.unlink(missing_ok=True)
        md_file.unlink(missing_ok=True)
        test_dir.rmdir()


@pytest.mark.asyncio
async def test_extract_large_file(agent_config):
    """测试大文件处理"""
    agent = BasicAgent(agent_config)
    
    # 创建大文件（超过10MB）
    test_dir = Path("./test_files")
    test_dir.mkdir(exist_ok=True)
    
    large_file = test_dir / "large.txt"
    
    try:
        # 创建11MB的文件
        with open(large_file, 'w') as f:
            f.write("x" * (11 * 1024 * 1024))
        
        # 提取文件内容
        file_contents = await agent._extract_file_contents([str(large_file)])
        
        # 验证返回错误消息
        assert len(file_contents) == 1
        assert "文件过大" in file_contents[0]["content"]
        
    finally:
        # 清理测试文件
        large_file.unlink(missing_ok=True)
        test_dir.rmdir()


@pytest.mark.asyncio
async def test_extract_unsupported_file(agent_config):
    """测试不支持的文件类型"""
    agent = BasicAgent(agent_config)
    
    # 创建不支持的文件类型
    test_dir = Path("./test_files")
    test_dir.mkdir(exist_ok=True)
    
    binary_file = test_dir / "test.bin"
    
    try:
        binary_file.write_bytes(b"\x00\x01\x02\x03")
        
        # 提取文件内容
        file_contents = await agent._extract_file_contents([str(binary_file)])
        
        # 验证返回不支持消息
        assert len(file_contents) == 1
        assert "不支持的文件类型" in file_contents[0]["content"]
        
    finally:
        # 清理测试文件
        binary_file.unlink(missing_ok=True)
        test_dir.rmdir()


@pytest.mark.asyncio
async def test_model_vision_detection():
    """测试模型视觉能力检测"""
    # 测试支持视觉的模型
    vision_models = [
        "gpt-4-vision-preview",
        "gpt-4-turbo",
        "gpt-4o",
        "claude-3-opus-20240229",
        "claude-3-sonnet-20240229"
    ]
    
    for model_name in vision_models:
        config = ModelConfig(
            provider="openai" if "gpt" in model_name else "claude",
            model=model_name,
            api_key="test_key"
        )
        assert config.supports_vision, f"{model_name} should support vision"
    
    # 测试不支持视觉的模型
    non_vision_models = [
        "gpt-3.5-turbo",
        "gpt-4",
        "claude-2"
    ]
    
    for model_name in non_vision_models:
        config = ModelConfig(
            provider="openai" if "gpt" in model_name else "claude",
            model=model_name,
            api_key="test_key"
        )
        assert not config.supports_vision, f"{model_name} should not support vision"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
