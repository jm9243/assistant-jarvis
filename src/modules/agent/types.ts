export interface AgentConfig {
  enabled: boolean;
  model: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface AgentContext {
  currentScreenshot?: string;
  recentLogs?: string[];
  elementTree?: string;
  lastError?: string;
  executionHistory?: string;
}

export interface AgentDecision {
  action: string;
  selector: string;
  parameters: Record<string, any>;
  confidence: number;
  reasoning: string;
}

export interface AgentNodeConfig {
  id: string;
  name: string;
  description: string;
  systemPrompt?: string;
  retryPolicy?: RetryPolicy;
  observeContext: boolean;
}

export interface RetryPolicy {
  maxAttempts: number;
  delay: number;
  backoffMultiplier: number;
}

export interface AgentNodeResult {
  success: boolean;
  decision?: AgentDecision;
  error?: string;
  logs: string[];
}
