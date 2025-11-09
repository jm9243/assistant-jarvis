# Phase 1: 工作流系统 - 后台服务迭代计划

**阶段目标**: 建立云端服务基础架构，支持PC端工作流系统  
**预计时间**: 3个月  
**依赖**: 无（首个阶段）

---

## 目录

1. [功能清单](#功能清单)
2. [核心功能详解](#核心功能详解)
3. [技术架构](#技术架构)
4. [开发计划](#开发计划)
5. [验收标准](#验收标准)

---

## 功能清单

### 必须完成的功能模块

#### 1. Supabase项目初始化 (对应PRD 7.5)
- [ ] Supabase项目创建与配置
- [ ] 数据库Schema设计
- [ ] Row Level Security (RLS)策略配置
- [ ] Supabase Auth配置
- [ ] Supabase Storage配置
- [ ] Realtime订阅配置

#### 2. 用户认证服务 (对应PRD 4.1 + 6.2.1)
- [ ] 用户注册API
- [ ] 用户登录API（邮箱/密码）
- [ ] 第三方登录集成（微信、Google）
- [ ] JWT Token管理
- [ ] 会话管理
- [ ] 密码重置

#### 3. 用户管理服务 (对应PRD 6.2.1)
- [ ] 用户信息CRUD API
- [ ] 用户列表查询（筛选、搜索、分页）
- [ ] 用户详情查看
- [ ] 用户状态管理（正常/冻结/注销）
- [ ] 设备管理API
- [ ] 操作日志记录

#### 4. 工作流服务 (对应PRD 4.2)
- [ ] 工作流CRUD API
- [ ] 工作流列表查询（分类、标签、搜索）
- [ ] 工作流版本管理
- [ ] 工作流导入导出
- [ ] 工作流兼容性检查
- [ ] 工作流分享与权限

#### 5. 任务执行服务 (对应PRD 4.10)
- [ ] 任务状态同步API
- [ ] 任务执行日志上报
- [ ] 任务结果上报
- [ ] 任务历史查询
- [ ] 执行统计API

#### 6. WebSocket实时通信 (对应PRD 4.14)
- [ ] WebSocket连接管理
- [ ] PC端在线状态同步
- [ ] 任务状态实时推送
- [ ] 远程控制指令下发（Phase 5移动端需要）
- [ ] 心跳保活机制

#### 7. 文件存储服务 (对应PRD 7.5)
- [ ] 工作流文件上传下载
- [ ] 截图文件存储
- [ ] 应用图标存储
- [ ] 文件访问权限控制
- [ ] CDN加速配置

#### 8. 日志与监控 (对应PRD 4.11)
- [ ] 客户端日志收集API
- [ ] 错误日志上报
- [ ] 系统监控指标采集
- [ ] 告警通知

---

## 核心功能详解

### 1. Supabase项目初始化

#### 1.1 项目创建
**功能描述**: 创建Supabase项目，配置基础环境

**操作步骤**:
1. 访问 https://supabase.com 创建新项目
2. 选择地区（建议选择离用户近的区域）
3. 设置数据库密码（强密码）
4. 等待项目初始化完成（约2分钟）

**配置项**:
- 项目名称: `assistant-jarvis`
- 数据库: PostgreSQL 15+
- 地区: Asia Pacific (ap-northeast-1 或 ap-southeast-1)

---

#### 1.2 数据库Schema设计
**功能描述**: 设计并创建所有必要的数据库表

**核心表结构**:

**users表** (用户信息，继承Supabase Auth)
```sql
-- Supabase Auth自动创建auth.users表
-- 扩展用户信息表
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE,
  avatar_url TEXT,
  membership_level VARCHAR(20) DEFAULT 'free',
  membership_expires_at TIMESTAMP WITH TIME ZONE,
  storage_quota_mb INTEGER DEFAULT 1000,
  token_quota INTEGER DEFAULT 100000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**workflows表** (工作流定义)
```sql
CREATE TABLE public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  tags TEXT[], -- PostgreSQL数组类型
  icon VARCHAR(255),
  version VARCHAR(20) DEFAULT '1.0.0',
  os_requirements TEXT[], -- ['macOS', 'Windows']
  target_apps JSONB, -- 目标应用信息
  parameters JSONB, -- 工作流参数定义
  definition JSONB NOT NULL, -- 工作流定义（nodes + edges）
  triggers JSONB, -- 触发器配置
  is_published BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX idx_workflows_category ON public.workflows(category);
CREATE INDEX idx_workflows_tags ON public.workflows USING GIN(tags);
CREATE INDEX idx_workflows_is_published ON public.workflows(is_published);

CREATE TRIGGER update_workflows_updated_at
BEFORE UPDATE ON public.workflows
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**tasks表** (任务执行记录)
```sql
CREATE TYPE task_status AS ENUM ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled');
CREATE TYPE task_priority AS ENUM ('high', 'medium', 'low');

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id VARCHAR(255), -- PC设备标识
  status task_status DEFAULT 'pending',
  priority task_priority DEFAULT 'medium',
  parameters JSONB, -- 执行参数
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  result JSONB, -- 执行结果
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tasks_workflow_id ON public.tasks(workflow_id);
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_created_at ON public.tasks(created_at DESC);
```

**logs表** (日志记录)
```sql
CREATE TYPE log_level AS ENUM ('debug', 'info', 'warn', 'error');
CREATE TYPE log_category AS ENUM ('system', 'task', 'message', 'error');

CREATE TABLE public.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  level log_level NOT NULL,
  category log_category NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_logs_user_id ON public.logs(user_id);
CREATE INDEX idx_logs_task_id ON public.logs(task_id);
CREATE INDEX idx_logs_level ON public.logs(level);
CREATE INDEX idx_logs_created_at ON public.logs(created_at DESC);

-- 日志保留策略：仅保留最近30天
CREATE OR REPLACE FUNCTION delete_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.logs
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 定时任务（使用pg_cron扩展，如果可用）
-- SELECT cron.schedule('delete-old-logs', '0 2 * * *', 'SELECT delete_old_logs()');
```

**devices表** (设备管理)
```sql
CREATE TABLE public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL, -- 设备唯一标识
  device_name VARCHAR(255),
  os_type VARCHAR(50), -- 'macOS', 'Windows'
  os_version VARCHAR(50),
  app_version VARCHAR(50),
  ip_address VARCHAR(50),
  last_online_at TIMESTAMP WITH TIME ZONE,
  is_online BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

CREATE INDEX idx_devices_user_id ON public.devices(user_id);
CREATE INDEX idx_devices_is_online ON public.devices(is_online);
```

---

#### 1.3 Row Level Security (RLS)策略
**功能描述**: 配置行级安全策略，确保数据隔离

**RLS策略示例**:

```sql
-- 启用RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- user_profiles策略：用户只能读写自己的profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- workflows策略：用户只能操作自己的工作流
CREATE POLICY "Users can view own workflows"
  ON public.workflows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workflows"
  ON public.workflows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workflows"
  ON public.workflows FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workflows"
  ON public.workflows FOR DELETE
  USING (auth.uid() = user_id);

-- tasks策略：用户只能查看自己的任务
CREATE POLICY "Users can view own tasks"
  ON public.tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id);

-- logs策略：用户只能查看自己的日志
CREATE POLICY "Users can view own logs"
  ON public.logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
  ON public.logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- devices策略：用户只能管理自己的设备
CREATE POLICY "Users can view own devices"
  ON public.devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own devices"
  ON public.devices FOR ALL
  USING (auth.uid() = user_id);
```

---

#### 1.4 Supabase Auth配置
**功能描述**: 配置用户认证服务

**配置项**:
- 邮箱验证: 可选（Phase 1可关闭）
- 密码策略: 最小长度8位
- 第三方登录: 
  - Google OAuth（需配置Client ID和Secret）
  - 微信登录（需对接微信开放平台）

**Auth配置文件** (在Supabase Dashboard配置):
```json
{
  "site_url": "http://localhost:3000",
  "additional_redirect_urls": [],
  "jwt_expiry": 3600,
  "password_min_length": 8,
  "disable_signup": false,
  "external_providers": {
    "google": {
      "enabled": true,
      "client_id": "YOUR_GOOGLE_CLIENT_ID",
      "secret": "YOUR_GOOGLE_SECRET"
    }
  }
}
```

---

#### 1.5 Supabase Storage配置
**功能描述**: 配置文件存储服务

**Bucket配置**:

```sql
-- 创建存储桶
INSERT INTO storage.buckets (id, name, public) VALUES
  ('workflows', 'workflows', false),
  ('screenshots', 'screenshots', false),
  ('avatars', 'avatars', true),
  ('icons', 'icons', true);

-- workflows存储桶策略
CREATE POLICY "Users can upload own workflow files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'workflows' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read own workflow files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'workflows' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- screenshots存储桶策略
CREATE POLICY "Users can upload own screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'screenshots' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read own screenshots"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'screenshots' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- avatars存储桶策略（公开读）
CREATE POLICY "Anyone can read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- icons存储桶策略（公开读）
CREATE POLICY "Anyone can read icons"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'icons');
```

---

### 2. 用户认证服务

#### 2.1 用户注册API
**功能描述**: 用户注册接口

**接口定义**:
```
POST /api/v1/auth/register
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "password123",
  "username": "username" (可选)
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username"
    },
    "session": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_token",
      "expires_at": 1234567890
    }
  }
}
```

**技术实现**:
- 调用Supabase Auth的`signUp`方法
- 自动创建`user_profiles`记录
- 返回JWT Token

---

#### 2.2 用户登录API
**功能描述**: 用户登录接口

**接口定义**:
```
POST /api/v1/auth/login
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "avatar_url": "https://...",
      "membership_level": "free"
    },
    "session": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_token",
      "expires_at": 1234567890
    }
  }
}
```

**技术实现**:
- 调用Supabase Auth的`signInWithPassword`方法
- 查询并返回用户profile信息
- 记录登录日志

---

#### 2.3 第三方登录集成
**功能描述**: 支持Google、微信第三方登录

**Google登录流程**:
```
1. 前端调用Supabase Auth的signInWithOAuth方法
2. 跳转到Google授权页面
3. 用户授权后跳转回应用
4. Supabase自动创建用户并返回Token
```

**微信登录流程** (需自定义实现):
```
1. 前端调起微信扫码
2. 用户扫码授权
3. 获取微信openid和用户信息
4. 调用后端API，后端与Supabase Auth集成
5. 返回JWT Token
```

---

### 3. 用户管理服务

#### 3.1 用户信息CRUD API
**功能描述**: 管理用户基本信息

**接口列表**:

**获取当前用户信息**:
```
GET /api/v1/users/me
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "avatar_url": "https://...",
    "membership_level": "free",
    "membership_expires_at": "2025-12-31T23:59:59Z",
    "storage_quota_mb": 1000,
    "storage_used_mb": 150,
    "token_quota": 100000,
    "token_used": 5000,
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

**更新用户信息**:
```
PATCH /api/v1/users/me
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "username": "new_username",
  "avatar_url": "https://..."
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "new_username",
    "avatar_url": "https://...",
    ...
  }
}
```

---

#### 3.2 用户列表查询API
**功能描述**: 管理员查询用户列表（Phase 5管理后台使用）

**接口定义**:
```
GET /api/v1/admin/users
Authorization: Bearer <admin_token>
Query Parameters:
  - page: 页码（默认1）
  - page_size: 每页数量（默认20）
  - keyword: 搜索关键词（用户名、邮箱）
  - membership_level: 会员等级筛选
  - status: 状态筛选（normal/frozen/deleted）

Response:
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "username": "username",
        "membership_level": "free",
        "created_at": "2025-01-01T00:00:00Z",
        "last_login_at": "2025-11-08T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 100
    }
  }
}
```

---

### 4. 工作流服务

#### 4.1 工作流CRUD API
**功能描述**: 工作流的增删改查

**创建工作流**:
```
POST /api/v1/workflows
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "name": "工作流名称",
  "description": "工作流描述",
  "category": "automation",
  "tags": ["tag1", "tag2"],
  "icon": "icon_name",
  "os_requirements": ["macOS", "Windows"],
  "parameters": [
    {
      "name": "param1",
      "type": "string",
      "required": true,
      "default": "value"
    }
  ],
  "definition": {
    "nodes": [...],
    "edges": [...]
  },
  "triggers": [...]
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "工作流名称",
    ...
  }
}
```

**获取工作流列表**:
```
GET /api/v1/workflows
Authorization: Bearer <token>
Query Parameters:
  - page: 页码
  - page_size: 每页数量
  - category: 分类筛选
  - tags: 标签筛选（逗号分隔）
  - keyword: 搜索关键词
  - is_published: 是否已发布
  - is_archived: 是否已归档

