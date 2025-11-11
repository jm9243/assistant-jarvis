package repository

import (
	"context"
	"fmt"

	"github.com/assistant-jarvis/backend/internal/model"
	"github.com/assistant-jarvis/backend/internal/pkg/supabase"
)

// AgentRepository Agent 数据访问层
type AgentRepository struct {
	supabaseClient *supabase.Client
}

// NewAgentRepository 创建 Agent 仓库
func NewAgentRepository(client *supabase.Client) *AgentRepository {
	return &AgentRepository{
		supabaseClient: client,
	}
}

// Create 创建 Agent
func (r *AgentRepository) Create(ctx context.Context, agent *model.Agent) error {
	_, err := r.supabaseClient.DB().
		From("agents").
		Insert(agent)

	if err != nil {
		return fmt.Errorf("failed to create agent: %w", err)
	}

	return nil
}

// FindByID 根据 ID 查找 Agent
func (r *AgentRepository) FindByID(ctx context.Context, agentID string) (*model.Agent, error) {
	var agent model.Agent
	err := r.supabaseClient.DB().
		From("agents").
		Select("*").
		Eq("id", agentID).
		Single().
		Execute(&agent)

	if err != nil {
		return nil, fmt.Errorf("failed to find agent: %w", err)
	}

	return &agent, nil
}

// FindByUserID 根据用户 ID 查找 Agents
func (r *AgentRepository) FindByUserID(ctx context.Context, userID string) ([]*model.Agent, error) {
	var agents []*model.Agent
	err := r.supabaseClient.DB().
		From("agents").
		Select("*").
		Eq("user_id", userID).
		Execute(&agents)

	if err != nil {
		return nil, fmt.Errorf("failed to find agents: %w", err)
	}

	return agents, nil
}

// Update 更新 Agent
func (r *AgentRepository) Update(ctx context.Context, agentID string, req *model.UpdateAgentRequest) error {
	qb, err := r.supabaseClient.DB().
		From("agents").
		Update(req)
	
	if err != nil {
		return fmt.Errorf("failed to update agent: %w", err)
	}
	
	_ = qb.Eq("id", agentID)

	return nil
}

// Delete 删除 Agent
func (r *AgentRepository) Delete(ctx context.Context, agentID string) error {
	qb, err := r.supabaseClient.DB().
		From("agents").
		Update(map[string]interface{}{"status": model.AgentStatusArchived})
	
	if err != nil {
		return fmt.Errorf("failed to delete agent: %w", err)
	}
	
	_ = qb.Eq("id", agentID)

	return nil
}

// ConversationRepository 对话数据访问层
type ConversationRepository struct {
	supabaseClient *supabase.Client
}

// NewConversationRepository 创建对话仓库
func NewConversationRepository(client *supabase.Client) *ConversationRepository {
	return &ConversationRepository{
		supabaseClient: client,
	}
}

// Create 创建对话
func (r *ConversationRepository) Create(ctx context.Context, conv *model.Conversation) error {
	_, err := r.supabaseClient.DB().
		From("conversations").
		Insert(conv)

	if err != nil {
		return fmt.Errorf("failed to create conversation: %w", err)
	}

	return nil
}

// FindByID 根据 ID 查找对话
func (r *ConversationRepository) FindByID(ctx context.Context, convID string) (*model.Conversation, error) {
	var conv model.Conversation
	err := r.supabaseClient.DB().
		From("conversations").
		Select("*").
		Eq("id", convID).
		Single().
		Execute(&conv)

	if err != nil {
		return nil, fmt.Errorf("failed to find conversation: %w", err)
	}

	return &conv, nil
}

// FindByUserID 根据用户 ID 查找对话列表
func (r *ConversationRepository) FindByUserID(ctx context.Context, userID string) ([]*model.Conversation, error) {
	var convs []*model.Conversation
	err := r.supabaseClient.DB().
		From("conversations").
		Select("*").
		Eq("user_id", userID).
		Execute(&convs)

	if err != nil {
		return nil, fmt.Errorf("failed to find conversations: %w", err)
	}

	return convs, nil
}

// CreateMessage 创建消息
func (r *ConversationRepository) CreateMessage(ctx context.Context, msg *model.Message) error {
	_, err := r.supabaseClient.DB().
		From("messages").
		Insert(msg)

	if err != nil {
		return fmt.Errorf("failed to create message: %w", err)
	}

	return nil
}

// FindMessages 查找对话的消息列表
func (r *ConversationRepository) FindMessages(ctx context.Context, convID string) ([]*model.Message, error) {
	var msgs []*model.Message
	err := r.supabaseClient.DB().
		From("messages").
		Select("*").
		Eq("conversation_id", convID).
		Execute(&msgs)

	if err != nil {
		return nil, fmt.Errorf("failed to find messages: %w", err)
	}

	return msgs, nil
}
