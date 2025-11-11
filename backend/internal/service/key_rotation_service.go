package service

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/assistant-jarvis/backend/internal/model"
	"github.com/assistant-jarvis/backend/internal/pkg/cache"
)

// KeyRotationService 密钥轮询服务
type KeyRotationService struct {
	redisCache *cache.RedisCache
}

// NewKeyRotationService 创建密钥轮询服务
func NewKeyRotationService(redisCache *cache.RedisCache) *KeyRotationService {
	return &KeyRotationService{
		redisCache: redisCache,
	}
}

// GetNextAPIKey 获取下一个可用的 API Key（轮询模式）
func (s *KeyRotationService) GetNextAPIKey(ctx context.Context, modelID string, apiKeys []model.APIKeyConfig) (string, error) {
	// 过滤出启用的密钥
	var enabledKeys []string
	for _, keyConfig := range apiKeys {
		if keyConfig.Status == "enabled" {
			enabledKeys = append(enabledKeys, keyConfig.Key)
		}
	}

	if len(enabledKeys) == 0 {
		return "", fmt.Errorf("no enabled API keys found for model %s", modelID)
	}

	// 如果只有一个密钥，直接返回
	if len(enabledKeys) == 1 {
		return enabledKeys[0], nil
	}

	// 使用 Redis 记录当前索引
	redisKey := fmt.Sprintf("llm:key_rotation:%s", modelID)
	
	// 获取当前索引
	currentIndexStr, err := s.redisCache.Get(ctx, redisKey)
	currentIndex := 0
	
	if err == nil && currentIndexStr != "" {
		currentIndex, _ = strconv.Atoi(currentIndexStr)
	}

	// 获取当前密钥
	selectedKey := enabledKeys[currentIndex%len(enabledKeys)]

	// 更新索引（原子操作）
	nextIndex := (currentIndex + 1) % len(enabledKeys)
	
	// 设置过期时间为 24 小时
	err = s.redisCache.SetWithExpiry(ctx, redisKey, strconv.Itoa(nextIndex), 24*time.Hour)
	if err != nil {
		// 如果 Redis 失败，不影响主流程，只记录日志
		// logger.Warn("Failed to update key rotation index", zap.Error(err))
	}

	return selectedKey, nil
}

// ResetRotation 重置轮询索引（当密钥列表变化时调用）
func (s *KeyRotationService) ResetRotation(ctx context.Context, modelID string) error {
	redisKey := fmt.Sprintf("llm:key_rotation:%s", modelID)
	return s.redisCache.Delete(ctx, redisKey)
}

// GetRotationStats 获取轮询统计信息
func (s *KeyRotationService) GetRotationStats(ctx context.Context, modelID string) (map[string]interface{}, error) {
	redisKey := fmt.Sprintf("llm:key_rotation:%s", modelID)
	
	currentIndexStr, err := s.redisCache.Get(ctx, redisKey)
	if err != nil {
		return map[string]interface{}{
			"current_index": 0,
			"status":        "not_initialized",
		}, nil
	}

	currentIndex, _ := strconv.Atoi(currentIndexStr)
	
	return map[string]interface{}{
		"current_index": currentIndex,
		"status":        "active",
	}, nil
}

// MarkKeyAsFailed 标记密钥失败（可以用于自动禁用失败的密钥）
func (s *KeyRotationService) MarkKeyAsFailed(ctx context.Context, modelID string, apiKey string) error {
	// 记录失败次数
	redisKey := fmt.Sprintf("llm:key_failed:%s:%s", modelID, apiKey)
	
	// 增加失败计数
	failCount, err := s.redisCache.Increment(ctx, redisKey)
	if err != nil {
		return err
	}

	// 设置过期时间为 1 小时
	s.redisCache.SetWithExpiry(ctx, redisKey, strconv.Itoa(int(failCount)), time.Hour)

	// 如果失败次数超过阈值（例如 5 次），可以触发告警
	if failCount >= 5 {
		// TODO: 发送告警通知管理员
		// logger.Error("API key failed too many times", zap.String("model_id", modelID), zap.Int64("fail_count", failCount))
	}

	return nil
}

// GetKeyFailureCount 获取密钥失败次数
func (s *KeyRotationService) GetKeyFailureCount(ctx context.Context, modelID string, apiKey string) (int, error) {
	redisKey := fmt.Sprintf("llm:key_failed:%s:%s", modelID, apiKey)
	
	countStr, err := s.redisCache.Get(ctx, redisKey)
	if err != nil {
		return 0, nil
	}

	count, _ := strconv.Atoi(countStr)
	return count, nil
}
