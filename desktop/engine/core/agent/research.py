"""
Deep Research Agent - 深度研究型Agent
"""
import asyncio
import json
from typing import AsyncIterator, Dict, List
from datetime import datetime

from .react import ReActAgent
from models.agent import AgentConfig
from logger import get_logger, log_agent_action

logger = get_logger("research_agent")


class DeepResearchAgent(ReActAgent):
    """Deep Research Agent - 深度研究型Agent，支持任务拆解和并行执行"""
    
    def __init__(self, config: AgentConfig):
        """
        初始化Deep Research Agent
        
        Args:
            config: Agent配置
        """
        super().__init__(config)
        self.complexity_threshold = config.research_config.get("complexity_threshold", 0.7) if config.research_config else 0.7
        self.max_subtasks = config.research_config.get("max_subtasks", 5) if config.research_config else 5
        logger.info(f"DeepResearchAgent {self.agent_id} ready")
    
    async def research(
        self,
        task: str,
        conversation_id: str
    ) -> AsyncIterator[str]:
        """
        执行深度研究任务
        
        流程：
        1. 分析任务复杂度
        2. 如果复杂，拆解为子任务
        3. 并行或顺序执行子任务
        4. 汇总结果生成报告
        
        Args:
            task: 研究任务
            conversation_id: 会话ID
            
        Yields:
            研究进度和结果
        """
        try:
            log_agent_action(self.agent_id, "research_start", {
                "conversation_id": conversation_id,
                "task": task
            })
            
            yield f"# 深度研究任务\n\n**任务:** {task}\n\n"
            
            # 1. 分析任务复杂度
            yield "## 步骤 1: 分析任务复杂度\n\n"
            complexity = await self._analyze_complexity(task)
            yield f"**复杂度评分:** {complexity:.2f}\n\n"
            
            if complexity > self.complexity_threshold:
                # 2. 拆解任务
                yield "## 步骤 2: 拆解任务\n\n"
                subtasks = await self._decompose_task(task)
                
                yield f"**子任务数量:** {len(subtasks)}\n\n"
                for i, subtask in enumerate(subtasks, 1):
                    yield f"{i}. {subtask}\n"
                yield "\n"
                
                # 3. 执行子任务
                yield "## 步骤 3: 执行子任务\n\n"
                results = []
                
                for i, subtask in enumerate(subtasks, 1):
                    yield f"### 子任务 {i}: {subtask}\n\n"
                    
                    result = await self._execute_subtask(
                        subtask=subtask,
                        conversation_id=conversation_id
                    )
                    
                    results.append({
                        "subtask": subtask,
                        "result": result
                    })
                    
                    yield f"**结果:** {result}\n\n"
                
                # 4. 生成报告
                yield "## 步骤 4: 生成研究报告\n\n"
                report = await self._generate_report(task, results)
                yield report
                
            else:
                # 简单任务，直接执行
                yield "## 执行简单任务\n\n"
                
                result = ""
                async for token in self.chat(
                    message=task,
                    conversation_id=conversation_id
                ):
                    result += token
                    yield token
            
            log_agent_action(self.agent_id, "research_complete", {
                "conversation_id": conversation_id
            })
            
        except Exception as e:
            logger.error(f"Research error in Agent {self.agent_id}: {e}")
            log_agent_action(self.agent_id, "research_error", {"error": str(e)})
            yield f"\n\n[错误] {str(e)}"
    
    async def _analyze_complexity(self, task: str) -> float:
        """
        分析任务复杂度
        
        Args:
            task: 任务描述
            
        Returns:
            复杂度评分 (0-1)
        """
        try:
            # 使用LLM分析任务复杂度
            prompt = f"""请分析以下研究任务的复杂度，并给出0-1之间的评分。

任务: {task}

评分标准:
- 0.0-0.3: 简单任务，可以直接回答
- 0.4-0.6: 中等复杂度，需要一些推理
- 0.7-1.0: 复杂任务，需要拆解为多个子任务

请只返回一个数字，不要有其他内容。
"""
            
            messages = [
                {"role": "system", "content": "你是一个任务复杂度分析专家。"},
                {"role": "user", "content": prompt}
            ]
            
            response = await self.llm_service.chat(messages)
            
            # 提取数字
            import re
            match = re.search(r'0\.\d+|1\.0|0|1', response)
            if match:
                complexity = float(match.group())
                return min(max(complexity, 0.0), 1.0)
            
            # 默认返回中等复杂度
            return 0.5
            
        except Exception as e:
            logger.error(f"Failed to analyze complexity: {e}")
            return 0.5
    
    async def _decompose_task(self, task: str) -> List[str]:
        """
        使用LLM拆解任务
        
        Args:
            task: 任务描述
            
        Returns:
            子任务列表
        """
        try:
            prompt = f"""请将以下研究任务拆解为3-5个具体的子任务。

任务: {task}

要求:
1. 每个子任务应该独立且具体
2. 子任务之间有逻辑关系
3. 子任务应该能够通过搜索、分析等方式完成
4. 返回JSON格式的列表

示例格式:
{{
  "subtasks": [
    "子任务1描述",
    "子任务2描述",
    "子任务3描述"
  ]
}}
"""
            
            messages = [
                {"role": "system", "content": "你是一个任务规划专家。"},
                {"role": "user", "content": prompt}
            ]
            
            response = await self.llm_service.chat(messages)
            
            # 解析JSON
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                subtasks = data.get("subtasks", [])
                
                # 限制子任务数量
                return subtasks[:self.max_subtasks]
            
            # 如果解析失败，返回原任务
            return [task]
            
        except Exception as e:
            logger.error(f"Failed to decompose task: {e}")
            return [task]
    
    async def _execute_subtask(
        self,
        subtask: str,
        conversation_id: str
    ) -> str:
        """
        执行子任务
        
        Args:
            subtask: 子任务描述
            conversation_id: 会话ID
            
        Returns:
            执行结果
        """
        try:
            # 使用ReAct模式执行子任务
            result = ""
            async for token in super().chat(
                message=subtask,
                conversation_id=f"{conversation_id}_subtask"
            ):
                result += token
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to execute subtask: {e}")
            return f"执行失败: {str(e)}"
    
    async def _generate_report(
        self,
        task: str,
        results: List[Dict]
    ) -> str:
        """
        生成研究报告
        
        Args:
            task: 原始任务
            results: 子任务结果列表
            
        Returns:
            研究报告（Markdown格式）
        """
        try:
            # 构建结果摘要
            results_summary = "\n\n".join([
                f"### {i}. {r['subtask']}\n\n{r['result']}"
                for i, r in enumerate(results, 1)
            ])
            
            # 使用LLM生成报告
            prompt = f"""请基于以下子任务的研究结果，生成一份完整的研究报告。

原始任务: {task}

子任务结果:
{results_summary}

要求:
1. 报告应该结构清晰，使用Markdown格式
2. 包含执行摘要、详细分析、结论和建议
3. 整合所有子任务的结果
4. 突出关键发现
5. 如果有引用来源，请标注
"""
            
            messages = [
                {"role": "system", "content": "你是一个专业的研究报告撰写专家。"},
                {"role": "user", "content": prompt}
            ]
            
            report = await self.llm_service.chat(messages)
            
            return report
            
        except Exception as e:
            logger.error(f"Failed to generate report: {e}")
            
            # 如果生成失败，返回简单的汇总
            report = f"# 研究报告\n\n## 任务\n\n{task}\n\n## 研究结果\n\n"
            for i, r in enumerate(results, 1):
                report += f"### {i}. {r['subtask']}\n\n{r['result']}\n\n"
            
            return report
