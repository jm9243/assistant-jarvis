export interface Task {
  id: string;
  workflowId: string;
  status: TaskStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  executionTime?: number;
  retryCount: number;
}

export interface TaskSchedule {
  id: string;
  taskId: string;
  type: ScheduleType;
  cronExpression?: string;
  trigger?: string;
  enabled: boolean;
  createdAt: Date;
  lastRun?: Date;
  nextRun?: Date;
}

export interface TaskReport {
  id: string;
  taskId: string;
  generatedAt: Date;
  status: TaskStatus;
  duration: number;
  successCount: number;
  failureCount: number;
  logs: string[];
  screenshots?: string[];
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type ScheduleType = 'cron' | 'interval' | 'trigger';
