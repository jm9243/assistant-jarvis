# Phase 2: 三种Agent - 后台服务迭代计划

**阶段目标**: 建立AI服务基础架构，支持三种Agent类型  
**预计时间**: 2.5个月  
**依赖**: Phase 1 工作流系统完成

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

#### 1. Agent配置管理 (对应PRD 4.4.5)
- [ ] Agent CRUD API
- [ ] Agent配置存储
- [ ] Agent类型管理（Basic、ReAct、Deep Research）
- [ ] Agent模板管理
- [ ] Agent版本管理
- [ ] Agent分享与权限

#### 2. LLM服务代理 (对应PRD 4.4.1)
- [ ] OpenAI API集成
- [ ] Claude API集成
- [ ] Coze API集成
- [ ] 模型选择与切换
- [ ] 流式输出支持
- [ ] Token计数与管理
- [ ] 请求速率限制
- [ ] 错误重试机制

#### 3. 对话会话管理 (对应PRD 4.4.2)
- [ ] 会话CRUD API
- [ ] 会话消息存储
- [ ] 会话上下文管理
- [ ] 会话历史查询
- [ ] 会话导出功能

#### 4. 记忆系统 (对应PRD 4.4.2 + 4.8.2)
- [ ] 短期记忆API
- [ ] 长期记忆API
- [ ] 工作记忆API
- [ ] 记忆检索API
- [ ] 记忆管理API

#### 5. 知识库服务 (对应PRD 4.4.3 + 4.8.1)
- [ ] 知识库CRUD API
- [ ] 文档上传处理
- [ ] 文档解析与分块
- [ ] 向量化服务（PC端使用Chroma本地，云端元数据存储）
- [ ] 向量检索API（代理PC端Chroma检索）
- [ ] 关键词检索API
- [ ] 混合检索API
- [ ] Rerank重排序

#### 6. 工具管理服务 (对应PRD 4.4.4 + 4.9)
- [ ] 工具注册API
- [ ] 工具查询API
- [ ] 工具调用API
- [ ] 工具审批流程
- [ ] 工具调用日志
- [ ] 工具权限管理

#### 7. RAG服务 (对应PRD 4.8.3)
- [ ] 向量检索实现
- [ ] 关键词检索实现（使用pg_trgm）
- [ ] 混合检索策略
- [ ] Rerank服务集成
- [ ] 引用管理

---

## 核心功能详解

### 1. Agent配置管理

#### 1.1 数据库Schema扩展

**agents表**:
```sql
CREATE TYPE agent_type AS ENUM ('basic', 'react', 'deep_research');
CREATE TYPE agent_status AS ENUM ('active', 'inactive', 'archived');

CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type agent_type NOT NULL,
  status agent_status DEFAULT 'active',
  avatar_url TEXT,
  tags TEXT[],
  
  -- 模型配置
  model_config JSONB NOT NULL DEFAULT '{
    "provider": "openai",
    "model": "gpt-4-turbo",
    "temperature": 0.7,
    "max_tokens": 2000,
    "top_p": 1.0,
    "frequency_penalty": 0.0,
    "presence_penalty": 0.0
  }',
  
  -- Prompt配置
  system_prompt TEXT,
  prompt_template TEXT,
  
  -- 记忆配置
  memory_config JSONB DEFAULT '{
    "short_term": {
      "enabled": true,
      "window_size": 10
    },
    "long_term": {
      "enabled": true,
      "retention_days": 90
    },
    "working": {
      "enabled": true
    }
  }',
  
  -- 知识库绑定
  knowledge_base_ids UUID[],
  
  -- 工具绑定
  tool_ids TEXT[],
  
  -- ReAct Agent特定配置
  react_config JSONB,
  
  -- Deep Research Agent特定配置
  research_config JSONB,
  
  -- 统计信息
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_agents_user_id ON public.agents(user_id);
CREATE INDEX idx_agents_type ON public.agents(type);
CREATE INDEX idx_agents_status ON public.agents(status);

CREATE TRIGGER update_agents_updated_at
BEFORE UPDATE ON public.agents
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS策略
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agents"
  ON public.agents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own agents"
  ON public.agents FOR ALL
  USING (auth.uid() = user_id);
```

---

#### 1.2 Agent CRUD API

**创建Agent**:
```
POST /api/v1/agents
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "name": "智能客服",
  "description": "专业的客服助手",
  "type": "basic",
  "avatar_url": "https://...",
  "tags": ["客服", "问答"],
  "model_config": {
    "provider": "openai",
    "model": "gpt-4-turbo",
    "temperature": 0.7,
    "max_tokens": 2000
  },
  "system_prompt": "你是一个专业的客服助手...",
  "knowledge_base_ids": ["kb_id_1"],
  "tool_ids": ["tool_id_1", "tool_id_2"]
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "智能客服",
    "type": "basic",
    ...
  }
}
```

**获取Agent列表**:
```
GET /api/v1/agents
Authorization: Bearer <token>
Query Parameters:
  - type: Agent类型筛选
  - status: 状态筛选
  - page: 页码
  - page_size: 每页数量

Response:
{
  "success": true,
  "data": {
    "agents": [...],
    "pagination": {...}
  }
}
```

