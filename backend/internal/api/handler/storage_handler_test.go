package handler

import (
	"bytes"
	"context"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockStorageService 模拟存储服务
type MockStorageService struct {
	mock.Mock
}

func (m *MockStorageService) UploadWorkflowFile(ctx context.Context, userID string, file multipart.File, filename string) (string, error) {
	args := m.Called(ctx, userID, file, filename)
	return args.String(0), args.Error(1)
}

func (m *MockStorageService) UploadScreenshot(ctx context.Context, taskID string, file multipart.File, filename string) (string, error) {
	args := m.Called(ctx, taskID, file, filename)
	return args.String(0), args.Error(1)
}

func (m *MockStorageService) UploadAvatar(ctx context.Context, userID string, file multipart.File, filename string) (string, error) {
	args := m.Called(ctx, userID, file, filename)
	return args.String(0), args.Error(1)
}

func (m *MockStorageService) DeleteWorkflowFile(ctx context.Context, filePath string) error {
	args := m.Called(ctx, filePath)
	return args.Error(0)
}

func (m *MockStorageService) DeleteScreenshot(ctx context.Context, filePath string) error {
	args := m.Called(ctx, filePath)
	return args.Error(0)
}

func (m *MockStorageService) DeleteAvatar(ctx context.Context, filePath string) error {
	args := m.Called(ctx, filePath)
	return args.Error(0)
}

func setupStorageTestRouter(handler *StorageHandler) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	
	// 模拟认证中间件
	r.Use(func(c *gin.Context) {
		c.Set("user_id", "test-user-123")
		c.Next()
	})
	
	api := r.Group("/api/v1")
	{
		storage := api.Group("/storage")
		{
			storage.POST("/workflows/upload", handler.UploadWorkflowFile)
			storage.POST("/screenshots/upload", handler.UploadScreenshot)
			storage.POST("/avatar/upload", handler.UploadAvatar)
			storage.DELETE("/:bucket/:path", handler.DeleteFile)
		}
	}
	
	return r
}

// TestUploadWorkflowFile_Success 测试上传工作流文件成功
func TestUploadWorkflowFile_Success(t *testing.T) {
	mockService := new(MockStorageService)
	handler := NewStorageHandler(mockService)
	router := setupStorageTestRouter(handler)
	
	mockService.On("UploadWorkflowFile", mock.Anything, "test-user-123", mock.Anything, mock.Anything).
		Return("https://example.com/workflows/test.json", nil)
	
	// 创建表单数据
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("file", "test-workflow.json")
	part.Write([]byte(`{"name":"test workflow"}`))
	writer.Close()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/storage/workflows/upload", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	mockService.AssertExpectations(t)
}

// TestUploadScreenshot_Success 测试上传截图成功
func TestUploadScreenshot_Success(t *testing.T) {
	mockService := new(MockStorageService)
	handler := NewStorageHandler(mockService)
	router := setupStorageTestRouter(handler)
	
	mockService.On("UploadScreenshot", mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return("https://example.com/screenshots/test.png", nil)
	
	// 创建表单数据
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	
	// 添加 task_id 字段
	writer.WriteField("task_id", "task-123")
	
	// 添加文件
	part, _ := writer.CreateFormFile("file", "screenshot.png")
	part.Write([]byte("fake image data"))
	writer.Close()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/storage/screenshots/upload", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	mockService.AssertExpectations(t)
}

// TestUploadAvatar_Success 测试上传头像成功
func TestUploadAvatar_Success(t *testing.T) {
	mockService := new(MockStorageService)
	handler := NewStorageHandler(mockService)
	router := setupStorageTestRouter(handler)
	
	mockService.On("UploadAvatar", mock.Anything, "test-user-123", mock.Anything, mock.Anything).
		Return("https://example.com/avatars/test-user-123.jpg", nil)
	
	// 创建表单数据
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("file", "avatar.jpg")
	part.Write([]byte("fake image data"))
	writer.Close()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/storage/avatar/upload", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	mockService.AssertExpectations(t)
}

// TestDeleteFile_Workflow 测试删除工作流文件
func TestDeleteFile_Workflow(t *testing.T) {
	mockService := new(MockStorageService)
	handler := NewStorageHandler(mockService)
	router := setupStorageTestRouter(handler)
	
	mockService.On("DeleteWorkflowFile", mock.Anything, "test-file.json").
		Return(nil)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/api/v1/storage/workflows/test-file.json", nil)
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	mockService.AssertExpectations(t)
}

// TestDeleteFile_Screenshot 测试删除截图文件
func TestDeleteFile_Screenshot(t *testing.T) {
	mockService := new(MockStorageService)
	handler := NewStorageHandler(mockService)
	router := setupStorageTestRouter(handler)
	
	mockService.On("DeleteScreenshot", mock.Anything, "test-screenshot.png").
		Return(nil)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/api/v1/storage/screenshots/test-screenshot.png", nil)
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	mockService.AssertExpectations(t)
}

// TestDeleteFile_Avatar 测试删除头像文件
func TestDeleteFile_Avatar(t *testing.T) {
	mockService := new(MockStorageService)
	handler := NewStorageHandler(mockService)
	router := setupStorageTestRouter(handler)
	
	mockService.On("DeleteAvatar", mock.Anything, "user-123.jpg").
		Return(nil)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/api/v1/storage/avatars/user-123.jpg", nil)
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	mockService.AssertExpectations(t)
}

// TestUploadWorkflowFile_NoFile 测试上传工作流文件时缺少文件
func TestUploadWorkflowFile_NoFile(t *testing.T) {
	mockService := new(MockStorageService)
	handler := NewStorageHandler(mockService)
	router := setupStorageTestRouter(handler)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/storage/workflows/upload", nil)
	req.Header.Set("Content-Type", "multipart/form-data")
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
}

// TestUploadScreenshot_MissingTaskID 测试上传截图时缺少 task_id
func TestUploadScreenshot_MissingTaskID(t *testing.T) {
	mockService := new(MockStorageService)
	handler := NewStorageHandler(mockService)
	router := setupStorageTestRouter(handler)
	
	// 创建表单数据，但不包含 task_id
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("file", "screenshot.png")
	part.Write([]byte("fake image data"))
	writer.Close()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/storage/screenshots/upload", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
}

// TestDeleteFile_InvalidBucket 测试删除文件时使用无效的 bucket
func TestDeleteFile_InvalidBucket(t *testing.T) {
	mockService := new(MockStorageService)
	handler := NewStorageHandler(mockService)
	router := setupStorageTestRouter(handler)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/api/v1/storage/invalid-bucket/test-file.txt", nil)
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
}

