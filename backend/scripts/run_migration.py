#!/usr/bin/env python3
"""
Supabase 数据库迁移脚本
使用 psycopg2 直接连接到 PostgreSQL 数据库执行迁移
"""

import os
import sys
import psycopg2
from urllib.parse import urlparse

def get_db_connection_string():
    """从 Supabase URL 构建 PostgreSQL 连接字符串"""
    supabase_url = os.getenv('SUPABASE_URL')
    if not supabase_url:
        print("❌ 错误: SUPABASE_URL 环境变量未设置")
        sys.exit(1)
    
    # 从 Supabase URL 提取项目 ID
    # 格式: https://xxx.supabase.co
    parsed = urlparse(supabase_url)
    project_id = parsed.hostname.split('.')[0]
    
    # Supabase PostgreSQL 连接信息
    # 格式: postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
    db_password = os.getenv('SUPABASE_DB_PASSWORD')
    if not db_password:
        print("❌ 错误: SUPABASE_DB_PASSWORD 环境变量未设置")
        print("💡 提示: 在 Supabase Dashboard > Settings > Database 中查看数据库密码")
        sys.exit(1)
    
    return f"postgresql://postgres:{db_password}@db.{project_id}.supabase.co:5432/postgres"

def run_migration(migration_file):
    """执行迁移文件"""
    if not os.path.exists(migration_file):
        print(f"❌ 错误: 迁移文件不存在: {migration_file}")
        sys.exit(1)
    
    print(f"📄 读取迁移文件: {migration_file}")
    with open(migration_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    print("🔌 连接到 Supabase PostgreSQL...")
    conn_string = get_db_connection_string()
    
    try:
        conn = psycopg2.connect(conn_string)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("⚙️  执行迁移...")
        cursor.execute(sql_content)
        
        print("✅ 迁移成功完成!")
        
        cursor.close()
        conn.close()
        
    except psycopg2.Error as e:
        print(f"❌ 迁移失败: {e}")
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("用法: python run_migration.py <migration_file>")
        sys.exit(1)
    
    migration_file = sys.argv[1]
    run_migration(migration_file)
