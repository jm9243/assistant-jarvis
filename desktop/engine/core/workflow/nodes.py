"""节点执行器注册表和基类"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Type
from loguru import logger

from models import Node


class NodeExecutor(ABC):
    """节点执行器基类"""

    @abstractmethod
    async def execute(self, node: Node, context: Any) -> Any:
        """执行节点
        
        Args:
            node: 节点定义
            context: 执行上下文
            
        Returns:
            执行结果
        """
        pass

    def validate_config(self, config: Dict[str, Any]) -> bool:
        """验证节点配置
        
        Args:
            config: 节点配置
            
        Returns:
            是否有效
        """
        return True


class NodeRegistry:
    """节点注册表"""

    def __init__(self):
        self._executors: Dict[str, Type[NodeExecutor]] = {}
        self._register_builtin_nodes()

    def _register_builtin_nodes(self):
        """注册内置节点"""
        from .nodes_impl import (
            # UI 自动化节点
            ClickNodeExecutor,
            InputNodeExecutor,
            DragDropNodeExecutor,
            ScrollNodeExecutor,
            HoverNodeExecutor,
            KeyboardNodeExecutor,
            DelayNodeExecutor,
            # 流程控制节点
            VariableNodeExecutor,
            CompareNodeExecutor,
            DataExtractNodeExecutor,
            # 集成节点
            HTTPRequestNodeExecutor,
            SubworkflowNodeExecutor,
            # 文件操作节点
            FileSelectorNodeExecutor,
            FileOperationNodeExecutor,
            # 系统操作节点
            ClipboardNodeExecutor,
            ShellCommandNodeExecutor,
            AppControlNodeExecutor,
        )

        # UI 自动化节点
        self.register("click", ClickNodeExecutor)
        self.register("input", InputNodeExecutor)
        self.register("drag_drop", DragDropNodeExecutor)
        self.register("scroll", ScrollNodeExecutor)
        self.register("hover", HoverNodeExecutor)
        self.register("keyboard", KeyboardNodeExecutor)
        self.register("delay", DelayNodeExecutor)

        # 流程控制节点
        self.register("variable", VariableNodeExecutor)
        self.register("compare", CompareNodeExecutor)
        self.register("data_extract", DataExtractNodeExecutor)

        # 集成节点
        self.register("http_request", HTTPRequestNodeExecutor)
        self.register("subworkflow", SubworkflowNodeExecutor)

        # 文件操作节点
        self.register("file_selector", FileSelectorNodeExecutor)
        self.register("file_operation", FileOperationNodeExecutor)

        # 系统操作节点
        self.register("clipboard", ClipboardNodeExecutor)
        self.register("shell_command", ShellCommandNodeExecutor)
        self.register("app_control", AppControlNodeExecutor)

        logger.info(f"Registered {len(self._executors)} node executors")

    def register(self, node_type: str, executor_class: Type[NodeExecutor]):
        """注册节点执行器
        
        Args:
            node_type: 节点类型
            executor_class: 执行器类
        """
        self._executors[node_type] = executor_class
        logger.debug(f"Registered node executor: {node_type}")

    def get_executor(self, node_type: str) -> NodeExecutor:
        """获取节点执行器
        
        Args:
            node_type: 节点类型
            
        Returns:
            执行器实例
        """
        executor_class = self._executors.get(node_type)
        if not executor_class:
            raise ValueError(f"Unknown node type: {node_type}")
        return executor_class()

    def list_node_types(self) -> list[str]:
        """列出所有已注册的节点类型"""
        return list(self._executors.keys())
