# Phase 2 Agent System 测试文档

## 测试概览

本目录包含Phase 2 Agent系统的完整测试套件，包括：

- **单元测试**: 测试单个组件和函数
- **集成测试**: 测试多个组件的协作
- **端到端测试**: 测试完整的用户场景
- **性能测试**: 验证系统性能指标
- **错误处理测试**: 验证错误场景的处理

## 测试文件说明

### test_phase2_integration.py
Phase 2核心功能的集成测试：
- Basic Agent测试
- ReAct Agent测试
- Deep Research Agent测试
- 知识库服务测试
- 工具服务测试
- 记忆系统测试
- 权限检查测试

### test_multimodal.py
多模态输入支持测试：
- 图片输入测试
- 文件上传测试
- 大文件处理测试
- 不支持文件类型测试
- 模型视觉能力检测

### test_e2e.py
端到端功能测试：
- 完整对话流程
- 多模态对话
- 文件上传对话
- 知识库完整工作流
- Agent集成知识库
- ReAct工具调用流程
- 多步推理
- 会话生命周期
- 多会话管理
- 完整用户旅程

### test_performance.py
性能测试：
- LLM首字延迟（目标<2s）
- LLM吞吐量
- LLM缓存性能
- 向量检索延迟（目标<500ms）
- 检索可扩展性
- 批量向量化性能
- 并发Agent性能
- 限流性能
- 内存占用（目标<1GB）
- 内存泄漏检测
- 缓存内存管理
- 应用启动时间（目标<3s）

### test_error_handling.py
错误处理测试：
- API超时
- API限流
- API认证失败
- 重试机制
- 连接错误
- 网络超时
- Backend不可用
- 文档解析错误
- 向量数据库错误
- 工具执行错误
- 用户友好错误消息

### test_security.py
安全功能测试：
- API密钥加密存储
- 数据加密/解密
- 审计日志
- 权限控制

### test_workflow.py
工作流系统测试（Phase 1功能）

## 运行测试

### 安装依赖

```bash
cd desktop/engine
pip install -r requirements.txt
pip install pytest pytest-asyncio pytest-cov
```

### 运行所有测试

```bash
pytest
```

### 运行特定测试文件

```bash
# 运行端到端测试
pytest tests/test_e2e.py

# 运行性能测试
pytest tests/test_performance.py

# 运行错误处理测试
pytest tests/test_error_handling.py
```

### 运行特定标记的测试

```bash
# 只运行性能测试
pytest -m performance

# 只运行集成测试
pytest -m integration

# 只运行端到端测试
pytest -m e2e

# 排除性能测试
pytest -m "not performance"
```

### 运行特定测试类或方法

```bash
# 运行特定测试类
pytest tests/test_e2e.py::TestBasicAgentE2E

# 运行特定测试方法
pytest tests/test_e2e.py::TestBasicAgentE2E::test_complete_conversation_flow
```

### 详细输出

```bash
# 显示详细输出
pytest -v

# 显示print输出
pytest -s

# 组合使用
pytest -v -s
```

### 生成覆盖率报告

```bash
# 生成HTML覆盖率报告
pytest --cov=core --cov=models --cov-report=html

# 查看报告
open htmlcov/index.html
```

### 并行运行测试

```bash
# 安装pytest-xdist
pip install pytest-xdist

# 使用多个CPU核心
pytest -n auto
```

## 测试策略

### 1. 单元测试
- 测试单个函数和类
- 使用Mock隔离依赖
- 快速执行
- 高覆盖率

### 2. 集成测试
- 测试多个组件协作
- 使用真实依赖（或测试替身）
- 验证接口契约
- 中等执行时间

### 3. 端到端测试
- 测试完整用户场景
- 使用真实环境
- 验证业务流程
- 较长执行时间

### 4. 性能测试
- 验证性能指标
- 测试极限情况
- 监控资源使用
- 定期执行

### 5. 错误处理测试
- 测试异常场景
- 验证错误恢复
- 检查错误消息
- 确保系统稳定

## 性能目标

根据requirements.md中的Requirement 17，系统应达到以下性能目标：

- ✅ **LLM首字延迟**: < 2秒
- ✅ **向量检索性能**: < 500毫秒
- ✅ **内存占用**: < 1GB
- ✅ **应用启动时间**: < 3秒
- ✅ **并发处理**: 支持10个并发Agent

## 测试覆盖率目标

- 单元测试覆盖率: > 80%
- 集成测试覆盖率: > 60%
- 核心功能测试覆盖率: 100%

## 持续集成

建议在CI/CD流程中：

1. **每次提交**: 运行单元测试和集成测试
2. **每日构建**: 运行完整测试套件（包括性能测试）
3. **发布前**: 运行端到端测试和性能测试

## 测试数据管理

- 测试数据存储在 `test_data/` 目录
- 每个测试负责清理自己的测试数据
- 使用fixtures管理测试数据生命周期

## 常见问题

### Q: 测试失败怎么办？

A: 
1. 查看详细错误信息：`pytest -v -s`
2. 检查测试日志
3. 验证环境配置
4. 检查依赖版本

### Q: 性能测试不稳定？

A:
1. 性能测试受环境影响较大
2. 多次运行取平均值
3. 在稳定环境中运行
4. 调整性能阈值

### Q: 如何跳过某些测试？

A:
```python
@pytest.mark.skip(reason="暂时跳过")
def test_something():
    pass
```

### Q: 如何只运行失败的测试？

A:
```bash
pytest --lf  # last failed
pytest --ff  # failed first
```

## 贡献指南

添加新测试时：

1. 选择合适的测试文件
2. 使用描述性的测试名称
3. 添加必要的文档字符串
4. 使用适当的标记（@pytest.mark）
5. 清理测试数据
6. 更新本README

## 参考资料

- [Pytest文档](https://docs.pytest.org/)
- [Pytest-asyncio文档](https://pytest-asyncio.readthedocs.io/)
- [测试最佳实践](https://docs.python-guide.org/writing/tests/)
