package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/assistant-jarvis/backend/internal/model"
	"github.com/assistant-jarvis/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockAuthService 模拟认证服务
type MockAuthService struct {
	mock.Mock
}

func (m *MockAuthService) Register(email, password, username string) (*model.LoginResponse, error) {
	args := m.Called(email, password, username)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.LoginResponse), args.Error(1)
}

func (m *MockAuthService) Login(email, password string) (*model.LoginResponse, error) {
	args := m.Called(email, password)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.LoginResponse), args.Error(1)
}

func (m *MockAuthService) RefreshToken(refreshToken string) (*model.LoginResponse, error) {
	args := m.Called(refreshToken)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.LoginResponse), args.Error(1)
}

func setupAuthTestRouter(handler *AuthHandler) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	
	r.POST("/api/v1/auth/register", handler.Register)
	r.POST("/api/v1/auth/login", handler.Login)
	r.POST("/api/v1/auth/refresh", handler.RefreshToken)
	
	return r
}

// TestRegister_Success 测试用户注册成功
func TestRegister_Success(t *testing.T) {
	mockService := new(MockAuthService)
	handler := NewAuthHandler(mockService)
	router := setupAuthTestRouter(handler)
	
	expectedResp := &model.LoginResponse{
		AccessToken:  "test-access-token",
		RefreshToken: "test-refresh-token",
		ExpiresIn:    3600,
		User: &model.User{
			ID:       "user-123",
			Email:    "test@example.com",
			Username: "testuser",
		},
	}
	
	mockService.On("Register", "test@example.com", "password123", "testuser").
		Return(expectedResp, nil)
	
	reqBody := map[string]string{
		"email":    "test@example.com",
		"password": "password123",
		"username": "testuser",
	}
	jsonData, _ := json.Marshal(reqBody)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	mockService.AssertExpectations(t)
}

// TestRegister_InvalidRequest 测试无效的注册请求
func TestRegister_InvalidRequest(t *testing.T) {
	mockService := new(MockAuthService)
	handler := NewAuthHandler(mockService)
	router := setupAuthTestRouter(handler)
	
	reqBody := map[string]string{
		"email": "invalid-email", // 缺少 password 和 username
	}
	jsonData, _ := json.Marshal(reqBody)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.NotEqual(t, 0, response["code"]) // 错误码不为 0
}

// TestLogin_Success 测试登录成功
func TestLogin_Success(t *testing.T) {
	mockService := new(MockAuthService)
	handler := NewAuthHandler(mockService)
	router := setupAuthTestRouter(handler)
	
	expectedResp := &model.LoginResponse{
		AccessToken:  "test-access-token",
		RefreshToken: "test-refresh-token",
		ExpiresIn:    3600,
		User: &model.User{
			ID:       "user-123",
			Email:    "test@example.com",
			Username: "testuser",
		},
	}
	
	mockService.On("Login", "test@example.com", "password123").
		Return(expectedResp, nil)
	
	reqBody := map[string]string{
		"email":    "test@example.com",
		"password": "password123",
	}
	jsonData, _ := json.Marshal(reqBody)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	mockService.AssertExpectations(t)
}

// TestLogin_WrongCredentials 测试错误的登录凭证
func TestLogin_WrongCredentials(t *testing.T) {
	mockService := new(MockAuthService)
	handler := NewAuthHandler(mockService)
	router := setupAuthTestRouter(handler)
	
	mockService.On("Login", "test@example.com", "wrongpassword").
		Return(nil, assert.AnError)
	
	reqBody := map[string]string{
		"email":    "test@example.com",
		"password": "wrongpassword",
	}
	jsonData, _ := json.Marshal(reqBody)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.NotEqual(t, 0, response["code"]) // 错误码不为 0
	
	mockService.AssertExpectations(t)
}

// TestRefreshToken_Success 测试刷新 Token 成功
func TestRefreshToken_Success(t *testing.T) {
	mockService := new(MockAuthService)
	handler := NewAuthHandler(mockService)
	router := setupAuthTestRouter(handler)
	
	expectedResp := &model.LoginResponse{
		AccessToken:  "new-access-token",
		RefreshToken: "new-refresh-token",
		ExpiresIn:    3600,
	}
	
	mockService.On("RefreshToken", "old-refresh-token").
		Return(expectedResp, nil)
	
	reqBody := map[string]string{
		"refresh_token": "old-refresh-token",
	}
	jsonData, _ := json.Marshal(reqBody)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/auth/refresh", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	mockService.AssertExpectations(t)
}

// 确保 MockAuthService 实现了 AuthService 接口
var _ interface {
	Register(email, password, username string) (*model.LoginResponse, error)
	Login(email, password string) (*model.LoginResponse, error)
	RefreshToken(refreshToken string) (*model.LoginResponse, error)
} = (*MockAuthService)(nil)

