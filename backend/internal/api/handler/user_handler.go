package handler

import (
	"github.com/assistant-jarvis/backend/internal/model"
	"github.com/assistant-jarvis/backend/internal/pkg/logger"
	"github.com/assistant-jarvis/backend/internal/pkg/utils"
	"github.com/assistant-jarvis/backend/internal/service"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// UserHandler 用户处理器
type UserHandler struct {
	userService *service.UserService
}

// NewUserHandler 创建用户处理器
func NewUserHandler(userService *service.UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

// GetProfile 获取用户信息
// @Summary 获取当前用户信息
// @Tags user
// @Produce json
// @Security Bearer
// @Success 200 {object} utils.Response{data=model.User}
// @Router /api/v1/users/profile [get]
func (h *UserHandler) GetProfile(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		utils.ErrorWithStatus(c, 401, 40101, "未授权")
		return
	}

	user, err := h.userService.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		logger.Logger.Error("Failed to get user profile",
			zap.Error(err),
			zap.String("user_id", userID),
		)
		utils.Error(c, 50001, "获取用户信息失败")
		return
	}

	utils.Success(c, user)
}

// UpdateProfile 更新用户信息
// @Summary 更新当前用户信息
// @Tags user
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body model.UpdateUserRequest true "更新用户请求"
// @Success 200 {object} utils.Response
// @Router /api/v1/users/profile [put]
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		utils.ErrorWithStatus(c, 401, 40101, "未授权")
		return
	}

	var req model.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Logger.Warn("Invalid update profile request", zap.Error(err))
		utils.Error(c, 40001, "请求参数错误: "+err.Error())
		return
	}

	if err := h.userService.UpdateUser(c.Request.Context(), userID, &req); err != nil {
		logger.Logger.Error("Failed to update user profile",
			zap.Error(err),
			zap.String("user_id", userID),
		)
		utils.Error(c, 50001, "更新用户信息失败")
		return
	}

	logger.Logger.Info("User profile updated successfully",
		zap.String("user_id", userID),
	)
	utils.Success(c, gin.H{"message": "更新成功"})
}

// GetDevices 获取设备列表
// @Summary 获取用户设备列表
// @Tags user
// @Produce json
// @Security Bearer
// @Success 200 {object} utils.Response{data=[]model.Device}
// @Router /api/v1/users/devices [get]
func (h *UserHandler) GetDevices(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		utils.ErrorWithStatus(c, 401, 40101, "未授权")
		return
	}

	devices, err := h.userService.GetUserDevices(c.Request.Context(), userID)
	if err != nil {
		logger.Logger.Error("Failed to get devices",
			zap.Error(err),
			zap.String("user_id", userID),
		)
		utils.Error(c, 50001, "获取设备列表失败: "+err.Error())
		return
	}

	logger.Logger.Info("Get devices success",
		zap.String("user_id", userID),
		zap.Int("count", len(devices)),
	)
	utils.Success(c, devices)
}

// RegisterDevice 注册设备
// @Summary 注册设备
// @Tags user
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body model.RegisterDeviceRequest true "注册设备请求"
// @Success 200 {object} utils.Response{data=model.Device}
// @Router /api/v1/users/devices [post]
func (h *UserHandler) RegisterDevice(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		utils.ErrorWithStatus(c, 401, 40101, "未授权")
		return
	}

	var req model.RegisterDeviceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Logger.Warn("Invalid register device request", zap.Error(err))
		utils.Error(c, 40001, "请求参数错误: "+err.Error())
		return
	}

	device, err := h.userService.RegisterDevice(c.Request.Context(), userID, &req)
	if err != nil {
		logger.Logger.Error("Failed to register device",
			zap.Error(err),
			zap.String("user_id", userID),
			zap.String("device_id", req.DeviceID),
		)
		utils.Error(c, 50001, "注册设备失败: "+err.Error())
		return
	}

	logger.Logger.Info("Device registered successfully",
		zap.String("user_id", userID),
		zap.String("device_id", device.DeviceID),
	)
	utils.Success(c, device)
}

