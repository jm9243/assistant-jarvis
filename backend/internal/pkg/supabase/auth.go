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

// AuthAPIResponse Supabase Auth API 响应
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

	var apiResp AuthAPIResponse
	if err := json.Unmarshal(body, &apiResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &AuthResponse{
		User: &AuthUser{
			ID:    apiResp.User.ID,
			Email: apiResp.User.Email,
		},
		AccessToken:  apiResp.AccessToken,
		RefreshToken: apiResp.RefreshToken,
		ExpiresIn:    apiResp.ExpiresIn,
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

	var apiResp AuthAPIResponse
	if err := json.Unmarshal(body, &apiResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &AuthResponse{
		User: &AuthUser{
			ID:    apiResp.User.ID,
			Email: apiResp.User.Email,
		},
		AccessToken:  apiResp.AccessToken,
		RefreshToken: apiResp.RefreshToken,
		ExpiresIn:    apiResp.ExpiresIn,
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
