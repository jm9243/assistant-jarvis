/**
 * Python引擎服务
 * 
 * 封装所有本地Python引擎的功能调用，通过Tauri IPC命令与Python常驻进程通信
 * 
 * 功能分类：
 * - Agent相关：对话、会话管理
 * - 知识库相关：文档管理、检索
 * - GUI自动化：元素定位、点击、输入
 * - 工作流相关：执行工作流
 * - 录制器相关：录制和停止录制
 */
import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// 类型定义
// ============================================================================

/**
 * Agent对话请求参数
 */
export interface AgentChatParams {
    conversationId: string;
    message: string;
    stream?: boolean;
}

/**
 * Agent对话响应
 */
export interface AgentChatResponse {
    message: string;
    conversation_id: string;
    tokens_used?: number;
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
}

/**
 * 知识库搜索结果
 */
export interface KbSearchResult {
    content: string;
    score: number;
    metadata: Record<string, any>;
}

/**
 * 知识库搜索响应
 */
export interface KbSearchResponse {
    query: string;
    results: KbSearchResult[];
}

/**
 * 添加文档响应
 */
export interface KbAddDocumentResponse {
    document_id: string;
    chunks_count: number;
}

/**
 * GUI元素位置信息
 */
export interface ElementLocation {
    found: boolean;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
}

/**
 * 工作流执行响应
 */
export interface ExecuteWorkflowResponse {
    execution_id: string;
    status: 'running' | 'completed' | 'failed';
    outputs?: Record<string, any>;
    error?: string;
}

/**
 * 录制会话信息
 */
export interface RecordingSession {
    session_id: string;
    started_at: string;
}

/**
 * 录制结果
 */
export interface RecordingResult {
    session_id: string;
    steps: Array<{
        type: string;
        action: string;
        data: any;
        timestamp: string;
    }>;
}

// ============================================================================
// Python引擎服务类
// ============================================================================

/**
 * Python引擎服务
 * 
 * 提供与本地Python引擎交互的所有方法
 * 所有方法都通过Tauri IPC命令调用，返回Promise
 */
export class PythonEngineService {
    // ==========================================================================
    // Agent相关方法
    // ==========================================================================

    /**
     * Agent对话
     * 
     * 发送消息到指定的对话会话，获取Agent的回复
     * 
     * @param conversationId - 对话会话ID
     * @param message - 用户消息内容
     * @param stream - 是否使用流式响应（默认false）
     * @returns Agent回复结果
     * 
     * @example
     * ```typescript
     * const response = await pythonEngine.agentChat('conv_123', '你好', false);
     * console.log(response.message);
     * ```
     */
    async agentChat(
        conversationId: string,
        message: string,
        stream: boolean = false
    ): Promise<AgentChatResponse> {
        return await invoke<AgentChatResponse>('agent_chat', {
            conversationId,
            message,
            stream,
        });
    }

    /**
     * 创建对话会话
     * 
     * 为指定的Agent创建新的对话会话
     * 
     * @param agentId - Agent ID
     * @returns 新创建的会话信息
     * 
     * @example
     * ```typescript
     * const conversation = await pythonEngine.createConversation('agent_123');
     * console.log(conversation.conversation_id);
     * ```
     */
    async createConversation(agentId: string): Promise<CreateConversationResponse> {
        return await invoke<CreateConversationResponse>('create_conversation', {
            agentId,
        });
    }

    /**
     * 获取对话历史
     * 
     * 获取指定对话会话的历史消息列表
     * 
     * @param conversationId - 对话会话ID
     * @returns 对话历史消息数组
     * 
     * @example
     * ```typescript
     * const history = await pythonEngine.getConversationHistory('conv_123');
     * history.forEach(msg => console.log(msg.content));
     * ```
     */
    async getConversationHistory(conversationId: string): Promise<ConversationMessage[]> {
        return await invoke<ConversationMessage[]>('get_conversation_history', {
            conversationId,
        });
    }

    // ==========================================================================
    // 知识库相关方法
    // ==========================================================================

    /**
     * 知识库搜索
     * 
     * 在指定知识库中搜索相关文档
     * 
     * @param kbId - 知识库ID
     * @param query - 搜索查询文本
     * @param topK - 返回结果数量（默认5，范围1-100）
     * @returns 搜索结果列表
     * 
     * @example
     * ```typescript
     * const results = await pythonEngine.kbSearch('kb_123', '如何使用API', 10);
     * results.results.forEach(r => console.log(r.content, r.score));
     * ```
     */
    async kbSearch(
        kbId: string,
        query: string,
        topK: number = 5
    ): Promise<KbSearchResponse> {
        return await invoke<KbSearchResponse>('kb_search', {
            kbId,
            query,
            topK,
        });
    }

    /**
     * 添加文档到知识库
     * 
     * 将文档文件添加到指定知识库，自动进行解析和向量化
     * 
     * @param kbId - 知识库ID
     * @param filePath - 文档文件的完整路径
     * @returns 添加结果（包含文档ID和分块数量）
     * 
     * @example
     * ```typescript
     * const result = await pythonEngine.kbAddDocument('kb_123', '/path/to/doc.pdf');
     * console.log(`Added document ${result.document_id} with ${result.chunks_count} chunks`);
     * ```
     */
    async kbAddDocument(
        kbId: string,
        filePath: string
    ): Promise<KbAddDocumentResponse> {
        return await invoke<KbAddDocumentResponse>('kb_add_document', {
            kbId,
            filePath,
        });
    }

