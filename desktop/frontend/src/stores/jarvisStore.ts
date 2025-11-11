/**
 * 贾维斯AI助理状态管理
 */
import { create } from 'zustand';
import { jarvisApi } from '../services/agentApi';

export interface ExecutionStep {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export interface ExecutionPlan {
  id: string;
  query: string;
  intent: string;
  steps: ExecutionStep[];
  requiresApproval: boolean;
  estimatedTime?: number;
}

interface JarvisState {
  // 状态
  isOpen: boolean;
  isProcessing: boolean;
  currentPlan: ExecutionPlan | null;
  executionHistory: ExecutionPlan[];
  error: string | null;

  // 操作
  open: () => void;
  close: () => void;
  toggle: () => void;
  
  // 任务处理
  processQuery: (query: string) => Promise<void>;
  approvePlan: () => Promise<void>;
  rejectPlan: () => void;
  cancelExecution: () => void;
  
  // 清理
  clearError: () => void;
  clearPlan: () => void;
}

export const useJarvisStore = create<JarvisState>((set, get) => ({
  // 初始状态
  isOpen: false,
  isProcessing: false,
  currentPlan: null,
  executionHistory: [],
  error: null,

  // 打开/关闭
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false, currentPlan: null, error: null }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),

  // 处理用户查询
  processQuery: async (query: string) => {
    set({ isProcessing: true, error: null });

    try {
      // 调用贾维斯API进行意图识别和任务规划
      const response = await jarvisApi.processQuery({ query });

      // 构建执行计划
      const plan: ExecutionPlan = {
        id: response.plan_id || Date.now().toString(),
        query,
        intent: response.intent || '执行任务',
        steps: response.steps || [
          {
            id: '1',
            description: '分析任务需求',
            status: 'pending',
          },
          {
            id: '2',
            description: '准备执行环境',
            status: 'pending',
          },
          {
            id: '3',
            description: '执行任务',
            status: 'pending',
          },
        ],
        requiresApproval: response.requires_approval !== false,
        estimatedTime: response.estimated_time || 30,
      };

      set({ currentPlan: plan, isProcessing: false });
    } catch (error: any) {
      // 如果API不可用，使用模拟数据
      console.warn('Jarvis API not available, using mock data:', error);
      
      const plan: ExecutionPlan = {
        id: Date.now().toString(),
        query,
        intent: '执行任务',
        steps: [
          {
            id: '1',
            description: '分析任务需求',
            status: 'pending',
          },
          {
            id: '2',
            description: '准备执行环境',
            status: 'pending',
          },
          {
            id: '3',
            description: '执行任务',
            status: 'pending',
          },
        ],
        requiresApproval: true,
        estimatedTime: 30,
      };

      set({ currentPlan: plan, isProcessing: false });
    }
  },

  // 批准执行计划
  approvePlan: async () => {
    const { currentPlan } = get();
    if (!currentPlan) return;

    set({ isProcessing: true, error: null });

    try {
      // 执行计划中的每个步骤
      const updatedSteps = [...currentPlan.steps];

      for (let i = 0; i < updatedSteps.length; i++) {
        // 更新步骤状态为运行中
        updatedSteps[i] = { ...updatedSteps[i], status: 'running' };
        set({
          currentPlan: { ...currentPlan, steps: updatedSteps },
        });

        // 模拟执行步骤
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 更新步骤状态为完成
        updatedSteps[i] = {
          ...updatedSteps[i],
          status: 'completed',
          result: '步骤执行成功',
        };
        set({
          currentPlan: { ...currentPlan, steps: updatedSteps },
        });
      }

      // 添加到历史记录
      set((state) => ({
        executionHistory: [currentPlan, ...state.executionHistory],
        isProcessing: false,
      }));

      // 延迟关闭
      setTimeout(() => {
        get().close();
      }, 2000);
    } catch (error: any) {
      set({
        error: error.message || '执行失败',
        isProcessing: false,
      });
    }
  },

  // 拒绝执行计划
  rejectPlan: () => {
    set({ currentPlan: null, isProcessing: false });
  },

  // 取消执行
  cancelExecution: () => {
    set({ isProcessing: false, currentPlan: null });
  },

  // 清理
  clearError: () => set({ error: null }),
  clearPlan: () => set({ currentPlan: null }),
}));
