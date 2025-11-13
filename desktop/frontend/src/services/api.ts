import axios, { AxiosInstance } from 'axios';
import { Result, IWorkflow, ExecutionRecord, SystemMetric, SoftwareItem } from '@/types';
import { API_ENDPOINTS, API_TIMEOUT } from '@/config/api';
import { pythonEngine } from './python';

class ApiService {
  private cloudClient: AxiosInstance;  // 云服务客户端
  private engineClient: AxiosInstance; // Python引擎客户端

  constructor() {
    // 云服务客户端（Go后台）
    this.cloudClient = axios.create({
      baseURL: API_ENDPOINTS.cloud.base,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Python引擎客户端（FastAPI后台）
    this.engineClient = axios.create({
      baseURL: API_ENDPOINTS.engine.base,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 为两个客户端添加请求拦截器
    [this.cloudClient, this.engineClient].forEach(client => {
      client.interceptors.request.use(
        (config) => {
          const token = localStorage.getItem('auth_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error) => Promise.reject(error)
      );

      client.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 401) {
            // Token过期，清除本地存储
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
          } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
            // 连接被拒绝或网络错误
            const isEngine = error.config?.baseURL?.includes('8000');
            if (isEngine) {
              // 引擎连接错误会由connectionMonitor统一处理
              console.warn('Engine connection failed:', error.message);
            } else {
              // 云服务连接错误
              console.warn('Cloud service connection failed:', error.message);
            }
          }
          return Promise.reject(error);
        }
      );
    });
  }



  // 工作流相关API
  // 工作流数据存储在云端（Go后台），执行在本地（Python引擎）
  async getWorkflows(): Promise<Result<IWorkflow[]>> {
    try {
      const response = await this.cloudClient.get('/workflows');
      return { success: true, data: response.data.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getWorkflow(id: string): Promise<Result<IWorkflow>> {
    try {
      const response = await this.cloudClient.get(`/workflows/${id}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createWorkflow(workflow: Partial<IWorkflow>): Promise<Result<IWorkflow>> {
    try {
      const response = await this.cloudClient.post('/workflows', workflow);
      return { success: true, data: response.data.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateWorkflow(id: string, workflow: Partial<IWorkflow>): Promise<Result<IWorkflow>> {
    try {
      const response = await this.cloudClient.put(`/workflows/${id}`, workflow);
      return { success: true, data: response.data.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteWorkflow(id: string): Promise<Result<void>> {
    try {
      await this.cloudClient.delete(`/workflows/${id}`);
      return { success: true };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async executeWorkflow(id: string, params?: Record<string, any>): Promise<Result<{ runId: string }>> {
    try {
      // 使用Python引擎执行工作流（通过Tauri IPC）
      const response = await pythonEngine.executeWorkflow(id, params || {});
      return { success: true, data: { runId: response.execution_id } };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 任务执行相关API
  // 任务控制使用Python引擎，历史记录可以从云端获取
  async pauseExecution(runId: string): Promise<Result<void>> {
    try {
      await this.engineClient.patch(`/tasks/${runId}/status`, { status: 'paused' });
      return { success: true };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async resumeExecution(runId: string): Promise<Result<void>> {
    try {
      await this.engineClient.patch(`/tasks/${runId}/status`, { status: 'running' });
      return { success: true };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async cancelExecution(runId: string): Promise<Result<void>> {
    try {
      await this.engineClient.patch(`/tasks/${runId}/status`, { status: 'cancelled' });
      return { success: true };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getExecutionRecord(runId: string): Promise<Result<ExecutionRecord>> {
    try {
      // 优先从云端获取（有完整历史）
      const response = await this.cloudClient.get(`/tasks/${runId}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getExecutionHistory(workflowId?: string): Promise<Result<ExecutionRecord[]>> {
    try {
      // 从云端获取历史记录
      const params = workflowId ? { workflow_id: workflowId } : {};
      const response = await this.cloudClient.get('/tasks', { params });
      return { success: true, data: response.data.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 录制器相关API
  async startRecording(_mode: 'auto' | 'manual' = 'auto'): Promise<Result<void>> {
    try {
      // 使用Python引擎开始录制（通过Tauri IPC）
      // 注意：mode参数暂时未使用，Python引擎会使用默认模式
      await pythonEngine.startRecording();
      return { success: true };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async stopRecording(): Promise<Result<{ nodes: any[] }>> {
    try {
      // 使用Python引擎停止录制（通过Tauri IPC）
      const response = await pythonEngine.stopRecording();
      // 将录制的步骤转换为节点格式
      const nodes = response.steps.map((step, index) => ({
        id: `node_${index}`,
        type: step.type,
        data: step.data,
        position: { x: 100, y: 100 + index * 100 }
      }));
      return { success: true, data: { nodes } };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async pauseRecording(): Promise<Result<void>> {
    try {
      // 暂停录制功能暂时不支持，返回成功
      return { success: true };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async resumeRecording(): Promise<Result<void>> {
    try {
      // 恢复录制功能暂时不支持，返回成功
      return { success: true };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 系统监控相关API
  async getSystemInfo(): Promise<Result<SystemMetric>> {
    try {
      const response = await this.engineClient.get('/system/info');
      // 后端返回的数据已经是Result格式，直接返回
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getSystemStatus(): Promise<Result<{ status: string; uptime: number }>> {
    try {
      const response = await this.engineClient.get('/system/status');
      // 后端返回的数据已经是Result格式，直接返回
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async scanSoftware(): Promise<Result<SoftwareItem[]>> {
    try {
      const response = await this.engineClient.get('/system/scan');
      // 后端返回的数据已经是Result格式，直接返回
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getLogs(filter?: { level?: string; limit?: number }): Promise<Result<any[]>> {
    try {
      const response = await this.engineClient.get('/system/logs', { params: filter });
      // 后端返回的数据已经是Result格式，直接返回
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 错误处理
  private handleError<T = unknown>(error: any): Result<T> {
    if (axios.isAxiosError(error)) {
      // 网络连接错误
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
        const isEngine = error.config?.baseURL?.includes('8000');
        const serviceName = isEngine ? '本地引擎' : '云服务';

        return {
          success: false,
          error: `无法连接到${serviceName}，请检查服务是否正常运行`,
          error_code: 'CONNECTION_ERROR',
        };
      }

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

export const apiService = new ApiService();

// Export axios instances for use in other API services
export const cloudApi = apiService['cloudClient'];
export const engineApi = apiService['engineClient'];