    // ==========================================================================
    // GUI自动化相关方法
    // ==========================================================================

    /**
     * 定位GUI元素
     * 
     * 在屏幕上定位指定类型和文本的GUI元素
     * 
     * @param elementType - 元素类型（如'button'、'textbox'、'window'等）
     * @param text - 元素文本（可选，用于精确定位）
     * @returns 元素位置信息
     * 
     * @example
     * ```typescript
     * const location = await pythonEngine.locateElement('button', '确定');
     * if (location.found) {
     *   console.log(`Found at (${location.x}, ${location.y})`);
     * }
     * ```
     */
    async locateElement(
        elementType: string,
        text?: string
    ): Promise<ElementLocation> {
        return await invoke<ElementLocation>('locate_element', {
            elementType,
            text,
        });
    }

    /**
     * 点击GUI元素
     * 
     * 在指定坐标位置点击鼠标
     * 
     * @param x - X坐标
     * @param y - Y坐标
     * @returns 点击结果
     * 
     * @example
     * ```typescript
     * await pythonEngine.clickElement(100, 200);
     * ```
     */
    async clickElement(x: number, y: number): Promise<void> {
        return await invoke<void>('click_element', {
            x,
            y,
        });
    }

    /**
     * 输入文本
     * 
     * 在当前焦点位置输入文本
     * 
     * @param text - 要输入的文本
     * @returns 输入结果
     * 
     * @example
     * ```typescript
     * await pythonEngine.inputText('Hello World');
     * ```
     */
    async inputText(text: string): Promise<void> {
        return await invoke<void>('input_text', {
            text,
        });
    }

    // ==========================================================================
    // 工作流相关方法
    // ==========================================================================

    /**
     * 执行工作流
     * 
     * 执行指定的工作流，传入输入参数
     * 
     * @param workflowId - 工作流ID
     * @param inputs - 工作流输入参数（JSON对象）
     * @returns 工作流执行结果
     * 
     * @example
     * ```typescript
     * const result = await pythonEngine.executeWorkflow('wf_123', {
     *   input1: 'value1',
     *   input2: 'value2'
     * });
     * console.log(result.status, result.outputs);
     * ```
     */
    async executeWorkflow(
        workflowId: string,
        inputs: Record<string, any>
    ): Promise<ExecuteWorkflowResponse> {
        return await invoke<ExecuteWorkflowResponse>('execute_workflow', {
            workflowId,
            inputs,
        });
    }

    // ==========================================================================
    // 录制器相关方法
    // ==========================================================================

    /**
     * 开始录制
     * 
     * 开始录制用户操作，用于创建工作流
     * 
     * @returns 录制会话信息
     * 
     * @example
     * ```typescript
     * const session = await pythonEngine.startRecording();
     * console.log(`Recording started: ${session.session_id}`);
     * ```
     */
    async startRecording(): Promise<RecordingSession> {
        return await invoke<RecordingSession>('start_recording');
    }

    /**
     * 停止录制
     * 
     * 停止当前的录制会话，返回录制的操作序列
     * 
     * @returns 录制的操作序列
     * 
     * @example
     * ```typescript
     * const result = await pythonEngine.stopRecording();
     * console.log(`Recorded ${result.steps.length} steps`);
     * ```
     */
    async stopRecording(): Promise<RecordingResult> {
        return await invoke<RecordingResult>('stop_recording');
    }

    /**
     * 暂停录制
     */
    async pauseRecording(): Promise<void> {
        return await invoke<void>('pause_recording');
    }

    /**
     * 恢复录制
     */
    async resumeRecording(): Promise<void> {
        return await invoke<void>('resume_recording');
    }

    /**
     * 获取录制状态
     */
    async getRecordingStatus(): Promise<any> {
        return await invoke<any>('get_recording_status');
    }

    /**
     * 暂停工作流
     */
    async pauseWorkflow(workflowId: string): Promise<void> {
        return await invoke<void>('pause_workflow', { workflowId });
    }

    /**
     * 恢复工作流
     */
    async resumeWorkflow(workflowId: string): Promise<void> {
        return await invoke<void>('resume_workflow', { workflowId });
    }

    /**
     * 取消工作流
     */
    async cancelWorkflow(workflowId: string): Promise<void> {
        return await invoke<void>('cancel_workflow', { workflowId });
    }

    /**
     * 删除知识库文档
     */
    async kbDeleteDocument(kbId: string, docId: string): Promise<void> {
        return await invoke<void>('kb_delete_document', { kbId, docId });
    }

    /**
     * 获取知识库统计信息
     */
    async kbGetStats(kbId: string): Promise<any> {
        return await invoke<any>('kb_get_stats', { kbId });
    }
}

// ============================================================================
// 导出单例实例
// ============================================================================

/**
 * Python引擎服务单例实例
 * 
 * 直接导入使用：
 * ```typescript
 * import { pythonEngine } from '@/services/python';
 * 
 * const response = await pythonEngine.agentChat('conv_123', 'Hello');
 * ```
 */
export const pythonEngine = new PythonEngineService();

/**
 * 默认导出
 */
export default pythonEngine;
