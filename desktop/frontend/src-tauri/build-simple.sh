#!/bin/bash

# Jarvis Desktop 简化打包脚本
# 直接打包Python源码，运行时使用系统Python

set -e

echo "🚀 开始打包 Jarvis Desktop (简化版)..."

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

# 3. 准备Python引擎
echo "🐍 准备Python引擎..."
PYTHON_ENGINE_DIR="../../engine"
BUNDLE_RESOURCES_DIR="resources"

# 创建资源目录
mkdir -p $BUNDLE_RESOURCES_DIR/engine

# 复制Python引擎文件（排除不必要的文件）
echo "📋 复制Python引擎..."
rsync -av \
  --exclude='venv' \
  --exclude='__pycache__' \
  --exclude='.pytest_cache' \
  --exclude='*.pyc' \
  --exclude='.DS_Store' \
  --exclude='*.log' \
  --exclude='tests' \
  --exclude='docs' \
  $PYTHON_ENGINE_DIR/ $BUNDLE_RESOURCES_DIR/engine/

# 创建启动脚本
echo "📝 创建启动脚本..."
cat > $BUNDLE_RESOURCES_DIR/engine/start.sh << 'EOF'
#!/bin/bash
# Jarvis Engine启动脚本

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到Python 3"
    exit 1
fi

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# 启动引擎
echo "启动Jarvis引擎..."
python3 main.py
EOF

chmod +x $BUNDLE_RESOURCES_DIR/engine/start.sh

# Windows启动脚本
cat > $BUNDLE_RESOURCES_DIR/engine/start.bat << 'EOF'
@echo off
REM Jarvis Engine启动脚本 (Windows)

cd /d %~dp0

REM 检查Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 错误: 未找到Python
    exit /b 1
)

REM 检查虚拟环境
if not exist "venv" (
    echo 创建虚拟环境...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)

REM 启动引擎
echo 启动Jarvis引擎...
python main.py
EOF

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
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "  MSI: target/release/bundle/msi/"
    echo "  EXE: target/release/"
else
    echo "  DEB: target/release/bundle/deb/"
    echo "  AppImage: target/release/bundle/appimage/"
fi
echo ""
echo "💡 提示："
echo "  - 首次运行时会自动安装Python依赖"
echo "  - 确保系统已安装Python 3.10+"
