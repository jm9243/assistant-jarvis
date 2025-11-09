.PHONY: help build run test clean docker-build docker-up docker-down dev install lint

# 默认目标
.DEFAULT_GOAL := help

# 变量定义
APP_NAME := jarvis-backend
MAIN_PATH := ./cmd/server
BUILD_DIR := ./build
BINARY := $(BUILD_DIR)/server

help: ## 显示帮助信息
	@echo "可用的命令："
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## 安装依赖
	@echo "安装依赖..."
	go mod download
	go mod tidy

build: ## 编译项目
	@echo "编译项目..."
	@mkdir -p $(BUILD_DIR)
	go build -o $(BINARY) $(MAIN_PATH)/main.go
	@echo "编译完成: $(BINARY)"

run: ## 运行项目
	@echo "运行项目..."
	go run $(MAIN_PATH)/main.go

dev: ## 开发模式运行（带热重载需安装 air）
	@echo "开发模式运行..."
	@if command -v air > /dev/null; then \
		air; \
	else \
		echo "air 未安装，使用普通模式运行..."; \
		go run $(MAIN_PATH)/main.go; \
	fi

test: ## 运行测试
	@echo "运行测试..."
	go test -v ./...

test-unit: ## 运行单元测试
	@echo "运行单元测试..."
	go test -v -short ./internal/service/... ./internal/repository/...

test-integration: ## 运行集成测试
	@echo "运行集成测试..."
	go test -v -run Integration ./...

test-cover: ## 运行测试并生成覆盖率报告
	@echo "运行测试并生成覆盖率报告..."
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "覆盖率报告已生成: coverage.html"

test-cover-report: ## 生成并打开覆盖率报告
	@echo "生成覆盖率报告..."
	go test -coverprofile=coverage.out ./...
	go tool cover -func=coverage.out
	go tool cover -html=coverage.out -o coverage.html
	@echo "覆盖率报告: coverage.html"

bench: ## 运行性能测试
	@echo "运行性能测试..."
	go test -bench=. -benchmem ./...

lint: ## 代码检查（需安装 golangci-lint）
	@echo "代码检查..."
	@if command -v golangci-lint > /dev/null; then \
		golangci-lint run; \
	else \
		echo "golangci-lint 未安装，跳过检查"; \
		echo "安装: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest"; \
	fi

fmt: ## 格式化代码
	@echo "格式化代码..."
	go fmt ./...

vet: ## 代码静态分析
	@echo "代码静态分析..."
	go vet ./...

clean: ## 清理构建文件
	@echo "清理构建文件..."
	@rm -rf $(BUILD_DIR)
	@rm -f coverage.out coverage.html
	@echo "清理完成"

docker-build: ## 构建 Docker 镜像
	@echo "构建 Docker 镜像..."
	docker build -t $(APP_NAME):latest .

docker-up: ## 启动 Docker Compose
	@echo "启动 Docker Compose..."
	docker-compose up -d

docker-down: ## 停止 Docker Compose
	@echo "停止 Docker Compose..."
	docker-compose down

docker-logs: ## 查看 Docker 日志
	docker-compose logs -f

redis-start: ## 启动本地 Redis
	@echo "启动 Redis..."
	docker run -d --name jarvis-redis -p 6379:6379 redis:7-alpine

redis-stop: ## 停止本地 Redis
	@echo "停止 Redis..."
	docker stop jarvis-redis
	docker rm jarvis-redis

deps-update: ## 更新依赖
	@echo "更新依赖..."
	go get -u ./...
	go mod tidy

deps-verify: ## 验证依赖
	@echo "验证依赖..."
	go mod verify

swagger: ## 生成 Swagger 文档
	@echo "生成 Swagger 文档..."
	@if command -v swag > /dev/null; then \
		swag init -g cmd/server/main.go -o docs/swagger; \
		echo "Swagger 文档已生成: docs/swagger"; \
	else \
		echo "swag 未安装，请运行: go install github.com/swaggo/swag/cmd/swag@latest"; \
	fi

swagger-serve: swagger ## 生成并查看 Swagger 文档
	@echo "访问 Swagger 文档: http://localhost:8080/swagger/index.html"

init: install ## 初始化项目
	@echo "项目初始化完成！"
	@echo "请配置 .env 文件后运行: make run"

.PHONY: all
all: clean install build ## 完整构建流程
	@echo "构建完成！"

