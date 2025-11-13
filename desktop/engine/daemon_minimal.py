#!/usr/bin/env python3
"""
最小化的daemon测试版本
用于快速验证IPC通信是否正常
"""
import sys
import json
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

print("Minimal daemon starting...", file=sys.stderr)

# 简单的函数注册表
functions = {}

def register(name, func):
    functions[name] = func
    print(f"Registered function: {name}", file=sys.stderr)

def list_functions():
    return list(functions.keys())

# 注册测试函数
register("list_functions", list_functions)

print("Daemon ready, waiting for requests...", file=sys.stderr)

# 主循环
try:
    while True:
        line = sys.stdin.readline()
        if not line:
            break
        
        line = line.strip()
        if not line:
            continue
        
        print(f"Received: {line}", file=sys.stderr)
        
        try:
            request = json.loads(line)
            request_id = request.get("id")
            function_name = request.get("function")
            args = request.get("args", {})
            
            if function_name in functions:
                result = functions[function_name](**args)
                response = {
                    "id": request_id,
                    "success": True,
                    "result": result
                }
            else:
                response = {
                    "id": request_id,
                    "success": False,
                    "error": f"Function not found: {function_name}"
                }
            
            response_json = json.dumps(response)
            print(response_json, flush=True)
            print(f"Sent response: {response_json}", file=sys.stderr)
            
        except Exception as e:
            response = {
                "id": request.get("id", "unknown"),
                "success": False,
                "error": str(e)
            }
            print(json.dumps(response), flush=True)
            print(f"Error: {e}", file=sys.stderr)

except KeyboardInterrupt:
    print("Daemon stopped", file=sys.stderr)