**获取Agent详情**:
```
GET /api/v1/agents/{agent_id}
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "智能客服",
    "type": "basic",
    "model_config": {...},
    "system_prompt": "...",
    "knowledge_base_ids": [...],
    "tool_ids": [...],
    "total_conversations": 100,
    "avg_response_time_ms": 1500,
    ...
  }
}
```

**更新Agent**:
```
PATCH /api/v1/agents/{agent_id}
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "name": "新名称",
  "system_prompt": "新的Prompt",
  ...
}

Response:
{
  "success": true,
  "data": {...}
}
```

**删除Agent**:
```
DELETE /api/v1/agents/{agent_id}
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Agent已删除"
}
```

---

### 2. LLM服务代理

#### 2.1 统一LLM接口

**功能描述**: 统一封装不同LLM提供商的API

**支持的提供商**:
- OpenAI (GPT-4, GPT-3.5)
- Anthropic Claude (Claude 3 Opus, Sonnet, Haiku)
- Coze (自定义Bot)

**统一接口设计**:
```go
type LLMProvider interface {
    // 流式聊天
    ChatStream(ctx context.Context, req *ChatRequest) (<-chan *ChatChunk, error)
    
    // 非流式聊天
    Chat(ctx context.Context, req *ChatRequest) (*ChatResponse, error)
    
    // Token计数
    CountTokens(text string) int
}

type ChatRequest struct {
    Messages []Message
    Model string
    Temperature float64
    MaxTokens int
    TopP float64
    FrequencyPenalty float64
    PresencePenalty float64
    Stop []string
    Stream bool
}

type Message struct {
    Role string // system, user, assistant
    Content string
}

type ChatChunk struct {
    Delta string
    FinishReason string
}

type ChatResponse struct {
    Content string
    FinishReason string
    Usage TokenUsage
}

type TokenUsage struct {
    PromptTokens int
    CompletionTokens int
    TotalTokens int
}
```

---

#### 2.2 OpenAI集成

```go
type OpenAIProvider struct {
    apiKey string
    baseURL string
    httpClient *http.Client
}

func (p *OpenAIProvider) ChatStream(ctx context.Context, req *ChatRequest) (<-chan *ChatChunk, error) {
    // 构建OpenAI API请求
    apiReq := map[string]interface{}{
        "model": req.Model,
        "messages": req.Messages,
        "temperature": req.Temperature,
        "max_tokens": req.MaxTokens,
        "top_p": req.TopP,
        "frequency_penalty": req.FrequencyPenalty,
        "presence_penalty": req.PresencePenalty,
        "stream": true,
    }
    
    // 发送请求
    resp, err := p.httpClient.Post(p.baseURL+"/chat/completions", "application/json", body)
    if err != nil {
        return nil, err
    }
    
    // 创建流式输出channel
    chunkChan := make(chan *ChatChunk)
    
    // 启动goroutine处理SSE流
    go func() {
        defer close(chunkChan)
        scanner := bufio.NewScanner(resp.Body)
        for scanner.Scan() {
            line := scanner.Text()
            if strings.HasPrefix(line, "data: ") {
                data := strings.TrimPrefix(line, "data: ")
                if data == "[DONE]" {
                    break
                }
                
                // 解析JSON
                var chunk OpenAIStreamChunk
                json.Unmarshal([]byte(data), &chunk)
                
                // 发送到channel
                chunkChan <- &ChatChunk{
                    Delta: chunk.Choices[0].Delta.Content,
                    FinishReason: chunk.Choices[0].FinishReason,
                }
            }
        }
    }()
    
    return chunkChan, nil
}
```

---

#### 2.3 Claude集成

```go
type ClaudeProvider struct {
    apiKey string
    baseURL string
    httpClient *http.Client
}

func (p *ClaudeProvider) ChatStream(ctx context.Context, req *ChatRequest) (<-chan *ChatChunk, error) {
    // Claude API格式与OpenAI略有不同
    apiReq := map[string]interface{}{
        "model": req.Model,
        "messages": transformMessages(req.Messages), // 转换消息格式
        "max_tokens": req.MaxTokens,
        "temperature": req.Temperature,
        "stream": true,
    }
    
    // 类似OpenAI的实现
    // ...
}
```

---

#### 2.4 LLM调用API

**聊天API（流式）**:
```
POST /api/v1/llm/chat/stream
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "provider": "openai",
  "model": "gpt-4-turbo",
  "messages": [
    {"role": "system", "content": "你是一个助手"},
    {"role": "user", "content": "你好"}
  ],
  "temperature": 0.7,
  "max_tokens": 2000,
  "stream": true
}

Response (Server-Sent Events):
data: {"delta": "你", "finish_reason": null}
data: {"delta": "好", "finish_reason": null}
data: {"delta": "！", "finish_reason": null}
data: {"delta": "", "finish_reason": "stop"}
data: [DONE]
```

**聊天API（非流式）**:
```
POST /api/v1/llm/chat
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "provider": "openai",
  "model": "gpt-4-turbo",
  "messages": [
    {"role": "system", "content": "你是一个助手"},
    {"role": "user", "content": "你好"}
  ],
  "temperature": 0.7
}

Response:
{
  "success": true,
  "data": {
    "content": "你好！我是你的AI助手，有什么可以帮助你的吗？",
    "finish_reason": "stop",
    "usage": {
      "prompt_tokens": 20,
      "completion_tokens": 15,
      "total_tokens": 35
    }
  }
}
```

