package service

import (
	"context"
	"fmt"
	"time"

	"github.com/assistant-jarvis/backend/internal/model"
	"github.com/assistant-jarvis/backend/internal/repository"
	"github.com/google/uuid"
)

// AgentService Agent 服务
type AgentService struct {
	agentRepo *repository.AgentRepository
	convRepo  *repository.ConversationRepository
}

// NewAgentService 创建 Agent 服务
func NewAgentService(agentRepo *repository.AgentRepository, convRepo *repository.ConversationRepository) *AgentService {
	return &AgentService{
		agentRepo: agentRepo,
		convRepo:  convRepo,
	}
}

// CreateAgent 创建 Agent
func (s *AgentService) CreateAgent(ctx context.Context, userID string, req *model.CreateAgentRequest) (*model.Agent, error) {
	now := time.Now()
	agent := &model.Agent{
		ID:               uuid.New().String(),
		UserID:           userID,
		Name:             req.Name,
		Description:      req.Description,
		Type:             req.Type,
		Status:           model.AgentStatusActive,
		AvatarURL:        req.AvatarURL,
		Tags:             req.Tags,
		ModelConfig:      req.ModelConfig,
		SystemPrompt:     req.SystemPrompt,
		PromptTemplate:   req.PromptTemplate,
		MemoryConfig:     req.MemoryConfig,
		KnowledgeBaseIDs: req.KnowledgeBaseIDs,
		ToolIDs:          req.ToolIDs,
		ReActConfig:      req.ReActConfig,
		ResearchConfig:   req.ResearchConfig,
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	if err := s.agentRepo.Create(ctx, agent); err != nil {
		return nil, fmt.Errorf("failed to create agent: %w", err)
	}

	return agent, nil
}

// GetAgent 获取 Agent
func (s *AgentService) GetAgent(ctx context.Context, agentID string) (*model.Agent, error) {
	return s.agentRepo.FindByID(ctx, agentID)
}

// ListAgents 获取 Agent 列表
func (s *AgentService) ListAgents(ctx context.Context, userID string) ([]*model.Agent, error) {
	return s.agentRepo.FindByUserID(ctx, userID)
}

// UpdateAgent 更新 Agent
func (s *AgentService) UpdateAgent(ctx context.Context, agentID string, req *model.UpdateAgentRequest) error {
	return s.agentRepo.Update(ctx, agentID, req)
}

// DeleteAgent 删除 Agent
func (s *AgentService) DeleteAgent(ctx context.Context, agentID string) error {
	return s.agentRepo.Delete(ctx, agentID)
}

// CreateConversation 创建对话
func (s *AgentService) CreateConversation(ctx context.Context, userID string, req *model.CreateConversationRequest) (*model.Conversation, error) {
	now := time.Now()
	conv := &model.Conversation{
		ID:        uuid.New().String(),
		AgentID:   req.AgentID,
		UserID:    userID,
		Title:     req.Title,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := s.convRepo.Create(ctx, conv); err != nil {
		return nil, fmt.Errorf("failed to create conversation: %w", err)
	}

	return conv, nil
}

// GetConversation 获取对话
func (s *AgentService) GetConversation(ctx context.Context, convID string) (*model.Conversation, error) {
	return s.convRepo.FindByID(ctx, convID)
}

// ListConversations 获取对话列表
func (s *AgentService) ListConversations(ctx context.Context, userID string) ([]*model.Conversation, error) {
	return s.convRepo.FindByUserID(ctx, userID)
}

// SendMessage 发送消息
func (s *AgentService) SendMessage(ctx context.Context, convID string, req *model.SendMessageRequest) (*model.Message, error) {
	// 创建用户消息
	userMsg := &model.Message{
		ID:             uuid.New().String(),
		ConversationID: convID,
		Role:           model.MessageRoleUser,
		Content:        req.Content,
		CreatedAt:      time.Now(),
	}

	if err := s.convRepo.CreateMessage(ctx, userMsg); err != nil {
		return nil, fmt.Errorf("failed to create user message: %w", err)
	}

	// TODO: 调用 Python Engine 的 LLM 服务生成回复
	// 这里暂时返回一个占位回复
	assistantMsg := &model.Message{
		ID:             uuid.New().String(),
		ConversationID: convID,
		Role:           model.MessageRoleAssistant,
		Content:        "这是一个占位回复。实际回复需要调用 Python Engine 的 LLM 服务。",
		CreatedAt:      time.Now(),
	}

	if err := s.convRepo.CreateMessage(ctx, assistantMsg); err != nil {
		return nil, fmt.Errorf("failed to create assistant message: %w", err)
	}

	return assistantMsg, nil
}

// GetMessages 获取消息列表
func (s *AgentService) GetMessages(ctx context.Context, convID string) ([]*model.Message, error) {
	return s.convRepo.FindMessages(ctx, convID)
}
