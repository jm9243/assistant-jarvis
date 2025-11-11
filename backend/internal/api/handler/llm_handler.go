package handler

import (
	"net/http"

	"github.com/assistant-jarvis/backend/internal/service"
	"github.com/gin-gonic/gin"
)

// LLMHandler LLM 处理器
type LLMHandler struct {
	llmProxyService *service.LLMProxyService
}

// NewLLMHandler 创建 LLM 处理器
func NewLLMHandler(llmProxyService *service.LLMProxyService) *LLMHandler {
	return &LLMHandler{
		llmProxyService: llmProxyService,
	}
}

// Chat LLM 聊天（代理）
func (h *LLMHandler) Chat(c *gin.Context) {
	userID := c.GetString("user_id")

	var req service.ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    40001,
			"message": "请求参数错误: " + err.Error(),
			"data":    nil,
		})
		return
	}

	resp, err := h.llmProxyService.ProxyChat(c.Request.Context(), userID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    50001,
			"message": "LLM 请求失败: " + err.Error(),
			"data":    nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data":    resp,
	})
}

// GetAvailableModels 获取可用模型列表
func (h *LLMHandler) GetAvailableModels(c *gin.Context) {
	userID := c.GetString("user_id")

	models, err := h.llmProxyService.GetAvailableModels(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    50001,
			"message": "获取模型列表失败: " + err.Error(),
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

// GetUsage 获取用量统计（已废弃，使用 QuotaHandler）
func (h *LLMHandler) GetUsage(c *gin.Context) {
	userID := c.GetString("user_id")

	usage, err := h.llmProxyService.GetUserUsage(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    50001,
			"message": "获取用量失败: " + err.Error(),
			"data":    nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data":    usage,
	})
}
