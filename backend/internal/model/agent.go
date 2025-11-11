package model

import "time"

// AgentType Agent 类型
type AgentType string

const (
	AgentTypeBasic         AgentType = "basic"
	AgentTypeReAct         AgentType = "react"
	AgentTypeDeepResearch  AgentType = "deep_research"
)

// AgentStatus Agent 状态
type AgentStatus string

const (
	AgentStatusActive   AgentStatus = "active"
	AgentStatusInactive AgentStatus = "inactive"
	AgentStatusArchived AgentStatus = "archived"
)

// Agent Agent 配置
type Agent struct {
	ID                  string                 `json:"id" db:"id"`
	UserID              string                 `json:"user_id" db:"user_id"`
	Name                string                 `json:"name" db:"name"`
	Description         string                 `json:"description" db:"description"`
	Type                AgentType              `json:"type" db:"type"`
	Status              AgentStatus            `json:"status" db:"status"`
	AvatarURL           *string                `json:"avatar_url" db:"avatar_url"`
	Tags                []string               `json:"tags" db:"tags"`
	ModelConfig         map[string]interface{} `json:"model_config" db:"model_config"`
	SystemPrompt        string                 `json:"system_prompt" db:"system_prompt"`
	PromptTemplate      *string                `json:"prompt_template" db:"prompt_template"`
	MemoryConfig        map[string]interface{} `json:"memory_config" db:"memory_config"`
	KnowledgeBaseIDs    []string               `json:"knowledge_base_ids" db:"knowledge_base_ids"`
	ToolIDs             []string               `json:"tool_ids" db:"tool_ids"`
	ReActConfig         map[string]interface{} `json:"react_config" db:"react_config"`
	ResearchConfig      map[string]interface{} `json:"research_config" db:"research_config"`
	TotalConversations  int                    `json:"total_conversations" db:"total_conversations"`
	TotalMessages       int                    `json:"total_messages" db:"total_messages"`
	AvgResponseTimeMs   *int                   `json:"avg_response_time_ms" db:"avg_response_time_ms"`
	CreatedAt           time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time              `json:"updated_at" db:"updated_at"`
}

// CreateAgentRequest 创建 Agent 请求
type CreateAgentRequest struct {
	Name             string                 `json:"name" binding:"required"`
	Description      string                 `json:"description"`
	Type             AgentType              `json:"type" binding:"required"`
	AvatarURL        *string                `json:"avatar_url"`
	Tags             []string               `json:"tags"`
	ModelConfig      ModelConfig            `json:"model_config" binding:"required"`
	SystemPrompt     string                 `json:"system_prompt" binding:"required"`
	PromptTemplate   *string                `json:"prompt_template"`
	MemoryConfig     map[string]interface{} `json:"memory_config"`
	KnowledgeBaseIDs []string               `json:"knowledge_base_ids"`
	ToolIDs          []string               `json:"tool_ids"`
	ReActConfig      map[string]interface{} `json:"react_config"`
	ResearchConfig   map[string]interface{} `json:"research_config"`
}

// ModelConfig 模型配置（客户端版本 - 不包含敏感信息）
type ModelConfig struct {
	Model       string  `json:"model" binding:"required"`       // 模型 ID，如 "gpt-4-turbo"
	Temperature float64 `json:"temperature"`                    // 温度参数
	MaxTokens   int     `json:"max_tokens"`                     // 最大 token 数
	TopP        float64 `json:"top_p"`                          // Top P 参数
	// 注意：不包含 api_key, base_url 等敏感信息
	// 这些信息由后端管理
}

// UpdateAgentRequest 更新 Agent 请求
type UpdateAgentRequest struct {
	Name             *string                 `json:"name"`
	Description      *string                 `json:"description"`
	Status           *AgentStatus            `json:"status"`
	AvatarURL        *string                 `json:"avatar_url"`
	Tags             []string                `json:"tags"`
	ModelConfig      map[string]interface{}  `json:"model_config"`
	SystemPrompt     *string                 `json:"system_prompt"`
	PromptTemplate   *string                 `json:"prompt_template"`
	MemoryConfig     map[string]interface{}  `json:"memory_config"`
	KnowledgeBaseIDs []string                `json:"knowledge_base_ids"`
	ToolIDs          []string                `json:"tool_ids"`
	ReActConfig      map[string]interface{}  `json:"react_config"`
	ResearchConfig   map[string]interface{}  `json:"research_config"`
}

// Conversation 对话会话
type Conversation struct {
	ID           string    `json:"id" db:"id"`
	AgentID      string    `json:"agent_id" db:"agent_id"`
	UserID       string    `json:"user_id" db:"user_id"`
	Title        string    `json:"title" db:"title"`
	Summary      *string   `json:"summary" db:"summary"`
	MessageCount int       `json:"message_count" db:"message_count"`
	TotalTokens  int       `json:"total_tokens" db:"total_tokens"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// CreateConversationRequest 创建对话请求
type CreateConversationRequest struct {
	AgentID string `json:"agent_id" binding:"required"`
	Title   string `json:"title"`
}

// MessageRole 消息角色
type MessageRole string

const (
	MessageRoleSystem    MessageRole = "system"
	MessageRoleUser      MessageRole = "user"
	MessageRoleAssistant MessageRole = "assistant"
	MessageRoleFunction  MessageRole = "function"
)

// Message 消息
type Message struct {
	ID             string                 `json:"id" db:"id"`
	ConversationID string                 `json:"conversation_id" db:"conversation_id"`
	Role           MessageRole            `json:"role" db:"role"`
	Content        string                 `json:"content" db:"content"`
	Metadata       map[string]interface{} `json:"metadata" db:"metadata"`
	TokenCount     *int                   `json:"token_count" db:"token_count"`
	CreatedAt      time.Time              `json:"created_at" db:"created_at"`
}

// SendMessageRequest 发送消息请求
type SendMessageRequest struct {
	Content string `json:"content" binding:"required"`
	Stream  bool   `json:"stream"`
}
