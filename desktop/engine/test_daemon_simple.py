#!/usr/bin/env python3
"""
简单的daemon测试脚本
"""
import subprocess
import json
import time
import sys

def test_daemon():
    """测试daemon基本功能"""
    print("启动daemon...")
    
    proc = subprocess.Popen(
        [sys.executable, 'daemon.py'],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1
    )
    
    try:
        # 等待daemon启动（读取stderr直到看到"Daemon engine started"）
        print("等待daemon启动...")
        start_time = time.time()
        started = False
        
        while time.time() - start_time < 10:
            # 非阻塞读取stderr
            import select
            if select.select([proc.stderr], [], [], 0.1)[0]:
                line = proc.stderr.readline()
                if line:
                    print(f"  {line.strip()}")
                    if "Daemon engine started" in line or "waiting for requests" in line:
                        started = True
                        break
        
        if not started:
            print("✗ Daemon启动超时")
            return False
        
        print("✓ Daemon已启动")
        
        # 发送测试请求
        print("\n发送测试请求...")
        request = {
            "id": "test-001",
            "function": "list_functions",
            "args": {}
        }
        
        request_json = json.dumps(request) + "\n"
        print(f"  请求: {request_json.strip()}")
        
        proc.stdin.write(request_json)
        proc.stdin.flush()
        
        # 等待响应
        print("等待响应...")
        response_line = proc.stdout.readline()
        
        if not response_line:
            print("✗ 没有收到响应")
            return False
        
        print(f"  响应: {response_line.strip()}")
        
        # 解析响应
        try:
            response = json.loads(response_line)
            
            if response.get("success"):
                print("✓ 请求成功")
                print(f"  注册的函数数量: {len(response.get('result', []))}")
                return True
            else:
                print(f"✗ 请求失败: {response.get('error')}")
                return False
                
        except json.JSONDecodeError as e:
            print(f"✗ 响应JSON解析失败: {e}")
            return False
            
    finally:
        # 清理
        print("\n清理...")
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait()
        print("✓ Daemon已停止")


if __name__ == "__main__":
    success = test_daemon()
    sys.exit(0 if success else 1)
