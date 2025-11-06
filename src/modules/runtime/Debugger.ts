import { ExecutionRecord, DebugBreakpoint, StepRecord } from './types';

export class Debugger {
  private breakpoints: Map<string, DebugBreakpoint> = new Map();
  private isPaused: boolean = false;
  private currentStep: StepRecord | null = null;

  addBreakpoint(nodeId: string, condition?: string): void {
    this.breakpoints.set(nodeId, {
      nodeId,
      enabled: true,
      condition,
    });
  }

  removeBreakpoint(nodeId: string): boolean {
    return this.breakpoints.delete(nodeId);
  }

  disableBreakpoint(nodeId: string): void {
    const bp = this.breakpoints.get(nodeId);
    if (bp) {
      bp.enabled = false;
    }
  }

  enableBreakpoint(nodeId: string): void {
    const bp = this.breakpoints.get(nodeId);
    if (bp) {
      bp.enabled = true;
    }
  }

  getAllBreakpoints(): DebugBreakpoint[] {
    return Array.from(this.breakpoints.values());
  }

  shouldBreak(nodeId: string, context: Record<string, any> = {}): boolean {
    const bp = this.breakpoints.get(nodeId);
    if (!bp?.enabled) {
      return false;
    }

    if (bp.condition) {
      try {
        // Simple condition evaluation (in production, use a safer evaluator)
        return this.evaluateCondition(bp.condition, context);
      } catch (error) {
        console.error('Error evaluating breakpoint condition:', error);
        return false;
      }
    }

    return true;
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  isPausedState(): boolean {
    return this.isPaused;
  }

  setCurrentStep(step: StepRecord): void {
    this.currentStep = step;
  }

  getCurrentStep(): StepRecord | null {
    return this.currentStep;
  }

  getExecutionTimeline(execution: ExecutionRecord): StepRecord[] {
    return execution.steps;
  }

  getExecutionSnapshot(execution: ExecutionRecord, stepIndex: number): Record<string, any> {
    if (stepIndex < 0 || stepIndex >= execution.steps.length) {
      throw new Error('Invalid step index');
    }

    const step = execution.steps[stepIndex];
    return {
      step,
      previousSteps: execution.steps.slice(0, stepIndex),
      variables: Object.fromEntries(execution.variables),
      logs: execution.logs,
    };
  }

  private evaluateCondition(condition: string, context: Record<string, any>): boolean {
    try {
      // Create a safe Function for condition evaluation
      const func = new Function(...Object.keys(context), `return ${condition}`);
      return func(...Object.values(context));
    } catch (error) {
      throw new Error(`Failed to evaluate condition: ${condition}`);
    }
  }
}
