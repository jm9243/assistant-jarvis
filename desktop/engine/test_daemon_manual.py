#!/usr/bin/env python3
"""
手动测试daemon功能
"""
import subprocess
import json
import time
import sys

def test_daemon():
    """测试daemon基本功能"""
    print("Starting daemon...")
    
    # 启动daemon进程
    process = subprocess.Popen(
        [sys.executable, "daemon.py"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1
    )
    
    try:
        # 等待启动
        print("Waiting for daemon to start...")
        time.sleep(2)
        
        # 检查进程是否还在运行
        if process.poll() is not None:
            print(f"✗ Daemon process died with exit code: {process.returncode}")
            stderr_output = process.stderr.read()
            if stderr_output:
                print(f"stderr: {stderr_output}")
            return False
        
        # 发送测试请求
        request = {
            "id": "test-1",
            "function": "list_functions",
            "args": {}
        }
        
        print(f"Sending request: {request}")
        process.stdin.write(json.dumps(request) + "\n")
        process.stdin.flush()
        
        # 读取响应（带超时）
        print("Waiting for response...")
        import select
        ready = select.select([process.stdout], [], [], 5.0)
        
        if ready[0]:
            response_line = process.stdout.readline()
            
            if response_line and response_line.strip():
                print(f"Response: {response_line}")
                response = json.loads(response_line)
                
                if response["success"]:
                    print("✓ Test passed!")
                    print(f"  Functions: {len(response['result'])}")
                    return True
                else:
                    print(f"✗ Test failed: {response.get('error')}")
                    return False
            else:
                print("✗ Empty response received")
                return False
        else:
            print("✗ Timeout waiting for response")
            # 检查stderr
            stderr_output = process.stderr.read()
            if stderr_output:
                print(f"stderr: {stderr_output[:500]}")
            return False
            
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        process.terminate()
        process.wait(timeout=5)

if __name__ == "__main__":
    success = test_daemon()
    sys.exit(0 if success else 1)
