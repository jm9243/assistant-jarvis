#!/bin/bash
###############################################################################
# Jarvis Engine Daemon 打包脚本 (macOS/Linux)
#
# 功能：
# 1. 激活虚拟环境
# 2. 安装/更新PyInstaller
# 3. 清理旧的构建文件
# 4. 使用PyInstaller打包daemon
# 5. 验证打包结果
# 6. 测试可执行文件
#
# 使用方法：
#   ./build_daemon.sh
#
# 环境要求：
#   - Python 3.9+
#   - 虚拟环境已创建（venv目录）
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

print_info "开始构建 Jarvis Engine Daemon..."
print_info "工作目录: $SCRIPT_DIR"

# 1. 检查虚拟环境
print_info "步骤 1/7: 检查虚拟环境..."
if [ ! -d "venv" ]; then
    print_error "虚拟环境不存在！请先创建虚拟环境："
    print_error "  python3 -m venv venv"
    print_error "  source venv/bin/activate"
    print_error "  pip install -r requirements.txt"
    exit 1
fi

# 2. 激活虚拟环境
print_info "步骤 2/7: 激活虚拟环境..."
source venv/bin/activate

# 验证Python版本
PYTHON_VERSION=$(python --version 2>&1 | awk '{print $2}')
print_info "Python版本: $PYTHON_VERSION"

# 3. 安装/更新PyInstaller
print_info "步骤 3/7: 安装/更新 PyInstaller..."
pip install --upgrade pyinstaller

# 4. 清理旧的构建文件
print_info "步骤 4/7: 清理旧的构建文件..."
if [ -d "build" ]; then
    print_info "删除 build 目录..."
    rm -rf build
fi

if [ -d "dist" ]; then
    print_info "删除 dist 目录..."
    rm -rf dist
fi

if [ -f "jarvis-engine-daemon" ]; then
    print_info "删除旧的可执行文件..."
    rm -f jarvis-engine-daemon
fi

print_success "清理完成"

# 5. 执行打包
print_info "步骤 5/7: 开始打包..."
print_info "使用配置文件: jarvis-engine-daemon.spec"

pyinstaller jarvis-engine-daemon.spec

# 6. 验证打包结果
print_info "步骤 6/7: 验证打包结果..."

EXECUTABLE_PATH="dist/jarvis-engine-daemon"

if [ ! -f "$EXECUTABLE_PATH" ]; then
    print_error "打包失败！可执行文件不存在: $EXECUTABLE_PATH"
    exit 1
fi

print_success "可执行文件已生成: $EXECUTABLE_PATH"

# 检查文件大小
FILE_SIZE=$(du -h "$EXECUTABLE_PATH" | cut -f1)
print_info "文件大小: $FILE_SIZE"

# 检查是否超过50MB
FILE_SIZE_MB=$(du -m "$EXECUTABLE_PATH" | cut -f1)
if [ "$FILE_SIZE_MB" -gt 50 ]; then
    print_warning "警告：文件大小超过50MB (${FILE_SIZE_MB}MB)"
    print_warning "建议检查是否包含了不必要的依赖"
else
    print_success "文件大小符合要求 (< 50MB)"
fi

# 设置可执行权限
chmod +x "$EXECUTABLE_PATH"
print_success "已设置可执行权限"

# 7. 测试可执行文件
print_info "步骤 7/7: 测试可执行文件..."
print_info "测试启动（5秒超时）..."

# 创建测试请求
TEST_REQUEST='{"id":"test-001","function":"list_functions","args":{}}'

# 使用timeout命令测试（如果可用）
if command -v timeout &> /dev/null; then
    # 测试启动并发送一个简单请求
    echo "$TEST_REQUEST" | timeout 5s "$EXECUTABLE_PATH" > /tmp/daemon_test_output.txt 2>&1 || true
    
    if [ -f /tmp/daemon_test_output.txt ]; then
        print_info "测试输出："
        cat /tmp/daemon_test_output.txt
        rm -f /tmp/daemon_test_output.txt
    fi
    
    print_success "可执行文件测试完成"
else
    print_warning "timeout命令不可用，跳过启动测试"
fi

# 8. 构建摘要
print_success "========================================="
print_success "构建完成！"
print_success "========================================="
print_info "可执行文件位置: $EXECUTABLE_PATH"
print_info "文件大小: $FILE_SIZE"
print_info ""
print_info "下一步："
print_info "1. 测试可执行文件："
print_info "   echo '{\"id\":\"test\",\"function\":\"list_functions\",\"args\":{}}' | $EXECUTABLE_PATH"
print_info ""
print_info "2. 将可执行文件复制到Tauri资源目录："
print_info "   cp $EXECUTABLE_PATH ../frontend/src-tauri/resources/engine/"
print_info ""
print_info "3. 构建Tauri应用"
print_success "========================================="
