package handler

import (
	"github.com/assistant-jarvis/backend/internal/model"
	"github.com/assistant-jarvis/backend/internal/pkg/logger"
	"github.com/assistant-jarvis/backend/internal/pkg/utils"
	"github.com/assistant-jarvis/backend/internal/service"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// TaskHandler 任务处理器
type TaskHandler struct {
	taskService *service.TaskService
}

// NewTaskHandler 创建任务处理器
func NewTaskHandler(taskService *service.TaskService) *TaskHandler {
	return &TaskHandler{
		taskService: taskService,
	}
}

// Create 创建任务
// @Summary 创建任务
// @Tags task
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body model.CreateTaskRequest true "创建任务请求"
// @Success 200 {object} utils.Response{data=model.Task}
// @Router /api/v1/tasks [post]
func (h *TaskHandler) Create(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		utils.ErrorWithStatus(c, 401, 40101, "未授权")
		return
	}

	var req model.CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Logger.Warn("Invalid create task request", zap.Error(err))
		utils.Error(c, 40001, "请求参数错误: "+err.Error())
		return
	}

	task, err := h.taskService.CreateTask(c.Request.Context(), userID, &req)
	if err != nil {
		logger.Logger.Error("Failed to create task",
			zap.Error(err),
			zap.String("user_id", userID),
		)
		utils.Error(c, 50001, "创建任务失败: "+err.Error())
		return
	}

	logger.Logger.Info("Task created successfully",
		zap.String("task_id", task.ID),
		zap.String("workflow_id", task.WorkflowID),
		zap.String("user_id", userID),
	)
	utils.Success(c, task)
}

// List 获取任务列表
// @Summary 获取任务列表
// @Tags task
// @Produce json
// @Security Bearer
// @Param params query model.TaskQueryParams false "查询参数"
// @Success 200 {object} utils.Response{data=model.TaskListResponse}
// @Router /api/v1/tasks [get]
func (h *TaskHandler) List(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		utils.ErrorWithStatus(c, 401, 40101, "未授权")
		return
	}

	var params model.TaskQueryParams
	if err := c.ShouldBindQuery(&params); err != nil {
		logger.Logger.Warn("Invalid task query params", zap.Error(err))
		utils.Error(c, 40001, "请求参数错误: "+err.Error())
		return
	}

	// 设置默认值
	if params.Page == 0 {
		params.Page = 1
	}
	if params.PageSize == 0 {
		params.PageSize = 20
	}

	result, err := h.taskService.ListTasks(c.Request.Context(), userID, &params)
	if err != nil {
		logger.Logger.Error("Failed to list tasks",
			zap.Error(err),
			zap.String("user_id", userID),
		)
		utils.Error(c, 50001, "获取任务列表失败")
		return
	}

	utils.Success(c, result)
}

// GetByID 获取任务详情
// @Summary 获取任务详情
// @Tags task
// @Produce json
// @Security Bearer
// @Param id path string true "任务ID"
// @Success 200 {object} utils.Response{data=model.Task}
// @Router /api/v1/tasks/{id} [get]
func (h *TaskHandler) GetByID(c *gin.Context) {
	taskID := c.Param("id")
	if taskID == "" {
		utils.Error(c, 40001, "任务ID不能为空")
		return
	}

	task, err := h.taskService.GetTaskByID(c.Request.Context(), taskID)
	if err != nil {
		logger.Logger.Error("Failed to get task",
			zap.Error(err),
			zap.String("task_id", taskID),
		)
		utils.Error(c, 50001, "获取任务详情失败")
		return
	}

	utils.Success(c, task)
}

// UpdateStatus 更新任务状态
// @Summary 更新任务状态
// @Tags task
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path string true "任务ID"
// @Param request body model.UpdateTaskStatusRequest true "更新任务状态请求"
// @Success 200 {object} utils.Response
// @Router /api/v1/tasks/{id}/status [patch]
func (h *TaskHandler) UpdateStatus(c *gin.Context) {
	taskID := c.Param("id")
	if taskID == "" {
		utils.Error(c, 40001, "任务ID不能为空")
		return
	}

	var req model.UpdateTaskStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Logger.Warn("Invalid update task status request", zap.Error(err))
		utils.Error(c, 40001, "请求参数错误: "+err.Error())
		return
	}

	if err := h.taskService.UpdateTaskStatus(c.Request.Context(), taskID, &req); err != nil {
		logger.Logger.Error("Failed to update task status",
			zap.Error(err),
			zap.String("task_id", taskID),
		)
		utils.Error(c, 50001, "更新任务状态失败")
		return
	}

	logger.Logger.Info("Task status updated successfully",
		zap.String("task_id", taskID),
		zap.String("status", string(req.Status)),
	)
	utils.Success(c, gin.H{"message": "状态更新成功"})
}

// UpdateResult 更新任务结果
// @Summary 更新任务结果
// @Tags task
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path string true "任务ID"
// @Param request body model.UpdateTaskResultRequest true "更新任务结果请求"
// @Success 200 {object} utils.Response
// @Router /api/v1/tasks/{id}/result [patch]
func (h *TaskHandler) UpdateResult(c *gin.Context) {
	taskID := c.Param("id")
	if taskID == "" {
		utils.Error(c, 40001, "任务ID不能为空")
		return
	}

	var req model.UpdateTaskResultRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Logger.Warn("Invalid update task result request", zap.Error(err))
		utils.Error(c, 40001, "请求参数错误: "+err.Error())
		return
	}

	if err := h.taskService.UpdateTaskResult(c.Request.Context(), taskID, &req); err != nil {
		logger.Logger.Error("Failed to update task result",
			zap.Error(err),
			zap.String("task_id", taskID),
		)
		utils.Error(c, 50001, "更新任务结果失败")
		return
	}

	logger.Logger.Info("Task result updated successfully",
		zap.String("task_id", taskID),
		zap.String("status", req.Status),
	)
	utils.Success(c, gin.H{"message": "任务结果更新成功"})
}

// GetStatistics 获取任务统计
// @Summary 获取任务统计
// @Tags task
// @Produce json
// @Security Bearer
// @Param workflow_id query string false "工作流ID"
// @Success 200 {object} utils.Response
// @Router /api/v1/tasks/statistics [get]
func (h *TaskHandler) GetStatistics(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		utils.ErrorWithStatus(c, 401, 40101, "未授权")
		return
	}

	workflowID := c.Query("workflow_id")

	stats, err := h.taskService.GetTaskStatistics(c.Request.Context(), userID, workflowID)
	if err != nil {
		logger.Logger.Error("Failed to get task statistics",
			zap.Error(err),
			zap.String("user_id", userID),
		)
		utils.Error(c, 50001, "获取任务统计失败")
		return
	}

	utils.Success(c, stats)
}

