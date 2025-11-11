/**
 * Agent状态管理
 */
import { create } from "zustand";
import type { AgentConfig, AgentCreateRequest, AgentUpdateRequest } from "../types/agent";
import { agentApi } from "../services/agentApi";

interface AgentState {
  // 状态
  agents: AgentConfig[];
  currentAgent: AgentConfig | null;
  loading: boolean;
  error: string | null;

  // 操作
  fetchAgents: (params?: { type?: string; limit?: number; offset?: number }) => Promise<void>;
  fetchAgent: (agentId: string) => Promise<void>;
  createAgent: (data: AgentCreateRequest) => Promise<AgentConfig>;
  updateAgent: (agentId: string, data: AgentUpdateRequest) => Promise<void>;
  deleteAgent: (agentId: string) => Promise<void>;
  setCurrentAgent: (agent: AgentConfig | null) => void;
  clearError: () => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  // 初始状态
  agents: [],
  currentAgent: null,
  loading: false,
  error: null,

  // 获取Agent列表
  fetchAgents: async (params) => {
    set({ loading: true, error: null });
    try {
      const response = await agentApi.listAgents(params);
      set({ agents: response.items, loading: false });
    } catch (error: any) {
      set({
        error: error.message || "获取Agent列表失败",
        loading: false,
      });
    }
  },

  // 获取Agent详情
  fetchAgent: async (agentId) => {
    set({ loading: true, error: null });
    try {
      const agent = await agentApi.getAgent(agentId);
      set({ currentAgent: agent, loading: false });
    } catch (error: any) {
      set({
        error: error.message || "获取Agent详情失败",
        loading: false,
      });
    }
  },

  // 创建Agent
  createAgent: async (data) => {
    set({ loading: true, error: null });
    try {
      const agent = await agentApi.createAgent(data);
      set((state) => ({
        agents: [...state.agents, agent],
        loading: false,
      }));
      return agent;
    } catch (error: any) {
      set({
        error: error.message || "创建Agent失败",
        loading: false,
      });
      throw error;
    }
  },

  // 更新Agent
  updateAgent: async (agentId, data) => {
    set({ loading: true, error: null });
    try {
      const updatedAgent = await agentApi.updateAgent(agentId, data);
      set((state) => ({
        agents: state.agents.map((a) =>
          a.id === agentId ? updatedAgent : a
        ),
        currentAgent:
          state.currentAgent?.id === agentId
            ? updatedAgent
            : state.currentAgent,
        loading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || "更新Agent失败",
        loading: false,
      });
      throw error;
    }
  },

  // 删除Agent
  deleteAgent: async (agentId) => {
    set({ loading: true, error: null });
    try {
      await agentApi.deleteAgent(agentId);
      set((state) => ({
        agents: state.agents.filter((a) => a.id !== agentId),
        currentAgent:
          state.currentAgent?.id === agentId ? null : state.currentAgent,
        loading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || "删除Agent失败",
        loading: false,
      });
      throw error;
    }
  },

  // 设置当前Agent
  setCurrentAgent: (agent) => {
    set({ currentAgent: agent });
  },

  // 清除错误
  clearError: () => {
    set({ error: null });
  },
}));
