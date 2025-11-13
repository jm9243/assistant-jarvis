# 开发指南

## 概述

本文档提供PC端应用的开发环境配置、构建流程、调试方法和开发最佳实践。

## 环境要求

### 系统要求

- **macOS**: 10.15+
- **Windows**: 10/11
- **Linux**: Ubuntu 20.04+ (未测试)

### 开发工具

1. **Node.js**: 18.0+
2. **Rust**: 1.70+
3. **Python**: 3.10+
4. **Git**: 2.30+

### IDE推荐

- **前端**: VS Code + React插件
- **Rust**: VS Code + rust-analyzer
- **Python**: VS Code + Python插件

## 环境配置

### 1. 安装Node.js

```bash
# macOS (使用Homebrew)
brew install node

# Windows (使用Chocolatey)
choco install nodejs

# 或从官网下载
# https://nodejs.org/
```

### 2. 安装Rust

```bash
# macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Windows
# 从官网下载安装器
# https://rustup.rs/
```

### 3. 安装Python

```bash
# macOS (使用Homebrew)
brew install python@3.10

# Windows (使用Chocolatey)
choco install python --version=3.10

# 或从官网下载
# https://www.python.org/
```

### 4. 克隆仓库

```bash
git clone https://github.com/your-org/assistant-jarvis.git
cd assistant-jarvis
```

## 项目结构

```
assistant-jarvis/
├── desktop/
│   ├── engine/                 # Python引擎
│   │   ├── core/              # 核心模块
│   │   ├── models/            # 数据模型
│   │   ├── tools/             # 工具函数
│   │   ├── daemon.py          # 主程序
│   │   ├── function_registry.py
│   │   ├── requirements.txt
│   │   └── build_daemon.sh
│   │
│   ├── frontend/              # 前端应用
│   │   ├── src/              # 源代码
│   │   │   ├── components/   # React组件
│   │   │   ├── services/     # 服务层
│   │   │   ├── pages/        # 页面
│   │   │   └── App.tsx
│   │   │
│   │   ├── src-tauri/        # Tauri后端
│   │   │   ├── src/
│   │   │   │   ├── commands.rs
│   │   │   │   ├── python_process.rs
│   │   │   │   ├── python_state.rs
│   │   │   │   ├── lib.rs
│   │   │   │   └── main.rs
│   │   │   ├── Cargo.toml
│   │   │   └── tauri.conf.json
│   │   │
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   ├── ARCHITECTURE.md        # 架构文档
│   ├── DEVELOPMENT.md         # 开发文档（本文件）
│   └── README.md
│
└── .kiro/                     # Kiro配置
```

## 开发流程

### 1. Python引擎开发

#### 安装依赖

```bash
cd desktop/engine

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate.bat  # Windows

# 安装依赖
pip install -r requirements.txt
```

#### 运行开发服务器

```bash
# 直接运行daemon
python daemon.py

# 或使用测试脚本
python test_daemon_manual.py
```

#### 添加新功能

1. 在`core/`目录创建新模块
2. 在`function_registry.py`注册函数
3. 添加单元测试
4. 更新文档

示例：

```python
# core/my_feature.py
def my_function(param1: str, param2: int) -> dict:
    """我的新功能"""
    return {"result": f"{param1}_{param2}"}

# function_registry.py
from core.my_feature import my_function

registry = FunctionRegistry()
registry.register("my_function", my_function)
```

#### 运行测试

```bash
# 运行所有测试
pytest

# 运行特定测试
pytest tests/test_my_feature.py

# 生成覆盖率报告
pytest --cov=core --cov-report=html
```

### 2. Rust层开发

#### 安装依赖

```bash
cd desktop/frontend/src-tauri

# 安装Rust依赖（自动）
cargo build
```

#### 添加新命令

1. 在`commands.rs`添加命令函数
2. 在`main.rs`注册命令
3. 添加集成测试

示例：

