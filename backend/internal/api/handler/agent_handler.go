package handler

import (
	"net/http"

	"github.com/assistant-jarvis/backend/internal/model"
	"github.com/assistant-jarvis/backend/internal/service"
	"github.com/gin-gonic/gin"
)

// AgentHandler Agent 处理器
type AgentHandler struct {
	agentService *service.AgentService
}

// NewAgentHandler 创建 Agent 处理器
func NewAgentHandler(agentService *service.AgentService) *AgentHandler {
	return &AgentHandler{
		agentService: agentService,
	}
}

// Create 创建 Agent
func (h *AgentHandler) Create(c *gin.Context) {
	var req model.CreateAgentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    40001,
			"message": "请求参数错误: " + err.Error(),
			"data":    nil,
		})
		return
	}

	userID := c.GetString("user_id")
	agent, err := h.agentService.CreateAgent(c.Request.Context(), userID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    50001,
			"message": "创建 Agent 失败: " + err.Error(),
			"data":    nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "创建成功",
		"data":    agent,
	})
}

// Get 获取 Agent
func (h *AgentHandler) Get(c *gin.Context) {
	agentID := c.Param("id")

	agent, err := h.agentService.GetAgent(c.Request.Context(), agentID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    40004,
			"message": "Agent 不存在",
			"data":    nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data":    agent,
	})
}

// List 获取 Agent 列表
func (h *AgentHandler) List(c *gin.Context) {
	userID := c.GetString("user_id")

	agents, err := h.agentService.ListAgents(c.Request.Context(), userID)
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
		"data":    agents,
	})
}

// Update 更新 Agent
func (h *AgentHandler) Update(c *gin.Context) {
	agentID := c.Param("id")

	var req model.UpdateAgentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    40001,
			"message": "请求参数错误: " + err.Error(),
			"data":    nil,
		})
		return
	}

	if err := h.agentService.UpdateAgent(c.Request.Context(), agentID, &req); err != nil {
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

// Delete 删除 Agent
func (h *AgentHandler) Delete(c *gin.Context) {
	agentID := c.Param("id")

	if err := h.agentService.DeleteAgent(c.Request.Context(), agentID); err != nil {
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

// CreateConversation 创建对话
func (h *AgentHandler) CreateConversation(c *gin.Context) {
	var req model.CreateConversationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    40001,
			"message": "请求参数错误: " + err.Error(),
			"data":    nil,
		})
		return
	}

	userID := c.GetString("user_id")
	conv, err := h.agentService.CreateConversation(c.Request.Context(), userID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    50001,
			"message": "创建对话失败: " + err.Error(),
			"data":    nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "创建成功",
		"data":    conv,
	})
}

// GetConversation 获取对话
func (h *AgentHandler) GetConversation(c *gin.Context) {
	convID := c.Param("id")

	conv, err := h.agentService.GetConversation(c.Request.Context(), convID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    40004,
			"message": "对话不存在",
			"data":    nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data":    conv,
	})
}

// ListConversations 获取对话列表
func (h *AgentHandler) ListConversations(c *gin.Context) {
	userID := c.GetString("user_id")

	convs, err := h.agentService.ListConversations(c.Request.Context(), userID)
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
		"data":    convs,
	})
}

// SendMessage 发送消息
func (h *AgentHandler) SendMessage(c *gin.Context) {
	convID := c.Param("id")

	var req model.SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    40001,
			"message": "请求参数错误: " + err.Error(),
			"data":    nil,
		})
		return
	}

	msg, err := h.agentService.SendMessage(c.Request.Context(), convID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    50001,
			"message": "发送消息失败: " + err.Error(),
			"data":    nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data":    msg,
	})
}

// GetMessages 获取消息列表
func (h *AgentHandler) GetMessages(c *gin.Context) {
	convID := c.Param("id")

	msgs, err := h.agentService.GetMessages(c.Request.Context(), convID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    50001,
			"message": "获取消息失败: " + err.Error(),
			"data":    nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data":    msgs,
	})
}
