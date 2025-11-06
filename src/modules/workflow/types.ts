export interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  position: Position;
  config: Record<string, any>;
  inputs?: string[];
  outputs?: string[];
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  version: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: Variable[];
  metadata: WorkflowMetadata;
}

export interface Variable {
  name: string;
  type: VariableType;
  defaultValue?: any;
  description?: string;
  required?: boolean;
}

export interface WorkflowMetadata {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  tags?: string[];
  thumbnail?: string;
}

export interface Position {
  x: number;
  y: number;
}

export type NodeType = 'action' | 'condition' | 'loop' | 'parallel' | 'wait' | 'script';
export type VariableType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export interface ExecutionContext {
  workflowId: string;
  executionId: string;
  variables: Map<string, any>;
  currentNode: string;
  executionHistory: ExecutionStep[];
}

export interface ExecutionStep {
  nodeId: string;
  startTime: Date;
  endTime?: Date;
  status: ExecutionStatus;
  output?: any;
  error?: string;
}

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
