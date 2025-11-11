import { create } from 'zustand';
import { RecordedStep, UIElement, Rect } from '@/types';
import { engineApi } from '@/services/engineApi';
import { wsService } from '@/services/websocket';

interface RecorderStore {
  isRecording: boolean;
  isPaused: boolean;
  mode: 'auto' | 'manual';
  steps: RecordedStep[];
  currentElement: UIElement | null;
  highlightRect: Rect | null;

  // 录制控制
  startRecording: (mode?: 'auto' | 'manual') => Promise<void>;
  stopRecording: () => Promise<{ nodes: any[] } | null>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;

  // 元素高亮
  setHighlightRect: (rect: Rect | null) => void;
  setCurrentElement: (element: UIElement | null) => void;

  // 步骤管理
  addStep: (step: RecordedStep) => void;
  removeStep: (id: string) => void;
  clearSteps: () => void;

  // WebSocket订阅
  subscribeToRecorder: () => () => void;
}

export const useRecorderStore = create<RecorderStore>((set, get) => ({
  isRecording: false,
  isPaused: false,
  mode: 'auto',
  steps: [],
  currentElement: null,
  highlightRect: null,

  startRecording: async (mode: 'auto' | 'manual' = 'auto') => {
    try {
      const result = await engineApi.startRecording(mode);
      if (result.success) {
        set({
          isRecording: true,
          isPaused: false,
          mode,
          steps: [],
        });

        // 订阅WebSocket事件
        get().subscribeToRecorder();
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  },

  stopRecording: async () => {
    try {
      const result = await engineApi.stopRecording();
      if (result.success) {
        set({
          isRecording: false,
          isPaused: false,
          highlightRect: null,
          currentElement: null,
        });
        return result.data || null;
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
    return null;
  },

  pauseRecording: async () => {
    try {
      await engineApi.pauseRecording();
      set({ isPaused: true });
    } catch (error) {
      console.error('Failed to pause recording:', error);
    }
  },

  resumeRecording: async () => {
    try {
      await engineApi.resumeRecording();
      set({ isPaused: false });
    } catch (error) {
      console.error('Failed to resume recording:', error);
    }
  },

  setHighlightRect: (rect: Rect | null) => {
    set({ highlightRect: rect });
  },

  setCurrentElement: (element: UIElement | null) => {
    set({ currentElement: element });
  },

  addStep: (step: RecordedStep) => {
    set((state) => ({
      steps: [...state.steps, step],
    }));
  },

  removeStep: (id: string) => {
    set((state) => ({
      steps: state.steps.filter((s) => s.id !== id),
    }));
  },

  clearSteps: () => {
    set({ steps: [] });
  },

  subscribeToRecorder: () => {
    // 订阅元素高亮事件
    const unsubHighlight = wsService.on('element_highlight', (data: { rect: Rect; element: UIElement }) => {
      set({
        highlightRect: data.rect,
        currentElement: data.element,
      });
    });

    // 订阅录制步骤事件
    const unsubStep = wsService.on('recorder_step', (data: RecordedStep) => {
      get().addStep(data);
    });

    // 订阅录制状态事件
    const unsubStatus = wsService.on('recorder_status', (data: { status: string }) => {
      if (data.status === 'stopped') {
        set({
          isRecording: false,
          isPaused: false,
          highlightRect: null,
          currentElement: null,
        });
      }
    });

    // 返回取消订阅函数
    return () => {
      unsubHighlight();
      unsubStep();
      unsubStatus();
    };
  },
}));
