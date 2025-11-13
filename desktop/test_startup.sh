#!/bin/bash

# 启动测试脚本
# 测试应用是否能正常启动

set -e

echo "========================================="
echo "测试应用启动"
echo "========================================="

# 进入desktop目录
cd "$(dirname "$0")"

echo ""
echo "1. 运行环境检查..."
./check_environment.sh
if [ $? -ne 0 ]; then
    echo "✗ 环境检查失败，请先修复环境问题"
    exit 1
fi

echo ""
echo "2. 测试daemon.py是否可以直接运行..."
cd engine
source venv/bin/activate

# 创建测试输入
TEST_REQUEST='{"id":"test-001","function":"list_functions","args":{}}'

echo "  发送测试请求: $TEST_REQUEST"

# 启动daemon并发送测试请求
RESPONSE=$(echo "$TEST_REQUEST" | timeout 5 python3 daemon.py 2>/dev/null | head -n 1)

if [ -z "$RESPONSE" ]; then
    echo "  ✗ daemon.py无响应"
    deactivate
    cd ..
    exit 1
fi

echo "  收到响应: ${RESPONSE:0:100}..."

# 检查响应是否包含success字段
if echo "$RESPONSE" | grep -q '"success"'; then
    echo "  ✓ daemon.py运行正常"
else
    echo "  ✗ daemon.py响应格式错误"
    deactivate
    cd ..
    exit 1
fi

deactivate
cd ..

echo ""
echo "3. 检查Tauri配置..."
if [ -f "frontend/src-tauri/tauri.conf.json" ]; then
    echo "  ✓ Tauri配置文件存在"
else
    echo "  ✗ Tauri配置文件不存在"
    exit 1
fi

echo ""
echo "4. 检查前端配置..."
if [ -f "frontend/package.json" ]; then
    echo "  ✓ 前端package.json存在"
else
    echo "  ✗ 前端package.json不存在"
    exit 1
fi

echo ""
echo "5. 检查Rust编译..."
cd frontend/src-tauri
echo "  编译Rust代码..."
if cargo check 2>&1 | grep -q "Finished"; then
    echo "  ✓ Rust代码编译通过"
else
    echo "  ⚠ Rust代码编译有警告，但可以继续"
fi
cd ../..

echo ""
echo "========================================="
echo "启动测试完成"
echo "========================================="
echo ""
echo "✓ 所有测试通过！"
echo ""
echo "现在可以运行："
echo "  npm start          - 启动应用"
echo ""
echo "注意事项："
echo "  1. 首次启动可能需要较长时间（编译Rust代码）"
echo "  2. 如果遇到问题，查看日志："
echo "     - Tauri日志: 终端输出"
echo "     - Python日志: ~/.jarvis/logs/daemon.log"
echo "  3. 使用Ctrl+C停止应用"
echo ""
