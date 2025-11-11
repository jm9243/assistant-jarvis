/**
 * API配置
 * 区分云服务后台和Python引擎后台
 */

// 云服务后台（Go）- 用户管理、Agent模板、认证等
export const CLOUD_API_BASE_URL = (import.meta as any).env?.VITE_CLOUD_API_URL || 'http://localhost:8080';
export const CLOUD_API_PREFIX = '/api/v1';

// Python引擎后台（FastAPI）- 本地执行、工作流、Agent对话等
export const ENGINE_API_BASE_URL = (import.meta as any).env?.VITE_ENGINE_API_URL || 'http://localhost:8000';
export const ENGINE_API_PREFIX = '/engine';

// WebSocket地址
export const ENGINE_WS_URL = (import.meta as any).env?.VITE_ENGINE_WS_URL || 'ws://localhost:8000/ws';

// API超时配置
export const API_TIMEOUT = 30000;

// 完整的API地址
export const API_ENDPOINTS = {
    // 云服务API（Go后台）
    cloud: {
        base: `${CLOUD_API_BASE_URL}${CLOUD_API_PREFIX}`,
        auth: {
            login: `${CLOUD_API_BASE_URL}${CLOUD_API_PREFIX}/auth/login`,
            register: `${CLOUD_API_BASE_URL}${CLOUD_API_PREFIX}/auth/register`,
            logout: `${CLOUD_API_BASE_URL}${CLOUD_API_PREFIX}/auth/logout`,
        },
        agentTemplates: `${CLOUD_API_BASE_URL}${CLOUD_API_PREFIX}/agent-templates`,
        user: `${CLOUD_API_BASE_URL}${CLOUD_API_PREFIX}/user`,
    },

    // Python引擎API（FastAPI后台）
    engine: {
        base: `${ENGINE_API_BASE_URL}${ENGINE_API_PREFIX}`,
        health: `${ENGINE_API_BASE_URL}/health`,

        // Agent相关
        agents: `${ENGINE_API_BASE_URL}${ENGINE_API_PREFIX}/agents`,
        conversations: `${ENGINE_API_BASE_URL}${ENGINE_API_PREFIX}/conversations`,

        // 工作流相关
        workflows: `${ENGINE_API_BASE_URL}${ENGINE_API_PREFIX}/workflows`,
        tasks: `${ENGINE_API_BASE_URL}${ENGINE_API_PREFIX}/tasks`,

        // 知识库相关
        knowledgeBases: `${ENGINE_API_BASE_URL}${ENGINE_API_PREFIX}/knowledge-bases`,

        // 工具相关
        tools: `${ENGINE_API_BASE_URL}${ENGINE_API_PREFIX}/tools`,

        // 录制器相关
        recorder: `${ENGINE_API_BASE_URL}${ENGINE_API_PREFIX}/recorder`,

        // 系统相关
        system: `${ENGINE_API_BASE_URL}${ENGINE_API_PREFIX}/system`,

        // WebSocket
        ws: ENGINE_WS_URL,
    },
};

// 判断是否为云服务API
export function isCloudAPI(url: string): boolean {
    return url.startsWith(CLOUD_API_BASE_URL);
}

// 判断是否为引擎API
export function isEngineAPI(url: string): boolean {
    return url.startsWith(ENGINE_API_BASE_URL);
}

// 获取API类型
export function getAPIType(url: string): 'cloud' | 'engine' | 'unknown' {
    if (isCloudAPI(url)) return 'cloud';
    if (isEngineAPI(url)) return 'engine';
    return 'unknown';
}
