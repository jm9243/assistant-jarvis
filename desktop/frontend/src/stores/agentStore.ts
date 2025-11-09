import { create } from 'zustand';
import type { IAgent, IAgentTemplate, IAgentSession, IAgentMessage, IAgentMemory } from '@/types';
import { agentAPI } from '@/services/api';

interface AgentState {
  agents: IAgent[];
  templates: IAgentTemplate[];
  sessions: IAgentSession[];
  activeAgentId: string | null;
  chatLog: IAgentMessage[];
  loading: boolean;
  error?: string;
  hydrate: () => Promise<void>;
  selectAgent: (agentId: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  createAgent: (payload: Record<string, unknown>) => Promise<void>;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  templates: [],
  sessions: [],
  activeAgentId: null,
  chatLog: [],
  loading: false,
  async hydrate() {
    set({ loading: true });
    const [agentRes, templateRes] = await Promise.all([agentAPI.list(), agentAPI.templates()]);
    if (agentRes.success && templateRes.success) {
      set({
        agents: agentRes.data ?? [],
        templates: templateRes.data ?? [],
        loading: false,
      });
    } else {
      set({ loading: false, error: agentRes.error ?? templateRes.error ?? 'Failed to load agents' });
    }
  },
  async selectAgent(agentId: string) {
    set({ activeAgentId: agentId, chatLog: [] });
    const [sessionRes, memoryRes] = await Promise.all([
      agentAPI.sessions(agentId),
      agentAPI.memories(agentId),
    ]);
    if (sessionRes.success) {
      set({ sessions: sessionRes.data ?? [] });
    }
    if (memoryRes.success) {
      set((state) => ({
        chatLog: [
          ...state.chatLog,
          ...((memoryRes.data as IAgentMemory[]) ?? []).map((memory) => ({
            role: 'system',
            content: `记忆：${memory.content}`,
            timestamp: memory.created_at,
          })),
        ],
      }));
    }
  },
  async sendMessage(message: string) {
    const agentId = get().activeAgentId;
    if (!agentId) return;
    set((state) => ({
      chatLog: [
        ...state.chatLog,
        { role: 'user', content: message, timestamp: new Date().toISOString() },
      ],
    }));
    const response = await agentAPI.chat(agentId, { message });
    if (response.success && response.data) {
      const reply = response.data.reply as IAgentMessage;
      set((state) => {
        const session = response.data.session as IAgentSession | undefined;
        return {
          chatLog: [...state.chatLog, reply],
          sessions: session
            ? [session, ...state.sessions.filter((item) => item.id !== session.id)]
            : state.sessions,
        };
      });
    }
  },
  async createAgent(payload) {
    const result = await agentAPI.create(payload);
    if (result.success && result.data) {
      set((state) => ({ agents: [...state.agents, result.data as IAgent] }));
    }
  },
}));
