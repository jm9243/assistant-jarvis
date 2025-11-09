package service

import (
	"context"
	"fmt"
	"time"

	"github.com/assistant-jarvis/backend/internal/model"
	"github.com/assistant-jarvis/backend/internal/repository"
)

// LogService 日志服务
type LogService struct {
	logRepo *repository.LogRepository
}

// NewLogService 创建日志服务
func NewLogService(logRepo *repository.LogRepository) *LogService {
	return &LogService{
		logRepo: logRepo,
	}
}

// CreateLog 创建单条日志
func (s *LogService) CreateLog(ctx context.Context, userID string, req *model.CreateLogRequest) error {
	log := &model.Log{
		UserID:    userID,
		TaskID:    req.TaskID,
		Level:     req.Level,
		Category:  req.Category,
		Message:   req.Message,
		Details:   req.Details,
		CreatedAt: time.Now(),
	}

	if err := s.logRepo.Create(ctx, log); err != nil {
		return fmt.Errorf("failed to create log: %w", err)
	}

	return nil
}

// BatchCreateLogs 批量创建日志
func (s *LogService) BatchCreateLogs(ctx context.Context, userID string, requests []*model.CreateLogRequest) error {
	if len(requests) == 0 {
		return nil
	}

	logs := make([]*model.Log, len(requests))
	now := time.Now()

	for i, req := range requests {
		logs[i] = &model.Log{
			UserID:    userID,
			TaskID:    req.TaskID,
			Level:     req.Level,
			Category:  req.Category,
			Message:   req.Message,
			Details:   req.Details,
			CreatedAt: now,
		}
	}

	if err := s.logRepo.BatchCreate(ctx, logs); err != nil {
		return fmt.Errorf("failed to batch create logs: %w", err)
	}

	return nil
}

// ReportError 上报错误日志
func (s *LogService) ReportError(ctx context.Context, userID string, req *model.ReportErrorRequest) error {
	log := &model.Log{
		UserID:   userID,
		TaskID:   req.TaskID,
		Level:    "error",
		Category: "error",
		Message:  req.Message,
		Details: map[string]interface{}{
			"error_type":  req.ErrorType,
			"stack_trace": req.StackTrace,
			"node_id":     req.NodeID,
			"context":     req.Context,
		},
		CreatedAt: time.Now(),
	}

	if err := s.logRepo.Create(ctx, log); err != nil {
		return fmt.Errorf("failed to report error: %w", err)
	}

	// 可选功能：告警通知
	// 根据错误级别和配置，可以集成以下功能：
	// - 邮件通知
	// - Slack/钉钉/企业微信通知
	// - Sentry 错误追踪
	// - 自定义 webhook
	
	s.sendErrorNotification(ctx, req)

	return nil
}

// sendErrorNotification 发送错误通知（占位方法）
func (s *LogService) sendErrorNotification(ctx context.Context, req *model.ReportErrorRequest) {
	// 这里可以实现错误通知逻辑：
	// 1. 检查错误级别和配置
	// 2. 发送到通知渠道（邮件、Slack、钉钉等）
	// 3. 上报到 Sentry
	
	// 示例：根据配置发送通知
	// if config.AppConfig.EnableAlerts {
	//     sendToSlack(req)
	//     sendToSentry(req)
	// }
}

// ListLogs 获取日志列表
func (s *LogService) ListLogs(ctx context.Context, userID string, params *model.LogQueryParams) (*model.LogListResponse, error) {
	logs, total, err := s.logRepo.FindByUserID(ctx, userID, params)
	if err != nil {
		return nil, err
	}

	return &model.LogListResponse{
		List:  logs,
		Total: int64(total),
	}, nil
}

// GetTaskLogs 获取任务日志
func (s *LogService) GetTaskLogs(ctx context.Context, taskID string) ([]*model.Log, error) {
	logs, err := s.logRepo.FindByTaskID(ctx, taskID)
	if err != nil {
		return nil, err
	}

	return logs, nil
}

// CleanOldLogs 清理旧日志
func (s *LogService) CleanOldLogs(ctx context.Context, days int) error {
	if err := s.logRepo.DeleteOldLogs(ctx, days); err != nil {
		return fmt.Errorf("failed to clean old logs: %w", err)
	}

	return nil
}

