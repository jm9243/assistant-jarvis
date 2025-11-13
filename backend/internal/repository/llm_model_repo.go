package repository

import (
	"context"
	"fmt"

	"github.com/assistant-jarvis/backend/internal/model"
	"github.com/assistant-jarvis/backend/internal/pkg/supabase"
)

// LLMModelRepository LLM 模型仓库
type LLMModelRepository struct {
	client *supabase.Client
}

// NewLLMModelRepository 创建 LLM 模型仓库
func NewLLMModelRepository(client *supabase.Client) *LLMModelRepository {
	return &LLMModelRepository{
		client: client,
	}
}

// Create 创建模型配置
func (r *LLMModelRepository) Create(ctx context.Context, llmModel *model.LLMModel) error {
	_, err := r.client.DB().
		From("llm_models").
		Insert(llmModel)

	if err != nil {
		return fmt.Errorf("failed to create llm model: %w", err)
	}

	return nil
}

// FindByID 根据ID查询模型
func (r *LLMModelRepository) FindByID(ctx context.Context, id string) (*model.LLMModel, error) {
	var llmModel model.LLMModel
	err := r.client.DB().
		From("llm_models").
		Select("*").
		Eq("id", id).
		Single().
		Execute(&llmModel)

	if err != nil {
		return nil, fmt.Errorf("failed to find llm model: %w", err)
	}

	return &llmModel, nil
}

// FindByProviderAndModelID 根据提供商和模型ID查询
func (r *LLMModelRepository) FindByProviderAndModelID(ctx context.Context, provider, modelID string) (*model.LLMModel, error) {
	var llmModel model.LLMModel
	err := r.client.DB().
		From("llm_models").
		Select("*").
		Eq("provider", provider).
		Eq("model_id", modelID).
		Eq("status", "enabled").
		Single().
		Execute(&llmModel)

	if err != nil {
		return nil, fmt.Errorf("failed to find llm model: %w", err)
	}

	return &llmModel, nil
}

// List 查询模型列表
func (r *LLMModelRepository) List(ctx context.Context, filters map[string]interface{}) ([]*model.LLMModel, error) {
	query := r.client.DB().From("llm_models").Select("*")

	// 添加过滤条件
	if provider, ok := filters["provider"].(string); ok && provider != "" {
		query = query.Eq("provider", provider)
	}

	if modelType, ok := filters["type"].(string); ok && modelType != "" {
		query = query.Eq("type", modelType)
	}

	if status, ok := filters["status"].(string); ok && status != "" {
		query = query.Eq("status", status)
	}

	var models []*model.LLMModel
	err := query.Execute(&models)
	if err != nil {
		return nil, fmt.Errorf("failed to list llm models: %w", err)
	}

	return models, nil
}

// Update 更新模型配置
func (r *LLMModelRepository) Update(ctx context.Context, id string, req *model.UpdateLLMModelRequest) error {
	_, err := r.client.DB().
		From("llm_models").
		Eq("id", id).
		Update(req)

	if err != nil {
		return fmt.Errorf("failed to update llm model: %w", err)
	}

	return nil
}

// Delete 删除模型配置
func (r *LLMModelRepository) Delete(ctx context.Context, id string) error {
	builder := r.client.DB().From("llm_models")
	builder = builder.Eq("id", id)
	_, _, err := r.client.GetNativeClient().From("llm_models").Delete("", "id.eq."+id).Execute()

	if err != nil {
		return fmt.Errorf("failed to delete llm model: %w", err)
	}

	return nil
}

// GetActiveAPIKey 获取可用的 API Key（支持轮询）
func (r *LLMModelRepository) GetActiveAPIKey(ctx context.Context, modelID string) (string, error) {
	llmModel, err := r.FindByID(ctx, modelID)
	if err != nil {
		return "", err
	}

	// 过滤出启用的密钥
	var enabledKeys []string
	for _, keyConfig := range llmModel.APIKeys {
		if keyConfig.Status == "enabled" {
			enabledKeys = append(enabledKeys, keyConfig.Key)
		}
	}

	if len(enabledKeys) == 0 {
		return "", fmt.Errorf("no enabled API keys found for model %s", modelID)
	}

	// 根据使用模式返回密钥
	if llmModel.KeyUsageMode == "rotation" {
		// TODO: 实现轮询逻辑（可以使用 Redis 记录当前索引）
		// 这里简单返回第一个
		return enabledKeys[0], nil
	}

	// single 模式，返回第一个启用的密钥
	return enabledKeys[0], nil
}
