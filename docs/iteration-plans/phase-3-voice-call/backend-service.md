# Phase 3: 语音通话 - 后台服务迭代计划

**阶段目标**: 支持AI语音通话功能的后台服务  
**预计时间**: 2个月  
**依赖**: Phase 1 工作流系统、Phase 2 三种Agent完成

---

## 目录

1. [功能清单](#功能清单)
2. [核心功能详解](#核心功能详解)
3. [技术架构](#技术架构)
4. [开发计划](#开发计划)
5. [验收标准](#验收标准)

---

## 功能清单

### 必须完成的功能模块

#### 1. 通话记录管理 (对应PRD 4.7.1)
- [ ] 通话记录存储
- [ ] 通话记录查询API
- [ ] 通话摘要生成
- [ ] 通话统计API

#### 2. 阿里云服务集成 (对应PRD 4.7.1)
- [ ] 阿里云账号配置
- [ ] Token获取服务
- [ ] ASR服务代理（可选）
- [ ] TTS服务代理（可选）

#### 3. 通话配置管理
- [ ] 接听规则配置API
- [ ] Agent绑定管理

---

## 核心功能详解

### 1. 通话记录管理

#### 1.1 数据库Schema

**call_records表**:
```sql
CREATE TYPE call_hangup_reason AS ENUM ('user', 'ai', 'timeout', 'silence', 'error');

CREATE TABLE public.call_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id),
  
  -- 来电信息
  caller_name VARCHAR(255),
  caller_phone VARCHAR(50),
  caller_app VARCHAR(50), -- '微信', '企业微信', '钉钉'
  
  -- 通话时间
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  
  -- 通话结果
  hangup_reason call_hangup_reason,
  
  -- 对话内容
  messages JSONB NOT NULL DEFAULT '[]',
  
  -- 摘要
  summary TEXT,
  
  -- 元数据
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_call_records_user_id ON public.call_records(user_id);
CREATE INDEX idx_call_records_agent_id ON public.call_records(agent_id);
CREATE INDEX idx_call_records_start_time ON public.call_records(start_time DESC);

-- RLS策略
ALTER TABLE public.call_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own call records"
  ON public.call_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own call records"
  ON public.call_records FOR ALL
  USING (auth.uid() = user_id);
```

---

#### 1.2 通话记录API

**创建通话记录**:
```
POST /api/v1/call-records
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "agent_id": "uuid",
  "caller_name": "张三",
  "caller_app": "微信",
  "start_time": "2025-11-08T10:00:00Z"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "agent_id": "uuid",
    "caller_name": "张三",
    "start_time": "2025-11-08T10:00:00Z"
  }
}
```

**更新通话记录**:
```
PATCH /api/v1/call-records/{record_id}
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "end_time": "2025-11-08T10:05:30Z",
  "duration_seconds": 330,
  "hangup_reason": "user",
  "messages": [
    {
      "role": "assistant",
      "content": "您好，我是AI助手",
      "timestamp": 1699430400
    },
    {
      "role": "user",
      "content": "你好",
      "timestamp": 1699430405
    }
  ]
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "duration_seconds": 330,
    ...
  }
}
```

**获取通话记录列表**:
```
GET /api/v1/call-records
Authorization: Bearer <token>
Query Parameters:
  - agent_id: Agent ID筛选
  - start_date: 开始日期
  - end_date: 结束日期
  - page: 页码
  - page_size: 每页数量

Response:
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "uuid",
        "agent_id": "uuid",
        "agent_name": "智能客服",
        "caller_name": "张三",
        "caller_app": "微信",
        "start_time": "2025-11-08T10:00:00Z",
        "duration_seconds": 330,
        "summary": "客户咨询产品价格..."
      },
      ...
    ],
    "pagination": {...}
  }
}
```

**获取通话详情**:
```
GET /api/v1/call-records/{record_id}
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "agent_id": "uuid",
    "caller_name": "张三",
    "caller_app": "微信",
    "start_time": "2025-11-08T10:00:00Z",
    "end_time": "2025-11-08T10:05:30Z",
    "duration_seconds": 330,
    "hangup_reason": "user",
    "messages": [
      {
        "role": "assistant",
        "content": "您好，我是AI助手",
        "timestamp": 1699430400
      },
      {
        "role": "user",
        "content": "你好",
        "timestamp": 1699430405
      }
    ],
    "summary": "客户咨询产品价格和购买流程...",
    "metadata": {
      "total_tokens": 500,
      "avg_confidence": 0.92
    }
  }
}
```

---

#### 1.3 通话摘要生成

**功能描述**: 使用LLM自动生成通话摘要

**实现逻辑**:
```go
func GenerateCallSummary(messages []Message) (string, error) {
    // 构建Prompt
    prompt := `请为以下通话对话生成简洁的摘要，包括：
1. 客户的主要诉求
2. 讨论的关键信息
3. 最终结果

对话内容：
`
    
    for _, msg := range messages {
        prompt += fmt.Sprintf("%s: %s\n", msg.Role, msg.Content)
    }
    
    // 调用LLM生成摘要
    llmReq := &LLMRequest{
        Provider: "openai",
        Model: "gpt-3.5-turbo",
        Messages: []Message{
            {Role: "system", Content: "你是一个专业的通话摘要助手"},
            {Role: "user", Content: prompt},
        },
        Temperature: 0.7,
        MaxTokens: 200,
    }
    
    response, err := llmService.Chat(context.Background(), llmReq)
    if err != nil {
        return "", err
    }
    
    return response.Content, nil
}
```

**生成摘要API**:
```
POST /api/v1/call-records/{record_id}/generate-summary
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "summary": "客户咨询产品价格和购买流程。询问了基础版和专业版的价格差异，以及是否支持企业采购。最后客户表示需要考虑后再联系。"
  }
}
```

---

#### 1.4 通话统计API

**获取统计数据**:
```
GET /api/v1/call-records/statistics
Authorization: Bearer <token>
Query Parameters:
  - period: 统计周期（today, week, month, year）
  - agent_id: Agent ID筛选（可选）

Response:
{
  "success": true,
  "data": {
    "total_calls": 150,
    "total_duration_seconds": 45000,
    "avg_duration_seconds": 300,
    "success_calls": 135,
    "failed_calls": 15,
    "success_rate": 90.0,
    
    "hangup_reasons": {
      "user": 80,
      "ai": 50,
      "timeout": 10,
      "silence": 5,
      "error": 5
    },
    
    "daily_stats": [
      {
        "date": "2025-11-01",
        "calls": 20,
        "duration": 6000
      },
      ...
    ],
    
    "app_distribution": {
      "微信": 80,
      "企业微信": 50,
      "钉钉": 20
    }
  }
}
```

---

### 2. 阿里云服务集成

#### 2.1 阿里云配置管理

**配置存储**:
```sql
CREATE TABLE public.aliyun_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  access_key_id VARCHAR(255) NOT NULL,
  access_key_secret TEXT NOT NULL, -- 加密存储
  app_key VARCHAR(255) NOT NULL,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, is_active)
);

-- RLS策略
ALTER TABLE public.aliyun_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own aliyun configs"
  ON public.aliyun_configs FOR ALL
  USING (auth.uid() = user_id);
```

**配置API**:
```
POST /api/v1/aliyun/config
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "access_key_id": "LTAI...",
  "access_key_secret": "...",
  "app_key": "..."
}

Response:
{
  "success": true,
  "message": "阿里云配置已保存"
}

GET /api/v1/aliyun/config
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "access_key_id": "LTAI...",
    "app_key": "...",
    "is_active": true
  }
}
```

---

#### 2.2 Token服务

**Token获取API**:
```
POST /api/v1/aliyun/token
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "token": "...",
    "expires_at": 1699519200
  }
}
```

**服务端实现**:
```go
func GetAliyunToken(userID string) (*TokenResponse, error) {
    // 获取用户的阿里云配置
    config, err := getAliyunConfig(userID)
    if err != nil {
        return nil, err
    }
    
    // 调用阿里云API获取Token
    tokenURL := "https://nls-meta.cn-shanghai.aliyuncs.com/pop/2019-02-28/tokens"
    
    params := url.Values{}
    params.Add("AccessKeyId", config.AccessKeyID)
    params.Add("Action", "CreateToken")
    params.Add("Version", "2019-02-28")
    params.Add("Format", "JSON")
    
    // 生成签名
    signature := generateSignature(params, config.AccessKeySecret)
    params.Add("Signature", signature)
    
    // 发送请求
    resp, err := http.Get(fmt.Sprintf("%s?%s", tokenURL, params.Encode()))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    // 解析响应
    var result struct {
        Token struct {
            ID        string `json:"Id"`
            ExpireTime int64 `json:"ExpireTime"`
        } `json:"Token"`
    }
    
    json.NewDecoder(resp.Body).Decode(&result)
    
    return &TokenResponse{
        Token: result.Token.ID,
        ExpiresAt: result.Token.ExpireTime,
    }, nil
}
```

---

### 3. 接听规则配置管理

#### 3.1 数据库Schema

**call_answer_rules表**:
```sql
CREATE TABLE public.call_answer_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  priority INTEGER NOT NULL,
  
  -- 匹配条件
  conditions JSONB NOT NULL,
  
  -- 执行动作
  action JSONB NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_call_answer_rules_user_id ON public.call_answer_rules(user_id);
CREATE INDEX idx_call_answer_rules_priority ON public.call_answer_rules(priority);

-- RLS策略
ALTER TABLE public.call_answer_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own call answer rules"
  ON public.call_answer_rules FOR ALL
  USING (auth.uid() = user_id);
```

---

#### 3.2 规则管理API

**创建规则**:
```
POST /api/v1/call-answer-rules
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "name": "工作时间自动接听",
  "enabled": true,
  "priority": 1,
  "conditions": {
    "timeRange": {
      "start": "09:00",
      "end": "18:00",
      "weekdays": [1, 2, 3, 4, 5]
    },
    "apps": {
      "type": "include",
      "list": ["企业微信", "钉钉"]
    }
  },
  "action": {
    "answer": true,
    "useAgent": true,
    "agentId": "uuid",
    "greeting": "您好，我是AI助手"
  }
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "工作时间自动接听",
    ...
  }
}
```

**获取规则列表**:
```
GET /api/v1/call-answer-rules
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "rules": [
      {
        "id": "uuid",
        "name": "工作时间自动接听",
        "enabled": true,
        "priority": 1,
        "conditions": {...},
        "action": {...}
      },
      ...
    ]
  }
}
```

---

## 技术架构

### Go后端服务扩展

```
┌──────────────────────────────────────────────────────────┐
│                     Go后端服务                            │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              新增业务服务层                          │ │
│  │                                                      │ │
│  │  ┌──────────────┐  ┌──────────────┐                │ │
│  │  │  通话记录服务│  │  规则管理服务│                │ │
│  │  └──────────────┘  └──────────────┘                │ │
│  │  ┌──────────────┐  ┌──────────────┐                │ │
│  │  │  统计服务    │  │  阿里云服务  │                │ │
│  │  └──────────────┘  └──────────────┘                │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│              阿里云智能媒体服务                           │
│                                                           │
│  - Token Service                                         │
│  - ASR Service (实时语音识别)                            │
│  - TTS Service (实时语音合成)                            │
└──────────────────────────────────────────────────────────┘
```

---

### 项目结构扩展

```
backend/
├── internal/
│   ├── api/
│   │   ├── call_records.go        # 通话记录API
│   │   ├── call_rules.go          # 接听规则API
│   │   └── aliyun.go              # 阿里云服务API
│   ├── service/
│   │   ├── call_record_service.go
│   │   ├── call_rule_service.go
│   │   ├── call_statistics_service.go
│   │   └── aliyun_service.go
│   ├── aliyun/                    # 阿里云SDK封装
│   │   ├── client.go
│   │   ├── token.go
│   │   └── signature.go
│   └── repository/
│       ├── call_record_repo.go
│       └── call_rule_repo.go
```

---

## 开发计划

### 时间线（共2个月）

#### 第1个月：基础API开发

**Week 1-2: 数据库设计与基础API**
- [ ] 设计并创建通话相关数据库表
- [ ] 实现通话记录CRUD API
- [ ] 实现接听规则CRUD API

**Week 3-4: 阿里云集成**
- [ ] 阿里云配置管理API
- [ ] Token获取服务
- [ ] 签名算法实现
- [ ] 服务测试

---

#### 第2个月：统计与优化

**Week 5-6: 统计与摘要**
- [ ] 通话统计API
- [ ] 通话摘要生成服务
- [ ] 统计数据聚合

**Week 7-8: 测试与优化**
- [ ] 集成测试
- [ ] 性能优化
- [ ] Bug修复
- [ ] 文档完善

---

### 开发任务分配建议

**Go后端团队（1人）**:
- 工程师A: 通话记录API、规则管理API、统计API、阿里云集成

---

### 开发里程碑

**Milestone 1（第1个月末）**: 基础API完成
- ✅ 通话记录API可用
- ✅ 接听规则API可用
- ✅ 阿里云Token服务可用

**Milestone 2（第2个月末）**: Phase 3完成
- ✅ 通话统计API可用
- ✅ 通话摘要生成可用
- ✅ 所有API通过测试

---

## 验收标准

### 功能性验收

#### 1. 通话记录
- [ ] 通话记录创建、查询、更新API正常
- [ ] 通话记录存储完整
- [ ] 通话详情查询正确
- [ ] 通话列表分页正常

#### 2. 通话统计
- [ ] 统计数据准确
- [ ] 多维度统计正常
- [ ] 趋势图数据正确

#### 3. 通话摘要
- [ ] 摘要生成准确率 > 80%
- [ ] 摘要生成时间 < 5秒
- [ ] 摘要内容简洁完整

#### 4. 阿里云服务
- [ ] Token获取成功率 > 99%
- [ ] Token缓存机制正常
- [ ] 配置管理正常

---

### 性能验收

#### 1. API响应时间
- [ ] 通话记录查询 < 100ms
- [ ] 通话列表查询 < 200ms
- [ ] 统计API响应 < 500ms
- [ ] 摘要生成 < 5s

#### 2. 数据库性能
- [ ] 通话记录写入 < 50ms
- [ ] 复杂统计查询 < 300ms

---

## 风险与应对

### 技术风险

#### 风险1: 阿里云服务不稳定
**影响**: Token获取失败，通话无法进行
**应对措施**:
- 实现Token缓存机制
- 准备备用Token
- 完善错误处理

---

## 交付物清单

### 代码交付物
- [ ] Go后端服务源代码（扩展）
- [ ] SQL Schema脚本（新增表）
- [ ] API文档（Swagger更新）
- [ ] 单元测试代码

### 文档交付物
- [ ] 通话记录服务文档
- [ ] 阿里云集成文档
- [ ] API使用文档

---

## 附录

### 附录A: 阿里云API参考

**Token获取**:
- 文档: https://help.aliyun.com/document_detail/72153.html

**ASR API**:
- 文档: https://help.aliyun.com/document_detail/84435.html

**TTS API**:
- 文档: https://help.aliyun.com/document_detail/84435.html

---

### 附录B: 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| V1.0 | 2025-11-08 | 初始版本 | 产品团队 |

---

**文档状态**: ✅ 完成  
**最后更新**: 2025-11-08

**下一步**: 
1. 查看 [Phase 3: 语音通话 - PC端迭代计划](./pc-client.md)
2. 开始 Phase 4 的迭代计划编写

