import { recorderAPI } from '@/services/api';
import type { IRecordedStep, RecorderEvent } from '@/types';

const WS_BASE = import.meta.env.VITE_ENGINE_WS_URL ?? 'ws://localhost:8000';

export type RecorderMode = 'auto' | 'manual';

export const connectRecorderEvents = (
  onEvent: (event: RecorderEvent) => void,
): (() => void) => {
  const url = `${WS_BASE}/api/recorder/ws`;
  let socket: WebSocket | null = null;

  try {
    socket = new WebSocket(url);
    socket.onmessage = (message) => {
      try {
        const data: RecorderEvent = JSON.parse(message.data);
        onEvent(data);
      } catch (error) {
        console.warn('[RecorderEvents] parse error', error);
      }
    };
  } catch (error) {
    console.warn('[RecorderEvents] websocket unavailable', error);
  }

  return () => {
    socket?.close();
  };
};

export const recorderService = {
  start: (mode: RecorderMode) => recorderAPI.start({ mode }),
  stop: () => recorderAPI.stop<{ steps: IRecordedStep[] }>(),
};
