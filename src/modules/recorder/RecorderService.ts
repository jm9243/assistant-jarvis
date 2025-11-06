import { RecorderConfig, RecordingSession, RecordedStep } from './types';

export class RecorderService {
  private config: RecorderConfig;
  private currentSession: RecordingSession | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(config: Partial<RecorderConfig> = {}) {
    this.config = {
      captureMouseMovement: true,
      captureScreenshots: true,
      captureKeystrokes: true,
      autoDetectElements: true,
      ...config,
    };
  }

  startRecording(): RecordingSession {
    if (this.currentSession?.isActive) {
      throw new Error('Recording already in progress');
    }

    this.currentSession = {
      id: `session_${Date.now()}`,
      startTime: new Date(),
      isActive: true,
      steps: [],
    };

    this.emit('recordingStarted', this.currentSession);
    return this.currentSession;
  }

  stopRecording(): RecordingSession | null {
    if (!this.currentSession) {
      throw new Error('No recording session in progress');
    }

    this.currentSession.isActive = false;
    this.currentSession.endTime = new Date();

    const session = this.currentSession;
    this.emit('recordingStopped', session);
    return session;
  }

  addStep(step: Omit<RecordedStep, 'id' | 'timestamp'>): void {
    if (!this.currentSession?.isActive) {
      throw new Error('No active recording session');
    }

    const recordedStep: RecordedStep = {
      ...step,
      id: `step_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
    };

    this.currentSession.steps.push(recordedStep);
    this.emit('stepRecorded', recordedStep);
  }

  getCurrentSession(): RecordingSession | null {
    return this.currentSession;
  }

  getSteps(): RecordedStep[] {
    return this.currentSession?.steps || [];
  }

  clearSession(): void {
    this.currentSession = null;
  }

  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: Function): void {
    this.listeners.get(event)?.delete(listener);
  }

  private emit(event: string, data?: any): void {
    this.listeners.get(event)?.forEach((listener) => {
      listener(data);
    });
  }
}
