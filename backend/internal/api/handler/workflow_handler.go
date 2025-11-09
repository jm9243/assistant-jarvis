package handler

import (
	"github.com/assistant-jarvis/backend/internal/model"
	"github.com/assistant-jarvis/backend/internal/pkg/logger"
	"github.com/assistant-jarvis/backend/internal/pkg/utils"
	"github.com/assistant-jarvis/backend/internal/service"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// WorkflowHandler 工作流处理器
type WorkflowHandler struct {
	workflowService *service.WorkflowService
}

// NewWorkflowHandler 创建工作流处理器
func NewWorkflowHandler(workflowService *service.WorkflowService) *WorkflowHandler {
	return &WorkflowHandler{
		workflowService: workflowService,
	}
}

// Create 创建工作流
// @Summary 创建工作流
// @Tags workflow
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body model.CreateWorkflowRequest true "创建工作流请求"
// @Success 200 {object} utils.Response{data=model.Workflow}
// @Router /api/v1/workflows [post]
func (h *WorkflowHandler) Create(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		utils.ErrorWithStatus(c, 401, 40101, "未授权")
		return
	}

	var req model.CreateWorkflowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Logger.Warn("Invalid create workflow request", zap.Error(err))
		utils.Error(c, 40001, "请求参数错误: "+err.Error())
		return
	}

	workflow, err := h.workflowService.CreateWorkflow(c.Request.Context(), userID, &req)
	if err != nil {
		logger.Logger.Error("Failed to create workflow",
			zap.Error(err),
			zap.String("user_id", userID),
		)
		utils.Error(c, 50001, "创建工作流失败")
		return
	}

	logger.Logger.Info("Workflow created successfully",
		zap.String("workflow_id", workflow.ID),
		zap.String("user_id", userID),
	)
	utils.Success(c, workflow)
}

// List 获取工作流列表
// @Summary 获取工作流列表
// @Tags workflow
// @Produce json
// @Security Bearer
// @Param params query model.WorkflowQueryParams false "查询参数"
// @Success 200 {object} utils.Response{data=model.WorkflowListResponse}
// @Router /api/v1/workflows [get]
func (h *WorkflowHandler) List(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		utils.ErrorWithStatus(c, 401, 40101, "未授权")
		return
	}

	var params model.WorkflowQueryParams
	if err := c.ShouldBindQuery(&params); err != nil {
		logger.Logger.Warn("Invalid workflow query params", zap.Error(err))
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

	result, err := h.workflowService.ListWorkflows(c.Request.Context(), userID, &params)
	if err != nil {
		logger.Logger.Error("Failed to list workflows",
			zap.Error(err),
			zap.String("user_id", userID),
		)
		utils.Error(c, 50001, "获取工作流列表失败")
		return
	}

	utils.Success(c, result)
}

// GetByID 获取工作流详情
// @Summary 获取工作流详情
// @Tags workflow
// @Produce json
// @Security Bearer
// @Param id path string true "工作流ID"
// @Success 200 {object} utils.Response{data=model.Workflow}
// @Router /api/v1/workflows/{id} [get]
func (h *WorkflowHandler) GetByID(c *gin.Context) {
	workflowID := c.Param("id")
	if workflowID == "" {
		utils.Error(c, 40001, "工作流ID不能为空")
		return
	}

	workflow, err := h.workflowService.GetWorkflowByID(c.Request.Context(), workflowID)
	if err != nil {
		logger.Logger.Error("Failed to get workflow",
			zap.Error(err),
			zap.String("workflow_id", workflowID),
		)
		utils.Error(c, 50001, "获取工作流详情失败")
		return
	}

	utils.Success(c, workflow)
}

