"""
工作流工具自动注册
"""
from typing import Dict, List, Optional
from datetime import datetime
import uuid

from models.knowledge_base import Tool
from core.service.tool import ToolService
from logger import get_logger

logger = get_logger("workflow_tool_registry")


class WorkflowToolRegistry:
    """工作流工具注册器"""
    
    def __init__(self, tool_service: ToolService):
        """
        初始化工作流工具注册器
        
        Args:
            tool_service: 工具服务实例
        """
        self.tool_service = tool_service
        self.workflow_tools: Dict[str, str] = {}  # workflow_id -> tool_id
        logger.info("Initialized WorkflowToolRegistry")
    
    def register_workflow_as_tool(
        self,
        workflow_id: str,
        workflow_name: str,
        workflow_description: str,
        workflow_params: List[Dict],
        approval_required: bool = False,
        allowed_agents: List[str] = None
    ) -> str:
        """
        将工作流注册为工具
        
        Args:
            workflow_id: 工作流ID
            workflow_name: 工作流名称
            workflow_description: 工作流描述
            workflow_params: 工作流参数定义
            approval_required: 是否需要审批
            allowed_agents: 允许使用的Agent列表
            
        Returns:
            工具ID
        """
        try:
            # 生成工具ID
            tool_id = f"workflow_{workflow_id}"
            
            # 构建参数schema
            parameters_schema = self._build_parameters_schema(workflow_params)
            
            # 创建工具定义
            tool = Tool(
                id=tool_id,
                name=workflow_name,
                description=workflow_description,
                type="workflow",
                category="workflow",
                parameters_schema=parameters_schema,
                config={
                    "workflow_id": workflow_id
                },
                approval_policy="required" if approval_required else "auto",
                allowed_agents=allowed_agents or [],
                is_enabled=True,
                created_at=datetime.now()
            )
            
            # 注册工具
            registered_tool_id = self.tool_service.register_tool(tool)
            
            # 记录映射关系
            self.workflow_tools[workflow_id] = registered_tool_id
            
            logger.info(f"Registered workflow {workflow_id} as tool {registered_tool_id}")
            
            return registered_tool_id
            
        except Exception as e:
            logger.error(f"Failed to register workflow {workflow_id} as tool: {e}")
            raise
    
    def unregister_workflow_tool(self, workflow_id: str):
        """
        注销工作流工具
        
        Args:
            workflow_id: 工作流ID
        """
        try:
            if workflow_id in self.workflow_tools:
                tool_id = self.workflow_tools[workflow_id]
                self.tool_service.unregister_tool(tool_id)
                del self.workflow_tools[workflow_id]
                logger.info(f"Unregistered workflow tool for workflow {workflow_id}")
        except Exception as e:
            logger.error(f"Failed to unregister workflow tool: {e}")
            raise
    
    def update_workflow_tool(
        self,
        workflow_id: str,
        workflow_name: str = None,
        workflow_description: str = None,
        workflow_params: List[Dict] = None,
        approval_required: bool = None,
        is_enabled: bool = None
    ):
        """
        更新工作流工具
        
        Args:
            workflow_id: 工作流ID
            workflow_name: 新名称
            workflow_description: 新描述
            workflow_params: 新参数定义
            approval_required: 是否需要审批
            is_enabled: 是否启用
        """
        try:
            if workflow_id not in self.workflow_tools:
                logger.warning(f"Workflow {workflow_id} not registered as tool")
                return
            
            tool_id = self.workflow_tools[workflow_id]
            tool = self.tool_service.get_tool(tool_id)
            
            if not tool:
                logger.warning(f"Tool {tool_id} not found")
                return
            
            # 更新字段
            if workflow_name is not None:
                tool.name = workflow_name
            
            if workflow_description is not None:
                tool.description = workflow_description
            
            if workflow_params is not None:
                tool.parameters_schema = self._build_parameters_schema(workflow_params)
            
            if approval_required is not None:
                tool.approval_policy = "required" if approval_required else "auto"
            
            if is_enabled is not None:
                tool.is_enabled = is_enabled
            
            logger.info(f"Updated workflow tool for workflow {workflow_id}")
            
        except Exception as e:
            logger.error(f"Failed to update workflow tool: {e}")
            raise
    
    def get_workflow_tool_id(self, workflow_id: str) -> Optional[str]:
        """
        获取工作流对应的工具ID
        
        Args:
            workflow_id: 工作流ID
            
        Returns:
            工具ID，如果未注册返回None
        """
        return self.workflow_tools.get(workflow_id)
    
    def is_workflow_registered(self, workflow_id: str) -> bool:
        """
        检查工作流是否已注册为工具
        
        Args:
            workflow_id: 工作流ID
            
        Returns:
            是否已注册
        """
        return workflow_id in self.workflow_tools
    
    def list_workflow_tools(self) -> List[Dict]:
        """
        列出所有工作流工具
        
        Returns:
            工作流工具列表
        """
        workflow_tools = []
        
        for workflow_id, tool_id in self.workflow_tools.items():
            tool = self.tool_service.get_tool(tool_id)
            if tool:
                workflow_tools.append({
                    "workflow_id": workflow_id,
                    "tool_id": tool_id,
                    "name": tool.name,
                    "description": tool.description,
                    "is_enabled": tool.is_enabled,
                    "approval_policy": tool.approval_policy
                })
        
        return workflow_tools
    
    def _build_parameters_schema(self, workflow_params: List[Dict]) -> Dict:
        """
        构建参数schema
        
        Args:
            workflow_params: 工作流参数定义
            
        Returns:
            JSON Schema格式的参数定义
        """
        properties = {}
        required = []
        
        for param in workflow_params:
            param_name = param.get("name")
            param_type = param.get("type", "string")
            param_description = param.get("description", "")
            param_required = param.get("required", False)
            param_default = param.get("default")
            
            # 构建参数定义
            param_schema = {
                "type": param_type,
                "description": param_description
            }
            
            if param_default is not None:
                param_schema["default"] = param_default
            
            # 添加枚举值（如果有）
            if "enum" in param:
                param_schema["enum"] = param["enum"]
            
            properties[param_name] = param_schema
            
            if param_required:
                required.append(param_name)
        
        schema = {
            "type": "object",
            "properties": properties
        }
        
        if required:
            schema["required"] = required
        
        return schema
    
    def auto_register_from_workflow_config(self, workflow_config: Dict) -> str:
        """
        从工作流配置自动注册工具
        
        Args:
            workflow_config: 工作流配置
            
        Returns:
            工具ID
        """
        workflow_id = workflow_config.get("id")
        workflow_name = workflow_config.get("name")
        workflow_description = workflow_config.get("description", "")
        
        # 提取参数定义
        workflow_params = []
        if "inputs" in workflow_config:
            for input_config in workflow_config["inputs"]:
                workflow_params.append({
                    "name": input_config.get("name"),
                    "type": input_config.get("type", "string"),
                    "description": input_config.get("description", ""),
                    "required": input_config.get("required", False),
                    "default": input_config.get("default")
                })
        
        # 检查是否需要审批
        approval_required = workflow_config.get("require_approval", False)
        
        # 允许的Agent列表
        allowed_agents = workflow_config.get("allowed_agents", [])
        
        return self.register_workflow_as_tool(
            workflow_id=workflow_id,
            workflow_name=workflow_name,
            workflow_description=workflow_description,
            workflow_params=workflow_params,
            approval_required=approval_required,
            allowed_agents=allowed_agents
        )


# 全局工作流工具注册器实例
_workflow_tool_registry: Optional[WorkflowToolRegistry] = None


def get_workflow_tool_registry(tool_service: ToolService = None) -> WorkflowToolRegistry:
    """
    获取全局工作流工具注册器实例
    
    Args:
        tool_service: 工具服务实例（首次调用时需要提供）
        
    Returns:
        WorkflowToolRegistry实例
    """
    global _workflow_tool_registry
    
    if _workflow_tool_registry is None:
        if tool_service is None:
            from core.service.tool import ToolService
            tool_service = ToolService()
        _workflow_tool_registry = WorkflowToolRegistry(tool_service)
    
    return _workflow_tool_registry
