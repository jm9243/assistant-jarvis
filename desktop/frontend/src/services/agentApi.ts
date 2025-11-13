/**
 * Agent API服务
 * 使用 Tauri IPC 与 Python Engine 通信
 */
import { invoke } from '@tauri-apps/api/core';
import type {
  AgentConfig,
  AgentCreateRequest,
  AgentUpdateRequest,
} from '../types/agent';

// 重新导出其他 API 服务
export { knowledgeBaseApi } from './knowledgeBaseApi';
export { toolApi } from './toolApi';

/**
 * Agent管理API
 */
export const agentApi = {
  // 创建Agent
  async createAgent(data: AgentCreateRequest): Promise<AgentConfig> {
    const result = await invoke<any>('create_agent', {
      name: data.name,
      description: data.description,
      agentType: data.type,
      llmConfig: data.llm_config,
      systemPrompt: data.system_prompt,
      knowledgeBaseIds: data.knowledge_base_ids,
      toolIds: data.tool_ids,
      userId: null,
    });
    if (result.success) {
      return result.agent;
    }
    throw new Error(result.error || 'Failed to create agent');
  },

  // 获取Agent列表
  async listAgents(params?: {
    user_id?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: AgentConfig[]; total: number }> {
    const result = await invoke<any>('list_agents', {
      userId: params?.user_id,
      agentType: params?.type,
      limit: params?.limit,
      offset: params?.offset,
    });
    if (result.success) {
      return {
        items: result.items || [],
        total: result.total || 0,
      };
    }
    throw new Error(result.error || 'Failed to list agents');
  },

  // 获取Agent详情
  async getAgent(agentId: string): Promise<AgentConfig> {
    const result = await invoke<any>('get_agent', { agentId });
    if (result.success) {
      return result.agent;
    }
    throw new Error(result.error || 'Failed to get agent');
  },

  // 更新Agent
  async updateAgent(
    agentId: string,
    data: AgentUpdateRequest
  ): Promise<AgentConfig> {
    const result = await invoke<any>('update_agent', {
      agentId,
      name: data.name,
      description: data.description,
      llmConfig: data.llm_config,
      systemPrompt: data.system_prompt,
      knowledgeBaseIds: data.knowledge_base_ids,
      toolIds: data.tool_ids,
    });
    if (result.success) {
      return result.agent;
    }
    throw new Error(result.error || 'Failed to update agent');
  },

  // 删除Agent
  async deleteAgent(agentId: string): Promise<void> {
    const result = await invoke<any>('delete_agent', { agentId });
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete agent');
    }
  },
};

/**
 * Jarvis AI 助理 API (占位符)
 * TODO: 需要实现
 */
export const jarvisApi = {
  async processQuery(_data: { query: string; context?: Record<string, any> }): Promise<any> {
    throw new Error('Jarvis API not implemented yet');
  },

  async executePlan(_data: { plan_id: string; approved: boolean }): Promise<any> {
    throw new Error('Jarvis API not implemented yet');
  },

  async cancelExecution(_executionId: string): Promise<void> {
    throw new Error('Jarvis API not implemented yet');
  },

  async getExecutionHistory(_params?: { limit?: number; offset?: number }): Promise<any[]> {
    throw new Error('Jarvis API not implemented yet');
  },
};
