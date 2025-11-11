-- LLM 用量记录表

-- ============================================
-- 1. LLM 用量记录表
-- ============================================

CREATE TABLE IF NOT EXISTS public.llm_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  
  -- 模型信息
  model_id UUID REFERENCES public.llm_models(id) ON DELETE SET NULL,
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  
  -- Token 使用量
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  
  -- 费用
  cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  
  -- 请求信息
  request_duration_ms INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_llm_usage_user_id ON public.llm_usage(user_id);
CREATE INDEX idx_llm_usage_agent_id ON public.llm_usage(agent_id);
CREATE INDEX idx_llm_usage_model_id ON public.llm_usage(model_id);
CREATE INDEX idx_llm_usage_created_at ON public.llm_usage(created_at DESC);
-- 移除包含函数的索引，改用复合索引
CREATE INDEX idx_llm_usage_user_created ON public.llm_usage(user_id, created_at DESC);

-- ============================================
-- 2. 模型配置表（后端管理）
-- ============================================

CREATE TABLE IF NOT EXISTS public.model_configs (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  description TEXT,
  max_tokens INTEGER NOT NULL,
  price_per_1k_prompt_tokens DECIMAL(10, 6) NOT NULL,
  price_per_1k_completion_tokens DECIMAL(10, 6) NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_model_configs_updated_at
BEFORE UPDATE ON public.model_configs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入默认模型配置
INSERT INTO public.model_configs (id, name, provider, description, max_tokens, price_per_1k_prompt_tokens, price_per_1k_completion_tokens) VALUES
  ('gpt-4-turbo', 'GPT-4 Turbo', 'openai', '最新的 GPT-4 模型', 128000, 0.01, 0.03),
  ('gpt-3.5-turbo', 'GPT-3.5 Turbo', 'openai', '快速且经济的模型', 16385, 0.0005, 0.0015),
  ('claude-3-opus', 'Claude 3 Opus', 'claude', 'Anthropic 最强大的模型', 200000, 0.015, 0.075),
  ('claude-3-sonnet', 'Claude 3 Sonnet', 'claude', '平衡性能和成本', 200000, 0.003, 0.015)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. RLS 策略
-- ============================================

ALTER TABLE public.llm_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_configs ENABLE ROW LEVEL SECURITY;

-- llm_usage 策略
CREATE POLICY "Users can view own usage"
  ON public.llm_usage FOR SELECT
  USING (auth.uid() = user_id);

-- model_configs 策略（所有人可读）
CREATE POLICY "Anyone can view enabled models"
  ON public.model_configs FOR SELECT
  USING (is_enabled = TRUE);

-- ============================================
-- 4. 用量统计视图
-- ============================================

CREATE OR REPLACE VIEW public.user_monthly_usage AS
SELECT 
  user_id,
  DATE_TRUNC('month', created_at) AS month,
  SUM(total_tokens) AS total_tokens,
  SUM(cost) AS total_cost,
  COUNT(*) AS request_count
FROM public.llm_usage
GROUP BY user_id, DATE_TRUNC('month', created_at);

-- ============================================
-- 5. 配额检查函数
-- ============================================

CREATE OR REPLACE FUNCTION check_user_quota(p_user_id UUID)
RETURNS TABLE(
  has_quota BOOLEAN,
  used_tokens INTEGER,
  quota_tokens INTEGER,
  remaining_tokens INTEGER
) AS $$
DECLARE
  v_used_tokens INTEGER;
  v_quota_tokens INTEGER;
  v_membership_level VARCHAR(20);
BEGIN
  -- 获取用户会员等级
  SELECT membership_level INTO v_membership_level
  FROM public.user_profiles
  WHERE id = p_user_id;
  
  -- 根据会员等级设置配额
  CASE v_membership_level
    WHEN 'free' THEN v_quota_tokens := 100000;
    WHEN 'pro' THEN v_quota_tokens := 1000000;
    WHEN 'enterprise' THEN v_quota_tokens := 999999999;
    ELSE v_quota_tokens := 100000;
  END CASE;
  
  -- 获取本月已使用量
  SELECT COALESCE(SUM(total_tokens), 0) INTO v_used_tokens
  FROM public.llm_usage
  WHERE user_id = p_user_id
    AND created_at >= DATE_TRUNC('month', NOW());
  
  -- 返回结果
  RETURN QUERY SELECT 
    (v_used_tokens < v_quota_tokens) AS has_quota,
    v_used_tokens AS used_tokens,
    v_quota_tokens AS quota_tokens,
    (v_quota_tokens - v_used_tokens) AS remaining_tokens;
END;
$$ LANGUAGE plpgsql;