---

### 3. 对话会话管理

#### 3.1 数据库Schema

**conversations表**:
```sql
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  summary TEXT,
  message_count INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conversations_agent_id ON public.conversations(agent_id);
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON public.conversations(updated_at DESC);

CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**messages表**:
```sql
CREATE TYPE message_role AS ENUM ('system', 'user', 'assistant', 'function');

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  token_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
```

---

#### 3.2 会话管理API

**创建会话**:
```
POST /api/v1/conversations
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "agent_id": "uuid",
  "title": "会话标题"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "agent_id": "uuid",
    "title": "会话标题",
    "message_count": 0,
    "created_at": "2025-11-08T10:00:00Z"
  }
}
```

**获取会话列表**:
```
GET /api/v1/conversations
Authorization: Bearer <token>
Query Parameters:
  - agent_id: Agent ID筛选
  - page: 页码
  - page_size: 每页数量

Response:
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "uuid",
        "agent_id": "uuid",
        "agent_name": "智能客服",
        "title": "会话标题",
        "summary": "会话摘要",
        "message_count": 10,
        "updated_at": "2025-11-08T10:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

**获取会话详情**:
```
GET /api/v1/conversations/{conversation_id}
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "agent_id": "uuid",
    "title": "会话标题",
    "messages": [
      {
        "id": "uuid",
        "role": "user",
        "content": "你好",
        "created_at": "2025-11-08T10:00:00Z"
      },
      {
        "id": "uuid",
        "role": "assistant",
        "content": "你好！有什么可以帮助你的？",
        "created_at": "2025-11-08T10:00:05Z"
      }
    ]
  }
}
```

**发送消息**:
```
POST /api/v1/conversations/{conversation_id}/messages
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "content": "帮我写一篇文章",
  "stream": true
}

Response (流式):
data: {"role": "assistant", "delta": "好的", "finish_reason": null}
data: {"role": "assistant", "delta": "，我", "finish_reason": null}
...
data: [DONE]

Response (非流式):
{
  "success": true,
  "data": {
    "id": "uuid",
    "role": "assistant",
    "content": "好的，我来帮你写一篇文章...",
    "token_count": 500,
    "created_at": "2025-11-08T10:00:10Z"
  }
}
```

---

### 4. 记忆系统

#### 4.1 数据库Schema

**memories表**:
```sql
CREATE TYPE memory_type AS ENUM ('short_term', 'long_term', 'working');

CREATE TABLE public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  type memory_type NOT NULL,
  key VARCHAR(255),
  value TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  importance_score FLOAT DEFAULT 0.5, -- 0-1，重要性评分
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_memories_agent_id ON public.memories(agent_id);
CREATE INDEX idx_memories_user_id ON public.memories(user_id);
CREATE INDEX idx_memories_type ON public.memories(type);
CREATE INDEX idx_memories_importance ON public.memories(importance_score DESC);
CREATE INDEX idx_memories_last_accessed ON public.memories(last_accessed_at DESC);
```

---

#### 4.2 记忆管理API

**保存记忆**:
```
POST /api/v1/memories
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "agent_id": "uuid",
  "type": "long_term",
  "key": "user_preference",
  "value": "用户喜欢简洁的回答",
  "importance_score": 0.8,
  "expires_at": "2025-12-31T23:59:59Z"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "long_term",
    "key": "user_preference",
    "value": "用户喜欢简洁的回答",
    "importance_score": 0.8
  }
}
```

**检索记忆**:
```
GET /api/v1/memories
Authorization: Bearer <token>
Query Parameters:
  - agent_id: Agent ID
  - type: 记忆类型
  - keyword: 关键词搜索
  - limit: 返回数量（默认10）
  - min_importance: 最小重要性（默认0）

Response:
{
  "success": true,
  "data": {
    "memories": [
      {
        "id": "uuid",
        "type": "long_term",
        "key": "user_preference",
        "value": "用户喜欢简洁的回答",
        "importance_score": 0.8,
        "access_count": 5,
        "created_at": "2025-11-01T00:00:00Z"
      }
    ]
  }
}
```

**更新记忆访问**:
```
POST /api/v1/memories/{memory_id}/access
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "记忆访问已更新"
}
```

---

### 5. 知识库服务

#### 5.1 架构说明

**重要架构决策**：
- **向量存储**：使用Chroma本地向量数据库（运行在PC端Python引擎中）
- **云端存储**：仅存储知识库元数据（文档信息、配置等）
- **检索方式**：Go后台API代理PC端Chroma的检索请求

**为什么这样设计**：
1. 隐私保护：向量数据保存在用户本地，不上传云端
2. 性能优化：本地检索速度更快，无网络延迟
3. 成本控制：无需云端向量数据库服务费用
4. 轻量部署：Chroma易于集成到Python引擎

#### 5.2 数据库Schema（仅元数据）

**知识库元数据表**:
```sql
-- 不需要pgvector扩展，仅存储元数据
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- 用于关键词检索（可选）
```

