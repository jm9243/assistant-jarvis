import { create } from 'zustand';
import { IWorkflow, INode, IEdge } from '@/types';
import { apiService } from '@/services/api';
import { v4 as uuidv4 } from 'uuid';

interface WorkflowStore {
  workflows: IWorkflow[];
  currentWorkflow: IWorkflow | null;
  isDirty: boolean;
  isLoading: boolean;

  // 工作流管理
  loadWorkflows: () => Promise<void>;
  loadWorkflow: (id: string) => Promise<void>;
  createWorkflow: (name: string, description?: string) => Promise<void>;
  saveWorkflow: () => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  setCurrentWorkflow: (workflow: IWorkflow | null) => void;

  // 节点操作
  addNode: (node: Omit<INode, 'id'>) => void;
  updateNode: (id: string, updates: Partial<INode>) => void;
  deleteNode: (id: string) => void;

  // 连线操作
  addEdge: (edge: Omit<IEdge, 'id'>) => void;
  deleteEdge: (id: string) => void;

  // 变量操作
  setVariable: (key: string, value: any) => void;
  deleteVariable: (key: string) => void;

  // 撤销/重做
  undo: () => void;
  redo: () => void;

  // 导入/导出
  importWorkflow: (data: string) => void;
  exportWorkflow: () => string;
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  workflows: [],
  currentWorkflow: null,
  isDirty: false,
  isLoading: false,

  loadWorkflows: async () => {
    set({ isLoading: true });
    try {
      const result = await apiService.getWorkflows();
      if (result.success && result.data) {
        set({ workflows: result.data });
      }
    } catch (error) {
      console.error('Failed to load workflows:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  loadWorkflow: async (id: string) => {
    set({ isLoading: true });
    try {
      const result = await apiService.getWorkflow(id);
      if (result.success && result.data) {
        set({ currentWorkflow: result.data, isDirty: false });
      }
    } catch (error) {
      console.error('Failed to load workflow:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createWorkflow: async (name: string, description?: string) => {
    const newWorkflow: IWorkflow = {
      id: uuidv4(),
      name,
      description,
      version: '1.0.0',
      nodes: [],
      edges: [],
      variables: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set({ currentWorkflow: newWorkflow, isDirty: true });
  },

  saveWorkflow: async () => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    set({ isLoading: true });
    try {
      const isNew = !get().workflows.find((w) => w.id === currentWorkflow.id);

      if (isNew) {
        const result = await apiService.createWorkflow(currentWorkflow);
        if (result.success && result.data) {
          set((state) => ({
            workflows: [...state.workflows, result.data!],
            currentWorkflow: result.data,
            isDirty: false,
          }));
        }
      } else {
        const result = await apiService.updateWorkflow(currentWorkflow.id, currentWorkflow);
        if (result.success && result.data) {
          set((state) => ({
            workflows: state.workflows.map((w) => (w.id === currentWorkflow.id ? result.data! : w)),
            currentWorkflow: result.data,
            isDirty: false,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  deleteWorkflow: async (id: string) => {
    try {
      const result = await apiService.deleteWorkflow(id);
      if (result.success) {
        set((state) => ({
          workflows: state.workflows.filter((w) => w.id !== id),
          currentWorkflow: state.currentWorkflow?.id === id ? null : state.currentWorkflow,
        }));
      }
    } catch (error) {
      console.error('Failed to delete workflow:', error);
    }
  },

  setCurrentWorkflow: (workflow: IWorkflow | null) => {
    set({ currentWorkflow: workflow, isDirty: false });
  },

  addNode: (node: Omit<INode, 'id'>) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    const newNode: INode = {
      ...node,
      id: uuidv4(),
    };

    set({
      currentWorkflow: {
        ...currentWorkflow,
        nodes: [...currentWorkflow.nodes, newNode],
        updated_at: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  updateNode: (id: string, updates: Partial<INode>) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    set({
      currentWorkflow: {
        ...currentWorkflow,
        nodes: currentWorkflow.nodes.map((node) => (node.id === id ? { ...node, ...updates } : node)),
        updated_at: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  deleteNode: (id: string) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    set({
      currentWorkflow: {
        ...currentWorkflow,
        nodes: currentWorkflow.nodes.filter((node) => node.id !== id),
        edges: currentWorkflow.edges.filter((edge) => edge.source !== id && edge.target !== id),
        updated_at: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  addEdge: (edge: Omit<IEdge, 'id'>) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    const newEdge: IEdge = {
      ...edge,
      id: uuidv4(),
    };

    set({
      currentWorkflow: {
        ...currentWorkflow,
        edges: [...currentWorkflow.edges, newEdge],
        updated_at: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  deleteEdge: (id: string) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    set({
      currentWorkflow: {
        ...currentWorkflow,
        edges: currentWorkflow.edges.filter((edge) => edge.id !== id),
        updated_at: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  setVariable: (key: string, value: any) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    set({
      currentWorkflow: {
        ...currentWorkflow,
        variables: {
          ...currentWorkflow.variables,
          [key]: value,
        },
        updated_at: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  deleteVariable: (key: string) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [key]: _, ...rest } = currentWorkflow.variables;

    set({
      currentWorkflow: {
        ...currentWorkflow,
        variables: rest,
        updated_at: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  undo: () => {
    // TODO: 实现撤销逻辑
    console.log('Undo not implemented yet');
  },

  redo: () => {
    // TODO: 实现重做逻辑
    console.log('Redo not implemented yet');
  },

  importWorkflow: (data: string) => {
    try {
      const workflow = JSON.parse(data) as IWorkflow;
      set({ currentWorkflow: workflow, isDirty: true });
    } catch (error) {
      console.error('Failed to import workflow:', error);
    }
  },

  exportWorkflow: () => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return '';
    return JSON.stringify(currentWorkflow, null, 2);
  },
}));
