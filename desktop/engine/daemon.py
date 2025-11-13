#!/usr/bin/env python3
"""
Python引擎常驻进程 - 最终版本
使用动态加载避免启动时阻塞
"""
import sys
import json
import signal
from pathlib import Path
from typing import Dict, Any, Tuple

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from logger import get_logger
from function_registry import FunctionRegistry

logger = get_logger("daemon")

# 函数映射表 - 记录函数名、模块路径和函数名
# 格式: 'function_name': ('module.path', 'function_name', 'description')
FUNCTION_MAP: Dict[str, Tuple[str, str, str]] = {
    # Agent对话相关
    'agent_chat': ('core.agent.ipc_functions', 'agent_chat', 'Agent对话功能'),
    'create_conversation': ('core.agent.ipc_functions', 'create_conversation', '创建会话'),
    'get_conversation_history': ('core.agent.ipc_functions', 'get_conversation_history', '获取会话历史'),
    
    # Agent管理相关
    'list_agents': ('core.agent.agent_management_ipc', 'list_agents', '列出所有Agent'),
    'get_agent': ('core.agent.agent_management_ipc', 'get_agent', '获取Agent详情'),
    'create_agent': ('core.agent.agent_management_ipc', 'create_agent', '创建Agent'),
    'update_agent': ('core.agent.agent_management_ipc', 'update_agent', '更新Agent'),
    'delete_agent': ('core.agent.agent_management_ipc', 'delete_agent', '删除Agent'),
    
    # 知识库检索相关
    'kb_search': ('core.service.kb_ipc_functions', 'kb_search', '知识库检索'),
    'kb_add_document': ('core.service.kb_ipc_functions', 'kb_add_document', '添加文档到知识库'),
    'kb_delete_document': ('core.service.kb_ipc_functions', 'kb_delete_document', '从知识库删除文档'),
    'kb_get_stats': ('core.service.kb_ipc_functions', 'kb_get_stats', '获取知识库统计信息'),
    
    # 知识库管理相关
    'list_knowledge_bases': ('core.service.kb_management_ipc', 'list_knowledge_bases', '列出所有知识库'),
    'get_knowledge_base': ('core.service.kb_management_ipc', 'get_knowledge_base', '获取知识库详情'),
    'create_knowledge_base': ('core.service.kb_management_ipc', 'create_knowledge_base', '创建知识库'),
    'update_knowledge_base': ('core.service.kb_management_ipc', 'update_knowledge_base', '更新知识库'),
    'delete_knowledge_base': ('core.service.kb_management_ipc', 'delete_knowledge_base', '删除知识库'),
    'list_documents': ('core.service.kb_management_ipc', 'list_documents', '列出文档'),
    
    # 工具管理相关
    'list_tools': ('core.service.tool_management_ipc', 'list_tools', '列出所有工具'),
    'get_tool': ('core.service.tool_management_ipc', 'get_tool', '获取工具详情'),
    'update_tool': ('core.service.tool_management_ipc', 'update_tool', '更新工具'),
    'call_tool': ('core.service.tool_management_ipc', 'call_tool', '调用工具'),
    
    # GUI自动化相关
    'locate_element': ('tools.gui.ipc_functions', 'locate_element', '定位GUI元素'),
    'click_element': ('tools.gui.ipc_functions', 'click_element', '点击GUI元素'),
    'input_text': ('tools.gui.ipc_functions', 'input_text', '输入文本'),
    'press_key': ('tools.gui.ipc_functions', 'press_key', '按键'),
    
    # 工作流相关
    'execute_workflow': ('core.workflow.ipc_functions', 'execute_workflow', '执行工作流'),
    'pause_workflow': ('core.workflow.ipc_functions', 'pause_workflow', '暂停工作流'),
    'resume_workflow': ('core.workflow.ipc_functions', 'resume_workflow', '恢复工作流'),
    'cancel_workflow': ('core.workflow.ipc_functions', 'cancel_workflow', '取消工作流'),
    
    # 录制器相关
    'start_recording': ('core.recorder.ipc_functions', 'start_recording', '开始录制'),
    'stop_recording': ('core.recorder.ipc_functions', 'stop_recording', '停止录制'),
    'pause_recording': ('core.recorder.ipc_functions', 'pause_recording', '暂停录制'),
    'resume_recording': ('core.recorder.ipc_functions', 'resume_recording', '恢复录制'),
    'get_recording_status': ('core.recorder.ipc_functions', 'get_recording_status', '获取录制状态'),
}

# 缓存已导入的函数
_function_cache: Dict[str, Any] = {}


