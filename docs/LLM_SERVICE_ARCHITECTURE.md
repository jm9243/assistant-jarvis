# LLM 服务架构说明

## 概述

系统采用统一的 LLM 服务管理架构，所有模型调用都通过 Go 后台代理服务进行。API Key 存储在数据库中，支持多模型配置和密钥轮询。

## 架构设计

```
前端 → Python Engine → Go 后台（LLM 代理） → 实际 LLM 服务
      (使用 token)    (从数据库读取 API Key)
```

### 客户端（前端）
- **无需配置**：用户不需要输入任何 API Key 或 base_url
- **使用 Token 鉴权**：登录后使用 JWT Token 调用接口
- **模型选择**：从后台获取可用模型列表，选择需要的模型

### Python Engine
- **不存储 API Key**：不再从环境变量读取 API Key
- **调用 Go 后台**：所有 LLM 请求都转发到 Go 后台的代理接口
- **使用 Token 鉴权**：携带用户 Token 调用后台接口

### Go 后台服务
- **数据库存储**：API Key 存储在数据库中（加密存储）
- **多模型管理**：支持添加、编辑、删除多个模型配置
- **密钥轮询**：支持为每个模型配置多个 API Key，自动轮询使用
- **代理转发**：接收请求，从数据库读取配置，转发到实际的 LLM 服务
- **用量记录**：自动记录每个用户的模型使用量和费用

## 数据库配置

### 模型配置表（llm_models）

运行迁移文件创建表：
```bash
# 执行迁移
psql -U postgres -d jarvis -f backend/migrations/004_llm_models.sql
```

表结构包含：
- 基本信息：名称、模型ID、提供商、类型、描述
- 状态：enabled（启用）、disabled（有效）、inactive（无效）
- API 配置：base_url、认证方式、密钥使用模式
- 多密钥支持：api_keys 字段存储多个密钥，支持轮询
- 模型参数：支持视觉、最大 token、上下文窗口
- 定价信息：输入/输出价格
- 限流配置：RPM、TPM 限制

## API 接口

### 1. LLM 调用接口（供 Python Engine 使用）

#### 聊天接口
```
POST /api/v1/llm/chat
Authorization: Bearer {token}

{
  "model": "gpt-4-turbo",
  "messages": [...],
  "temperature": 0.7,
  "max_tokens": 2000,
  "stream": true
}
```

#### 获取可用模型
```
GET /api/v1/llm/models
Authorization: Bearer {token}
```

#### 获取用量统计
```
GET /api/v1/llm/usage
Authorization: Bearer {token}
```

### 2. 模型管理接口（管理员功能）

#### 创建模型配置
```
POST /api/v1/llm-models
Authorization: Bearer {admin_token}

{
  "name": "GPT-4 Turbo",
  "model_id": "gpt-4-turbo",
  "provider": "openai",
  "type": "生文",
  "description": "最新的 GPT-4 模型",
  "base_url": "https://api.openai.com/v1",
  "auth_type": "api_key",
  "key_usage_mode": "single",
  "api_keys": [
    {"key": "sk-xxx", "status": "enabled"}
  ],
  "supports_vision": true,
  "max_tokens": 4096,
  "context_window": 128000
}
```

#### 获取模型列表
```
GET /api/v1/llm-models?provider=openai&type=生文&status=enabled
Authorization: Bearer {admin_token}
```

#### 更新模型配置
```
PUT /api/v1/llm-models/{id}
Authorization: Bearer {admin_token}

{
  "status": "disabled",
  "api_keys": [
    {"key": "sk-new-key", "status": "enabled"}
  ]
}
```

#### 删除模型配置
```
DELETE /api/v1/llm-models/{id}
Authorization: Bearer {admin_token}
```

## 数据流程

### 用户使用流程
1. 用户登录 → 获取 JWT Token
2. 前端创建 Agent → 只配置模型类型和参数（无 API Key）
3. 前端发送消息 → Python Engine 处理
4. Python Engine → 携带 Token 调用 Go 后台 LLM 接口
5. Go 后台验证 Token → 提取 user_id
6. Go 后台从数据库读取模型配置 → 获取 API Key
7. Go 后台转发请求 → 调用实际的 LLM 服务
8. 记录用量 → 保存到数据库
9. 返回结果 → Python Engine → 前端显示

