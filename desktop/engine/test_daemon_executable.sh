#!/bin/bash
# 测试daemon可执行文件

echo "测试 jarvis-engine-daemon 可执行文件..."
echo ""

# 检查文件是否存在
if [ ! -f "dist/jarvis-engine-daemon" ]; then
    echo "错误：可执行文件不存在"
    exit 1
fi

echo "1. 文件信息："
ls -lh dist/jarvis-engine-daemon
echo ""

echo "2. 测试启动（发送list_functions请求）..."

# 创建测试请求
TEST_REQUEST='{"id":"test-001","function":"list_functions","args":{}}'

# 启动daemon并发送请求
echo "$TEST_REQUEST" | dist/jarvis-engine-daemon > /tmp/daemon_test_output.txt 2>&1 &
DAEMON_PID=$!

# 等待2秒
sleep 2

# 终止进程
kill $DAEMON_PID 2>/dev/null
wait $DAEMON_PID 2>/dev/null

echo ""
echo "3. 输出结果："
if [ -f /tmp/daemon_test_output.txt ]; then
    cat /tmp/daemon_test_output.txt
    rm /tmp/daemon_test_output.txt
else
    echo "没有输出文件"
fi

echo ""
echo "测试完成"
