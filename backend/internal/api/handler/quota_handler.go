package handler

import (
	"net/http"

	"github.com/assistant-jarvis/backend/internal/service"
	"github.com/gin-gonic/gin"
)

// QuotaHandler 配额处理器
type QuotaHandler struct {
	quotaSvc *service.QuotaService
	usageSvc *service.UsageService
}

// NewQuotaHandler 创建配额处理器
func NewQuotaHandler(quotaSvc *service.QuotaService, usageSvc *service.UsageService) *QuotaHandler {
	return &QuotaHandler{
		quotaSvc: quotaSvc,
		usageSvc: usageSvc,
	}
}

// GetQuota 获取用户配额信息
func (h *QuotaHandler) GetQuota(c *gin.Context) {
	userID := c.GetString("user_id")

	quotaInfo, err := h.quotaSvc.CheckQuota(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    50001,
			"message": "获取配额失败: " + err.Error(),
			"data":    nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data":    quotaInfo,
	})
}

// GetQuotaLevels 获取所有配额等级
func (h *QuotaHandler) GetQuotaLevels(c *gin.Context) {
	levels := h.quotaSvc.GetQuotaLevels()

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data":    levels,
	})
}

// GetMonthlyUsage 获取本月用量统计
func (h *QuotaHandler) GetMonthlyUsage(c *gin.Context) {
	userID := c.GetString("user_id")

	stats, err := h.usageSvc.GetUserMonthlyUsage(c.Request.Context(), userID)
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
		"data":    stats,
	})
}

// GetDailyUsage 获取今日用量统计
func (h *QuotaHandler) GetDailyUsage(c *gin.Context) {
	userID := c.GetString("user_id")

	stats, err := h.usageSvc.GetUserDailyUsage(c.Request.Context(), userID)
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
		"data":    stats,
	})
}
