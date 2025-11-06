import { RuntimeConfig, ExecutionRecord, StepRecord, LogEntry, LogLevel } from './types';

export class RuntimeEngine {
  private config: RuntimeConfig;
  private currentExecution: ExecutionRecord | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(config: Partial<RuntimeConfig> = {}) {
    this.config = {
      timeout: 30000,
      retryCount: 3,
      dryRun: false,
      logLevel: 'info',
      captureScreenshots: false,
      ...config,
    };
  }

  async executeWorkflow(workflowId: string, variables: Record<string, any> = {}): Promise<ExecutionRecord> {
    const execution: ExecutionRecord = {
      id: `exec_${Date.now()}`,
      workflowId,
      startTime: new Date(),
      status: 'running',
      variables: new Map(Object.entries(variables)),
      steps: [],
      logs: [],
      screenshots: [],
    };

    this.currentExecution = execution;
    this.log('info', `Started execution of workflow ${workflowId}`);
    this.emit('executionStarted', execution);

    try {
      // Placeholder: actual workflow execution would happen here
      this.log('info', 'Workflow execution completed successfully');
      execution.status = 'completed';
      execution.endTime = new Date();
      this.emit('executionCompleted', execution);
    } catch (error) {
      execution.error = error instanceof Error ? error.message : String(error);
      execution.status = 'failed';
      execution.endTime = new Date();
      this.log('error', `Execution failed: ${execution.error}`);
      this.emit('executionFailed', execution);
    }

    return execution;
  }

  addStep(step: StepRecord): void {
    if (!this.currentExecution) {
      throw new Error('No execution in progress');
    }

    this.currentExecution.steps.push(step);
    this.emit('stepCompleted', step);
  }

  pause(): void {
    if (this.currentExecution) {
      this.currentExecution.status = 'paused';
      this.log('info', 'Execution paused');
      this.emit('executionPaused', this.currentExecution);
    }
  }

  resume(): void {
    if (this.currentExecution) {
      this.currentExecution.status = 'running';
      this.log('info', 'Execution resumed');
      this.emit('executionResumed', this.currentExecution);
    }
  }

  stop(): void {
    if (this.currentExecution) {
      this.currentExecution.status = 'failed';
      this.currentExecution.endTime = new Date();
      this.currentExecution.error = 'Execution stopped by user';
      this.log('warn', 'Execution stopped');
      this.emit('executionStopped', this.currentExecution);
    }
  }

  log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
    };

    if (this.currentExecution) {
      this.currentExecution.logs.push(entry);
    }

    this.emit('logEntry', entry);
  }

  getCurrentExecution(): ExecutionRecord | null {
    return this.currentExecution;
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
