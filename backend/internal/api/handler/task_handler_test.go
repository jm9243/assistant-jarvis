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

// MockTaskService 模拟任务服务
type MockTaskService struct {
	mock.Mock
}

func (m *MockTaskService) CreateTask(ctx context.Context, userID string, req *model.CreateTaskRequest) (*model.Task, error) {
	args := m.Called(ctx, userID, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Task), args.Error(1)
}

func (m *MockTaskService) GetTaskByID(ctx context.Context, taskID string) (*model.Task, error) {
	args := m.Called(ctx, taskID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Task), args.Error(1)
}

func (m *MockTaskService) ListTasks(ctx context.Context, userID string, params *model.TaskQueryParams) (*model.TaskListResponse, error) {
	args := m.Called(ctx, userID, params)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.TaskListResponse), args.Error(1)
}

func (m *MockTaskService) UpdateTaskStatus(ctx context.Context, taskID string, req *model.UpdateTaskStatusRequest) error {
	args := m.Called(ctx, taskID, req)
	return args.Error(0)
}

func (m *MockTaskService) UpdateTaskResult(ctx context.Context, taskID string, req *model.UpdateTaskResultRequest) error {
	args := m.Called(ctx, taskID, req)
	return args.Error(0)
}

func (m *MockTaskService) GetTaskStatistics(ctx context.Context, userID string, workflowID string) (map[string]interface{}, error) {
	args := m.Called(ctx, userID, workflowID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(map[string]interface{}), args.Error(1)
}

func setupTaskTestRouter(handler *TaskHandler) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	
	// 模拟认证中间件
	r.Use(func(c *gin.Context) {
		c.Set("user_id", "test-user-123")
		c.Next()
	})
	
	api := r.Group("/api/v1")
	{
		tasks := api.Group("/tasks")
		{
			tasks.GET("", handler.List)
			tasks.POST("", handler.Create)
			tasks.GET("/:id", handler.GetByID)
			tasks.PATCH("/:id/status", handler.UpdateStatus)
			tasks.PATCH("/:id/result", handler.UpdateResult)
			tasks.GET("/statistics", handler.GetStatistics)
		}
	}
	
	return r
}

// TestCreateTask_Success 测试创建任务成功
func TestCreateTask_Success(t *testing.T) {
	mockService := new(MockTaskService)
	handler := NewTaskHandler(mockService)
	router := setupTaskTestRouter(handler)
	
	expectedTask := &model.Task{
		ID:         "task-123",
		WorkflowID: "workflow-123",
		UserID:     "test-user-123",
		Status:     "pending",
	}
	
	mockService.On("CreateTask", mock.Anything, "test-user-123", mock.Anything).
		Return(expectedTask, nil)
	
	reqBody := map[string]interface{}{
		"workflow_id": "workflow-123",
		"device_id":   "device-123",
		"priority":    1,
	}
	jsonData, _ := json.Marshal(reqBody)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/tasks", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["code"])
	
	mockService.AssertExpectations(t)
}

// TestListTasks_Success 测试获取任务列表成功
func TestListTasks_Success(t *testing.T) {
	mockService := new(MockTaskService)
	handler := NewTaskHandler(mockService)
	router := setupTaskTestRouter(handler)
	
	expectedList := &model.TaskListResponse{
		List: []*model.Task{
			{
				ID:         "task-1",
				WorkflowID: "workflow-123",
				Status:     "pending",
			},
			{
				ID:         "task-2",
				WorkflowID: "workflow-123",
				Status:     "completed",
			},
		},
		Total: 2,
	}
	
	mockService.On("ListTasks", mock.Anything, "test-user-123", mock.Anything).
		Return(expectedList, nil)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/tasks?page=1&page_size=10", nil)
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["code"])
	
	mockService.AssertExpectations(t)
}

// TestGetTaskByID_Success 测试获取任务详情成功
func TestGetTaskByID_Success(t *testing.T) {
	mockService := new(MockTaskService)
	handler := NewTaskHandler(mockService)
	router := setupTaskTestRouter(handler)
	
	expectedTask := &model.Task{
		ID:         "task-123",
		WorkflowID: "workflow-123",
		Status:     "running",
	}
	
	mockService.On("GetTaskByID", mock.Anything, "task-123").
		Return(expectedTask, nil)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/tasks/task-123", nil)
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["code"])
	
	mockService.AssertExpectations(t)
}

// TestUpdateTaskStatus_Success 测试更新任务状态成功
func TestUpdateTaskStatus_Success(t *testing.T) {
	mockService := new(MockTaskService)
	handler := NewTaskHandler(mockService)
	router := setupTaskTestRouter(handler)
	
	mockService.On("UpdateTaskStatus", mock.Anything, "task-123", mock.Anything).
		Return(nil)
	
	reqBody := map[string]interface{}{
		"status": "running",
	}
	jsonData, _ := json.Marshal(reqBody)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PATCH", "/api/v1/tasks/task-123/status", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["code"])
	
	mockService.AssertExpectations(t)
}

// TestUpdateTaskResult_Success 测试更新任务结果成功
func TestUpdateTaskResult_Success(t *testing.T) {
	mockService := new(MockTaskService)
	handler := NewTaskHandler(mockService)
	router := setupTaskTestRouter(handler)
	
	mockService.On("UpdateTaskResult", mock.Anything, "task-123", mock.Anything).
		Return(nil)
	
	reqBody := map[string]interface{}{
		"status":       "completed",
		"end_time":     "2025-11-08T12:00:00Z",
		"duration_ms":  5000,
		"result":       map[string]interface{}{"success": true},
	}
	jsonData, _ := json.Marshal(reqBody)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PATCH", "/api/v1/tasks/task-123/result", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["code"])
	
	mockService.AssertExpectations(t)
}

// TestGetTaskStatistics_Success 测试获取任务统计成功
func TestGetTaskStatistics_Success(t *testing.T) {
	mockService := new(MockTaskService)
	handler := NewTaskHandler(mockService)
	router := setupTaskTestRouter(handler)
	
	expectedStats := map[string]interface{}{
		"total":     10,
		"pending":   2,
		"running":   3,
		"completed": 4,
		"failed":    1,
	}
	
	mockService.On("GetTaskStatistics", mock.Anything, "test-user-123", "").
		Return(expectedStats, nil)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/tasks/statistics", nil)
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["code"])
	
	mockService.AssertExpectations(t)
}

// TestGetTaskStatistics_WithWorkflowID 测试获取特定工作流的任务统计
func TestGetTaskStatistics_WithWorkflowID(t *testing.T) {
	mockService := new(MockTaskService)
	handler := NewTaskHandler(mockService)
	router := setupTaskTestRouter(handler)
	
	expectedStats := map[string]interface{}{
		"total":     5,
		"pending":   1,
		"running":   2,
		"completed": 2,
		"failed":    0,
	}
	
	mockService.On("GetTaskStatistics", mock.Anything, "test-user-123", "workflow-123").
		Return(expectedStats, nil)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/tasks/statistics?workflow_id=workflow-123", nil)
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["code"])
	
	mockService.AssertExpectations(t)
}

