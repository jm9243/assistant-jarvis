-- Agent Templates Schema
-- Version: 1.0
-- Date: 2025-11-10

-- ========================================
-- Agent模板表
-- ========================================

-- Agent模板表
CREATE TABLE public.agent_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL,
  tags TEXT[],
  icon VARCHAR(255),
  is_system BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  config JSONB NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_agent_templates_user_id ON public.agent_templates(user_id);
CREATE INDEX idx_agent_templates_category ON public.agent_templates(category);
CREATE INDEX idx_agent_templates_type ON public.agent_templates(type);
CREATE INDEX idx_agent_templates_tags ON public.agent_templates USING GIN(tags);
CREATE INDEX idx_agent_templates_is_system ON public.agent_templates(is_system);
CREATE INDEX idx_agent_templates_is_public ON public.agent_templates(is_public);

-- 更新时间触发器
CREATE TRIGGER update_agent_templates_updated_at
BEFORE UPDATE ON public.agent_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- RLS 策略
-- ========================================

ALTER TABLE public.agent_templates ENABLE ROW LEVEL SECURITY;

-- 用户可以查看系统模板、公开模板和自己的模板
CREATE POLICY "Users can view accessible templates"
  ON public.agent_templates FOR SELECT
  USING (
    is_system = TRUE OR
    is_public = TRUE OR
    auth.uid() = user_id
  );

-- 用户可以创建自己的模板
CREATE POLICY "Users can insert own templates"
  ON public.agent_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的模板
CREATE POLICY "Users can update own templates"
  ON public.agent_templates FOR UPDATE
  USING (auth.uid() = user_id);

-- 用户只能删除自己的模板
CREATE POLICY "Users can delete own templates"
  ON public.agent_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- 初始化系统模板
-- ========================================

INSERT INTO public.agent_templates (name, description, category, type, tags, icon, is_system, is_public, config) VALUES
(
  '智能客服助手',
  '专业的客户服务Agent，能够理解客户问题并提供准确的解答',
  'customer_service',
  'basic',
  ARRAY['客服', '服务', '咨询'],
  '🤖',
  TRUE,
  TRUE,
  '{
    "system_prompt": "你是一个专业的客服助手。你的职责是：\n1. 耐心倾听客户的问题和需求\n2. 提供准确、清晰的解答\n3. 保持礼貌和专业的态度\n4. 如果无法解决问题，及时转接人工客服\n\n请始终保持友好、专业的服务态度。",
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
    }
  }'::jsonb
),
(
  '数据分析专家',
  '擅长数据分析和可视化，能够从数据中提取有价值的洞察',
  'analysis',
  'react',
  ARRAY['数据分析', '统计', '可视化'],
  '📊',
  TRUE,
  TRUE,
  '{
    "system_prompt": "你是一个数据分析专家。你的能力包括：\n1. 数据清洗和预处理\n2. 统计分析和建模\n3. 数据可视化\n4. 洞察提取和报告生成\n\n请使用专业的分析方法，提供清晰的数据洞察。",
    "llm_config": {
      "provider": "openai",
      "model": "gpt-4",
      "temperature": 0.3,
      "max_tokens": 3000
    },
    "react_config": {
      "max_iterations": 5
    },
    "memory_config": {
      "short_term": {
        "enabled": true,
        "window_size": 15
      },
      "working": {
        "enabled": true
      }
    }
  }'::jsonb
),
(
  '内容创作助手',
  '专业的内容创作Agent，擅长撰写各类文章、文案和创意内容',
  'creation',
  'basic',
  ARRAY['写作', '创作', '文案'],
  '✍️',
  TRUE,
  TRUE,
  '{
    "system_prompt": "你是一个专业的内容创作助手。你擅长：\n1. 撰写各类文章（新闻、博客、技术文档等）\n2. 创作营销文案和广告语\n3. 生成创意内容和故事\n4. 优化和润色文本\n\n请根据用户需求，创作高质量、有吸引力的内容。",
    "llm_config": {
      "provider": "openai",
      "model": "gpt-4",
      "temperature": 0.8,
      "max_tokens": 4000
    },
    "memory_config": {
      "short_term": {
        "enabled": true,
        "window_size": 8
      }
    }
  }'::jsonb
),
(
  '技术支持专家',
  '专业的技术支持Agent，能够诊断和解决各类技术问题',
  'technical_support',
  'react',
  ARRAY['技术支持', '故障排查', 'IT'],
  '🔧',
  TRUE,
  TRUE,
  '{
    "system_prompt": "你是一个技术支持专家。你的职责是：\n1. 诊断技术问题\n2. 提供解决方案和操作步骤\n3. 解释技术概念\n4. 预防性维护建议\n\n请提供清晰、可操作的技术指导。",
    "llm_config": {
      "provider": "openai",
      "model": "gpt-4",
      "temperature": 0.5,
      "max_tokens": 2500
    },
    "react_config": {
      "max_iterations": 7
    },
    "memory_config": {
      "short_term": {
        "enabled": true,
        "window_size": 12
      },
      "working": {
        "enabled": true
      }
    }
  }'::jsonb
),
(
  '深度研究助手',
  '专业的研究Agent，能够进行深入的信息收集、分析和报告生成',
  'research',
  'deep_research',
  ARRAY['研究', '分析', '报告'],
  '🔍',
  TRUE,
  TRUE,
  '{
    "system_prompt": "你是一个深度研究助手。你的能力包括：\n1. 系统性的信息收集\n2. 多角度的深入分析\n3. 综合性的研究报告\n4. 引用来源和事实核查\n\n请进行全面、深入的研究，提供高质量的研究成果。",
    "llm_config": {
      "provider": "openai",
      "model": "gpt-4",
      "temperature": 0.4,
      "max_tokens": 4000
    },
    "research_config": {
      "complexity_threshold": 0.7,
      "max_subtasks": 5
    },
    "memory_config": {
      "short_term": {
        "enabled": true,
        "window_size": 20
      },
      "long_term": {
        "enabled": true,
        "retention_days": 180
      },
      "working": {
        "enabled": true
      }
    }
  }'::jsonb
);