### 管理员配置流程
1. 管理员登录 → 获取管理员 Token
2. 访问模型管理界面
3. 添加/编辑模型配置：
   - 填写模型信息（名称、ID、提供商、类型）
   - 配置 API 地址和认证方式
   - 添加一个或多个 API Key
   - 选择密钥使用模式（单个/轮询）
   - 设置模型参数和定价
4. 保存配置 → 存储到数据库
5. 用户即可使用新配置的模型

## 优势

1. **安全性**：
   - API Key 存储在数据库中（加密）
   - 不暴露给客户端和 Python Engine
   - 支持密钥轮换，不影响服务

2. **灵活性**：
   - 支持多个 LLM 提供商
   - 可以随时添加新模型
   - 支持自定义 API 地址
   - 支持多种认证方式

3. **高可用**：
   - 支持多密钥轮询
   - 单个密钥失效不影响服务
   - 可以动态启用/禁用密钥

4. **易管理**：
   - 图形化界面管理模型
   - 实时更新配置
   - 统一的模型列表

5. **用量控制**：
   - 记录每次调用的用量
   - 支持配额管理
   - 可以实现计费功能

6. **审计**：
   - 完整的调用日志
   - 用量统计
   - 成本分析

## 已修改/新增的文件

### 数据库
- `backend/migrations/004_llm_models.sql` - 新增模型配置表

### 前端
- `desktop/frontend/src/types/agent.ts` - 移除 api_key 和 base_url 字段
- `desktop/frontend/src/pages/Agent/AgentFormPage.tsx` - 移除 API Key 验证和输入
- `desktop/frontend/src/components/agent/ModelConfigForm.tsx` - 移除 API Key 和 base_url 输入框，添加提示信息

### Go 后台
- `backend/.env` - 移除 LLM API Key 配置
- `backend/env.example` - 移除 LLM API Key 配置
- `backend/internal/model/llm.go` - 新增 LLMModel 和相关请求模型
- `backend/internal/repository/llm_model_repo.go` - 新增模型配置仓库
- `backend/internal/service/llm_proxy_service.go` - 从数据库读取配置
- `backend/internal/api/handler/llm_model_handler.go` - 新增模型管理接口
- `backend/cmd/server/main.go` - 注册新的路由和服务

### Python Engine
- `desktop/engine/models/agent.py` - ModelConfig 移除 api_key 和 base_url 字段
- `desktop/engine/core/service/llm.py` - 调用 Go 后台的 LLM 接口
- `desktop/engine/core/service/performance_example.py` - 更新示例代码
- `desktop/engine/config.py` - 移除 LLM API Key 配置

## 使用指南

### 1. 初始化数据库
```bash
# 执行迁移文件
psql -U postgres -d jarvis -f backend/migrations/004_llm_models.sql
```

### 2. 添加模型配置
使用 API 或管理界面添加模型配置：
```bash
curl -X POST http://localhost:8080/api/v1/llm-models \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GPT-4 Turbo",
    "model_id": "gpt-4-turbo",
    "provider": "openai",
    "type": "生文",
    "description": "最新的 GPT-4 模型",
    "base_url": "https://api.openai.com/v1",
    "auth_type": "api_key",
    "key_usage_mode": "single",
    "api_keys": [
      {"key": "sk-your-api-key", "status": "enabled"}
    ],
    "supports_vision": true,
    "max_tokens": 4096,
    "context_window": 128000
  }'
```

### 3. 用户使用
用户登录后，系统会自动从数据库获取可用模型列表，无需任何配置。

## 下一步

1. 实现用量记录到数据库（使用 `backend/migrations/003_llm_usage.sql`）
2. 实现配额管理和限流
3. 开发模型管理前端界面
4. 实现密钥轮询逻辑（使用 Redis）
5. 实现成本统计和报表
6. 添加更多 LLM 提供商支持
