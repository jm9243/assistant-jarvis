"""
ReAct Agent - 推理-行动型Agent
"""
import re
import json
from typing import AsyncIterator, Dict, List

from .basic import BasicAgent
from models.agent import AgentConfig
from core.service.tool import ToolService
from logger import get_logger, log_agent_action

logger = get_logger("react_agent")


class ReActAgent(BasicAgent):
    """ReAct Agent - 使用Thought-Action-Observation循环"""
    
    def __init__(self, config: AgentConfig):
        """
        初始化ReAct Agent
        
        Args:
            config: Agent配置
        """
        super().__init__(config)
        self.tool_service = ToolService()
        self.max_iterations = config.react_config.get("max_iterations", 5) if config.react_config else 5
        logger.info(f"ReActAgent {self.agent_id} ready with max_iterations={self.max_iterations}")
    
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
        使用ReAct模式处理消息
        
        流程：Thought → Action → Observation → (循环) → Final Answer
        
        Args:
            message: 用户消息
            conversation_id: 会话ID
            use_knowledge: 是否使用知识库
            image_urls: 图片URL列表
            file_paths: 文件路径列表
            **kwargs: 其他参数
            
        Yields:
            响应token
        """
        try:
            log_agent_action(self.agent_id, "react_start", {
                "conversation_id": conversation_id,
                "message_length": len(message)
            })
            
            # 加载对话历史
            history = await self.memory_service.short_term.get(conversation_id)
            
            # 获取可用工具列表
            tools = self.tool_service.list_tools(agent_id=self.agent_id)
            
            # 构建ReAct prompt
            react_history = []
            
            for iteration in range(self.max_iterations):
                logger.info(f"ReAct iteration {iteration + 1}/{self.max_iterations}")
                
                # 构建消息
                messages = await self._build_react_messages(
                    history=history,
                    user_message=message,
                    tools=tools,
                    react_history=react_history
                )
                
                # 调用LLM
                response = ""
                async for token in self.llm_service.chat_stream(messages):
                    response += token
                
                logger.debug(f"LLM response: {response}")
                
                # 解析响应
                if "Final Answer:" in response:
                    # 提取最终答案
                    final_answer = response.split("Final Answer:")[1].strip()
                    
                    # 返回最终答案
                    yield f"\n\n**最终答案:**\n{final_answer}"
                    
                    # 保存到记忆
                    await self.memory_service.short_term.add_message(
                        conversation_id, "user", message
                    )
                    await self.memory_service.short_term.add_message(
                        conversation_id, "assistant", final_answer
                    )
                    
                    log_agent_action(self.agent_id, "react_complete", {
                        "iterations": iteration + 1
                    })
                    break
                    
                elif "Action:" in response:
                    # 解析工具调用
                    action = self._parse_action(response)
                    
                    if not action:
                        yield "\n\n[错误] 无法解析工具调用"
                        break
                    
                    # 提取思考过程
                    thought = self._extract_thought(response)
                    if thought:
                        yield f"\n\n**思考:** {thought}\n"
                    
                    # 显示工具调用
                    yield f"\n**行动:** 调用工具 `{action['tool']}`\n"
                    yield f"**参数:** ```json\n{json.dumps(action['params'], ensure_ascii=False, indent=2)}\n```\n"
                    
                    # 检查是否需要审批
                    tool = self.tool_service.get_tool(action['tool'])
                    if tool and await self._requires_approval(tool):
                        # 请求审批
                        approval_granted = await self._request_approval(
                            tool=tool,
                            params=action['params'],
                            conversation_id=conversation_id
                        )
                        
                        if not approval_granted:
                            yield "\n\n[用户拒绝了工具调用]\n"
                            observation = "用户拒绝了工具调用"
                        else:
                            # 执行工具
                            try:
                                result = await self.tool_service.execute(
                                    tool_id=action['tool'],
                                    params=action['params'],
                                    agent_id=self.agent_id,
                                    conversation_id=conversation_id
                                )
                                observation = json.dumps(result, ensure_ascii=False)
                            except Exception as e:
                                observation = f"工具执行失败: {str(e)}"
                    else:
                        # 直接执行工具
                        try:
                            result = await self.tool_service.execute(
                                tool_id=action['tool'],
                                params=action['params'],
                                agent_id=self.agent_id,
                                conversation_id=conversation_id
                            )
                            observation = json.dumps(result, ensure_ascii=False)
                        except Exception as e:
                            observation = f"工具执行失败: {str(e)}"
                    
                    # 显示观察结果
                    yield f"\n**观察:** {observation}\n"
                    
                    # 添加到历史
                    react_history.append({
                        "thought": thought,
                        "action": action,
                        "observation": observation
                    })
                    
                else:
                    # 无法解析响应
                    yield f"\n\n[警告] 无法解析LLM响应，直接返回:\n{response}"
                    break
            
            else:
                # 达到最大迭代次数
                yield "\n\n[警告] 达到最大迭代次数，任务可能未完成"
            
        except Exception as e:
            logger.error(f"ReAct error in Agent {self.agent_id}: {e}")
            log_agent_action(self.agent_id, "react_error", {"error": str(e)})
            yield f"\n\n[错误] {str(e)}"
    
    async def _build_react_messages(
        self,
        history: List[Dict],
        user_message: str,
        tools: List,
        react_history: List[Dict]
    ) -> List[Dict]:
        """
        构建ReAct格式的消息
        
        Args:
            history: 对话历史
            user_message: 用户消息
            tools: 可用工具列表
            react_history: ReAct推理历史
            
        Returns:
            消息列表
        """
        # 构建工具描述
        tools_desc = self._format_tools(tools)
        
        # 构建system prompt
        system_prompt = f"""{self.config.system_prompt}

