/**
 * 服务层类型定义
 * 
 * 定义所有服务层使用的请求和响应类型
 * 包括Python引擎服务和Go后台服务的类型定义
 */

// ============================================================================
// 通用类型
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
 * 分页参数
 */
export interface PaginationParams {
    limit?: number;
    offset?: number;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    limit: number;
    offset: number;
}

// ============================================================================
// Python引擎服务类型
// ============================================================================

/**
 * Agent对话相关类型
 */
export namespace AgentTypes {
    /**
     * Agent对话请求参数
     */
    export interface ChatParams {
        conversationId: string;
        message: string;
        stream?: boolean;
    }

    /**
     * Agent对话响应
     */
    export interface ChatResponse {
        message: string;
        conversation_id: string;
        tokens_used?: number;
        citations?: Citation[];
    }

    /**
     * 引用信息
     */
    export interface Citation {
        source: string;
        content: string;
        relevance: number;
    }

    /**
     * 创建会话响应
     */
    export interface CreateConversationResponse {
        conversation_id: string;
        agent_id: string;
        created_at: string;
    }

    /**
     * 对话历史消息
     */
    export interface ConversationMessage {
        id: string;
        role: 'user' | 'assistant' | 'system';
        content: string;
        timestamp: string;
        metadata?: Record<string, any>;
    }
}

/**
 * 知识库相关类型
 */
export namespace KnowledgeBaseTypes {
    /**
     * 知识库搜索结果项
     */
    export interface SearchResult {
        content: string;
        score: number;
        metadata: {
            source?: string;
            page?: number;
            chunk_id?: string;
            [key: string]: any;
        };
    }

    /**
     * 知识库搜索响应
     */
    export interface SearchResponse {
        query: string;
        results: SearchResult[];
        total_results: number;
    }

    /**
     * 添加文档响应
     */
    export interface AddDocumentResponse {
        document_id: string;
        chunks_count: number;
        processing_time: number;
    }

    /**
     * 文档信息
     */
    export interface Document {
        id: string;
        kb_id: string;
        filename: string;
        file_path: string;
        file_size: number;
        chunks_count: number;
        created_at: string;
        metadata?: Record<string, any>;
    }
}

/**
 * GUI自动化相关类型
 */
export namespace GUITypes {
    /**
     * GUI元素位置信息
     */
    export interface ElementLocation {
        found: boolean;
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        element_type?: string;
        text?: string;
    }

    /**
     * 点击操作结果
     */
    export interface ClickResult {
        success: boolean;
        x: number;
        y: number;
        timestamp: string;
    }

    /**
     * 输入操作结果
     */
    export interface InputResult {
        success: boolean;
        text: string;
        timestamp: string;
    }

    /**
     * 屏幕截图信息
     */
    export interface Screenshot {
        data: string; // Base64编码的图片数据
        width: number;
        height: number;
        format: 'png' | 'jpeg';
        timestamp: string;
    }
}

/**
 * 工作流相关类型
 */
export namespace WorkflowTypes {
    /**
     * 工作流执行状态
     */
    export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

    /**
     * 工作流执行响应
     */
    export interface ExecuteWorkflowResponse {
        execution_id: string;
        workflow_id: string;
        status: ExecutionStatus;
        started_at: string;
        outputs?: Record<string, any>;
        error?: string;
    }

    /**
     * 工作流执行进度
     */
    export interface ExecutionProgress {
        execution_id: string;
        status: ExecutionStatus;
        progress: number; // 0-100
        current_node?: string;
        completed_nodes: string[];
        failed_nodes: string[];
        logs: ExecutionLog[];
    }

    /**
     * 执行日志
     */
    export interface ExecutionLog {
        timestamp: string;
        level: 'info' | 'warning' | 'error';
        node_id?: string;
        message: string;
    }

    /**
     * 工作流节点
     */
    export interface WorkflowNode {
        id: string;
        type: string;
        label: string;
        position: { x: number; y: number };
        data: Record<string, any>;
    }

    /**
     * 工作流边
     */
    export interface WorkflowEdge {
        id: string;
        source: string;
        target: string;
        label?: string;
        data?: Record<string, any>;
    }
}

/**
 * 录制器相关类型
 */
