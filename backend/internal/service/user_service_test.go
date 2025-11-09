package service

import (
	"context"
	"testing"
	"time"

	"github.com/assistant-jarvis/backend/internal/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockUserRepository 模拟 UserRepository
type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) FindByID(ctx context.Context, userID string) (*model.User, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.User), args.Error(1)
}

func (m *MockUserRepository) Update(ctx context.Context, userID string, req *model.UpdateUserRequest) error {
	args := m.Called(ctx, userID, req)
	return args.Error(0)
}

func (m *MockUserRepository) CreateProfile(ctx context.Context, user *model.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

// MockRedisCache 模拟 RedisCache
type MockRedisCache struct {
	mock.Mock
}

func (m *MockRedisCache) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	args := m.Called(ctx, key, value, expiration)
	return args.Error(0)
}

func (m *MockRedisCache) Get(ctx context.Context, key string) (interface{}, error) {
	args := m.Called(ctx, key)
	return args.Get(0), args.Error(1)
}

func (m *MockRedisCache) Delete(ctx context.Context, keys ...string) error {
	args := m.Called(ctx, keys)
	return args.Error(0)
}

func (m *MockRedisCache) DeleteByPattern(ctx context.Context, pattern string) error {
	args := m.Called(ctx, pattern)
	return args.Error(0)
}

func (m *MockRedisCache) Close() error {
	args := m.Called()
	return args.Error(0)
}

// TestGetUserByID 测试获取用户信息
func TestGetUserByID(t *testing.T) {
	// 准备测试数据
	mockRepo := new(MockUserRepository)
	mockCache := new(MockRedisCache)
	service := NewUserService(mockRepo, mockCache)

	userID := "test-user-id"
	expectedUser := &model.User{
		ID:              userID,
		Username:        "testuser",
		MembershipLevel: "free",
		StorageQuotaMB:  1000,
		TokenQuota:      100000,
	}

	ctx := context.Background()

	// 设置 mock 期望
	mockRepo.On("FindByID", ctx, userID).Return(expectedUser, nil)
	mockCache.On("Set", ctx, "user:"+userID, expectedUser, 30*time.Minute).Return(nil)

	// 执行测试
	user, err := service.GetUserByID(ctx, userID)

	// 断言
	assert.NoError(t, err)
	assert.NotNil(t, user)
	assert.Equal(t, userID, user.ID)
	assert.Equal(t, "testuser", user.Username)

	// 验证 mock 调用
	mockRepo.AssertExpectations(t)
	mockCache.AssertExpectations(t)
}

// TestUpdateUser 测试更新用户信息
func TestUpdateUser(t *testing.T) {
	mockRepo := new(MockUserRepository)
	mockCache := new(MockRedisCache)
	service := NewUserService(mockRepo, mockCache)

	userID := "test-user-id"
	updateReq := &model.UpdateUserRequest{
		Username: "newusername",
	}

	ctx := context.Background()

	// 设置 mock 期望
	mockRepo.On("Update", ctx, userID, updateReq).Return(nil)
	mockCache.On("Delete", ctx, []string{"user:" + userID}).Return(nil)

	// 执行测试
	err := service.UpdateUser(ctx, userID, updateReq)

	// 断言
	assert.NoError(t, err)

	// 验证 mock 调用
	mockRepo.AssertExpectations(t)
	mockCache.AssertExpectations(t)
}

// BenchmarkGetUserByID 性能测试
func BenchmarkGetUserByID(b *testing.B) {
	mockRepo := new(MockUserRepository)
	mockCache := new(MockRedisCache)
	service := NewUserService(mockRepo, mockCache)

	userID := "test-user-id"
	user := &model.User{
		ID:       userID,
		Username: "testuser",
	}

	ctx := context.Background()
	mockRepo.On("FindByID", ctx, userID).Return(user, nil)
	mockCache.On("Set", ctx, mock.Anything, mock.Anything, mock.Anything).Return(nil)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = service.GetUserByID(ctx, userID)
	}
}

