package service

import (
	"context"
	"fmt"

	"github.com/assistant-jarvis/backend/internal/model"
	"github.com/assistant-jarvis/backend/internal/pkg/supabase"
	"github.com/assistant-jarvis/backend/internal/repository"
)

// AuthService 认证服务
type AuthService struct {
	supabaseClient *supabase.Client
	userRepo       *repository.UserRepository
}

// NewAuthService 创建认证服务
func NewAuthService(client *supabase.Client, userRepo *repository.UserRepository) *AuthService {
	return &AuthService{
		supabaseClient: client,
		userRepo:       userRepo,
	}
}

// Register 用户注册
func (s *AuthService) Register(ctx context.Context, req *model.RegisterRequest) (*model.User, error) {
	// 使用 Supabase Auth 注册
	resp, err := s.supabaseClient.Auth().SignUp(req.Email, req.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to register: %w", err)
	}

	// 创建用户 Profile（使用用户的 access_token）
	username := req.Username
	if username == "" {
		// 如果没有提供 username，使用邮箱前缀
		for i := 0; i < len(resp.User.Email); i++ {
			if resp.User.Email[i] == '@' {
				username = resp.User.Email[:i]
				break
			}
		}
	}

	user := &model.User{
		ID:              resp.User.ID,
		Username:        username,
		MembershipLevel: "free",
		StorageQuotaMB:  1000,
		TokenQuota:      100000,
	}

	// 使用用户的 access_token 创建 profile（绕过 RLS）
	if err := s.userRepo.CreateProfileWithToken(ctx, user, resp.AccessToken); err != nil {
		// 如果创建失败，可能是触发器已经创建了，尝试更新
		updateReq := &model.UpdateUserRequest{
			Username: username,
		}
		if updateErr := s.userRepo.UpdateWithToken(ctx, resp.User.ID, updateReq, resp.AccessToken); updateErr != nil {
			return nil, fmt.Errorf("failed to create or update profile: create error: %w, update error: %v", err, updateErr)
		}
	}

	// 获取完整的用户信息（使用 access_token）
	user, err = s.userRepo.FindByIDWithToken(ctx, resp.User.ID, resp.AccessToken)
	if err != nil {
		return nil, fmt.Errorf("failed to get user profile: %w", err)
	}

	return user, nil
}

// Login 用户登录
func (s *AuthService) Login(ctx context.Context, req *model.LoginRequest) (*model.LoginResponse, error) {
	// 使用 Supabase Auth 登录
	resp, err := s.supabaseClient.Auth().SignIn(req.Email, req.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to login: %w", err)
	}

	// 获取用户 Profile（使用 access_token）
	user, err := s.userRepo.FindByIDWithToken(ctx, resp.User.ID, resp.AccessToken)
	if err != nil {
		return nil, fmt.Errorf("failed to get user profile: %w", err)
	}

	return &model.LoginResponse{
		AccessToken:  resp.AccessToken,
		RefreshToken: resp.RefreshToken,
		ExpiresIn:    resp.ExpiresIn,
		User:         user,
	}, nil
}

// VerifyToken 验证 Token
func (s *AuthService) VerifyToken(ctx context.Context, token string) (*model.User, error) {
	// 使用 Supabase Auth 验证
	authUser, err := s.supabaseClient.Auth().User(token)
	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	// 获取用户 Profile
	user, err := s.userRepo.FindByID(ctx, authUser.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user profile: %w", err)
	}

	return user, nil
}

// RefreshToken 刷新 Token
func (s *AuthService) RefreshToken(ctx context.Context, refreshToken string) (*model.LoginResponse, error) {
	// 框架已就绪：等待 Supabase Go SDK 提供 RefreshSession API
	// 参考文档: https://supabase.com/docs/reference/javascript/auth-refreshsession
	//
	// 实现步骤：
	// 1. 调用 s.supabaseClient.Auth().RefreshSession(refreshToken)
	// 2. 验证 refresh token 有效性
	// 3. 生成新的 access token 和 refresh token
	// 4. 获取用户信息并返回
	//
	// 示例代码：
	// resp, err := s.supabaseClient.Auth().RefreshSession(refreshToken)
	// if err != nil {
	//     return nil, fmt.Errorf("failed to refresh token: %w", err)
	// }
	// user, _ := s.userRepo.FindByID(ctx, resp.User.ID)
	// return &model.LoginResponse{...}, nil
	
	return nil, fmt.Errorf("refresh token awaiting Supabase SDK support, framework ready")
}

