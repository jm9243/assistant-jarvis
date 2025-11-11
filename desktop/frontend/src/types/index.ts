// 通用类型定义

export type Status = 'idle' | 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface Result<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  error_code?: string;
}

// 工作流相关类型
export interface IWorkflow {
  id: string;
  name: string;
  description?: string;
  version: string;
  nodes: INode[];
  edges: IEdge[];
  variables: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface INode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
}

export interface IEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export type NodeType =
  | 'click'
  | 'input'
  | 'drag_drop'
  | 'scroll'
  | 'hover'
  | 'keyboard'
  | 'delay'
  | 'variable'
  | 'compare'
  | 'data_extract'
  | 'http_request'
  | 'subworkflow'
  | 'file_selector'
  | 'file_operation'
  | 'clipboard'
  | 'shell_command'
  | 'app_control';

export interface NodeData {
  label: string;
  description?: string;
  config: Record<string, any>;
  locator?: ElementLocator;
}

export interface ElementLocator {
  strategies: LocatorStrategy[];
  timeout?: number;
  retry?: number;
}

export interface LocatorStrategy {
  type: 'axui' | 'ocr' | 'image' | 'position';
  priority: number;
  enabled: boolean;
  config: Record<string, any>;
}

// 执行相关类型
export interface ExecutionLog {
  runId: string;
  nodeId: string;
  status: Status;
  message: string;
  timestamp: string;
  snapshots?: string[];
}

export interface ExecutionRecord {
  id: string;
  workflow_id: string;
  status: Status;
  start_time: string;
  end_time?: string;
  logs: ExecutionLog[];
  screenshots: string[];
  variables: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
  };
}

// 系统监控类型
export interface SystemMetric {
  cpu: number;
  memory: number;
  sidecarStatus: Status;
  alerts: Alert[];
}

export interface Alert {
  id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

// 软件扫描类型
export interface SoftwareItem {
  id: string;
  name: string;
  version?: string;
  platform: 'macos' | 'windows';
  compatibility: 'full' | 'partial' | 'unknown';
  capabilities: string[];
}

// 录制器类型
export interface RecordedStep {
  id: string;
  type: string;
  element?: UIElement;
  action: string;
  params: Record<string, any>;
  timestamp: string;
}

export interface UIElement {
  rect: Rect;
  role?: string;
  title?: string;
  identifier?: string;
  text?: string;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 认证类型
export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  membership: 'free' | 'pro' | 'enterprise';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
