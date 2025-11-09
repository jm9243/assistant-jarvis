import { create } from 'zustand';
import type { Workflow } from '@/types';

interface WorkflowState {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  loading: boolean;
  fetchWorkflows: () => Promise<void>;
  setCurrentWorkflow: (workflow: Workflow | null) => void;
  createWorkflow: (workflow: Partial<Workflow>) => Promise<void>;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflows: [],
  currentWorkflow: null,
  loading: false,

  fetchWorkflows: async () => {
    set({ loading: true });
    try {
      // TODO: 实际的API调用
      // 模拟数据
      const mockWorkflows: Workflow[] = [
        {
          id: '1',
          name: '自动发送日报',
          description: '每日自动生成报表并发送邮件',
          category: '办公自动化',
          tags: ['日报', '邮件'],
          status: 'published',
          nodes: [],
          edges: [],
          version: '1.0.0',
          createdAt: '2025-11-06T10:00:00Z',
          updatedAt: '2025-11-08T14:00:00Z',
          executionCount: 12,
          successRate: 95,
        },
      ];
      set({ workflows: mockWorkflows });
    } finally {
      set({ loading: false });
    }
  },

  setCurrentWorkflow: (workflow) => {
    set({ currentWorkflow: workflow });
  },

  createWorkflow: async (workflow) => {
    // TODO: 实际的API调用
    const newWorkflow: Workflow = {
      id: Date.now().toString(),
      name: workflow.name || '新工作流',
      description: workflow.description || '',
      category: workflow.category || '未分类',
      tags: workflow.tags || [],
      status: 'draft',
      nodes: workflow.nodes || [],
      edges: workflow.edges || [],
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executionCount: 0,
      successRate: 0,
    };

    set((state) => ({
      workflows: [...state.workflows, newWorkflow],
    }));
  },

  updateWorkflow: async (id, updates) => {
    set((state) => ({
      workflows: state.workflows.map((wf) =>
        wf.id === id ? { ...wf, ...updates, updatedAt: new Date().toISOString() } : wf
      ),
    }));
  },

  deleteWorkflow: async (id) => {
    set((state) => ({
      workflows: state.workflows.filter((wf) => wf.id !== id),
    }));
  },
}));
