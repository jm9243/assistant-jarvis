"""
工作流相关的IPC函数
这些函数将被注册到函数注册表，供Rust层通过IPC调用
"""
from typing import Dict, Any, List
from models.workflow import Workflow, Node, Edge
from core.workflow.executor import WorkflowExecutor
from logger import get_logger
import asyncio

logger = get_logger("workflow_ipc")

# 初始化工作流执行器
workflow_executor = WorkflowExecutor()


def execute_workflow(
    workflow_data: Dict[str, Any],
    params: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    执行工作流
    
    Args:
        workflow_data: 工作流数据字典
        params: 执行参数
        
    Returns:
        包含执行结果的字典
    """
    try:
        logger.info(f"Executing workflow: id={workflow_data.get('id')}, name={workflow_data.get('name')}")
        
        # 解析工作流对象
        workflow = _parse_workflow(workflow_data)
        
        # 执行工作流（同步包装异步调用）
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # 收集执行事件
            events = []
            run_id = None
            final_status = None
            
            async def collect_events():
                nonlocal run_id, final_status
                async for event in workflow_executor.execute(workflow, params or {}):
                    if not run_id:
                        run_id = event.run_id
                    
                    events.append({
                        "run_id": event.run_id,
                        "node_id": event.node_id,
                        "status": event.status.value,
                        "log": event.log,
                        "snapshot": event.snapshot,
                        "timestamp": event.timestamp.isoformat() if hasattr(event, 'timestamp') else None
                    })
                    
                    final_status = event.status.value
            
            loop.run_until_complete(collect_events())
            
            logger.info(f"Workflow execution completed: run_id={run_id}, status={final_status}, events={len(events)}")
            
            return {
                "success": True,
                "run_id": run_id,
                "status": final_status,
                "events": events,
                "event_count": len(events)
            }
            
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"Execute workflow error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "events": []
        }


def pause_workflow(run_id: str) -> Dict[str, Any]:
    """
    暂停工作流执行
    
    Args:
        run_id: 执行ID
        
    Returns:
        操作结果字典
    """
    try:
        logger.info(f"Pausing workflow: run_id={run_id}")
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            loop.run_until_complete(workflow_executor.pause_execution(run_id))
            
            logger.info(f"Workflow paused: run_id={run_id}")
            
            return {
                "success": True,
                "run_id": run_id,
                "action": "paused"
            }
            
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"Pause workflow error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "run_id": run_id
        }


def resume_workflow(run_id: str) -> Dict[str, Any]:
    """
    恢复工作流执行
    
    Args:
        run_id: 执行ID
        
    Returns:
        操作结果字典
    """
    try:
        logger.info(f"Resuming workflow: run_id={run_id}")
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            loop.run_until_complete(workflow_executor.resume_execution(run_id))
            
            logger.info(f"Workflow resumed: run_id={run_id}")
            
            return {
                "success": True,
                "run_id": run_id,
                "action": "resumed"
            }
            
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"Resume workflow error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "run_id": run_id
        }


def cancel_workflow(run_id: str) -> Dict[str, Any]:
    """
    取消工作流执行
    
    Args:
        run_id: 执行ID
        
    Returns:
        操作结果字典
    """
    try:
        logger.info(f"Cancelling workflow: run_id={run_id}")
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            loop.run_until_complete(workflow_executor.cancel_execution(run_id))
            
            logger.info(f"Workflow cancelled: run_id={run_id}")
            
            return {
                "success": True,
                "run_id": run_id,
                "action": "cancelled"
            }
            
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"Cancel workflow error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "run_id": run_id
        }


def _parse_workflow(workflow_data: Dict[str, Any]) -> Workflow:
    """
    解析工作流数据字典为Workflow对象
    
    Args:
        workflow_data: 工作流数据字典
        
    Returns:
        Workflow对象
    """
    # 解析节点
    nodes = []
    for node_data in workflow_data.get("nodes", []):
        node = Node(
            id=node_data["id"],
            type=node_data["type"],
            position=node_data.get("position", {"x": 0, "y": 0}),
            data=node_data.get("data", {})
        )
        nodes.append(node)
    
    # 解析边
    edges = []
    for edge_data in workflow_data.get("edges", []):
        edge = Edge(
            id=edge_data["id"],
            source=edge_data["source"],
            target=edge_data["target"],
            sourceHandle=edge_data.get("sourceHandle"),
            targetHandle=edge_data.get("targetHandle")
        )
        edges.append(edge)
    
    # 构建Workflow对象
    workflow = Workflow(
        id=workflow_data["id"],
        user_id=workflow_data.get("user_id", "default_user"),
        name=workflow_data["name"],
        description=workflow_data.get("description", ""),
        nodes=nodes,
        edges=edges,
        variables=workflow_data.get("variables", {}),
        tags=workflow_data.get("tags", [])
    )
    
    return workflow
