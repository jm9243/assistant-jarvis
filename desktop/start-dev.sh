#!/bin/bash

# 助手·贾维斯 开发环境启动脚本

echo "🚀 启动助手·贾维斯开发环境..."
echo ""

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未找到Node.js，请先安装Node.js >= 18.0"
    exit 1
fi

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 未找到Python，请先安装Python >= 3.10"
    exit 1
fi

echo "✅ 环境检查通过"
echo ""

# 启动后端
echo "📦 启动Python后端引擎..."
cd engine

if [ ! -d "venv" ]; then
    echo "创建Python虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1

python main.py &
BACKEND_PID=$!
echo "✅ 后端已启动 (PID: $BACKEND_PID)"

cd ..

# 等待后端启动
echo "⏳ 等待后端服务..."
sleep 3

# 启动前端
echo "📦 启动前端开发服务器..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    npm install
fi

npm run dev &
FRONTEND_PID=$!
echo "✅ 前端已启动 (PID: $FRONTEND_PID)"

cd ..

echo ""
echo "🎉 开发环境启动完成！"
echo ""
echo "📍 前端地址: http://localhost:1420"
echo "📍 后端API: http://localhost:8000"
echo "📍 API文档: http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# 等待用户中断
trap "echo ''; echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT

wait