**knowledge_bases表**:
```sql
CREATE TABLE public.knowledge_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  embedding_model VARCHAR(100) DEFAULT 'text-embedding-ada-002',
  chunk_size INTEGER DEFAULT 500,
  chunk_overlap INTEGER DEFAULT 50,
  document_count INTEGER DEFAULT 0,
  vector_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_knowledge_bases_user_id ON public.knowledge_bases(user_id);
```

**documents表**:
```sql
CREATE TYPE document_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id UUID NOT NULL REFERENCES public.knowledge_bases(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL, -- Supabase Storage路径
  file_type VARCHAR(50), -- pdf, docx, txt, md, html
  file_size INTEGER, -- bytes
  status document_status DEFAULT 'pending',
  chunk_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_documents_kb_id ON public.documents(knowledge_base_id);
CREATE INDEX idx_documents_status ON public.documents(status);
```

**注意**：
- 不需要`document_chunks`表，分块和向量数据存储在PC端Chroma中
- 云端仅存储文档元数据和状态信息
- 文档文件存储在Supabase Storage中

---

#### 5.2 知识库管理API

**创建知识库**:
```
POST /api/v1/knowledge-bases
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "name": "产品文档",
  "description": "产品使用文档和FAQ",
  "embedding_model": "text-embedding-ada-002",
  "chunk_size": 500,
  "chunk_overlap": 50
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "产品文档",
    "document_count": 0,
    "vector_count": 0
  }
}
```

**上传文档**:
```
POST /api/v1/knowledge-bases/{kb_id}/documents
Authorization: Bearer <token>
Content-Type: multipart/form-data

Request Body:
  - file: 文档文件
  - metadata: JSON格式的元数据（可选）

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "product_guide.pdf",
    "status": "pending",
    "file_size": 1024000
  }
}
```

**文档处理流程**:
```
文档上传 → 存储到Supabase Storage
    ↓
Go后台通知PC端Python引擎处理
    ↓
PC端下载文档并解析（使用python-docx、PyPDF2等）
    ↓
文本分块（按chunk_size和chunk_overlap）
    ↓
调用Embedding API生成向量
    ↓
存储向量到PC端Chroma数据库
    ↓
PC端通知Go后台更新文档状态为completed
```

---

#### 5.3 向量检索API（代理模式）

**向量相似度搜索**:
```
POST /api/v1/knowledge-bases/{kb_id}/search/vector
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "query": "如何重置密码？",
  "top_k": 5,
  "min_similarity": 0.7
}

Response:
{
  "success": true,
  "data": {
    "results": [
      {
        "chunk_id": "uuid",
        "content": "重置密码的步骤如下：1. 点击忘记密码...",
        "similarity": 0.92,
        "document_name": "用户指南.pdf",
        "metadata": {...}
      },
      ...
    ]
  }
}
```

**实现方式**:
```go
func VectorSearch(c *gin.Context) {
  kbID := c.Param("kb_id")
  
  var req struct {
    Query         string  `json:"query"`
    TopK          int     `json:"top_k"`
    MinSimilarity float64 `json:"min_similarity"`
  }
  c.ShouldBindJSON(&req)
  
  // 方案1：通过WebSocket通知PC端执行检索
  result, err := notifyPCSearch(userID, kbID, req)
  
  // 方案2：PC端主动轮询检索任务（如果WebSocket不可用）
  // taskID := createSearchTask(userID, kbID, req)
  // result := waitForSearchResult(taskID)
  
  c.JSON(http.StatusOK, result)
}
```

**注意**：
- Go后台不直接访问Chroma，而是通过PC端代理
- 需要PC端在线才能执行检索
- 可以考虑缓存常见查询结果

---

#### 5.4 关键词检索API

**关键词检索**:
```
POST /api/v1/knowledge-bases/{kb_id}/search/keyword
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "query": "密码 重置",
  "top_k": 5
}

Response:
{
  "success": true,
  "data": {
    "results": [
      {
        "chunk_id": "uuid",
        "content": "重置密码的步骤...",
        "score": 0.85,
        "document_name": "用户指南.pdf"
      },
      ...
    ]
  }
}
```

**SQL实现（使用pg_trgm）**:
```sql
SELECT 
  dc.id,
  dc.content,
  similarity(dc.content, $1) AS score,
  d.name AS document_name
FROM document_chunks dc
JOIN documents d ON dc.document_id = d.id
WHERE dc.knowledge_base_id = $2
  AND dc.content % $1 -- trigram similarity operator
ORDER BY similarity(dc.content, $1) DESC
LIMIT $3;
```

---

#### 5.5 混合检索API

**混合检索**:
```
POST /api/v1/knowledge-bases/{kb_id}/search/hybrid
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "query": "如何重置密码？",
  "top_k": 10,
  "rerank": true,
  "rerank_top_k": 3
}

Response:
{
  "success": true,
  "data": {
    "results": [
      {
        "chunk_id": "uuid",
        "content": "重置密码的步骤...",
        "vector_similarity": 0.92,
        "keyword_score": 0.85,
        "final_score": 0.89,
        "document_name": "用户指南.pdf"
      },
      ...
    ]
  }
}
```

