# 配额管理和用量统计指南

## 概述

本文档说明如何使用配额管理、用量统计和密钥轮询功能。

## 功能特性

### 1. 密钥轮询
- ✅ 支持为每个模型配置多个 API Key
- ✅ 自动轮询使用，提高可用性
- ✅ 使用 Redis 记录当前索引
- ✅ 自动标记失败的密钥
- ✅ 失败次数统计和告警

### 2. 用量统计
- ✅ 实时记录每次 LLM 调用
- ✅ 统计 token 使用量和费用
- ✅ 支持按用户、模型、时间范围查询
- ✅ 提供月度、日度统计
- ✅ 支持导出用量报表

### 3. 配额管理
- ✅ 多级会员配额（免费、基础、专业、企业）
- ✅ 月度配额和每日限制
- ✅ 调用前自动检查配额
- ✅ 配额用尽自动拒绝请求
- ✅ 配额告警（80%、90%、100%）

## API 接口

### 配额管理接口

#### 1. 获取配额信息
```
GET /api/v1/quota
Authorization: Bearer {user_token}
```

响应示例：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "user_id": "uuid",
    "membership_level": "pro",
    "quota_tokens": 2000000,
    "used_tokens": 150000,
    "remaining_tokens": 1850000,
    "usage_percentage": 7.5,
    "used_cost": 1.25,
    "has_quota": true,
    "reset_time": "2024-02-01 00:00:00",
    "daily_limit": 200000,
    "daily_used": 5000,
    "daily_remaining": 195000
  }
}
```

#### 2. 获取配额等级列表
```
GET /api/v1/quota/levels
```

响应示例：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "level": "free",
      "name": "免费版",
      "monthly_quota": 100000,
      "daily_limit": 10000,
      "price": 0,
      "features": [
        "10万 tokens/月",
        "1万 tokens/天",
        "基础模型访问"
      ]
    },
    {
      "level": "pro",
      "name": "专业版",
      "monthly_quota": 2000000,
      "daily_limit": 200000,
      "price": 99.9,
      "features": [
        "200万 tokens/月",
        "20万 tokens/天",
        "所有模型访问",
        "优先支持",
        "API 访问"
      ]
    }
  ]
}
```

#### 3. 获取本月用量统计
```
GET /api/v1/quota/usage/monthly
Authorization: Bearer {user_token}
```

响应示例：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "user_id": "uuid",
    "total_tokens": 150000,
    "prompt_tokens": 100000,
    "completion_tokens": 50000,
    "total_cost": 1.25,
    "request_count": 500,
    "start_time": "2024-01-01T00:00:00Z",
    "end_time": "2024-02-01T00:00:00Z"
  }
}
```

#### 4. 获取今日用量统计
```
GET /api/v1/quota/usage/daily
Authorization: Bearer {user_token}
```

## 配额等级说明

### 免费版 (free)
- **月度配额**: 10万 tokens
- **每日限制**: 1万 tokens
- **价格**: 免费
- **功能**:
  - 基础模型访问
  - 社区支持

### 基础版 (basic)
- **月度配额**: 50万 tokens
- **每日限制**: 5万 tokens
- **价格**: ¥29.9/月
- **功能**:
  - 所有模型访问
  - 优先支持

### 专业版 (pro)
- **月度配额**: 200万 tokens
- **每日限制**: 20万 tokens
- **价格**: ¥99.9/月
- **功能**:
  - 所有模型访问
  - 优先支持
  - API 访问

### 企业版 (enterprise)
- **月度配额**: 1000万 tokens
- **每日限制**: 100万 tokens
- **价格**: ¥499.9/月
- **功能**:
  - 所有模型访问
  - 专属支持
  - API 访问
  - 自定义模型

## 密钥轮询配置

### 1. 配置多个密钥

```bash
curl -X POST http://localhost:8080/api/v1/llm-models \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GPT-4 Turbo",
    "model_id": "gpt-4-turbo",
    "provider": "openai",
    "type": "生文",
    "base_url": "https://api.openai.com/v1",
    "auth_type": "api_key",
    "key_usage_mode": "rotation",
    "api_keys": [
      {"key": "sk-key1", "status": "enabled"},
      {"key": "sk-key2", "status": "enabled"},
      {"key": "sk-key3", "status": "enabled"}
    ]
  }'
