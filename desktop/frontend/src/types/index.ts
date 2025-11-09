/**
 * 通用类型定义
 */

// 工作流相关
export interface IWorkflow {
  id: string;
  name: string;
  description?: string;
  version: string;
  nodes: INode[];
  edges: IEdge[];
  variables: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface INode {
  id: string;
  type: string;
  label: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface IEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

// Agent相关
export interface AgentMetrics {
  calls: number;
  avg_latency_ms: number;
  success_rate: number;
  token_usage: number;
  tool_invocations: number;
}

export interface IAgentConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  max_iterations?: number;
  tool_strategy?: 'auto' | 'manual' | 'approval';
  timeout_ms?: number;
}

export interface IAgent {
  id: string;
  name: string;
  type: 'basic' | 'react' | 'research';
  status: 'idle' | 'running' | 'offline';
  description?: string;
  avatar?: string;
  tags: string[];
  config: IAgentConfig;
  knowledge_bases: string[];
  tools: string[];
  permissions: string[];
  metrics: AgentMetrics;
  created_at: string;
  updated_at: string;
}

export interface IAgentTemplate {
  id: string;
  name: string;
  description: string;
  type: 'basic' | 'react' | 'research';
  tags: string[];
  preset: IAgentConfig;
  recommended_tools: string[];
}

export interface IAgentSession {
  id: string;
  agent_id: string;
  title: string;
  messages: IAgentMessage[];
  updated_at: string;
}

export interface IAgentMessage {
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  timestamp: string;
  references?: string[];
}

export interface IAgentMemory {
  id: string;
  agent_id: string;
  scope: 'short_term' | 'long_term' | 'working';
  content: string;
  importance: 'low' | 'medium' | 'high';
  created_at: string;
}

// 通用响应
export interface IResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 执行状态
export enum Status {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
  Paused = 'paused',
}

export interface IExecutionRun {
  id: string;
  workflowId: string;
  workflowName: string;
  status: Status;
  trigger: 'manual' | 'schedule' | 'notification';
  startedAt: string;
  finishedAt?: string;
  priority: 'high' | 'medium' | 'low';
  progress: number;
  currentNode?: string;
  params: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ExecutionLog {
  runId: string;
  nodeId: string;
  status: Status;
  message: string;
  timestamp: string;
  payload?: Record<string, unknown>;
}

// 系统监控
export interface SystemMetric {
  cpu: number;
  memory: number;
  disk: number;
  network: { sent: number; received: number };
  notifications: number;
  sidecarStatus: Status;
  alerts: Array<{ id: string; level: 'info' | 'warn' | 'error'; message: string; created_at: string }>;
}

export interface SoftwareItem {
  id: string;
  name: string;
  version?: string;
  platform: 'macos' | 'windows';
  compatibility: 'full' | 'partial' | 'unknown';
  capabilities: string[];
  path?: string;
  lastSeenAt: string;
}

// 知识库
export interface IKnowledgeBase {
  id: string;
  name: string;
  description?: string;
  stats: { documents: number; chunks: number; queries: number; avg_score: number };
  tags: string[];
  created_at: string;
}

export interface IKnowledgeDocument {
  id: string;
  base_id: string;
  name: string;
  mime: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  chunks: Array<{ id: string; content: string }>;
  created_at: string;
}

export interface IRetrievalResult {
  base_id: string;
  document_id: string;
  chunk_id: string;
  content: string;
  score: number;
}

// 语音通话
export interface IAudioDevice {
  id: string;
  name: string;
  type: 'input' | 'output';
  is_virtual: boolean;
  selected: boolean;
}

export interface ICallRecord {
  id: string;
  contact: string;
  channel: string;
  started_at: string;
  ended_at?: string;
  duration_seconds: number;
  status: 'active' | 'completed' | 'failed' | 'missed';
  summary?: string;
  transcript: Array<{ role: string; content: string; timestamp: string }>;
}

export interface IVoiceStats {
  today: number;
  total_duration: number;
  avg_duration: number;
  answer_rate: number;
}

// 工具治理
export interface IToolDefinition {
  id: string;
  name: string;
  type: string;
  description: string;
  entrypoint?: string;
  tags: string[];
  enabled: boolean;
  approval_required: boolean;
  metadata?: Record<string, unknown>;
}

export interface IToolApproval {
  id: string;
  tool_id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_by: string;
  reviewer?: string;
}

export interface IToolAudit {
  id: string;
  tool_id: string;
  triggered_by: string;
  duration_ms: number;
  status: 'success' | 'failed' | 'cancelled';
  created_at: string;
}

export interface IGovernanceKpi {
  calls: number;
  success_rate: number;
  avg_duration: number;
}

// AI 助手
export interface IAssistantPlanStep {
  id: string;
  description: string;
  target_type: 'agent' | 'workflow' | 'knowledge' | 'tool';
  status: 'pending' | 'running' | 'done' | 'skipped';
  result?: string;
}

export interface IAssistantTask {
  id: string;
  intent: string;
  query: string;
  confidence: number;
  status: 'planning' | 'awaiting_confirmation' | 'executing' | 'completed' | 'failed';
  steps: IAssistantPlanStep[];
  result_summary?: string;
  created_at: string;
}

// Multi-Agent
export interface IMultiAgentParticipant {
  id: string;
  agent_id: string;
  role: string;
}

export interface IMultiAgentOrchestration {
  id: string;
  name: string;
  mode: 'workflow' | 'organization' | 'supervisor' | 'meeting';
  participants: IMultiAgentParticipant[];
  graph: Record<string, string[]>;
  status: 'draft' | 'active' | 'completed';
  updated_at: string;
}

export interface IMeetingTurn {
  speaker_agent_id: string;
  role: string;
  content: string;
  timestamp: string;
}

export interface IMeeting {
  id: string;
  orchestration_id: string;
  topic: string;
  status: 'scheduled' | 'running' | 'completed';
  round: number;
  max_rounds: number;
  turns: IMeetingTurn[];
}

// 通知/下载
export interface INotificationRecord {
  id: string;
  title: string;
  message: string;
  category: string;
  read: boolean;
  created_at: string;
}

export interface IDownloadRecord {
  id: string;
  name: string;
  url: string;
  status: string;
  created_at: string;
}

// 录制器
export interface IRecordedStep {
  id: string;
  action: string;
  target: string;
  strategy: string;
  preview?: string;
  created_at: string;
}

export type RecorderStatus = 'idle' | 'recording' | 'paused' | 'processing' | 'error';

export type RecorderEvent =
  | { type: 'highlight'; payload: { selector?: string } }
  | { type: 'step'; payload: IRecordedStep }
  | { type: 'status'; payload: { status: RecorderStatus } }
  | { type: 'error'; payload: { message: string } };

// 认证相关
export interface IUserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  title?: string;
  organization?: string;
  lastLoginAt?: string;
}

export interface IAuthCredentials {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface IAuthResponse {
  tokens: IAuthTokens;
  profile: IUserProfile;
}