**混合检索策略**:
```go
func HybridSearch(kbID, query string, topK int) ([]Result, error) {
    // 1. 向量检索，获取top_k*2个结果
    vectorResults := VectorSearch(kbID, query, topK*2)
    
    // 2. 关键词检索，获取top_k*2个结果
    keywordResults := KeywordSearch(kbID, query, topK*2)
    
    // 3. 合并结果（去重）
    mergedResults := MergeResults(vectorResults, keywordResults)
    
    // 4. 重新排序（RRF - Reciprocal Rank Fusion）
    for i, result := range mergedResults {
        vectorRank := getRank(result.ID, vectorResults)
        keywordRank := getRank(result.ID, keywordResults)
        
        // RRF公式
        result.FinalScore = 1/(vectorRank+60) + 1/(keywordRank+60)
    }
    
    // 5. 排序并返回top_k
    sort.Slice(mergedResults, func(i, j int) bool {
        return mergedResults[i].FinalScore > mergedResults[j].FinalScore
    })
    
    return mergedResults[:topK], nil
}
```

---

#### 5.6 Rerank重排序

**功能描述**: 使用专门的Rerank模型对检索结果进行二次精细排序

**Rerank API调用**:
```go
func RerankResults(query string, results []Result, topK int) ([]Result, error) {
    // 调用Rerank模型API（如Cohere Rerank）
    rerankReq := map[string]interface{}{
        "model": "rerank-multilingual-v2.0",
        "query": query,
        "documents": extractContents(results),
        "top_n": topK,
    }
    
    resp, err := http.Post("https://api.cohere.ai/v1/rerank", rerankReq)
    // ...
    
    // 根据Rerank结果重新排序
    rerankedResults := applyRerankScores(results, rerankResponse)
    
    return rerankedResults[:topK], nil
}
```

---

### 6. 工具管理服务

#### 6.1 数据库Schema

**tools表**:
```sql
CREATE TYPE tool_type AS ENUM ('workflow', 'mcp', 'http', 'system', 'builtin');
CREATE TYPE tool_approval_policy AS ENUM ('auto', 'required', 'manual');

CREATE TABLE public.tools (
  id VARCHAR(255) PRIMARY KEY, -- tool_workflow_xxx, tool_mcp_xxx
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type tool_type NOT NULL,
  category VARCHAR(100),
  
  -- 工具定义（JSON Schema格式）
  parameters_schema JSONB NOT NULL,
  
  -- 工具配置
  config JSONB DEFAULT '{}',
  
  -- 审批策略
  approval_policy tool_approval_policy DEFAULT 'required',
  
  -- 权限配置
  allowed_agent_ids UUID[],
  rate_limit INTEGER DEFAULT 100, -- 每小时调用次数限制
  
  -- 统计信息
  total_calls INTEGER DEFAULT 0,
  success_calls INTEGER DEFAULT 0,
  failed_calls INTEGER DEFAULT 0,
  avg_execution_time_ms INTEGER,
  
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tools_type ON public.tools(type);
CREATE INDEX idx_tools_user_id ON public.tools(user_id);
```

**tool_calls表**:
```sql
CREATE TYPE tool_call_status AS ENUM ('pending', 'approved', 'rejected', 'executing', 'completed', 'failed');

CREATE TABLE public.tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id VARCHAR(255) NOT NULL REFERENCES public.tools(id),
  agent_id UUID REFERENCES public.agents(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  conversation_id UUID REFERENCES public.conversations(id),
  
  -- 调用参数
  input_params JSONB NOT NULL,
  
  -- 执行结果
  output_result JSONB,
  error_message TEXT,
  
  -- 状态
  status tool_call_status DEFAULT 'pending',
  
  -- 审批信息
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- 性能指标
  execution_time_ms INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_tool_calls_tool_id ON public.tool_calls(tool_id);
CREATE INDEX idx_tool_calls_agent_id ON public.tool_calls(agent_id);
CREATE INDEX idx_tool_calls_user_id ON public.tool_calls(user_id);
CREATE INDEX idx_tool_calls_status ON public.tool_calls(status);
```

---

#### 6.2 工具管理API

**注册工具**:
```
POST /api/v1/tools
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "id": "tool_workflow_001",
  "name": "数据提取工具",
  "description": "从网页提取数据",
  "type": "workflow",
  "category": "automation",
  "parameters_schema": {
    "type": "object",
    "properties": {
      "url": {
        "type": "string",
        "description": "目标网页URL"
      },
      "selector": {
        "type": "string",
        "description": "CSS选择器"
      }
    },
    "required": ["url"]
  },
  "config": {
    "workflow_id": "workflow_uuid"
  },
  "approval_policy": "required"
}

Response:
{
  "success": true,
  "data": {
    "id": "tool_workflow_001",
    "name": "数据提取工具",
    "type": "workflow",
    ...
  }
}
```

**获取工具列表**:
```
GET /api/v1/tools
Authorization: Bearer <token>
Query Parameters:
  - type: 工具类型筛选
  - category: 分类筛选
  - keyword: 搜索关键词

Response:
{
  "success": true,
  "data": {
    "tools": [
      {
        "id": "tool_workflow_001",
        "name": "数据提取工具",
        "description": "从网页提取数据",
        "type": "workflow",
        "approval_policy": "required",
        "total_calls": 100
      },
      ...
    ]
  }
}
```

---

