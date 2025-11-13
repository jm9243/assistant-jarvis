#!/bin/bash

# E2E测试运行脚本
# 执行端到端测试、稳定性测试和回归测试

set -e

echo "========================================="
echo "开始执行E2E测试套件"
echo "========================================="

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENGINE_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ENGINE_DIR"

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "错误: 虚拟环境不存在，请先创建虚拟环境"
    echo "运行: python -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# 激活虚拟环境
source venv/bin/activate

# 安装测试依赖
echo "安装测试依赖..."
pip install pytest pytest-asyncio pytest-cov psutil -q

echo ""
echo "========================================="
echo "1. 运行端到端测试 (test_e2e.py)"
echo "========================================="
pytest tests/test_e2e.py -v -s --tb=short

echo ""
echo "========================================="
echo "2. 运行回归测试 (test_regression.py)"
echo "========================================="
pytest tests/test_regression.py -v -s --tb=short

echo ""
echo "========================================="
echo "3. 运行稳定性测试 (快速模式)"
echo "========================================="
echo "注意: 跳过长时间测试 (24小时测试)"
echo "如需运行完整稳定性测试，请使用: pytest tests/test_stability.py -m slow"
pytest tests/test_stability.py -v -s -m "not slow" --tb=short

echo ""
echo "========================================="
echo "测试完成！"
echo "========================================="

# 生成测试报告
echo ""
echo "生成测试覆盖率报告..."
pytest tests/test_e2e.py tests/test_regression.py tests/test_stability.py \
    -m "not slow" \
    --cov=core \
    --cov=models \
    --cov-report=html \
    --cov-report=term \
    -q

echo ""
echo "覆盖率报告已生成到: htmlcov/index.html"
echo ""
echo "========================================="
echo "测试总结"
echo "========================================="
echo "✓ 端到端测试: 完成"
echo "✓ 回归测试: 完成"
echo "✓ 稳定性测试 (快速模式): 完成"
echo ""
echo "如需运行完整稳定性测试 (包括24小时测试):"
echo "  export STABILITY_TEST_DURATION=86400  # 24小时"
echo "  pytest tests/test_stability.py -m slow -v -s"
echo ""
echo "查看覆盖率报告:"
echo "  open htmlcov/index.html"
echo "========================================="