Response:
{
  "success": true,
  "data": {
    "workflows": [...],
    "pagination": {...}
  }
}
```

**获取工作流详情**:
```
GET /api/v1/workflows/{workflow_id}
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "工作流名称",
    "definition": {...},
    "execution_count": 100,
    "success_count": 95,
    ...
  }
}
```

**更新工作流**:
```
PATCH /api/v1/workflows/{workflow_id}
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "name": "新名称",
  "definition": {...}
}

Response:
{
  "success": true,
  "data": {...}
}
```

**删除工作流**:
```
DELETE /api/v1/workflows/{workflow_id}
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "工作流已删除"
}
```

---

#### 4.2 工作流导入导出API
**功能描述**: 导入导出工作流

**导出工作流**:
```
GET /api/v1/workflows/{workflow_id}/export
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "workflow": {...}, // 完整的工作流定义
    "export_version": "1.0",
    "exported_at": "2025-11-08T10:00:00Z"
  }
}
```

**导入工作流**:
```
POST /api/v1/workflows/import
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "workflow": {...}, // 工作流定义
  "export_version": "1.0"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "导入的工作流",
    ...
  }
}
```

---

### 5. 任务执行服务

#### 5.1 任务状态同步API
**功能描述**: PC端上报任务执行状态

**创建任务**:
```
POST /api/v1/tasks
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "workflow_id": "uuid",
  "priority": "medium",
  "parameters": {...}
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "workflow_id": "uuid",
    "status": "pending",
    "created_at": "2025-11-08T10:00:00Z"
  }
}
```

**更新任务状态**:
```
PATCH /api/v1/tasks/{task_id}/status
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "status": "running",
  "start_time": "2025-11-08T10:00:05Z"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "running",
    ...
  }
}
```

**上报任务结果**:
```
PATCH /api/v1/tasks/{task_id}/result
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "status": "completed",
  "end_time": "2025-11-08T10:00:15Z",
  "duration_ms": 10000,
  "result": {
    "nodes": [...],
    "variables": {...}
  }
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "completed",
    ...
  }
}
```

---

#### 5.2 任务历史查询API
**功能描述**: 查询任务执行历史

**获取任务列表**:
```
GET /api/v1/tasks
Authorization: Bearer <token>
Query Parameters:
  - workflow_id: 工作流ID
  - status: 状态筛选
  - page: 页码
  - page_size: 每页数量