```rust
// commands.rs
#[tauri::command]
pub async fn my_command(
    state: State<'_, PythonState>,
    param: String
) -> Result<String, String> {
    let result = state.call("my_function", json!({
        "param1": param,
        "param2": 42
    })).await?;
    
    Ok(result.to_string())
}

// main.rs
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            my_command,
            // ...其他命令
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

#### 运行测试

```bash
# 运行单元测试
cargo test

# 运行集成测试
cargo test --test integration_tests

# 运行性能测试
cargo test --test performance_tests --release
```

### 3. 前端开发

#### 安装依赖

```bash
cd desktop/frontend

# 安装npm依赖
npm install
```

#### 运行开发服务器

```bash
# 启动Tauri开发模式
npm run tauri dev

# 或分别启动
npm run dev          # 前端开发服务器
npm run tauri dev    # Tauri开发模式
```

#### 添加新功能

1. 在`services/python.ts`添加服务方法
2. 创建React组件
3. 添加路由（如需要）
4. 添加E2E测试

示例：

```typescript
// services/python.ts
export class PythonEngineService {
    async myFunction(param: string): Promise<string> {
        return await invoke('my_command', { param });
    }
}

// components/MyComponent.tsx
export function MyComponent() {
    const [result, setResult] = useState('');
    
    const handleClick = async () => {
        const res = await pythonEngine.myFunction('test');
        setResult(res);
    };
    
    return (
        <div>
            <button onClick={handleClick}>测试</button>
            <p>{result}</p>
        </div>
    );
}
```

#### 运行测试

```bash
# 运行单元测试
npm test

# 运行E2E测试
npm run test:e2e

# 生成覆盖率报告
npm run test:coverage
```

## 构建和打包

### 1. 构建Python引擎

```bash
cd desktop/engine

# macOS/Linux
./build_daemon.sh

# Windows
build_daemon.bat

# 输出: dist/jarvis-engine
```

### 2. 构建Tauri应用

```bash
cd desktop/frontend

# 开发构建
npm run tauri build -- --debug

# 生产构建
npm run tauri build

# 输出:
# macOS: src-tauri/target/release/bundle/dmg/
# Windows: src-tauri/target/release/bundle/msi/
```

### 3. 完整构建流程

```bash
# 1. 构建Python引擎
cd desktop/engine
./build_daemon.sh

# 2. 复制到Tauri资源目录
cp dist/jarvis-engine ../frontend/src-tauri/resources/

# 3. 构建Tauri应用
cd ../frontend
npm run tauri build
```

## 调试

### 1. Python引擎调试

#### 使用VS Code

```json
// .vscode/launch.json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Python: Daemon",
            "type": "python",
            "request": "launch",
            "program": "${workspaceFolder}/desktop/engine/daemon.py",
            "console": "integratedTerminal",
            "justMyCode": false
        }
    ]
}
```

#### 使用日志

```python
from loguru import logger

logger.debug("调试信息")
logger.info("普通信息")
logger.warning("警告信息")
logger.error("错误信息")
```

#### 使用pdb

```python
import pdb

def my_function():
    pdb.set_trace()  # 设置断点
    # ...
```

### 2. Rust层调试

#### 使用VS Code

```json
// .vscode/launch.json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Rust: Debug",
            "type": "lldb",
            "request": "launch",
            "program": "${workspaceFolder}/desktop/frontend/src-tauri/target/debug/jarvis-desktop",
            "args": [],
            "cwd": "${workspaceFolder}/desktop/frontend"
        }
    ]
}
```

#### 使用日志

```rust
use log::{debug, info, warn, error};

debug!("调试信息");
info!("普通信息");
warn!("警告信息");
error!("错误信息");
```

#### 使用lldb

```bash
# 构建debug版本
cargo build

