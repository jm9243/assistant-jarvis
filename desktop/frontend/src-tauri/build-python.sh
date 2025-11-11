#!/bin/bash

# 构建Python引擎为独立可执行文件
# 使用PyInstaller打包Python应用

set -e

echo "🐍 构建Python引擎..."

cd ../../engine

# 检查是否有虚拟环境
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
echo "📦 安装依赖..."
pip install -r requirements.txt
pip install pyinstaller

# 使用PyInstaller打包
echo "📦 使用PyInstaller打包..."
pyinstaller --name jarvis-engine \
    --onefile \
    --hidden-import=uvicorn \
    --hidden-import=fastapi \
    --hidden-import=sqlalchemy \
    --hidden-import=pydantic \
    --add-data "api:api" \
    --add-data "core:core" \
    --add-data "models:models" \
    --add-data "tools:tools" \
    main.py

# 复制到资源目录
echo "📋 复制到资源目录..."
mkdir -p ../frontend/src-tauri/resources/engine
cp dist/jarvis-engine ../frontend/src-tauri/resources/engine/

echo "✅ Python引擎构建完成！"