#### 6.3 工具调用API

**调用工具**:
```
POST /api/v1/tools/{tool_id}/call
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "agent_id": "uuid",
  "conversation_id": "uuid",
  "params": {
    "url": "https://example.com",
    "selector": ".content"
  }
}

Response（需要审批）:
{
  "success": true,
  "data": {
    "call_id": "uuid",
    "status": "pending",
    "message": "等待审批"
  }
}

Response（自动执行）:
{
  "success": true,
  "data": {
    "call_id": "uuid",
    "status": "completed",
    "result": {
      "data": "提取的内容..."
    },
    "execution_time_ms": 1500
  }
}
```

---

#### 6.4 工具审批API

**获取待审批列表**:
```
GET /api/v1/tool-calls/pending
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "pending_calls": [
      {
        "call_id": "uuid",
        "tool_id": "tool_workflow_001",
        "tool_name": "数据提取工具",
        "agent_name": "智能助手",
        "input_params": {...},
        "created_at": "2025-11-08T10:00:00Z"
      },
      ...
    ]
  }
}
```

**审批工具调用**:
```
POST /api/v1/tool-calls/{call_id}/approve
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "action": "approve" // or "reject",
  "reason": "拒绝原因（如果拒绝）"
}

Response:
{
  "success": true,
  "data": {
    "call_id": "uuid",
    "status": "approved",
    "message": "工具调用已批准，正在执行"
  }
}
```

---

## 技术架构

### Go后端服务架构扩展