Response:
{
  "success": true,
  "data": {
    "tasks": [...],
    "pagination": {...}
  }
}
```

**获取任务详情**:
```
GET /api/v1/tasks/{task_id}
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "workflow_id": "uuid",
    "workflow_name": "工作流名称",
    "status": "completed",
    "duration_ms": 10000,
    "result": {...},
    ...
  }
}
```

---

### 6. WebSocket实时通信

#### 6.1 WebSocket连接管理
**功能描述**: 管理PC端和移动端的WebSocket长连接

**连接URL**:
```
wss://your-project.supabase.co/realtime/v1/websocket
```

**连接流程**:
```
1. PC端启动时建立WebSocket连接
2. 发送认证消息（JWT Token）
3. 服务器验证Token并绑定用户ID
4. 维持心跳保活
```

**技术实现**:
- 使用Supabase Realtime服务
- 订阅特定频道（如`user:${userId}`）
- 通过PostgreSQL的LISTEN/NOTIFY机制实现实时推送

---

#### 6.2 PC端在线状态同步
**功能描述**: 实时同步PC端在线状态

**状态上报**:
```javascript
// PC端定期发送心跳
{
  "type": "heartbeat",
  "device_id": "device_uuid",
  "timestamp": 1234567890
}
```

**数据库触发器**:
```sql
-- 更新设备在线状态
CREATE OR REPLACE FUNCTION update_device_online_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.devices
  SET is_online = TRUE, last_online_at = NOW()
  WHERE user_id = NEW.user_id AND device_id = NEW.device_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

