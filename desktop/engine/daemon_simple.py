#!/usr/bin/env python3
"""
简化版daemon - 只注册基本函数，用于测试
"""
import sys
import json
import signal
from pathlib import Path

project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from logger import get_logger
from function_registry import FunctionRegistry

logger = get_logger("daemon")


class SimpleDaemon:
    def __init__(self):
        self.running = True
        self.function_registry = FunctionRegistry()
        
        # 配置日志
        log_dir = Path.home() / ".jarvis" / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Logging configured")
        
        # 配置信号处理器
        def signal_handler(signum, frame):
            logger.info(f"Received signal {signum}")
            self.running = False
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        # 只注册list_functions
        self.function_registry.register(
            "list_functions",
            self.function_registry.list_functions,
            "列出所有已注册的函数"
        )
        
        logger.info("SimpleDaemon initialized")
        print("SimpleDaemon initialized", file=sys.stderr, flush=True)
    
    def start(self):
        logger.info("SimpleDaemon started, waiting for requests...")
        print("SimpleDaemon started, waiting for requests...", file=sys.stderr, flush=True)
        
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
            logger.error(f"Unexpected error: {e}", exc_info=True)
        finally:
            logger.info("SimpleDaemon stopped")
    
    def _process_request(self, line: str):
        request_id = None
        
        try:
            request = json.loads(line)
            request_id = request.get("id")
            function_name = request.get("function")
            args = request.get("args", {})
            
            logger.debug(f"Processing request {request_id}: {function_name}")
            
            result = self.function_registry.call(function_name, **args)
            
            response = {
                "id": request_id,
                "success": True,
                "result": result
            }
            self._send_response(response)
            
        except Exception as e:
            logger.error(f"Error processing request {request_id}: {e}", exc_info=True)
            self._send_error_response(request_id, str(e))
    
    def _send_response(self, response: dict):
        try:
            response_json = json.dumps(response, ensure_ascii=False)
            sys.stdout.write(response_json + "\n")
            sys.stdout.flush()
            logger.debug(f"Response sent: {response.get('id')}")
        except Exception as e:
            logger.error(f"Error sending response: {e}", exc_info=True)
    
    def _send_error_response(self, request_id: str, error_message: str):
        response = {
            "id": request_id or "unknown",
            "success": False,
            "error": error_message
        }
        self._send_response(response)


def main():
    try:
        daemon = SimpleDaemon()
        daemon.start()
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
