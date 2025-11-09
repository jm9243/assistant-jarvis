package model

import "time"

// LogLevel 日志级别
type LogLevel string

const (
	LogLevelDebug LogLevel = "debug"
	LogLevelInfo  LogLevel = "info"
	LogLevelWarn  LogLevel = "warn"
	LogLevelError LogLevel = "error"
)

// LogCategory 日志分类
type LogCategory string

const (
	LogCategorySystem  LogCategory = "system"
	LogCategoryTask    LogCategory = "task"
	LogCategoryMessage LogCategory = "message"
	LogCategoryError   LogCategory = "error"
)

// Log 日志模型
type Log struct {
	ID        string                 `json:"id" db:"id"`
	UserID    string                 `json:"user_id" db:"user_id"`
	TaskID    *string                `json:"task_id" db:"task_id"`
	Level     LogLevel               `json:"level" db:"level"`
	Category  LogCategory            `json:"category" db:"category"`
	Message   string                 `json:"message" db:"message"`
	Details   map[string]interface{} `json:"details" db:"details"`
	CreatedAt time.Time              `json:"created_at" db:"created_at"`
}

// CreateLogRequest 创建日志请求
type CreateLogRequest struct {
	TaskID   *string                `json:"task_id"`
	Level    LogLevel               `json:"level" binding:"required"`
	Category LogCategory            `json:"category" binding:"required"`
	Message  string                 `json:"message" binding:"required"`
	Details  map[string]interface{} `json:"details"`
}

// LogQueryParams 日志查询参数
type LogQueryParams struct {
	TaskID   string      `form:"task_id"`
	Level    LogLevel    `form:"level"`
	Category LogCategory `form:"category"`
	Search   string      `form:"search"`
	Page     int         `form:"page"`
	PageSize int         `form:"page_size"`
}

// LogListResponse 日志列表响应
type LogListResponse struct {
	List  []*Log `json:"list"`
	Total int64  `json:"total"`
}

// BatchCreateLogsRequest 批量创建日志请求
type BatchCreateLogsRequest struct {
	Logs []*CreateLogRequest `json:"logs" binding:"required"`
}

// ReportErrorRequest 上报错误请求
type ReportErrorRequest struct {
	TaskID      *string                `json:"task_id"`
	NodeID      string                 `json:"node_id"`
	Message     string                 `json:"message" binding:"required"`
	ErrorType   string                 `json:"error_type" binding:"required"`
	StackTrace  string                 `json:"stack_trace"`
	Context     map[string]interface{} `json:"context"`
}

