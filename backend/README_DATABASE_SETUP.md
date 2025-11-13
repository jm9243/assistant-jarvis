# 数据库设置说明

## 重要提示

本项目使用 Supabase REST API 进行数据库操作，**不需要直接的 PostgreSQL 连接**。

## 需要执行的 SQL 迁移

为了支持用量统计的聚合查询，需要在 Supabase Dashboard 中执行以下 SQL 函数：

1. 登录 Supabase Dashboard
2. 进入你的项目
3. 点击左侧菜单的 "SQL Editor"
4. 执行 `migrations/create_usage_stats_functions.sql` 文件中的 SQL

这些函数包括：
- `get_user_usage_stats()` - 获取用户用量统计
- `get_model_usage_stats()` - 获取模型用量统计
- `get_user_usage_by_model()` - 获取用户按模型分组的用量
- `get_top_users()` - 获取用量最高的用户

## 当前实现状态

- ✅ LLM 模型管理：使用 Supabase REST API
- ✅ 用量记录创建：使用 Supabase REST API
- ⚠️ 用量统计查询：需要执行 SQL 迁移后通过 RPC 调用数据库函数

## 如果不需要用量统计功能

如果暂时不需要用量统计功能，项目可以正常运行，只是以下 API 端点会返回空数据：
- `GET /api/v1/quota/usage/monthly`
- `GET /api/v1/quota/usage/daily`
- `GET /api/v1/llm/usage`

## 配置要求

`.env` 文件中只需要配置：
```
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key
```

**不需要** `DATABASE_URL` 配置。
