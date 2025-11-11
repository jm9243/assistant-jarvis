#!/bin/bash
# 为开发模式准备 resources 目录
# 复制 engine 文件到 resources 目录

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENGINE_DIR="$SCRIPT_DIR/../../engine"
RESOURCES_ENGINE_DIR="$SCRIPT_DIR/resources/engine"

# 创建 resources 目录
mkdir -p "$SCRIPT_DIR/resources"

# 如果 engine 目录已存在，检查是否需要更新
if [ -d "$RESOURCES_ENGINE_DIR" ]; then
    echo "📋 更新 engine 文件..."
else
    echo "📋 复制 engine 文件..."
fi

# 使用 rsync 复制文件，排除不需要的目录
rsync -a --delete \
    --exclude='venv' \
    --exclude='__pycache__' \
    --exclude='.pytest_cache' \
    --exclude='*.pyc' \
    --exclude='.DS_Store' \
    --exclude='tests' \
    "$ENGINE_DIR/" "$RESOURCES_ENGINE_DIR/"

echo "✅ Resources 准备完成"
