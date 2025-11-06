import { RecorderService } from './RecorderService';
import { RecordingSession, RecordedStep } from './types';

export class RecorderManager {
  private recorderService: RecorderService;
  private sessions: Map<string, RecordingSession> = new Map();

  constructor(recorderService: RecorderService) {
    this.recorderService = recorderService;
  }

  startRecording(): RecordingSession {
    const session = this.recorderService.startRecording();
    this.sessions.set(session.id, session);
    return session;
  }

  stopRecording(): RecordingSession | null {
    const session = this.recorderService.stopRecording();
    if (session) {
      this.sessions.set(session.id, session);
    }
    return session;
  }

  getSession(sessionId: string): RecordingSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): RecordingSession[] {
    return Array.from(this.sessions.values());
  }

  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  exportSession(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    return JSON.stringify(session, null, 2);
  }

  importSession(jsonData: string): RecordingSession {
    const session = JSON.parse(jsonData) as RecordingSession;
    this.sessions.set(session.id, session);
    return session;
  }
}