#### 6.3 任务状态实时推送
**功能描述**: 任务状态变化时实时推送给客户端

**推送消息格式**:
```json
{
  "type": "task_status_update",
  "data": {
    "task_id": "uuid",
    "workflow_id": "uuid",
    "status": "running",
    "progress": 50,
    "current_node": "node_id",
    "timestamp": 1234567890
  }
}
```

**技术实现**:
- 使用Supabase Realtime订阅`tasks`表的变化
- PC端任务状态变化时更新数据库
- 数据库触发实时推送给所有订阅者

---

### 7. 文件存储服务

#### 7.1 工作流文件上传下载API
**功能描述**: 上传和下载工作流相关文件

**上传文件**:
```
POST /api/v1/storage/workflows/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Request Body:
  - file: 文件（二进制）
  - workflow_id: 工作流ID

Response:
{
  "success": true,
  "data": {
    "file_url": "https://.../workflows/user_id/workflow_id/file.json",
    "file_path": "user_id/workflow_id/file.json"
  }
}
```

**下载文件**:
```
GET /api/v1/storage/workflows/download
Authorization: Bearer <token>
Query Parameters:
  - file_path: 文件路径

Response:
  文件二进制流
```

**技术实现**:
- 使用Supabase Storage API
- 文件路径格式: `{user_id}/{workflow_id}/{filename}`
- 通过RLS策略控制访问权限

---

#### 7.2 截图文件存储API
**功能描述**: 存储工作流执行时的截图

**上传截图**:
```
POST /api/v1/storage/screenshots/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Request Body:
  - file: 截图文件
  - task_id: 任务ID
  - node_id: 节点ID

Response:
{
  "success": true,
  "data": {
    "file_url": "https://.../screenshots/user_id/task_id/node_id.png",
    "file_path": "user_id/task_id/node_id.png"
  }
}
```

**技术实现**:
- 文件路径格式: `{user_id}/{task_id}/{node_id}_{timestamp}.png`
- 自动生成缩略图（可选）
- 定期清理过期截图（>30天）

---

### 8. 日志与监控

#### 8.1 客户端日志收集API
**功能描述**: 收集PC端日志

**上报日志**:
```
POST /api/v1/logs
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "logs": [
    {
      "level": "info",
      "category": "task",
      "message": "工作流开始执行",
      "task_id": "uuid",
      "details": {...}
    }
  ]
}

Response:
{
  "success": true,
  "message": "日志已收集"
}
```

**批量上报**: 支持一次上报多条日志，减少网络请求

---

#### 8.2 错误日志上报
**功能描述**: 单独上报错误日志，优先处理

**上报错误**:
```
POST /api/v1/logs/error
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "message": "节点执行失败",
  "error_type": "ElementNotFoundError",
  "stack_trace": "...",
  "task_id": "uuid",
  "node_id": "node_id",
  "context": {...}
}

Response:
{
  "success": true,
  "error_id": "uuid"
}
```

**技术实现**:
- 错误日志立即写入数据库
- 触发告警通知（如果配置）
- 集成Sentry（可选）

---

## 技术架构

### Go后端服务架构

```
┌──────────────────────────────────────────────────────────┐
│                     Go后端服务                            │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              API网关层 (Gin/Fiber)                   │ │
│  │                                                      │ │
│  │  - 请求路由                                          │ │
│  │  - JWT验证                                           │ │
│  │  - 请求日志                                          │ │
│  │  - 速率限制                                          │ │
│  │  - CORS配置                                          │ │
│  └─────────────────────────────────────────────────────┘ │
│                         ↓                                 │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              业务服务层                              │ │
│  │                                                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │ │
│  │  │  用户服务    │  │  工作流服务  │  │ 任务服务 │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────┘  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │ │
│  │  │  存储服务    │  │  日志服务    │  │ WS服务   │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────┘  │ │
│  └─────────────────────────────────────────────────────┘ │
│                         ↓                                 │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Supabase客户端层                        │ │
│  │                                                      │ │
│  │  - PostgreSQL客户端 (pgx)                           │ │
│  │  - Supabase Auth SDK                                │ │
│  │  - Supabase Storage SDK                             │ │
│  │  - Supabase Realtime SDK                            │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│                   Supabase平台                            │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ PostgreSQL   │  │    Auth      │  │   Storage    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │  Realtime    │  │ Edge Functions│                     │
│  └──────────────┘  └──────────────┘                     │
└──────────────────────────────────────────────────────────┘
```

---

### 核心技术栈

