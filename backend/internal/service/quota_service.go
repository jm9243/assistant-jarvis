package service

import (
	"context"
	"fmt"
	"time"

	"github.com/assistant-jarvis/backend/internal/repository"
)

// QuotaService 配额服务
type QuotaService struct {
	usageRepo *repository.UsageRepository
	userRepo  *repository.UserRepository
}

// NewQuotaService 创建配额服务
func NewQuotaService(usageRepo *repository.UsageRepository, userRepo *repository.UserRepository) *QuotaService {
	return &QuotaService{
		usageRepo: usageRepo,
		userRepo:  userRepo,
	}
}

// QuotaInfo 配额信息
type QuotaInfo struct {
	UserID           string  `json:"user_id"`
	MembershipLevel  string  `json:"membership_level"`
	QuotaTokens      int     `json:"quota_tokens"`       // 配额总量
	UsedTokens       int     `json:"used_tokens"`        // 已使用
	RemainingTokens  int     `json:"remaining_tokens"`   // 剩余
	UsagePercentage  float64 `json:"usage_percentage"`   // 使用百分比
	QuotaCost        float64 `json:"quota_cost"`         // 配额对应的费用
	UsedCost         float64 `json:"used_cost"`          // 已使用费用
	HasQuota         bool    `json:"has_quota"`          // 是否还有配额
	ResetTime        string  `json:"reset_time"`         // 配额重置时间
	DailyLimit       int     `json:"daily_limit"`        // 每日限制
	DailyUsed        int     `json:"daily_used"`         // 今日已使用
	DailyRemaining   int     `json:"daily_remaining"`    // 今日剩余
}

// CheckQuota 检查用户配额
func (s *QuotaService) CheckQuota(ctx context.Context, userID string) (*QuotaInfo, error) {
	// 获取用户信息
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// 根据会员等级设置配额
	quotaTokens := s.getQuotaByMembershipLevel(user.MembershipLevel)
	dailyLimit := s.getDailyLimitByMembershipLevel(user.MembershipLevel)

	// 获取本月用量
	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	endOfMonth := startOfMonth.AddDate(0, 1, 0)

	monthlyStats, err := s.usageRepo.GetUserUsageStats(ctx, userID, startOfMonth, endOfMonth)
	if err != nil {
		return nil, fmt.Errorf("failed to get monthly usage: %w", err)
	}

	// 获取今日用量
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	endOfDay := startOfDay.AddDate(0, 0, 1)

	dailyStats, err := s.usageRepo.GetUserUsageStats(ctx, userID, startOfDay, endOfDay)
	if err != nil {
		return nil, fmt.Errorf("failed to get daily usage: %w", err)
	}

	// 计算剩余配额
	remainingTokens := quotaTokens - monthlyStats.TotalTokens
	if remainingTokens < 0 {
		remainingTokens = 0
	}

	dailyRemaining := dailyLimit - dailyStats.TotalTokens
	if dailyRemaining < 0 {
		dailyRemaining = 0
	}

	// 计算使用百分比
	usagePercentage := 0.0
	if quotaTokens > 0 {
		usagePercentage = float64(monthlyStats.TotalTokens) / float64(quotaTokens) * 100
	}

	// 下个月1号
	nextMonth := startOfMonth.AddDate(0, 1, 0)

	return &QuotaInfo{
		UserID:           userID,
		MembershipLevel:  user.MembershipLevel,
		QuotaTokens:      quotaTokens,
		UsedTokens:       monthlyStats.TotalTokens,
		RemainingTokens:  remainingTokens,
		UsagePercentage:  usagePercentage,
		UsedCost:         monthlyStats.TotalCost,
		HasQuota:         remainingTokens > 0 && dailyRemaining > 0,
		ResetTime:        nextMonth.Format("2006-01-02 15:04:05"),
		DailyLimit:       dailyLimit,
		DailyUsed:        dailyStats.TotalTokens,
		DailyRemaining:   dailyRemaining,
	}, nil
}

