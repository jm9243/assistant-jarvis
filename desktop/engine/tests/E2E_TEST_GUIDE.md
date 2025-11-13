# 端到端测试指南

本文档说明如何运行PC架构重构项目的端到端测试、稳定性测试和回归测试。

## 测试概览

### 测试文件

1. **test_e2e.py** - 端到端功能测试
   - 完整用户工作流测试
   - Agent对话流程测试
   - 知识库使用流程测试
   - 工作流创建和执行流程测试
   - 跨功能集成测试
   - 压力测试场景

2. **test_stability.py** - 稳定性测试
   - 长时间运行测试（24小时）
   - 内存泄漏测试
   - 崩溃率测试（< 0.1%）
   - 资源清理测试

3. **test_regression.py** - 回归测试
   - Agent功能回归测试
   - 知识库功能回归测试
   - 会话管理功能回归测试
   - 工作流功能回归测试
   - 工具服务功能回归测试
   - 集成功能回归测试
   - 错误处理回归测试

## 快速开始

### macOS/Linux

```bash
# 进入engine目录
cd desktop/engine

# 运行所有E2E测试
./tests/run_e2e_tests.sh
```

### Windows

```cmd
REM 进入engine目录
cd desktop\engine

REM 运行所有E2E测试
tests\run_e2e_tests.bat
```

## 详细测试说明

### 1. 端到端测试

端到端测试验证完整的用户场景和工作流。

#### 运行所有E2E测试

```bash
pytest tests/test_e2e.py -v -s
```

#### 运行特定测试类

```bash
# 测试Basic Agent E2E
pytest tests/test_e2e.py::TestBasicAgentE2E -v

# 测试知识库E2E
pytest tests/test_e2e.py::TestKnowledgeBaseE2E -v

# 测试工作流E2E
pytest tests/test_e2e.py::TestWorkflowE2E -v

# 测试完整用户旅程
pytest tests/test_e2e.py::TestCompleteUserJourney -v

# 测试压力场景
pytest tests/test_e2e.py::TestStressScenarios -v
```

#### 运行特定测试方法

```bash
# 测试完整对话流程
pytest tests/test_e2e.py::TestBasicAgentE2E::test_complete_conversation_flow -v

# 测试新用户入门流程
pytest tests/test_e2e.py::TestCompleteUserJourney::test_new_user_onboarding_flow -v
```

### 2. 稳定性测试

稳定性测试验证系统长时间运行的稳定性。

#### 运行快速稳定性测试（跳过24小时测试）

```bash
pytest tests/test_stability.py -v -s -m "not slow"
```

#### 运行完整稳定性测试（包括24小时测试）

```bash
# 设置测试持续时间（秒）
export STABILITY_TEST_DURATION=86400  # 24小时

# 运行长时间测试
pytest tests/test_stability.py -m slow -v -s
```

#### 运行1小时稳定性测试（推荐用于CI）

```bash
export STABILITY_TEST_DURATION=3600  # 1小时
pytest tests/test_stability.py -m slow -v -s
```

#### 运行特定稳定性测试

```bash
# 内存泄漏测试
pytest tests/test_stability.py::TestMemoryLeak -v

# 崩溃率测试
pytest tests/test_stability.py::TestCrashRate -v

# 资源清理测试
pytest tests/test_stability.py::TestResourceCleanup -v
```

### 3. 回归测试

回归测试验证所有功能无退化和破坏性变更。

#### 运行所有回归测试

```bash
pytest tests/test_regression.py -v -s
```

#### 运行特定功能的回归测试

```bash
# Agent功能回归
pytest tests/test_regression.py::TestAgentRegression -v

# 知识库功能回归
pytest tests/test_regression.py::TestKnowledgeBaseRegression -v

# 会话管理功能回归
pytest tests/test_regression.py::TestConversationRegression -v

# 工作流功能回归
pytest tests/test_regression.py::TestWorkflowRegression -v

# 集成功能回归
pytest tests/test_regression.py::TestIntegrationRegression -v

# 错误处理回归
pytest tests/test_regression.py::TestErrorHandlingRegression -v
```

