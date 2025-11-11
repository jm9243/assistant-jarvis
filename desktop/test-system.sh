#!/bin/bash

echo "=========================================="
echo "助手·贾维斯 - 系统测试脚本"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数
PASSED=0
FAILED=0

# 测试函数
test_step() {
    echo -e "${YELLOW}[测试]${NC} $1"
}

test_pass() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((PASSED++))
}

test_fail() {
    echo -e "${RED}[✗]${NC} $1"
    ((FAILED++))
}

# 1. 检查 Node.js
test_step "检查 Node.js 环境"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    test_pass "Node.js 已安装: $NODE_VERSION"
else
    test_fail "Node.js 未安装"
fi

# 2. 检查 Python
test_step "检查 Python 环境"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    test_pass "Python 已安装: $PYTHON_VERSION"
else
    test_fail "Python 未安装"
fi

# 3. 检查 Rust
test_step "检查 Rust 环境"
if command -v cargo &> /dev/null; then
    RUST_VERSION=$(cargo --version)
    test_pass "Rust 已安装: $RUST_VERSION"
else
    test_fail "Rust 未安装"
fi

# 4. 检查前端依赖
test_step "检查前端依赖"
cd frontend
if [ -d "node_modules" ]; then
    test_pass "前端依赖已安装"
else
    test_fail "前端依赖未安装，请运行: npm install"
fi

# 5. 检查 Tauri 配置
test_step "检查 Tauri 配置"
if [ -f "src-tauri/tauri.conf.json" ]; then
    test_pass "Tauri 配置文件存在"
else
    test_fail "Tauri 配置文件不存在"
fi

# 6. TypeScript 编译检查
test_step "TypeScript 编译检查"
if npx tsc --noEmit 2>&1 | grep -q "error"; then
    test_fail "TypeScript 编译有错误"
else
    test_pass "TypeScript 编译通过"
fi

# 7. 前端构建测试
test_step "前端构建测试"
if npm run build > /dev/null 2>&1; then
    test_pass "前端构建成功"
else
    test_fail "前端构建失败"
fi

# 8. Rust 编译检查
test_step "Rust 编译检查"
cd src-tauri
if cargo check > /dev/null 2>&1; then
    test_pass "Rust 编译通过"
else
    test_fail "Rust 编译失败"
fi
cd ..

cd ..

# 9. 检查 Python 后端
test_step "检查 Python 后端"
cd engine
if [ -f "requirements.txt" ]; then
    test_pass "Python requirements.txt 存在"
else
    test_fail "Python requirements.txt 不存在"
fi

# 10. 检查 Python 语法
test_step "检查 Python 语法"
if python3 -m py_compile main.py 2> /dev/null; then
    test_pass "Python 主文件语法正确"
else
    test_fail "Python 主文件语法错误"
fi

cd ..

# 总结
echo ""
echo "=========================================="
echo "测试总结"
echo "=========================================="
echo -e "${GREEN}通过: $PASSED${NC}"
echo -e "${RED}失败: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ 所有测试通过！系统准备就绪。${NC}"
    echo ""
    echo "启动开发环境："
    echo "  1. 启动 Python 后端: cd engine && python3 main.py"
    echo "  2. 启动 Tauri 应用: cd frontend && npm run tauri dev"
    exit 0
else
    echo -e "${RED}✗ 有 $FAILED 个测试失败，请修复后再试。${NC}"
    exit 1
fi
