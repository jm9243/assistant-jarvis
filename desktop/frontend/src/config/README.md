# API配置说明

## 两个后台系统

### 1. 云服务后台（Go）
- **地址**: `http://localhost:8080` (开发) / `https://api.jarvis.com` (生产)
- **用途**: 
  - 用户认证和管理
  - Agent模板管理
  - 云端数据同步
  - 订阅和计费

### 2. Python引擎后台（FastAPI）
- **地址**: `http://localhost:8000` (本地)
- **用途**:
  - Agent对话和执行
  - 工作流执行
  - 知识库管理
  - 工具调用
  - 录制器功能
  - 系统监控

## 配置文件

### .env.development
开发环境配置，使用本地服务

### .env.production
生产环境配置，云服务使用远程地址，引擎使用本地地址

## API端点映射

| 功能 | 后台 | 端点 |
|------|------|------|
| 登录/注册 | 云服务 | `/api/v1/auth/*` |
| Agent模板 | 云服务 | `/api/v1/agent-templates/*` |
| Agent对话 | Python引擎 | `/api/v1/agents/*` |
| 工作流 | Python引擎 | `/api/v1/workflows/*` |
| 知识库 | Python引擎 | `/api/v1/knowledge-bases/*` |
| 工具 | Python引擎 | `/api/v1/tools/*` |
| 录制器 | Python引擎 | `/api/v1/recorder/*` |
| 系统监控 | Python引擎 | `/api/v1/system/*` |

## 使用方法

```typescript
import { API_ENDPOINTS } from '@/config/api';

// 访问云服务API
fetch(API_ENDPOINTS.cloud.auth.login, { ... });

// 访问Python引擎API
fetch(API_ENDPOINTS.engine.agents, { ... });

// WebSocket连接
new WebSocket(API_ENDPOINTS.engine.ws);
```

## 环境变量

可以通过环境变量覆盖默认配置：

```bash
# 云服务地址
VITE_CLOUD_API_URL=https://api.jarvis.com

# Python引擎地址
VITE_ENGINE_API_URL=http://localhost:8000

# WebSocket地址
VITE_ENGINE_WS_URL=ws://localhost:8000/ws
```
