# 🔀 API路由分配指南

## 核心原则

- **云服务（Go）**: 数据存储、同步、认证
- **Python引擎（FastAPI）**: 本地执行、实时操作

## 📋 详细分配表

### 认证相关 → 云服务
| 端点 | 后台 | 说明 |
|------|------|------|
| `POST /api/v1/auth/register` | 云服务 | 用户注册 |
| `POST /api/v1/auth/login` | 云服务 | 用户登录 |
| `POST /api/v1/auth/refresh` | 云服务 | 刷新Token |

### 用户相关 → 云服务
| 端点 | 后台 | 说明 |
|------|------|------|
| `GET /api/v1/users/profile` | 云服务 | 获取用户资料 |
| `PUT /api/v1/users/profile` | 云服务 | 更新用户资料 |
| `GET /api/v1/users/devices` | 云服务 | 获取设备列表 |
| `POST /api/v1/users/devices` | 云服务 | 注册设备 |

### 工作流相关 → **混合使用**
| 端点 | 后台 | 说明 |
|------|------|------|
| `GET /api/v1/workflows` | 云服务 | 获取云端工作流列表 |
| `POST /api/v1/workflows` | 云服务 | 创建并保存到云端 |
| `GET /api/v1/workflows/:id` | 云服务 | 获取云端工作流详情 |
| `PUT /api/v1/workflows/:id` | 云服务 | 更新云端工作流 |
| `DELETE /api/v1/workflows/:id` | 云服务 | 删除云端工作流 |
| `POST /api/v1/workflows/:id/execute` | **Python引擎** | 执行工作流 |
| `POST /api/v1/workflows/import` | 云服务 | 导入工作流 |
| `GET /api/v1/workflows/:id/export` | 云服务 | 导出工作流 |

### 任务相关 → **混合使用**
| 端点 | 后台 | 说明 |
|------|------|------|
| `GET /api/v1/tasks` | 云服务 | 获取任务历史 |
| `POST /api/v1/tasks` | **Python引擎** | 创建并执行任务 |
| `GET /api/v1/tasks/:id` | 云服务 | 获取任务详情 |
| `PATCH /api/v1/tasks/:id/status` | **Python引擎** | 更新任务状态 |
| `GET /api/v1/tasks/statistics` | 云服务 | 获取统计信息 |

### Agent相关 → **混合使用**
| 端点 | 后台 | 说明 |
|------|------|------|
| `GET /api/v1/agents` | **Python引擎** | 获取本地Agent列表 |
| `POST /api/v1/agents` | **Python引擎** | 创建本地Agent |
| `GET /api/v1/agents/:id` | **Python引擎** | 获取Agent详情 |
| `PUT /api/v1/agents/:id` | **Python引擎** | 更新Agent |
| `DELETE /api/v1/agents/:id` | **Python引擎** | 删除Agent |
| `POST /api/v1/agents/:id/chat` | **Python引擎** | Agent对话 |

### Agent模板 → 云服务
| 端点 | 后台 | 说明 |
|------|------|------|
| `GET /api/v1/agent-templates` | 云服务 | 获取云端模板 |
| `POST /api/v1/agent-templates` | 云服务 | 创建模板 |
| `GET /api/v1/agent-templates/:id` | 云服务 | 获取模板详情 |

### 对话相关 → **Python引擎**
| 端点 | 后台 | 说明 |
|------|------|------|
| `GET /api/v1/conversations` | **Python引擎** | 获取对话列表 |
| `POST /api/v1/conversations` | **Python引擎** | 创建对话 |
| `GET /api/v1/conversations/:id` | **Python引擎** | 获取对话详情 |
| `POST /api/v1/conversations/:id/messages` | **Python引擎** | 发送消息 |
| `GET /api/v1/conversations/:id/messages` | **Python引擎** | 获取消息列表 |

### 知识库相关 → **Python引擎**
| 端点 | 后台 | 说明 |
|------|------|------|
| `GET /api/v1/knowledge-bases` | **Python引擎** | 获取知识库列表 |
| `POST /api/v1/knowledge-bases` | **Python引擎** | 创建知识库 |
| `GET /api/v1/knowledge-bases/:id` | **Python引擎** | 获取知识库详情 |
| `POST /api/v1/knowledge-bases/:id/documents` | **Python引擎** | 上传文档 |
| `POST /api/v1/knowledge-bases/:id/search` | **Python引擎** | 搜索知识库 |

### 工具相关 → **Python引擎**
| 端点 | 后台 | 说明 |
|------|------|------|
| `GET /api/v1/tools` | **Python引擎** | 获取工具列表 |
| `POST /api/v1/tools/:id/execute` | **Python引擎** | 执行工具 |
| `PATCH /api/v1/tools/:id` | **Python引擎** | 更新工具配置 |

