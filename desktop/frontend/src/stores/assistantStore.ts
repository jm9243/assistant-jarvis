import { create } from 'zustand';
import type { IAssistantTask } from '@/types';
import { assistantAPI } from '@/services/api';

interface AssistantState {
  tasks: IAssistantTask[];
  activeTask: IAssistantTask | null;
  loading: boolean;
  hydrate: () => Promise<void>;
  plan: (query: string) => Promise<void>;
  complete: (taskId: string, summary: string) => Promise<void>;
}

export const useAssistantStore = create<AssistantState>((set) => ({
  tasks: [],
  activeTask: null,
  loading: false,
  async hydrate() {
    const response = await assistantAPI.tasks();
    if (response.success && response.data) {
      set({ tasks: response.data as IAssistantTask[] });
    }
  },
  async plan(query) {
    set({ loading: true });
    const response = await assistantAPI.plan(query);
    if (response.success && response.data) {
      const task = response.data as IAssistantTask;
      set((state) => ({
        tasks: [task, ...state.tasks],
        activeTask: task,
        loading: false,
      }));
    } else {
      set({ loading: false });
    }
  },
  async complete(taskId, summary) {
    await assistantAPI.complete(taskId, summary);
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, status: 'completed', result_summary: summary } : task,
      ),
      activeTask: state.activeTask?.id === taskId ? { ...state.activeTask, status: 'completed', result_summary: summary } : state.activeTask,
    }));
  },
}));
