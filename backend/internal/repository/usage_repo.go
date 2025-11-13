package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/assistant-jarvis/backend/internal/model"
	"github.com/assistant-jarvis/backend/internal/pkg/supabase"
	"github.com/google/uuid"
)

// UsageRepository 用量仓库
type UsageRepository struct {
	client *supabase.Client
}

// NewUsageRepository 创建用量仓库
func NewUsageRepository(client *supabase.Client) *UsageRepository {
	return &UsageRepository{
		client: client,
	}
}

// Create 创建用量记录
func (r *UsageRepository) Create(ctx context.Context, record *model.UsageRecord) error {
	if record.ID == "" {
		record.ID = uuid.New().String()
	}
	if record.CreatedAt.IsZero() {
		record.CreatedAt = time.Now()
	}

	_, err := r.client.DB().
		From("llm_usage").
		Insert(record)

	if err != nil {
		return fmt.Errorf("failed to create usage record: %w", err)
	}

	return nil
}

// GetUserUsageStats 获取用户用量统计
func (r *UsageRepository) GetUserUsageStats(ctx context.Context, userID string, startTime, endTime time.Time) (*model.UserUsageStats, error) {
	// TODO: 实现 RPC 调用数据库函数
	// 需要先在 Supabase 中执行 migrations/create_usage_stats_functions.sql
	
	// 暂时返回空统计
	return &model.UserUsageStats{
		UserID:    userID,
		StartTime: startTime,
		EndTime:   endTime,
	}, nil
}

// GetModelUsageStats 获取模型用量统计
func (r *UsageRepository) GetModelUsageStats(ctx context.Context, modelID string, startTime, endTime time.Time) (*model.ModelUsageStats, error) {
	// TODO: 实现 RPC 调用数据库函数
	// 需要先在 Supabase 中执行 migrations/create_usage_stats_functions.sql
	
	// 暂时返回空统计
	return &model.ModelUsageStats{
		ModelID:   modelID,
		StartTime: startTime,
		EndTime:   endTime,
	}, nil
}

// GetTopUsers 获取用量最高的用户
func (r *UsageRepository) GetTopUsers(ctx context.Context, limit int, startTime, endTime time.Time) ([]*model.UserUsageStats, error) {
	// TODO: 实现 RPC 调用数据库函数
	// 需要先在 Supabase 中执行 migrations/create_usage_stats_functions.sql
	
	// 暂时返回空列表
	return []*model.UserUsageStats{}, nil
}

// GetUserUsageByModel 获取用户按模型分组的用量
func (r *UsageRepository) GetUserUsageByModel(ctx context.Context, userID string, startTime, endTime time.Time) ([]*model.ModelUsageStats, error) {
	// TODO: 实现 RPC 调用数据库函数
	// 需要先在 Supabase 中执行 migrations/create_usage_stats_functions.sql
	
	// 暂时返回空列表
	return []*model.ModelUsageStats{}, nil
}
