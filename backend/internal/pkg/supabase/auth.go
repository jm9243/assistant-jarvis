package supabase

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// SupabaseAuthClient Supabase Auth HTTP 客户端
type SupabaseAuthClient struct {
	baseURL string
	apiKey  string
	client  *http.Client
}

// NewAuthClient 创建 Auth 客户端
func NewAuthClient(baseURL, apiKey string) *SupabaseAuthClient {
	return &SupabaseAuthClient{
		baseURL: baseURL + "/auth/v1",
		apiKey:  apiKey,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// SignUpRequest 注册请求
type SignUpRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// SignInRequest 登录请求
type SignInRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// AuthAPIResponse Supabase Auth API 响应（登录时）
type AuthAPIResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token"`
	User         struct {
		ID    string `json:"id"`
		Email string `json:"email"`
	} `json:"user"`
}

// SignUpAPIResponse Supabase Auth 注册响应
type SignUpAPIResponse struct {
	// 需要邮箱确认时的字段
	ID                 string `json:"id,omitempty"`
	Email              string `json:"email,omitempty"`
	ConfirmationSentAt string `json:"confirmation_sent_at,omitempty"`
	
	// 不需要邮箱确认时的字段
	AccessToken  string `json:"access_token,omitempty"`
	RefreshToken string `json:"refresh_token,omitempty"`
	ExpiresIn    int    `json:"expires_in,omitempty"`
	User         *struct {
		ID    string `json:"id"`
		Email string `json:"email"`
	} `json:"user,omitempty"`
}

// SignUp 用户注册
func (c *SupabaseAuthClient) SignUp(email, password string) (*AuthResponse, error) {
	reqBody := SignUpRequest{
		Email:    email,
		Password: password,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", c.baseURL+"/signup", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", c.apiKey)

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("signup failed with status %d: %s", resp.StatusCode, string(body))
	}

	// 尝试解析注册响应
	var signUpResp SignUpAPIResponse
	if err := json.Unmarshal(body, &signUpResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	// 检查响应格式（两种可能：需要确认 vs 不需要确认）
	var userID, userEmail string
	
	if signUpResp.User != nil {
		// 不需要邮箱确认的响应格式
		userID = signUpResp.User.ID
		userEmail = signUpResp.User.Email
	} else if signUpResp.ID != "" {
		// 需要邮箱确认的响应格式
		userID = signUpResp.ID
		userEmail = signUpResp.Email
	} else {
		return nil, fmt.Errorf("signup response missing user ID")
	}

	return &AuthResponse{
		User: &AuthUser{
			ID:    userID,
			Email: userEmail,
		},
		AccessToken:  signUpResp.AccessToken,
		RefreshToken: signUpResp.RefreshToken,
		ExpiresIn:    signUpResp.ExpiresIn,
	}, nil
}

// SignIn 用户登录
func (c *SupabaseAuthClient) SignIn(email, password string) (*AuthResponse, error) {
	reqBody := SignInRequest{
		Email:    email,
		Password: password,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", c.baseURL+"/token?grant_type=password", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", c.apiKey)

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("signin failed with status %d: %s", resp.StatusCode, string(body))
	}

	// 登录响应格式（与注册类似）
	var signInResp SignUpAPIResponse
	if err := json.Unmarshal(body, &signInResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	// 检查是否有用户信息
	if signInResp.User == nil {
		return nil, fmt.Errorf("signin response missing user info")
	}

	return &AuthResponse{
		User: &AuthUser{
			ID:    signInResp.User.ID,
			Email: signInResp.User.Email,
		},
		AccessToken:  signInResp.AccessToken,
		RefreshToken: signInResp.RefreshToken,
		ExpiresIn:    signInResp.ExpiresIn,
	}, nil
}

// GetUser 获取用户信息
func (c *SupabaseAuthClient) GetUser(token string) (*AuthUser, error) {
	req, err := http.NewRequest("GET", c.baseURL+"/user", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("apikey", c.apiKey)

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("get user failed with status %d: %s", resp.StatusCode, string(body))
	}

	var user struct {
		ID    string `json:"id"`
		Email string `json:"email"`
	}
	if err := json.Unmarshal(body, &user); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &AuthUser{
		ID:    user.ID,
		Email: user.Email,
	}, nil
}
