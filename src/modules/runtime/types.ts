export interface RuntimeConfig {
  timeout?: number;
  retryCount?: number;
  dryRun?: boolean;
  logLevel?: LogLevel;
  captureScreenshots?: boolean;
}

export interface ExecutionRecord {
  id: string;
  workflowId: string;
  startTime: Date;
  endTime?: Date;
  status: ExecutionStatus;
  variables: Map<string, any>;
  steps: StepRecord[];
  logs: LogEntry[];
  screenshots: Screenshot[];
  error?: string;
}

export interface StepRecord {
  id: string;
  nodeId: string;
  startTime: Date;
  endTime?: Date;
  status: ExecutionStatus;
  input?: any;
  output?: any;
  error?: string;
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

export interface Screenshot {
  id: string;
  timestamp: Date;
  stepId?: string;
  data: string; // Base64 encoded
}

export interface DebugBreakpoint {
  nodeId: string;
  enabled: boolean;
  condition?: string;
}

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
