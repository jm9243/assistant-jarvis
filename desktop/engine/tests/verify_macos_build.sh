#!/bin/bash
# macOS打包验证脚本

set -e

echo "========================================="
echo "macOS Build Verification Script"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "Project root: $PROJECT_ROOT"
echo ""

# 1. 检查可执行文件是否存在
echo "1. Checking executable file..."
EXECUTABLE="$PROJECT_ROOT/dist/jarvis-engine-daemon"

if [ ! -f "$EXECUTABLE" ]; then
    echo -e "${RED}✗ Executable not found: $EXECUTABLE${NC}"
    echo "Please run build_daemon.sh first"
    exit 1
fi

echo -e "${GREEN}✓ Executable found${NC}"

# 2. 检查文件权限
echo ""
echo "2. Checking file permissions..."
if [ -x "$EXECUTABLE" ]; then
    echo -e "${GREEN}✓ Executable has execute permission${NC}"
else
    echo -e "${RED}✗ Executable does not have execute permission${NC}"
    exit 1
fi

# 3. 检查文件大小
echo ""
echo "3. Checking file size..."
FILE_SIZE=$(du -h "$EXECUTABLE" | cut -f1)
FILE_SIZE_BYTES=$(stat -f%z "$EXECUTABLE")
FILE_SIZE_MB=$((FILE_SIZE_BYTES / 1024 / 1024))

echo "File size: $FILE_SIZE ($FILE_SIZE_MB MB)"

if [ $FILE_SIZE_MB -gt 100 ]; then
    echo -e "${YELLOW}⚠ Warning: File size exceeds 100MB${NC}"
else
    echo -e "${GREEN}✓ File size is acceptable${NC}"
fi

# 4. 检查依赖库
echo ""
echo "4. Checking dependencies..."
if otool -L "$EXECUTABLE" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Executable is valid Mach-O binary${NC}"
    
    # 检查是否有外部依赖
    EXTERNAL_DEPS=$(otool -L "$EXECUTABLE" | grep -v "$(basename $EXECUTABLE)" | grep -v "/usr/lib" | grep -v "/System/Library" | wc -l)
    
    if [ $EXTERNAL_DEPS -eq 0 ]; then
        echo -e "${GREEN}✓ No external dependencies (fully self-contained)${NC}"
    else
        echo -e "${YELLOW}⚠ Warning: Found $EXTERNAL_DEPS external dependencies${NC}"
        otool -L "$EXECUTABLE" | grep -v "$(basename $EXECUTABLE)" | grep -v "/usr/lib" | grep -v "/System/Library"
    fi
else
    echo -e "${RED}✗ Not a valid Mach-O binary${NC}"
    exit 1
fi

# 5. 测试启动
echo ""
echo "5. Testing startup..."

# 创建临时文件用于测试
TEST_REQUEST='{"id":"test-startup","function":"list_functions","args":{}}'
TEST_OUTPUT=$(mktemp)

# 启动进程并发送测试请求
echo "$TEST_REQUEST" | timeout 5s "$EXECUTABLE" > "$TEST_OUTPUT" 2>&1 || true

# 检查输出
if grep -q '"success":true' "$TEST_OUTPUT"; then
    echo -e "${GREEN}✓ Executable starts and responds correctly${NC}"
    
    # 显示响应
    echo "Response:"
    cat "$TEST_OUTPUT"
else
    echo -e "${RED}✗ Executable failed to start or respond${NC}"
    echo "Output:"
    cat "$TEST_OUTPUT"
    rm "$TEST_OUTPUT"
    exit 1
fi

rm "$TEST_OUTPUT"

# 6. 检查macOS特定功能
echo ""
echo "6. Checking macOS-specific features..."

# 检查是否包含pyobjc相关库
if strings "$EXECUTABLE" | grep -q "AppKit\|Quartz\|Foundation"; then
    echo -e "${GREEN}✓ macOS GUI automation libraries (pyobjc) included${NC}"
else
    echo -e "${YELLOW}⚠ Warning: pyobjc libraries may not be included${NC}"
fi

# 7. 运行pytest测试
echo ""
echo "7. Running pytest tests..."

if command -v pytest &> /dev/null; then
    echo "Running macOS platform tests..."
    
    if pytest "$PROJECT_ROOT/tests/test_macos_platform.py" -v; then
        echo -e "${GREEN}✓ Platform tests passed${NC}"
    else
        echo -e "${RED}✗ Platform tests failed${NC}"
        exit 1
    fi
    
    echo ""
    echo "Running macOS functionality tests..."
    
    if pytest "$PROJECT_ROOT/tests/test_macos_functionality.py" -v; then
        echo -e "${GREEN}✓ Functionality tests passed${NC}"
    else
        echo -e "${RED}✗ Functionality tests failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ pytest not found, skipping tests${NC}"
    echo "Install pytest with: pip install pytest psutil"
fi

# 8. 总结
echo ""
echo "========================================="
echo "Verification Summary"
echo "========================================="
echo -e "${GREEN}✓ All checks passed!${NC}"
echo ""
echo "Build information:"
echo "  - Executable: $EXECUTABLE"
echo "  - Size: $FILE_SIZE ($FILE_SIZE_MB MB)"
echo "  - Platform: macOS"
echo "  - Architecture: $(uname -m)"
echo ""
echo "Next steps:"
echo "  1. Test with Tauri application"
echo "  2. Run full integration tests"
echo "  3. Create DMG installer"
echo ""