export namespace RecorderTypes {
    /**
     * 录制会话信息
     */
    export interface RecordingSession {
        session_id: string;
        started_at: string;
        status: 'recording' | 'paused' | 'stopped';
    }

    /**
     * 录制结果
     */
    export interface RecordingResult {
        session_id: string;
        started_at: string;
        stopped_at: string;
        duration: number; // 秒
        steps: RecordedStep[];
    }

    /**
     * 录制的操作步骤
     */
    export interface RecordedStep {
        id: string;
        type: 'click' | 'input' | 'keypress' | 'wait' | 'screenshot';
        action: string;
        data: any;
        timestamp: string;
        screenshot?: string; // Base64编码的截图
    }
}

// ============================================================================
// Go后台服务类型
// ============================================================================

/**
 * 用户认证相关类型
 */
export namespace AuthTypes {
    /**
     * 用户信息
     */
    export interface User {
        id: string;
        email: string;
        username: string;
        avatar?: string;
        role: 'user' | 'admin';
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
     * Token信息
     */
    export interface TokenInfo {
        token: string;
        expires_at: string;
        refresh_token?: string;
    }
}

/**
 * 长期记忆相关类型
 */
export namespace MemoryTypes {
    /**
     * 长期记忆项
     */
    export interface LongTermMemory {
        id: string;
        user_id: string;
        content: string;
        category: string;
        importance: number; // 0-1
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
     * 同步记忆响应
     */
    export interface SyncMemoryResponse {
        synced_count: number;
        failed_count: number;
        errors?: string[];
    }
}

/**
 * 工作流云端存储相关类型
 */
export namespace CloudWorkflowTypes {
    /**
     * 云端工作流
     */
    export interface Workflow {
        id: string;
        user_id: string;
        name: string;
        description: string;
        nodes: WorkflowTypes.WorkflowNode[];
        edges: WorkflowTypes.WorkflowEdge[];
        version: number;
        created_at: string;
        updated_at: string;
        tags?: string[];
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
            nodes: WorkflowTypes.WorkflowNode[];
            edges: WorkflowTypes.WorkflowEdge[];
            tags?: string[];
        }>;
    }

    /**
     * 同步工作流响应
     */
    export interface SyncWorkflowsResponse {
        synced_count: number;
        failed_count: number;
        workflow_ids: string[];
        errors?: string[];
    }
}

/**
 * LLM API代理相关类型
 */
export namespace LLMTypes {
    /**
     * 消息角色
     */
    export type MessageRole = 'system' | 'user' | 'assistant' | 'function';

    /**
     * 聊天消息
     */
    export interface ChatMessage {
        role: MessageRole;
        content: string;
        name?: string;
        function_call?: {
            name: string;
            arguments: string;
        };
    }

    /**
     * 聊天补全请求
     */
    export interface ChatCompletionRequest {
        messages: ChatMessage[];
        model: string;
        temperature?: number;
        max_tokens?: number;
        top_p?: number;
        frequency_penalty?: number;
        presence_penalty?: number;
        stream?: boolean;
        stop?: string | string[];
    }

    /**
     * 聊天补全响应
     */
    export interface ChatCompletionResponse {
        id: string;
        object: string;
        created: number;
        model: string;
        choices: Array<{
            index: number;
            message: ChatMessage;
            finish_reason: string;
        }>;
        usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    }

    /**
     * 模型信息
     */
    export interface ModelInfo {
        id: string;
        name: string;
        provider: 'openai' | 'anthropic' | 'google' | 'local';
        max_tokens: number;
        cost_per_1k_tokens: {
            input: number;
            output: number;
        };
    }
}

/**
 * 使用统计相关类型
 */
export namespace UsageTypes {
    /**
     * 使用统计
     */
    export interface UsageStats {
        user_id: string;
        period: 'day' | 'week' | 'month' | 'year';
        start_date: string;
        end_date: string;
        total_requests: number;
        total_tokens: number;
        total_cost: number;
        quota_limit: number;
        quota_used: number;
        quota_remaining: number;
        breakdown: UsageBreakdown[];
    }

    /**
     * 使用明细
     */
    export interface UsageBreakdown {
        model: string;
        requests: number;
        tokens: {
            input: number;
            output: number;
            total: number;
        };
        cost: number;
    }

    /**
     * 配额信息
     */
    export interface QuotaInfo {
        limit: number;
        used: number;
        remaining: number;
        reset_at: string;
        period: 'daily' | 'monthly' | 'yearly';
    }

