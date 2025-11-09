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

// MockLogService 模拟日志服务
type MockLogService struct {
	mock.Mock
}

func (m *MockLogService) BatchCreateLogs(ctx context.Context, logs []*model.Log) error {
	args := m.Called(ctx, logs)
	return args.Error(0)
}

func (m *MockLogService) ReportError(ctx context.Context, req *model.ReportErrorRequest) error {
	args := m.Called(ctx, req)
	return args.Error(0)
}

func (m *MockLogService) ListLogs(ctx context.Context, userID string, params *model.LogQueryParams) (*model.LogListResponse, error) {
	args := m.Called(ctx, userID, params)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.LogListResponse), args.Error(1)
}

func (m *MockLogService) GetTaskLogs(ctx context.Context, taskID string) ([]*model.Log, error) {
	args := m.Called(ctx, taskID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*model.Log), args.Error(1)
}

func setupLogTestRouter(handler *LogHandler) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	
	// 模拟认证中间件
	r.Use(func(c *gin.Context) {
		c.Set("user_id", "test-user-123")
		c.Next()
	})
	
	api := r.Group("/api/v1")
	{
		logs := api.Group("/logs")
		{
			logs.POST("", handler.BatchCreate)
			logs.POST("/error", handler.ReportError)
			logs.GET("", handler.List)
			logs.GET("/task", handler.GetTaskLogs)
		}
	}
	
	return r
}

// TestBatchCreateLogs_Success 测试批量创建日志成功
func TestBatchCreateLogs_Success(t *testing.T) {
	mockService := new(MockLogService)
	handler := NewLogHandler(mockService)
	router := setupLogTestRouter(handler)
	
	mockService.On("BatchCreateLogs", mock.Anything, mock.Anything).
		Return(nil)
	
	reqBody := map[string]interface{}{
		"logs": []map[string]interface{}{
			{
				"task_id":  "task-123",
				"level":    "info",
				"category": "execution",
				"message":  "Task started",
			},
			{
				"task_id":  "task-123",
				"level":    "info",
				"category": "execution",
				"message":  "Task completed",
			},
		},
	}
	jsonData, _ := json.Marshal(reqBody)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/logs", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["code"])
	
	mockService.AssertExpectations(t)
}

// TestReportError_Success 测试上报错误成功
func TestReportError_Success(t *testing.T) {
	mockService := new(MockLogService)
	handler := NewLogHandler(mockService)
	router := setupLogTestRouter(handler)
	
	mockService.On("ReportError", mock.Anything, mock.Anything).
		Return(nil)
	
	reqBody := map[string]interface{}{
		"task_id":       "task-123",
		"error_type":    "runtime_error",
		"message":       "Failed to execute workflow",
		"stack_trace":   "Error at line 100...",
		"context": map[string]interface{}{
			"workflow_id": "workflow-123",
			"step":        "execution",
		},
	}
	jsonData, _ := json.Marshal(reqBody)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/logs/error", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["code"])
	assert.NotEmpty(t, response["data"].(map[string]interface{})["error_id"])
	
	mockService.AssertExpectations(t)
}

// TestListLogs_Success 测试获取日志列表成功
func TestListLogs_Success(t *testing.T) {
	mockService := new(MockLogService)
	handler := NewLogHandler(mockService)
	router := setupLogTestRouter(handler)
	
	expectedList := &model.LogListResponse{
		List: []*model.Log{
			{
				ID:       "log-1",
				TaskID:   "task-123",
				Level:    "info",
				Category: "execution",
				Message:  "Task started",
			},
			{
				ID:       "log-2",
				TaskID:   "task-123",
				Level:    "info",
				Category: "execution",
				Message:  "Task completed",
			},
		},
		Total: 2,
	}
	
	mockService.On("ListLogs", mock.Anything, "test-user-123", mock.Anything).
		Return(expectedList, nil)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/logs?page=1&page_size=10", nil)
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["code"])
	
	mockService.AssertExpectations(t)
}

// TestListLogs_WithFilters 测试带筛选条件的日志列表
func TestListLogs_WithFilters(t *testing.T) {
	mockService := new(MockLogService)
	handler := NewLogHandler(mockService)
	router := setupLogTestRouter(handler)
	
	expectedList := &model.LogListResponse{
		List: []*model.Log{
			{
				ID:       "log-error-1",
				TaskID:   "task-123",
				Level:    "error",
				Category: "execution",
				Message:  "Task failed",
			},
		},
		Total: 1,
	}
	
	mockService.On("ListLogs", mock.Anything, "test-user-123", mock.Anything).
		Return(expectedList, nil)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/logs?level=error&task_id=task-123", nil)
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["code"])
	
	mockService.AssertExpectations(t)
}

// TestGetTaskLogs_Success 测试获取任务日志成功
func TestGetTaskLogs_Success(t *testing.T) {
	mockService := new(MockLogService)
	handler := NewLogHandler(mockService)
	router := setupLogTestRouter(handler)
	
	expectedLogs := []*model.Log{
		{
			ID:       "log-1",
			TaskID:   "task-123",
			Level:    "info",
			Message:  "Step 1 started",
		},
		{
			ID:       "log-2",
			TaskID:   "task-123",
			Level:    "info",
			Message:  "Step 2 completed",
		},
		{
			ID:       "log-3",
			TaskID:   "task-123",
			Level:    "info",
			Message:  "Task finished",
		},
	}
	
	mockService.On("GetTaskLogs", mock.Anything, "task-123").
		Return(expectedLogs, nil)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/logs/task?task_id=task-123", nil)
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["code"])
	
	logs := response["data"].([]interface{})
	assert.Equal(t, 3, len(logs))
	
	mockService.AssertExpectations(t)
}

// TestGetTaskLogs_MissingTaskID 测试缺少 task_id 参数
func TestGetTaskLogs_MissingTaskID(t *testing.T) {
	mockService := new(MockLogService)
	handler := NewLogHandler(mockService)
	router := setupLogTestRouter(handler)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/logs/task", nil) // 没有 task_id 参数
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.NotEqual(t, float64(0), response["code"]) // 应该返回错误码
}

// TestBatchCreateLogs_EmptyArray 测试空日志数组
func TestBatchCreateLogs_EmptyArray(t *testing.T) {
	mockService := new(MockLogService)
	handler := NewLogHandler(mockService)
	router := setupLogTestRouter(handler)
	
	reqBody := map[string]interface{}{
		"logs": []interface{}{},
	}
	jsonData, _ := json.Marshal(reqBody)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/logs", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.NotEqual(t, float64(0), response["code"]) // 应该返回错误码
}

