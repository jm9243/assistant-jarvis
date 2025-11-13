package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

// Config 应用配置
type Config struct {
	// 服务配置
	Env  string
	Port string

	// Supabase 配置
	SupabaseURL       string
	SupabaseKey       string
	SupabaseJWTSecret string
	DatabaseURL       string

	// Redis 配置
	RedisURL      string
	RedisPassword string

	// 日志配置
	LogLevel string

	// 第三方服务
	SentryDSN string
}

var AppConfig *Config

// Load 加载配置
func Load() error {
	// 加载 .env 文件（开发环境）
	_ = godotenv.Load()

	config := &Config{
		Env:  getEnv("ENV", "development"),
		Port: getEnv("PORT", "8080"),

		SupabaseURL:       getEnv("SUPABASE_URL", ""),
		SupabaseKey:       getEnv("SUPABASE_KEY", ""),
		SupabaseJWTSecret: getEnv("SUPABASE_JWT_SECRET", ""),

		RedisURL:      getEnv("REDIS_URL", "redis://localhost:6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),

		LogLevel: getEnv("LOG_LEVEL", "info"),

		SentryDSN: getEnv("SENTRY_DSN", ""),
	}

	// 验证必需的配置
	if config.SupabaseURL == "" {
		return fmt.Errorf("SUPABASE_URL is required")
	}
	if config.SupabaseKey == "" {
		return fmt.Errorf("SUPABASE_KEY is required")
	}

	AppConfig = config
	return nil
}

// getEnv 获取环境变量，如果不存在则返回默认值
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// IsDevelopment 是否为开发环境
func (c *Config) IsDevelopment() bool {
	return c.Env == "development"
}

// IsProduction 是否为生产环境
func (c *Config) IsProduction() bool {
	return c.Env == "production"
}

