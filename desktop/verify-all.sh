#!/bin/bash

# 完整功能验证脚本

echo "🧪 助手·贾维斯 - 完整功能验证"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 计数器
TOTAL=0
PASSED=0
FAILED=0

# 测试函数
test_feature() {
    local name=$1
    local command=$2
    
    TOTAL=$((TOTAL + 1))
    echo -n "[$TOTAL] 测试 $name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 通过${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ 失败${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# 检查文件存在
check_file() {
    local name=$1
    local file=$2
    
    TOTAL=$((TOTAL + 1))
    echo -n "[$TOTAL] 检查 $name... "
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ 存在${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ 不存在${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo -e "${BLUE}📋 第一部分：文件完整性检查${NC}"
echo "--------------------------------"

# 后端文件
check_file "节点执行器" "engine/core/workflow/nodes_impl.py"
check_file "节点注册表" "engine/core/workflow/nodes.py"
check_file "工作流执行器" "engine/core/workflow/executor.py"
check_file "元素定位器" "engine/tools/gui/locator.py"
check_file "录制服务" "engine/core/recorder/service.py"
check_file "数据库模块" "engine/database.py"
check_file "API 服务器" "engine/api/server.py"

# 前端文件
check_file "工作流设计器" "frontend/src/pages/Workflow/WorkflowDesignerPage.tsx"
check_file "节点库面板" "frontend/src/components/workflow/NodeLibraryPanel.tsx"
check_file "节点配置面板" "frontend/src/components/workflow/NodeInspector.tsx"
check_file "录制器页面" "frontend/src/pages/Recorder/RecorderPanel.tsx"
check_file "执行中心" "frontend/src/pages/Execution/ExecutionCenter.tsx"
check_file "执行控制台" "frontend/src/components/execution/ExecutionConsole.tsx"
check_file "系统监控" "frontend/src/pages/System/SystemMonitorPage.tsx"
check_file "软件扫描" "frontend/src/pages/System/SoftwareScannerPage.tsx"
check_file "指标卡片" "frontend/src/components/system/MetricCard.tsx"

# Tauri 文件
check_file "Tauri 主文件" "frontend/src-tauri/src/lib.rs"
check_file "Tauri 配置" "frontend/src-tauri/Cargo.toml"

echo ""
echo -e "${BLUE}📋 第二部分：后端服务检查${NC}"
echo "--------------------------------"

# 检查后端是否运行
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 后端服务运行中${NC}"
    
    # 测试 API
    test_feature "健康检查 API" "curl -s http://localhost:8000/health | grep -q 'healthy'"
    test_feature "工作流列表 API" "curl -s http://localhost:8000/api/workflow/list | grep -q 'success'"
    test_feature "系统信息 API" "curl -s http://localhost:8000/api/system/info | grep -q 'cpu'"
    test_feature "系统状态 API" "curl -s http://localhost:8000/api/system/status | grep -q 'running'"
    test_feature "录制状态 API" "curl -s http://localhost:8000/api/recorder/status | grep -q 'success'"
    
else
    echo -e "${RED}✗ 后端服务未运行${NC}"
    echo -e "${YELLOW}提示: 请先启动后端服务${NC}"
    echo "  cd engine && source venv/bin/activate && python main.py"
    FAILED=$((FAILED + 5))
    TOTAL=$((TOTAL + 5))
fi

echo ""
echo -e "${BLUE}📋 第三部分：数据库检查${NC}"
echo "--------------------------------"

DB_PATH="$HOME/.jarvis/data/jarvis.db"

if [ -f "$DB_PATH" ]; then
    echo -e "${GREEN}✓ 数据库文件存在${NC}"
    
    # 检查表
    test_feature "workflows 表" "sqlite3 $DB_PATH 'SELECT name FROM sqlite_master WHERE type=\"table\" AND name=\"workflows\"' | grep -q 'workflows'"
    test_feature "executions 表" "sqlite3 $DB_PATH 'SELECT name FROM sqlite_master WHERE type=\"table\" AND name=\"executions\"' | grep -q 'executions'"
    test_feature "logs 表" "sqlite3 $DB_PATH 'SELECT name FROM sqlite_master WHERE type=\"table\" AND name=\"logs\"' | grep -q 'logs'"
    test_feature "recording_steps 表" "sqlite3 $DB_PATH 'SELECT name FROM sqlite_master WHERE type=\"table\" AND name=\"recording_steps\"' | grep -q 'recording_steps'"
    
else
    echo -e "${YELLOW}⚠ 数据库文件不存在（首次运行会自动创建）${NC}"
    TOTAL=$((TOTAL + 4))
fi

echo ""
echo -e "${BLUE}📋 第四部分：依赖检查${NC}"
echo "--------------------------------"

# Python 依赖
test_feature "Python 3" "python3 --version"
test_feature "pip" "pip3 --version"

# Node.js 依赖
test_feature "Node.js" "node --version"
test_feature "npm" "npm --version"

# 系统工具
test_feature "curl" "curl --version"
test_feature "sqlite3" "sqlite3 --version"

echo ""
echo -e "${BLUE}📋 第五部分：文档检查${NC}"
echo "--------------------------------"

check_file "README" "README.md"
check_file "快速启动指南" "QUICK_START.md"
check_file "实现状态" "IMPLEMENTATION_STATUS.md"
check_file "完成总结" "COMPLETION_SUMMARY.md"
check_file "最终实现报告" "FINAL_IMPLEMENTATION.md"
check_file "验证清单" "VERIFICATION_CHECKLIST.md"

echo ""
echo "================================"
echo -e "${BLUE}📊 测试结果统计${NC}"
echo "================================"
echo ""
echo "总测试数: $TOTAL"
echo -e "${GREEN}通过: $PASSED${NC}"
echo -e "${RED}失败: $FAILED${NC}"
echo ""

# 计算通过率
if [ $TOTAL -gt 0 ]; then
    PASS_RATE=$((PASSED * 100 / TOTAL))
    echo "通过率: $PASS_RATE%"
    echo ""
    
    if [ $PASS_RATE -ge 90 ]; then
        echo -e "${GREEN}✅ 优秀！所有核心功能正常${NC}"
    elif [ $PASS_RATE -ge 70 ]; then
        echo -e "${YELLOW}⚠️  良好，但有些功能需要检查${NC}"
    else
        echo -e "${RED}❌ 需要修复多个问题${NC}"
    fi
fi

echo ""
echo "================================"
echo -e "${BLUE}📝 下一步建议${NC}"
echo "================================"
echo ""

if [ $FAILED -gt 0 ]; then
    echo "1. 检查失败的测试项"
    echo "2. 确保后端服务已启动"
    echo "3. 安装缺失的依赖"
    echo "4. 查看日志文件: ~/.jarvis/logs/engine.log"
else
    echo "1. 启动完整应用: ./start-dev.sh"
    echo "2. 访问前端: http://localhost:1420"
    echo "3. 查看 API 文档: http://localhost:8000/docs"
    echo "4. 运行功能测试: ./test-api.sh"
fi

echo ""
echo "================================"
echo "✨ 验证完成！"
echo "================================"
