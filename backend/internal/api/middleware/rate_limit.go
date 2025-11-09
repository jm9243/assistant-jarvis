package middleware

import (
	"strconv"
	"time"

	"github.com/assistant-jarvis/backend/internal/pkg/utils"
	"github.com/gin-gonic/gin"
	"github.com/ulule/limiter/v3"
	"github.com/ulule/limiter/v3/drivers/store/memory"
)

// RateLimitMiddleware 限流中间件
func RateLimitMiddleware() gin.HandlerFunc {
	// 全局限流：100 请求/分钟
	rate := limiter.Rate{
		Period: 1 * time.Minute,
		Limit:  100,
	}

	store := memory.NewStore()
	instance := limiter.New(store, rate)

	return func(c *gin.Context) {
		// 使用 IP 作为限流 key
		key := c.ClientIP()

		context, err := instance.Get(c, key)
		if err != nil {
			utils.ErrorWithStatus(c, 500, 50001, "限流检查失败")
			c.Abort()
			return
		}

		// 设置响应头
		c.Header("X-RateLimit-Limit", strconv.FormatInt(context.Limit, 10))
		c.Header("X-RateLimit-Remaining", strconv.FormatInt(context.Remaining, 10))
		c.Header("X-RateLimit-Reset", strconv.FormatInt(context.Reset, 10))

		if context.Reached {
			utils.ErrorWithStatus(c, 429, 42901, "请求过于频繁，请稍后再试")
			c.Abort()
			return
		}

		c.Next()
	}
}

// RateLimitMiddlewareWithRate 自定义限流中间件
func RateLimitMiddlewareWithRate(period time.Duration, limit int64) gin.HandlerFunc {
	rate := limiter.Rate{
		Period: period,
		Limit:  limit,
	}

	store := memory.NewStore()
	instance := limiter.New(store, rate)

	return func(c *gin.Context) {
		key := c.ClientIP()

		context, err := instance.Get(c, key)
		if err != nil {
			utils.ErrorWithStatus(c, 500, 50001, "限流检查失败")
			c.Abort()
			return
		}

		c.Header("X-RateLimit-Limit", strconv.FormatInt(context.Limit, 10))
		c.Header("X-RateLimit-Remaining", strconv.FormatInt(context.Remaining, 10))
		c.Header("X-RateLimit-Reset", strconv.FormatInt(context.Reset, 10))

		if context.Reached {
			utils.ErrorWithStatus(c, 429, 42901, "请求过于频繁，请稍后再试")
			c.Abort()
			return
		}

		c.Next()
	}
}

