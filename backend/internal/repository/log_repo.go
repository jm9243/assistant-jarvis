package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/assistant-jarvis/backend/internal/model"
	"github.com/assistant-jarvis/backend/internal/pkg/supabase"
)

// LogRepository 日志数据访问层
type LogRepository struct {
	supabaseClient *supabase.Client
}

// NewLogRepository 创建日志仓库
func NewLogRepository(client *supabase.Client) *LogRepository {
	return &LogRepository{
		supabaseClient: client,
	}
}

// Create 创建日志
func (r *LogRepository) Create(ctx context.Context, log *model.Log) error {
	_, err := r.supabaseClient.DB().
		From("logs").
		Insert(log)

	if err != nil {
		return fmt.Errorf("failed to create log: %w", err)
	}

	return nil
}

// BatchCreate 批量创建日志
func (r *LogRepository) BatchCreate(ctx context.Context, logs []*model.Log) error {
	if len(logs) == 0 {
		return nil
	}

	_, err := r.supabaseClient.DB().
		From("logs").
		Insert(logs)

	if err != nil {
		return fmt.Errorf("failed to batch create logs: %w", err)
	}

	return nil
}

// FindByUserID 根据用户 ID 查找日志列表
func (r *LogRepository) FindByUserID(ctx context.Context, userID string, params *model.LogQueryParams) ([]*model.Log, int, error) {
	// 构建查询
	query := r.supabaseClient.DB().From("logs").Select("*").Eq("user_id", userID)

	// 添加筛选条件
	if params != nil {
		if params.Level != "" {
			query = query.Eq("level", string(params.Level))
		}
		if params.TaskID != "" {
			query = query.Eq("task_id", params.TaskID)
		}
		if params.Category != "" {
			query = query.Eq("category", string(params.Category))
		}
	}

	// 暂时返回空列表（实际需要根据 Supabase SDK 实现）
	// var logs []*model.Log
	// err := query.Execute(&logs)
	return []*model.Log{}, 0, nil
}

// FindByTaskID 根据任务 ID 查找日志列表
func (r *LogRepository) FindByTaskID(ctx context.Context, taskID string) ([]*model.Log, error) {
	// 构建查询，按时间排序
	_ = r.supabaseClient.DB().From("logs").Select("*").Eq("task_id", taskID)

	// 暂时返回空列表（实际需要根据 Supabase SDK 实现）
	// var logs []*model.Log
	// err := query.Order("created_at", &supabase.OrderOpts{Ascending: false}).Execute(&logs)
	return []*model.Log{}, nil
}

// DeleteOldLogs 删除旧日志（超过指定天数）
func (r *LogRepository) DeleteOldLogs(ctx context.Context, days int) error {
	// 计算截止时间
	cutoffTime := time.Now().AddDate(0, 0, -days)

	// 暂时返回 nil（实际需要根据 Supabase SDK 实现删除逻辑）
	// _, err := r.supabaseClient.DB().
	// 	From("logs").
	// 	Delete().
	// 	Lt("created_at", cutoffTime.Format(time.RFC3339)).
	// 	Execute()
	
	_ = cutoffTime
	return nil
}

