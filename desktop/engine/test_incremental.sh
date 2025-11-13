#!/bin/bash
# 增量测试 - 逐步添加功能找出阻塞点

set -e

cd "$(dirname "$0")"
source venv/bin/activate

echo "测试1: 只有list_functions"
echo '{"id":"test1","function":"list_functions","args":{}}' | timeout 3 python3 daemon_simple.py 2>&1 | grep -q "success" && echo "✓ 测试1通过" || echo "✗ 测试1失败"

echo ""
echo "测试2: 添加agent functions"
timeout 3 python3 -c "
import sys
from pathlib import Path
sys.path.insert(0, str(Path('.').resolve()))

from function_registry import FunctionRegistry
registry = FunctionRegistry()

print('导入agent functions...', file=sys.stderr)
from core.agent.ipc_functions import agent_chat
print('导入成功', file=sys.stderr)

registry.register('agent_chat', agent_chat, 'test')
print('注册成功', file=sys.stderr)
" 2>&1 && echo "✓ 测试2通过" || echo "✗ 测试2失败"

echo ""
echo "测试3: 添加kb functions"
timeout 3 python3 -c "
import sys
from pathlib import Path
sys.path.insert(0, str(Path('.').resolve()))

from function_registry import FunctionRegistry
registry = FunctionRegistry()

print('导入kb functions...', file=sys.stderr)
from core.service.kb_ipc_functions import kb_search
print('导入成功', file=sys.stderr)

registry.register('kb_search', kb_search, 'test')
print('注册成功', file=sys.stderr)
" 2>&1 && echo "✓ 测试3通过" || echo "✗ 测试3失败"

echo ""
echo "测试4: 添加workflow functions"
timeout 3 python3 -c "
import sys
from pathlib import Path
sys.path.insert(0, str(Path('.').resolve()))

from function_registry import FunctionRegistry
registry = FunctionRegistry()

print('导入workflow functions...', file=sys.stderr)
from core.workflow.ipc_functions import execute_workflow
print('导入成功', file=sys.stderr)

registry.register('execute_workflow', execute_workflow, 'test')
print('注册成功', file=sys.stderr)
" 2>&1 && echo "✓ 测试4通过" || echo "✗ 测试4失败"

echo ""
echo "测试5: 添加recorder functions"
timeout 3 python3 -c "
import sys
from pathlib import Path
sys.path.insert(0, str(Path('.').resolve()))

from function_registry import FunctionRegistry
registry = FunctionRegistry()

print('导入recorder functions...', file=sys.stderr)
from core.recorder.ipc_functions import start_recording
print('导入成功', file=sys.stderr)

registry.register('start_recording', start_recording, 'test')
print('注册成功', file=sys.stderr)
" 2>&1 && echo "✓ 测试5通过" || echo "✗ 测试5失败"

echo ""
echo "所有测试完成"
