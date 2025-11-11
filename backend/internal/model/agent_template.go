package model

import "time"

// AgentTemplate Agent模板模型
type AgentTemplate struct {
	ID          string                 `json:"id" db:"id"`
	UserID      *string                `json:"user_id,omitempty" db:"user_id"`
	Name        string                 `json:"name" db:"name"`
	Description string                 `json:"description" db:"description"`
	Category    string                 `json:"category" db:"category"`
	Type        string                 `json:"type" db:"type"`
	Tags        []string               `json:"tags" db:"tags"`
	Icon        string                 `json:"icon" db:"icon"`
	IsSystem    bool                   `json:"is_system" db:"is_system"`
	IsPublic    bool                   `json:"is_public" db:"is_public"`
	Config      map[string]interface{} `json:"config" db:"config"`
	UsageCount  int                    `json:"usage_count" db:"usage_count"`
	CreatedAt   time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at" db:"updated_at"`
}

// CreateAgentTemplateRequest 创建Agent模板请求
type CreateAgentTemplateRequest struct {
	Name        string                 `json:"name" binding:"required"`
	Description string                 `json:"description"`
	Category    string                 `json:"category" binding:"required"`
	Type        string                 `json:"type" binding:"required"`
	Tags        []string               `json:"tags"`
	Icon        string                 `json:"icon"`
	IsPublic    bool                   `json:"is_public"`
	Config      map[string]interface{} `json:"config" binding:"required"`
}

// UpdateAgentTemplateRequest 更新Agent模板请求
type UpdateAgentTemplateRequest struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Category    string                 `json:"category"`
	Tags        []string               `json:"tags"`
	Icon        string                 `json:"icon"`
	IsPublic    *bool                  `json:"is_public"`
	Config      map[string]interface{} `json:"config"`
}

// AgentTemplateQueryParams Agent模板查询参数
type AgentTemplateQueryParams struct {
	Category string   `form:"category"`
	Type     string   `form:"type"`
	Tags     []string `form:"tags"`
	Search   string   `form:"search"`
	IsSystem *bool    `form:"is_system"`
	IsPublic *bool    `form:"is_public"`
	Page     int      `form:"page"`
	PageSize int      `form:"page_size"`
}

// AgentTemplateListResponse Agent模板列表响应
type AgentTemplateListResponse struct {
	List  []*AgentTemplate `json:"list"`
	Total int64            `json:"total"`
}
