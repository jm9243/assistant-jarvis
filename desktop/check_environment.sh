#!/bin/bash

# 环境检查脚本
# 在启动应用前检查所有必要的依赖和配置

set -e

echo "========================================="
echo "环境检查"
echo "========================================="

# 进入desktop目录
cd "$(dirname "$0")"

ERRORS=0
WARNINGS=0

echo ""
echo "1. 检查Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "  ✓ Node.js已安装: $NODE_VERSION"
    
    # 检查版本是否 >= 18
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo "  ⚠ 警告: Node.js版本过低，建议 >= 18.0"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "  ✗ 错误: Node.js未安装"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "2. 检查Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "  ✓ Python已安装: $PYTHON_VERSION"
    
    # 检查版本是否 >= 3.10
    PYTHON_MINOR=$(python3 -c "import sys; print(sys.version_info.minor)")
    if [ "$PYTHON_MINOR" -lt 10 ]; then
        echo "  ⚠ 警告: Python版本过低，建议 >= 3.10"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "  ✗ 错误: Python3未安装"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "3. 检查Rust..."
if command -v cargo &> /dev/null; then
    RUST_VERSION=$(cargo --version)
    echo "  ✓ Rust已安装: $RUST_VERSION"
else
    echo "  ✗ 错误: Rust未安装"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "4. 检查Python虚拟环境..."
if [ -d "engine/venv" ]; then
    echo "  ✓ 虚拟环境已创建: engine/venv"
else
    echo "  ⚠ 警告: 虚拟环境未创建"
    echo "    运行: cd engine && python3 -m venv venv"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "5. 检查Python依赖..."
if [ -d "engine/venv" ]; then
    source engine/venv/bin/activate
    
    # 检查关键依赖
    MISSING_DEPS=()
    
    if ! python3 -c "import loguru" 2>/dev/null; then
        MISSING_DEPS+=("loguru")
    fi
    
    if ! python3 -c "import chromadb" 2>/dev/null; then
        MISSING_DEPS+=("chromadb")
    fi
    
    if ! python3 -c "import pydantic" 2>/dev/null; then
        MISSING_DEPS+=("pydantic")
    fi
    
    if [ ${#MISSING_DEPS[@]} -eq 0 ]; then
        echo "  ✓ 关键Python依赖已安装"
    else
        echo "  ⚠ 警告: 缺少Python依赖: ${MISSING_DEPS[*]}"
        echo "    运行: cd engine && source venv/bin/activate && pip install -r requirements.txt"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    deactivate
else
    echo "  ⊘ 跳过 (虚拟环境未创建)"
fi

echo ""
echo "6. 检查前端依赖..."
if [ -d "frontend/node_modules" ]; then
    echo "  ✓ 前端依赖已安装"
else
    echo "  ⚠ 警告: 前端依赖未安装"
    echo "    运行: cd frontend && npm install"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "7. 检查daemon.py..."
if [ -f "engine/daemon.py" ]; then
    echo "  ✓ daemon.py存在"
else
    echo "  ✗ 错误: daemon.py不存在"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "8. 检查function_registry.py..."
if [ -f "engine/function_registry.py" ]; then
    echo "  ✓ function_registry.py存在"
else
    echo "  ✗ 错误: function_registry.py不存在"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "9. 检查Tauri配置..."
if [ -f "frontend/src-tauri/tauri.conf.json" ]; then
    echo "  ✓ tauri.conf.json存在"
else
    echo "  ✗ 错误: tauri.conf.json不存在"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "10. 检查旧文件..."
OLD_FILES=()

if [ -f "engine/main.py" ]; then
    OLD_FILES+=("engine/main.py")
fi

if [ -d "engine/api" ]; then
    OLD_FILES+=("engine/api/")
fi

if [ ${#OLD_FILES[@]} -eq 0 ]; then
    echo "  ✓ 无旧文件残留"
else
    echo "  ⚠ 警告: 发现旧文件: ${OLD_FILES[*]}"
    echo "    运行: ./cleanup_old_files.sh"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "========================================="
echo "检查完成"
echo "========================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✓ 所有检查通过！"
    echo ""
    echo "可以运行以下命令："
    echo "  npm start          - 启动开发服务器"
    echo "  npm run build      - 构建生产版本"
    echo "  npm test           - 运行测试"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠ 检查完成，有 $WARNINGS 个警告"
    echo ""
    echo "建议修复警告后再继续"
    exit 0
else
    echo "✗ 检查失败，有 $ERRORS 个错误和 $WARNINGS 个警告"
    echo ""
    echo "请修复错误后再继续"
    exit 1
fi
