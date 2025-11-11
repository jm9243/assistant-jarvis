#!/bin/bash

# Jarvis Desktop 完整打包脚本（使用PyInstaller）
# 打包后用户无需安装Python

set -e

echo "🚀 开始打包 Jarvis Desktop (完整版)..."

# 1. 清理旧的构建
echo "📦 清理旧构建..."
rm -rf target/release/bundle
rm -rf ../dist
rm -rf resources

# 2. 构建前端
echo "🎨 构建前端..."
cd ..
npm run build
cd src-tauri

# 3. 使用PyInstaller打包Python引擎
echo "🐍 使用PyInstaller打包Python引擎..."
PYTHON_ENGINE_DIR="../../engine"

cd $PYTHON_ENGINE_DIR

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
echo "📦 安装依赖..."
pip install -q -r requirements.txt
pip install -q pyinstaller

# 使用PyInstaller打包（使用spec文件）
echo "📦 打包引擎为独立可执行文件..."
if [ -f "jarvis-engine.spec" ]; then
    pyinstaller jarvis-engine.spec --clean
else
    pyinstaller \
        --name jarvis-engine \
        --onefile \
        --hidden-import=uvicorn \
        --hidden-import=uvicorn.logging \
        --hidden-import=uvicorn.loops.auto \
        --hidden-import=uvicorn.protocols.http.auto \
        --hidden-import=uvicorn.protocols.websockets.auto \
        --hidden-import=uvicorn.lifespan.on \
        --hidden-import=fastapi \
        --hidden-import=sqlalchemy \
        --hidden-import=pydantic \
        --hidden-import=chromadb \
        --hidden-import=openai \
        --hidden-import=httpx \
        --collect-all uvicorn \
        --collect-all fastapi \
        --collect-all starlette \
        --add-data "api:api" \
        --add-data "core:core" \
        --add-data "models:models" \
        --add-data "tools:tools" \
        --add-data "config.py:." \
        --add-data "logger.py:." \
        --add-data "database.py:." \
        main.py
fi

# 返回src-tauri目录
cd ../frontend/src-tauri

# 创建资源目录
mkdir -p resources/engine

# 复制打包好的引擎
echo "📋 复制引擎可执行文件..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    cp ../../engine/dist/jarvis-engine resources/engine/
    chmod +x resources/engine/jarvis-engine
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    cp ../../engine/dist/jarvis-engine.exe resources/engine/
else
    cp ../../engine/dist/jarvis-engine resources/engine/
    chmod +x resources/engine/jarvis-engine
fi

echo "✅ 引擎打包完成: $(ls -lh resources/engine/)"

# 4. 构建Tauri应用
echo "🔨 构建Tauri应用..."
cargo tauri build

echo ""
echo "✅ 打包完成！"
echo ""
echo "📦 安装包位置："
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "  DMG: target/release/bundle/dmg/"
    echo "  App: target/release/bundle/macos/"
    ls -lh target/release/bundle/dmg/ 2>/dev/null || true
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "  MSI: target/release/bundle/msi/"
    echo "  EXE: target/release/"
else
    echo "  DEB: target/release/bundle/deb/"
    echo "  AppImage: target/release/bundle/appimage/"
fi
echo ""
echo "💡 提示："
echo "  - 打包后的应用包含独立的Python引擎"
echo "  - 用户无需安装Python即可使用"
echo "  - 应用启动时会自动启动引擎"
echo ""
echo "🧪 测试安装包："
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "  open target/release/bundle/dmg/*.dmg"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "  start target/release/bundle/msi/*.msi"
fi
