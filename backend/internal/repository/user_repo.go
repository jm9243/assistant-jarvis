package repository

import (
	"context"
	"fmt"

	"github.com/assistant-jarvis/backend/internal/model"
	"github.com/assistant-jarvis/backend/internal/pkg/supabase"
)

// UserRepository 用户数据访问层
type UserRepository struct {
	supabaseClient *supabase.Client
}

// NewUserRepository 创建用户仓库
func NewUserRepository(client *supabase.Client) *UserRepository {
	return &UserRepository{
		supabaseClient: client,
	}
}

// FindByID 根据 ID 查找用户
func (r *UserRepository) FindByID(ctx context.Context, userID string) (*model.User, error) {
	var user model.User
	err := r.supabaseClient.DB().
		From("user_profiles").
		Select("*").
		Eq("id", userID).
		Single().
		Execute(&user)

	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	return &user, nil
}

// Update 更新用户信息
func (r *UserRepository) Update(ctx context.Context, userID string, req *model.UpdateUserRequest) error {
	_, err := r.supabaseClient.DB().
		From("user_profiles").
		Update(req)

	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	return nil
}

// CreateProfile 创建用户 Profile
func (r *UserRepository) CreateProfile(ctx context.Context, user *model.User) error {
	_, err := r.supabaseClient.DB().
		From("user_profiles").
		Insert(user)

	if err != nil {
		return fmt.Errorf("failed to create user profile: %w", err)
	}

	return nil
}

