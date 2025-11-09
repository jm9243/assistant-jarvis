package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/assistant-jarvis/backend/internal/model"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockUserService 模拟用户服务
type MockUserService struct {
	mock.Mock
}

func (m *MockUserService) GetUserByID(ctx context.Context, userID string) (*model.User, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.User), args.Error(1)
}

func (m *MockUserService) UpdateUser(ctx context.Context, userID string, req *model.UpdateUserRequest) error {
	args := m.Called(ctx, userID, req)
	return args.Error(0)
}

func (m *MockUserService) GetUserDevices(ctx context.Context, userID string) ([]*model.Device, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*model.Device), args.Error(1)
}

func (m *MockUserService) RegisterDevice(ctx context.Context, userID string, req *model.RegisterDeviceRequest) (*model.Device, error) {
	args := m.Called(ctx, userID, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Device), args.Error(1)
}

func setupUserTestRouter(handler *UserHandler) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	
	// 模拟认证中间件
	r.Use(func(c *gin.Context) {
		c.Set("user_id", "test-user-123")
		c.Next()
	})
	
	api := r.Group("/api/v1")
	{
		users := api.Group("/users")
		{
			users.GET("/profile", handler.GetProfile)
			users.PUT("/profile", handler.UpdateProfile)
			users.GET("/devices", handler.GetDevices)
			users.POST("/devices", handler.RegisterDevice)
		}
	}
	
	return r
}

// TestGetProfile_Success 测试获取用户信息成功
func TestGetProfile_Success(t *testing.T) {
	mockService := new(MockUserService)
	handler := NewUserHandler(mockService)
	router := setupUserTestRouter(handler)
	
	expectedUser := &model.User{
		ID:              "test-user-123",
		Email:           "test@example.com",
		Username:        "testuser",
		MembershipLevel: "free",
		StorageQuotaMB:  1000,
		TokenQuota:      100000,
	}
	
	mockService.On("GetUserByID", mock.Anything, "test-user-123").
		Return(expectedUser, nil)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/users/profile", nil)
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["code"])
	
	data := response["data"].(map[string]interface{})
	assert.Equal(t, "test-user-123", data["id"])
	assert.Equal(t, "testuser", data["username"])
	
	mockService.AssertExpectations(t)
}

// TestUpdateProfile_Success 测试更新用户信息成功
func TestUpdateProfile_Success(t *testing.T) {
	mockService := new(MockUserService)
	handler := NewUserHandler(mockService)
	router := setupUserTestRouter(handler)
	
	mockService.On("UpdateUser", mock.Anything, "test-user-123", mock.Anything).
		Return(nil)
	
	reqBody := map[string]interface{}{
		"username": "newusername",
		"avatar":   "https://example.com/avatar.jpg",
	}
	jsonData, _ := json.Marshal(reqBody)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/v1/users/profile", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["code"])
	
	mockService.AssertExpectations(t)
}

// TestGetDevices_Success 测试获取设备列表成功
func TestGetDevices_Success(t *testing.T) {
	mockService := new(MockUserService)
	handler := NewUserHandler(mockService)
	router := setupUserTestRouter(handler)
	
	expectedDevices := []*model.Device{
		{
			ID:         "device-1",
			UserID:     "test-user-123",
			DeviceID:   "mac-001",
			DeviceName: "MacBook Pro",
			OSType:     "macos",
			IsOnline:   true,
		},
		{
			ID:         "device-2",
			UserID:     "test-user-123",
			DeviceID:   "iphone-001",
			DeviceName: "iPhone 14",
			OSType:     "ios",
			IsOnline:   false,
		},
	}
	
	mockService.On("GetUserDevices", mock.Anything, "test-user-123").
		Return(expectedDevices, nil)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/users/devices", nil)
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["code"])
	
	mockService.AssertExpectations(t)
}

// TestRegisterDevice_Success 测试注册设备成功
func TestRegisterDevice_Success(t *testing.T) {
	mockService := new(MockUserService)
	handler := NewUserHandler(mockService)
	router := setupUserTestRouter(handler)
	
	expectedDevice := &model.Device{
		ID:         "device-new",
		UserID:     "test-user-123",
		DeviceID:   "mac-002",
		DeviceName: "MacBook Air",
		OSType:     "macos",
		OSVersion:  "14.0",
		AppVersion: "1.0.0",
		IsOnline:   true,
	}
	
	mockService.On("RegisterDevice", mock.Anything, "test-user-123", mock.Anything).
		Return(expectedDevice, nil)
	
	reqBody := map[string]interface{}{
		"device_id":   "mac-002",
		"device_name": "MacBook Air",
		"os_type":     "macos",
		"os_version":  "14.0",
		"app_version": "1.0.0",
	}
	jsonData, _ := json.Marshal(reqBody)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/users/devices", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["code"])
	
	mockService.AssertExpectations(t)
}

// TestGetProfile_Unauthorized 测试未授权访问
func TestGetProfile_Unauthorized(t *testing.T) {
	mockService := new(MockUserService)
	handler := NewUserHandler(mockService)
	
	// 不设置认证中间件的路由
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/api/v1/users/profile", handler.GetProfile)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/users/profile", nil)
	
	r.ServeHTTP(w, req)
	
	assert.Equal(t, 401, w.Code)
}

