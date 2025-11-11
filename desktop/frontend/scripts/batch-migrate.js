#!/usr/bin/env node

/**
 * 批量迁移样式脚本
 * 自动替换常见的样式模式
 */

const fs = require('fs');
const path = require('path');

// 替换规则
const replacements = [
  // 标签样式
  {
    from: /className="block text-sm font-medium text-gray-700 mb-2"/g,
    to: 'className="jarvis-label"'
  },
  // 输入框样式
  {
    from: /className="([^"]*?)w-full px-4 py-2 border border-gray-300 rounded-lg([^"]*?)"/g,
    to: 'className="jarvis-input"'
  },
  {
    from: /className="([^"]*?)input([^"]*?)"/g,
    to: 'className="jarvis-input"'
  },
  // 卡片样式
  {
    from: /className="bg-white rounded-lg shadow-sm([^"]*?)"/g,
    to: 'className="jarvis-card"'
  },
  {
    from: /className="card"/g,
    to: 'className="jarvis-card"'
  },
  {
    from: /className="card-flat"/g,
    to: 'className="jarvis-section"'
  },
  // 按钮样式 - 需要手动处理，这里只是标记
  {
    from: /className="([^"]*?)bg-blue-600([^"]*?)"/g,
    to: '/* TODO: Replace with <Button variant="primary"> */'
  },
  // 文本颜色
  {
    from: /text-gray-900/g,
    to: 'text-jarvis-text'
  },
  {
    from: /text-gray-600/g,
    to: 'text-jarvis-text-secondary'
  },
  {
    from: /text-gray-500/g,
    to: 'text-jarvis-text-secondary'
  },
  // 背景颜色
  {
    from: /bg-white/g,
    to: 'bg-jarvis-panel'
  },
  {
    from: /bg-gray-50/g,
    to: 'bg-jarvis-panel/30'
  },
  {
    from: /bg-gray-100/g,
    to: 'bg-jarvis-panel'
  },
  // 边框颜色
  {
    from: /border-gray-200/g,
    to: 'border-white/10'
  },
  {
    from: /border-gray-300/g,
    to: 'border-white/10'
  },
];

// 要处理的文件
const files = [
  'src/pages/Agent/AgentFormPage.tsx',
  'src/pages/Agent/ChatPage.tsx',
  'src/pages/KnowledgeBase/KnowledgeBaseListPage.tsx',
  'src/pages/KnowledgeBase/KnowledgeBaseDetailPage.tsx',
];

console.log('开始批量迁移样式...\n');

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`✗ ${file} 不存在，跳过`);
    return;
  }

  console.log(`处理 ${file}...`);
  
  // 读取文件
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 备份原文件
  fs.writeFileSync(`${filePath}.backup`, content);
  
  // 应用所有替换规则
  let changeCount = 0;
  replacements.forEach(rule => {
    const matches = content.match(rule.from);
    if (matches) {
      changeCount += matches.length;
      content = content.replace(rule.from, rule.to);
    }
  });
  
  // 写回文件
  fs.writeFileSync(filePath, content);
  
  console.log(`✓ ${file} 完成 (${changeCount} 处修改)\n`);
});

console.log('迁移完成！');
console.log('原文件已备份为 *.backup');
console.log('\n注意：');
console.log('1. 请手动检查并测试修改后的文件');
console.log('2. 按钮需要手动替换为 <Button> 组件');
console.log('3. 复杂的样式可能需要手动调整');
