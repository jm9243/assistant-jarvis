# 助手-贾维斯 后端服务

基于 Go + Gin + Supabase 的云端 API 服务，为 PC 客户端提供工作流管理、任务执行、实时通信等核心功能。

## 技术栈

- **Go 1.21+** - 高性能编程语言
- **Gin** - Web 框架
- **Supabase** - BaaS 平台（PostgreSQL + Auth + Storage）
- **Redis** - 缓存
- **WebSocket** - 实时通信
- **Docker** - 容器化部署

## 项目结构

```
backend/
├── cmd/server/          # 主程序入口
├── internal/
│   ├── api/            # API 层
│   │   ├── handler/    # 处理器
│   │   ├── middleware/ # 中间件
│   │   └── websocket/  # WebSocket
│   ├── service/        # 业务逻辑层
│   ├── repository/     # 数据访问层
│   ├── model/          # 数据模型
│   ├── pkg/            # 工具包
│   └── config/         # 配置
├── migrations/         # 数据库迁移
└── docs/              # 文档
```

## 快速开始

### 前置要求

- Go 1.21+
- Redis 7.x
- Supabase 账号

### 1. 安装依赖

```bash
cd backend
go mod download
```

### 2. 配置环境变量

复制 `env.example` 为 `.env` 并填写配置：

```bash
cp env.example .env
```

编辑 `.env` 文件，填写 Supabase 和 Redis 配置。

### 3. 运行服务

```bash
go run cmd/server/main.go
```

服务将在 `http://localhost:8080` 启动。

### 4. 健康检查

```bash
curl http://localhost:8080/health
```

## Docker 部署

### 使用 Docker Compose

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 构建 Docker 镜像

```bash
docker build -t jarvis-backend:latest .
```

## API 文档

### 认证相关

```
POST   /api/v1/auth/register      # 用户注册
POST   /api/v1/auth/login         # 用户登录
POST   /api/v1/auth/refresh       # 刷新 Token
```

### 用户管理

```
GET    /api/v1/users/profile      # 获取用户信息
PUT    /api/v1/users/profile      # 更新用户信息
GET    /api/v1/users/devices      # 获取设备列表
POST   /api/v1/users/devices      # 注册设备
```

### 工作流管理

```
GET    /api/v1/workflows          # 获取工作流列表
POST   /api/v1/workflows          # 创建工作流
GET    /api/v1/workflows/:id      # 获取工作流详情
PUT    /api/v1/workflows/:id      # 更新工作流
DELETE /api/v1/workflows/:id      # 删除工作流
```

### 任务管理

```
POST   /api/v1/tasks              # 创建任务
GET    /api/v1/tasks              # 获取任务列表
GET    /api/v1/tasks/:id          # 获取任务详情
PUT    /api/v1/tasks/:id/status   # 更新任务状态
```

### 文件管理

```
POST   /api/v1/files/upload       # 文件上传
GET    /api/v1/files/:id          # 获取文件
```

### 日志管理

```
POST   /api/v1/logs               # 上报日志
GET    /api/v1/logs               # 获取日志列表
```

### WebSocket

```
WS     /ws                        # WebSocket 连接
```

## 开发指南

### 代码规范

- 使用 `gofmt` 格式化代码
- 遵循 Go 官方命名规范
- 导出函数添加注释
- API 添加 Swagger 注释

### Git 提交规范

使用 Conventional Commits 规范：

```
feat: 添加工作流列表 API
fix: 修复任务状态更新问题
docs: 更新 API 文档
refactor: 重构认证中间件
test: 添加工作流服务单元测试
chore: 更新依赖包版本
```

### 测试

```bash
# 运行所有测试
make test

# 运行单元测试
make test-unit

# 运行集成测试
make test-integration

# 生成覆盖率报告
make test-cover

# 详细覆盖率报告
make test-cover-report

# 运行性能测试
make bench
```

详细测试指南：`docs/测试指南.md`

### API 文档

```bash
# 生成 Swagger 文档
make swagger

# 生成并查看文档
make swagger-serve

# 访问：http://localhost:8080/swagger/index.html
```

### 性能优化

查看完整的性能优化指南：`docs/性能优化指南.md`

包含：
- 数据库优化策略
- 缓存设计
- 并发控制
- 内存优化
- 网络优化
- 监控与分析

## 目录说明

- `cmd/server/` - 主程序入口
- `internal/api/` - API 层，包含 Handler、Middleware、WebSocket
- `internal/service/` - 业务逻辑层
- `internal/repository/` - 数据访问层
- `internal/model/` - 数据模型定义
- `internal/pkg/` - 通用工具包
- `internal/config/` - 配置管理
- `migrations/` - 数据库迁移脚本
- `docs/` - 项目文档

## 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| ENV | 运行环境 | development/production |
| PORT | 服务端口 | 8080 |
| SUPABASE_URL | Supabase 项目 URL | https://xxx.supabase.co |
| SUPABASE_KEY | Supabase API Key | eyJhbGc... |
| SUPABASE_JWT_SECRET | JWT 密钥 | your-jwt-secret |
| REDIS_URL | Redis 连接地址 | redis://localhost:6379 |
| REDIS_PASSWORD | Redis 密码 | (可选) |
| LOG_LEVEL | 日志级别 | debug/info/warn/error |

## 常见问题

### 1. 无法连接到 Supabase

检查 `SUPABASE_URL` 和 `SUPABASE_KEY` 是否正确配置。

### 2. Redis 连接失败

确保 Redis 服务已启动，检查 `REDIS_URL` 配置。

### 3. 端口被占用

修改 `.env` 文件中的 `PORT` 配置。

## 相关文档

- [技术架构设计](./docs/技术架构设计.md)
- [Phase 1 迭代计划](../docs/iteration-plans/phase-1-mvp/backend-service.md)
- [产品需求文档](../docs/产品需求文档-完整版.md)

## 许可证

MIT

