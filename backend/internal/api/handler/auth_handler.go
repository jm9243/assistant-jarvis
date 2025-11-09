package handler

import (
	"github.com/assistant-jarvis/backend/internal/model"
	"github.com/assistant-jarvis/backend/internal/pkg/logger"
	"github.com/assistant-jarvis/backend/internal/pkg/utils"
	"github.com/assistant-jarvis/backend/internal/service"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// AuthHandler 认证处理器
type AuthHandler struct {
	authService *service.AuthService
}

// NewAuthHandler 创建认证处理器
func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

// Register 用户注册
// @Summary 用户注册
// @Tags auth
// @Accept json
// @Produce json
// @Param request body model.RegisterRequest true "注册请求"
// @Success 200 {object} utils.Response{data=model.User}
// @Router /api/v1/auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var req model.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Logger.Warn("Invalid register request", zap.Error(err))
		utils.Error(c, 40001, "请求参数错误: "+err.Error())
		return
	}

	user, err := h.authService.Register(c.Request.Context(), &req)
	if err != nil {
		logger.Logger.Error("Register failed", zap.Error(err))
		utils.Error(c, 50001, "注册失败: "+err.Error())
		return
	}

	logger.Logger.Info("User registered successfully", zap.String("user_id", user.ID))
	utils.Success(c, user)
}

// Login 用户登录
// @Summary 用户登录
// @Tags auth
// @Accept json
// @Produce json
// @Param request body model.LoginRequest true "登录请求"
// @Success 200 {object} utils.Response{data=model.LoginResponse}
// @Router /api/v1/auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req model.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Logger.Warn("Invalid login request", zap.Error(err))
		utils.Error(c, 40001, "请求参数错误: "+err.Error())
		return
	}

	loginResp, err := h.authService.Login(c.Request.Context(), &req)
	if err != nil {
		logger.Logger.Error("Login failed",
			zap.Error(err),
			zap.String("email", req.Email),
		)
		utils.Error(c, 40101, "登录失败: 邮箱或密码错误")
		return
	}

	logger.Logger.Info("User logged in successfully",
		zap.String("user_id", loginResp.User.ID),
	)
	utils.Success(c, loginResp)
}

// RefreshToken 刷新 Token
// @Summary 刷新 Token
// @Tags auth
// @Accept json
// @Produce json
// @Param request body model.RefreshTokenRequest true "刷新 Token 请求"
// @Success 200 {object} utils.Response{data=model.LoginResponse}
// @Router /api/v1/auth/refresh [post]
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req model.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Logger.Warn("Invalid refresh token request", zap.Error(err))
		utils.Error(c, 40001, "请求参数错误: "+err.Error())
		return
	}

	loginResp, err := h.authService.RefreshToken(c.Request.Context(), req.RefreshToken)
	if err != nil {
		logger.Logger.Error("Refresh token failed", zap.Error(err))
		utils.Error(c, 40102, "刷新 Token 失败: "+err.Error())
		return
	}

	logger.Logger.Info("Token refreshed successfully")
	utils.Success(c, loginResp)
}

