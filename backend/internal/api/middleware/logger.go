package middleware

import (
	"time"

	"github.com/assistant-jarvis/backend/internal/pkg/logger"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// LoggerMiddleware 日志中间件
func LoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery
		method := c.Request.Method

		// 处理请求
		c.Next()

		// 计算耗时
		duration := time.Since(start)
		statusCode := c.Writer.Status()

		// 记录日志
		fields := []zap.Field{
			zap.String("method", method),
			zap.String("path", path),
			zap.String("query", query),
			zap.Int("status", statusCode),
			zap.Duration("duration", duration),
			zap.String("ip", c.ClientIP()),
			zap.String("user_agent", c.Request.UserAgent()),
		}

		// 如果有用户信息，添加到日志
		if userID, exists := c.Get("user_id"); exists {
			fields = append(fields, zap.String("user_id", userID.(string)))
		}

		// 根据状态码选择日志级别
		if statusCode >= 500 {
			logger.Logger.Error("Server error", fields...)
		} else if statusCode >= 400 {
			logger.Logger.Warn("Client error", fields...)
		} else {
			logger.Logger.Info("Request", fields...)
		}

		// 慢请求告警（超过 2 秒）
		if duration > 2*time.Second {
			logger.Logger.Warn("Slow request",
				zap.String("method", method),
				zap.String("path", path),
				zap.Duration("duration", duration),
			)
		}
	}
}

// RecoveryMiddleware 恢复中间件
func RecoveryMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				logger.Logger.Error("Panic recovered",
					zap.Any("error", err),
					zap.String("path", c.Request.URL.Path),
					zap.String("method", c.Request.Method),
				)

				c.JSON(500, gin.H{
					"code":    50000,
					"message": "Internal server error",
					"data":    nil,
				})
				c.Abort()
			}
		}()
		c.Next()
	}
}

