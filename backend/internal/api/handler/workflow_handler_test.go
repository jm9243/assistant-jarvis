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

// MockWorkflowService 模拟工作流服务
type MockWorkflowService struct {
	mock.Mock
}

func (m *MockWorkflowService) CreateWorkflow(ctx context.Context, userID string, req *model.CreateWorkflowRequest) (*model.Workflow, error) {
	args := m.Called(ctx, userID, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Workflow), args.Error(1)
}

func (m *MockWorkflowService) GetWorkflowByID(ctx context.Context, workflowID string) (*model.Workflow, error) {
	args := m.Called(ctx, workflowID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Workflow), args.Error(1)
}

func (m *MockWorkflowService) ListWorkflows(ctx context.Context, userID string, params *model.WorkflowQueryParams) (*model.WorkflowListResponse, error) {
	args := m.Called(ctx, userID, params)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.WorkflowListResponse), args.Error(1)
}

func (m *MockWorkflowService) UpdateWorkflow(ctx context.Context, workflowID string, req *model.UpdateWorkflowRequest) error {
	args := m.Called(ctx, workflowID, req)
	return args.Error(0)
}

func (m *MockWorkflowService) DeleteWorkflow(ctx context.Context, workflowID string) error {
	args := m.Called(ctx, workflowID)
	return args.Error(0)
}

func (m *MockWorkflowService) ExportWorkflow(ctx context.Context, workflowID string) (map[string]interface{}, error) {
	args := m.Called(ctx, workflowID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(map[string]interface{}), args.Error(1)
}

func (m *MockWorkflowService) ImportWorkflow(ctx context.Context, userID string, data map[string]interface{}) (*model.Workflow, error) {
	args := m.Called(ctx, userID, data)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Workflow), args.Error(1)
}

func setupWorkflowTestRouter(handler *WorkflowHandler) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	
	// 模拟认证中间件
	r.Use(func(c *gin.Context) {
		c.Set("user_id", "test-user-123")
		c.Next()
	})
	
	api := r.Group("/api/v1")
	{
		workflows := api.Group("/workflows")
		{
			workflows.GET("", handler.List)
			workflows.POST("", handler.Create)
			workflows.GET("/:id", handler.GetByID)
			workflows.PUT("/:id", handler.Update)
			workflows.DELETE("/:id", handler.Delete)
			workflows.GET("/:id/export", handler.Export)
			workflows.POST("/import", handler.Import)
		}
	}
	
	return r
}

// TestCreateWorkflow_Success 测试创建工作流成功
func TestCreateWorkflow_Success(t *testing.T) {
	mockService := new(MockWorkflowService)
	handler := NewWorkflowHandler(mockService)
	router := setupWorkflowTestRouter(handler)
	
	expectedWorkflow := &model.Workflow{
		ID:          "workflow-123",
		UserID:      "test-user-123",
		Name:        "Test Workflow",
		Description: "Test Description",
		Category:    "automation",
	}
	
	mockService.On("CreateWorkflow", mock.Anything, "test-user-123", mock.Anything).
		Return(expectedWorkflow, nil)
	
	reqBody := map[string]interface{}{
		"name":        "Test Workflow",
		"description": "Test Description",
		"category":    "automation",
	}
	jsonData, _ := json.Marshal(reqBody)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/workflows", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["code"])
	
	mockService.AssertExpectations(t)
}

// TestListWorkflows_Success 测试获取工作流列表成功
func TestListWorkflows_Success(t *testing.T) {
	mockService := new(MockWorkflowService)
	handler := NewWorkflowHandler(mockService)
	router := setupWorkflowTestRouter(handler)
	
	expectedList := &model.WorkflowListResponse{
		List: []*model.Workflow{
			{
				ID:          "workflow-1",
				Name:        "Workflow 1",
				Description: "Description 1",
			},
			{
				ID:          "workflow-2",
				Name:        "Workflow 2",
				Description: "Description 2",
			},
		},
		Total: 2,
	}
	
	mockService.On("ListWorkflows", mock.Anything, "test-user-123", mock.Anything).
		Return(expectedList, nil)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/workflows?page=1&page_size=10", nil)
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["code"])
	
	mockService.AssertExpectations(t)
}

// TestGetWorkflowByID_Success 测试获取工作流详情成功
func TestGetWorkflowByID_Success(t *testing.T) {
	mockService := new(MockWorkflowService)
	handler := NewWorkflowHandler(mockService)
	router := setupWorkflowTestRouter(handler)
	
	expectedWorkflow := &model.Workflow{
		ID:          "workflow-123",
		Name:        "Test Workflow",
		Description: "Test Description",
	}
	
	mockService.On("GetWorkflowByID", mock.Anything, "workflow-123").
		Return(expectedWorkflow, nil)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/workflows/workflow-123", nil)
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["code"])
	
	mockService.AssertExpectations(t)
}

// TestUpdateWorkflow_Success 测试更新工作流成功
func TestUpdateWorkflow_Success(t *testing.T) {
	mockService := new(MockWorkflowService)
	handler := NewWorkflowHandler(mockService)
	router := setupWorkflowTestRouter(handler)
	
	mockService.On("UpdateWorkflow", mock.Anything, "workflow-123", mock.Anything).
		Return(nil)
	
	reqBody := map[string]interface{}{
		"name":        "Updated Workflow",
		"description": "Updated Description",
	}
	jsonData, _ := json.Marshal(reqBody)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/v1/workflows/workflow-123", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["code"])
	
	mockService.AssertExpectations(t)
}

// TestDeleteWorkflow_Success 测试删除工作流成功
func TestDeleteWorkflow_Success(t *testing.T) {
	mockService := new(MockWorkflowService)
	handler := NewWorkflowHandler(mockService)
	router := setupWorkflowTestRouter(handler)
	
	mockService.On("DeleteWorkflow", mock.Anything, "workflow-123").
		Return(nil)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/api/v1/workflows/workflow-123", nil)
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["code"])
	
	mockService.AssertExpectations(t)
}

// TestExportWorkflow_Success 测试导出工作流成功
func TestExportWorkflow_Success(t *testing.T) {
	mockService := new(MockWorkflowService)
	handler := NewWorkflowHandler(mockService)
	router := setupWorkflowTestRouter(handler)
	
	exportData := map[string]interface{}{
		"workflow": map[string]interface{}{
			"name":        "Test Workflow",
			"description": "Test Description",
		},
		"export_version": "1.0",
	}
	
	mockService.On("ExportWorkflow", mock.Anything, "workflow-123").
		Return(exportData, nil)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/workflows/workflow-123/export", nil)
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["code"])
	
	mockService.AssertExpectations(t)
}

// TestImportWorkflow_Success 测试导入工作流成功
func TestImportWorkflow_Success(t *testing.T) {
	mockService := new(MockWorkflowService)
	handler := NewWorkflowHandler(mockService)
	router := setupWorkflowTestRouter(handler)
	
	importedWorkflow := &model.Workflow{
		ID:          "workflow-new",
		Name:        "Imported Workflow",
		Description: "Imported Description",
	}
	
	mockService.On("ImportWorkflow", mock.Anything, "test-user-123", mock.Anything).
		Return(importedWorkflow, nil)
	
	reqBody := map[string]interface{}{
		"workflow": map[string]interface{}{
			"name":        "Imported Workflow",
			"description": "Imported Description",
		},
	}
	jsonData, _ := json.Marshal(reqBody)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/workflows/import", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["code"])
	
	mockService.AssertExpectations(t)
}

