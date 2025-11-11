"""
工具服务
"""
from typing import Dict, List, Any, Optional
from datetime import datetime
import uuid
import asyncio

from models.knowledge_base import Tool, ToolCall
from core.storage.backend import BackendClient
from logger import get_logger

logger = get_logger("tool")


class ToolPermissionChecker:
    """工具权限检查器"""
    
    def __init__(self):
        """初始化权限检查器"""
        self.approval_requests: Dict[str, Dict] = {}
        logger.info("Initialized ToolPermissionChecker")
    
    async def check_permission(
        self,
        tool: Tool,
        agent_id: str
    ) -> bool:
        """
        检查Agent是否有权限调用工具
        
        Args:
            tool: 工具定义
            agent_id: Agent ID
            
        Returns:
            是否有权限
        """
        # 检查工具是否启用
        if not tool.is_enabled:
            logger.warning(f"Tool {tool.id} is disabled")
            return False
        
        # 检查Agent白名单
        if tool.allowed_agents and agent_id not in tool.allowed_agents:
            logger.warning(f"Agent {agent_id} not in allowed list for tool {tool.id}")
            return False
        
        return True
    
    def requires_approval(self, tool: Tool) -> bool:
        """
        检查是否需要用户审批
        
        Args:
            tool: 工具定义
            
        Returns:
            是否需要审批
        """
        return tool.approval_policy == "required"
    
    async def request_approval(
        self,
        tool: Tool,
        params: Dict,
        agent_id: str,
        conversation_id: str
    ) -> str:
        """
        请求用户审批
        
        Args:
            tool: 工具定义
            params: 工具参数
            agent_id: Agent ID
            conversation_id: 会话ID
            
        Returns:
            审批请求ID
        """
        request_id = str(uuid.uuid4())
        
        self.approval_requests[request_id] = {
            "id": request_id,
            "tool_id": tool.id,
            "tool_name": tool.name,
            "params": params,
            "agent_id": agent_id,
            "conversation_id": conversation_id,
            "status": "pending",
            "created_at": datetime.now(),
            "approved_at": None,
            "rejected_at": None
        }
        
        logger.info(f"Created approval request {request_id} for tool {tool.id}")
        return request_id
    
    async def approve(self, request_id: str) -> bool:
        """
        批准工具调用
        
        Args:
            request_id: 审批请求ID
            
        Returns:
            是否成功
        """
        if request_id not in self.approval_requests:
            return False
        
        request = self.approval_requests[request_id]
        request["status"] = "approved"
        request["approved_at"] = datetime.now()
        
        logger.info(f"Approved tool call request {request_id}")
        return True
    
    async def reject(self, request_id: str, reason: str = None) -> bool:
        """
        拒绝工具调用
        
        Args:
            request_id: 审批请求ID
            reason: 拒绝原因
            
        Returns:
            是否成功
        """
        if request_id not in self.approval_requests:
            return False
        
        request = self.approval_requests[request_id]
        request["status"] = "rejected"
        request["rejected_at"] = datetime.now()
        request["reject_reason"] = reason
        
        logger.info(f"Rejected tool call request {request_id}: {reason}")
        return True
    
    def get_approval_request(self, request_id: str) -> Optional[Dict]:
        """
        获取审批请求
        
        Args:
            request_id: 审批请求ID
            
        Returns:
            审批请求信息
        """
        return self.approval_requests.get(request_id)
    
    def list_pending_approvals(
        self,
        agent_id: str = None,
        conversation_id: str = None
    ) -> List[Dict]:
        """
        列出待审批的请求
        
        Args:
            agent_id: Agent ID
            conversation_id: 会话ID
            
        Returns:
            待审批请求列表
        """
        requests = [
            r for r in self.approval_requests.values()
            if r["status"] == "pending"
        ]
        
        if agent_id:
            requests = [r for r in requests if r["agent_id"] == agent_id]
        
        if conversation_id:
            requests = [r for r in requests if r["conversation_id"] == conversation_id]
        
        return requests