// Update 更新工作流
// @Summary 更新工作流
// @Tags workflow
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path string true "工作流ID"
// @Param request body model.UpdateWorkflowRequest true "更新工作流请求"
// @Success 200 {object} utils.Response
// @Router /api/v1/workflows/{id} [put]
func (h *WorkflowHandler) Update(c *gin.Context) {
	workflowID := c.Param("id")
	if workflowID == "" {
		utils.Error(c, 40001, "工作流ID不能为空")
		return
	}

	var req model.UpdateWorkflowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Logger.Warn("Invalid update workflow request", zap.Error(err))
		utils.Error(c, 40001, "请求参数错误: "+err.Error())
		return
	}

	if err := h.workflowService.UpdateWorkflow(c.Request.Context(), workflowID, &req); err != nil {
		logger.Logger.Error("Failed to update workflow",
			zap.Error(err),
			zap.String("workflow_id", workflowID),
		)
		utils.Error(c, 50001, "更新工作流失败")
		return
	}

	logger.Logger.Info("Workflow updated successfully",
		zap.String("workflow_id", workflowID),
	)
	utils.Success(c, gin.H{"message": "更新成功"})
}

// Delete 删除工作流
// @Summary 删除工作流
// @Tags workflow
// @Produce json
// @Security Bearer
// @Param id path string true "工作流ID"
// @Success 200 {object} utils.Response
// @Router /api/v1/workflows/{id} [delete]
func (h *WorkflowHandler) Delete(c *gin.Context) {
	workflowID := c.Param("id")
	if workflowID == "" {
		utils.Error(c, 40001, "工作流ID不能为空")
		return
	}

	if err := h.workflowService.DeleteWorkflow(c.Request.Context(), workflowID); err != nil {
		logger.Logger.Error("Failed to delete workflow",
			zap.Error(err),
			zap.String("workflow_id", workflowID),
		)
		utils.Error(c, 50001, "删除工作流失败")
		return
	}

	logger.Logger.Info("Workflow deleted successfully",
		zap.String("workflow_id", workflowID),
	)
	utils.Success(c, gin.H{"message": "删除成功"})
}

// Export 导出工作流
// @Summary 导出工作流
// @Tags workflow
// @Produce json
// @Security Bearer
// @Param id path string true "工作流ID"
// @Success 200 {object} utils.Response
// @Router /api/v1/workflows/{id}/export [get]
func (h *WorkflowHandler) Export(c *gin.Context) {
	workflowID := c.Param("id")
	if workflowID == "" {
		utils.Error(c, 40001, "工作流ID不能为空")
		return
	}

	data, err := h.workflowService.ExportWorkflow(c.Request.Context(), workflowID)
	if err != nil {
		logger.Logger.Error("Failed to export workflow",
			zap.Error(err),
			zap.String("workflow_id", workflowID),
		)
		utils.Error(c, 50001, "导出工作流失败")
		return
	}

	utils.Success(c, data)
}

// Import 导入工作流
// @Summary 导入工作流
// @Tags workflow
// @Accept json
// @Produce json
// @Security Bearer
// @Success 200 {object} utils.Response{data=model.Workflow}
// @Router /api/v1/workflows/import [post]
func (h *WorkflowHandler) Import(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		utils.ErrorWithStatus(c, 401, 40101, "未授权")
		return
	}

	var data map[string]interface{}
	if err := c.ShouldBindJSON(&data); err != nil {
		logger.Logger.Warn("Invalid import workflow request", zap.Error(err))
		utils.Error(c, 40001, "请求参数错误: "+err.Error())
		return
	}

	workflow, err := h.workflowService.ImportWorkflow(c.Request.Context(), userID, data)
	if err != nil {
		logger.Logger.Error("Failed to import workflow",
			zap.Error(err),
			zap.String("user_id", userID),
		)
		utils.Error(c, 50001, "导入工作流失败")
		return
	}

	logger.Logger.Info("Workflow imported successfully",
		zap.String("workflow_id", workflow.ID),
		zap.String("user_id", userID),
	)
	utils.Success(c, workflow)
}

