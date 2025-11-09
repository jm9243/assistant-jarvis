package service

import (
	"context"
	"fmt"
	"time"

	"github.com/assistant-jarvis/backend/internal/model"
	"github.com/assistant-jarvis/backend/internal/pkg/cache"
	"github.com/assistant-jarvis/backend/internal/repository"
)

// WorkflowService 工作流服务
type WorkflowService struct {
	workflowRepo *repository.WorkflowRepository
	cache        *cache.RedisCache
}

// NewWorkflowService 创建工作流服务
func NewWorkflowService(workflowRepo *repository.WorkflowRepository, cache *cache.RedisCache) *WorkflowService {
	return &WorkflowService{
		workflowRepo: workflowRepo,
		cache:        cache,
	}
}

// CreateWorkflow 创建工作流
func (s *WorkflowService) CreateWorkflow(ctx context.Context, userID string, req *model.CreateWorkflowRequest) (*model.Workflow, error) {
	workflow := &model.Workflow{
		UserID:         userID,
		Name:           req.Name,
		Description:    req.Description,
		Category:       req.Category,
		Tags:           req.Tags,
		Icon:           req.Icon,
		Version:        "1.0.0",
		OSRequirements: req.OSRequirements,
		TargetApps:     req.TargetApps,
		Parameters:     req.Parameters,
		Definition:     req.Definition,
		Triggers:       req.Triggers,
		IsPublished:    false,
		IsArchived:     false,
		ExecutionCount: 0,
		SuccessCount:   0,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := s.workflowRepo.Create(ctx, workflow); err != nil {
		return nil, fmt.Errorf("failed to create workflow: %w", err)
	}

	return workflow, nil
}

// GetWorkflowByID 根据 ID 获取工作流
func (s *WorkflowService) GetWorkflowByID(ctx context.Context, workflowID string) (*model.Workflow, error) {
	// 尝试从缓存获取
	cacheKey := fmt.Sprintf("workflow:%s", workflowID)
	// cached, err := s.cache.Get(ctx, cacheKey)
	// if err == nil && cached != nil {
	// 	return cached.(*model.Workflow), nil
	// }

	// 从数据库查询
	workflow, err := s.workflowRepo.FindByID(ctx, workflowID)
	if err != nil {
		return nil, err
	}

	// 写入缓存（5 分钟）
	_ = s.cache.Set(ctx, cacheKey, workflow, 5*time.Minute)

	return workflow, nil
}

// ListWorkflows 获取工作流列表
func (s *WorkflowService) ListWorkflows(ctx context.Context, userID string, params *model.WorkflowQueryParams) (*model.WorkflowListResponse, error) {
	workflows, total, err := s.workflowRepo.FindByUserID(ctx, userID, params)
	if err != nil {
		return nil, err
	}

	return &model.WorkflowListResponse{
		List:  workflows,
		Total: int64(total),
	}, nil
}

// UpdateWorkflow 更新工作流
func (s *WorkflowService) UpdateWorkflow(ctx context.Context, workflowID string, req *model.UpdateWorkflowRequest) error {
	updates := make(map[string]interface{})

	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Category != "" {
		updates["category"] = req.Category
	}
	if req.Definition != nil {
		updates["definition"] = req.Definition
	}
	if req.IsPublished != nil {
		updates["is_published"] = *req.IsPublished
	}
	if req.IsArchived != nil {
		updates["is_archived"] = *req.IsArchived
	}

	if err := s.workflowRepo.Update(ctx, workflowID, updates); err != nil {
		return err
	}

	// 清除缓存
	cacheKey := fmt.Sprintf("workflow:%s", workflowID)
	_ = s.cache.Delete(ctx, cacheKey)

	return nil
}

// DeleteWorkflow 删除工作流
func (s *WorkflowService) DeleteWorkflow(ctx context.Context, workflowID string) error {
	if err := s.workflowRepo.Delete(ctx, workflowID); err != nil {
		return err
	}

	// 清除缓存
	cacheKey := fmt.Sprintf("workflow:%s", workflowID)
	_ = s.cache.Delete(ctx, cacheKey)

	return nil
}

// ExportWorkflow 导出工作流
func (s *WorkflowService) ExportWorkflow(ctx context.Context, workflowID string) (map[string]interface{}, error) {
	workflow, err := s.GetWorkflowByID(ctx, workflowID)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"workflow":       workflow,
		"export_version": "1.0",
		"exported_at":    time.Now().Format(time.RFC3339),
	}, nil
}

// ImportWorkflow 导入工作流
func (s *WorkflowService) ImportWorkflow(ctx context.Context, userID string, data map[string]interface{}) (*model.Workflow, error) {
	// 验证导入数据格式
	workflowData, ok := data["workflow"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid workflow data format")
	}

	// 提取必需字段
	name, ok := workflowData["name"].(string)
	if !ok || name == "" {
		return nil, fmt.Errorf("workflow name is required")
	}

	// 提取可选字段
	description, _ := workflowData["description"].(string)
	category, _ := workflowData["category"].(string)
	icon, _ := workflowData["icon"].(string)

	// 创建新的工作流（使用导入的数据）
	workflow := &model.Workflow{
		UserID:         userID,
		Name:           name,
		Description:    description,
		Category:       category,
		Icon:           icon,
		Version:        "1.0.0", // 重置版本
		IsPublished:    false,   // 导入的工作流默认不发布
		IsArchived:     false,
		ExecutionCount: 0, // 重置计数器
		SuccessCount:   0,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	// 尝试提取 definition、parameters、triggers 等 JSON 字段
	if def, ok := workflowData["definition"].(map[string]interface{}); ok {
		workflow.Definition = def
	}
	if params, ok := workflowData["parameters"].(map[string]interface{}); ok {
		workflow.Parameters = params
	}
	if triggers, ok := workflowData["triggers"].(map[string]interface{}); ok {
		workflow.Triggers = triggers
	}
	if tags, ok := workflowData["tags"].([]interface{}); ok {
		// 转换 tags 为 []string
		stringTags := make([]string, 0, len(tags))
		for _, tag := range tags {
			if str, ok := tag.(string); ok {
				stringTags = append(stringTags, str)
			}
		}
		workflow.Tags = stringTags
	}
	if osReqs, ok := workflowData["os_requirements"].([]interface{}); ok {
		stringOSReqs := make([]string, 0, len(osReqs))
		for _, req := range osReqs {
			if str, ok := req.(string); ok {
				stringOSReqs = append(stringOSReqs, str)
			}
		}
		workflow.OSRequirements = stringOSReqs
	}
	if apps, ok := workflowData["target_apps"].(map[string]interface{}); ok {
		workflow.TargetApps = apps
	}

	// 保存到数据库
	if err := s.workflowRepo.Create(ctx, workflow); err != nil {
		return nil, fmt.Errorf("failed to import workflow: %w", err)
	}

	return workflow, nil
}