### 录制器相关 → **Python引擎**
| 端点 | 后台 | 说明 |
|------|------|------|
| `POST /api/v1/recorder/start` | **Python引擎** | 开始录制 |
| `POST /api/v1/recorder/stop` | **Python引擎** | 停止录制 |
| `POST /api/v1/recorder/pause` | **Python引擎** | 暂停录制 |
| `POST /api/v1/recorder/resume` | **Python引擎** | 恢复录制 |

### 系统监控 → **Python引擎**
| 端点 | 后台 | 说明 |
|------|------|------|
| `GET /api/v1/system/info` | **Python引擎** | 获取系统信息 |
| `GET /api/v1/system/status` | **Python引擎** | 获取系统状态 |
| `GET /api/v1/system/scan` | **Python引擎** | 扫描软件 |
| `GET /api/v1/system/logs` | **Python引擎** | 获取系统日志 |

### 文件存储 → 云服务
| 端点 | 后台 | 说明 |
|------|------|------|
| `POST /api/v1/storage/workflows/upload` | 云服务 | 上传工作流文件 |
| `POST /api/v1/storage/screenshots/upload` | 云服务 | 上传截图 |
| `POST /api/v1/storage/avatar/upload` | 云服务 | 上传头像 |
| `DELETE /api/v1/storage/:bucket/:path` | 云服务 | 删除文件 |

### 日志相关 → 云服务
| 端点 | 后台 | 说明 |
|------|------|------|
| `POST /api/v1/logs` | 云服务 | 创建日志 |
| `GET /api/v1/logs` | 云服务 | 获取日志列表 |
| `GET /api/v1/logs/task` | 云服务 | 获取任务日志 |

### LLM代理 → 云服务
| 端点 | 后台 | 说明 |
|------|------|------|
| `POST /api/v1/llm/chat` | 云服务 | LLM对话（代理） |
| `GET /api/v1/llm/models` | 云服务 | 获取可用模型 |
| `GET /api/v1/llm/usage` | 云服务 | 获取使用统计 |

### WebSocket → **Python引擎**
| 端点 | 后台 | 说明 |
|------|------|------|
| `ws://localhost:8000/ws` | **Python引擎** | 实时通信 |

## 🎯 决策规则

### 使用云服务（Go）的场景
1. ✅ 需要跨设备同步
2. ✅ 需要用户认证
3. ✅ 需要云端存储
4. ✅ 需要统计分析
5. ✅ 需要文件存储

### 使用Python引擎的场景
1. ✅ 需要本地执行
2. ✅ 需要实时操作
3. ✅ 需要系统访问
4. ✅ 需要隐私保护
5. ✅ 需要低延迟

## 📝 实现建议

### 工作流的双重存储
```typescript
// 1. 保存到云端（备份、同步）
await cloudApi.post('/workflows', workflow);

// 2. 执行时使用本地引擎
await engineApi.post(`/workflows/${id}/execute`, params);
```

### Agent的本地优先
```typescript
// 1. 从云端获取模板
const template = await cloudApi.get(`/agent-templates/${id}`);

// 2. 在本地创建Agent
const agent = await engineApi.post('/agents', {
  ...template,
  local: true
});

// 3. 本地对话
await engineApi.post(`/agents/${agent.id}/chat`, { message });
```

### 任务的混合模式
```typescript
// 1. 本地执行
const task = await engineApi.post('/tasks', { workflow_id });

// 2. 定期同步到云端（可选）
await cloudApi.post('/tasks', {
  id: task.id,
  status: task.status,
  result: task.result
});
```

## 🔍 调试技巧

### 检查API路由
```bash
# 云服务健康检查
curl http://localhost:8080/health

# Python引擎健康检查
curl http://localhost:8000/health

# 查看路由
curl http://localhost:8080/api/v1/workflows  # 云端列表
curl http://localhost:8000/api/v1/agents     # 本地列表
```

### 网络面板
打开浏览器开发者工具 → Network：
- `localhost:8080` → 云服务请求（蓝色标记）
- `localhost:8000` → Python引擎请求（绿色标记）

## ⚠️ 常见错误

### 错误1：工作流执行404
```
❌ POST http://localhost:8080/api/v1/workflows/:id/execute
✅ POST http://localhost:8000/api/v1/workflows/:id/execute
```

### 错误2：Agent对话404
```
❌ POST http://localhost:8080/api/v1/agents/:id/chat
✅ POST http://localhost:8000/api/v1/agents/:id/chat
```

### 错误3：系统监控404
```
❌ GET http://localhost:8080/api/v1/system/info
✅ GET http://localhost:8000/api/v1/system/info
```

## 📚 相关文档

- [API配置说明](./API_CONFIGURATION.md)
- [快速修复指南](./API_QUICK_FIX.md)
- [完整API文档](./API_ENDPOINTS.md)
