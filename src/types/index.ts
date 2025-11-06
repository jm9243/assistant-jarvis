// Workflow Types
export interface WorkflowNode {
  id: string;
  type: 'action' | 'condition' | 'loop' | 'parallel';
  label: string;
  position: { x: number; y: number };
  config: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Recorder Types
export interface RecordedStep {
  id: string;
  type: 'click' | 'type' | 'scroll' | 'drag' | 'wait' | 'screenshot';
  element?: UIElement;
  data?: Record<string, any>;
  timestamp: Date;
}

export interface UIElement {
  id: string;
  type: string;
  role: string;
  name: string;
  selector: ElementSelector;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  properties: Record<string, any>;
}

export interface ElementSelector {
  primary: string;
  fallback: string[];
  features: {
    role?: string;
    name?: string;
    path?: string;
    image?: string;
  };
}

// Task Types
export interface Task {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  result?: TaskResult;
  error?: string;
}

export interface TaskResult {
  success: boolean;
  output?: Record<string, any>;
  logs: string[];
  screenshots: string[];
}

// Agent Types
export interface AgentConfig {
  enabled: boolean;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface AgentDecision {
  action: string;
  selector: string;
  parameters: Record<string, any>;
  confidence: number;
}

// MCP Types
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
}

export interface MCPToolInvocation {
  toolName: string;
  arguments: Record<string, any>;
  result?: any;
  error?: string;
}
