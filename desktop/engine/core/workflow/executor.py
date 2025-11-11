"""工作流执行器"""

import asyncio
from typing import Dict, Any, AsyncGenerator, Optional
from datetime import datetime
from loguru import logger

from models import Workflow, ExecutionEvent, Status, Node
from .nodes import NodeRegistry


class ExecutionContext:
    """执行上下文"""

    def __init__(self, workflow: Workflow, params: Dict[str, Any]):
        self.workflow = workflow
        self.params = params
        self.variables: Dict[str, Any] = {**params}
        self.run_id = f"run_{workflow.id}_{int(datetime.now().timestamp())}"
        self.status = Status.PENDING
        self.start_time = datetime.now()
        self.end_time: Optional[datetime] = None
        self.current_node: Optional[Node] = None
        self.is_paused = False
        self.is_cancelled = False

    def set_variable(self, key: str, value: Any):
        """设置变量"""
        self.variables[key] = value

    def get_variable(self, key: str, default: Any = None) -> Any:
        """获取变量"""
        return self.variables.get(key, default)


class WorkflowExecutor:
    """工作流执行器"""

    def __init__(self):
        self.node_registry = NodeRegistry()
        self.active_contexts: Dict[str, ExecutionContext] = {}

    async def execute(
        self, workflow: Workflow, params: Dict[str, Any] = None
    ) -> AsyncGenerator[ExecutionEvent, None]:
        """执行工作流"""
        params = params or {}
        context = ExecutionContext(workflow, params)
        self.active_contexts[context.run_id] = context

        try:
            # 发送开始事件
            yield ExecutionEvent(
                run_id=context.run_id,
                node_id="",
                status=Status.RUNNING,
                log="工作流开始执行",
            )

            context.status = Status.RUNNING

            # 按拓扑排序执行节点
            execution_order = self._topological_sort(workflow)

            for node in execution_order:
                # 检查是否暂停或取消
                while context.is_paused and not context.is_cancelled:
                    await asyncio.sleep(0.1)

                if context.is_cancelled:
                    yield ExecutionEvent(
                        run_id=context.run_id,
                        node_id=node.id,
                        status=Status.CANCELLED,
                        log="工作流已取消",
                    )
                    context.status = Status.CANCELLED
                    break

                # 执行节点
                context.current_node = node

                async for event in self._execute_node(node, context):
                    yield event

                # 如果节点执行失败且策略是停止，则终止工作流
                if event.status == Status.FAILED:
                    error_strategy = node.data.config.get("error_strategy", "stop")
                    if error_strategy == "stop":
                        context.status = Status.FAILED
                        yield ExecutionEvent(
                            run_id=context.run_id,
                            node_id="",
                            status=Status.FAILED,
                            log=f"工作流因节点 {node.data.label} 失败而终止",
                        )
                        break

            # 如果没有被取消或失败，标记为完成
            if context.status == Status.RUNNING:
                context.status = Status.COMPLETED
                yield ExecutionEvent(
                    run_id=context.run_id,
                    node_id="",
                    status=Status.COMPLETED,
                    log="工作流执行完成",
                )

        except Exception as e:
            logger.error(f"工作流执行异常: {e}")
            context.status = Status.FAILED
            yield ExecutionEvent(
                run_id=context.run_id,
                node_id="",
                status=Status.FAILED,
                log=f"工作流执行异常: {str(e)}",
            )

        finally:
            context.end_time = datetime.now()
            # 保持上下文一段时间以供查询
            asyncio.create_task(self._cleanup_context(context.run_id, delay=300))

    async def _execute_node(
        self, node: Node, context: ExecutionContext
    ) -> AsyncGenerator[ExecutionEvent, None]:
        """执行单个节点"""
        try:
            # 发送节点开始事件
            yield ExecutionEvent(
                run_id=context.run_id,
                node_id=node.id,
                status=Status.RUNNING,
                log=f"开始执行节点: {node.data.label}",
            )

            # 获取节点执行器
            executor = self.node_registry.get_executor(node.type)

            if not executor:
                raise ValueError(f"未找到节点类型 {node.type} 的执行器")

            # 执行节点
            result = await executor.execute(node, context)

            # 发送节点完成事件
            yield ExecutionEvent(
                run_id=context.run_id,
                node_id=node.id,
                status=Status.COMPLETED,
                log=f"节点执行完成: {node.data.label}",
                snapshot={"result": result},
            )

        except Exception as e:
            logger.error(f"节点执行失败 {node.id}: {e}")
            yield ExecutionEvent(
                run_id=context.run_id,
                node_id=node.id,
                status=Status.FAILED,
                log=f"节点执行失败: {str(e)}",
            )

    def _topological_sort(self, workflow: Workflow) -> list[Node]:
        """拓扑排序节点"""
        # 构建邻接表
        graph: Dict[str, list[str]] = {node.id: [] for node in workflow.nodes}
        in_degree: Dict[str, int] = {node.id: 0 for node in workflow.nodes}

        for edge in workflow.edges:
            graph[edge.source].append(edge.target)
            in_degree[edge.target] += 1

        # 找到所有入度为0的节点
        queue = [node_id for node_id, degree in in_degree.items() if degree == 0]
        result = []

        while queue:
            node_id = queue.pop(0)
            result.append(node_id)

            for neighbor in graph[node_id]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        # 将节点ID转换为节点对象
        node_map = {node.id: node for node in workflow.nodes}
        return [node_map[node_id] for node_id in result if node_id in node_map]

    async def pause_execution(self, run_id: str):
        """暂停执行"""
        context = self.active_contexts.get(run_id)
        if context:
            context.is_paused = True
            logger.info(f"暂停执行: {run_id}")

    async def resume_execution(self, run_id: str):
        """恢复执行"""
        context = self.active_contexts.get(run_id)
        if context:
            context.is_paused = False
            logger.info(f"恢复执行: {run_id}")

    async def cancel_execution(self, run_id: str):
        """取消执行"""
        context = self.active_contexts.get(run_id)
        if context:
            context.is_cancelled = True
            logger.info(f"取消执行: {run_id}")

    async def _cleanup_context(self, run_id: str, delay: int = 300):
        """清理执行上下文"""
        await asyncio.sleep(delay)
        if run_id in self.active_contexts:
            del self.active_contexts[run_id]
            logger.debug(f"清理执行上下文: {run_id}")
