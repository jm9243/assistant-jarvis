import { Task, TaskSchedule, TaskReport, TaskStatus } from './types';

export class TaskManager {
  private tasks: Map<string, Task> = new Map();
  private schedules: Map<string, TaskSchedule> = new Map();
  private reports: Map<string, TaskReport> = new Map();
  private listeners: Map<string, Set<Function>> = new Map();

  createTask(workflowId: string, input: Record<string, any> = {}): Task {
    const task: Task = {
      id: `task_${Date.now()}`,
      workflowId,
      status: 'pending',
      createdAt: new Date(),
      input,
      retryCount: 0,
    };

    this.tasks.set(task.id, task);
    this.emit('taskCreated', task);
    return task;
  }

  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  getTasksByWorkflow(workflowId: string): Task[] {
    return Array.from(this.tasks.values()).filter((t) => t.workflowId === workflowId);
  }

  getTasksByStatus(status: TaskStatus): Task[] {
    return Array.from(this.tasks.values()).filter((t) => t.status === status);
  }

  updateTask(id: string, updates: Partial<Task>): void {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error(`Task ${id} not found`);
    }

    const updated = { ...task, ...updates };
    this.tasks.set(id, updated);
    this.emit('taskUpdated', updated);
  }

  deleteTask(id: string): boolean {
    const result = this.tasks.delete(id);
    if (result) {
      this.emit('taskDeleted', id);
    }
    return result;
  }

  createSchedule(taskId: string, schedule: Omit<TaskSchedule, 'id' | 'createdAt'>): TaskSchedule {
    const newSchedule: TaskSchedule = {
      ...schedule,
      id: `schedule_${Date.now()}`,
      createdAt: new Date(),
    };

    this.schedules.set(newSchedule.id, newSchedule);
    this.emit('scheduleCreated', newSchedule);
    return newSchedule;
  }

  getSchedule(id: string): TaskSchedule | undefined {
    return this.schedules.get(id);
  }

  getSchedulesByTask(taskId: string): TaskSchedule[] {
    return Array.from(this.schedules.values()).filter((s) => s.taskId === taskId);
  }

  deleteSchedule(id: string): boolean {
    const result = this.schedules.delete(id);
    if (result) {
      this.emit('scheduleDeleted', id);
    }
    return result;
  }

  createReport(task: Task, data: Omit<TaskReport, 'id' | 'generatedAt'>): TaskReport {
    const report: TaskReport = {
      ...data,
      id: `report_${Date.now()}`,
      taskId: task.id,
      generatedAt: new Date(),
    };

    this.reports.set(report.id, report);
    return report;
  }

  getReport(id: string): TaskReport | undefined {
    return this.reports.get(id);
  }

  getReportsByTask(taskId: string): TaskReport[] {
    return Array.from(this.reports.values()).filter((r) => r.taskId === taskId);
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
