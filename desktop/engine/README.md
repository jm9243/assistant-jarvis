# 助手·贾维斯 - Python执行引擎

基于 FastAPI 的 Python Sidecar 后端引擎，负责工作流执行、录制器、系统监控等核心功能。

## 技术栈

- **框架**: FastAPI
- **异步**: asyncio + uvicorn
- **GUI自动化**: pywinauto (Windows) / pyobjc (macOS)
- **Web自动化**: Playwright
- **键鼠监听**: pynput
- **OCR**: pytesseract
- **图像处理**: opencv-python
- **数据库**: SQLAlchemy + SQLite

## 安装

```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 安装Playwright浏览器
playwright install chromium
```

## 运行

```bash
# 开发模式
python main.py

# 或使用uvicorn
uvicorn api.server:app --reload --host 127.0.0.1 --port 8000
```

## API文档

启动服务后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 项目结构

```
engine/
├── api/                  # API服务层
│   ├── server.py         # FastAPI服务器
│   └── routes/           # API路由
├── core/                 # 核心引擎
│   ├── workflow/         # 工作流引擎
│   ├── recorder/         # 录制器
│   └── system/           # 系统监控
├── tools/                # 工具集
│   ├── gui/              # GUI自动化
│   ├── web/              # Web自动化
│   └── system/           # 系统集成
├── models/               # 数据模型
├── utils/                # 工具函数
└── main.py               # 应用入口
```

## 功能模块

- ✅ FastAPI服务器
- ✅ WebSocket支持
- ✅ 工作流API（基础版）
- ✅ 录制器API（基础版）
- ✅ 系统监控API
- 🚧 工作流执行引擎
- 🚧 元素定位器
- 🚧 GUI自动化工具

## 开发

```bash
# 运行测试
pytest

# 代码格式化
black .
isort .

# 类型检查
mypy .
```

## 注意事项

1. 确保Python版本 >= 3.10
2. macOS需要授予辅助功能权限
3. Windows需要管理员权限（某些操作）
4. 日志文件位于 `~/.jarvis/logs/`
