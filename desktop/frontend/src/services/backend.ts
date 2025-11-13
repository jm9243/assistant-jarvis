/**
 * Go后台服务
 * 
 * 封装所有云端服务的API调用，通过HTTP与Go后台通信
 * 
 * 功能分类：
 * - 用户认证：登录、注册、登出
 * - 长期记忆同步：跨设备同步用户记忆
 * - 工作流云端存储：跨设备同步工作流
 * - LLM API代理：统一管理API Key
 * - 使用统计：查询用户使用情况和配额
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_ENDPOINTS, API_TIMEOUT } from '@/config/api';

// ============================================================================
// 类型定义
// ============================================================================

/**
 * API响应基础结构
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    error_code?: string;
}

/**
 * 用户信息
 */
export interface User {
    id: string;
    email: string;
    username: string;
    avatar?: string;
    created_at: string;
    updated_at: string;
}

/**
 * 登录请求参数
 */
export interface LoginRequest {
    email: string;
    password: string;
}

/**
 * 登录响应
 */
export interface LoginResponse {
    user: User;
    token: string;
    expires_at: string;
}

/**
 * 注册请求参数
 */
export interface RegisterRequest {
    email: string;
    username: string;
    password: string;
}

/**
 * 长期记忆项
 */
export interface LongTermMemory {
    id: string;
    user_id: string;
    content: string;
    category: string;
    importance: number;
    created_at: string;
    updated_at: string;
    metadata?: Record<string, any>;
}

/**
 * 同步记忆请求
 */
export interface SyncMemoryRequest {
    user_id: string;
    memories: Array<{
        content: string;
        category: string;
        importance: number;
        metadata?: Record<string, any>;
    }>;
}

/**
 * 工作流定义
 */
export interface Workflow {
    id: string;
    user_id: string;
    name: string;
    description: string;
    nodes: any[];
    edges: any[];
    version: number;
    created_at: string;
    updated_at: string;
}

/**
 * 同步工作流请求
 */
export interface SyncWorkflowsRequest {
    user_id: string;
    workflows: Array<{
        id?: string;
        name: string;
        description: string;
        nodes: any[];
        edges: any[];
    }>;
}

/**
 * LLM聊天请求
 */
export interface ChatCompletionRequest {
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>;
    model: string;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
}

/**
 * LLM聊天响应
 */
export interface ChatCompletionResponse {
    id: string;
    model: string;
    choices: Array<{
        index: number;
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

/**
 * 使用统计
 */
export interface UsageStats {
    user_id: string;
    period: string;
    total_requests: number;
    total_tokens: number;
    total_cost: number;
    quota_limit: number;
    quota_used: number;
    quota_remaining: number;
    breakdown: {
        model: string;
        requests: number;
        tokens: number;
        cost: number;
    }[];
}

// ============================================================================
// Go后台服务类
// ============================================================================

/**
 * Go后台服务
 * 
 * 提供与云端Go后台交互的所有方法
 * 所有方法都通过HTTP请求调用，返回Promise
 */
export class BackendService {
    private client: AxiosInstance;

    constructor() {
        // 创建axios客户端
        this.client = axios.create({
            baseURL: API_ENDPOINTS.cloud.base,
            timeout: API_TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // 请求拦截器 - 添加认证token
        this.client.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('auth_token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // 响应拦截器 - 统一错误处理
        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                // 401未授权 - 清除token并跳转登录
                if (error.response?.status === 401) {
                    localStorage.removeItem('auth_token');
                    window.location.href = '/login';
                }

                // 网络错误
                if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
                    console.warn('Cloud service connection failed:', error.message);
                }

                return Promise.reject(error);
            }
        );
    }

    // ==========================================================================
    // 用户认证相关方法
    // ==========================================================================

    /**
     * 用户登录
     * 
     * @param email - 用户邮箱
     * @param password - 用户密码
     * @returns 登录响应（包含用户信息和token）
     * 
     * @example
     * ```typescript
     * const response = await backend.login('user@example.com', 'password123');
     * localStorage.setItem('auth_token', response.token);
     * ```
     */
    async login(email: string, password: string): Promise<LoginResponse> {
        const response = await this.client.post<ApiResponse<LoginResponse>>(
            '/auth/login',
            { email, password }
        );

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || '登录失败');
        }

        return response.data.data;
    }