**后端服务**:
- 语言: Go 1.21+
- Web框架: Gin或Fiber（轻量高性能）
- PostgreSQL客户端: pgx
- JWT验证: golang-jwt/jwt
- WebSocket: gorilla/websocket或框架内置
- 配置管理: viper
- 日志: zap

**Supabase服务**:
- 数据库: PostgreSQL 15+
- 认证: Supabase Auth
- 存储: Supabase Storage
- 实时: Supabase Realtime
- Edge Functions: Deno Deploy

**缓存（可选）**:
- Redis: 用于会话缓存、速率限制

**监控**:
- Prometheus: 指标采集
- Grafana: 可视化监控
- Sentry: 错误追踪

---

### 项目结构

```
backend/
├── cmd/
│   └── server/
│       └── main.go              # 入口文件
├── internal/
│   ├── api/                     # API处理器
│   │   ├── auth.go              # 认证相关API
│   │   ├── users.go             # 用户相关API
│   │   ├── workflows.go         # 工作流相关API
│   │   ├── tasks.go             # 任务相关API
│   │   ├── storage.go           # 存储相关API
│   │   └── logs.go              # 日志相关API
│   ├── middleware/              # 中间件
│   │   ├── auth.go              # JWT验证中间件
│   │   ├── logger.go            # 日志中间件
│   │   ├── ratelimit.go         # 速率限制中间件
│   │   └── cors.go              # CORS中间件
│   ├── service/                 # 业务逻辑层
│   │   ├── auth_service.go
│   │   ├── user_service.go
│   │   ├── workflow_service.go
│   │   ├── task_service.go
│   │   ├── storage_service.go
│   │   └── log_service.go
│   ├── repository/              # 数据访问层
│   │   ├── user_repo.go
│   │   ├── workflow_repo.go
│   │   ├── task_repo.go
│   │   └── log_repo.go
│   ├── model/                   # 数据模型
│   │   ├── user.go
│   │   ├── workflow.go
│   │   ├── task.go
│   │   └── log.go
│   ├── supabase/                # Supabase客户端
│   │   ├── client.go            # 基础客户端
│   │   ├── auth.go              # Auth客户端
│   │   ├── storage.go           # Storage客户端
│   │   └── realtime.go          # Realtime客户端
│   ├── websocket/               # WebSocket管理
│   │   ├── hub.go               # WebSocket Hub
│   │   ├── client.go            # WebSocket Client
│   │   └── handler.go           # WebSocket Handler
│   └── config/                  # 配置
│       └── config.go
├── pkg/                         # 公共包
│   ├── response/                # 统一响应格式
│   ├── validator/               # 数据验证
│   └── utils/                   # 工具函数
├── scripts/                     # 脚本
│   └── init_db.sql              # 数据库初始化脚本
├── go.mod
├── go.sum
└── README.md
```

---

## 开发计划

### 时间线（共3个月）

#### 第1个月：Supabase初始化与核心API

**Week 1-2: Supabase项目初始化**
- [ ] 创建Supabase项目
- [ ] 设计数据库Schema
- [ ] 执行Schema SQL脚本
- [ ] 配置RLS策略
- [ ] 配置Supabase Auth
- [ ] 配置Supabase Storage
- [ ] 测试Supabase基础功能

**Week 3-4: Go项目初始化与用户服务**
- [ ] 搭建Go项目框架
- [ ] 集成Supabase客户端SDK
- [ ] 实现JWT中间件
- [ ] 实现用户注册API
- [ ] 实现用户登录API
- [ ] 实现用户信息API
- [ ] 第三方登录集成（Google）
- [ ] API文档编写（Swagger）

---

#### 第2个月：工作流与任务服务

**Week 5-6: 工作流服务**
- [ ] 实现工作流CRUD API
- [ ] 实现工作流列表查询
- [ ] 实现工作流导入导出
- [ ] 实现工作流版本管理
- [ ] 文件存储服务集成
- [ ] 工作流兼容性检查逻辑

**Week 7-8: 任务服务**
- [ ] 实现任务CRUD API
- [ ] 实现任务状态同步API
- [ ] 实现任务结果上报API
- [ ] 实现任务历史查询API
- [ ] 任务执行统计API
- [ ] 任务相关文件上传（截图）

---

#### 第3个月：WebSocket与完善

**Week 9-10: WebSocket实时通信**
- [ ] WebSocket Hub实现
- [ ] WebSocket连接管理
- [ ] 心跳保活机制
- [ ] PC端在线状态同步
- [ ] 任务状态实时推送
- [ ] Supabase Realtime集成

**Week 11-12: 日志监控与优化**
- [ ] 日志收集API
- [ ] 错误日志上报API
- [ ] 系统监控指标采集
- [ ] Prometheus集成
- [ ] 性能优化
- [ ] 压力测试
- [ ] Bug修复
- [ ] 文档完善

---

### 开发任务分配建议

**Go后端团队（2人）**:
- 工程师A: 用户服务、工作流服务、API网关
- 工程师B: 任务服务、WebSocket服务、日志服务

**DevOps工程师（可选，0.5人）**:
- Supabase项目配置与维护
- 监控系统搭建
- CI/CD流程

---

### 开发里程碑

**Milestone 1（第1个月末）**: Supabase与核心API完成
- ✅ Supabase项目配置完成
- ✅ 数据库Schema创建完成
- ✅ 用户认证API可用
- ✅ 用户管理API可用

