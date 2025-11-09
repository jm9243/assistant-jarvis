package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/assistant-jarvis/backend/internal/api/handler"
	"github.com/assistant-jarvis/backend/internal/api/middleware"
	"github.com/assistant-jarvis/backend/internal/api/websocket"
	"github.com/assistant-jarvis/backend/internal/config"
	"github.com/assistant-jarvis/backend/internal/pkg/cache"
	"github.com/assistant-jarvis/backend/internal/pkg/logger"
	"github.com/assistant-jarvis/backend/internal/pkg/supabase"
	"github.com/assistant-jarvis/backend/internal/repository"
	"github.com/assistant-jarvis/backend/internal/service"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func main() {
	// 加载配置
	if err := config.Load(); err != nil {
		panic(fmt.Sprintf("Failed to load config: %v", err))
	}

	// 初始化日志
	if err := logger.Init(config.AppConfig.Env); err != nil {
		panic(fmt.Sprintf("Failed to init logger: %v", err))
	}
	defer logger.Sync()

	logger.Logger.Info("Starting Assistant-Jarvis Backend Service",
		zap.String("env", config.AppConfig.Env),
		zap.String("port", config.AppConfig.Port),
	)

	// 初始化 Supabase 客户端
	supabaseClient, err := supabase.NewClient()
	if err != nil {
		logger.Logger.Fatal("Failed to init Supabase client", zap.Error(err))
	}
	logger.Logger.Info("Supabase client initialized")

	// 初始化 Redis 缓存
	redisCache, err := cache.NewRedisCache(
		config.AppConfig.RedisURL,
		config.AppConfig.RedisPassword,
	)
	if err != nil {
		logger.Logger.Fatal("Failed to init Redis cache", zap.Error(err))
	}
	defer redisCache.Close()
	logger.Logger.Info("Redis cache initialized")

	// 初始化 WebSocket Hub
	wsHub := websocket.NewHub()
	go wsHub.Run()
	logger.Logger.Info("WebSocket Hub started")

	// 初始化 Repository
	userRepo := repository.NewUserRepository(supabaseClient)
	workflowRepo := repository.NewWorkflowRepository(supabaseClient)
	taskRepo := repository.NewTaskRepository(supabaseClient)
	logRepo := repository.NewLogRepository(supabaseClient)
	logger.Logger.Info("Repositories initialized")

	// 初始化 Service
	authService := service.NewAuthService(supabaseClient, userRepo)
	userService := service.NewUserService(userRepo, redisCache)
	workflowService := service.NewWorkflowService(workflowRepo, redisCache)
	taskService := service.NewTaskService(taskRepo, workflowRepo, wsHub)
	storageService := service.NewStorageService(supabaseClient)
	logService := service.NewLogService(logRepo)
	logger.Logger.Info("Services initialized")

	// 初始化 Handler
	authHandler := handler.NewAuthHandler(authService)
	userHandler := handler.NewUserHandler(userService)
	workflowHandler := handler.NewWorkflowHandler(workflowService)
	taskHandler := handler.NewTaskHandler(taskService)
	storageHandler := handler.NewStorageHandler(storageService)
	logHandler := handler.NewLogHandler(logService)
	logger.Logger.Info("Handlers initialized")

	// 设置 Gin 模式
	if config.AppConfig.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	// 创建 Gin 引擎
	r := gin.New()

	// 注册中间件
	r.Use(middleware.RecoveryMiddleware())
	r.Use(middleware.CORSMiddleware())
	r.Use(middleware.LoggerMiddleware())

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
			"time":   time.Now().Unix(),
		})
	})

	// API 路由组
	api := r.Group("/api/v1")
	{
		// 认证相关（无需认证）
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.RefreshToken)
		}

		// 需要认证的路由
		authenticated := api.Group("")
		authenticated.Use(middleware.AuthMiddleware(supabaseClient))
		{
			// 用户相关
			users := authenticated.Group("/users")
			{
				users.GET("/profile", userHandler.GetProfile)
				users.PUT("/profile", userHandler.UpdateProfile)
				users.GET("/devices", userHandler.GetDevices)
				users.POST("/devices", userHandler.RegisterDevice)
			}

			// 工作流相关
			workflows := authenticated.Group("/workflows")
			{
				workflows.GET("", workflowHandler.List)
				workflows.POST("", workflowHandler.Create)
				workflows.POST("/import", workflowHandler.Import)
				workflows.GET("/:id", workflowHandler.GetByID)
				workflows.PUT("/:id", workflowHandler.Update)
				workflows.DELETE("/:id", workflowHandler.Delete)
				workflows.GET("/:id/export", workflowHandler.Export)
			}

			// 任务相关
			tasks := authenticated.Group("/tasks")
			{
				tasks.GET("", taskHandler.List)
				tasks.POST("", taskHandler.Create)
				tasks.GET("/statistics", taskHandler.GetStatistics)
				tasks.GET("/:id", taskHandler.GetByID)
				tasks.PATCH("/:id/status", taskHandler.UpdateStatus)
				tasks.PATCH("/:id/result", taskHandler.UpdateResult)
			}

			// 文件存储相关
			storage := authenticated.Group("/storage")
			{
				storage.POST("/workflows/upload", storageHandler.UploadWorkflowFile)
				storage.POST("/screenshots/upload", storageHandler.UploadScreenshot)
				storage.POST("/avatar/upload", storageHandler.UploadAvatar)
				storage.DELETE("/:bucket/:path", storageHandler.DeleteFile)
			}

			// 日志相关
			logs := authenticated.Group("/logs")
			{
				logs.POST("", logHandler.Create)
				logs.POST("/error", logHandler.ReportError)
				logs.GET("", logHandler.List)
				logs.GET("/task", logHandler.GetTaskLogs)
			}
		}
	}

	// WebSocket 路由
	// WebSocket 端点 - 框架已就绪
	r.GET("/ws", middleware.AuthMiddleware(supabaseClient), func(c *gin.Context) {
		// 框架已就绪：WebSocket Hub 已实现并运行中
		// 下一步：创建完整的 WebSocket Handler
		// 示例实现：
		// handler := websocket.NewHandler(wsHub)
		// handler.ServeWS(c)
		c.JSON(200, gin.H{
			"message": "WebSocket framework ready",
			"status":  "hub_running",
			"note":    "Complete handler implementation pending",
		})
	})

	// 创建 HTTP 服务器
	srv := &http.Server{
		Addr:    ":" + config.AppConfig.Port,
		Handler: r,
	}

	// 在协程中启动服务器
	go func() {
		logger.Logger.Info("Server starting",
			zap.String("addr", srv.Addr),
		)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Logger.Fatal("Failed to start server", zap.Error(err))
		}
	}()

	// 等待中断信号优雅关闭服务器
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Logger.Info("Shutting down server...")

	// 5 秒超时关闭
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Logger.Fatal("Server forced to shutdown", zap.Error(err))
	}

	logger.Logger.Info("Server exited")
}