// ValidateQuota 验证配额（在调用 LLM 前检查）
func (s *QuotaService) ValidateQuota(ctx context.Context, userID string, estimatedTokens int) error {
	quotaInfo, err := s.CheckQuota(ctx, userID)
	if err != nil {
		return err
	}

	// 检查月度配额
	if !quotaInfo.HasQuota {
		if quotaInfo.RemainingTokens <= 0 {
			return fmt.Errorf("monthly quota exceeded, used: %d/%d tokens", quotaInfo.UsedTokens, quotaInfo.QuotaTokens)
		}
		if quotaInfo.DailyRemaining <= 0 {
			return fmt.Errorf("daily quota exceeded, used: %d/%d tokens", quotaInfo.DailyUsed, quotaInfo.DailyLimit)
		}
	}

	// 检查预估的 token 数是否超过剩余配额
	if estimatedTokens > quotaInfo.RemainingTokens {
		return fmt.Errorf("estimated tokens (%d) exceeds remaining quota (%d)", estimatedTokens, quotaInfo.RemainingTokens)
	}

	if estimatedTokens > quotaInfo.DailyRemaining {
		return fmt.Errorf("estimated tokens (%d) exceeds daily remaining quota (%d)", estimatedTokens, quotaInfo.DailyRemaining)
	}

	return nil
}

// getQuotaByMembershipLevel 根据会员等级获取配额
func (s *QuotaService) getQuotaByMembershipLevel(level string) int {
	switch level {
	case "free":
		return 100000 // 10万 tokens/月
	case "basic":
		return 500000 // 50万 tokens/月
	case "pro":
		return 2000000 // 200万 tokens/月
	case "enterprise":
		return 10000000 // 1000万 tokens/月
	default:
		return 100000 // 默认 10万
	}
}

// getDailyLimitByMembershipLevel 根据会员等级获取每日限制
func (s *QuotaService) getDailyLimitByMembershipLevel(level string) int {
	switch level {
	case "free":
		return 10000 // 1万 tokens/天
	case "basic":
		return 50000 // 5万 tokens/天
	case "pro":
		return 200000 // 20万 tokens/天
	case "enterprise":
		return 1000000 // 100万 tokens/天
	default:
		return 10000 // 默认 1万
	}
}

// GetQuotaLevels 获取所有配额等级信息
func (s *QuotaService) GetQuotaLevels() []QuotaLevel {
	return []QuotaLevel{
		{
			Level:        "free",
			Name:         "免费版",
			MonthlyQuota: 100000,
			DailyLimit:   10000,
			Price:        0,
			Features: []string{
				"10万 tokens/月",
				"1万 tokens/天",
				"基础模型访问",
			},
		},
		{
			Level:        "basic",
			Name:         "基础版",
			MonthlyQuota: 500000,
			DailyLimit:   50000,
			Price:        29.9,
			Features: []string{
				"50万 tokens/月",
				"5万 tokens/天",
				"所有模型访问",
				"优先支持",
			},
		},
		{
			Level:        "pro",
			Name:         "专业版",
			MonthlyQuota: 2000000,
			DailyLimit:   200000,
			Price:        99.9,
			Features: []string{
				"200万 tokens/月",
				"20万 tokens/天",
				"所有模型访问",
				"优先支持",
				"API 访问",
			},
		},
		{
			Level:        "enterprise",
			Name:         "企业版",
			MonthlyQuota: 10000000,
			DailyLimit:   1000000,
			Price:        499.9,
			Features: []string{
				"1000万 tokens/月",
				"100万 tokens/天",
				"所有模型访问",
				"专属支持",
				"API 访问",
				"自定义模型",
			},
		},
	}
}

// QuotaLevel 配额等级
type QuotaLevel struct {
	Level        string   `json:"level"`
	Name         string   `json:"name"`
	MonthlyQuota int      `json:"monthly_quota"`
	DailyLimit   int      `json:"daily_limit"`
	Price        float64  `json:"price"`
	Features     []string `json:"features"`
}

// SendQuotaAlert 发送配额告警
func (s *QuotaService) SendQuotaAlert(ctx context.Context, userID string, quotaInfo *QuotaInfo) error {
	// 当使用量达到 80% 时发送告警
	if quotaInfo.UsagePercentage >= 80 && quotaInfo.UsagePercentage < 90 {
		// TODO: 发送邮件或站内通知
		// logger.Info("Quota alert: 80%", zap.String("user_id", userID))
	}

	// 当使用量达到 90% 时发送告警
	if quotaInfo.UsagePercentage >= 90 && quotaInfo.UsagePercentage < 100 {
		// TODO: 发送邮件或站内通知
		// logger.Warn("Quota alert: 90%", zap.String("user_id", userID))
	}

	// 当配额用尽时发送告警
	if !quotaInfo.HasQuota {
		// TODO: 发送邮件或站内通知
		// logger.Error("Quota exhausted", zap.String("user_id", userID))
	}

	return nil
}
