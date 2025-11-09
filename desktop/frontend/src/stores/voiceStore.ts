import { create } from 'zustand';
import type { IAudioDevice, ICallRecord, IVoiceStats } from '@/types';
import { voiceAPI } from '@/services/api';

interface VoiceState {
  devices: IAudioDevice[];
  stats: IVoiceStats | null;
  calls: ICallRecord[];
  loading: boolean;
  hydrate: () => Promise<void>;
  startCall: (contact: string, channel?: string) => Promise<void>;
  finishCall: (callId: string, summary: string) => Promise<void>;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  devices: [],
  stats: null,
  calls: [],
  loading: false,
  async hydrate() {
    set({ loading: true });
    const [deviceRes, statusRes, callRes] = await Promise.all([
      voiceAPI.devices(),
      voiceAPI.status(),
      voiceAPI.calls(),
    ]);
    if (deviceRes.success) {
      set({ devices: deviceRes.data as IAudioDevice[] });
    }
    if (callRes.success && callRes.data) {
      set({ calls: callRes.data as ICallRecord[] });
    }
    if (statusRes.success && statusRes.data) {
      set({ stats: statusRes.data.stats as IVoiceStats, loading: false });
    } else {
      set({ loading: false });
    }
  },
  async startCall(contact, channel = 'wechat') {
    const response = await voiceAPI.startCall({ contact, channel });
    if (response.success && response.data) {
      set((state) => ({ calls: [response.data as ICallRecord, ...state.calls] }));
    }
  },
  async finishCall(callId, summary) {
    const response = await voiceAPI.finishCall(callId, { reason: 'completed', summary });
    if (response.success && response.data) {
      set((state) => ({
        calls: state.calls.map((call) => (call.id === callId ? (response.data as ICallRecord) : call)),
      }));
    }
    const statsRes = await voiceAPI.status();
    if (statsRes.success && statsRes.data) {
      set({ stats: statsRes.data.stats as IVoiceStats });
    }
  },
}));
