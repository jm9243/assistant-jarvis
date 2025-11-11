#!/bin/bash

# 样式迁移脚本
# 自动替换常见的样式模式

echo "开始迁移样式..."

# 定义要处理的文件
FILES=(
  "src/pages/KnowledgeBase/KnowledgeBaseListPage.tsx"
  "src/pages/KnowledgeBase/KnowledgeBaseDetailPage.tsx"
  "src/pages/Tool/ToolStorePage.tsx"
  "src/pages/Agent/AgentFormPage.tsx"
  "src/pages/Agent/ChatPage.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "处理 $file..."
    
    # 备份原文件
    cp "$file" "$file.backup"
    
    # 替换常见模式
    sed -i '' 's/className="card"/className="jarvis-card"/g' "$file"
    sed -i '' 's/className="card-flat"/className="jarvis-section"/g' "$file"
    sed -i '' 's/className="btn-primary"/variant="primary"/g' "$file"
    sed -i '' 's/className="btn-secondary"/variant="secondary"/g' "$file"
    sed -i '' 's/className="btn-ghost"/variant="ghost"/g' "$file"
    
    echo "✓ $file 处理完成"
  else
    echo "✗ $file 不存在"
  fi
done

echo "迁移完成！请检查并测试修改后的文件。"
echo "原文件备份为 *.backup"
