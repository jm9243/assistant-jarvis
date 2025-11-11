package handler

import (
	"net/http"

	"github.com/assistant-jarvis/backend/internal/model"
	"github.com/assistant-jarvis/backend/internal/repository"
	"github.com/gin-gonic/gin"
)

// LLMModelHandler LLM 模型管理处理器
type LLMModelHandler struct {
	llmModelRepo *repository.LLMModelRepository
}

// NewLLMModelHandler 创建 LLM 模型管理处理器
func NewLLMModelHandler(llmModelRepo *repository.LLMModelRepository) *LLMModelHandler {
	return &LLMModelHandler{
		llmModelRepo: llmModelRepo,
	}
}

// Create 创建模型配置
func (h *LLMModelHandler) Create(c *gin.Context) {
	var req model.CreateLLMModelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    40001,
			"message": "请求参数错误: " + err.Error(),
			"data":    nil,
		})
		return
	}

	userID := c.GetString("user_id")

	llmModel := &model.LLMModel{
		Name:                  req.Name,
		ModelID:               req.ModelID,
		Provider:              req.Provider,
		Type:                  req.Type,
		Description:           req.Description,
		Status:                "enabled",
		BaseURL:               req.BaseURL,
		AuthType:              req.AuthType,
		KeyUsageMode:          req.KeyUsageMode,
		APIKeys:               req.APIKeys,
		SupportsVision:        req.SupportsVision,
		MaxTokens:             req.MaxTokens,
		ContextWindow:         req.ContextWindow,
		PricePerMillionInput:  req.PricePerMillionInput,
		PricePerMillionOutput: req.PricePerMillionOutput,
		RateLimitRPM:          req.RateLimitRPM,
		RateLimitTPM:          req.RateLimitTPM,
		PlatformID:            req.PlatformID,
		CreatedBy:             &userID,
	}

	if err := h.llmModelRepo.Create(c.Request.Context(), llmModel); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    50001,
			"message": "创建模型失败: " + err.Error(),
			"data":    nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "创建成功",
		"data":    llmModel,
	})
}

// Get 获取模型配置
func (h *LLMModelHandler) Get(c *gin.Context) {
	id := c.Param("id")

	llmModel, err := h.llmModelRepo.FindByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    40004,
			"message": "模型不存在",
			"data":    nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data":    llmModel,
	})
}

// List 获取模型列表
func (h *LLMModelHandler) List(c *gin.Context) {
	filters := make(map[string]interface{})

	if provider := c.Query("provider"); provider != "" {
		filters["provider"] = provider
	}

	if modelType := c.Query("type"); modelType != "" {
		filters["type"] = modelType
	}

	if status := c.Query("status"); status != "" {
		filters["status"] = status
	}

	models, err := h.llmModelRepo.List(c.Request.Context(), filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    50001,
			"message": "获取列表失败: " + err.Error(),
			"data":    nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data":    models,
	})
}

// Update 更新模型配置
func (h *LLMModelHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req model.UpdateLLMModelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    40001,
			"message": "请求参数错误: " + err.Error(),
			"data":    nil,
		})
		return
	}

	if err := h.llmModelRepo.Update(c.Request.Context(), id, &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    50001,
			"message": "更新失败: " + err.Error(),
			"data":    nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "更新成功",
		"data":    nil,
	})
}

// Delete 删除模型配置
func (h *LLMModelHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	if err := h.llmModelRepo.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    50001,
			"message": "删除失败: " + err.Error(),
			"data":    nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "删除成功",
		"data":    nil,
	})
}
