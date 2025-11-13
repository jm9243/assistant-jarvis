package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/assistant-jarvis/backend/internal/model"
	"github.com/assistant-jarvis/backend/internal/repository"
)

// LLMProxyService LLM 代理服务
// 负责转发客户端的 LLM 请求到实际的 LLM 提供商
// 并记录用量
type LLMProxyService struct {
	httpClient       *http.Client
	llmModelRepo     *repository.LLMModelRepository
	keyRotationSvc   *KeyRotationService
	usageSvc         *UsageService
	quotaSvc         *QuotaService
}

// NewLLMProxyService 创建 LLM 代理服务
func NewLLMProxyService(
	llmModelRepo *repository.LLMModelRepository,
	keyRotationSvc *KeyRotationService,
	usageSvc *UsageService,
	quotaSvc *QuotaService,
) *LLMProxyService {
	return &LLMProxyService{
		httpClient: &http.Client{
			Timeout: 60 * time.Second,
		},
		llmModelRepo:   llmModelRepo,
		keyRotationSvc: keyRotationSvc,
		usageSvc:       usageSvc,
		quotaSvc:       quotaSvc,
	}
}

// ChatRequest LLM 聊天请求
type ChatRequest struct {
	Model       string                   `json:"model"`
	Messages    []map[string]interface{} `json:"messages"`
	Temperature float64                  `json:"temperature"`
	MaxTokens   int                      `json:"max_tokens"`
	Stream      bool                     `json:"stream"`
}

