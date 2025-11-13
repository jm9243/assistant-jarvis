# Windows平台测试指南

## 概述

本文档提供在Windows平台上测试Python引擎的详细指南。

## 前置条件

### 1. 系统要求

- Windows 10或更高版本
- 64位操作系统
- 至少4GB RAM
- 至少500MB可用磁盘空间

### 2. 软件要求

- Python 3.8或更高版本
- pytest测试框架
- psutil库（用于性能测试）

### 3. 安装依赖

```cmd
# 安装pytest
pip install pytest

# 安装psutil
pip install psutil

# 安装pywinauto（Windows GUI自动化）
pip install pywinauto

# 安装pywin32（可选，用于Windows API）
pip install pywin32
```

## 构建Python引擎

### 1. 准备环境

```cmd
cd desktop\engine

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 安装PyInstaller
pip install pyinstaller
```

### 2. 打包引擎

```cmd
# 运行打包脚本
build_daemon.bat

# 或手动打包
pyinstaller jarvis-engine-daemon.spec
```

### 3. 验证构建

```cmd
# 检查可执行文件
dir dist\jarvis-engine-daemon.exe

# 测试启动（应该显示帮助或错误信息）
dist\jarvis-engine-daemon.exe --help
```

## 运行测试

### 方法1：使用测试脚本（推荐）

```cmd
cd desktop\engine
tests\run_windows_tests.bat
```

### 方法2：手动运行pytest

```cmd
cd desktop\engine

# 运行所有Windows测试
python -m pytest tests\test_windows_platform.py -v

# 运行特定测试
python -m pytest tests\test_windows_platform.py::TestWindowsPlatform::test_platform_is_windows -v

# 运行测试并显示详细输出
python -m pytest tests\test_windows_platform.py -v -s
```

## 测试项目

### 1. 平台检查
- 验证运行在Windows平台
- 检查Windows版本

### 2. 可执行文件检查
- 验证可执行文件存在
- 检查文件大小（应 < 100MB）
- 验证文件可执行

### 3. GUI自动化库检查
- 验证pywinauto可用
- 检查pywin32（可选）

### 4. 依赖库检查
- chromadb
- loguru
- pydantic
- httpx

### 5. 性能测试
- 启动时间（应 < 2秒）
- 内存占用（应 < 100MB）
- IPC响应时间（应 < 5ms）

### 6. 功能测试
- 函数注册表
- IPC通信
- 错误处理

## 预期结果

### 成功标准

所有测试应该通过，包括：

1. ✅ 平台识别为Windows
2. ✅ 可执行文件存在且大小合理
3. ✅ pywinauto库可用
4. ✅ 所有依赖库正确打包
5. ✅ 启动时间 < 2秒
6. ✅ 内存占用 < 100MB

### 常见问题

#### 问题1：找不到可执行文件

**症状**:
```
Engine executable not found: dist\jarvis-engine-daemon.exe
```

**解决方案**:
1. 确认已运行打包脚本
2. 检查dist目录是否存在
3. 重新运行 `build_daemon.bat`

#### 问题2：缺少依赖库

**症状**:
```
ModuleNotFoundError: No module named 'xxx'
```

**解决方案**:
1. 检查requirements.txt
2. 重新安装依赖: `pip install -r requirements.txt`
3. 更新PyInstaller配置中的hiddenimports

#### 问题3：pywinauto不可用

**症状**:
```
ImportError: No module named 'pywinauto'
```

**解决方案**:
```cmd
pip install pywinauto
```

#### 问题4：启动失败

**症状**:
```
Daemon process died with exit code: 1
```

**解决方案**:
1. 检查stderr输出
2. 确认配置文件正确
3. 检查日志文件: `%USERPROFILE%\.jarvis\logs\daemon.log`

## 性能基准

### 目标性能指标

| 指标 | 目标值 | 需求ID |
|------|--------|--------|
| 启动时间 | < 2秒 | 1.2, 8.2 |
| IPC延迟 | < 5ms | 1.5, 8.1 |
| 内存占用 | < 100MB | 1.8, 8.3 |
| 文件大小 | < 50MB | 3.7 |
| 并发请求 | 10个 | 5.5, 8.5 |

### 实际测试结果

测试完成后，请在此记录实际结果：

| 指标 | 实际值 | 状态 | 备注 |
|------|--------|------|------|
| 启动时间 | ___ 秒 | ⏳ | |
| IPC延迟 | ___ ms | ⏳ | |
| 内存占用 | ___ MB | ⏳ | |
| 文件大小 | ___ MB | ⏳ | |
| 并发请求 | ___ 个 | ⏳ | |

## 故障排查

### 日志位置

- **Daemon日志**: `%USERPROFILE%\.jarvis\logs\daemon.log`
- **错误日志**: `%USERPROFILE%\.jarvis\logs\daemon_error.log`
- **测试日志**: `desktop\engine\tests\*.log`

### 调试模式

```cmd
# 启用详细日志
set LOG_LEVEL=DEBUG

# 运行测试
python -m pytest tests\test_windows_platform.py -v -s --log-cli-level=DEBUG
```

### 手动测试

```cmd
# 启动daemon
dist\jarvis-engine-daemon.exe

# 在另一个终端发送测试请求
echo {"id":"test","function":"list_functions","args":{}} | dist\jarvis-engine-daemon.exe
```

## 报告问题

如果遇到问题，请提供以下信息：

1. Windows版本
2. Python版本
3. 错误信息
4. 日志文件内容
5. 测试输出

## 下一步

测试通过后：

1. 记录测试结果
2. 创建测试报告
3. 准备Windows安装包（MSI）
4. 进行用户验收测试

## 参考资料

- [PyInstaller文档](https://pyinstaller.org/)
- [pywinauto文档](https://pywinauto.readthedocs.io/)
- [pytest文档](https://docs.pytest.org/)
- [Windows API文档](https://docs.microsoft.com/en-us/windows/win32/)

---

**文档版本**: v1.0  
**最后更新**: 2024-11-12  
**维护者**: 开发团队
