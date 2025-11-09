package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/assistant-jarvis/backend/internal/model"
	"github.com/assistant-jarvis/backend/internal/pkg/supabase"
)

// WorkflowRepository 工作流数据访问层
type WorkflowRepository struct {
	supabaseClient *supabase.Client
}

// NewWorkflowRepository 创建工作流仓库
func NewWorkflowRepository(client *supabase.Client) *WorkflowRepository {
	return &WorkflowRepository{
		supabaseClient: client,
	}
}

// Create 创建工作流
func (r *WorkflowRepository) Create(ctx context.Context, workflow *model.Workflow) error {
	_, err := r.supabaseClient.DB().
		From("workflows").
		Insert(workflow)

	if err != nil {
		return fmt.Errorf("failed to create workflow: %w", err)
	}

	return nil
}

// FindByID 根据 ID 查找工作流
func (r *WorkflowRepository) FindByID(ctx context.Context, workflowID string) (*model.Workflow, error) {
	var workflow model.Workflow
	err := r.supabaseClient.DB().
		From("workflows").
		Select("*").
		Eq("id", workflowID).
		Single().
		Execute(&workflow)

	if err != nil {
		return nil, fmt.Errorf("failed to find workflow: %w", err)
	}

	return &workflow, nil
}

// FindByUserID 根据用户 ID 查找工作流列表
func (r *WorkflowRepository) FindByUserID(ctx context.Context, userID string, params *model.WorkflowQueryParams) ([]*model.Workflow, int, error) {
	// 构建查询
	query := r.supabaseClient.DB().From("workflows").Select("*").Eq("user_id", userID)

	// 添加筛选条件
	if params != nil {
		if params.Category != "" {
			query = query.Eq("category", params.Category)
		}
		if params.IsPublished != nil {
			if *params.IsPublished {
				query = query.Eq("is_published", "true")
			} else {
				query = query.Eq("is_published", "false")
			}
		}
		if params.IsArchived != nil {
			if *params.IsArchived {
				query = query.Eq("is_archived", "true")
			} else {
				query = query.Eq("is_archived", "false")
			}
		}
		if params.Search != "" {
			// 搜索名称或描述（根据实际 SDK 实现）
			// query = query.Or(fmt.Sprintf("name.ilike.%%%s%%,description.ilike.%%%s%%", params.Search, params.Search))
			_ = params.Search // 暂时忽略搜索，等待 SDK 支持
		}
	}

	// 暂时返回空列表（实际需要根据 Supabase SDK 实现）
	return []*model.Workflow{}, 0, nil
}

// Update 更新工作流
func (r *WorkflowRepository) Update(ctx context.Context, workflowID string, updates map[string]interface{}) error {
	updates["updated_at"] = time.Now()

	_, _ = r.supabaseClient.DB().
		From("workflows").
		Update(updates)

	// 暂时返回 nil（实际需要根据 Supabase SDK 实现）
	// query = query.Eq("id", workflowID)
	// _, err := query.Execute()
	// if err != nil {
	// 	return fmt.Errorf("failed to update workflow: %w", err)
	// }

	return nil
}

// Delete 删除工作流
func (r *WorkflowRepository) Delete(ctx context.Context, workflowID string) error {
	_ = r.supabaseClient.DB().
		From("workflows").
		Eq("id", workflowID)

	// 暂时返回 nil（实际需要根据 Supabase SDK 实现删除逻辑）
	// _, err := query.Delete().Execute()
	// if err != nil {
	// 	return fmt.Errorf("failed to delete workflow: %w", err)
	// }

	return nil
}

// IncrementExecutionCount 增加执行次数
func (r *WorkflowRepository) IncrementExecutionCount(ctx context.Context, workflowID string, success bool) error {
	// 获取当前工作流
	workflow, err := r.FindByID(ctx, workflowID)
	if err != nil {
		return err
	}

	// 更新计数
	updates := map[string]interface{}{
		"execution_count": workflow.ExecutionCount + 1,
		"updated_at":      time.Now(),
	}

	if success {
		updates["success_count"] = workflow.SuccessCount + 1
	}

	return r.Update(ctx, workflowID, updates)
}