# 使用lldb调试
lldb target/debug/jarvis-desktop
```

### 3. 前端调试

#### 使用Chrome DevTools

1. 打开应用
2. 右键 -> 检查元素
3. 使用Console、Network、Performance等工具

#### 使用React DevTools

```bash
# 安装React DevTools扩展
# Chrome Web Store搜索 "React Developer Tools"
```

#### 使用VS Code

```json
// .vscode/launch.json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Chrome: Debug",
            "type": "chrome",
            "request": "launch",
            "url": "http://localhost:1420",
            "webRoot": "${workspaceFolder}/desktop/frontend/src"
        }
    ]
}
```

### 4. IPC通信调试

#### 查看IPC消息

```rust
// 在python_process.rs添加日志
println!("发送请求: {:?}", request);
println!("接收响应: {:?}", response);
```

```python
# 在daemon.py添加日志
logger.debug(f"接收请求: {request}")
logger.debug(f"发送响应: {response}")
```

#### 使用Tauri DevTools

```bash
# 启用Tauri DevTools
npm run tauri dev -- --features devtools
```

## 常见问题

### Python引擎无法启动

**问题**: Python引擎启动失败

**解决方案**:
1. 检查Python版本 >= 3.10
2. 检查依赖是否安装完整
3. 查看日志文件 `~/.jarvis/engine.log`
4. 尝试手动运行 `python daemon.py`

### Rust编译错误

**问题**: Cargo build失败

**解决方案**:
1. 更新Rust: `rustup update`
2. 清理缓存: `cargo clean`
3. 重新构建: `cargo build`
4. 检查Cargo.toml依赖版本

### 前端无法连接后端

**问题**: Tauri IPC调用失败

**解决方案**:
1. 检查命令是否注册
2. 检查参数类型是否匹配
3. 查看浏览器Console错误
4. 查看Rust日志输出

### 打包失败

**问题**: Tauri build失败

**解决方案**:
1. 确保Python引擎已构建
2. 检查资源文件路径
3. 查看构建日志
4. 尝试清理后重新构建

## 代码规范

### Python代码规范

- 遵循PEP 8
- 使用类型注解
- 编写文档字符串
- 使用black格式化

```bash
# 安装工具
pip install black flake8 mypy

# 格式化代码
black .

# 检查代码
flake8 .
mypy .
```

### Rust代码规范

- 遵循Rust官方规范
- 使用rustfmt格式化
- 使用clippy检查

```bash
# 格式化代码
cargo fmt

# 检查代码
cargo clippy
```

### TypeScript代码规范

- 遵循Airbnb规范
- 使用ESLint检查
- 使用Prettier格式化

```bash
# 检查代码
npm run lint

# 格式化代码
npm run format
```

## Git工作流

### 分支策略

- `main`: 主分支，稳定版本
- `develop`: 开发分支
- `feature/*`: 功能分支
- `bugfix/*`: 修复分支
- `release/*`: 发布分支

### 提交规范

```
<type>(<scope>): <subject>

<body>

<footer>
```

类型:
- `feat`: 新功能
- `fix`: 修复
- `docs`: 文档
- `style`: 格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建

示例:
```
feat(agent): 添加流式响应支持

- 实现SSE流式传输
- 更新前端显示逻辑
- 添加相关测试

Closes #123
```

## 性能优化

### Python性能优化

1. 使用缓存
2. 延迟加载
3. 异步处理
4. 连接池

### Rust性能优化

1. 避免不必要的克隆
2. 使用引用
3. 并行处理
4. 优化锁竞争

### 前端性能优化

1. 代码分割
2. 懒加载
3. 虚拟滚动
4. 防抖节流

## 测试策略

### 单元测试

- 覆盖率 > 70%
- 测试核心逻辑
- 使用Mock隔离依赖

### 集成测试

- 测试组件协作
- 测试IPC通信
- 测试数据流

### E2E测试

- 测试完整流程
- 测试用户场景
- 自动化测试

## 持续集成

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.10'
      
      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Run tests
        run: |
          cd desktop/engine && pytest
          cd desktop/frontend/src-tauri && cargo test
          cd desktop/frontend && npm test
```

## 参考资料

- [Tauri开发指南](https://tauri.app/v1/guides/)
- [React文档](https://react.dev/)
- [Rust Book](https://doc.rust-lang.org/book/)
- [Python最佳实践](https://docs.python-guide.org/)

---

**文档版本**: v2.0  
**最后更新**: 2024-11-12  
**维护者**: 开发团队
