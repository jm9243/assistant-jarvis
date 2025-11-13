-- 创建用户用量统计函数
CREATE OR REPLACE FUNCTION get_user_usage_stats(
    p_user_id TEXT,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
)
RETURNS TABLE (
    user_id TEXT,
    total_tokens BIGINT,
    prompt_tokens BIGINT,
    completion_tokens BIGINT,
    total_cost NUMERIC,
    request_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p_user_id,
        COALESCE(SUM(lu.total_tokens), 0)::BIGINT,
        COALESCE(SUM(lu.prompt_tokens), 0)::BIGINT,
        COALESCE(SUM(lu.completion_tokens), 0)::BIGINT,
        COALESCE(SUM(lu.cost), 0)::NUMERIC,
        COUNT(*)::BIGINT
    FROM llm_usage lu
    WHERE lu.user_id = p_user_id
        AND lu.created_at >= p_start_time
        AND lu.created_at < p_end_time;
END;
$$ LANGUAGE plpgsql;

-- 创建模型用量统计函数
CREATE OR REPLACE FUNCTION get_model_usage_stats(
    p_model_id TEXT,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
)
RETURNS TABLE (
    model_id TEXT,
    provider TEXT,
    model TEXT,
    total_tokens BIGINT,
    prompt_tokens BIGINT,
    completion_tokens BIGINT,
    total_cost NUMERIC,
    request_count BIGINT,
    unique_users BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p_model_id,
        MAX(lu.provider),
        MAX(lu.model),
        COALESCE(SUM(lu.total_tokens), 0)::BIGINT,
        COALESCE(SUM(lu.prompt_tokens), 0)::BIGINT,
        COALESCE(SUM(lu.completion_tokens), 0)::BIGINT,
        COALESCE(SUM(lu.cost), 0)::NUMERIC,
        COUNT(*)::BIGINT,
        COUNT(DISTINCT lu.user_id)::BIGINT
    FROM llm_usage lu
    WHERE lu.model_id = p_model_id
        AND lu.created_at >= p_start_time
        AND lu.created_at < p_end_time;
END;
$$ LANGUAGE plpgsql;

-- 创建用户按模型分组的用量统计函数
CREATE OR REPLACE FUNCTION get_user_usage_by_model(
    p_user_id TEXT,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
)
RETURNS TABLE (
    model_id TEXT,
    provider TEXT,
    model TEXT,
    total_tokens BIGINT,
    prompt_tokens BIGINT,
    completion_tokens BIGINT,
    total_cost NUMERIC,
    request_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lu.model_id,
        lu.provider,
        lu.model,
        COALESCE(SUM(lu.total_tokens), 0)::BIGINT,
        COALESCE(SUM(lu.prompt_tokens), 0)::BIGINT,
        COALESCE(SUM(lu.completion_tokens), 0)::BIGINT,
        COALESCE(SUM(lu.cost), 0)::NUMERIC,
        COUNT(*)::BIGINT
    FROM llm_usage lu
    WHERE lu.user_id = p_user_id
        AND lu.created_at >= p_start_time
        AND lu.created_at < p_end_time
    GROUP BY lu.model_id, lu.provider, lu.model
    ORDER BY SUM(lu.total_tokens) DESC;
END;
$$ LANGUAGE plpgsql;

-- 创建获取用量最高用户的函数
CREATE OR REPLACE FUNCTION get_top_users(
    p_limit INT,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
)
RETURNS TABLE (
    user_id TEXT,
    total_tokens BIGINT,
    prompt_tokens BIGINT,
    completion_tokens BIGINT,
    total_cost NUMERIC,
    request_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lu.user_id,
        COALESCE(SUM(lu.total_tokens), 0)::BIGINT,
        COALESCE(SUM(lu.prompt_tokens), 0)::BIGINT,
        COALESCE(SUM(lu.completion_tokens), 0)::BIGINT,
        COALESCE(SUM(lu.cost), 0)::NUMERIC,
        COUNT(*)::BIGINT
    FROM llm_usage lu
    WHERE lu.created_at >= p_start_time
        AND lu.created_at < p_end_time
    GROUP BY lu.user_id
    ORDER BY SUM(lu.total_tokens) DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
