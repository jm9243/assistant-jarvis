/**
 * HTTP API服务
 */
import type { IWorkflow, IResult } from '@/types';
import { secureStorage, AUTH_TOKEN_KEY } from '@/services/security';

const API_BASE_URL =
  import.meta.env.VITE_ENGINE_API_URL ?? 'http://localhost:8000/api';

interface RequestConfig {
  skipAuth?: boolean;
}

/**
 * 通用请求方法
 */
export async function request<T>(
  endpoint: string,
  options?: RequestInit,
  config?: RequestConfig,
): Promise<IResult<T>> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> | undefined),
    };

    if (!config?.skipAuth) {
      const token = await secureStorage.get(AUTH_TOKEN_KEY);
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 工作流API
 */
export const workflowAPI = {
  execute: (workflow: IWorkflow, params: Record<string, unknown> = {}, priority: 'high' | 'medium' | 'low' = 'medium') =>
    request('/workflow/execute', {
      method: 'POST',
      body: JSON.stringify({ workflow, params, priority }),
    }),
  pause: (runId: string) => request(`/workflow/runs/${runId}/pause`, { method: 'POST' }),
  resume: (runId: string) => request(`/workflow/runs/${runId}/resume`, { method: 'POST' }),
  cancel: (runId: string) => request(`/workflow/runs/${runId}/cancel`, { method: 'POST' }),
  templates: (workflowId: string) => request(`/workflow/${workflowId}/templates`),
  createTemplate: (workflowId: string, payload: { name: string; params: Record<string, unknown> }) =>
    request(`/workflow/${workflowId}/templates`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  triggers: (workflowId: string) => request(`/workflow/${workflowId}/triggers`),
  createTrigger: (workflowId: string, payload: { type: string; config: Record<string, unknown>; enabled?: boolean }) =>
    request(`/workflow/${workflowId}/triggers`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

/**
 * Agent API
 */
export const agentAPI = {
  list: () => request('/agent'),
  templates: () => request('/agent/templates'),
  create: (payload: Record<string, unknown>) =>
    request('/agent', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (agentId: string, payload: Record<string, unknown>) =>
    request(`/agent/${agentId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  delete: (agentId: string) => request(`/agent/${agentId}`, { method: 'DELETE' }),
  sessions: (agentId: string) => request(`/agent/${agentId}/sessions`),
  memories: (agentId: string) => request(`/agent/${agentId}/memories`),
  chat: (agentId: string, payload: { message: string; session_id?: string; title?: string }) =>
    request(`/agent/${agentId}/chat`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const knowledgeAPI = {
  bases: () => request('/knowledge/bases'),
  createBase: (payload: Record<string, unknown>) =>
    request('/knowledge/bases', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  documents: (baseId: string) => request(`/knowledge/bases/${baseId}/documents`),
  uploadDocument: (baseId: string, payload: { name: string; content: string; mime?: string }) =>
    request(`/knowledge/bases/${baseId}/documents`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  search: (payload: { base_ids: string[]; query: string; top_k?: number }) =>
    request('/knowledge/search', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const voiceAPI = {
  devices: () => request('/voice/devices'),
  configure: (payload: Record<string, string>) =>
    request('/voice/devices', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  status: () => request('/voice/status'),
  calls: () => request('/voice/calls'),
  startCall: (payload: { contact: string; channel?: string }) =>
    request('/voice/calls', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  finishCall: (callId: string, payload: { reason: string; summary?: string; tags?: string[] }) =>
    request(`/voice/calls/${callId}/finish`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  transcript: (callId: string, payload: { role: string; content: string }) =>
    request(`/voice/calls/${callId}/transcript`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  test: () => request('/voice/tests/audio', { method: 'POST' }),
};

export const toolsAPI = {
  list: () => request('/tools'),
  create: (payload: Record<string, unknown>) =>
    request('/tools', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (toolId: string, payload: Record<string, unknown>) =>
    request(`/tools/${toolId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  delete: (toolId: string) => request(`/tools/${toolId}`, { method: 'DELETE' }),
  approvals: () => request('/tools/approvals'),
  requestApproval: (toolId: string, payload: Record<string, unknown>) =>
    request(`/tools/${toolId}/approval`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  reviewApproval: (approvalId: string, payload: Record<string, unknown>) =>
    request(`/tools/approvals/${approvalId}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  audits: () => request('/tools/audits'),
  recordAudit: (payload: Record<string, unknown>) =>
    request('/tools/audits', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  kpi: () => request('/tools/kpi'),
};

export const assistantAPI = {
  tasks: () => request('/assistant/tasks'),
  plan: (query: string) =>
    request('/assistant/plan', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
  updateStep: (taskId: string, stepId: string, payload: Record<string, unknown>) =>
    request(`/assistant/tasks/${taskId}/steps/${stepId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  complete: (taskId: string, summary: string) =>
    request(`/assistant/tasks/${taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ summary }),
    }),
};

export const multiAgentAPI = {
  orchestrations: () => request('/multi-agent/orchestrations'),
  createOrchestration: (payload: Record<string, unknown>) =>
    request('/multi-agent/orchestrations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  meetings: () => request('/multi-agent/meetings'),
  startMeeting: (payload: Record<string, unknown>) =>
    request('/multi-agent/meetings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  recordTurn: (meetingId: string, payload: Record<string, unknown>) =>
    request(`/multi-agent/meetings/${meetingId}/turns`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const mcpAPI = {
  servers: () => request('/mcp/servers'),
  registerServer: (payload: Record<string, unknown>) =>
    request('/mcp/servers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  registerWorkflow: (payload: Record<string, unknown>) =>
    request('/mcp/tools/workflow', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const remoteAPI = {
  command: (payload: Record<string, unknown>) =>
    request('/remote/command', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

/**
 * 录制器API
 */
export const recorderAPI = {
  start: (payload?: Record<string, unknown>) =>
    request('/recorder/start', {
      method: 'POST',
      body: JSON.stringify(payload ?? {}),
    }),
  stop: <T = unknown>() => request<T>('/recorder/stop', { method: 'POST' }),
};

/**
 * 系统API
 */
export const systemAPI = {
  getInfo: <T = unknown>() => request<T>('/system/info'),
  getStatus: <T = unknown>() => request<T>('/system/status'),
  scan: <T = unknown>() =>
    request<T>('/system/scan', {
      method: 'POST',
    }),
  notifications: () => request('/system/notifications'),
  pushNotification: (payload: Record<string, unknown>) =>
    request('/system/notifications', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  markNotification: (id: string) =>
    request(`/system/notifications/${id}/read`, {
      method: 'POST',
    }),
  downloads: () => request('/system/downloads'),
  trackDownload: (payload: Record<string, unknown>) =>
    request('/system/downloads', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  checkUpdate: () => request('/system/updates/check'),
};
