# Rust层测试文档

本目录包含Rust层的集成测试和性能测试。

## 测试类型

### 1. 单元测试 (Unit Tests)

单元测试位于各个源文件的 `#[cfg(test)]` 模块中：

- `src/python_process.rs` - IPC请求/响应序列化、进程管理器功能测试
- `src/python_state.rs` - 状态管理功能测试
- `src/commands.rs` - Tauri命令参数验证测试

**运行单元测试：**

```bash
cargo test --lib
```

### 2. 集成测试 (Integration Tests)

集成测试位于 `tests/integration_tests.rs`，测试Rust和Python的IPC通信。

**测试内容：**

- IPC基础通信
- 并发请求处理
- 进程崩溃恢复
- 请求超时处理
- 错误处理
- 多次重启

**运行集成测试：**

```bash
cargo test --test integration_tests
```

**注意：** 集成测试需要Python引擎可执行文件。如果引擎不存在，测试会自动跳过。

设置引擎路径：

```bash
export PYTHON_ENGINE_PATH=/path/to/jarvis-engine
cargo test --test integration_tests
```

或者将引擎放在默认路径：`../engine/dist/jarvis-engine`

### 3. 性能测试 (Performance Tests)

性能测试位于 `tests/performance_tests.rs`，验证系统性能指标。

**测试内容：**

- 进程启动成功率（要求：100%）
- 进程启动时间（要求：< 2秒）
- 进程重启时间（要求：< 3秒）
- 并发请求处理（要求：10个并发无阻塞）
- 请求超时处理（要求：30秒超时）
- 内存使用（要求：< 100MB空闲状态）

**运行性能测试：**

```bash
cargo test --test performance_tests
```

**查看详细输出：**

```bash
cargo test --test performance_tests -- --nocapture
```

## 运行所有测试

```bash
# 运行所有测试（单元测试 + 集成测试 + 性能测试）
cargo test

# 运行所有测试并显示输出
cargo test -- --nocapture

# 运行特定测试
cargo test test_ipc_request_serialization

# 运行匹配模式的测试
cargo test ipc
```

## 测试覆盖率

当前测试覆盖：

- **单元测试**: 41个测试
  - IPC请求序列化: 3个测试
  - IPC响应反序列化: 6个测试
  - 进程管理器功能: 6个测试
  - 状态管理功能: 20个测试
  - 其他: 6个测试

- **集成测试**: 6个测试
  - IPC通信测试
  - 并发处理测试
  - 崩溃恢复测试
  - 超时处理测试
  - 错误处理测试
  - 多次重启测试

- **性能测试**: 6个测试
  - 启动成功率测试
  - 启动时间测试
  - 重启时间测试
  - 并发性能测试
  - 超时处理测试
  - 内存使用测试

**总计**: 53个测试

## 持续集成

在CI/CD流程中运行测试：

```bash
# 1. 运行单元测试（不需要Python引擎）
cargo test --lib

# 2. 如果有Python引擎，运行集成测试和性能测试
if [ -f "../engine/dist/jarvis-engine" ]; then
    cargo test --test integration_tests
    cargo test --test performance_tests
fi
```

## 故障排查

### 集成测试被跳过

**原因**: Python引擎可执行文件不存在

**解决方案**:
1. 构建Python引擎：`cd ../engine && ./build_daemon.sh`
2. 设置环境变量：`export PYTHON_ENGINE_PATH=/path/to/jarvis-engine`

### 性能测试失败

**常见原因**:
1. 系统资源不足
2. Python引擎启动慢
3. 并发限制

**解决方案**:
1. 关闭其他占用资源的程序
2. 检查Python引擎日志
3. 调整测试超时时间

### 编译错误

**常见原因**:
1. 依赖版本不匹配
2. 模块可见性问题

**解决方案**:
```bash
# 清理并重新构建
cargo clean
cargo build

# 更新依赖
cargo update
```

## 测试最佳实践

1. **运行测试前先编译**: `cargo build`
2. **使用 `--nocapture` 查看详细输出**: `cargo test -- --nocapture`
3. **运行特定测试以节省时间**: `cargo test test_name`
4. **定期运行所有测试**: 确保代码质量
5. **在提交前运行测试**: 避免破坏性变更

## 性能基准

以下是在标准开发机器上的性能基准（仅供参考）：

- **进程启动时间**: ~500ms
- **进程重启时间**: ~600ms
- **单次IPC调用延迟**: ~5ms
- **10个并发请求总时间**: ~50ms（并发执行）
- **内存占用（空闲）**: ~80MB

实际性能可能因系统配置而异。

## 贡献指南

添加新测试时：

1. **单元测试**: 添加到对应源文件的 `#[cfg(test)]` 模块
2. **集成测试**: 添加到 `tests/integration_tests.rs`
3. **性能测试**: 添加到 `tests/performance_tests.rs`

测试命名规范：

- 单元测试: `test_<功能>_<场景>`
- 集成测试: `test_<功能>_<场景>`
- 性能测试: `test_<指标>_<要求>`

确保所有测试：

- 有清晰的测试目的
- 有适当的断言
- 能独立运行
- 不依赖外部状态
- 执行时间合理（< 5秒）
