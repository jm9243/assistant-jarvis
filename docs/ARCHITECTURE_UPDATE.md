# 架构调整说明 - LLM 代理服务

## 问题

原设计中，客户端需要配置 LLM API Key，这存在以下问题：
1. **安全风险**：API Key 暴露在客户端
2. **用户体验差**：用户需要自己申请和配置 API Key
3. **无法计费**：无法统计和控制用户的 LLM 使用量
4. **无法管理**：无法统一管理模型配置

## 新架构

### 1. LLM 代理服务

**后端统一管理 API Key**：
```
客户端 → Go 后端 (LLM Proxy) → LLM 提供商 (OpenAI/Claude)
         ↓
      记录用量
```

**优势**：
- ✅ API Key 安全存储在后端
- ✅ 统一计费和用量管理
- ✅ 用户无需配置任何密钥
- ✅ 可以灵活切换模型提供商
- ✅ 可以实现模型负载均衡

### 2. 客户端配置简化

**旧配置**（❌ 不安全）：
```typescript
{
  "llm_config": {
    "provider": "openai",
    "model": "gpt-4",
    "api_key": "sk-xxx",  // ❌ 暴露在客户端
    "base_url": "https://api.openai.com/v1"
  }
}
```

**新配置**（✅ 安全）：
```typescript
{
  "model_config": {
    "model": "gpt-4-turbo",  // 只需要选择模型
    "temperature": 0.7,
    "max_tokens": 2000
    // ✅ 不包含任何敏感信息
  }
}
```

### 3. API 端点

#### 获取可用模型列表
```
GET /api/v1/llm/models
Authorization: Bearer <token>

Response:
{
  "code": 0,
  "data": [
    {
      "id": "gpt-4-turbo",
      "name": "GPT-4 Turbo",
      "provider": "openai",
      "description": "最新的 GPT-4 模型",
      "max_tokens": 128000,
      "price_per_token": 0.00001
    }
  ]
}
```

#### LLM 聊天（代理）
```
POST /api/v1/llm/chat
Authorization: Bearer <token>

Request:
{
  "model": "gpt-4-turbo",
  "messages": [
    {"role": "user", "content": "你好"}
  ],
  "temperature": 0.7,
  "max_tokens": 2000
}

Response:
{
  "code": 0,
  "data": {
    "id": "chatcmpl-xxx",
    "choices": [
      {
        "message": {
          "role": "assistant",
          "content": "你好！有什么可以帮助你的吗？"
        }
      }
    ],
    "usage": {
      "prompt_tokens": 10,
      "completion_tokens": 15,
      "total_tokens": 25
    }
  }
}
```

#### 获取用量统计
```
GET /api/v1/llm/usage
Authorization: Bearer <token>

Response:
{
  "code": 0,
  "data": {
    "total_tokens": 100000,
    "used_tokens": 5000,
    "remaining_tokens": 95000,
    "total_cost": 0.05,
    "current_month_cost": 0.05
  }
}
```

### 4. 用量记录

后端自动记录每次 LLM 调用：
- 用户 ID
- 模型名称
- Token 使用量（prompt + completion）
- 费用
- 时间戳

### 5. 配额管理

根据用户会员等级分配配额：
- **免费版**：10万 tokens/月
- **Pro 版**：100万 tokens/月
- **企业版**：无限制

### 6. 实现文件

**后端**：
- `backend/internal/service/llm_proxy_service.go` - LLM 代理服务
- `backend/internal/api/handler/llm_handler.go` - LLM API 处理器
- `backend/internal/model/llm.go` - LLM 相关模型

**前端**：
- `desktop/frontend/src/services/agentApi.ts` - 添加 llmApi

**数据库**：
- 需要添加 `llm_usage` 表记录用量

### 7. 环境变量配置

后端需要配置（在 `backend/.env`）：
```env
# OpenAI
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://api.openai.com/v1

# Claude
CLAUDE_API_KEY=sk-ant-xxx
CLAUDE_BASE_URL=https://api.anthropic.com

# Coze
COZE_API_KEY=xxx
COZE_BASE_URL=https://api.coze.com
```

### 8. 迁移步骤

1. ✅ 创建 LLM 代理服务
2. ✅ 添加 LLM API 端点
3. ✅ 更新 Agent 模型（移除 API Key）
4. ⏳ 创建用量记录表
5. ⏳ 更新前端 Agent 创建页面
6. ⏳ 添加用量统计页面

## 总结

新架构确保：
- ✅ **安全**：API Key 不暴露给客户端
- ✅ **简单**：用户无需配置任何密钥
- ✅ **可控**：后端统一管理和计费
- ✅ **灵活**：可以随时调整模型配置
