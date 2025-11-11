#!/bin/bash
# Phase 2 Agent System 测试运行脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查pytest是否安装
check_pytest() {
    if ! command -v pytest &> /dev/null; then
        print_error "pytest未安装"
        print_info "正在安装pytest..."
        pip install pytest pytest-asyncio pytest-cov
    fi
}

# 显示帮助信息
show_help() {
    echo "Phase 2 Agent System 测试运行脚本"
    echo ""
    echo "用法: ./run_tests.sh [选项]"
    echo ""
    echo "选项:"
    echo "  all              运行所有测试（默认）"
    echo "  unit             运行单元测试"
    echo "  integration      运行集成测试"
    echo "  e2e              运行端到端测试"
    echo "  performance      运行性能测试"
    echo "  error            运行错误处理测试"
    echo "  security         运行安全测试"
    echo "  coverage         运行测试并生成覆盖率报告"
    echo "  quick            快速测试（排除性能测试）"
    echo "  help             显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  ./run_tests.sh                 # 运行所有测试"
    echo "  ./run_tests.sh e2e             # 只运行端到端测试"
    echo "  ./run_tests.sh coverage        # 生成覆盖率报告"
}

# 运行所有测试
run_all_tests() {
    print_info "运行所有测试..."
    pytest tests/ -v
}

# 运行单元测试
run_unit_tests() {
    print_info "运行单元测试..."
    pytest tests/ -v -m "not integration and not e2e and not performance"
}

# 运行集成测试
run_integration_tests() {
    print_info "运行集成测试..."
    pytest tests/test_phase2_integration.py tests/test_multimodal.py -v
}

# 运行端到端测试
run_e2e_tests() {
    print_info "运行端到端测试..."
    pytest tests/test_e2e.py -v -s
}

# 运行性能测试
run_performance_tests() {
    print_info "运行性能测试..."
    print_warning "性能测试可能需要较长时间..."
    pytest tests/test_performance.py -v -s -m performance
}

# 运行错误处理测试
run_error_tests() {
    print_info "运行错误处理测试..."
    pytest tests/test_error_handling.py -v -s
}

# 运行安全测试
run_security_tests() {
    print_info "运行安全测试..."
    pytest tests/test_security.py -v
}

# 运行测试并生成覆盖率报告
run_with_coverage() {
    print_info "运行测试并生成覆盖率报告..."
    pytest tests/ \
        --cov=core \
        --cov=models \
        --cov=api \
        --cov-report=html \
        --cov-report=term \
        -v
    
    print_success "覆盖率报告已生成"
    print_info "HTML报告位置: htmlcov/index.html"
    
    # 尝试打开报告
    if command -v open &> /dev/null; then
        open htmlcov/index.html
    elif command -v xdg-open &> /dev/null; then
        xdg-open htmlcov/index.html
    fi
}

# 快速测试（排除性能测试）
run_quick_tests() {
    print_info "运行快速测试（排除性能测试）..."
    pytest tests/ -v -m "not performance"
}

# 主函数
main() {
    # 检查pytest
    check_pytest
    
    # 切换到engine目录
    cd "$(dirname "$0")"
    
    # 解析参数
    case "${1:-all}" in
        all)
            run_all_tests
            ;;
        unit)
            run_unit_tests
            ;;
        integration)
            run_integration_tests
            ;;
        e2e)
            run_e2e_tests
            ;;
        performance)
            run_performance_tests
            ;;
        error)
            run_error_tests
            ;;
        security)
            run_security_tests
            ;;
        coverage)
            run_with_coverage
            ;;
        quick)
            run_quick_tests
            ;;
        help|--help|-h)
            show_help
            exit 0
            ;;
        *)
            print_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
    
    # 检查测试结果
    if [ $? -eq 0 ]; then
        print_success "所有测试通过！✅"
        exit 0
    else
        print_error "部分测试失败 ❌"
        exit 1
    fi
}

# 运行主函数
main "$@"
