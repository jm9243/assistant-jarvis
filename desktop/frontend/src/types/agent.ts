/**
 * Agent相关类型定义
 */

export type AgentType = "basic" | "react" | "deep_research";

export type LLMProvider = "openai" | "claude";

export interface ModelConfig {
  provider: LLMProvider;
  model: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  // API Key 和 base_url 由后台统一管理，客户端不需要配置
  supports_vision?: boolean;
}

export interface MemoryConfig {
  short_term?: {
    enabled: boolean;
    window_size: number;
  };
  long_term?: {
    enabled: boolean;
    retention_days: number;
  };
  working?: {
    enabled: boolean;
  };
}

export interface AgentConfig {
  id: string;
  user_id: string;
  name: string;
  description: string;
  type: AgentType;
  avatar_url?: string;
  tags: string[];
  llm_config: ModelConfig;
  system_prompt: string;
  prompt_template?: string;
  memory_config: MemoryConfig;
  knowledge_base_ids: string[];
  tool_ids: string[];
  react_config?: {
    max_iterations: number;
  };
  research_config?: {
    complexity_threshold: number;
    max_subtasks: number;
  };
  created_at: string;
  updated_at: string;
}

export interface AgentCreateRequest {
  name: string;
  description: string;
  type: AgentType;
  avatar_url?: string;
  tags?: string[];
  llm_config: ModelConfig;
  system_prompt: string;
  prompt_template?: string;
  memory_config?: MemoryConfig;
  knowledge_base_ids?: string[];
  tool_ids?: string[];
  react_config?: {
    max_iterations: number;
  };
  research_config?: {
    complexity_threshold: number;
    max_subtasks: number;
  };
}

export interface AgentUpdateRequest {
  name?: string;
  description?: string;
  avatar_url?: string;
  tags?: string[];
  llm_config?: ModelConfig;
  system_prompt?: string;
  prompt_template?: string;
  memory_config?: MemoryConfig;
  knowledge_base_ids?: string[];
  tool_ids?: string[];
  react_config?: {
    max_iterations: number;
  };
  research_config?: {
    complexity_threshold: number;
    max_subtasks: number;
  };
}

export interface Conversation {
  id: string;
  agent_id: string;
  user_id: string;
  title: string;
  summary?: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "system" | "user" | "assistant" | "function";
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface MessageSendRequest {
  content: string;
  stream?: boolean;
  attachments?: Array<{
    type: "image" | "file";
    url?: string;
    path?: string;
  }>;
}

export interface KnowledgeBase {
  id: string;
  user_id: string;
  name: string;
  description: string;
  embedding_model: string;
  chunk_size: number;
  chunk_overlap: number;
  document_count: number;
  vector_count: number;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  knowledge_base_id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  status: "pending" | "processing" | "completed" | "failed";
  chunk_count: number;
  error_message?: string;
  created_at: string;
  processed_at?: string;
}

export interface SearchResult {
  content: string;
  similarity: number;
  document_name: string;
  metadata: Record<string, any>;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  type: "workflow" | "mcp" | "http" | "system" | "builtin";
  category: string;
  parameters_schema: Record<string, any>;
  config: Record<string, any>;
  approval_policy: "auto" | "required" | "manual";
  allowed_agents: string[];
  is_enabled: boolean;
  created_at: string;
}

export interface ToolCall {
  id: string;
  tool_id: string;
  agent_id: string;
  conversation_id: string;
  input_params: Record<string, any>;
  output_result?: Record<string, any>;
  status: "pending" | "approved" | "rejected" | "executing" | "completed" | "failed";
  execution_time_ms?: number;
  created_at: string;
  completed_at?: string;
}

export interface AgentTemplate {
  id: string;
  user_id?: string;
  name: string;
  description: string;
  category: string;
  type: AgentType;
  tags: string[];
  icon: string;
  is_system: boolean;
  is_public: boolean;
  config: {
    system_prompt: string;
    llm_config: Partial<ModelConfig>;
    memory_config?: MemoryConfig;
    react_config?: {
      max_iterations: number;
    };
    research_config?: {
      complexity_threshold: number;
      max_subtasks: number;
    };
  };
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface AgentTemplateCreateRequest {
  name: string;
  description: string;
  category: string;
  type: AgentType;
  tags?: string[];
  icon?: string;
  is_public?: boolean;
  config: AgentTemplate["config"];
}

export interface AgentTemplateQueryParams {
  category?: string;
  type?: AgentType;
  tags?: string[];
  search?: string;
  is_system?: boolean;
  is_public?: boolean;
  page?: number;
  page_size?: number;
}