**Milestone 2（第2个月末）**: 工作流与任务服务完成
- ✅ 工作流服务完整可用
- ✅ 任务服务完整可用
- ✅ 文件存储服务可用
- ✅ PC端可以正常调用所有API

**Milestone 3（第3个月末）**: Phase 1完成
- ✅ WebSocket实时通信可用
- ✅ 日志监控系统完成
- ✅ 性能和稳定性达标
- ✅ 通过验收标准

---

## 验收标准

### 功能性验收

#### 1. Supabase配置
- [ ] Supabase项目创建成功
- [ ] 所有数据库表创建成功
- [ ] RLS策略配置正确
- [ ] Auth配置正确（邮箱+Google登录）
- [ ] Storage配置正确（4个bucket）

#### 2. 用户认证
- [ ] 用户注册功能正常
- [ ] 用户登录功能正常
- [ ] JWT Token生成和验证正常
- [ ] Google第三方登录正常
- [ ] Token刷新机制正常

#### 3. 用户管理
- [ ] 获取用户信息API正常
- [ ] 更新用户信息API正常
- [ ] 用户列表查询API正常（管理员）
- [ ] 用户操作日志记录完整

#### 4. 工作流服务
- [ ] 创建工作流API正常
- [ ] 获取工作流列表API正常（支持筛选、搜索、分页）
- [ ] 获取工作流详情API正常
- [ ] 更新工作流API正常
- [ ] 删除工作流API正常
- [ ] 导入导出工作流API正常

#### 5. 任务服务
- [ ] 创建任务API正常
- [ ] 更新任务状态API正常
- [ ] 上报任务结果API正常
- [ ] 查询任务列表API正常
- [ ] 查询任务详情API正常
- [ ] 任务执行统计API正常

#### 6. WebSocket服务
- [ ] WebSocket连接建立正常
- [ ] 心跳保活机制正常
- [ ] PC端在线状态同步正常
- [ ] 任务状态实时推送正常
- [ ] 断线重连机制正常

#### 7. 文件存储
- [ ] 工作流文件上传下载正常
- [ ] 截图文件上传正常
- [ ] 文件访问权限控制正确
- [ ] 文件路径命名规范

#### 8. 日志服务
- [ ] 日志收集API正常
- [ ] 错误日志上报API正常
- [ ] 日志查询功能正常
- [ ] 日志保留策略正确执行

---

### 性能验收

#### 1. API响应时间
- [ ] 简单查询API响应 < 100ms (P95)
- [ ] 复杂查询API响应 < 200ms (P95)
- [ ] 文件上传API响应 < 2s (10MB文件)

#### 2. 并发性能
- [ ] 支持100并发用户正常使用
- [ ] 支持10并发文件上传
- [ ] WebSocket支持1000+连接

#### 3. 数据库性能
- [ ] 简单查询 < 50ms
- [ ] 复杂关联查询 < 200ms
- [ ] 写入操作 < 100ms

---

### 可靠性验收

#### 1. 数据一致性
- [ ] 工作流保存后可正确读取
- [ ] 任务状态更新无遗漏
- [ ] 并发写入不会导致数据错误

#### 2. 错误处理
- [ ] API错误返回统一格式
- [ ] 数据库错误有友好提示
- [ ] 网络错误有重试机制

#### 3. 安全性
- [ ] JWT Token验证正确
- [ ] RLS策略有效（用户只能访问自己的数据）
- [ ] SQL注入防护
- [ ] XSS防护

---

### 监控验收

#### 1. 系统监控
- [ ] CPU、内存、磁盘监控正常
- [ ] API请求量、响应时间监控正常
- [ ] 错误率监控正常

#### 2. 告警配置
- [ ] 错误率超过阈值告警
- [ ] API响应时间超过阈值告警
- [ ] 数据库连接数超过阈值告警

---

## 风险与应对

### 技术风险

#### 风险1: Supabase免费额度限制
**影响**: 用户增长后可能超出免费额度
**应对措施**:
- 提前评估Supabase付费方案
- 监控资源使用情况
- 必要时升级到Pro计划

#### 风险2: WebSocket连接数限制
**影响**: 大量用户在线时连接数不足
**应对措施**:
- 使用Supabase Realtime（支持大量连接）
- 实现连接池管理
- 必要时自建WebSocket服务

#### 风险3: 数据库性能瓶颈
**影响**: 大量数据时查询变慢
**应对措施**:
- 合理设计索引
- 使用Redis缓存热点数据
- 定期数据归档

---

### 进度风险

#### 风险1: Supabase学习曲线
**影响**: 团队不熟悉Supabase导致进度延迟
**应对措施**:
- Week 1提前学习Supabase文档
- 参考Supabase示例项目
- 必要时咨询Supabase社区

#### 风险2: API开发量大
**影响**: 第2-3个月进度紧张
**应对措施**:
- 使用代码生成工具（如swagger-codegen）
- 编写API模板减少重复代码
- 并行开发多个服务

---

## 交付物清单

### 代码交付物
- [ ] Go后端服务源代码
- [ ] Supabase Schema SQL脚本
- [ ] API文档（Swagger）
- [ ] 部署脚本
- [ ] 单元测试代码

### 文档交付物
- [ ] 技术架构文档
- [ ] API接口文档
- [ ] 数据库设计文档
- [ ] Supabase配置文档
- [ ] 部署运维文档

