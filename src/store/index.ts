import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Workflow, Task, UIElement, AgentConfig } from '@types/index';

interface AppState {
  // Workflows
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  addWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  setCurrentWorkflow: (workflow: Workflow | null) => void;

  // Tasks
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  // UI Elements
  elements: UIElement[];
  addElement: (element: UIElement) => void;
  updateElement: (id: string, updates: Partial<UIElement>) => void;
  deleteElement: (id: string) => void;

  // Settings
  agentConfig: AgentConfig;
  updateAgentConfig: (config: Partial<AgentConfig>) => void;

  // UI State
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    devtools((set) => ({
      // Workflows
      workflows: [],
      currentWorkflow: null,
      addWorkflow: (workflow) =>
        set((state) => ({
          workflows: [...state.workflows, workflow],
        })),
      updateWorkflow: (id, updates) =>
        set((state) => ({
          workflows: state.workflows.map((w) => (w.id === id ? { ...w, ...updates } : w)),
          currentWorkflow: state.currentWorkflow?.id === id ? { ...state.currentWorkflow, ...updates } : state.currentWorkflow,
        })),
      deleteWorkflow: (id) =>
        set((state) => ({
          workflows: state.workflows.filter((w) => w.id !== id),
          currentWorkflow: state.currentWorkflow?.id === id ? null : state.currentWorkflow,
        })),
      setCurrentWorkflow: (workflow) => set({ currentWorkflow: workflow }),

      // Tasks
      tasks: [],
      addTask: (task) =>
        set((state) => ({
          tasks: [task, ...state.tasks],
        })),
      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      // UI Elements
      elements: [],
      addElement: (element) =>
        set((state) => ({
          elements: [...state.elements, element],
        })),
      updateElement: (id, updates) =>
        set((state) => ({
          elements: state.elements.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),
      deleteElement: (id) =>
        set((state) => ({
          elements: state.elements.filter((e) => e.id !== id),
        })),

      // Settings
      agentConfig: {
        enabled: false,
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: '',
      },
      updateAgentConfig: (config) =>
        set((state) => ({
          agentConfig: { ...state.agentConfig, ...config },
        })),

      // UI State
      sidebarOpen: true,
      toggleSidebar: () =>
        set((state) => ({
          sidebarOpen: !state.sidebarOpen,
        })),
    })),
    {
      name: 'app-store',
    }
  )
);
