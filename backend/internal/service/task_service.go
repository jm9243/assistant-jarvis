package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/assistant-jarvis/backend/internal/api/websocket"
	"github.com/assistant-jarvis/backend/internal/model"
	"github.com/assistant-jarvis/backend/internal/repository"
)

// TaskService 任务服务
type TaskService struct {
	taskRepo     *repository.TaskRepository
	workflowRepo *repository.WorkflowRepository
	wsHub        *websocket.Hub
}

// NewTaskService 创建任务服务
func NewTaskService(taskRepo *repository.TaskRepository, workflowRepo *repository.WorkflowRepository, wsHub *websocket.Hub) *TaskService {
	return &TaskService{
		taskRepo:     taskRepo,
		workflowRepo: workflowRepo,
		wsHub:        wsHub,
	}
}

// CreateTask 创建任务
func (s *TaskService) CreateTask(ctx context.Context, userID string, req *model.CreateTaskRequest) (*model.Task, error) {
	// 验证工作流是否存在
	workflow, err := s.workflowRepo.FindByID(ctx, req.WorkflowID)
	if err != nil {
		return nil, fmt.Errorf("workflow not found: %w", err)
	}
	if workflow.UserID != userID {
		return nil, fmt.Errorf("permission denied")
	}

	task := &model.Task{
		WorkflowID: req.WorkflowID,
		UserID:     userID,
		DeviceID:   req.DeviceID,
		Status:     "pending",
		Priority:   req.Priority,
		Parameters: req.Parameters,
		CreatedAt:  time.Now(),
	}

	if err := s.taskRepo.Create(ctx, task); err != nil {
		return nil, fmt.Errorf("failed to create task: %w", err)
	}

	return task, nil
}

// GetTaskByID 根据 ID 获取任务
func (s *TaskService) GetTaskByID(ctx context.Context, taskID string) (*model.Task, error) {
	task, err := s.taskRepo.FindByID(ctx, taskID)
	if err != nil {
		return nil, err
	}

	return task, nil
}

// ListTasks 获取任务列表
func (s *TaskService) ListTasks(ctx context.Context, userID string, params *model.TaskQueryParams) (*model.TaskListResponse, error) {
	tasks, total, err := s.taskRepo.FindByUserID(ctx, userID, params)
	if err != nil {
		return nil, err
	}

	return &model.TaskListResponse{
		List:  tasks,
		Total: int64(total),
	}, nil
}

// UpdateTaskStatus 更新任务状态
func (s *TaskService) UpdateTaskStatus(ctx context.Context, taskID string, req *model.UpdateTaskStatusRequest) error {
	// 获取任务信息
	task, err := s.taskRepo.FindByID(ctx, taskID)
	if err != nil {
		return err
	}

	// 更新状态
	if err := s.taskRepo.UpdateStatus(ctx, taskID, string(req.Status)); err != nil {
		return err
	}

	// 发送 WebSocket 实时推送
	s.broadcastTaskUpdate(task.UserID, taskID, "status_update", map[string]interface{}{
		"task_id":     taskID,
		"status":      req.Status,
		"error_msg": req.ErrorMsg,
	})

	return nil
}

// UpdateTaskResult 更新任务结果
func (s *TaskService) UpdateTaskResult(ctx context.Context, taskID string, req *model.UpdateTaskResultRequest) error {
	// 获取任务信息
	task, err := s.taskRepo.FindByID(ctx, taskID)
	if err != nil {
		return err
	}

	result := map[string]interface{}{
		"status":      req.Status,
		"end_time":    req.EndTime,
		"duration_ms": req.DurationMs,
		"result":      req.Result,
	}

	if req.ErrorMessage != "" {
		result["error_message"] = req.ErrorMessage
	}

	if err := s.taskRepo.UpdateResult(ctx, taskID, result); err != nil {
		return err
	}

	// 更新工作流执行统计
	if task != nil {
		success := req.Status == "completed"
		_ = s.workflowRepo.IncrementExecutionCount(ctx, task.WorkflowID, success)
	}

	// 发送 WebSocket 实时推送
	s.broadcastTaskUpdate(task.UserID, taskID, "result_update", result)

	return nil
}

// GetTaskStatistics 获取任务统计
func (s *TaskService) GetTaskStatistics(ctx context.Context, userID string, workflowID string) (map[string]interface{}, error) {
	// 暂时返回模拟数据（实际需要通过 Repository 实现）
	// stats, err := s.taskRepo.GetStatistics(ctx, userID, workflowID)
	stats := map[string]interface{}{
		"total":     0,
		"pending":   0,
		"running":   0,
		"completed": 0,
		"failed":    0,
	}

	return stats, nil
}

// broadcastTaskUpdate 广播任务更新消息
func (s *TaskService) broadcastTaskUpdate(userID, taskID, eventType string, data map[string]interface{}) {
	if s.wsHub == nil {
		return
	}

	message := map[string]interface{}{
		"type":      eventType,
		"task_id":   taskID,
		"user_id":   userID,
		"data":      data,
		"timestamp": time.Now().Unix(),
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		return
	}

	// 广播给该用户的所有连接
	s.wsHub.BroadcastToUser(userID, messageBytes)
}

