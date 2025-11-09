package model

import "time"

// Workflow 工作流模型
type Workflow struct {
	ID             string                 `json:"id" db:"id"`
	UserID         string                 `json:"user_id" db:"user_id"`
	Name           string                 `json:"name" db:"name"`
	Description    string                 `json:"description" db:"description"`
	Category       string                 `json:"category" db:"category"`
	Tags           []string               `json:"tags" db:"tags"`
	Icon           string                 `json:"icon" db:"icon"`
	Version        string                 `json:"version" db:"version"`
	OSRequirements []string               `json:"os_requirements" db:"os_requirements"`
	TargetApps     map[string]interface{} `json:"target_apps" db:"target_apps"`
	Parameters     map[string]interface{} `json:"parameters" db:"parameters"`
	Definition     map[string]interface{} `json:"definition" db:"definition"`
	Triggers       map[string]interface{} `json:"triggers" db:"triggers"`
	IsPublished    bool                   `json:"is_published" db:"is_published"`
	IsArchived     bool                   `json:"is_archived" db:"is_archived"`
	ExecutionCount int                    `json:"execution_count" db:"execution_count"`
	SuccessCount   int                    `json:"success_count" db:"success_count"`
	CreatedAt      time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time              `json:"updated_at" db:"updated_at"`
}

// CreateWorkflowRequest 创建工作流请求
type CreateWorkflowRequest struct {
	Name           string                 `json:"name" binding:"required"`
	Description    string                 `json:"description"`
	Category       string                 `json:"category"`
	Tags           []string               `json:"tags"`
	Icon           string                 `json:"icon"`
	OSRequirements []string               `json:"os_requirements"`
	TargetApps     map[string]interface{} `json:"target_apps"`
	Parameters     map[string]interface{} `json:"parameters"`
	Definition     map[string]interface{} `json:"definition" binding:"required"`
	Triggers       map[string]interface{} `json:"triggers"`
}

// UpdateWorkflowRequest 更新工作流请求
type UpdateWorkflowRequest struct {
	Name           string                 `json:"name"`
	Description    string                 `json:"description"`
	Category       string                 `json:"category"`
	Tags           []string               `json:"tags"`
	Icon           string                 `json:"icon"`
	OSRequirements []string               `json:"os_requirements"`
	TargetApps     map[string]interface{} `json:"target_apps"`
	Parameters     map[string]interface{} `json:"parameters"`
	Definition     map[string]interface{} `json:"definition"`
	Triggers       map[string]interface{} `json:"triggers"`
	IsPublished    *bool                  `json:"is_published"`
	IsArchived     *bool                  `json:"is_archived"`
}

// WorkflowQueryParams 工作流查询参数
type WorkflowQueryParams struct {
	Category    string   `form:"category"`
	Tags        []string `form:"tags"`
	Search      string   `form:"search"`
	IsPublished *bool    `form:"is_published"`
	IsArchived  *bool    `form:"is_archived"`
	Page        int      `form:"page"`
	PageSize    int      `form:"page_size"`
}

// WorkflowListResponse 工作流列表响应
type WorkflowListResponse struct {
	List  []*Workflow `json:"list"`
	Total int64       `json:"total"`
}