class ToolService:
    """工具服务"""
    
    def __init__(self):
        """初始化工具服务"""
        self.tools: Dict[str, Tool] = {}
        self.tool_calls: Dict[str, ToolCall] = {}
        self.permission_checker = ToolPermissionChecker()
        logger.info("Initialized ToolService")
    
    def register_tool(self, tool: Tool) -> str:
        """
        注册工具
        
        Args:
            tool: 工具定义
            
        Returns:
            工具ID
        """
        self.tools[tool.id] = tool
        logger.info(f"Registered tool {tool.id}: {tool.name}")
        return tool.id
    
    def unregister_tool(self, tool_id: str):
        """
        注销工具
        
        Args:
            tool_id: 工具ID
        """
        if tool_id in self.tools:
            del self.tools[tool_id]
            logger.info(f"Unregistered tool {tool_id}")
    
    def get_tool(self, tool_id: str) -> Optional[Tool]:
        """
        获取工具
        
        Args:
            tool_id: 工具ID
            
        Returns:
            工具定义
        """
        return self.tools.get(tool_id)
    
    def list_tools(
        self,
        agent_id: str = None,
        category: str = None,
        enabled_only: bool = True
    ) -> List[Tool]:
        """
        列出可用工具
        
        Args:
            agent_id: Agent ID（过滤该Agent可用的工具）
            category: 工具分类
            enabled_only: 只返回启用的工具
            
        Returns:
            工具列表
        """
        tools = list(self.tools.values())
        
        # 过滤
        if enabled_only:
            tools = [t for t in tools if t.is_enabled]
        
        if agent_id:
            tools = [
                t for t in tools
                if not t.allowed_agents or agent_id in t.allowed_agents
            ]
        
        if category:
            tools = [t for t in tools if t.category == category]
        
        logger.debug(f"Listed {len(tools)} tools")
        return tools
    
    async def execute(
        self,
        tool_id: str,
        params: Dict[str, Any],
        agent_id: str = None,
        conversation_id: str = None,
        approval_request_id: str = None
    ) -> Any:
        """
        执行工具
        
        Args:
            tool_id: 工具ID
            params: 工具参数
            agent_id: Agent ID
            conversation_id: 会话ID
            approval_request_id: 审批请求ID（如果需要审批）
            
        Returns:
            执行结果
        """
        tool = self.get_tool(tool_id)
        if not tool:
            raise ValueError(f"Tool {tool_id} not found")
        
        # 检查权限
        if agent_id and not await self.permission_checker.check_permission(tool, agent_id):
            raise PermissionError(f"Agent {agent_id} does not have permission to use tool {tool_id}")
        
        # 检查是否需要审批
        if self.permission_checker.requires_approval(tool):
            if not approval_request_id:
                raise ValueError(f"Tool {tool_id} requires approval but no approval_request_id provided")
            
            approval_request = self.permission_checker.get_approval_request(approval_request_id)
            if not approval_request or approval_request["status"] != "approved":
                raise PermissionError(f"Tool {tool_id} execution not approved")
        
        # 创建工具调用记录
        call_id = str(uuid.uuid4())
        tool_call = ToolCall(
            id=call_id,
            tool_id=tool_id,
            agent_id=agent_id or "unknown",
            conversation_id=conversation_id or "unknown",
            input_params=params,
            output_result=None,
            status="executing",
            execution_time_ms=None,
            created_at=datetime.now(),
            completed_at=None
        )
        self.tool_calls[call_id] = tool_call
        
        try:
            start_time = datetime.now()
            
            # 根据工具类型执行
            if tool.type == "workflow":
                result = await self._execute_workflow(tool, params)
            elif tool.type == "http":
                result = await self._execute_http(tool, params)
            elif tool.type == "builtin":
                result = await self._execute_builtin(tool, params)
            elif tool.type == "system":
                result = await self._execute_system(tool, params)
            else:
                raise ValueError(f"Unsupported tool type: {tool.type}")
            
            # 更新调用记录
            end_time = datetime.now()
            execution_time = int((end_time - start_time).total_seconds() * 1000)
            
            tool_call.output_result = result
            tool_call.status = "completed"
            tool_call.execution_time_ms = execution_time
            tool_call.completed_at = end_time
            
            logger.info(f"Tool {tool_id} executed successfully in {execution_time}ms")
            return result
            
        except Exception as e:
            tool_call.status = "failed"
            tool_call.output_result = {"error": str(e)}
            tool_call.completed_at = datetime.now()
            
            logger.error(f"Tool {tool_id} execution failed: {e}")
            raise
    
    async def _execute_workflow(self, tool: Tool, params: Dict) -> Any:
        """
        执行工作流工具
        
        Args:
            tool: 工具定义
            params: 参数
            
        Returns:
            执行结果
        """
        # TODO: 集成工作流执行器
        workflow_id = tool.config.get("workflow_id")
        logger.info(f"Executing workflow {workflow_id} with params: {params}")
        
        # 这里应该调用工作流执行器
        # from core.workflow.executor import WorkflowExecutor
        # executor = WorkflowExecutor()
        # result = await executor.execute(workflow_id, params)
        
        # 临时返回模拟结果
        return {
            "status": "success",
            "workflow_id": workflow_id,
            "message": "Workflow executed (simulated)"
        }
    
    async def _execute_http(self, tool: Tool, params: Dict) -> Any:
        """
        执行HTTP工具
        
        Args:
            tool: 工具定义
            params: 参数
            
        Returns:
            执行结果
        """
        import httpx
        
        method = tool.config.get("method", "GET")
        url = tool.config.get("url")
        headers = tool.config.get("headers", {})
        
        async with httpx.AsyncClient() as client:
            if method == "GET":
                response = await client.get(url, params=params, headers=headers)
            elif method == "POST":
                response = await client.post(url, json=params, headers=headers)
            elif method == "PUT":
                response = await client.put(url, json=params, headers=headers)
            elif method == "DELETE":
                response = await client.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            return response.json()
    
    async def _execute_builtin(self, tool: Tool, params: Dict) -> Any:
        """
        执行内置工具
        
        Args:
            tool: 工具定义
            params: 参数
            
        Returns:
            执行结果
        """
        function_name = tool.config.get("function")
        
        # 内置工具函数映射
        builtin_functions = {
            "calculator": self._builtin_calculator,
            "datetime": self._builtin_datetime,
            "search": self._builtin_search,
        }
        
        if function_name not in builtin_functions:
            raise ValueError(f"Unknown builtin function: {function_name}")
        
        return await builtin_functions[function_name](params)
    
    async def _execute_system(self, tool: Tool, params: Dict) -> Any:
        """
        执行系统工具
        
        Args:
            tool: 工具定义
            params: 参数
            
        Returns:
            执行结果
        """
        command = tool.config.get("command")
        logger.warning(f"Executing system command: {command}")
        
        # 系统工具需要特别小心，应该有严格的权限控制
        # 这里只是示例，实际应该有更严格的安全检查
        import subprocess
        
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode
        }
    
    # 内置工具函数
    
    async def _builtin_calculator(self, params: Dict) -> Any:
        """计算器工具"""
        expression = params.get("expression")
        try:
            # 安全的数学表达式求值
            import ast
            import operator
            
            operators = {
                ast.Add: operator.add,
                ast.Sub: operator.sub,
                ast.Mult: operator.mul,
                ast.Div: operator.truediv,
                ast.Pow: operator.pow,
            }
            
            def eval_expr(node):
                if isinstance(node, ast.Num):
                    return node.n
                elif isinstance(node, ast.BinOp):
                    return operators[type(node.op)](
                        eval_expr(node.left),
                        eval_expr(node.right)
                    )
                else:
                    raise ValueError("Unsupported operation")
            
            tree = ast.parse(expression, mode='eval')
            result = eval_expr(tree.body)
            
            return {"result": result}
        except Exception as e:
            return {"error": str(e)}
    
    async def _builtin_datetime(self, params: Dict) -> Any:
        """日期时间工具"""
        from datetime import datetime
        
        action = params.get("action", "now")
        
        if action == "now":
            return {"datetime": datetime.now().isoformat()}
        elif action == "format":
            dt = datetime.fromisoformat(params.get("datetime"))
            format_str = params.get("format", "%Y-%m-%d %H:%M:%S")
            return {"formatted": dt.strftime(format_str)}
        else:
            return {"error": f"Unknown action: {action}"}
    
    async def _builtin_search(self, params: Dict) -> Any:
        """搜索工具（示例）"""
        query = params.get("query")
        # 这里应该集成真实的搜索API
        return {
            "query": query,
            "results": [
                {"title": "Example Result", "url": "https://example.com"}
            ]
        }
    
    def get_tool_call(self, call_id: str) -> Optional[ToolCall]:
        """
        获取工具调用记录
        
        Args:
            call_id: 调用ID
            
        Returns:
            调用记录
        """
        return self.tool_calls.get(call_id)
    
    def list_tool_calls(
        self,
        agent_id: str = None,
        status: str = None,
        limit: int = 100
    ) -> List[ToolCall]:
        """
        列出工具调用记录
        
        Args:
            agent_id: Agent ID
            status: 状态过滤
            limit: 返回数量
            
        Returns:
            调用记录列表
        """
        calls = list(self.tool_calls.values())
        
        if agent_id:
            calls = [c for c in calls if c.agent_id == agent_id]
        
        if status:
            calls = [c for c in calls if c.status == status]
        
        # 按时间倒序
        calls.sort(key=lambda x: x.created_at, reverse=True)
        
        return calls[:limit]
