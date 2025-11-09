package middleware

import (
	"strings"

	"github.com/assistant-jarvis/backend/internal/pkg/supabase"
	"github.com/assistant-jarvis/backend/internal/pkg/utils"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware JWT 认证中间件
func AuthMiddleware(supabaseClient *supabase.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从 Header 获取 Token
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.ErrorWithStatus(c, 401, 40101, "未授权：缺少 Authorization Header")
			c.Abort()
			return
		}

		// 去除 "Bearer " 前缀
		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token == authHeader {
			utils.ErrorWithStatus(c, 401, 40102, "未授权：Token 格式错误")
			c.Abort()
			return
		}

		// 验证 JWT Token
		user, err := supabaseClient.Auth().User(token)
		if err != nil {
			utils.ErrorWithStatus(c, 401, 40103, "未授权：Token 无效")
			c.Abort()
			return
		}

		// 设置用户信息到上下文
		c.Set("user_id", user.ID)
		c.Set("user", user)
		c.Set("token", token)
		c.Next()
	}
}

// OptionalAuthMiddleware 可选认证中间件
func OptionalAuthMiddleware(supabaseClient *supabase.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			token := strings.TrimPrefix(authHeader, "Bearer ")
			if token != authHeader {
				user, err := supabaseClient.Auth().User(token)
				if err == nil {
					c.Set("user_id", user.ID)
					c.Set("user", user)
					c.Set("token", token)
				}
			}
		}
		c.Next()
	}
}

