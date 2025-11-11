# LLM 模型管理指南

## 概述

本文档说明如何使用新的 LLM 模型管理系统。系统支持：
- ✅ 数据库存储 API Key（不使用环境变量）
- ✅ 多模型配置管理
- ✅ 多密钥轮询
- ✅ Python Engine 通过 Go 后台调用 LLM

## 快速开始

### 1. 运行数据库迁移

```bash
# 进入后台目录
cd backend

# 运行迁移（假设你的数据库连接信息在环境变量中）
psql $DATABASE_URL -f migrations/003_llm_usage.sql
psql $DATABASE_URL -f migrations/004_llm_models.sql
```

### 2. 启动服务

```bash
# 启动 Go 后台
cd backend
go run cmd/server/main.go

# 启动 Python Engine
cd desktop/engine
python api/server.py
```

### 3. 添加模型配置

使用 API 添加模型配置：

```bash
curl -X POST http://localhost:8080/api/v1/llm-models \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GPT-4 Turbo",
    "model_id": "gpt-4-turbo",
    "provider": "openai",
    "type": "生文",
    "description": "最新的 GPT-4 模型，支持视觉输入",
    "base_url": "https://api.openai.com/v1",
    "auth_type": "api_key",
    "key_usage_mode": "single",
    "api_keys": [
      {
        "key": "sk-your-openai-api-key-here",
        "status": "enabled"
      }
    ],
    "supports_vision": true,
    "max_tokens": 4096,
    "context_window": 128000,
    "price_per_million_input": 10.0,
    "price_per_million_output": 30.0
  }'
```

## API 接口说明

### 模型管理接口（管理员）

#### 1. 创建模型配置
```
POST /api/v1/llm-models
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "模型名称",
  "model_id": "模型ID",
  "provider": "openai|claude|custom",
  "type": "生文|生图|单图生视频|多图生视频|生音频|生音乐",
  "description": "模型描述",
  "base_url": "API地址",
  "auth_type": "api_key|api_secret",
  "key_usage_mode": "single|rotation",
  "api_keys": [
    {"key": "密钥1", "status": "enabled"},
    {"key": "密钥2", "status": "enabled"}
  ],
  "supports_vision": true,
  "max_tokens": 4096,
  "context_window": 128000,
  "price_per_million_input": 10.0,
  "price_per_million_output": 30.0,
  "rate_limit_rpm": 500,
  "rate_limit_tpm": 150000,
  "platform_id": "平台ID（可选）"
}
```

#### 2. 获取模型列表
```
GET /api/v1/llm-models?provider=openai&type=生文&status=enabled
Authorization: Bearer {admin_token}
```

#### 3. 获取单个模型
```
GET /api/v1/llm-models/{id}
Authorization: Bearer {admin_token}
```

#### 4. 更新模型配置
```
PUT /api/v1/llm-models/{id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "disabled",
  "api_keys": [
    {"key": "新密钥", "status": "enabled"}
  ]
}
```

#### 5. 删除模型配置
```
DELETE /api/v1/llm-models/{id}
Authorization: Bearer {admin_token}
```

### LLM 调用接口（用户/Python Engine）

#### 1. 聊天接口
```
POST /api/v1/llm/chat
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "model": "gpt-4-turbo",
  "messages": [
    {"role": "user", "content": "Hello"}
  ],
  "temperature": 0.7,
  "max_tokens": 2000,
  "stream": true
}
```

#### 2. 获取可用模型
```
GET /api/v1/llm/models
Authorization: Bearer {user_token}
```

返回示例：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "uuid",
      "name": "GPT-4 Turbo",
      "model_id": "gpt-4-turbo",
      "provider": "openai",
      "type": "生文",
      "description": "最新的 GPT-4 模型",
      "supports_vision": true,
      "max_tokens": 4096,
      "context_window": 128000
    }
  ]
}
```

#### 3. 获取用量统计
```
GET /api/v1/llm/usage
Authorization: Bearer {user_token}
```

## 模型配置字段说明

### 基本信息
- `name`: 模型显示名称，如 "GPT-4 Turbo"
- `model_id`: 模型ID，用于API调用，如 "gpt-4-turbo"
- `provider`: 提供商，如 "openai", "claude", "custom"
- `type`: 模型类型
  - 生文：文本生成
  - 生图：图片生成
  - 单图生视频：单张图片生成视频
  - 多图生视频：多张图片生成视频
  - 生音频：音频生成
  - 生音乐：音乐生成
- `description`: 模型描述

### 状态
- `status`: 模型状态
  - `enabled`: 启用（用户可以使用）
  - `disabled`: 有效（暂时禁用，但配置保留）
  - `inactive`: 无效（已废弃）

### API 配置
- `base_url`: API 地址，如 "https://api.openai.com/v1"
- `auth_type`: 认证方式
  - `api_key`: 使用 Bearer Token 认证
  - `api_secret`: 使用 X-API-Key 认证
- `key_usage_mode`: 密钥使用模式
  - `single`: 单个密钥（使用第一个启用的密钥）
  - `rotation`: 轮询（依次使用多个密钥，需要 Redis）

### 密钥配置
- `api_keys`: 密钥数组，每个密钥包含：
  - `key`: API 密钥（加密存储）
  - `status`: 密钥状态
    - `enabled`: 启用
    - `disabled`: 禁用
    - `inactive`: 无效

### 模型参数
- `supports_vision`: 是否支持视觉输入（图片）
- `max_tokens`: 最大输出 token 数
- `context_window`: 上下文窗口大小

### 定价信息
- `price_per_million_input`: 输入价格（每百万 token）
- `price_per_million_output`: 输出价格（每百万 token）

### 限流配置
- `rate_limit_rpm`: 每分钟请求数限制
- `rate_limit_tpm`: 每分钟 token 数限制

### 其他
- `platform_id`: 模型平台的ID（可选）

## 使用示例

### 示例 1：添加 OpenAI GPT-4 模型

```bash
curl -X POST http://localhost:8080/api/v1/llm-models \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GPT-4 Turbo",
    "model_id": "gpt-4-turbo",
    "provider": "openai",
    "type": "生文",
    "description": "最新的 GPT-4 模型，支持视觉输入",
    "base_url": "https://api.openai.com/v1",
    "auth_type": "api_key",
    "key_usage_mode": "single",
    "api_keys": [
      {"key": "sk-proj-xxx", "status": "enabled"}
    ],
    "supports_vision": true,
    "max_tokens": 4096,
    "context_window": 128000,
    "price_per_million_input": 10.0,
    "price_per_million_output": 30.0,
    "rate_limit_rpm": 500,
    "rate_limit_tpm": 150000
  }'
