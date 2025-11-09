package handler

import (
	"fmt"
	"time"

	"github.com/assistant-jarvis/backend/internal/model"
	"github.com/assistant-jarvis/backend/internal/pkg/logger"
	"github.com/assistant-jarvis/backend/internal/pkg/utils"
	"github.com/assistant-jarvis/backend/internal/service"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// LogHandler 日志处理器
type LogHandler struct {
	logService *service.LogService
}

// NewLogHandler 创建日志处理器
func NewLogHandler(logService *service.LogService) *LogHandler {
	return &LogHandler{
		logService: logService,
	}
}

// Create 创建日志
// @Summary 上报日志
// @Tags log
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body model.BatchCreateLogsRequest true "批量上报日志请求"
// @Success 200 {object} utils.Response
// @Router /api/v1/logs [post]
func (h *LogHandler) Create(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		utils.ErrorWithStatus(c, 401, 40101, "未授权")
		return
	}

	var req model.BatchCreateLogsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Logger.Warn("Invalid create logs request", zap.Error(err))
		utils.Error(c, 40001, "请求参数错误: "+err.Error())
		return
	}

	// 批量创建日志
	if err := h.logService.BatchCreateLogs(c.Request.Context(), userID, req.Logs); err != nil {
		logger.Logger.Error("Failed to create logs",
			zap.Error(err),
			zap.String("user_id", userID),
			zap.Int("count", len(req.Logs)),
		)
		utils.Error(c, 50001, "上报日志失败")
		return
	}

	logger.Logger.Info("Logs created successfully",
		zap.String("user_id", userID),
		zap.Int("count", len(req.Logs)),
	)
	utils.Success(c, gin.H{"message": "日志上报成功"})
}

// ReportError 上报错误日志
// @Summary 上报错误日志
// @Tags log
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body model.ReportErrorRequest true "上报错误请求"
// @Success 200 {object} utils.Response
// @Router /api/v1/logs/error [post]
func (h *LogHandler) ReportError(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		utils.ErrorWithStatus(c, 401, 40101, "未授权")
		return
	}

	var req model.ReportErrorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Logger.Warn("Invalid report error request", zap.Error(err))
		utils.Error(c, 40001, "请求参数错误: "+err.Error())
		return
	}

	if err := h.logService.ReportError(c.Request.Context(), userID, &req); err != nil {
		logger.Logger.Error("Failed to report error",
			zap.Error(err),
			zap.String("user_id", userID),
		)
		utils.Error(c, 50001, "上报错误失败")
		return
	}

	logger.Logger.Error("Error reported from client",
		zap.String("user_id", userID),
		zap.String("message", req.Message),
		zap.String("error_type", req.ErrorType),
	)
	
	// 生成错误 ID（使用时间戳 + 随机数）
	errorID := fmt.Sprintf("error_%d_%06d", time.Now().Unix(), time.Now().Nanosecond()%1000000)
	
	utils.Success(c, gin.H{
		"message":  "错误上报成功",
		"error_id": errorID,
	})
}

// List 获取日志列表
// @Summary 获取日志列表
// @Tags log
// @Produce json
// @Security Bearer
// @Param params query model.LogQueryParams false "查询参数"
// @Success 200 {object} utils.Response{data=model.LogListResponse}
// @Router /api/v1/logs [get]
func (h *LogHandler) List(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		utils.ErrorWithStatus(c, 401, 40101, "未授权")
		return
	}

	var params model.LogQueryParams
	if err := c.ShouldBindQuery(&params); err != nil {
		logger.Logger.Warn("Invalid log query params", zap.Error(err))
		utils.Error(c, 40001, "请求参数错误: "+err.Error())
		return
	}

	// 设置默认值
	if params.Page == 0 {
		params.Page = 1
	}
	if params.PageSize == 0 {
		params.PageSize = 50
	}

	result, err := h.logService.ListLogs(c.Request.Context(), userID, &params)
	if err != nil {
		logger.Logger.Error("Failed to list logs",
			zap.Error(err),
			zap.String("user_id", userID),
		)
		utils.Error(c, 50001, "获取日志列表失败")
		return
	}

	utils.Success(c, result)
}

// GetTaskLogs 获取任务日志
// @Summary 获取任务日志
// @Tags log
// @Produce json
// @Security Bearer
// @Param task_id query string true "任务ID"
// @Success 200 {object} utils.Response{data=[]model.Log}
// @Router /api/v1/logs/task [get]
func (h *LogHandler) GetTaskLogs(c *gin.Context) {
	taskID := c.Query("task_id")
	if taskID == "" {
		utils.Error(c, 40001, "任务ID不能为空")
		return
	}

	logs, err := h.logService.GetTaskLogs(c.Request.Context(), taskID)
	if err != nil {
		logger.Logger.Error("Failed to get task logs",
			zap.Error(err),
			zap.String("task_id", taskID),
		)
		utils.Error(c, 50001, "获取任务日志失败")
		return
	}

	utils.Success(c, logs)
}

