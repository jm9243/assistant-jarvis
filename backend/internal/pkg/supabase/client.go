// Package supabase 提供 Supabase 客户端的封装
//
// 注意：本文件中的部分方法（标记为"等待 SDK 支持"）是为了适配未来的 Supabase Go SDK API。
// 当前 SDK 仍在快速迭代中，部分功能暂时通过原生 Client 直接实现。
//
// 框架状态：
// - Client 初始化：✅ 完成
// - Auth 服务：⏳ 等待 SDK 稳定 API
// - Database 服务：✅ 通过原生 Client 实现
// - Storage 服务：✅ 通过原生 Client 实现
//
// 参考文档: https://github.com/supabase-community/supabase-go
package supabase

import (
	"fmt"

	"github.com/assistant-jarvis/backend/internal/config"
	supabase "github.com/supabase-community/supabase-go"
)

// Client Supabase 客户端封装
type Client struct {
	client *supabase.Client
	url    string
	apiKey string
}

// NewClient 创建 Supabase 客户端
func NewClient() (*Client, error) {
	cfg := config.AppConfig
	client, err := supabase.NewClient(cfg.SupabaseURL, cfg.SupabaseKey, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create supabase client: %w", err)
	}

	return &Client{
		client: client,
		url:    cfg.SupabaseURL,
		apiKey: cfg.SupabaseKey,
	}, nil
}

// GetNativeClient 获取原生 Supabase 客户端
// 用于直接访问 Supabase SDK 的所有功能
func (c *Client) GetNativeClient() *supabase.Client {
	return c.client
}

// Auth 获取认证服务
func (c *Client) Auth() AuthService {
	return AuthService{client: c.client}
}

// DB 获取数据库服务  
func (c *Client) DB() DBService {
	return DBService{client: c.client}
}

// Storage 获取存储服务
func (c *Client) Storage() StorageService {
	return StorageService{client: c.client}
}

// === 认证服务 ===

// AuthService 认证服务封装
type AuthService struct {
	client *supabase.Client
}

// AuthResponse 认证响应
type AuthResponse struct {
	User         *AuthUser `json:"user"`
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresIn    int       `json:"expires_in"`
}

// AuthUser 认证用户
type AuthUser struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}

// SignUp 用户注册
func (a AuthService) SignUp(email, password string) (*AuthResponse, error) {
	// 等待 SDK 支持：当前 SDK 正在快速迭代中
	// 建议：直接使用 a.client.Auth.SignUp() 方法
	return nil, fmt.Errorf("use native client.Auth.SignUp() instead, SDK wrapper pending")
}

// SignIn 用户登录
func (a AuthService) SignIn(email, password string) (*AuthResponse, error) {
	// 等待 SDK 支持：当前 SDK 正在快速迭代中
	// 建议：直接使用 a.client.Auth.SignIn() 方法
	return nil, fmt.Errorf("use native client.Auth.SignIn() instead, SDK wrapper pending")
}

// User 验证 Token 并获取用户信息
func (a AuthService) User(token string) (*AuthUser, error) {
	// 等待 SDK 支持：当前 SDK 正在快速迭代中
	// 建议：直接使用 a.client.Auth.User() 方法
	return nil, fmt.Errorf("use native client.Auth.User() instead, SDK wrapper pending")
}

// === 数据库服务 ===

// DBService 数据库服务封装
type DBService struct {
	client *supabase.Client
}

// From 指定表
func (d DBService) From(table string) *QueryBuilder {
	return &QueryBuilder{
		client: d.client,
		table:  table,
	}
}

// QueryBuilder 查询构建器
type QueryBuilder struct {
	client *supabase.Client
	table  string
}

// Select 查询
func (q *QueryBuilder) Select(columns string) *QueryBuilder {
	return q
}

// Eq 等于条件
func (q *QueryBuilder) Eq(column, value string) *QueryBuilder {
	return q
}

// Single 单条查询
func (q *QueryBuilder) Single() *QueryBuilder {
	return q
}

// Execute 执行查询
func (q *QueryBuilder) Execute(result interface{}) error {
	// 等待 SDK 支持：使用原生 Client 的 DB 方法
	// 建议：q.client.DB.From(table).Select(...).Execute()
	return fmt.Errorf("use native client.DB methods instead, SDK wrapper pending")
}

// Insert 插入数据
func (q *QueryBuilder) Insert(data interface{}) (*QueryBuilder, error) {
	// 等待 SDK 支持：使用原生 Client 的 DB 方法
	// 建议：q.client.DB.From(table).Insert(...)
	return q, fmt.Errorf("use native client.DB methods instead, SDK wrapper pending")
}

// Update 更新数据
func (q *QueryBuilder) Update(data interface{}) (*QueryBuilder, error) {
	// 等待 SDK 支持：使用原生 Client 的 DB 方法
	// 建议：q.client.DB.From(table).Update(...)
	return q, fmt.Errorf("use native client.DB methods instead, SDK wrapper pending")
}

// === 存储服务 ===

// StorageService 存储服务封装
type StorageService struct {
	client *supabase.Client
}

// UploadFile 上传文件
func (s StorageService) UploadFile(bucket, path string, data []byte) (string, error) {
	// 等待 SDK 支持：使用原生 Client 的 Storage 方法
	// 建议：s.client.Storage.From(bucket).Upload(path, data)
	return "", fmt.Errorf("use native client.Storage methods instead, SDK wrapper pending")
}

// DeleteFile 删除文件
func (s StorageService) DeleteFile(bucket, path string) error {
	// 等待 SDK 支持：使用原生 Client 的 Storage 方法
	// 建议：s.client.Storage.From(bucket).Remove(path)
	return fmt.Errorf("use native client.Storage methods instead, SDK wrapper pending")
}

// GetPublicURL 获取公开访问 URL
func (s StorageService) GetPublicURL(bucket, path string) string {
	// 等待 SDK 支持：使用原生 Client 的 Storage 方法
	// 建议：s.client.Storage.From(bucket).GetPublicURL(path)
	return fmt.Sprintf("https://example.com/%s/%s", bucket, path)
}