### Supabase交付物
- [ ] Supabase项目配置
- [ ] 数据库Schema
- [ ] RLS策略配置
- [ ] Storage配置

---

## 后续计划

Phase 1完成后，进入Phase 2: 三种Agent开发。

**Phase 2的后端服务需求**:
- ✅ Agent配置管理API
- ✅ 知识库服务（向量数据库）
- ✅ LLM服务代理
- ✅ 对话会话管理API
- ✅ 工具调用API

**Phase 1需要预留的扩展点**:
- [ ] 数据库表预留Agent相关字段
- [ ] API设计考虑Agent调用场景
- [ ] 权限系统支持Agent权限

---

## 附录

### 附录A: Supabase资源链接

**官方文档**:
- Supabase官网: https://supabase.com/
- 快速入门: https://supabase.com/docs/guides/getting-started
- Auth指南: https://supabase.com/docs/guides/auth
- Storage指南: https://supabase.com/docs/guides/storage
- Realtime指南: https://supabase.com/docs/guides/realtime

**Go SDK**:
- supabase-go: https://github.com/supabase-community/supabase-go

---

### 附录B: 常见问题

**Q1: 为什么选择Supabase而不是自建PostgreSQL？**
A: Supabase提供开箱即用的Auth、Storage、Realtime等服务，大幅减少基础设施搭建时间，初期成本低，支持平滑扩展，且开源可自托管。

**Q2: Go后端的主要职责是什么？**
A: Go后端主要负责业务逻辑编排、第三方服务集成（LLM、支付等）、性能优化（缓存、批量处理）和安全增强（限流、审计）。

**Q3: WebSocket使用Supabase Realtime还是自建？**
A: Phase 1使用Supabase Realtime，足够满足需求。如果Phase 5移动端上线后连接数过大，再考虑自建。

**Q4: 数据库Schema如何迁移和版本管理？**
A: 使用Supabase Dashboard手动执行SQL或使用迁移工具（如golang-migrate），将所有SQL脚本保存在版本控制中。

**Q5: 如何处理跨域请求？**
A: Go后端配置CORS中间件，允许来自PC端、管理后台、移动端的跨域请求。

---

### 附录C: API接口清单

**认证相关**:
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/refresh` - 刷新Token
- `POST /api/v1/auth/logout` - 用户登出
- `POST /api/v1/auth/reset-password` - 重置密码

**用户相关**:
- `GET /api/v1/users/me` - 获取当前用户信息
- `PATCH /api/v1/users/me` - 更新用户信息
- `GET /api/v1/users/{user_id}/devices` - 获取用户设备列表
- `DELETE /api/v1/users/{user_id}/devices/{device_id}` - 删除设备

**工作流相关**:
- `POST /api/v1/workflows` - 创建工作流
- `GET /api/v1/workflows` - 获取工作流列表
- `GET /api/v1/workflows/{workflow_id}` - 获取工作流详情
- `PATCH /api/v1/workflows/{workflow_id}` - 更新工作流
- `DELETE /api/v1/workflows/{workflow_id}` - 删除工作流
- `GET /api/v1/workflows/{workflow_id}/export` - 导出工作流
- `POST /api/v1/workflows/import` - 导入工作流

**任务相关**:
- `POST /api/v1/tasks` - 创建任务
- `GET /api/v1/tasks` - 获取任务列表
- `GET /api/v1/tasks/{task_id}` - 获取任务详情
- `PATCH /api/v1/tasks/{task_id}/status` - 更新任务状态
- `PATCH /api/v1/tasks/{task_id}/result` - 上报任务结果
- `DELETE /api/v1/tasks/{task_id}` - 删除任务

**存储相关**:
- `POST /api/v1/storage/workflows/upload` - 上传工作流文件
- `GET /api/v1/storage/workflows/download` - 下载工作流文件
- `POST /api/v1/storage/screenshots/upload` - 上传截图
- `DELETE /api/v1/storage/{bucket}/{path}` - 删除文件

**日志相关**:
- `POST /api/v1/logs` - 批量上报日志
- `POST /api/v1/logs/error` - 上报错误日志
- `GET /api/v1/logs` - 查询日志

**管理相关（Phase 5）**:
- `GET /api/v1/admin/users` - 管理员获取用户列表
- `PATCH /api/v1/admin/users/{user_id}` - 管理员更新用户
- `GET /api/v1/admin/stats` - 获取统计数据

---

### 附录D: 环境变量配置

```bash
# 应用配置
APP_ENV=development # development | production
APP_PORT=8080

# Supabase配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# JWT配置
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=3600 # 秒

# Redis配置（可选）
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# 日志配置
LOG_LEVEL=info # debug | info | warn | error
LOG_FORMAT=json # json | text

# 限流配置
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=60

# CORS配置
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:1420

# 监控配置
SENTRY_DSN=
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
```

---

### 附录E: 数据库索引优化建议

**workflows表**:
```sql
-- 复合索引：用户+分类
CREATE INDEX idx_workflows_user_category ON public.workflows(user_id, category);

-- 复合索引：用户+发布状态
CREATE INDEX idx_workflows_user_published ON public.workflows(user_id, is_published);

