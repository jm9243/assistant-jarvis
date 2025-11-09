package model

import "time"

// TaskStatus 任务状态
type TaskStatus string

const (
	TaskStatusPending   TaskStatus = "pending"
	TaskStatusRunning   TaskStatus = "running"
	TaskStatusPaused    TaskStatus = "paused"
	TaskStatusCompleted TaskStatus = "completed"
	TaskStatusFailed    TaskStatus = "failed"
	TaskStatusCancelled TaskStatus = "cancelled"
)

// TaskPriority 任务优先级
type TaskPriority string

const (
	TaskPriorityHigh   TaskPriority = "high"
	TaskPriorityMedium TaskPriority = "medium"
	TaskPriorityLow    TaskPriority = "low"
)

// Task 任务模型
type Task struct {
	ID         string                 `json:"id" db:"id"`
	WorkflowID string                 `json:"workflow_id" db:"workflow_id"`
	UserID     string                 `json:"user_id" db:"user_id"`
	DeviceID   string                 `json:"device_id" db:"device_id"`
	Status     TaskStatus             `json:"status" db:"status"`
	Priority   TaskPriority           `json:"priority" db:"priority"`
	Parameters map[string]interface{} `json:"parameters" db:"parameters"`
	StartTime  *time.Time             `json:"start_time" db:"start_time"`
	EndTime    *time.Time             `json:"end_time" db:"end_time"`
	DurationMS int                    `json:"duration_ms" db:"duration_ms"`
	Result     map[string]interface{} `json:"result" db:"result"`
	ErrorMsg   string                 `json:"error_message" db:"error_message"`
	CreatedAt  time.Time              `json:"created_at" db:"created_at"`
}

// CreateTaskRequest 创建任务请求
type CreateTaskRequest struct {
	WorkflowID string                 `json:"workflow_id" binding:"required"`
	DeviceID   string                 `json:"device_id"`
	Priority   TaskPriority           `json:"priority"`
	Parameters map[string]interface{} `json:"parameters"`
}

// UpdateTaskStatusRequest 更新任务状态请求
type UpdateTaskStatusRequest struct {
	Status   TaskStatus             `json:"status" binding:"required"`
	Result   map[string]interface{} `json:"result"`
	ErrorMsg string                 `json:"error_message"`
}

// TaskQueryParams 任务查询参数
type TaskQueryParams struct {
	WorkflowID string       `form:"workflow_id"`
	DeviceID   string       `form:"device_id"`
	Status     TaskStatus   `form:"status"`
	Priority   TaskPriority `form:"priority"`
	Page       int          `form:"page"`
	PageSize   int          `form:"page_size"`
}

// UpdateTaskResultRequest 更新任务结果请求
type UpdateTaskResultRequest struct {
	Status       string                 `json:"status" binding:"required"`
	EndTime      *time.Time             `json:"end_time"`
	DurationMs   int                    `json:"duration_ms"`
	Result       map[string]interface{} `json:"result"`
	ErrorMessage string                 `json:"error_message"`
}

// TaskListResponse 任务列表响应
type TaskListResponse struct {
	List  []*Task `json:"list"`
	Total int64   `json:"total"`
}

