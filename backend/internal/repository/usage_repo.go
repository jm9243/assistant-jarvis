package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/assistant-jarvis/backend/internal/pkg/supabase"
	"github.com/assistant-jarvis/backend/internal/service"
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
func (r *UsageRepository) Create(ctx context.Context, record *service.UsageRecord) error {
	query := `
		INSERT INTO llm_usage (
			id, user_id, agent_id, conversation_id, model_id,
			provider, model, prompt_tokens, completion_tokens, total_tokens,
			cost, request_duration_ms, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
		)
	`

	_, err := r.client.DB.ExecContext(
		ctx, query,
		record.ID, record.UserID, record.AgentID, record.ConversationID, record.ModelID,
		record.Provider, record.Model, record.PromptTokens, record.CompletionTokens, record.TotalTokens,
		record.Cost, record.RequestDurationMs, record.CreatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create usage record: %w", err)
	}

	return nil
}

// GetUserUsageStats 获取用户用量统计
func (r *UsageRepository) GetUserUsageStats(ctx context.Context, userID string, startTime, endTime time.Time) (*service.UserUsageStats, error) {
	query := `
		SELECT 
			user_id,
			SUM(total_tokens) as total_tokens,
			SUM(prompt_tokens) as prompt_tokens,
			SUM(completion_tokens) as completion_tokens,
			SUM(cost) as total_cost,
			COUNT(*) as request_count
		FROM llm_usage
		WHERE user_id = $1
			AND created_at >= $2
			AND created_at < $3
		GROUP BY user_id
	`

	var stats service.UserUsageStats
	err := r.client.DB.QueryRowContext(ctx, query, userID, startTime, endTime).Scan(
		&stats.UserID,
		&stats.TotalTokens,
		&stats.PromptTokens,
		&stats.CompletionTokens,
		&stats.TotalCost,
		&stats.RequestCount,
	)

	if err != nil {
		// 如果没有记录，返回空统计
		return &service.UserUsageStats{
			UserID:    userID,
			StartTime: startTime,
			EndTime:   endTime,
		}, nil
	}

	stats.StartTime = startTime
	stats.EndTime = endTime

	return &stats, nil
}

// GetModelUsageStats 获取模型用量统计
func (r *UsageRepository) GetModelUsageStats(ctx context.Context, modelID string, startTime, endTime time.Time) (*service.ModelUsageStats, error) {
	query := `
		SELECT 
			model_id,
			provider,
			model,
			SUM(total_tokens) as total_tokens,
			SUM(prompt_tokens) as prompt_tokens,
			SUM(completion_tokens) as completion_tokens,
			SUM(cost) as total_cost,
			COUNT(*) as request_count,
			COUNT(DISTINCT user_id) as unique_users
		FROM llm_usage
		WHERE model_id = $1
			AND created_at >= $2
			AND created_at < $3
		GROUP BY model_id, provider, model
	`

	var stats service.ModelUsageStats
	err := r.client.DB.QueryRowContext(ctx, query, modelID, startTime, endTime).Scan(
		&stats.ModelID,
		&stats.Provider,
		&stats.Model,
		&stats.TotalTokens,
		&stats.PromptTokens,
		&stats.CompletionTokens,
		&stats.TotalCost,
		&stats.RequestCount,
		&stats.UniqueUsers,
	)

	if err != nil {
		return &service.ModelUsageStats{
			ModelID:   modelID,
			StartTime: startTime,
			EndTime:   endTime,
		}, nil
	}

	stats.StartTime = startTime
	stats.EndTime = endTime

	return &stats, nil
}

// GetTopUsers 获取用量最高的用户
func (r *UsageRepository) GetTopUsers(ctx context.Context, limit int, startTime, endTime time.Time) ([]*service.UserUsageStats, error) {
	query := `
		SELECT 
			user_id,
			SUM(total_tokens) as total_tokens,
			SUM(prompt_tokens) as prompt_tokens,
			SUM(completion_tokens) as completion_tokens,
			SUM(cost) as total_cost,
			COUNT(*) as request_count
		FROM llm_usage
		WHERE created_at >= $1
			AND created_at < $2
		GROUP BY user_id
		ORDER BY total_tokens DESC
		LIMIT $3
	`

	rows, err := r.client.DB.QueryContext(ctx, query, startTime, endTime, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get top users: %w", err)
	}
	defer rows.Close()

	var statsList []*service.UserUsageStats
	for rows.Next() {
		var stats service.UserUsageStats
		err := rows.Scan(
			&stats.UserID,
			&stats.TotalTokens,
			&stats.PromptTokens,
			&stats.CompletionTokens,
			&stats.TotalCost,
			&stats.RequestCount,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user stats: %w", err)
		}

		stats.StartTime = startTime
		stats.EndTime = endTime
		statsList = append(statsList, &stats)
	}

	return statsList, nil
}

// GetUserUsageByModel 获取用户按模型分组的用量
func (r *UsageRepository) GetUserUsageByModel(ctx context.Context, userID string, startTime, endTime time.Time) ([]*service.ModelUsageStats, error) {
	query := `
		SELECT 
			model_id,
			provider,
			model,
			SUM(total_tokens) as total_tokens,
			SUM(prompt_tokens) as prompt_tokens,
			SUM(completion_tokens) as completion_tokens,
			SUM(cost) as total_cost,
			COUNT(*) as request_count,
			1 as unique_users
		FROM llm_usage
		WHERE user_id = $1
			AND created_at >= $2
			AND created_at < $3
		GROUP BY model_id, provider, model
		ORDER BY total_tokens DESC
	`

	rows, err := r.client.DB.QueryContext(ctx, query, userID, startTime, endTime)
	if err != nil {
		return nil, fmt.Errorf("failed to get user usage by model: %w", err)
	}
	defer rows.Close()

	var statsList []*service.ModelUsageStats
	for rows.Next() {
		var stats service.ModelUsageStats
		err := rows.Scan(
			&stats.ModelID,
			&stats.Provider,
			&stats.Model,
			&stats.TotalTokens,
			&stats.PromptTokens,
			&stats.CompletionTokens,
			&stats.TotalCost,
			&stats.RequestCount,
			&stats.UniqueUsers,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan model stats: %w", err)
		}

		stats.StartTime = startTime
		stats.EndTime = endTime
		statsList = append(statsList, &stats)
	}

	return statsList, nil
}
