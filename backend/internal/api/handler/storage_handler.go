package handler

import (
	"io"

	"github.com/assistant-jarvis/backend/internal/pkg/logger"
	"github.com/assistant-jarvis/backend/internal/pkg/utils"
	"github.com/assistant-jarvis/backend/internal/service"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// StorageHandler 文件存储处理器
type StorageHandler struct {
	storageService *service.StorageService
}

// NewStorageHandler 创建文件存储处理器
func NewStorageHandler(storageService *service.StorageService) *StorageHandler {
	return &StorageHandler{
		storageService: storageService,
	}
}

// UploadWorkflowFile 上传工作流文件
// @Summary 上传工作流文件
// @Tags storage
// @Accept multipart/form-data
// @Produce json
// @Security Bearer
// @Param workflow_id formData string true "工作流ID"
// @Param file formData file true "文件"
// @Success 200 {object} utils.Response
// @Router /api/v1/storage/workflows/upload [post]
func (h *StorageHandler) UploadWorkflowFile(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		utils.ErrorWithStatus(c, 401, 40101, "未授权")
		return
	}

	workflowID := c.PostForm("workflow_id")
	if workflowID == "" {
		utils.Error(c, 40001, "工作流ID不能为空")
		return
	}

	// 获取上传的文件
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		logger.Logger.Warn("Failed to get uploaded file", zap.Error(err))
		utils.Error(c, 40001, "获取文件失败: "+err.Error())
		return
	}
	defer file.Close()

	// 读取文件内容
	data, err := io.ReadAll(file)
	if err != nil {
		logger.Logger.Error("Failed to read file", zap.Error(err))
		utils.Error(c, 50001, "读取文件失败")
		return
	}

	// 上传文件
	fileURL, err := h.storageService.UploadWorkflowFile(c.Request.Context(), userID, workflowID, header.Filename, data)
	if err != nil {
		logger.Logger.Error("Failed to upload workflow file",
			zap.Error(err),
			zap.String("user_id", userID),
			zap.String("workflow_id", workflowID),
		)
		utils.Error(c, 50001, "上传文件失败: "+err.Error())
		return
	}

	logger.Logger.Info("Workflow file uploaded successfully",
		zap.String("user_id", userID),
		zap.String("workflow_id", workflowID),
		zap.String("filename", header.Filename),
	)
	utils.Success(c, gin.H{
		"file_url":  fileURL,
		"file_path": fileURL,
	})
}

// UploadScreenshot 上传截图
// @Summary 上传截图
// @Tags storage
// @Accept multipart/form-data
// @Produce json
// @Security Bearer
// @Param task_id formData string true "任务ID"
// @Param node_id formData string true "节点ID"
// @Param file formData file true "截图文件"
// @Success 200 {object} utils.Response
// @Router /api/v1/storage/screenshots/upload [post]
func (h *StorageHandler) UploadScreenshot(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		utils.ErrorWithStatus(c, 401, 40101, "未授权")
		return
	}

	taskID := c.PostForm("task_id")
	nodeID := c.PostForm("node_id")
	if taskID == "" || nodeID == "" {
		utils.Error(c, 40001, "任务ID和节点ID不能为空")
		return
	}

	// 获取上传的文件
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		logger.Logger.Warn("Failed to get uploaded screenshot", zap.Error(err))
		utils.Error(c, 40001, "获取截图失败: "+err.Error())
		return
	}
	defer file.Close()

	// 读取文件内容
	data, err := io.ReadAll(file)
	if err != nil {
		logger.Logger.Error("Failed to read screenshot", zap.Error(err))
		utils.Error(c, 50001, "读取截图失败")
		return
	}

	// 上传截图
	fileURL, err := h.storageService.UploadScreenshot(c.Request.Context(), userID, taskID, nodeID, data)
	if err != nil {
		logger.Logger.Error("Failed to upload screenshot",
			zap.Error(err),
			zap.String("user_id", userID),
			zap.String("task_id", taskID),
		)
		utils.Error(c, 50001, "上传截图失败: "+err.Error())
		return
	}

	logger.Logger.Info("Screenshot uploaded successfully",
		zap.String("user_id", userID),
		zap.String("task_id", taskID),
		zap.String("node_id", nodeID),
	)
	utils.Success(c, gin.H{
		"file_url":  fileURL,
		"file_path": fileURL,
	})
}

// UploadAvatar 上传头像
// @Summary 上传用户头像
// @Tags storage
// @Accept multipart/form-data
// @Produce json
// @Security Bearer
// @Param file formData file true "头像文件"
// @Success 200 {object} utils.Response
// @Router /api/v1/storage/avatar/upload [post]
func (h *StorageHandler) UploadAvatar(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		utils.ErrorWithStatus(c, 401, 40101, "未授权")
		return
	}

	// 获取上传的文件
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		logger.Logger.Warn("Failed to get uploaded avatar", zap.Error(err))
		utils.Error(c, 40001, "获取头像失败: "+err.Error())
		return
	}
	defer file.Close()

	// 读取文件内容
	data, err := io.ReadAll(file)
	if err != nil {
		logger.Logger.Error("Failed to read avatar", zap.Error(err))
		utils.Error(c, 50001, "读取头像失败")
		return
	}

	// 上传头像
	avatarURL, err := h.storageService.UploadAvatar(c.Request.Context(), userID, data)
	if err != nil {
		logger.Logger.Error("Failed to upload avatar",
			zap.Error(err),
			zap.String("user_id", userID),
		)
		utils.Error(c, 50001, "上传头像失败: "+err.Error())
		return
	}

	logger.Logger.Info("Avatar uploaded successfully",
		zap.String("user_id", userID),
	)
	utils.Success(c, gin.H{
		"avatar_url": avatarURL,
	})
}

// DeleteFile 删除文件
// @Summary 删除文件
// @Tags storage
// @Produce json
// @Security Bearer
// @Param bucket path string true "存储桶"
// @Param path path string true "文件路径"
// @Success 200 {object} utils.Response
// @Router /api/v1/storage/{bucket}/{path} [delete]
func (h *StorageHandler) DeleteFile(c *gin.Context) {
	bucket := c.Param("bucket")
	filePath := c.Param("path")

	if bucket == "" || filePath == "" {
		utils.Error(c, 40001, "存储桶和文件路径不能为空")
		return
	}

	if err := h.storageService.DeleteFile(c.Request.Context(), bucket, filePath); err != nil {
		logger.Logger.Error("Failed to delete file",
			zap.Error(err),
			zap.String("bucket", bucket),
			zap.String("path", filePath),
		)
		utils.Error(c, 50001, "删除文件失败: "+err.Error())
		return
	}

	logger.Logger.Info("File deleted successfully",
		zap.String("bucket", bucket),
		zap.String("path", filePath),
	)
	utils.Success(c, gin.H{"message": "文件删除成功"})
}