    /**
     * 使用历史记录
     */
    export interface UsageRecord {
        id: string;
        user_id: string;
        model: string;
        tokens: number;
        cost: number;
        timestamp: string;
        metadata?: Record<string, any>;
    }
}

// ============================================================================
// 错误类型
// ============================================================================

/**
 * 服务错误类型
 */
export enum ServiceErrorType {
    // 网络错误
    NETWORK_ERROR = 'NETWORK_ERROR',
    CONNECTION_REFUSED = 'CONNECTION_REFUSED',
    TIMEOUT = 'TIMEOUT',

    // 认证错误
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    TOKEN_EXPIRED = 'TOKEN_EXPIRED',

    // 请求错误
    BAD_REQUEST = 'BAD_REQUEST',
    NOT_FOUND = 'NOT_FOUND',
    VALIDATION_ERROR = 'VALIDATION_ERROR',

    // 服务器错误
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

    // 业务错误
    QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
    RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
    OPERATION_FAILED = 'OPERATION_FAILED',

    // Python引擎错误
    ENGINE_NOT_STARTED = 'ENGINE_NOT_STARTED',
    ENGINE_CRASHED = 'ENGINE_CRASHED',
    IPC_ERROR = 'IPC_ERROR',

    // 未知错误
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * 服务错误类
 */
export class ServiceError extends Error {
    constructor(
        public type: ServiceErrorType,
        public message: string,
        public code?: string,
        public details?: any
    ) {
        super(message);
        this.name = 'ServiceError';
    }

    /**
     * 判断是否为网络错误
     */
    isNetworkError(): boolean {
        return [
            ServiceErrorType.NETWORK_ERROR,
            ServiceErrorType.CONNECTION_REFUSED,
            ServiceErrorType.TIMEOUT,
        ].includes(this.type);
    }

    /**
     * 判断是否为认证错误
     */
    isAuthError(): boolean {
        return [
            ServiceErrorType.UNAUTHORIZED,
            ServiceErrorType.FORBIDDEN,
            ServiceErrorType.TOKEN_EXPIRED,
        ].includes(this.type);
    }

    /**
     * 判断是否为服务器错误
     */
    isServerError(): boolean {
        return [
            ServiceErrorType.INTERNAL_SERVER_ERROR,
            ServiceErrorType.SERVICE_UNAVAILABLE,
        ].includes(this.type);
    }

    /**
     * 获取用户友好的错误消息
     */
    getUserMessage(): string {
        const messages: Record<ServiceErrorType, string> = {
            [ServiceErrorType.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
            [ServiceErrorType.CONNECTION_REFUSED]: '无法连接到服务，请稍后重试',
            [ServiceErrorType.TIMEOUT]: '请求超时，请稍后重试',
            [ServiceErrorType.UNAUTHORIZED]: '未授权，请重新登录',
            [ServiceErrorType.FORBIDDEN]: '没有权限执行此操作',
            [ServiceErrorType.TOKEN_EXPIRED]: '登录已过期，请重新登录',
            [ServiceErrorType.BAD_REQUEST]: '请求参数错误',
            [ServiceErrorType.NOT_FOUND]: '请求的资源不存在',
            [ServiceErrorType.VALIDATION_ERROR]: '输入数据验证失败',
            [ServiceErrorType.INTERNAL_SERVER_ERROR]: '服务器内部错误',
            [ServiceErrorType.SERVICE_UNAVAILABLE]: '服务暂时不可用',
            [ServiceErrorType.QUOTA_EXCEEDED]: '已超出使用配额',
            [ServiceErrorType.RESOURCE_NOT_FOUND]: '资源不存在',
            [ServiceErrorType.OPERATION_FAILED]: '操作失败',
            [ServiceErrorType.ENGINE_NOT_STARTED]: 'Python引擎未启动',
            [ServiceErrorType.ENGINE_CRASHED]: 'Python引擎崩溃',
            [ServiceErrorType.IPC_ERROR]: '进程通信错误',
            [ServiceErrorType.UNKNOWN_ERROR]: '未知错误',
        };

        return messages[this.type] || this.message;
    }
}

// ============================================================================
// 导出所有类型（已在定义处使用export关键字，无需重复导出）
// ============================================================================
