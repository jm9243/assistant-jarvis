package repository

import (
	"context"
	"fmt"

	"github.com/assistant-jarvis/backend/internal/model"
	"github.com/assistant-jarvis/backend/internal/pkg/supabase"
)

// TaskRepository 任务数据访问层
type TaskRepository struct {
	supabaseClient *supabase.Client
}

// NewTaskRepository 创建任务仓库
func NewTaskRepository(client *supabase.Client) *TaskRepository {
	return &TaskRepository{
		supabaseClient: client,
	}
}

// Create 创建任务
func (r *TaskRepository) Create(ctx context.Context, task *model.Task) error {
	_, err := r.supabaseClient.DB().
		From("tasks").
		Insert(task)

	if err != nil {
		return fmt.Errorf("failed to create task: %w", err)
	}

	return nil
}

// FindByID 根据 ID 查找任务
func (r *TaskRepository) FindByID(ctx context.Context, taskID string) (*model.Task, error) {
	var task model.Task
	err := r.supabaseClient.DB().
		From("tasks").
		Select("*").
		Eq("id", taskID).
		Single().
		Execute(&task)

	if err != nil {
		return nil, fmt.Errorf("failed to find task: %w", err)
	}

	return &task, nil
}

// FindByUserID 根据用户 ID 查找任务列表
func (r *TaskRepository) FindByUserID(ctx context.Context, userID string, params *model.TaskQueryParams) ([]*model.Task, int, error) {
	// 构建查询
	query := r.supabaseClient.DB().From("tasks").Select("*").Eq("user_id", userID)

	// 添加筛选条件
	if params != nil {
		if params.WorkflowID != "" {
			query = query.Eq("workflow_id", params.WorkflowID)
		}
		if params.Status != "" {
			query = query.Eq("status", string(params.Status))
		}
		if params.DeviceID != "" {
			query = query.Eq("device_id", params.DeviceID)
		}
	}

	// 暂时返回空列表（实际需要根据 Supabase SDK 实现）
	// var tasks []*model.Task
	// err := query.Execute(&tasks)
	
	return []*model.Task{}, 0, nil
}

// UpdateStatus 更新任务状态
func (r *TaskRepository) UpdateStatus(ctx context.Context, taskID string, status string) error {
	updates := map[string]interface{}{
		"status": status,
	}

	_, err := r.supabaseClient.DB().
		From("tasks").
		Update(updates)

	if err != nil {
		return fmt.Errorf("failed to update task status: %w", err)
	}

	return nil
}

// UpdateResult 更新任务结果
func (r *TaskRepository) UpdateResult(ctx context.Context, taskID string, result map[string]interface{}) error {
	updates := map[string]interface{}{
		"result": result,
		"status": "completed",
	}

	_, err := r.supabaseClient.DB().
		From("tasks").
		Update(updates)

	if err != nil {
		return fmt.Errorf("failed to update task result: %w", err)
	}

	return nil
}