```
┌──────────────────────────────────────────────────────────┐
│                     Go后端服务                            │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              新增业务服务层                          │ │
│  │                                                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │ │
│  │  │  Agent服务   │  │  会话服务    │  │ 记忆服务 │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────┘  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │ │
│  │  │  知识库服务  │  │  工具服务    │  │ RAG服务  │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────┘  │ │
│  │  ┌──────────────┐                                   │ │
│  │  │  LLM代理服务 │                                   │ │
│  │  └──────────────┘                                   │ │
│  └─────────────────────────────────────────────────────┘ │
│                         ↓                                 │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              第三方服务集成层                        │ │
│  │                                                      │ │
│  │  - OpenAI API Client                                │ │
│  │  - Claude API Client                                │ │
│  │  - Coze API Client                                  │ │
│  │  - Embedding Service                                │ │
│  │  - Rerank Service (Cohere)                          │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│                   Supabase平台（扩展）                    │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ PostgreSQL   │  │   Supabase   │  │   Chroma     │   │
│  │ (元数据)     │  │   Storage    │  │ (PC端本地)   │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

### 项目结构扩展

```
backend/
├── internal/
│   ├── api/
│   │   ├── agents.go              # Agent相关API
│   │   ├── conversations.go       # 会话相关API
│   │   ├── memories.go            # 记忆相关API
│   │   ├── knowledge_bases.go     # 知识库相关API
│   │   ├── tools.go               # 工具相关API
│   │   └── llm.go                 # LLM代理API
│   ├── service/
│   │   ├── agent_service.go
│   │   ├── conversation_service.go
│   │   ├── memory_service.go
│   │   ├── knowledge_base_service.go
│   │   ├── tool_service.go
│   │   ├── llm_service.go
│   │   └── rag_service.go
│   ├── llm/                       # LLM提供商集成
│   │   ├── provider.go            # 统一接口
│   │   ├── openai.go              # OpenAI实现
│   │   ├── claude.go              # Claude实现
│   │   └── coze.go                # Coze实现
│   ├── knowledge/                 # 知识库服务
│   │   ├── metadata.go            # 元数据管理
│   │   ├── proxy.go               # 检索代理（代理PC端Chroma）
│   │   └── sync.go                # 状态同步
│   └── rag/                       # RAG实现
│       ├── retriever.go           # 检索器
│       ├── reranker.go            # 重排序
│       └── hybrid.go              # 混合检索
```

---

## 开发计划

### 时间线（共2.5个月）

#### 第1个月：Agent基础与LLM集成

**Week 1-2: Agent配置管理**
- [ ] 设计并创建Agent相关数据库表
- [ ] 实现Agent CRUD API
- [ ] 实现Agent配置管理
- [ ] Agent模板管理

**Week 3-4: LLM服务代理**
- [ ] 设计统一LLM接口
- [ ] 实现OpenAI集成（流式+非流式）
- [ ] 实现Claude集成
- [ ] 实现Coze集成（可选）
- [ ] Token计数与管理
- [ ] 错误重试与限流

---

#### 第2个月：知识库与对话管理

**Week 5-6: 知识库服务**
- [ ] 创建知识库元数据表（仅元数据，不含向量）
- [ ] 实现知识库管理API
- [ ] 实现文档上传API（上传到Supabase Storage）
- [ ] 实现PC端通知机制（通知PC端处理文档）
- [ ] 实现检索代理API（代理PC端Chroma检索）
- [ ] 实现文档状态同步

**Week 7-8: 检索与对话**
- [ ] 实现向量检索API
- [ ] 实现关键词检索API
- [ ] 实现混合检索
- [ ] 集成Rerank服务
- [ ] 实现会话管理API
- [ ] 实现消息存储与查询
- [ ] 实现流式对话API

---

#### 第3个月：记忆系统与工具管理

**Week 9-10: 记忆系统与工具管理**
- [ ] 创建记忆系统数据库表
- [ ] 实现记忆管理API
- [ ] 实现短期/长期/工作记忆
- [ ] 创建工具管理数据库表
- [ ] 实现工具注册API
- [ ] 实现工具调用API
- [ ] 实现工具审批流程

**Week 11: 测试与优化**
- [ ] 集成测试
- [ ] 性能测试（向量检索、LLM调用）
- [ ] 优化数据库查询
- [ ] 优化向量检索速度
- [ ] Bug修复
- [ ] 文档完善

---

### 开发任务分配建议

**Go后端团队（2人）**:
- 工程师A: Agent服务、LLM代理服务、会话管理
- 工程师B: 知识库服务、RAG服务、工具管理

**Python数据处理（0.5人，兼职）**:
- 文档解析与分块脚本
- Embedding生成脚本

---

### 开发里程碑

**Milestone 1（第1个月末）**: Agent与LLM集成完成
- ✅ Agent配置管理API可用
- ✅ LLM服务代理可用（OpenAI + Claude）
- ✅ 基础对话功能可用

**Milestone 2（第2个月末）**: 知识库与RAG完成
- ✅ 知识库管理API可用
- ✅ 文档上传与向量化可用
- ✅ 向量检索、关键词检索可用
- ✅ 混合检索与Rerank可用

**Milestone 3（第2.5个月末）**: Phase 2完成
- ✅ 记忆系统完整可用
- ✅ 工具管理完整可用
- ✅ 所有API通过测试
- ✅ 性能达标

---

## 验收标准

### 功能性验收

#### 1. Agent管理
- [ ] Agent创建、查询、更新、删除API正常
- [ ] Agent配置保存和加载正确
- [ ] 支持三种Agent类型（Basic、ReAct、Deep Research）
- [ ] Agent模板功能正常

#### 2. LLM服务
- [ ] OpenAI API调用正常（流式+非流式）
- [ ] Claude API调用正常
- [ ] Token计数准确
- [ ] 流式输出稳定
- [ ] 错误处理和重试机制正常

#### 3. 对话管理
- [ ] 会话创建、查询、更新、删除API正常
- [ ] 消息发送和接收正常
- [ ] 流式对话输出流畅
- [ ] 会话历史查询正确

#### 4. 知识库服务
- [ ] 知识库创建和管理API正常
- [ ] 文档上传功能正常
- [ ] 文档解析支持多种格式（PDF、DOCX、TXT、MD）
- [ ] 文档分块逻辑正确
- [ ] 向量化处理正常

#### 5. RAG检索
- [ ] 向量检索准确率 > 80%
- [ ] 关键词检索正常
- [ ] 混合检索效果优于单一检索
- [ ] Rerank提升检索准确率
- [ ] 检索响应时间 < 500ms

#### 6. 记忆系统
- [ ] 短期记忆正常工作
- [ ] 长期记忆持久化正确
- [ ] 工作记忆临时存储正常
- [ ] 记忆检索准确

#### 7. 工具管理
- [ ] 工具注册API正常
- [ ] 工具调用API正常
- [ ] 工具审批流程正常
- [ ] 工具调用日志完整
- [ ] 工具权限控制有效

---

### 性能验收

#### 1. API响应时间
- [ ] Agent管理API响应 < 100ms
- [ ] 会话管理API响应 < 100ms
- [ ] LLM调用首字延迟 < 2s
- [ ] 向量检索响应 < 300ms
- [ ] 混合检索响应 < 500ms

#### 2. 并发性能
- [ ] 支持50并发LLM请求
- [ ] 支持100并发向量检索
- [ ] 流式输出稳定（无丢包）

#### 3. 数据库性能
- [ ] 向量检索（1536维，10万向量）< 300ms
- [ ] 关键词检索 < 100ms
- [ ] Agent配置查询 < 50ms

---

### 可靠性验收

#### 1. LLM调用
- [ ] LLM API调用失败自动重试
- [ ] 超时处理正确
- [ ] 流式输出中断可恢复

#### 2. 向量检索
- [ ] 向量索引正确建立
- [ ] 检索结果稳定
- [ ] 大规模数据下性能稳定

#### 3. 数据一致性
- [ ] Agent配置保存后可正确读取
- [ ] 会话消息顺序正确
- [ ] 记忆数据持久化可靠

---

## 风险与应对

### 技术风险

#### 风险1: Chroma性能不足（大规模数据）
**影响**: 大规模向量检索变慢
**应对措施**:
- Chroma支持HNSW索引，性能已足够
- 合理设置向量维度（推荐1536维）
- 单个知识库建议不超过10万文档
- 必要时可以分库存储

#### 风险2: LLM API调用不稳定
**影响**: 用户体验差，对话中断
**应对措施**:
- 实现完善的重试机制
- 多个API Key轮询
- 准备备用LLM提供商

#### 风险3: 文档解析失败率高
**影响**: 知识库内容不完整
**应对措施**:
- 使用成熟的文档解析库
- 支持多种解析策略
- 提供手动重试机制

---

### 进度风险

#### 风险1: LLM集成复杂度高
**影响**: 第1个月进度延迟
**应对措施**:
- 先实现OpenAI，其他提供商渐进实现
- 准备充足的测试用例
- 参考开源项目经验

#### 风险2: 向量检索优化耗时
**影响**: 第2个月进度紧张
**应对措施**:
- 先实现基础功能，后优化性能
- 使用pgvector官方推荐配置
- 及时进行性能测试

---

## 交付物清单

### 代码交付物
- [ ] Go后端服务源代码（扩展）
- [ ] SQL Schema脚本（新增表）
- [ ] 文档处理脚本（Python）
- [ ] API文档（Swagger更新）
- [ ] 单元测试代码

### 文档交付物
- [ ] Agent服务技术文档
- [ ] LLM集成文档
- [ ] 知识库服务文档
- [ ] RAG实现文档
- [ ] 向量检索优化文档

### 配置交付物
- [ ] Chroma配置说明（PC端）
- [ ] LLM API配置模板
- [ ] 环境变量配置

---

## 后续计划

Phase 2完成后，进入Phase 3: 语音通话功能开发。

**Phase 3的后端服务需求**:
- ✅ 通话记录存储API
- ✅ 阿里云智能媒体服务集成
- ✅ 通话统计API

**Phase 2需要预留的扩展点**:
- [ ] Agent配置预留通话相关字段
- [ ] 会话支持语音消息类型
- [ ] 工具调用支持通话控制

---

## 附录

### 附录A: OpenAI API参考

**Chat Completions API**:
```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-4-turbo",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello!"}
    ],
    "stream": true
  }'
