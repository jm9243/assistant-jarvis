/**
 * 工作流状态管理
 */
import { create } from 'zustand';
import type { IWorkflow, INode, IEdge } from '@/types';

interface WorkflowStore {
  workflows: IWorkflow[];
  currentWorkflow: IWorkflow | null;
  selectedNodeId: string | null;
  history: IWorkflow[];
  historyIndex: number;
  setWorkflows: (workflows: IWorkflow[]) => void;
  addWorkflow: (workflow: IWorkflow) => void;
  updateWorkflow: (id: string, updates: Partial<IWorkflow>) => void;
  deleteWorkflow: (id: string) => void;
  setCurrentWorkflow: (workflow: IWorkflow | null) => void;
  ensureWorkflow: () => IWorkflow;
  setSelectedNode: (id: string | null) => void;
  setNodes: (nodes: INode[]) => void;
  setEdges: (edges: IEdge[]) => void;
  addNode: (node: INode) => void;
  updateNode: (id: string, updates: Partial<INode>) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: IEdge) => void;
  deleteEdge: (id: string) => void;
  undo: () => void;
  redo: () => void;
}

const createEmptyWorkflow = (): IWorkflow => ({
  id: `workflow-${Date.now().toString(36)}`,
  name: '未命名工作流',
  description: '自动生成的工作流草稿',
  version: '1.0.0',
  nodes: [],
  edges: [],
  variables: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const mergeWorkflowList = (collection: IWorkflow[], workflow: IWorkflow) => {
  if (collection.some((w) => w.id === workflow.id)) {
    return collection.map((w) => (w.id === workflow.id ? workflow : w));
  }
  return [...collection, workflow];
};

const pushHistory = (workflow: IWorkflow, state: WorkflowStore) => {
  const snapshot = JSON.parse(JSON.stringify(workflow)) as IWorkflow;
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(snapshot);
  return { history: newHistory, historyIndex: newHistory.length - 1 };
};

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  workflows: [],
  currentWorkflow: null,
  selectedNodeId: null,
  history: [],
  historyIndex: -1,

  setWorkflows: (workflows) => set({ workflows }),

  addWorkflow: (workflow) =>
    set((state) => ({
      workflows: [...state.workflows, workflow],
    })),

  updateWorkflow: (id, updates) =>
    set((state) => {
      const target = state.workflows.find((w) => w.id === id);
      const updatedWorkflow = target ? { ...target, ...updates, updated_at: new Date().toISOString() } : null;
      const patchedWorkflows = state.workflows.map((w) =>
        w.id === id ? (updatedWorkflow as IWorkflow) : w,
      );
      const historyUpdates =
        state.currentWorkflow && state.currentWorkflow.id === id
          ? pushHistory(updatedWorkflow as IWorkflow, state)
          : {};
      return {
        workflows: patchedWorkflows,
        currentWorkflow:
          state.currentWorkflow?.id === id ? (updatedWorkflow as IWorkflow) : state.currentWorkflow,
        ...historyUpdates,
      };
    }),

  deleteWorkflow: (id) =>
    set((state) => ({
      workflows: state.workflows.filter((w) => w.id !== id),
      currentWorkflow:
        state.currentWorkflow?.id === id ? null : state.currentWorkflow,
    })),

  setCurrentWorkflow: (workflow) =>
    set((state) => ({
      currentWorkflow: workflow,
      selectedNodeId: null,
      history: workflow ? [JSON.parse(JSON.stringify(workflow))] : [],
      historyIndex: workflow ? 0 : -1,
      workflows: workflow
        ? state.workflows.some((w) => w.id === workflow.id)
          ? state.workflows.map((w) => (w.id === workflow.id ? workflow : w))
          : [...state.workflows, workflow]
        : state.workflows,
    })),

  ensureWorkflow: () => {
    const state = get();
    if (state.currentWorkflow) return state.currentWorkflow;
    const workflow = createEmptyWorkflow();
    set({
      currentWorkflow: workflow,
      workflows: [workflow],
      history: [JSON.parse(JSON.stringify(workflow))],
      historyIndex: 0,
    });
    return workflow;
  },

  setSelectedNode: (id) => set({ selectedNodeId: id }),

  setNodes: (nodes) =>
    set((state) => {
      if (!state.currentWorkflow) return state;
      const updated = { ...state.currentWorkflow, nodes, updated_at: new Date().toISOString() };
      return {
        currentWorkflow: updated,
        workflows: mergeWorkflowList(state.workflows, updated),
        ...pushHistory(updated, state),
      };
    }),

  setEdges: (edges) =>
    set((state) => {
      if (!state.currentWorkflow) return state;
      const updated = { ...state.currentWorkflow, edges, updated_at: new Date().toISOString() };
      return {
        currentWorkflow: updated,
        workflows: mergeWorkflowList(state.workflows, updated),
        ...pushHistory(updated, state),
      };
    }),

  addNode: (node) =>
    set((state) => {
      if (!state.currentWorkflow) return state;
      const updated = {
        ...state.currentWorkflow,
        nodes: [...state.currentWorkflow.nodes, node],
        updated_at: new Date().toISOString(),
      };
      return {
        currentWorkflow: updated,
        workflows: mergeWorkflowList(state.workflows, updated),
        ...pushHistory(updated, state),
      };
    }),

  updateNode: (id, updates) =>
    set((state) => {
      if (!state.currentWorkflow) return state;
      const updated = {
        ...state.currentWorkflow,
        nodes: state.currentWorkflow.nodes.map((n) =>
          n.id === id ? { ...n, ...updates } : n,
        ),
        updated_at: new Date().toISOString(),
      };
      return {
        currentWorkflow: updated,
        workflows: mergeWorkflowList(state.workflows, updated),
        ...pushHistory(updated, state),
      };
    }),

  deleteNode: (id) =>
    set((state) => {
      if (!state.currentWorkflow) return state;
      const updated = {
        ...state.currentWorkflow,
        nodes: state.currentWorkflow.nodes.filter((n) => n.id !== id),
        edges: state.currentWorkflow.edges.filter(
          (e) => e.source !== id && e.target !== id,
        ),
        updated_at: new Date().toISOString(),
      };
      return {
        currentWorkflow: updated,
        workflows: mergeWorkflowList(state.workflows, updated),
        selectedNodeId:
          state.selectedNodeId === id ? null : state.selectedNodeId,
        ...pushHistory(updated, state),
      };
    }),

  addEdge: (edge) =>
    set((state) => {
      if (!state.currentWorkflow) return state;
      const updated = {
        ...state.currentWorkflow,
        edges: [...state.currentWorkflow.edges, edge],
        updated_at: new Date().toISOString(),
      };
      return {
        currentWorkflow: updated,
        workflows: mergeWorkflowList(state.workflows, updated),
        ...pushHistory(updated, state),
      };
    }),

  deleteEdge: (id) =>
    set((state) => {
      if (!state.currentWorkflow) return state;
      const updated = {
        ...state.currentWorkflow,
        edges: state.currentWorkflow.edges.filter((e) => e.id !== id),
        updated_at: new Date().toISOString(),
      };
      return {
        currentWorkflow: updated,
        workflows: mergeWorkflowList(state.workflows, updated),
        ...pushHistory(updated, state),
      };
    }),

  undo: () =>
    set((state) => {
      if (state.historyIndex <= 0) return state;
      const prevIndex = state.historyIndex - 1;
      const snapshot = state.history[prevIndex];
      return {
        historyIndex: prevIndex,
        currentWorkflow: snapshot,
        workflows: mergeWorkflowList(state.workflows, snapshot),
      };
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;
      const nextIndex = state.historyIndex + 1;
      const snapshot = state.history[nextIndex];
      return {
        historyIndex: nextIndex,
        currentWorkflow: snapshot,
        workflows: mergeWorkflowList(state.workflows, snapshot),
      };
    }),
}));
