import { create } from 'zustand';
import type { IRecordedStep, RecorderEvent, RecorderStatus } from '@/types';
import { recorderService, connectRecorderEvents, type RecorderMode } from '@/services/recorder';

interface RecorderState {
  status: RecorderStatus;
  mode: RecorderMode;
  overlayVisible: boolean;
  steps: IRecordedStep[];
  hoveredElement?: string;
  error?: string;
  startRecording: (mode: RecorderMode) => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<void>;
  setOverlayVisible: (visible: boolean) => void;
  hydrate: () => void;
}

let unsubscribe: (() => void) | null = null;

export const useRecorderStore = create<RecorderState>((set, get) => ({
  status: 'idle',
  mode: 'auto',
  overlayVisible: false,
  steps: [],
  async hydrate() {
    if (unsubscribe) return;
    unsubscribe = connectRecorderEvents((event: RecorderEvent) => {
      switch (event.type) {
        case 'highlight':
          set({ hoveredElement: event.payload.selector ?? undefined });
          break;
        case 'step':
          set((state) => ({ steps: [...state.steps, event.payload] }));
          break;
        case 'status':
          set({ status: event.payload.status });
          break;
        case 'error':
          set({ status: 'error', error: event.payload.message });
          break;
        default:
          break;
      }
    });
  },
  setOverlayVisible: (visible) => set({ overlayVisible: visible }),
  async startRecording(mode) {
    const { status } = get();
    if (status === 'recording') return;
    set({ status: 'processing', error: undefined, steps: [], mode });
    const result = await recorderService.start(mode);
    if (!result.success) {
      set({ status: 'error', error: result.error ?? '无法启动录制' });
      return;
    }
    set({ status: 'recording', overlayVisible: true });
  },
  pauseRecording() {
    if (get().status !== 'recording') return;
    set({ status: 'paused' });
  },
  resumeRecording() {
    if (get().status !== 'paused') return;
    set({ status: 'recording' });
  },
  async stopRecording() {
    if (get().status === 'idle') return;
    set({ status: 'processing' });
    const result = await recorderService.stop();
    if (result.success && result.data && Array.isArray(result.data.steps)) {
      set({ steps: result.data.steps });
    }
    set({ status: 'idle', overlayVisible: false });
  },
}));