## 测试覆盖率

### 生成覆盖率报告

```bash
# 生成HTML覆盖率报告
pytest tests/test_e2e.py tests/test_regression.py tests/test_stability.py \
    -m "not slow" \
    --cov=core \
    --cov=models \
    --cov-report=html \
    --cov-report=term

# 查看报告
open htmlcov/index.html  # macOS
start htmlcov\index.html  # Windows
```

### 覆盖率目标

- 单元测试覆盖率: > 70%
- 集成测试覆盖率: > 60%
- 核心功能测试覆盖率: 100%

## 性能验收标准

根据需求文档，系统应达到以下性能目标：

- ✅ **GUI调用延迟**: < 5ms
- ✅ **Python启动时间**: < 2s
- ✅ **内存占用**: < 100MB
- ✅ **应用启动时间**: < 3s
- ✅ **并发处理能力**: 10个请求
- ✅ **崩溃率**: < 0.1%

## 持续集成

### CI配置建议

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: |
          cd desktop/engine
          python -m venv venv
          source venv/bin/activate
          pip install -r requirements.txt
          pip install pytest pytest-asyncio pytest-cov psutil
      
      - name: Run E2E tests
        run: |
          cd desktop/engine
          source venv/bin/activate
          pytest tests/test_e2e.py -v
      
      - name: Run regression tests
        run: |
          cd desktop/engine
          source venv/bin/activate
          pytest tests/test_regression.py -v
      
      - name: Run stability tests (quick)
        run: |
          cd desktop/engine
          source venv/bin/activate
          pytest tests/test_stability.py -m "not slow" -v
      
      - name: Generate coverage report
        run: |
          cd desktop/engine
          source venv/bin/activate
          pytest tests/test_e2e.py tests/test_regression.py \
            --cov=core --cov=models \
            --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

## 故障排查

### 常见问题

#### 1. 测试失败：模块导入错误

```bash
# 确保在正确的目录
cd desktop/engine

# 确保虚拟环境已激活
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate.bat  # Windows

# 重新安装依赖
pip install -r requirements.txt
```

#### 2. 测试超时

```bash
# 增加超时时间
pytest tests/test_e2e.py --timeout=300
```

#### 3. 内存不足

```bash
# 减少并发测试数量
pytest tests/test_e2e.py -n 2  # 使用2个进程
```

#### 4. 稳定性测试时间过长

```bash
# 使用较短的测试时间
export STABILITY_TEST_DURATION=1800  # 30分钟
pytest tests/test_stability.py -m slow -v
```

### 查看详细日志

```bash
# 显示详细输出
pytest tests/test_e2e.py -v -s

# 显示失败的详细信息
pytest tests/test_e2e.py -v --tb=long

# 只运行失败的测试
pytest tests/test_e2e.py --lf
```

## 测试最佳实践

### 1. 测试隔离

- 每个测试应该独立运行
- 使用fixtures管理测试数据
- 测试后清理资源

### 2. 测试数据

- 使用临时目录存储测试数据
- 不要依赖外部服务
- 使用Mock隔离外部依赖

### 3. 测试命名

- 使用描述性的测试名称
- 遵循 `test_<功能>_<场景>` 命名规范
- 添加文档字符串说明测试目的

### 4. 测试组织

- 按功能模块组织测试类
- 相关测试放在同一个测试类中
- 使用标记（markers）分类测试

## 参考资料

- [Pytest文档](https://docs.pytest.org/)
- [Pytest-asyncio文档](https://pytest-asyncio.readthedocs.io/)
- [测试最佳实践](https://docs.python-guide.org/writing/tests/)
- [需求文档](../.kiro/specs/pc-architecture-refactor/requirements.md)
- [设计文档](../.kiro/specs/pc-architecture-refactor/design.md)

## 联系方式

如有问题，请联系开发团队或提交Issue。
