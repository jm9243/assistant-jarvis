"""
Basic Agent - 基础对话型Agent
"""
from typing import AsyncIterator

from .base import BaseAgent
from models.agent import AgentConfig
from logger import get_logger, log_agent_action

logger = get_logger("basic_agent")


class BasicAgent(BaseAgent):
    """基础对话型Agent"""
    
    def __init__(self, config: AgentConfig):
        """
        初始化Basic Agent
        
        Args:
            config: Agent配置
        """
        super().__init__(config)
        logger.info(f"BasicAgent {self.agent_id} ready")
    
    async def chat(
        self,
        message: str,
        conversation_id: str,
        use_knowledge: bool = True,
        image_urls: list = None,
        file_paths: list = None,
        **kwargs
    ) -> AsyncIterator[str]:
        """
        处理用户消息并流式返回响应
        
        Args:
            message: 用户消息
            conversation_id: 会话ID
            use_knowledge: 是否使用知识库
            image_urls: 图片URL列表（用于视觉模型）
            file_paths: 文件路径列表（将提取内容）
            **kwargs: 其他参数
            
        Yields:
            响应token
        """
        try:
            log_agent_action(self.agent_id, "chat_start", {
                "conversation_id": conversation_id,
                "message_length": len(message)
            })
            
            # 1. 加载对话历史（短期记忆）
            history = await self.memory_service.short_term.get(conversation_id)
            
            # 2. 处理文件内容提取
            file_contents = []
            if file_paths:
                file_contents = await self._extract_file_contents(file_paths)
                logger.info(f"Extracted content from {len(file_contents)} files")
            
            # 3. 知识库检索（如果启用）
            knowledge_results = []
            if use_knowledge and self.config.knowledge_base_ids:
                knowledge_results = await self._retrieve_knowledge(message)
                logger.info(f"Retrieved {len(knowledge_results)} knowledge results")
            
            # 4. 构建增强的用户消息
            enhanced_message = message
            
            # 添加文件内容
            if file_contents:
                file_context = "\n\n".join([
                    f"[文件: {fc['name']}]\n{fc['content']}"
                    for fc in file_contents
                ])
                enhanced_message = f"{message}\n\n{file_context}"
            
            # 添加知识库内容
            if knowledge_results:
                enhanced_message = await self._inject_knowledge_to_prompt(
                    enhanced_message,
                    knowledge_results
                )
            
            # 5. 构建LLM消息列表（支持多模态）
            messages = await self._build_messages(
                history,
                enhanced_message,
                image_urls=image_urls
            )
            
            # 6. 调用LLM生成响应
            response = ""
            async for token in self.llm_service.chat_stream(messages):
                response += token
                yield token
            
            # 7. 保存到短期记忆
            await self.memory_service.short_term.add_message(
                conversation_id,
                "user",
                message,
                metadata={
                    "has_images": bool(image_urls),
                    "has_files": bool(file_paths),
                    "image_count": len(image_urls) if image_urls else 0,
                    "file_count": len(file_paths) if file_paths else 0
                }
            )
            await self.memory_service.short_term.add_message(
                conversation_id,
                "assistant",
                response
            )
            
            # 8. 提取并保存重要信息到长期记忆（可选）
            if self.config.memory_config.long_term.get("enabled"):
                await self._extract_and_save_important_info(
                    conversation_id,
                    message,
                    response
                )
            
            log_agent_action(self.agent_id, "chat_complete", {
                "conversation_id": conversation_id,
                "response_length": len(response)
            })
            
        except Exception as e:
            logger.error(f"Chat error in BasicAgent {self.agent_id}: {e}")
            log_agent_action(self.agent_id, "chat_error", {"error": str(e)})
            yield f"\n\n[错误] 抱歉，处理您的消息时出现了问题：{str(e)}"
    
    async def _extract_file_contents(self, file_paths: list) -> list:
        """
        提取文件内容
        
        Args:
            file_paths: 文件路径列表
            
        Returns:
            文件内容列表，每项包含name和content
        """
        import os
        from pathlib import Path
        
        file_contents = []
        
        for file_path in file_paths:
            try:
                path = Path(file_path)
                
                if not path.exists():
                    logger.warning(f"File not found: {file_path}")
                    continue
                
                # 检查文件大小（限制为10MB）
                file_size = path.stat().st_size
                if file_size > 10 * 1024 * 1024:
                    logger.warning(f"File too large: {file_path} ({file_size} bytes)")
                    file_contents.append({
                        "name": path.name,
                        "content": f"[文件过大，无法读取。大小: {file_size / 1024 / 1024:.2f}MB]"
                    })
                    continue
                
                # 根据文件类型提取内容
                file_ext = path.suffix.lower()
                
                if file_ext in ['.txt', '.md', '.py', '.js', '.json', '.yaml', '.yml', '.xml', '.html', '.css']:
                    # 文本文件直接读取
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    file_contents.append({
                        "name": path.name,
                        "content": content
                    })
                    
                elif file_ext == '.pdf':
                    # PDF文件使用document_parser
                    if hasattr(self, 'document_parser'):
                        content = await self.document_parser.parse_pdf(str(path))
                        file_contents.append({
                            "name": path.name,
                            "content": content
                        })
                    else:
                        file_contents.append({
                            "name": path.name,
                            "content": "[PDF文件需要document_parser支持]"
                        })
                        
                elif file_ext in ['.docx', '.doc']:
                    # Word文件使用document_parser
                    if hasattr(self, 'document_parser'):
                        content = await self.document_parser.parse_docx(str(path))
                        file_contents.append({
                            "name": path.name,
                            "content": content
                        })
                    else:
                        file_contents.append({
                            "name": path.name,
                            "content": "[Word文件需要document_parser支持]"
                        })
                        
                else:
                    file_contents.append({
                        "name": path.name,
                        "content": f"[不支持的文件类型: {file_ext}]"
                    })
                    
                logger.info(f"Extracted content from {path.name}")
                
            except Exception as e:
                logger.error(f"Failed to extract content from {file_path}: {e}")
                file_contents.append({
                    "name": Path(file_path).name,
                    "content": f"[读取文件失败: {str(e)}]"
                })
        
        return file_contents
    
    async def _extract_and_save_important_info(
        self,
        conversation_id: str,
        user_message: str,
        assistant_response: str
    ):
        """
        提取并保存重要信息到长期记忆
        
        Args:
            conversation_id: 会话ID
            user_message: 用户消息
            assistant_response: Agent响应
        """
        try:
            # 简单实现：如果用户消息包含"我喜欢"、"我的"等关键词，保存为长期记忆
            keywords = ["我喜欢", "我的", "我是", "我想", "我需要"]
            
            for keyword in keywords:
                if keyword in user_message:
                    await self.memory_service.long_term.save(
                        agent_id=self.agent_id,
                        key=f"user_preference_{conversation_id}",
                        value=user_message,
                        importance=0.7,
                        metadata={
                            "conversation_id": conversation_id,
                            "keyword": keyword
                        }
                    )
                    logger.info(f"Saved important info to long-term memory")
                    break
                    
        except Exception as e:
            logger.warning(f"Failed to save to long-term memory: {e}")