// ChatResponse LLM 聊天响应
type ChatResponse struct {
	ID      string `json:"id"`
	Object  string `json:"object"`
	Created int64  `json:"created"`
	Model   string `json:"model"`
	Choices []struct {
		Index   int `json:"index"`
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"message"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
}

// ProxyChat 代理聊天请求
func (s *LLMProxyService) ProxyChat(ctx context.Context, userID string, req *ChatRequest) (*ChatResponse, error) {
	startTime := time.Now()
	
	// 1. 从数据库获取模型配置
	provider := s.inferProvider(req.Model)
	llmModel, err := s.llmModelRepo.FindByProviderAndModelID(ctx, provider, req.Model)
	if err != nil {
		return nil, fmt.Errorf("model not found or not enabled: %w", err)
	}

	// 2. 检查用户配额（预估 token 数）
	estimatedTokens := s.estimateTokens(req)
	if err := s.quotaSvc.ValidateQuota(ctx, userID, estimatedTokens); err != nil {
		return nil, fmt.Errorf("quota validation failed: %w", err)
	}

	// 3. 获取可用的 API Key（支持轮询）
	var apiKey string
	if llmModel.KeyUsageMode == "rotation" && s.keyRotationSvc != nil {
		apiKey, err = s.keyRotationSvc.GetNextAPIKey(ctx, llmModel.ID, llmModel.APIKeys)
	} else {
		apiKey, err = s.llmModelRepo.GetActiveAPIKey(ctx, llmModel.ID)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get API key: %w", err)
	}

	// 4. 构建请求
	reqBody, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", llmModel.BaseURL+"/chat/completions", bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	
	// 根据认证类型设置请求头
	if llmModel.AuthType == "api_key" {
		httpReq.Header.Set("Authorization", "Bearer "+apiKey)
	} else if llmModel.AuthType == "api_secret" {
		httpReq.Header.Set("X-API-Key", apiKey)
	}

	// 5. 发送请求
	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		// 标记密钥失败
		if s.keyRotationSvc != nil {
			s.keyRotationSvc.MarkKeyAsFailed(ctx, llmModel.ID, apiKey)
		}
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// 6. 解析响应
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		// 标记密钥失败
		if s.keyRotationSvc != nil {
			s.keyRotationSvc.MarkKeyAsFailed(ctx, llmModel.ID, apiKey)
		}
		return nil, fmt.Errorf("LLM API error: %s", string(body))
	}

	var chatResp ChatResponse
	if err := json.Unmarshal(body, &chatResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	// 7. 记录用量
	requestDuration := int(time.Since(startTime).Milliseconds())
	go s.recordUsage(ctx, userID, llmModel, &chatResp, requestDuration)

	return &chatResp, nil
}

// estimateTokens 预估 token 数量（简单实现）
func (s *LLMProxyService) estimateTokens(req *ChatRequest) int {
	// 简单估算：每个字符约 0.25 个 token
	totalChars := 0
	for _, msg := range req.Messages {
		if content, ok := msg["content"].(string); ok {
			totalChars += len(content)
		}
	}
	
	estimatedInputTokens := totalChars / 4
	estimatedOutputTokens := req.MaxTokens
	
	return estimatedInputTokens + estimatedOutputTokens
}

// inferProvider 根据模型名称推断提供商
func (s *LLMProxyService) inferProvider(model string) string {
	if len(model) >= 3 && model[:3] == "gpt" {
		return "openai"
	}
	if len(model) >= 6 && model[:6] == "claude" {
		return "claude"
	}
	return "openai" // 默认
}

// recordUsage 记录用量
func (s *LLMProxyService) recordUsage(ctx context.Context, userID string, llmModel *model.LLMModel, resp *ChatResponse, requestDuration int) {
	if s.usageSvc == nil {
		return
	}

	// 计算费用
	cost := 0.0
	if llmModel.PricePerMillionInput != nil && llmModel.PricePerMillionOutput != nil {
		cost = s.usageSvc.CalculateCost(
			resp.Usage.PromptTokens,
			resp.Usage.CompletionTokens,
			*llmModel.PricePerMillionInput,
			*llmModel.PricePerMillionOutput,
		)
	}

	// 创建用量记录
	record := &model.UsageRecord{
		UserID:            userID,
		ModelID:           llmModel.ID,
		Provider:          llmModel.Provider,
		Model:             llmModel.ModelID,
		PromptTokens:      resp.Usage.PromptTokens,
		CompletionTokens:  resp.Usage.CompletionTokens,
		TotalTokens:       resp.Usage.TotalTokens,
		Cost:              cost,
		RequestDurationMs: requestDuration,
	}

	// 异步记录
	if err := s.usageSvc.RecordUsage(context.Background(), record); err != nil {
		// 记录失败不影响主流程，只记录日志
		// logger.Error("Failed to record usage", zap.Error(err))
	}
}

// GetAvailableModels 获取可用模型列表
func (s *LLMProxyService) GetAvailableModels(ctx context.Context, userID string) ([]*model.AvailableModel, error) {
	// 从数据库获取启用的模型
	filters := map[string]interface{}{
		"status": "enabled",
	}
	
	llmModels, err := s.llmModelRepo.List(ctx, filters)
	if err != nil {
		return nil, fmt.Errorf("failed to get models: %w", err)
	}

	// 转换为客户端视图（不包含敏感信息）
	var availableModels []*model.AvailableModel
	for _, llmModel := range llmModels {
		maxTokens := 0
		if llmModel.MaxTokens != nil {
			maxTokens = *llmModel.MaxTokens
		}
		
		contextWindow := 0
		if llmModel.ContextWindow != nil {
			contextWindow = *llmModel.ContextWindow
		}

		availableModels = append(availableModels, &model.AvailableModel{
			ID:             llmModel.ID,
			Name:           llmModel.Name,
			ModelID:        llmModel.ModelID,
			Provider:       llmModel.Provider,
			Type:           llmModel.Type,
			Description:    llmModel.Description,
			SupportsVision: llmModel.SupportsVision,
			MaxTokens:      maxTokens,
			ContextWindow:  contextWindow,
		})
	}

	return availableModels, nil
}

// GetUserUsage 获取用户用量统计
func (s *LLMProxyService) GetUserUsage(ctx context.Context, userID string) (*model.UsageStats, error) {
	// TODO: 从数据库查询用户用量
	return &model.UsageStats{
		TotalTokens:      50000,
		UsedTokens:       5000,
		RemainingTokens:  45000,
		TotalCost:        0.05,
		CurrentMonthCost: 0.05,
	}, nil
}
