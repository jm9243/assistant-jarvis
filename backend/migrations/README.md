# 数据库迁移脚本

本目录包含 Assistant-Jarvis 项目的数据库迁移脚本。

## 执行顺序

按照以下顺序执行迁移脚本：

1. `001_init_schema.sql` - 初始化数据库 Schema
2. `002_storage_buckets.sql` - 初始化 Storage Buckets

## 执行方式

### 方式 1: Supabase Dashboard（推荐）

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 创建新查询
5. 复制脚本内容并执行

### 方式 2: Supabase CLI

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 连接到项目
supabase link --project-ref your-project-ref

# 执行迁移
supabase db reset
```

### 方式 3: psql 命令行

```bash
# 连接到数据库
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# 执行脚本
\i 001_init_schema.sql
\i 002_storage_buckets.sql
```

## 迁移脚本说明

### 001_init_schema.sql

创建以下内容：

- **枚举类型**: task_status, task_priority, log_level, log_category
- **表结构**:
  - `user_profiles` - 用户扩展信息
  - `devices` - 设备管理
  - `workflows` - 工作流定义
  - `tasks` - 任务执行记录
  - `logs` - 日志记录
- **索引**: 为常用查询字段创建索引
- **触发器**: 自动更新 `updated_at` 字段
- **RLS 策略**: 行级安全策略，确保数据隔离
- **函数**: `delete_old_logs()` - 清理30天前的日志

### 002_storage_buckets.sql

创建以下 Storage Buckets 和策略：

- `workflows` - 工作流文件（私有）
- `screenshots` - 截图文件（私有）
- `avatars` - 用户头像（公开）
- `icons` - 应用图标（公开）

## 验证迁移

执行完迁移后，验证以下内容：

```sql
-- 检查表是否创建成功
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 检查 RLS 是否启用
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- 检查索引
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public';

-- 检查存储桶
SELECT * FROM storage.buckets;
```

## 回滚

如果需要回滚迁移：

```sql
-- 删除所有表
DROP TABLE IF EXISTS public.logs CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.workflows CASCADE;
DROP TABLE IF EXISTS public.devices CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 删除枚举类型
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS task_priority CASCADE;
DROP TYPE IF EXISTS log_level CASCADE;
DROP TYPE IF EXISTS log_category CASCADE;

-- 删除函数
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS delete_old_logs() CASCADE;

-- 删除存储桶（谨慎操作！）
DELETE FROM storage.buckets WHERE id IN ('workflows', 'screenshots', 'avatars', 'icons');
```

## 注意事项

1. **备份数据**: 执行迁移前请确保备份数据库
2. **环境隔离**: 建议先在开发环境测试，然后再应用到生产环境
3. **RLS 策略**: 确保 RLS 策略正确，避免数据泄露
4. **Storage 策略**: Storage Buckets 的策略可能需要在 Dashboard 中手动配置
5. **定时任务**: 日志清理函数需要配置定时任务（使用 pg_cron 或外部 cron）

## 后续迁移

新的迁移脚本应遵循以下命名规范：

```
<序号>_<描述>.sql
```

例如：
- `003_add_agent_tables.sql`
- `004_add_payment_tables.sql`

## 相关文档

- [Supabase 数据库文档](https://supabase.com/docs/guides/database)
- [PostgreSQL RLS 文档](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Storage 文档](https://supabase.com/docs/guides/storage)

