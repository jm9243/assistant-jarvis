# 贾维斯引擎

Python Sidecar后端引擎，负责所有自动化任务执行和AI决策。

## 技术栈

- **语言**: Python 3.10+
- **框架**: FastAPI
- **AI**: AgentScope
- **GUI自动化**: pywinauto (Windows) / pyobjc (macOS)
- **Web自动化**: Playwright
- **事件监听**: pynput

## 目录结构

```
├── main.py           # 入口文件
├── api/              # FastAPI服务
├── core/             # 核心引擎
│   ├── workflow/     # 工作流引擎
│   ├── agent/        # Agent系统
│   ├── recorder/     # 录制器
│   └── call/         # 通话系统
├── tools/            # 工具集
│   ├── gui/          # GUI自动化
│   ├── web/          # Web自动化
│   ├── system/       # 系统集成
│   └── ai/           # AI服务
├── utils/            # 工具函数
└── models/           # 数据模型
```

## 开发

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 安装Playwright浏览器
playwright install

# 复制配置文件
cp .env.example .env

# 启动服务
python main.py
```

## 打包

```bash
# 使用PyInstaller打包
pyinstaller --onefile \
  --add-data "models:models" \
  --hidden-import=agentscope \
  main.py
```

## 规范

详见 [开发规范](../docs/开发规范.md)

