import { create } from 'zustand';
import { ExecutionRecord, ExecutionLog, Status } from '@/types';
import { apiService } from '@/services/api';
import { wsService } from '@/services/websocket';

interface ExecutionStore {
  executions: ExecutionRecord[];
  currentExecution: ExecutionRecord | null;
  isLoading: boolean;

  // 执行管理
  startExecution: (workflowId: string, params?: Record<string, any>) => Promise<void>;
  pauseExecution: (runId: string) => Promise<void>;
  resumeExecution: (runId: string) => Promise<void>;
  cancelExecution: (runId: string) => Promise<void>;
  loadExecution: (runId: string) => Promise<void>;
  loadExecutionHistory: (workflowId?: string) => Promise<void>;

  // 实时更新
  updateExecutionStatus: (runId: string, status: Status) => void;
  addExecutionLog: (log: ExecutionLog) => void;
  updateNodeStatus: (runId: string, nodeId: string, status: Status) => void;

  // WebSocket订阅
  subscribeToExecution: (runId: string) => () => void;
}

export const useExecutionStore = create<ExecutionStore>((set, get) => ({
  executions: [],
  currentExecution: null,
  isLoading: false,

  startExecution: async (workflowId: string, params?: Record<string, any>) => {
    set({ isLoading: true });
    try {
      const result = await apiService.executeWorkflow(workflowId, params);
      if (result.success && result.data) {
        const { runId } = result.data;

        // 创建初始执行记录
        const execution: ExecutionRecord = {
          id: runId,
          workflow_id: workflowId,
          status: 'pending',
          start_time: new Date().toISOString(),
          logs: [],
          screenshots: [],
          variables: params || {},
        };

        set((state) => ({
          executions: [execution, ...state.executions],
          currentExecution: execution,
        }));

        // 订阅WebSocket更新
        get().subscribeToExecution(runId);
      }
    } catch (error) {
      console.error('Failed to start execution:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  pauseExecution: async (runId: string) => {
    try {
      await apiService.pauseExecution(runId);
      get().updateExecutionStatus(runId, 'pending');
    } catch (error) {
      console.error('Failed to pause execution:', error);
    }
  },

  resumeExecution: async (runId: string) => {
    try {
      await apiService.resumeExecution(runId);
      get().updateExecutionStatus(runId, 'running');
    } catch (error) {
      console.error('Failed to resume execution:', error);
    }
  },

  cancelExecution: async (runId: string) => {
    try {
      await apiService.cancelExecution(runId);
      get().updateExecutionStatus(runId, 'cancelled');
    } catch (error) {
      console.error('Failed to cancel execution:', error);
    }
  },

  loadExecution: async (runId: string) => {
    set({ isLoading: true });
    try {
      const result = await apiService.getExecutionRecord(runId);
      if (result.success && result.data) {
        set({ currentExecution: result.data });
      }
    } catch (error) {
      console.error('Failed to load execution:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  loadExecutionHistory: async (workflowId?: string) => {
    set({ isLoading: true });
    try {
      const result = await apiService.getExecutionHistory(workflowId);
      if (result.success && result.data) {
        set({ executions: result.data });
      }
    } catch (error) {
      console.error('Failed to load execution history:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateExecutionStatus: (runId: string, status: Status) => {
    set((state) => ({
      executions: state.executions.map((exec) => (exec.id === runId ? { ...exec, status } : exec)),
      currentExecution: state.currentExecution?.id === runId ? { ...state.currentExecution, status } : state.currentExecution,
    }));
  },

  addExecutionLog: (log: ExecutionLog) => {
    set((state) => {
      const execution = state.executions.find((e) => e.id === log.runId);
      if (!execution) return state;

      const updatedExecution = {
        ...execution,
        logs: [...execution.logs, log],
      };

      return {
        executions: state.executions.map((e) => (e.id === log.runId ? updatedExecution : e)),
        currentExecution: state.currentExecution?.id === log.runId ? updatedExecution : state.currentExecution,
      };
    });
  },

  updateNodeStatus: (runId: string, nodeId: string, status: Status) => {
    // 更新节点状态的逻辑
    console.log(`Node ${nodeId} in execution ${runId} status: ${status}`);
  },

  subscribeToExecution: (runId: string) => {
    // 订阅执行状态更新
    const unsubStatus = wsService.on('execution_status', (data) => {
      if (data.runId === runId) {
        get().updateExecutionStatus(runId, data.status);
      }
    });

    // 订阅执行日志
    const unsubLog = wsService.on('execution_log', (data) => {
      if (data.runId === runId) {
        get().addExecutionLog(data);
      }
    });

    // 订阅节点状态
    const unsubNode = wsService.on('node_status', (data) => {
      if (data.runId === runId) {
        get().updateNodeStatus(runId, data.nodeId, data.status);
      }
    });

    // 返回取消订阅函数
    return () => {
      unsubStatus();
      unsubLog();
      unsubNode();
    };
  },
}));
