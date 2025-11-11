/**
 * Python Engine API 服务
 * 处理本地自动化引擎的 API 调用（录制、执行等）
 */
import axios, { AxiosInstance } from 'axios';
import { Result } from '@/types';
import { API_ENDPOINTS, API_TIMEOUT } from '@/config/api';

interface RecordedStep {
    id: string;
    type: string;
    action: string;
    timestamp: number;
    data?: any;
}

interface ExecutionStatus {
    runId: string;
    status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    currentNode?: string;
    error?: string;
}

interface SystemMetric {
    cpu: number;
    memory: number;
    disk: number;
}

class EngineApiService {
    private client: AxiosInstance;
    private baseURL: string;

    constructor() {
        // Python Engine API
        this.baseURL = API_ENDPOINTS.engine.base.replace('/v1', '');
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: API_TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // 请求拦截器
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
    }

    // ==================== 录制相关 API ====================

    /**
     * 开始录制
     * @param mode 录制模式：auto（自动）或 manual（手动）
     */
    async startRecording(mode: 'auto' | 'manual' = 'auto'): Promise<Result<void>> {
        try {
            await this.client.post('/recorder/start', { mode });
            return { success: true };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * 停止录制并返回录制的节点
     */
    async stopRecording(): Promise<Result<{ nodes: any[] }>> {
        try {
            const response = await this.client.post('/recorder/stop');
            return { success: true, data: response.data };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * 暂停录制
     */
    async pauseRecording(): Promise<Result<void>> {
        try {
            await this.client.post('/recorder/pause');
            return { success: true };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * 恢复录制
     */
    async resumeRecording(): Promise<Result<void>> {
        try {
            await this.client.post('/recorder/resume');
            return { success: true };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * 获取录制状态
     */
    async getRecordingStatus(): Promise<Result<{
        isRecording: boolean;
        isPaused: boolean;
        steps: RecordedStep[];
    }>> {
        try {
            const response = await this.client.get('/recorder/status');
            return { success: true, data: response.data };
        } catch (error) {
            return this.handleError(error);
        }
    }

    // ==================== 执行相关 API ====================

    /**
     * 执行工作流
     * @param workflow 工作流定义
     * @param params 执行参数
     */
    async executeWorkflow(workflow: any, params?: Record<string, any>): Promise<Result<{ runId: string }>> {
        try {
            const response = await this.client.post('/workflow/execute', {
                workflow,
                params,
            });
            return { success: true, data: response.data };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * 获取执行状态
     * @param runId 执行ID
     */
    async getExecutionStatus(runId: string): Promise<Result<ExecutionStatus>> {
        try {
            const response = await this.client.get(`/workflow/execution/${runId}`);
            return { success: true, data: response.data };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * 暂停执行
     * @param runId 执行ID
     */
    async pauseExecution(runId: string): Promise<Result<void>> {
        try {
            await this.client.post(`/workflow/execution/${runId}/pause`);
            return { success: true };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * 恢复执行
     * @param runId 执行ID
     */
    async resumeExecution(runId: string): Promise<Result<void>> {
        try {
            await this.client.post(`/workflow/execution/${runId}/resume`);
            return { success: true };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * 取消执行
     * @param runId 执行ID
     */
    async cancelExecution(runId: string): Promise<Result<void>> {
        try {
            await this.client.post(`/workflow/execution/${runId}/cancel`);
            return { success: true };
        } catch (error) {
            return this.handleError(error);
        }
    }

    // ==================== 系统监控相关 API ====================

    /**
     * 获取系统信息
     */
    async getSystemInfo(): Promise<Result<SystemMetric>> {
        try {
            const response = await this.client.get('/system/info');
            return { success: true, data: response.data };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * 获取系统状态
     */
    async getSystemStatus(): Promise<Result<{ status: string; uptime: number }>> {
        try {
            const response = await this.client.get('/system/status');
            return { success: true, data: response.data };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * 扫描已安装软件
     */
    async scanSoftware(): Promise<Result<any[]>> {
        try {
            const response = await this.client.get('/system/scan');
            return { success: true, data: response.data };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * 获取日志
     * @param filter 过滤条件
     */
    async getLogs(filter?: { level?: string; limit?: number }): Promise<Result<any[]>> {
        try {
            const response = await this.client.get('/system/logs', { params: filter });
            return { success: true, data: response.data };
        } catch (error) {
            return this.handleError(error);
        }
    }

    // ==================== 错误处理 ====================

    private handleError<T = unknown>(error: any): Result<T> {
        if (axios.isAxiosError(error)) {
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                error_code: error.response?.data?.error_code,
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export const engineApi = new EngineApiService();
export default engineApi;
