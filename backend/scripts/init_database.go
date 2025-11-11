package main

import (
	"context"
	"fmt"
	"os"

	"github.com/assistant-jarvis/backend/internal/config"
	"github.com/assistant-jarvis/backend/internal/pkg/supabase"
	"github.com/joho/godotenv"
)

func main() {
	// 加载环境变量
	_ = godotenv.Load("../.env")
	
	if err := config.Load(); err != nil {
		panic(fmt.Sprintf("Failed to load config: %v", err))
	}

	fmt.Println("🔌 连接到 Supabase...")
	client, err := supabase.NewClient()
	if err != nil {
		panic(fmt.Sprintf("Failed to create Supabase client: %v", err))
	}

	fmt.Println("📄 读取迁移文件...")
	sqlContent, err := os.ReadFile("../migrations/001_init_schema.sql")
	if err != nil {
		panic(fmt.Sprintf("Failed to read migration file: %v", err))
	}

	fmt.Println("⚙️  执行数据库迁移...")
	
	// 使用原生客户端执行 SQL
	nativeClient := client.GetNativeClient()
	
	// 注意：supabase-go SDK 可能不支持直接执行 DDL
	// 需要使用 PostgreSQL 驱动直接连接
	fmt.Println("⚠️  警告: 需要使用 PostgreSQL 客户端直接执行迁移")
	fmt.Println("📝 SQL 内容:")
	fmt.Println(string(sqlContent))
	
	// 实际执行需要使用 pgx 或 database/sql
	ctx := context.Background()
	_ = ctx
	_ = nativeClient
	
	fmt.Println("\n💡 建议:")
	fmt.Println("1. 访问 Supabase Dashboard: https://supabase.com/dashboard")
	fmt.Println("2. 进入 SQL Editor")
	fmt.Println("3. 复制并执行 backend/migrations/001_init_schema.sql")
}
