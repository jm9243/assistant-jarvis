import { create } from 'zustand';
import type { IMultiAgentOrchestration, IMeeting } from '@/types';
import { multiAgentAPI } from '@/services/api';

interface MultiAgentState {
  orchestrations: IMultiAgentOrchestration[];
  meetings: IMeeting[];
  hydrate: () => Promise<void>;
}

export const useMultiAgentStore = create<MultiAgentState>((set) => ({
  orchestrations: [],
  meetings: [],
  async hydrate() {
    const [orchRes, meetingRes] = await Promise.all([
      multiAgentAPI.orchestrations(),
      multiAgentAPI.meetings(),
    ]);
    set({
      orchestrations: orchRes.success ? (orchRes.data as IMultiAgentOrchestration[]) : [],
      meetings: meetingRes.success ? (meetingRes.data as IMeeting[]) : [],
    });
  },
}));
