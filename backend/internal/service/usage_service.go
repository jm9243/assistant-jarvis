package service

import (
	"context"
	"time"

	"github.com/assistant-jarvis/backend/internal/model"
	"github.com/assistant-jarvis/backend/internal/repository"
	"github.com/google/uuid"
)

// UsageService 用量服务
type UsageService struct {
	usageRepo *repository.UsageRepository
}

// NewUsageService 创建用量服务
func NewUsageService(usageRepo *repository.UsageRepository) *UsageService {
	return &UsageService{
		usageRepo: usageRepo,
	}
}

// RecordUsage 记录用量
func (s *UsageService) RecordUsage(ctx context.Context, record *model.UsageRecord) error {
	if record.ID == "" {
		record.ID = uuid.New().String()
	}
	if record.CreatedAt.IsZero() {
		record.CreatedAt = time.Now()
	}

	return s.usageRepo.Create(ctx, record)
}

// GetUserUsage 获取用户用量统计
func (s *UsageService) GetUserUsage(ctx context.Context, userID string, startTime, endTime time.Time) (*model.UserUsageStats, error) {
	return s.usageRepo.GetUserUsageStats(ctx, userID, startTime, endTime)
}

// GetUserMonthlyUsage 获取用户本月用量
func (s *UsageService) GetUserMonthlyUsage(ctx context.Context, userID string) (*model.UserUsageStats, error) {
	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	endOfMonth := startOfMonth.AddDate(0, 1, 0)

	return s.usageRepo.GetUserUsageStats(ctx, userID, startOfMonth, endOfMonth)
}

// GetUserDailyUsage 获取用户今日用量
func (s *UsageService) GetUserDailyUsage(ctx context.Context, userID string) (*model.UserUsageStats, error) {
	now := time.Now()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	endOfDay := startOfDay.AddDate(0, 0, 1)

	return s.usageRepo.GetUserUsageStats(ctx, userID, startOfDay, endOfDay)
}

// GetModelUsageStats 获取模型用量统计
func (s *UsageService) GetModelUsageStats(ctx context.Context, modelID string, startTime, endTime time.Time) (*model.ModelUsageStats, error) {
	return s.usageRepo.GetModelUsageStats(ctx, modelID, startTime, endTime)
}

// GetTopUsers 获取用量最高的用户
func (s *UsageService) GetTopUsers(ctx context.Context, limit int, startTime, endTime time.Time) ([]*model.UserUsageStats, error) {
	return s.usageRepo.GetTopUsers(ctx, limit, startTime, endTime)
}

// CalculateCost 计算费用
func (s *UsageService) CalculateCost(promptTokens, completionTokens int, pricePerMillionInput, pricePerMillionOutput float64) float64 {
	inputCost := float64(promptTokens) / 1000000.0 * pricePerMillionInput
	outputCost := float64(completionTokens) / 1000000.0 * pricePerMillionOutput
	return inputCost + outputCost
}
