package model

import "time"

// LLMModel LLM 模型配置
type LLMModel struct {
	ID                     string                 `json:"id" db:"id"`
	Name                   string                 `json:"name" db:"name"`
	ModelID                string                 `json:"model_id" db:"model_id"`
	Provider               string                 `json:"provider" db:"provider"`
	Type                   string                 `json:"type" db:"type"` // 生文、生图、单图生视频、多图生视频、生音频、生音乐
	Description            string                 `json:"description" db:"description"`
	Status                 string                 `json:"status" db:"status"` // enabled, disabled, inactive
	BaseURL                string                 `json:"base_url" db:"base_url"`
	AuthType               string                 `json:"auth_type" db:"auth_type"` // api_key, api_secret
	KeyUsageMode           string                 `json:"key_usage_mode" db:"key_usage_mode"` // single, rotation
	APIKeys                []APIKeyConfig         `json:"api_keys" db:"api_keys"` // 多个密钥
	SupportsVision         bool                   `json:"supports_vision" db:"supports_vision"`
	MaxTokens              *int                   `json:"max_tokens" db:"max_tokens"`
	ContextWindow          *int                   `json:"context_window" db:"context_window"`
	PricePerMillionInput   *float64               `json:"price_per_million_input" db:"price_per_million_input"`
	PricePerMillionOutput  *float64               `json:"price_per_million_output" db:"price_per_million_output"`
	RateLimitRPM           *int                   `json:"rate_limit_rpm" db:"rate_limit_rpm"`
	RateLimitTPM           *int                   `json:"rate_limit_tpm" db:"rate_limit_tpm"`
	PlatformID             *string                `json:"platform_id" db:"platform_id"`
	CreatedAt              time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt              time.Time              `json:"updated_at" db:"updated_at"`
	CreatedBy              *string                `json:"created_by" db:"created_by"`
}

// APIKeyConfig API 密钥配置
type APIKeyConfig struct {
	Key    string `json:"key"`    // 密钥（加密存储）
	Status string `json:"status"` // enabled, disabled, inactive
}

// CreateLLMModelRequest 创建模型请求
type CreateLLMModelRequest struct {
	Name                  string         `json:"name" binding:"required"`
	ModelID               string         `json:"model_id" binding:"required"`
	Provider              string         `json:"provider" binding:"required"`
	Type                  string         `json:"type" binding:"required"`
	Description           string         `json:"description"`
	BaseURL               string         `json:"base_url" binding:"required"`
	AuthType              string         `json:"auth_type" binding:"required"`
	KeyUsageMode          string         `json:"key_usage_mode" binding:"required"`
	APIKeys               []APIKeyConfig `json:"api_keys" binding:"required"`
	SupportsVision        bool           `json:"supports_vision"`
	MaxTokens             *int           `json:"max_tokens"`
	ContextWindow         *int           `json:"context_window"`
	PricePerMillionInput  *float64       `json:"price_per_million_input"`
	PricePerMillionOutput *float64       `json:"price_per_million_output"`
	RateLimitRPM          *int           `json:"rate_limit_rpm"`
	RateLimitTPM          *int           `json:"rate_limit_tpm"`
	PlatformID            *string        `json:"platform_id"`
}

// UpdateLLMModelRequest 更新模型请求
type UpdateLLMModelRequest struct {
	Name                  *string         `json:"name"`
	Description           *string         `json:"description"`
	Status                *string         `json:"status"`
	BaseURL               *string         `json:"base_url"`
	AuthType              *string         `json:"auth_type"`
	KeyUsageMode          *string         `json:"key_usage_mode"`
	APIKeys               *[]APIKeyConfig `json:"api_keys"`
	SupportsVision        *bool           `json:"supports_vision"`
	MaxTokens             *int            `json:"max_tokens"`
	ContextWindow         *int            `json:"context_window"`
	PricePerMillionInput  *float64        `json:"price_per_million_input"`
	PricePerMillionOutput *float64        `json:"price_per_million_output"`
	RateLimitRPM          *int            `json:"rate_limit_rpm"`
	RateLimitTPM          *int            `json:"rate_limit_tpm"`
	PlatformID            *string         `json:"platform_id"`
}

// AvailableModel 可用模型（客户端视图）
type AvailableModel struct {
	ID             string   `json:"id"`
	Name           string   `json:"name"`
	ModelID        string   `json:"model_id"`
	Provider       string   `json:"provider"`
	Type           string   `json:"type"`
	Description    string   `json:"description"`
	SupportsVision bool     `json:"supports_vision"`
	MaxTokens      int      `json:"max_tokens"`
	ContextWindow  int      `json:"context_window"`
	PricePerToken  *float64 `json:"price_per_token,omitempty"`
}

// UsageStats 用量统计
type UsageStats struct {
	TotalTokens      int     `json:"total_tokens"`
	UsedTokens       int     `json:"used_tokens"`
	RemainingTokens  int     `json:"remaining_tokens"`
	TotalCost        float64 `json:"total_cost"`
	CurrentMonthCost float64 `json:"current_month_cost"`
}

// UsageRecord 用量记录
type UsageRecord struct {
	ID               string  `json:"id" db:"id"`
	UserID           string  `json:"user_id" db:"user_id"`
	Model            string  `json:"model" db:"model"`
	PromptTokens     int     `json:"prompt_tokens" db:"prompt_tokens"`
	CompletionTokens int     `json:"completion_tokens" db:"completion_tokens"`
	TotalTokens      int     `json:"total_tokens" db:"total_tokens"`
	Cost             float64 `json:"cost" db:"cost"`
	CreatedAt        string  `json:"created_at" db:"created_at"`
}
