import { workflowAPI, request } from '@/services/api';
import type { IExecutionRun, ExecutionLog, IWorkflow } from '@/types';

const WS_BASE = import.meta.env.VITE_ENGINE_WS_URL ?? 'ws://localhost:8000';

export const executionService = {
  start: (workflow: IWorkflow, params: Record<string, unknown> = {}, priority: 'high' | 'medium' | 'low' = 'medium') =>
    workflowAPI.execute({ ...workflow, variables: { ...workflow.variables } }, params, priority),
  list: () => request<IExecutionRun[]>('/workflow/runs'),
  logs: (runId: string) => request<ExecutionLog[]>(`/workflow/${runId}/logs`),
  pause: (runId: string) => workflowAPI.pause(runId),
  resume: (runId: string) => workflowAPI.resume(runId),
  cancel: (runId: string) => workflowAPI.cancel(runId),
  templates: (workflowId: string) => workflowAPI.templates(workflowId),
  saveTemplate: (workflowId: string, payload: { name: string; params: Record<string, unknown> }) =>
    workflowAPI.createTemplate(workflowId, payload),
  connect: (onEvent: (data: ExecutionLog | IExecutionRun) => void) => {
    const socket = new WebSocket(`${WS_BASE}/api/workflow/ws`);
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as ExecutionLog | IExecutionRun;
        onEvent(payload);
      } catch (error) {
        console.warn('[executionService] WS parse error', error);
      }
    };
    return () => socket.close();
  },
};
