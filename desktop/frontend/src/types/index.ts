// 用户类型
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  nickname?: string;
  role: 'admin' | 'user';
  createdAt: string;
}

// 工作流类型
export interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  version: string;
  createdAt: string;
  updatedAt: string;
  executionCount: number;
  successRate: number;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

// 任务类型
export interface Task {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startTime?: string;
  endTime?: string;
  duration?: number;
  error?: string;
  logs: TaskLog[];
}

export interface TaskLog {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  nodeId?: string;
}

// Agent类型
export interface Agent {
  id: string;
  name: string;
  description: string;
  type: 'basic' | 'react' | 'research';
  avatar?: string;
  status: 'idle' | 'running' | 'stopped';
  config: AgentConfig;
  stats: AgentStats;
}

export interface AgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  tools: string[];
  knowledgeBases: string[];
}

export interface AgentStats {
  totalCalls: number;
  successRate: number;
  avgResponseTime: number;
  tokenUsage: number;
}

// 通知类型
export interface Notification {
  id: string;
  type: 'task' | 'system' | 'call' | 'alert';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}