    /**
     * 用户注册
     * 
     * @param email - 用户邮箱
     * @param username - 用户名
     * @param password - 用户密码
     * @returns 注册响应（包含用户信息）
     * 
     * @example
     * ```typescript
     * const user = await backend.register('user@example.com', 'username', 'password123');
     * ```
     */
    async register(
        email: string,
        username: string,
        password: string
    ): Promise<User> {
        const response = await this.client.post<ApiResponse<User>>(
            '/auth/register',
            { email, username, password }
        );

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || '注册失败');
        }

        return response.data.data;
    }

    /**
     * 用户登出
     * 
     * @returns 登出结果
     * 
     * @example
     * ```typescript
     * await backend.logout();
     * localStorage.removeItem('auth_token');
     * ```
     */
    async logout(): Promise<void> {
        await this.client.post('/auth/logout');
        localStorage.removeItem('auth_token');
    }

    /**
     * 获取当前用户信息
     * 
     * @returns 当前用户信息
     * 
     * @example
     * ```typescript
     * const user = await backend.getCurrentUser();
     * console.log(user.email, user.username);
     * ```
     */
    async getCurrentUser(): Promise<User> {
        const response = await this.client.get<ApiResponse<User>>('/auth/me');

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || '获取用户信息失败');
        }

        return response.data.data;
    }

    // ==========================================================================
    // 长期记忆同步相关方法
    // ==========================================================================

    /**
     * 同步长期记忆到云端
     * 
     * 将本地的长期记忆上传到云端，实现跨设备同步
     * 
     * @param userId - 用户ID
     * @param memories - 记忆列表
     * @returns 同步结果
     * 
     * @example
     * ```typescript
     * await backend.syncLongTermMemory('user_123', [
     *   { content: '用户喜欢Python', category: 'preference', importance: 0.8 }
     * ]);
     * ```
     */
    async syncLongTermMemory(
        userId: string,
        memories: SyncMemoryRequest['memories']
    ): Promise<{ synced_count: number }> {
        const response = await this.client.post<ApiResponse<{ synced_count: number }>>(
            '/memory/sync',
            { user_id: userId, memories }
        );

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || '同步记忆失败');
        }

        return response.data.data;
    }

    /**
     * 从云端获取长期记忆
     * 
     * 下载用户的云端记忆到本地
     * 
     * @param userId - 用户ID
     * @returns 记忆列表
     * 
     * @example
     * ```typescript
     * const memories = await backend.getLongTermMemory('user_123');
     * memories.forEach(m => console.log(m.content));
     * ```
     */
    async getLongTermMemory(userId: string): Promise<LongTermMemory[]> {
        const response = await this.client.get<ApiResponse<LongTermMemory[]>>(
            `/memory/${userId}`
        );

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || '获取记忆失败');
        }

        return response.data.data;
    }

    /**
     * 删除云端记忆
     * 
     * @param userId - 用户ID
     * @param memoryId - 记忆ID
     * @returns 删除结果
     */
    async deleteLongTermMemory(userId: string, memoryId: string): Promise<void> {
        await this.client.delete(`/memory/${userId}/${memoryId}`);
    }

    // ==========================================================================
    // 工作流云端存储相关方法
    // ==========================================================================

    /**
     * 同步工作流到云端
     * 
     * 将本地的工作流上传到云端，实现跨设备同步
     * 
     * @param userId - 用户ID
     * @param workflows - 工作流列表
     * @returns 同步结果
     * 
     * @example
     * ```typescript
     * await backend.syncWorkflows('user_123', [
     *   { name: '自动化流程', description: '描述', nodes: [], edges: [] }
     * ]);
     * ```
     */
    async syncWorkflows(
        userId: string,
        workflows: SyncWorkflowsRequest['workflows']
    ): Promise<{ synced_count: number }> {
        const response = await this.client.post<ApiResponse<{ synced_count: number }>>(
            '/workflows/sync',
            { user_id: userId, workflows }
        );

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || '同步工作流失败');
        }

        return response.data.data;
    }

    /**
     * 从云端获取工作流
     * 
     * 下载用户的云端工作流到本地
     * 
     * @param userId - 用户ID
     * @returns 工作流列表
     * 
     * @example
     * ```typescript
     * const workflows = await backend.getWorkflows('user_123');
     * workflows.forEach(w => console.log(w.name));
     * ```
     */
    async getWorkflows(userId: string): Promise<Workflow[]> {
        const response = await this.client.get<ApiResponse<Workflow[]>>(
            `/workflows/${userId}`
        );

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || '获取工作流失败');
        }

        return response.data.data;
    }

    /**
     * 获取单个工作流详情
     * 
     * @param workflowId - 工作流ID
     * @returns 工作流详情
     */
    async getWorkflow(workflowId: string): Promise<Workflow> {
        const response = await this.client.get<ApiResponse<Workflow>>(
            `/workflows/detail/${workflowId}`
        );

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || '获取工作流详情失败');
        }

        return response.data.data;
    }

    /**
     * 删除云端工作流
     * 
     * @param workflowId - 工作流ID
     * @returns 删除结果
     */
    async deleteWorkflow(workflowId: string): Promise<void> {
        await this.client.delete(`/workflows/${workflowId}`);
    }

    // ==========================================================================
    // LLM API代理相关方法
    // ==========================================================================

    /**
     * LLM聊天补全
     * 
     * 通过Go后台代理调用LLM API，统一管理API Key
     * 
     * @param messages - 对话消息列表
     * @param model - 模型名称
     * @param options - 可选参数（temperature、max_tokens等）
     * @returns LLM响应
     * 
     * @example
     * ```typescript
     * const response = await backend.chatCompletion(
     *   [{ role: 'user', content: 'Hello' }],
     *   'gpt-4'
     * );
     * console.log(response.choices[0].message.content);
     * ```
     */
    async chatCompletion(
        messages: ChatCompletionRequest['messages'],
        model: string,
        options?: {
            temperature?: number;
            max_tokens?: number;
            stream?: boolean;
        }
    ): Promise<ChatCompletionResponse> {
        const response = await this.client.post<ApiResponse<ChatCompletionResponse>>(
            '/llm/chat',
            {
                messages,
                model,
                ...options,
            }
        );

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'LLM调用失败');
        }

        return response.data.data;
    }

    /**
     * 获取可用的LLM模型列表
     * 
     * @returns 模型列表
     */
    async getAvailableModels(): Promise<string[]> {
        const response = await this.client.get<ApiResponse<string[]>>('/llm/models');

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || '获取模型列表失败');
        }

        return response.data.data;
    }

    // ==========================================================================
    // 使用统计相关方法
    // ==========================================================================

    /**
     * 获取使用统计
     * 
     * 查询用户的API使用情况和配额信息
     * 
     * @param userId - 用户ID
     * @param period - 统计周期（'day'、'week'、'month'）
     * @returns 使用统计信息
     * 
     * @example
     * ```typescript
     * const stats = await backend.getUsageStats('user_123', 'month');
     * console.log(`已使用: ${stats.quota_used}/${stats.quota_limit}`);
     * ```
     */
    async getUsageStats(
        userId: string,
        period: 'day' | 'week' | 'month' = 'month'
    ): Promise<UsageStats> {
        const response = await this.client.get<ApiResponse<UsageStats>>(
            `/usage/${userId}`,
            { params: { period } }
        );

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || '获取使用统计失败');
        }

        return response.data.data;
    }

    /**
     * 获取配额信息
     * 
     * @param userId - 用户ID
     * @returns 配额信息
     */
    async getQuotaInfo(userId: string): Promise<{
        limit: number;
        used: number;
        remaining: number;
        reset_at: string;
    }> {
        const response = await this.client.get<ApiResponse<any>>(
            `/usage/${userId}/quota`
        );

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || '获取配额信息失败');
        }

        return response.data.data;
    }

    // ==========================================================================
    // 会话管理相关方法
    // ==========================================================================

    /**
     * 获取会话列表
     * 
     * @param agentId - Agent ID
     * @returns 会话列表
     */
    async getConversations(agentId: string): Promise<any[]> {
        const response = await this.client.get<ApiResponse<any[]>>(
            `/conversations`,
            { params: { agent_id: agentId } }
        );

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || '获取会话列表失败');
        }

        return response.data.data;
    }

    /**
     * 删除会话
     * 
     * @param conversationId - 会话ID
     * @returns 删除结果
     */
    async deleteConversation(conversationId: string): Promise<void> {
        await this.client.delete(`/conversations/${conversationId}`);
    }

    /**
     * 导出会话
     * 
     * @param conversationId - 会话ID
     * @returns 会话数据
     */
    async exportConversation(conversationId: string): Promise<any> {
        const response = await this.client.get<ApiResponse<any>>(
            `/conversations/${conversationId}/export`,
            { params: { format: 'json' } }
        );

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || '导出会话失败');
        }

        return response.data.data;
    }

    /**
     * 更新会话
     * 
     * @param conversationId - 会话ID
     * @param updates - 更新内容
     * @returns 更新结果
     */
    async updateConversation(conversationId: string, updates: any): Promise<void> {
        await this.client.patch(`/conversations/${conversationId}`, updates);
    }

    // ==========================================================================
    // 知识库管理相关方法
    // ==========================================================================

    /**
     * 获取知识库信息
     * 
     * @param kbId - 知识库ID
     * @returns 知识库信息
     */
    async getKnowledgeBase(kbId: string): Promise<any> {
        const response = await this.client.get<ApiResponse<any>>(
            `/knowledge-bases/${kbId}`
        );

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || '获取知识库失败');
        }

        return response.data.data;
    }

    /**
     * 获取知识库文档列表
     * 
     * @param kbId - 知识库ID
     * @returns 文档列表
     */
    async getKnowledgeBaseDocuments(kbId: string): Promise<any[]> {
        const response = await this.client.get<ApiResponse<any[]>>(
            `/knowledge-bases/${kbId}/documents`
        );

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || '获取文档列表失败');
        }

        return response.data.data;
    }

    /**
     * 删除知识库文档
     * 
     * @param kbId - 知识库ID
     * @param docId - 文档ID
     * @returns 删除结果
     */
    async deleteKnowledgeBaseDocument(kbId: string, docId: string): Promise<void> {
        await this.client.delete(`/knowledge-bases/${kbId}/documents/${docId}`);
    }

}

// ============================================================================
// 导出单例实例
// ============================================================================

/**
 * Go后台服务单例实例
 * 
 * 直接导入使用：
 * ```typescript
 * import { backend } from '@/services/backend';
 * 
 * const user = await backend.login('user@example.com', 'password');
 * ```
 */
export const backend = new BackendService();

/**
 * 默认导出
 */
export default backend;
