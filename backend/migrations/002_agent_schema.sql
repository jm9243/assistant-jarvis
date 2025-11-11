-- Phase 2: Agent 系统 - 数据库 Schema
-- 执行方式：在 Supabase SQL Editor 中执行此脚本

-- ============================================
-- 1. 启用扩展
-- ============================================

-- 启用 pgvector 扩展（向量检索）
CREATE EXTENSION IF NOT EXISTS vector;

-- 启用 pg_trgm 扩展（全文检索）
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- 2. Agent 配置表
-- ============================================

CREATE TYPE agent_type AS ENUM ('basic', 'react', 'deep_research');
CREATE TYPE agent_status AS ENUM ('active', 'inactive', 'archived');

CREATE TABLE IF NOT EXISTS public.agents (
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
  
  -- Prompt 配置
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
  
  -- ReAct Agent 特定配置
  react_config JSONB,
  
  -- Deep Research Agent 特定配置
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
CREATE INDEX idx_agents_tags ON public.agents USING GIN(tags);

CREATE TRIGGER update_agents_updated_at
BEFORE UPDATE ON public.agents
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. 对话会话表
-- ============================================

CREATE TABLE IF NOT EXISTS public.conversations (
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

-- ============================================
-- 4. 消息表
-- ============================================

CREATE TYPE message_role AS ENUM ('system', 'user', 'assistant', 'function');

CREATE TABLE IF NOT EXISTS public.messages (
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

-- ============================================
-- 5. 记忆表
-- ============================================

CREATE TYPE memory_type AS ENUM ('short_term', 'long_term', 'working');

CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  type memory_type NOT NULL,
  key VARCHAR(255),
  value TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  importance_score FLOAT DEFAULT 0.5,
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

-- ============================================
-- 6. 知识库表
-- ============================================

CREATE TABLE IF NOT EXISTS public.knowledge_bases (
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

CREATE TRIGGER update_knowledge_bases_updated_at
BEFORE UPDATE ON public.knowledge_bases
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. 文档表
-- ============================================

CREATE TYPE document_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id UUID NOT NULL REFERENCES public.knowledge_bases(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  status document_status DEFAULT 'pending',
  chunk_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_documents_kb_id ON public.documents(knowledge_base_id);
CREATE INDEX idx_documents_status ON public.documents(status);

-- ============================================
-- 8. 文档分块表（带向量）
-- ============================================

CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  knowledge_base_id UUID NOT NULL REFERENCES public.knowledge_bases(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  chunk_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chunks_document_id ON public.document_chunks(document_id);
CREATE INDEX idx_chunks_kb_id ON public.document_chunks(knowledge_base_id);

-- 向量相似度搜索索引（HNSW 算法）
CREATE INDEX idx_chunks_embedding_hnsw 
ON public.document_chunks 
USING hnsw (embedding vector_cosine_ops);

-- 全文搜索索引
CREATE INDEX idx_chunks_content_trgm 
ON public.document_chunks 
USING gin (content gin_trgm_ops);

-- ============================================
-- 9. 工具表
-- ============================================

CREATE TYPE tool_type AS ENUM ('workflow', 'mcp', 'http', 'system', 'builtin');
CREATE TYPE tool_approval_policy AS ENUM ('auto', 'required', 'manual');

CREATE TABLE IF NOT EXISTS public.tools (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type tool_type NOT NULL,
  category VARCHAR(100),
  
  -- 工具定义（JSON Schema 格式）
  parameters_schema JSONB NOT NULL,
  
  -- 工具配置
  config JSONB DEFAULT '{}',
  
  -- 审批策略
  approval_policy tool_approval_policy DEFAULT 'required',
  
  -- 权限配置
  allowed_agent_ids UUID[],
  rate_limit INTEGER DEFAULT 100,
  
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

CREATE TRIGGER update_tools_updated_at
BEFORE UPDATE ON public.tools
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. 工具调用记录表
-- ============================================

CREATE TYPE tool_call_status AS ENUM ('pending', 'approved', 'rejected', 'executing', 'completed', 'failed');

CREATE TABLE IF NOT EXISTS public.tool_calls (
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

-- ============================================
-- 11. Row Level Security (RLS) 策略
-- ============================================

-- 启用 RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_calls ENABLE ROW LEVEL SECURITY;

-- agents 策略
CREATE POLICY "Users can view own agents"
  ON public.agents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own agents"
  ON public.agents FOR ALL
  USING (auth.uid() = user_id);

-- conversations 策略
CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own conversations"
  ON public.conversations FOR ALL
  USING (auth.uid() = user_id);

-- messages 策略
CREATE POLICY "Users can view messages in own conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in own conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- memories 策略
CREATE POLICY "Users can view own memories"
  ON public.memories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own memories"
  ON public.memories FOR ALL
  USING (auth.uid() = user_id);

-- knowledge_bases 策略
CREATE POLICY "Users can view own knowledge bases"
  ON public.knowledge_bases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own knowledge bases"
  ON public.knowledge_bases FOR ALL
  USING (auth.uid() = user_id);

-- documents 策略
CREATE POLICY "Users can view documents in own knowledge bases"
  ON public.documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.knowledge_bases
      WHERE knowledge_bases.id = documents.knowledge_base_id
      AND knowledge_bases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage documents in own knowledge bases"
  ON public.documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.knowledge_bases
      WHERE knowledge_bases.id = documents.knowledge_base_id
      AND knowledge_bases.user_id = auth.uid()
    )
  );

-- document_chunks 策略
CREATE POLICY "Users can view chunks in own knowledge bases"
  ON public.document_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.knowledge_bases
      WHERE knowledge_bases.id = document_chunks.knowledge_base_id
      AND knowledge_bases.user_id = auth.uid()
    )
  );

-- tools 策略
CREATE POLICY "Users can view own tools"
  ON public.tools FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can manage own tools"
  ON public.tools FOR ALL
  USING (auth.uid() = user_id);

-- tool_calls 策略
CREATE POLICY "Users can view own tool calls"
  ON public.tool_calls FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tool calls"
  ON public.tool_calls FOR ALL
  USING (auth.uid() = user_id);
