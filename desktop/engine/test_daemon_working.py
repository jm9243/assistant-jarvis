#!/usr/bin/env python3
"""
正确的daemon测试 - 使用subprocess和超时
"""
import subprocess
import json
import time
import sys
import signal

def test_daemon_with_timeout():
    """使用超时测试daemon"""
    print("="*60)
    print("测试daemon启动和响应")
    print("="*60)
    
    # 启动daemon进程
    print("\n1. 启动daemon进程...")
    proc = subprocess.Popen(
        [sys.executable, 'daemon.py'],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1  # 行缓冲
    )
    
    try:
        # 等待daemon启动（最多30秒）
        print("2. 等待daemon启动（最多30秒）...")
        start_time = time.time()
        started = False
        
        while time.time() - start_time < 30:
            # 检查进程是否还活着
            if proc.poll() is not None:
                stderr = proc.stderr.read()
                print(f"✗ Daemon进程意外退出")
                print(f"Stderr: {stderr}")
                return False
            
            # 非阻塞读取stderr
            try:
                # 使用select检查是否有数据
                import select
                if select.select([proc.stderr], [], [], 0.1)[0]:
                    line = proc.stderr.readline()
                    if line:
                        print(f"  {line.strip()}")
                        if "waiting for requests" in line.lower() or "daemon engine initialized" in line.lower():
                            started = True
                            break
            except:
                pass
            
            time.sleep(0.1)
        
        if not started:
            print("✗ Daemon启动超时")
            return False
        
        print("✓ Daemon已启动")
        
        # 发送测试请求
        print("\n3. 发送测试请求...")
        request = {
            "id": "test-001",
            "function": "list_functions",
            "args": {}
        }
        request_json = json.dumps(request) + "\n"
        print(f"  请求: {request_json.strip()}")
        
        proc.stdin.write(request_json)
        proc.stdin.flush()
        
        # 等待响应（最多5秒）
        print("4. 等待响应（最多5秒）...")
        start_time = time.time()
        response_received = False
        
        while time.time() - start_time < 5:
            if select.select([proc.stdout], [], [], 0.1)[0]:
                response_line = proc.stdout.readline()
                if response_line:
                    print(f"  响应: {response_line.strip()}")
                    
                    try:
                        response = json.loads(response_line)
                        if response.get("id") == "test-001":
                            response_received = True
                            
                            if response.get("success"):
                                print(f"✓ 请求成功")
                                print(f"  注册的函数: {response.get('result', [])}")
                                return True
                            else:
                                print(f"✗ 请求失败: {response.get('error')}")
                                return False
                    except json.JSONDecodeError as e:
                        print(f"✗ 响应JSON解析失败: {e}")
                        return False
        
        if not response_received:
            print("✗ 响应超时")
            return False
        
    finally:
        # 清理进程
        print("\n5. 清理进程...")
        try:
            proc.terminate()
            proc.wait(timeout=2)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait()
        print("✓ 进程已清理")
    
    return False


if __name__ == "__main__":
    success = test_daemon_with_timeout()
    
    print("\n" + "="*60)
    if success:
        print("✓ 测试通过")
        print("="*60)
        sys.exit(0)
    else:
        print("✗ 测试失败")
        print("="*60)
        sys.exit(1)
