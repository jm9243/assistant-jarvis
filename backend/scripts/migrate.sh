#!/bin/bash

# Supabase 数据库迁移脚本
# 需要 service_role key 才能执行 DDL 操作

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Supabase 数据库迁移 ===${NC}"

# 检查环境变量
if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}错误: SUPABASE_URL 未设置${NC}"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}错误: SUPABASE_SERVICE_ROLE_KEY 未设置${NC}"
    echo -e "${YELLOW}提示: 请在 Supabase Dashboard > Settings > API 中获取 service_role key${NC}"
    exit 1
fi

# 执行迁移
MIGRATION_FILE="$1"
if [ -z "$MIGRATION_FILE" ]; then
    echo -e "${RED}错误: 请指定迁移文件${NC}"
    echo "用法: $0 <migration_file>"
    exit 1
fi

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}错误: 迁移文件不存在: $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}执行迁移文件: $MIGRATION_FILE${NC}"

# 读取 SQL 文件内容
SQL_CONTENT=$(cat "$MIGRATION_FILE")

# 使用 Supabase REST API 执行 SQL
RESPONSE=$(curl -s -X POST \
    "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(echo "$SQL_CONTENT" | jq -Rs .)}")

# 检查响应
if echo "$RESPONSE" | grep -q "error"; then
    echo -e "${RED}迁移失败:${NC}"
    echo "$RESPONSE" | jq .
    exit 1
else
    echo -e "${GREEN}✓ 迁移成功完成${NC}"
fi