class DaemonEngine:
    def __init__(self):
        self.running = True
        self.function_registry = FunctionRegistry()
        
        # 配置日志
        log_dir = Path.home() / ".jarvis" / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Logging configured, log directory: {log_dir}")
        
        # 初始化示例数据
        try:
            from core.storage.init_data import init_sample_data
            init_sample_data()
        except Exception as e:
            logger.warning(f"Failed to initialize sample data: {e}")
        
        # 配置信号处理器
        def signal_handler(signum, frame):
            signal_name = signal.Signals(signum).name
            logger.info(f"Received signal {signal_name}, shutting down gracefully...")
            self.running = False
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        # 注册list_functions
        self.function_registry.register(
            "list_functions",
            self._list_functions,
            "列出所有已注册的函数"
        )
        
        logger.info(f"Daemon engine initialized with {len(FUNCTION_MAP) + 1} functions available")
        print(f"Daemon engine initialized", file=sys.stderr, flush=True)
    
    def _list_functions(self) -> Dict[str, Any]:
        """列出所有可用的函数"""
        result = {
            'list_functions': {
                'description': '列出所有已注册的函数',
                'module': 'builtin'
            }
        }
        
        for func_name, (module_path, _, description) in FUNCTION_MAP.items():
            result[func_name] = {
                'description': description,
                'module': module_path
            }
        
        return result
    
    def _load_function(self, function_name: str) -> Any:
        """动态加载函数"""
        # 检查缓存
        if function_name in _function_cache:
            return _function_cache[function_name]
        
        # 检查函数是否存在
        if function_name not in FUNCTION_MAP:
            raise ValueError(f"Unknown function: {function_name}")
        
        # 动态导入
        module_path, func_name, _ = FUNCTION_MAP[function_name]
        logger.debug(f"Loading function {function_name} from {module_path}")
        
        try:
            module = __import__(module_path, fromlist=[func_name])
            func = getattr(module, func_name)
            
            # 缓存函数
            _function_cache[function_name] = func
            logger.debug(f"Function {function_name} loaded successfully")
            
            return func
        except Exception as e:
            logger.error(f"Failed to load function {function_name}: {e}", exc_info=True)
            raise
    
    def start(self):
        """启动主循环"""
        logger.info("Daemon engine started, waiting for requests...")
        print("Daemon engine started, waiting for requests...", file=sys.stderr, flush=True)
        
        try:
            while self.running:
                line = sys.stdin.readline()
                
                if not line:
                    logger.info("stdin closed, exiting...")
                    break
                
                line = line.strip()
                if not line:
                    continue
                
                self._process_request(line)
                
        except KeyboardInterrupt:
            logger.info("Keyboard interrupt received")
        except Exception as e:
            logger.error(f"Unexpected error in main loop: {e}", exc_info=True)
        finally:
            self._cleanup()
    
    def _process_request(self, line: str):
        """处理单个请求"""
        request_id = None
        
        try:
            request = json.loads(line)
            request_id = request.get("id")
            function_name = request.get("function")
            args = request.get("args", {})
            
            logger.debug(f"Processing request {request_id}: {function_name}")
            
            # 特殊处理list_functions
            if function_name == "list_functions":
                result = self._list_functions()
            else:
                # 动态加载并调用函数
                func = self._load_function(function_name)
                result = func(**args)
            
            response = {
                "id": request_id,
                "success": True,
                "result": result
            }
            self._send_response(response)
            
            logger.debug(f"Request {request_id} completed successfully")
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}, line: {line[:100]}")
            self._send_error_response(request_id, f"Invalid JSON: {str(e)}")
        except Exception as e:
            logger.error(f"Error processing request {request_id}: {e}", exc_info=True)
            self._send_error_response(request_id, str(e))
    
    def _send_response(self, response: Dict[str, Any]):
        """发送响应到stdout"""
        try:
            response_json = json.dumps(response, ensure_ascii=False)
            sys.stdout.write(response_json + "\n")
            sys.stdout.flush()
            logger.debug(f"Response sent: {response.get('id')}")
        except Exception as e:
            logger.error(f"Error sending response: {e}", exc_info=True)
    
    def _send_error_response(self, request_id: str, error_message: str):
        """发送错误响应"""
        response = {
            "id": request_id or "unknown",
            "success": False,
            "error": error_message
        }
        self._send_response(response)
    
    def _cleanup(self):
        """清理资源"""
        logger.info("Cleaning up resources...")
        logger.info("Daemon engine stopped")


def main():
    """主入口函数"""
    try:
        engine = DaemonEngine()
        engine.start()
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