```

**Embeddings API**:
```bash
curl https://api.openai.com/v1/embeddings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "text-embedding-ada-002",
    "input": "Your text here"
  }'
```

---

### 附录B: Chroma配置说明（PC端）

**Chroma初始化**（在Python引擎中）:
```python
import chromadb
from chromadb.config import Settings

# 创建持久化客户端
client = chromadb.PersistentClient(
    path="./data/chroma",
    settings=Settings(
        anonymized_telemetry=False,
        allow_reset=True
    )
)

# 创建或获取集合
collection = client.get_or_create_collection(
    name="knowledge_base_xxx",
    metadata={"hnsw:space": "cosine"}  # 使用余弦相似度
)

# 添加文档
collection.add(
    documents=["文档内容..."],
    embeddings=[[0.1, 0.2, ...]],
    metadatas=[{"source": "doc.pdf"}],
    ids=["chunk_1"]
)

# 查询
results = collection.query(
    query_embeddings=[[0.1, 0.2, ...]],
    n_results=10,
    where={"source": "doc.pdf"}  # 可选过滤
)
```

**性能优化**:
- Chroma默认使用HNSW索引，性能已优化
- 建议每个知识库独立collection
- 定期备份Chroma数据目录

---

### 附录C: 环境变量配置（新增）

```bash
# LLM API配置
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://api.openai.com/v1
CLAUDE_API_KEY=sk-ant-xxx
CLAUDE_BASE_URL=https://api.anthropic.com
COZE_API_KEY=xxx
COZE_BOT_ID=xxx

# Embedding配置
EMBEDDING_MODEL=text-embedding-ada-002
EMBEDDING_DIMENSIONS=1536

# Rerank配置
COHERE_API_KEY=xxx
RERANK_MODEL=rerank-multilingual-v2.0

# 向量检索配置
VECTOR_SEARCH_TOP_K=20
VECTOR_MIN_SIMILARITY=0.7
KEYWORD_SEARCH_TOP_K=20
HYBRID_RERANK_TOP_K=10

# 记忆系统配置
SHORT_TERM_MEMORY_WINDOW=10
LONG_TERM_MEMORY_RETENTION_DAYS=90
```

---

### 附录D: 常见问题

**Q1: 为什么选择Chroma而不是云端向量数据库？**
A: 
1. 隐私保护：向量数据保存在用户本地
2. 性能优化：本地检索无网络延迟
3. 成本控制：无需云端向量数据库费用
4. 轻量部署：Chroma易于集成到Python引擎
5. 规模适中：单个知识库10万文档内性能足够

**Q2: 文档分块的最佳实践是什么？**
A: 一般chunk_size设为500-1000字符，chunk_overlap设为50-100字符。具体需根据文档类型调整。

**Q3: 如何选择Embedding模型？**
A: OpenAI的text-embedding-ada-002是性价比最高的选择。如果需要多语言支持，可以考虑text-embedding-3-large。

**Q4: 混合检索的权重如何设置？**
A: 使用RRF（Reciprocal Rank Fusion）算法，无需手动设置权重。如果需要调整，可以修改RRF的k参数（默认60）。

**Q5: Agent调用LLM的成本如何控制？**
A: 1. 使用Token计数限制输出长度；2. 缓存常见问题的回答；3. 使用更便宜的模型（如gpt-3.5-turbo）处理简单问题。

---

### 附录E: 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| V1.0 | 2025-11-08 | 初始版本 | 产品团队 |

---

**文档状态**: ✅ 完成  
**最后更新**: 2025-11-08

**下一步**: 
1. 查看 [Phase 2: 三种Agent - PC端迭代计划](./pc-client.md)
2. 开始 Phase 3 的迭代计划编写

