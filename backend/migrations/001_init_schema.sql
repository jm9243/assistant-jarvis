-- Assistant-Jarvis Phase 1 Database Schema
-- Version: 1.0
-- Date: 2025-11-08

-- ========================================
-- 1. 扩展和函数
-- ========================================

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 2. 枚举类型
-- ========================================

-- 任务状态枚举
CREATE TYPE task_status AS ENUM ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled');

-- 任务优先级枚举
CREATE TYPE task_priority AS ENUM ('high', 'medium', 'low');

-- 日志级别枚举
CREATE TYPE log_level AS ENUM ('debug', 'info', 'warn', 'error');

-- 日志分类枚举
CREATE TYPE log_category AS ENUM ('system', 'task', 'message', 'error');

-- ========================================
-- 3. 用户相关表
-- ========================================

-- 用户扩展信息表
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

-- 用户表更新时间触发器
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 设备管理表
CREATE TABLE public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  os_type VARCHAR(50),
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

-- ========================================
-- 4. 工作流相关表
-- ========================================

-- 工作流表
CREATE TABLE public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  tags TEXT[],
  icon VARCHAR(255),
  version VARCHAR(20) DEFAULT '1.0.0',
  os_requirements TEXT[],
  target_apps JSONB,
  parameters JSONB,
  definition JSONB NOT NULL,
  triggers JSONB,
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
CREATE INDEX idx_workflows_user_category ON public.workflows(user_id, category);
CREATE INDEX idx_workflows_user_published ON public.workflows(user_id, is_published);

CREATE TRIGGER update_workflows_updated_at
BEFORE UPDATE ON public.workflows
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 5. 任务相关表
-- ========================================

-- 任务执行记录表
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id VARCHAR(255),
  status task_status DEFAULT 'pending',
  priority task_priority DEFAULT 'medium',
  parameters JSONB,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tasks_workflow_id ON public.tasks(workflow_id);
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_created_at ON public.tasks(created_at DESC);
CREATE INDEX idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX idx_tasks_workflow_created ON public.tasks(workflow_id, created_at DESC);

-- ========================================
-- 6. 日志相关表
-- ========================================

-- 日志记录表
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
CREATE INDEX idx_logs_user_level_created ON public.logs(user_id, level, created_at DESC);

-- 日志清理函数（保留30天）
CREATE OR REPLACE FUNCTION delete_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.logs
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. Row Level Security (RLS) 策略
-- ========================================

-- 启用 RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- user_profiles 策略
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- workflows 策略
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

-- tasks 策略
CREATE POLICY "Users can view own tasks"
  ON public.tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id);

-- logs 策略
CREATE POLICY "Users can view own logs"
  ON public.logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
  ON public.logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- devices 策略
CREATE POLICY "Users can view own devices"
  ON public.devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own devices"
  ON public.devices FOR ALL
  USING (auth.uid() = user_id);

-- ========================================
-- 8. Storage Buckets 和策略（通过 Supabase Dashboard 配置）
-- ========================================

-- 以下 SQL 在 Supabase Storage 部分执行

-- 创建存储桶
-- INSERT INTO storage.buckets (id, name, public) VALUES
--   ('workflows', 'workflows', false),
--   ('screenshots', 'screenshots', false),
--   ('avatars', 'avatars', true),
--   ('icons', 'icons', true);

-- workflows 存储桶策略
-- CREATE POLICY "Users can upload own workflow files"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'workflows' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "Users can read own workflow files"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'workflows' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- screenshots 存储桶策略
-- CREATE POLICY "Users can upload own screenshots"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'screenshots' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "Users can read own screenshots"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'screenshots' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- avatars 存储桶策略
-- CREATE POLICY "Anyone can read avatars"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'avatars');

-- CREATE POLICY "Users can upload own avatar"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'avatars' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- icons 存储桶策略
-- CREATE POLICY "Anyone can read icons"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'icons');

-- ========================================
-- 9. 初始化数据（可选）
-- ========================================

-- 可以在此处添加初始化数据，如默认分类等

-- ========================================
-- 完成
-- ========================================

