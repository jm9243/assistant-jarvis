package service

import (
	"context"
	"fmt"
	"path/filepath"
	"time"

	"github.com/assistant-jarvis/backend/internal/pkg/supabase"
)

// StorageService 文件存储服务
type StorageService struct {
	supabaseClient *supabase.Client
}

// NewStorageService 创建文件存储服务
func NewStorageService(client *supabase.Client) *StorageService {
	return &StorageService{
		supabaseClient: client,
	}
}

// UploadWorkflowFile 上传工作流文件
func (s *StorageService) UploadWorkflowFile(ctx context.Context, userID, workflowID string, filename string, data []byte) (string, error) {
	// 文件路径: {user_id}/{workflow_id}/{filename}
	filePath := filepath.Join(userID, workflowID, filename)

	// 上传到 workflows 存储桶
	fileURL, err := s.supabaseClient.Storage().UploadFile("workflows", filePath, data)
	if err != nil {
		return "", fmt.Errorf("failed to upload workflow file: %w", err)
	}

	return fileURL, nil
}

// DownloadWorkflowFile 下载工作流文件
func (s *StorageService) DownloadWorkflowFile(ctx context.Context, filePath string) ([]byte, error) {
	// 框架已就绪：等待 Supabase Go SDK 提供 Storage 下载 API
	// 参考文档: https://supabase.com/docs/reference/javascript/storage-from-download
	//
	// 实现步骤：
	// 1. 调用 s.supabaseClient.Storage().From("workflows").Download(filePath)
	// 2. 返回文件字节数据
	//
	// 示例代码：
	// data, err := s.supabaseClient.Storage().From("workflows").Download(filePath)
	// if err != nil {
	//     return nil, fmt.Errorf("failed to download file: %w", err)
	// }
	// return data, nil
	
	return nil, fmt.Errorf("file download awaiting Supabase SDK support, framework ready")
}

// DeleteWorkflowFile 删除工作流文件
func (s *StorageService) DeleteWorkflowFile(ctx context.Context, filePath string) error {
	err := s.supabaseClient.Storage().DeleteFile("workflows", filePath)
	if err != nil {
		return fmt.Errorf("failed to delete workflow file: %w", err)
	}

	return nil
}

// UploadScreenshot 上传截图
func (s *StorageService) UploadScreenshot(ctx context.Context, userID, taskID, nodeID string, data []byte) (string, error) {
	// 文件路径: {user_id}/{task_id}/{node_id}_{timestamp}.png
	timestamp := time.Now().Unix()
	filename := fmt.Sprintf("%s_%d.png", nodeID, timestamp)
	filePath := filepath.Join(userID, taskID, filename)

	// 上传到 screenshots 存储桶
	fileURL, err := s.supabaseClient.Storage().UploadFile("screenshots", filePath, data)
	if err != nil {
		return "", fmt.Errorf("failed to upload screenshot: %w", err)
	}

	return fileURL, nil
}

// UploadAvatar 上传用户头像
func (s *StorageService) UploadAvatar(ctx context.Context, userID string, data []byte) (string, error) {
	// 文件路径: {user_id}/avatar.png
	filePath := filepath.Join(userID, "avatar.png")

	// 上传到 avatars 存储桶（公开）
	_, err := s.supabaseClient.Storage().UploadFile("avatars", filePath, data)
	if err != nil {
		return "", fmt.Errorf("failed to upload avatar: %w", err)
	}

	// 返回公开访问 URL
	publicURL := s.supabaseClient.Storage().GetPublicURL("avatars", filePath)
	return publicURL, nil
}

// GetFileURL 获取文件 URL
func (s *StorageService) GetFileURL(bucket, filePath string) string {
	return s.supabaseClient.Storage().GetPublicURL(bucket, filePath)
}

// DeleteFile 删除文件
func (s *StorageService) DeleteFile(ctx context.Context, bucket, filePath string) error {
	err := s.supabaseClient.Storage().DeleteFile(bucket, filePath)
	if err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	return nil
}