```

### 2. 轮询工作原理

1. 第一次请求使用 `sk-key1`
2. 第二次请求使用 `sk-key2`
3. 第三次请求使用 `sk-key3`
4. 第四次请求回到 `sk-key1`
5. 循环往复

### 3. 失败处理

- 如果某个密钥调用失败，会自动标记
- 失败次数超过 5 次会触发告警
- 管理员可以手动禁用失败的密钥
- 禁用的密钥不会参与轮询

## 用量记录

### 自动记录内容

每次 LLM 调用都会自动记录：
- 用户 ID
- Agent ID（如果有）
- 对话 ID（如果有）
- 模型 ID
- 提供商和模型名称
- Prompt tokens
- Completion tokens
- 总 tokens
- 费用
- 请求耗时

### 数据库表结构

```sql
CREATE TABLE llm_usage (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    agent_id UUID,
    conversation_id UUID,
    model_id UUID,
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

## 配额检查流程

### 调用前检查

```
1. 用户发起 LLM 请求
   ↓
2. 系统预估 token 数量
   ↓
3. 检查月度配额
   - 已使用 + 预估 < 月度配额？
   ↓
4. 检查每日限制
   - 今日已使用 + 预估 < 每日限制？
   ↓
5. 通过检查，调用 LLM
   ↓
6. 记录实际用量
```

### 配额不足处理

如果配额不足，返回错误：
```json
{
  "code": 40003,
  "message": "monthly quota exceeded, used: 100000/100000 tokens",
  "data": null
}
```

## 配额告警

### 告警阈值

- **80%**: 发送提醒通知
- **90%**: 发送警告通知
- **100%**: 发送配额用尽通知

### 告警方式

- 站内通知
- 邮件通知（TODO）
- 短信通知（TODO）

## 使用示例

### 示例 1：检查配额

```bash
# 获取配额信息
curl -X GET http://localhost:8080/api/v1/quota \
  -H "Authorization: Bearer USER_TOKEN"

# 响应
{
  "code": 0,
  "data": {
    "has_quota": true,
    "remaining_tokens": 1850000,
    "usage_percentage": 7.5
  }
}
```

### 示例 2：查看用量统计

```bash
# 本月用量
curl -X GET http://localhost:8080/api/v1/quota/usage/monthly \
  -H "Authorization: Bearer USER_TOKEN"

# 今日用量
curl -X GET http://localhost:8080/api/v1/quota/usage/daily \
  -H "Authorization: Bearer USER_TOKEN"
```

### 示例 3：配置密钥轮询

```bash
# 更新模型配置，启用轮询
curl -X PUT http://localhost:8080/api/v1/llm-models/{model_id} \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key_usage_mode": "rotation",
    "api_keys": [
      {"key": "sk-key1", "status": "enabled"},
      {"key": "sk-key2", "status": "enabled"}
    ]
  }'
```

## 监控和统计

### Redis 键说明

- `llm:key_rotation:{model_id}`: 当前轮询索引
- `llm:key_failed:{model_id}:{api_key}`: 密钥失败次数

### 数据库查询

```sql
-- 查看用户本月用量
SELECT 
  SUM(total_tokens) as total_tokens,
  SUM(cost) as total_cost,
  COUNT(*) as request_count
FROM llm_usage
WHERE user_id = 'xxx'
  AND created_at >= DATE_TRUNC('month', NOW());

-- 查看模型使用统计
SELECT 
  model,
  COUNT(*) as request_count,
  SUM(total_tokens) as total_tokens,
  COUNT(DISTINCT user_id) as unique_users
FROM llm_usage
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY model
ORDER BY total_tokens DESC;

-- 查看用量最高的用户
SELECT 
  user_id,
  SUM(total_tokens) as total_tokens,
  SUM(cost) as total_cost
FROM llm_usage
WHERE created_at >= DATE_TRUNC('month', NOW())
GROUP BY user_id
ORDER BY total_tokens DESC
LIMIT 10;
```

## 故障排查

### 问题 1：配额检查失败
- 检查用户会员等级是否正确
- 检查用量统计是否准确
- 查看数据库中的 llm_usage 记录

### 问题 2：密钥轮询不工作
- 检查 Redis 连接是否正常
- 查看 Redis 中的轮询索引
- 确认模型配置中 `key_usage_mode` 为 `rotation`

### 问题 3：用量记录缺失
- 检查数据库连接
- 查看后台日志
- 确认 UsageService 是否正常初始化

## 最佳实践

1. **定期检查配额**: 建议在前端显示配额使用情况
2. **配置多个密钥**: 使用轮询模式提高可用性
3. **监控失败率**: 定期检查密钥失败次数
4. **设置告警**: 配额达到 80% 时提醒用户
5. **导出报表**: 定期导出用量数据用于分析

## 下一步开发

1. **前端配额展示**: 在用户界面显示配额信息
2. **用量图表**: 可视化展示用量趋势
3. **邮件告警**: 实现邮件通知功能
4. **自动续费**: 配额用尽时自动升级
5. **成本优化**: 根据用量推荐合适的套餐
