# Agent模板功能说明

## 概述

Agent模板功能允许用户快速创建预配置的Agent，并支持保存自定义配置为模板供后续使用。

## 功能特性

### 1. 系统预设模板

系统提供5个预设模板：

- **智能客服助手** (customer_service)
  - 类型: Basic
  - 适用场景: 客户服务、咨询解答
  - 特点: 耐心、专业、友好

- **数据分析专家** (analysis)
  - 类型: ReAct
  - 适用场景: 数据分析、统计建模
  - 特点: 专业分析、工具调用

- **内容创作助手** (creation)
  - 类型: Basic
  - 适用场景: 文章撰写、文案创作
  - 特点: 创意性强、表达流畅

- **技术支持专家** (technical_support)
  - 类型: ReAct
  - 适用场景: 技术问题诊断、故障排查
  - 特点: 技术专业、解决方案导向

- **深度研究助手** (research)
  - 类型: Deep Research
  - 适用场景: 深度研究、信息收集
  - 特点: 系统性研究、多角度分析

### 2. 用户自定义模板

用户可以将自己配置的Agent保存为模板：

- 保存当前Agent配置
- 设置模板名称和描述
- 选择分类
- 选择是否公开（公开后其他用户可使用）

### 3. 模板使用

- 浏览模板库
- 按分类筛选
- 搜索模板
- 预览模板配置
- 一键应用模板

## 数据库设计

### agent_templates 表

```sql
CREATE TABLE public.agent_templates (
  id UUID PRIMARY KEY,
  user_id UUID,                    -- NULL表示系统模板
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,   -- 分类
  type VARCHAR(50) NOT NULL,       -- Agent类型
  tags TEXT[],                     -- 标签
  icon VARCHAR(255),               -- 图标
  is_system BOOLEAN DEFAULT FALSE, -- 是否系统模板
  is_public BOOLEAN DEFAULT FALSE, -- 是否公开
  config JSONB NOT NULL,           -- 配置信息
  usage_count INTEGER DEFAULT 0,   -- 使用次数
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 配置结构 (config字段)

```json
{
  "system_prompt": "系统提示词",
  "llm_config": {
    "provider": "openai",
    "model": "gpt-4",
    "temperature": 0.7,
    "max_tokens": 2000
  },
  "memory_config": {
    "short_term": {
      "enabled": true,
      "window_size": 10
    },
    "long_term": {
      "enabled": true,
      "retention_days": 90
    }
  },
  "react_config": {
    "max_iterations": 5
  },
  "research_config": {
    "complexity_threshold": 0.7,
    "max_subtasks": 5
  }
}
```

## API接口

### 1. 获取模板列表

```
GET /api/v1/agent-templates
```

查询参数：
- `category`: 分类筛选
- `type`: Agent类型筛选
- `tags`: 标签筛选
- `search`: 搜索关键词
- `is_system`: 是否系统模板
- `is_public`: 是否公开模板
- `page`: 页码
- `page_size`: 每页数量

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [...],
    "total": 10
  }
}
```

### 2. 获取模板详情

```
GET /api/v1/agent-templates/:id
```

### 3. 创建模板

```
POST /api/v1/agent-templates
```

请求体：
```json
{
  "name": "模板名称",
  "description": "模板描述",
  "category": "customer_service",
  "type": "basic",
  "tags": ["客服", "服务"],
  "icon": "🤖",
  "is_public": false,
  "config": {...}
}
```

### 4. 更新模板

```
PUT /api/v1/agent-templates/:id
```

### 5. 删除模板

```
DELETE /api/v1/agent-templates/:id
```

### 6. 使用模板

```
POST /api/v1/agent-templates/:id/use
```

增加模板的使用次数统计。

## 前端实现

### 组件结构

```
components/agent/
  ├── TemplateSelector.tsx      # 模板选择器
  └── ...

pages/Agent/
  └── AgentFormPage.tsx         # Agent创建页面（集成模板功能）
```

### 使用流程

1. **从模板创建Agent**
   - 点击"从模板创建"按钮
   - 浏览模板库
   - 选择模板
   - 自动填充配置
   - 可修改配置
   - 保存Agent

2. **保存为模板**
   - 配置Agent
   - 点击"保存为模板"
   - 填写模板信息
   - 选择是否公开
   - 保存模板

## 权限控制

### RLS策略

- 所有用户可以查看系统模板和公开模板
- 用户只能查看自己创建的私有模板
- 用户只能修改和删除自己创建的模板
- 系统模板不允许修改和删除

## 部署说明

### 1. 运行数据库迁移

```bash
cd backend
psql -h <host> -U <user> -d <database> -f migrations/003_agent_templates.sql
```

### 2. 重启后端服务

```bash
cd backend
make run
```

### 3. 前端无需额外配置

前端代码已集成，重新构建即可使用。

## 使用示例

### 示例1: 创建客服Agent

1. 进入Agent创建页面
2. 点击"从模板创建"
3. 选择"智能客服助手"模板
4. 修改名称为"我的客服助手"
5. 配置API密钥
6. 保存Agent

### 示例2: 保存自定义模板

1. 配置一个专业的技术文档写作Agent
2. 点击"保存为模板"
3. 填写模板信息：
   - 名称: "技术文档写作助手"
   - 描述: "专门用于撰写技术文档"
   - 分类: creation
   - 公开: 是
4. 保存模板

## 注意事项

1. **API密钥不会保存到模板中**
   - 模板只保存配置结构
   - 用户需要自己配置API密钥

2. **系统模板不可修改**
   - 系统预设的5个模板是只读的
   - 用户可以基于系统模板创建自己的模板

3. **公开模板的影响**
   - 公开后其他用户可以看到和使用
   - 但不能修改原模板
   - 其他用户可以基于公开模板创建自己的版本

4. **使用次数统计**
   - 每次使用模板会增加usage_count
   - 用于展示热门模板

## 未来扩展

1. **模板市场**
   - 用户可以分享和下载模板
   - 模板评分和评论
   - 热门模板推荐

2. **模板版本管理**
   - 支持模板版本控制
   - 可以回退到历史版本

3. **模板导入导出**
   - 支持JSON格式导出
   - 支持从文件导入模板

4. **模板分类优化**
   - 更细粒度的分类
   - 支持自定义分类
   - 标签系统增强
