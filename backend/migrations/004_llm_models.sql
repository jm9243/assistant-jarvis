-- 004_llm_models.sql
-- LLM 模型配置表

-- 创建模型配置表
CREATE TABLE IF NOT EXISTS llm_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,                    -- 模型名称，如 "GPT-4 Turbo"
    model_id VARCHAR(255) NOT NULL,                -- 模型ID，如 "gpt-4-turbo"
    provider VARCHAR(50) NOT NULL,                 -- 提供商：openai, claude 等
    type VARCHAR(50) NOT NULL,                     -- 类型：生文、生图、单图生视频、多图生视频、生音频、生音乐
    description TEXT,                              -- 介绍
    status VARCHAR(20) NOT NULL DEFAULT 'enabled', -- 状态：enabled(启用), disabled(有效), inactive(无效)
    
    -- API 配置
    base_url TEXT NOT NULL,                        -- API 地址
    auth_type VARCHAR(20) NOT NULL DEFAULT 'api_key', -- 认证方式：api_key, api_secret
    
    -- 密钥使用方式：single(单个), rotation(轮询)
    key_usage_mode VARCHAR(20) NOT NULL DEFAULT 'single',
    
    -- API 密钥（加密存储）
    api_keys JSONB NOT NULL DEFAULT '[]',          -- 存储多个密钥，格式：[{"key": "sk-xxx", "status": "enabled"}]
    
    -- 模型参数
    supports_vision BOOLEAN DEFAULT FALSE,         -- 是否支持视觉
    max_tokens INTEGER,                            -- 最大 token 数
    context_window INTEGER,                        -- 上下文窗口大小
    
    -- 定价信息（每百万 token）
    price_per_million_input DECIMAL(10, 6),        -- 输入价格
    price_per_million_output DECIMAL(10, 6),       -- 输出价格
    
    -- 限流配置
    rate_limit_rpm INTEGER,                        -- 每分钟请求数限制
    rate_limit_tpm INTEGER,                        -- 每分钟 token 数限制
    
    -- 平台信息
    platform_id VARCHAR(255),                      -- 模型平台的ID
    
    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,                               -- 创建者
    
    UNIQUE(provider, model_id)
);

-- 创建索引
CREATE INDEX idx_llm_models_provider ON llm_models(provider);
CREATE INDEX idx_llm_models_status ON llm_models(status);
CREATE INDEX idx_llm_models_type ON llm_models(type);

-- 添加注释
COMMENT ON TABLE llm_models IS 'LLM 模型配置表';
COMMENT ON COLUMN llm_models.name IS '模型显示名称';
COMMENT ON COLUMN llm_models.model_id IS '模型ID，用于API调用';
COMMENT ON COLUMN llm_models.provider IS '提供商：openai, claude, custom等';
COMMENT ON COLUMN llm_models.type IS '模型类型：生文、生图、单图生视频、多图生视频、生音频、生音乐';
COMMENT ON COLUMN llm_models.status IS '状态：enabled(启用), disabled(有效), inactive(无效)';
COMMENT ON COLUMN llm_models.auth_type IS '认证方式：api_key, api_secret';
COMMENT ON COLUMN llm_models.key_usage_mode IS '密钥使用方式：single(单个), rotation(轮询)';
COMMENT ON COLUMN llm_models.api_keys IS 'API密钥数组，支持多个密钥轮询';

-- 插入默认模型配置（示例）
INSERT INTO llm_models (name, model_id, provider, type, description, base_url, auth_type, key_usage_mode, api_keys, supports_vision, max_tokens, context_window)
VALUES 
    ('GPT-4 Turbo', 'gpt-4-turbo', 'openai', '生文', '最新的 GPT-4 模型，支持视觉输入', 'https://api.openai.com/v1', 'api_key', 'single', '[]', TRUE, 4096, 128000),
    ('GPT-3.5 Turbo', 'gpt-3.5-turbo', 'openai', '生文', '快速且经济的模型', 'https://api.openai.com/v1', 'api_key', 'single', '[]', FALSE, 4096, 16385),
    ('Claude 3 Opus', 'claude-3-opus-20240229', 'claude', '生文', 'Anthropic 最强大的模型', 'https://api.anthropic.com', 'api_key', 'single', '[]', TRUE, 4096, 200000),
    ('Claude 3 Sonnet', 'claude-3-sonnet-20240229', 'claude', '生文', '平衡性能和成本', 'https://api.anthropic.com', 'api_key', 'single', '[]', TRUE, 4096, 200000);
