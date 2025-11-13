package repository

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/assistant-jarvis/backend/internal/config"
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

// FindByID 根据 ID 查找用户（使用 anon key）
func (r *UserRepository) FindByID(ctx context.Context, userID string) (*model.User, error) {
	// 使用原生客户端查询
	data, _, err := r.supabaseClient.GetNativeClient().
		From("user_profiles").
		Select("*", "exact", false).
		Eq("id", userID).
		Execute()

	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	// 解析为数组
	var users []model.User
	if err := json.Unmarshal(data, &users); err != nil {
		return nil, fmt.Errorf("failed to parse users: %w", err)
	}

	if len(users) == 0 {
		return nil, fmt.Errorf("user not found")
	}

	return &users[0], nil
}

// FindByIDWithToken 使用指定 token 查找用户
func (r *UserRepository) FindByIDWithToken(ctx context.Context, userID string, token string) (*model.User, error) {
	if token == "" {
		// 没有 token，使用默认客户端
		return r.FindByID(ctx, userID)
	}

	// 使用 HTTP 直接请求（带 token）
	url := fmt.Sprintf("%s/rest/v1/user_profiles?id=eq.%s", config.AppConfig.SupabaseURL, userID)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("apikey", config.AppConfig.SupabaseKey)
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}



	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("query failed with status %d: %s", resp.StatusCode, string(body))
	}

	// 解析为数组
	var users []model.User
	if err := json.Unmarshal(body, &users); err != nil {
		return nil, fmt.Errorf("failed to parse users: %w", err)
	}

	if len(users) == 0 {
		return nil, fmt.Errorf("user not found")
	}

	return &users[0], nil
}

// Update 更新用户信息（使用 anon key）
func (r *UserRepository) Update(ctx context.Context, userID string, req *model.UpdateUserRequest) error {
	return r.UpdateWithToken(ctx, userID, req, "")
}

// UpdateWithToken 使用指定 token 更新用户信息
func (r *UserRepository) UpdateWithToken(ctx context.Context, userID string, req *model.UpdateUserRequest, token string) error {
	if token == "" {
		// 没有 token，使用默认客户端
		return r.Update(ctx, userID, req)
	}

	// 构建更新数据
	updateData := make(map[string]interface{})
	if req.Username != "" {
		updateData["username"] = req.Username
	}
	if req.AvatarURL != "" {
		updateData["avatar_url"] = req.AvatarURL
	}

	// 使用 HTTP 直接请求（带 token）
	jsonData, err := json.Marshal(updateData)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	url := fmt.Sprintf("%s/rest/v1/user_profiles?id=eq.%s", config.AppConfig.SupabaseURL, userID)
	httpReq, err := http.NewRequestWithContext(ctx, "PATCH", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("apikey", config.AppConfig.SupabaseKey)
	httpReq.Header.Set("Authorization", "Bearer "+token)
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Prefer", "return=minimal")

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("update failed with status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// CreateProfile 创建用户 Profile（使用 anon key）
func (r *UserRepository) CreateProfile(ctx context.Context, user *model.User) error {
	return r.CreateProfileWithToken(ctx, user, "")
}

// CreateProfileWithToken 使用指定 token 创建用户 Profile
func (r *UserRepository) CreateProfileWithToken(ctx context.Context, user *model.User, token string) error {
	if token == "" {
		// 没有 token，使用默认客户端
		return r.CreateProfile(ctx, user)
	}

	// 构建插入数据
	insertData := map[string]interface{}{
		"id":               user.ID,
		"username":         user.Username,
		"membership_level": user.MembershipLevel,
		"storage_quota_mb": user.StorageQuotaMB,
		"token_quota":      user.TokenQuota,
	}

	// 使用 HTTP 直接请求（带 token）
	jsonData, err := json.Marshal(insertData)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	url := fmt.Sprintf("%s/rest/v1/user_profiles", config.AppConfig.SupabaseURL)
	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("apikey", config.AppConfig.SupabaseKey)
	httpReq.Header.Set("Authorization", "Bearer "+token)
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Prefer", "return=minimal")

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		return fmt.Errorf("insert failed with status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

