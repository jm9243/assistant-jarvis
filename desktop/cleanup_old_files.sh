#!/bin/bash

# 清理旧架构文件脚本
# 移除FastAPI相关文件和其他不再需要的旧文件

set -e

echo "========================================="
echo "清理旧架构文件"
echo "========================================="

# 进入desktop目录
cd "$(dirname "$0")"

echo ""
echo "1. 清理旧的FastAPI服务器文件..."
if [ -d "engine/api" ]; then
    echo "  - 移除 engine/api/ 目录"
    rm -rf engine/api/
fi

echo ""
echo "2. 清理旧的main.py (FastAPI入口)..."
if [ -f "engine/main.py" ]; then
    echo "  - 备份 engine/main.py 到 engine/main.py.old"
    mv engine/main.py engine/main.py.old
fi

echo ""
echo "3. 清理旧的build.py..."
if [ -f "engine/build.py" ]; then
    echo "  - 移除 engine/build.py (已被build_daemon.sh替代)"
    rm -f engine/build.py
fi

echo ""
echo "4. 清理旧的spec文件..."
if [ -f "engine/jarvis-engine.spec" ]; then
    echo "  - 移除 engine/jarvis-engine.spec (已被jarvis-engine-daemon.spec替代)"
    rm -f engine/jarvis-engine.spec
fi

echo ""
echo "5. 清理Python缓存..."
echo "  - 移除 __pycache__ 目录"
find engine -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find engine -type f -name "*.pyc" -delete 2>/dev/null || true

echo ""
echo "6. 清理旧的构建产物..."
if [ -d "engine/build" ]; then
    echo "  - 清理 engine/build/ 目录"
    rm -rf engine/build/*
fi

echo ""
echo "7. 清理旧的日志文件..."
if [ -d "logs" ]; then
    echo "  - 清理 logs/ 目录"
    rm -rf logs
fi

echo ""
echo "8. 清理前端旧的构建产物..."
if [ -d "frontend/dist" ]; then
    echo "  - 清理 frontend/dist/ 目录"
    rm -rf frontend/dist
fi

if [ -d "frontend/src-tauri/target" ]; then
    echo "  - 清理 frontend/src-tauri/target/ 目录 (可选，较大)"
    read -p "    是否清理Rust构建缓存? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf frontend/src-tauri/target
    fi
fi

echo ""
echo "========================================="
echo "清理完成！"
echo "========================================="
echo ""
echo "已清理的内容："
echo "  ✓ FastAPI服务器文件 (engine/api/)"
echo "  ✓ 旧的main.py (备份为main.py.old)"
echo "  ✓ 旧的build.py"
echo "  ✓ 旧的spec文件"
echo "  ✓ Python缓存文件"
echo "  ✓ 构建产物"
echo "  ✓ 日志文件"
echo ""
echo "保留的文件："
echo "  - daemon.py (新架构入口)"
echo "  - function_registry.py"
echo "  - build_daemon.sh/bat"
echo "  - jarvis-engine-daemon.spec"
echo ""
echo "下一步："
echo "  1. 运行 'npm start' 测试应用启动"
echo "  2. 运行 'npm run build' 测试完整构建"
echo "  3. 运行 'npm test' 测试所有测试用例"
echo ""
