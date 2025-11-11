package repository

import (
	"context"
	"encoding/json"
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
	// 序列化 API Keys
	apiKeysJSON, err := json.Marshal(llmModel.APIKeys)
	if err != nil {
		return fmt.Errorf("failed to marshal api_keys: %w", err)
	}

	query := `
		INSERT INTO llm_models (
			name, model_id, provider, type, description, status,
			base_url, auth_type, key_usage_mode, api_keys,
			supports_vision, max_tokens, context_window,
			price_per_million_input, price_per_million_output,
			rate_limit_rpm, rate_limit_tpm, platform_id, created_by
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
			$11, $12, $13, $14, $15, $16, $17, $18, $19
		) RETURNING id, created_at, updated_at
	`

	err = r.client.DB.QueryRowContext(
		ctx, query,
		llmModel.Name, llmModel.ModelID, llmModel.Provider, llmModel.Type,
		llmModel.Description, llmModel.Status, llmModel.BaseURL,
		llmModel.AuthType, llmModel.KeyUsageMode, apiKeysJSON,
		llmModel.SupportsVision, llmModel.MaxTokens, llmModel.ContextWindow,
		llmModel.PricePerMillionInput, llmModel.PricePerMillionOutput,
		llmModel.RateLimitRPM, llmModel.RateLimitTPM, llmModel.PlatformID,
		llmModel.CreatedBy,
	).Scan(&llmModel.ID, &llmModel.CreatedAt, &llmModel.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create llm model: %w", err)
	}

	return nil
}

// FindByID 根据ID查询模型
func (r *LLMModelRepository) FindByID(ctx context.Context, id string) (*model.LLMModel, error) {
	query := `
		SELECT id, name, model_id, provider, type, description, status,
			   base_url, auth_type, key_usage_mode, api_keys,
			   supports_vision, max_tokens, context_window,
			   price_per_million_input, price_per_million_output,
			   rate_limit_rpm, rate_limit_tpm, platform_id,
			   created_at, updated_at, created_by
		FROM llm_models
		WHERE id = $1
	`

	var llmModel model.LLMModel
	var apiKeysJSON []byte

	err := r.client.DB.QueryRowContext(ctx, query, id).Scan(
		&llmModel.ID, &llmModel.Name, &llmModel.ModelID, &llmModel.Provider,
		&llmModel.Type, &llmModel.Description, &llmModel.Status,
		&llmModel.BaseURL, &llmModel.AuthType, &llmModel.KeyUsageMode, &apiKeysJSON,
		&llmModel.SupportsVision, &llmModel.MaxTokens, &llmModel.ContextWindow,
		&llmModel.PricePerMillionInput, &llmModel.PricePerMillionOutput,
		&llmModel.RateLimitRPM, &llmModel.RateLimitTPM, &llmModel.PlatformID,
		&llmModel.CreatedAt, &llmModel.UpdatedAt, &llmModel.CreatedBy,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to find llm model: %w", err)
	}

	// 反序列化 API Keys
	if err := json.Unmarshal(apiKeysJSON, &llmModel.APIKeys); err != nil {
		return nil, fmt.Errorf("failed to unmarshal api_keys: %w", err)
	}

	return &llmModel, nil
}

// FindByProviderAndModelID 根据提供商和模型ID查询
func (r *LLMModelRepository) FindByProviderAndModelID(ctx context.Context, provider, modelID string) (*model.LLMModel, error) {
	query := `
		SELECT id, name, model_id, provider, type, description, status,
			   base_url, auth_type, key_usage_mode, api_keys,
			   supports_vision, max_tokens, context_window,
			   price_per_million_input, price_per_million_output,
			   rate_limit_rpm, rate_limit_tpm, platform_id,
			   created_at, updated_at, created_by
		FROM llm_models
		WHERE provider = $1 AND model_id = $2 AND status = 'enabled'
	`

	var llmModel model.LLMModel
	var apiKeysJSON []byte

	err := r.client.DB.QueryRowContext(ctx, query, provider, modelID).Scan(
		&llmModel.ID, &llmModel.Name, &llmModel.ModelID, &llmModel.Provider,
		&llmModel.Type, &llmModel.Description, &llmModel.Status,
		&llmModel.BaseURL, &llmModel.AuthType, &llmModel.KeyUsageMode, &apiKeysJSON,
		&llmModel.SupportsVision, &llmModel.MaxTokens, &llmModel.ContextWindow,
		&llmModel.PricePerMillionInput, &llmModel.PricePerMillionOutput,
		&llmModel.RateLimitRPM, &llmModel.RateLimitTPM, &llmModel.PlatformID,
		&llmModel.CreatedAt, &llmModel.UpdatedAt, &llmModel.CreatedBy,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to find llm model: %w", err)
	}

	// 反序列化 API Keys
	if err := json.Unmarshal(apiKeysJSON, &llmModel.APIKeys); err != nil {
		return nil, fmt.Errorf("failed to unmarshal api_keys: %w", err)
	}

	return &llmModel, nil
}

