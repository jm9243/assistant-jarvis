import { create } from 'zustand';
import type { IExecutionRun, ExecutionLog, IWorkflow, Status } from '@/types';
import { executionService } from '@/services/execution';

interface ExecutionState {
  runs: IExecutionRun[];
  logs: ExecutionLog[];
  selectedRunId: string | null;
  filter: 'all' | Status;
  loading: boolean;
  error?: string;
  templates: Record<string, Array<{ id: string; name: string; params: Record<string, unknown>; created_at: string }>>;
  hydrate: () => Promise<void>;
  selectRun: (runId: string) => void;
  startRun: (workflow: IWorkflow, params?: Record<string, unknown>, priority?: 'high' | 'medium' | 'low') => Promise<void>;
  pauseRun: (runId: string) => Promise<void>;
  resumeRun: (runId: string) => Promise<void>;
  cancelRun: (runId: string) => Promise<void>;
  loadTemplates: (workflowId: string) => Promise<void>;
  saveTemplate: (workflowId: string, payload: { name: string; params: Record<string, unknown> }) => Promise<void>;
}

const isRunPayload = (payload: ExecutionLog | IExecutionRun): payload is IExecutionRun => {
  return (payload as IExecutionRun).workflowId !== undefined || (payload as { workflow_id?: string }).workflow_id !== undefined;
};

const normalizeRun = (run: IExecutionRun | (IExecutionRun & { workflow_id?: string; workflow_name?: string; started_at?: string; finished_at?: string; current_node?: string })) => ({
  ...run,
  workflowId: run.workflowId ?? (run as { workflow_id?: string }).workflow_id ?? '',
  workflowName: run.workflowName ?? (run as { workflow_name?: string }).workflow_name ?? '工作流',
  startedAt: run.startedAt ?? (run as { started_at?: string }).started_at ?? '',
  finishedAt: run.finishedAt ?? (run as { finished_at?: string }).finished_at,
  currentNode: run.currentNode ?? (run as { current_node?: string }).current_node,
});

export const useExecutionStore = create<ExecutionState>((set) => ({
  runs: [],
  logs: [],
  selectedRunId: null,
  filter: 'all',
  loading: false,
  templates: {},
  async hydrate() {
    set({ loading: true });
    const result = await executionService.list();
    if (result.success && result.data) {
      set({ runs: (result.data as IExecutionRun[]).map(normalizeRun), loading: false });
    } else {
      set({ loading: false, error: result.error ?? '无法获取执行记录' });
    }
    executionService.connect((event) => {
      if (isRunPayload(event)) {
        set((state) => ({
          runs: state.runs.some((run) => run.id === event.id)
            ? state.runs.map((run) => (run.id === event.id ? normalizeRun(event) : run))
            : [normalizeRun(event), ...state.runs].slice(0, 20),
        }));
      } else {
        set((state) => ({ logs: [...state.logs, event] }));
      }
    });
  },
  selectRun(runId) {
    set({ selectedRunId: runId, logs: [] });
    executionService.logs(runId).then((result) => {
      if (result.success && result.data) {
        set({ logs: result.data });
      }
    });
  },
  async startRun(workflow, params, priority) {
    set({ loading: true });
    const result = await executionService.start(workflow, params ?? {}, priority);
    if (!result.success) {
      set({ loading: false, error: result.error ?? '执行失败' });
      return;
    }
    set({ loading: false });
  },
  async pauseRun(runId) {
    await executionService.pause(runId);
  },
  async resumeRun(runId) {
    await executionService.resume(runId);
  },
  async cancelRun(runId) {
    await executionService.cancel(runId);
  },
  async loadTemplates(workflowId) {
    const response = await executionService.templates(workflowId);
    if (response.success && response.data) {
      set((state) => ({
        templates: {
          ...state.templates,
          [workflowId]: response.data as Array<{ id: string; name: string; params: Record<string, unknown>; created_at: string }>,
        },
      }));
    }
  },
  async saveTemplate(workflowId, payload) {
    const response = await executionService.saveTemplate(workflowId, payload);
    if (response.success && response.data) {
      set((state) => ({
        templates: {
          ...state.templates,
          [workflowId]: [response.data as { id: string; name: string; params: Record<string, unknown>; created_at: string }, ...(state.templates[workflowId] ?? [])],
        },
      }));
    }
  },
}));
