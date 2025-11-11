#!/bin/bash

# Jarvis Desktop 打包脚本
# 用于打包包含Python引擎的完整应用

set -e

echo "🚀 开始打包 Jarvis Desktop..."

# 1. 清理旧的构建
echo "📦 清理旧构建..."
rm -rf target/release/bundle
rm -rf ../dist

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
mkdir -p $BUNDLE_RESOURCES_DIR

# 复制Python引擎文件
echo "📋 复制Python引擎..."
rsync -av --exclude='venv' \
  --exclude='__pycache__' \
  --exclude='.pytest_cache' \
  --exclude='*.pyc' \
  --exclude='.DS_Store' \
  $PYTHON_ENGINE_DIR/ $BUNDLE_RESOURCES_DIR/engine/

# 复制requirements.txt
cp $PYTHON_ENGINE_DIR/requirements.txt $BUNDLE_RESOURCES_DIR/engine/

# 4. 临时添加 resources 配置到 tauri.conf.json
echo "📝 更新配置文件..."
TAURI_CONF="tauri.conf.json"
TAURI_CONF_BACKUP="tauri.conf.json.backup"

# 备份原配置
cp $TAURI_CONF $TAURI_CONF_BACKUP

# 使用 jq 添加 resources 配置（如果没有 jq，手动添加）
if command -v jq &> /dev/null; then
    jq '.bundle.resources = ["resources/**"]' $TAURI_CONF_BACKUP > $TAURI_CONF
else
    echo "⚠️  未安装 jq，请手动添加 resources 配置"
fi

# 5. 构建Tauri应用
echo "🔨 构建Tauri应用..."
cargo tauri build

# 恢复原配置
mv $TAURI_CONF_BACKUP $TAURI_CONF

echo "✅ 打包完成！"
echo "📦 安装包位置："
echo "  macOS: target/release/bundle/dmg/"
echo "  Windows: target/release/bundle/msi/"
