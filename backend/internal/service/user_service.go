package service

import (
	"context"
	"fmt"
	"time"

	"github.com/assistant-jarvis/backend/internal/model"
	"github.com/assistant-jarvis/backend/internal/pkg/cache"
	"github.com/assistant-jarvis/backend/internal/repository"
)

// UserService 用户服务
type UserService struct {
	userRepo *repository.UserRepository
	cache    *cache.RedisCache
}

// NewUserService 创建用户服务
func NewUserService(userRepo *repository.UserRepository, cache *cache.RedisCache) *UserService {
	return &UserService{
		userRepo: userRepo,
		cache:    cache,
	}
}

// GetUserByID 根据 ID 获取用户信息
func (s *UserService) GetUserByID(ctx context.Context, userID string) (*model.User, error) {
	// 尝试从缓存获取
	cacheKey := fmt.Sprintf("user:%s", userID)
	// cached, err := s.cache.Get(ctx, cacheKey)
	// if err == nil && cached != nil {
	// 	return cached.(*model.User), nil
	// }

	// 从数据库查询
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// 写入缓存（30 分钟）
	_ = s.cache.Set(ctx, cacheKey, user, 30*time.Minute)

	return user, nil
}

// GetUserDevices 获取用户设备列表
func (s *UserService) GetUserDevices(ctx context.Context, userID string) ([]*model.Device, error) {
	// 框架已就绪：等待 devices 表创建后启用
	// devices, err := s.userRepo.FindDevicesByUserID(ctx, userID)
	// if err != nil {
	// 	return nil, err
	// }
	
	// 临时返回空列表
	return []*model.Device{}, nil
}

// RegisterDevice 注册设备
func (s *UserService) RegisterDevice(ctx context.Context, userID string, req *model.RegisterDeviceRequest) (*model.Device, error) {
	now := time.Now()
	device := &model.Device{
		UserID:       userID,
		DeviceID:     req.DeviceID,
		DeviceName:   req.DeviceName,
		OSType:       req.OSType,
		OSVersion:    req.OSVersion,
		AppVersion:   req.AppVersion,
		IsOnline:     true,
		LastOnlineAt: &now,
		CreatedAt:    now,
	}

	// 框架已就绪：等待 devices 表创建后启用
	// err := s.userRepo.CreateDevice(ctx, device)
	// if err != nil {
	// 	return nil, fmt.Errorf("failed to register device: %w", err)
	// }

	return device, nil
}

// UpdateDeviceStatus 更新设备在线状态
func (s *UserService) UpdateDeviceStatus(ctx context.Context, userID, deviceID string, isOnline bool) error {
	// 框架已就绪：等待 devices 表创建后启用
	// err := s.userRepo.UpdateDeviceStatus(ctx, userID, deviceID, isOnline)
	// if err != nil {
	// 	return fmt.Errorf("failed to update device status: %w", err)
	// }
	
	return nil
}

// UpdateUser 更新用户信息
func (s *UserService) UpdateUser(ctx context.Context, userID string, req *model.UpdateUserRequest) error {
	// 更新数据库
	if err := s.userRepo.Update(ctx, userID, req); err != nil {
		return err
	}

	// 删除缓存
	cacheKey := fmt.Sprintf("user:%s", userID)
	_ = s.cache.Delete(ctx, cacheKey)

	return nil
}

