# 助手-贾维斯 PC端

## 项目结构

```
desktop/
├── frontend/           # Tauri 2 + React 前端
├── engine/            # Python Sidecar 后端引擎
└── docs/              # 文档
```

## 快速开始

### 前端开发
```bash
cd frontend
npm install
npm run dev
```

### 后端开发
```bash
cd engine
pip install -r requirements.txt
python main.py
```

## 技术栈

- **前端**: Tauri 2 + React 18 + TypeScript
- **后端**: Python 3.10+ + FastAPI + AgentScope
- **状态管理**: Zustand
- **UI**: Tailwind CSS + React Flow

### 功能概览

- Agent 中心：模板、对话与记忆管理
- 知识库 / RAG：文档上传、向量化、检索调试
- 语音通话：虚拟设备检测、通话统计、测试面板
- 工具治理：审批工作流、审计记录、运营 KPI
- Multi-Agent 协同：组织结构与会议轮次可视化
- 远程触发 / MCP：工作流工具化、WebSocket 指挥

## 开发规范

详见 [开发规范](./docs/开发规范.md)