-- 全文搜索索引（可选）
CREATE INDEX idx_workflows_name_trgm ON public.workflows USING gin(name gin_trgm_ops);
```

**tasks表**:
```sql
-- 复合索引：用户+状态
CREATE INDEX idx_tasks_user_status ON public.tasks(user_id, status);

-- 复合索引：工作流+创建时间
CREATE INDEX idx_tasks_workflow_created ON public.tasks(workflow_id, created_at DESC);
```

**logs表**:
```sql
-- 复合索引：用户+级别+时间
CREATE INDEX idx_logs_user_level_created ON public.logs(user_id, level, created_at DESC);

-- 分区表（可选，数据量大时）
-- 按月分区
CREATE TABLE public.logs_2025_11 PARTITION OF public.logs
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
```

---

### 附录F: 性能优化建议

**1. 数据库查询优化**:
- 使用预编译语句（prepared statements）
- 避免N+1查询问题
- 合理使用JOIN，避免过多关联
- 使用EXPLAIN ANALYZE分析慢查询

**2. 缓存策略**:
- 用户信息缓存（TTL: 5分钟）
- 工作流列表缓存（TTL: 1分钟）
- 频繁查询的计数缓存

**3. 连接池配置**:
```go
// PostgreSQL连接池
db, err := pgxpool.Connect(context.Background(), databaseURL)
config.MaxConns = 20
config.MinConns = 5
config.MaxConnLifetime = time.Hour
config.MaxConnIdleTime = 30 * time.Minute
```

**4. 批量操作**:
- 日志批量写入（每100条或每5秒）
- 任务状态批量更新
- 文件批量上传

**5. 异步处理**:
- 日志上报异步处理
- 文件上传异步处理
- 统计数据异步计算

---

### 附录G: 安全最佳实践

**1. 输入验证**:
```go
// 验证用户输入
func ValidateWorkflowInput(input *WorkflowInput) error {
    if len(input.Name) < 1 || len(input.Name) > 255 {
        return errors.New("工作流名称长度必须在1-255之间")
    }
    
    if !isValidJSON(input.Definition) {
        return errors.New("工作流定义必须是有效的JSON")
    }
    
    return nil
}
```

**2. SQL注入防护**:
```go
// 使用参数化查询
query := "SELECT * FROM workflows WHERE user_id = $1 AND name = $2"
rows, err := db.Query(ctx, query, userID, name)
```

**3. XSS防护**:
```go
import "html"

// 转义HTML
func SanitizeInput(input string) string {
    return html.EscapeString(input)
}
```

**4. CSRF防护**:
```go
// 使用CSRF Token
func CSRFMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("X-CSRF-Token")
        if !validateCSRFToken(token) {
            c.AbortWithStatus(403)
            return
        }
        c.Next()
    }
}
```

**5. 速率限制**:
```go
// 基于IP的速率限制
func RateLimitMiddleware(limit int) gin.HandlerFunc {
    limiter := rate.NewLimiter(rate.Limit(limit), limit)
    
    return func(c *gin.Context) {
        if !limiter.Allow() {
            c.AbortWithStatusJSON(429, gin.H{
                "error": "请求过于频繁"
            })
            return
        }
        c.Next()
    }
}
```

---

### 附录H: 测试策略

**1. 单元测试**:
```go
// 测试用户服务
func TestUserService_GetUser(t *testing.T) {
    mockRepo := &MockUserRepository{}
    service := NewUserService(mockRepo)
    
    user, err := service.GetUser(ctx, "user_id")
    
    assert.NoError(t, err)
    assert.NotNil(t, user)
}
```

**2. 集成测试**:
```go
// 测试API端点
func TestWorkflowAPI(t *testing.T) {
    router := setupRouter()
    
    w := httptest.NewRecorder()
    req, _ := http.NewRequest("GET", "/api/v1/workflows", nil)
    req.Header.Set("Authorization", "Bearer "+testToken)
    
    router.ServeHTTP(w, req)
    
    assert.Equal(t, 200, w.Code)
}
```

**3. 压力测试**:
```bash
# 使用ab工具进行压力测试
ab -n 10000 -c 100 http://localhost:8080/api/v1/workflows

# 使用wrk工具
wrk -t12 -c400 -d30s http://localhost:8080/api/v1/workflows
```

---

### 附录I: 部署配置

**1. Docker配置**:
```dockerfile
# Dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server

FROM alpine:latest
RUN apk --no-cache add ca-certificates

WORKDIR /root/
COPY --from=builder /app/server .

EXPOSE 8080
CMD ["./server"]
```

**2. Docker Compose**:
```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8080:8080"
    environment:
      - APP_ENV=production
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    restart: unless-stopped
    
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
```

**3. 健康检查**:
```go
// 健康检查端点
func HealthCheck(c *gin.Context) {
    // 检查数据库连接
    if err := db.Ping(context.Background()); err != nil {
        c.JSON(503, gin.H{
            "status": "unhealthy",
            "database": "disconnected"
        })
        return
    }
    
    c.JSON(200, gin.H{
        "status": "healthy",
        "database": "connected",
        "timestamp": time.Now().Unix()
    })
}
```

---

### 附录J: 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| V1.0 | 2025-11-08 | 初始版本 | 产品团队 |

---

**文档状态**: ✅ 完成  
**最后更新**: 2025-11-08

**下一步**: 
1. 查看 [Phase 1: 工作流系统 - PC端迭代计划](./pc-client.md)
2. 开始 Phase 2 的迭代计划编写