// List 查询模型列表
func (r *LLMModelRepository) List(ctx context.Context, filters map[string]interface{}) ([]*model.LLMModel, error) {
	query := `
		SELECT id, name, model_id, provider, type, description, status,
			   base_url, auth_type, key_usage_mode, api_keys,
			   supports_vision, max_tokens, context_window,
			   price_per_million_input, price_per_million_output,
			   rate_limit_rpm, rate_limit_tpm, platform_id,
			   created_at, updated_at, created_by
		FROM llm_models
		WHERE 1=1
	`

	args := []interface{}{}
	argIndex := 1

	// 添加过滤条件
	if provider, ok := filters["provider"].(string); ok && provider != "" {
		query += fmt.Sprintf(" AND provider = $%d", argIndex)
		args = append(args, provider)
		argIndex++
	}

	if modelType, ok := filters["type"].(string); ok && modelType != "" {
		query += fmt.Sprintf(" AND type = $%d", argIndex)
		args = append(args, modelType)
		argIndex++
	}

	if status, ok := filters["status"].(string); ok && status != "" {
		query += fmt.Sprintf(" AND status = $%d", argIndex)
		args = append(args, status)
		argIndex++
	}

	query += " ORDER BY created_at DESC"

	rows, err := r.client.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list llm models: %w", err)
	}
	defer rows.Close()

	var models []*model.LLMModel
	for rows.Next() {
		var llmModel model.LLMModel
		var apiKeysJSON []byte

		err := rows.Scan(
			&llmModel.ID, &llmModel.Name, &llmModel.ModelID, &llmModel.Provider,
			&llmModel.Type, &llmModel.Description, &llmModel.Status,
			&llmModel.BaseURL, &llmModel.AuthType, &llmModel.KeyUsageMode, &apiKeysJSON,
			&llmModel.SupportsVision, &llmModel.MaxTokens, &llmModel.ContextWindow,
			&llmModel.PricePerMillionInput, &llmModel.PricePerMillionOutput,
			&llmModel.RateLimitRPM, &llmModel.RateLimitTPM, &llmModel.PlatformID,
			&llmModel.CreatedAt, &llmModel.UpdatedAt, &llmModel.CreatedBy,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan llm model: %w", err)
		}

		// 反序列化 API Keys
		if err := json.Unmarshal(apiKeysJSON, &llmModel.APIKeys); err != nil {
			return nil, fmt.Errorf("failed to unmarshal api_keys: %w", err)
		}

		models = append(models, &llmModel)
	}

	return models, nil
}

// Update 更新模型配置
func (r *LLMModelRepository) Update(ctx context.Context, id string, req *model.UpdateLLMModelRequest) error {
	query := "UPDATE llm_models SET updated_at = NOW()"
	args := []interface{}{}
	argIndex := 1

	if req.Name != nil {
		query += fmt.Sprintf(", name = $%d", argIndex)
		args = append(args, *req.Name)
		argIndex++
	}

	if req.Description != nil {
		query += fmt.Sprintf(", description = $%d", argIndex)
		args = append(args, *req.Description)
		argIndex++
	}

	if req.Status != nil {
		query += fmt.Sprintf(", status = $%d", argIndex)
		args = append(args, *req.Status)
		argIndex++
	}

	if req.BaseURL != nil {
		query += fmt.Sprintf(", base_url = $%d", argIndex)
		args = append(args, *req.BaseURL)
		argIndex++
	}

	if req.AuthType != nil {
		query += fmt.Sprintf(", auth_type = $%d", argIndex)
		args = append(args, *req.AuthType)
		argIndex++
	}

	if req.KeyUsageMode != nil {
		query += fmt.Sprintf(", key_usage_mode = $%d", argIndex)
		args = append(args, *req.KeyUsageMode)
		argIndex++
	}

	if req.APIKeys != nil {
		apiKeysJSON, err := json.Marshal(*req.APIKeys)
		if err != nil {
			return fmt.Errorf("failed to marshal api_keys: %w", err)
		}
		query += fmt.Sprintf(", api_keys = $%d", argIndex)
		args = append(args, apiKeysJSON)
		argIndex++
	}

	if req.SupportsVision != nil {
		query += fmt.Sprintf(", supports_vision = $%d", argIndex)
		args = append(args, *req.SupportsVision)
		argIndex++
	}

	if req.MaxTokens != nil {
		query += fmt.Sprintf(", max_tokens = $%d", argIndex)
		args = append(args, *req.MaxTokens)
		argIndex++
	}

	if req.ContextWindow != nil {
		query += fmt.Sprintf(", context_window = $%d", argIndex)
		args = append(args, *req.ContextWindow)
		argIndex++
	}

	if req.PricePerMillionInput != nil {
		query += fmt.Sprintf(", price_per_million_input = $%d", argIndex)
		args = append(args, *req.PricePerMillionInput)
		argIndex++
	}

	if req.PricePerMillionOutput != nil {
		query += fmt.Sprintf(", price_per_million_output = $%d", argIndex)
		args = append(args, *req.PricePerMillionOutput)
		argIndex++
	}

	if req.RateLimitRPM != nil {
		query += fmt.Sprintf(", rate_limit_rpm = $%d", argIndex)
		args = append(args, *req.RateLimitRPM)
		argIndex++
	}

	if req.RateLimitTPM != nil {
		query += fmt.Sprintf(", rate_limit_tpm = $%d", argIndex)
		args = append(args, *req.RateLimitTPM)
		argIndex++
	}

	if req.PlatformID != nil {
		query += fmt.Sprintf(", platform_id = $%d", argIndex)
		args = append(args, *req.PlatformID)
		argIndex++
	}

	query += fmt.Sprintf(" WHERE id = $%d", argIndex)
	args = append(args, id)

	_, err := r.client.DB.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to update llm model: %w", err)
	}

	return nil
}

// Delete 删除模型配置
func (r *LLMModelRepository) Delete(ctx context.Context, id string) error {
	query := "DELETE FROM llm_models WHERE id = $1"

	_, err := r.client.DB.ExecContext(ctx, query, id)
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