```

### 示例 2：添加 Claude 模型（多密钥轮询）

```bash
curl -X POST http://localhost:8080/api/v1/llm-models \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Claude 3 Opus",
    "model_id": "claude-3-opus-20240229",
    "provider": "claude",
    "type": "生文",
    "description": "Anthropic 最强大的模型",
    "base_url": "https://api.anthropic.com",
    "auth_type": "api_key",
    "key_usage_mode": "rotation",
    "api_keys": [
      {"key": "sk-ant-key1", "status": "enabled"},
      {"key": "sk-ant-key2", "status": "enabled"},
      {"key": "sk-ant-key3", "status": "enabled"}
    ],
    "supports_vision": true,
    "max_tokens": 4096,
    "context_window": 200000,
    "price_per_million_input": 15.0,
    "price_per_million_output": 75.0
  }'
```

### 示例 3：更新模型状态

```bash
# 禁用模型
curl -X PUT http://localhost:8080/api/v1/llm-models/{model_id} \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "disabled"
  }'

# 更新密钥
curl -X PUT http://localhost:8080/api/v1/llm-models/{model_id} \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "api_keys": [
      {"key": "sk-new-key", "status": "enabled"}
    ]
  }'
```

### 示例 4：Python Engine 调用

Python Engine 会自动调用 Go 后台的 LLM 接口：

```python
from core.service.llm import LLMService
from models.agent import ModelConfig

# 创建配置（不需要 API Key）
config = ModelConfig(
    provider="openai",
    model="gpt-4-turbo",
    temperature=0.7,
    max_tokens=2000
)

# 创建服务（传入用户 token）
llm_service = LLMService(
    config=config,
    backend_token="user_jwt_token"
)

# 调用（会自动通过 Go 后台代理）
messages = [{"role": "user", "content": "Hello"}]
async for token in llm_service.chat_stream(messages):
    print(token, end="")
```

## 数据库表结构

### llm_models 表

```sql
CREATE TABLE llm_models (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    model_id VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'enabled',
    base_url TEXT NOT NULL,
    auth_type VARCHAR(20) NOT NULL DEFAULT 'api_key',
    key_usage_mode VARCHAR(20) NOT NULL DEFAULT 'single',
    api_keys JSONB NOT NULL DEFAULT '[]',
    supports_vision BOOLEAN DEFAULT FALSE,
    max_tokens INTEGER,
    context_window INTEGER,
    price_per_million_input DECIMAL(10, 6),
    price_per_million_output DECIMAL(10, 6),
    rate_limit_rpm INTEGER,
    rate_limit_tpm INTEGER,
    platform_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    UNIQUE(provider, model_id)
);
```

### llm_usage 表

```sql
CREATE TABLE llm_usage (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    agent_id UUID,
    conversation_id UUID,
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    cost DECIMAL(10, 6) NOT NULL,
    request_duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 安全注意事项

1. **API Key 加密**：虽然当前版本直接存储在数据库中，建议后续实现加密存储
2. **管理员权限**：模型管理接口应该只允许管理员访问
3. **密钥轮换**：定期更换 API Key，使用多密钥轮询提高可用性
4. **用量监控**：定期检查用量统计，防止滥用

## 故障排查

### 问题 1：模型调用失败
- 检查模型状态是否为 `enabled`
- 检查 API Key 是否有效
- 检查 base_url 是否正确
- 查看 Go 后台日志

### 问题 2：密钥轮询不工作
- 确认 `key_usage_mode` 设置为 `rotation`
- 确认有多个 `enabled` 状态的密钥
- 检查 Redis 连接（如果实现了轮询逻辑）

### 问题 3：Python Engine 无法调用
- 检查 `backend_url` 配置是否正确
- 检查用户 token 是否有效
- 检查 Go 后台是否正常运行

## 下一步开发

1. **前端管理界面**：开发模型管理页面（参考提供的设计图）
2. **密钥加密**：实现 API Key 的加密存储
3. **轮询逻辑**：使用 Redis 实现密钥轮询
4. **用量统计**：完善用量记录和统计功能
5. **配额管理**：实现用户配额限制
6. **成本分析**：提供成本统计和报表