你是一个使用ReAct（Reasoning and Acting）模式的智能助手。你需要通过思考和行动来解决问题。

## 可用工具

{tools_desc}

## ReAct格式

你必须严格按照以下格式回复：

Thought: [你的思考过程，分析问题和下一步行动]
Action: [工具名称]
Action Input: [JSON格式的工具参数]

或者，如果你已经有了最终答案：

Thought: [你的最终思考]
Final Answer: [你的最终答案]

## 重要规则

1. 每次只能调用一个工具
2. Action Input必须是有效的JSON格式
3. 如果工具执行失败，分析原因并尝试其他方法
4. 当你有足够信息回答用户问题时，给出Final Answer
5. 不要重复相同的行动
"""
        
        messages = [{"role": "system", "content": system_prompt}]
        
        # 添加用户消息
        if not react_history:
            messages.append({"role": "user", "content": user_message})
        else:
            # 添加ReAct历史
            react_context = f"用户问题: {user_message}\n\n"
            
            for i, step in enumerate(react_history, 1):
                react_context += f"## 步骤 {i}\n\n"
                if step.get("thought"):
                    react_context += f"Thought: {step['thought']}\n"
                react_context += f"Action: {step['action']['tool']}\n"
                react_context += f"Action Input: {json.dumps(step['action']['params'], ensure_ascii=False)}\n"
                react_context += f"Observation: {step['observation']}\n\n"
            
            react_context += "请继续推理，或给出Final Answer。"
            
            messages.append({"role": "user", "content": react_context})
        
        return messages
    
    def _format_tools(self, tools: List) -> str:
        """
        格式化工具列表为描述文本
        
        Args:
            tools: 工具列表
            
        Returns:
            工具描述文本
        """
        if not tools:
            return "暂无可用工具"
        
        tools_desc = []
        for tool in tools:
            desc = f"### {tool.name}\n"
            desc += f"- **ID**: `{tool.id}`\n"
            desc += f"- **描述**: {tool.description}\n"
            desc += f"- **参数**: {json.dumps(tool.parameters_schema, ensure_ascii=False)}\n"
            tools_desc.append(desc)
        
        return "\n".join(tools_desc)
    
    def _parse_action(self, response: str) -> Dict:
        """
        解析工具调用
        
        Args:
            response: LLM响应
            
        Returns:
            工具调用信息 {"tool": "tool_id", "params": {...}}
        """
        try:
            # 提取Action
            action_match = re.search(r'Action:\s*(.+)', response)
            if not action_match:
                return None
            
            tool_name = action_match.group(1).strip()
            
            # 提取Action Input
            input_match = re.search(r'Action Input:\s*(\{.+?\})', response, re.DOTALL)
            if not input_match:
                return None
            
            params_str = input_match.group(1).strip()
            params = json.loads(params_str)
            
            return {
                "tool": tool_name,
                "params": params
            }
            
        except Exception as e:
            logger.error(f"Failed to parse action: {e}")
            return None
    
    def _extract_thought(self, response: str) -> str:
        """
        提取思考过程
        
        Args:
            response: LLM响应
            
        Returns:
            思考内容
        """
        thought_match = re.search(r'Thought:\s*(.+?)(?=Action:|Final Answer:|$)', response, re.DOTALL)
        if thought_match:
            return thought_match.group(1).strip()
        return ""
    
    async def _requires_approval(self, tool) -> bool:
        """
        检查工具是否需要审批
        
        Args:
            tool: 工具定义
            
        Returns:
            是否需要审批
        """
        return self.tool_service.permission_checker.requires_approval(tool)
    
    async def _request_approval(
        self,
        tool,
        params: Dict,
        conversation_id: str
    ) -> bool:
        """
        请求用户审批（简化版本，实际应该通过UI交互）
        
        Args:
            tool: 工具定义
            params: 工具参数
            conversation_id: 会话ID
            
        Returns:
            是否批准
        """
        # TODO: 实际应该通过WebSocket或其他机制与前端交互
        # 这里简化处理，自动批准
        logger.warning(f"Tool {tool.name} requires approval, auto-approving for now")
        return True
