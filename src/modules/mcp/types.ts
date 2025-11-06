export interface MCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
  handler: (params: Record<string, any>) => Promise<any>;
}

export interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  description?: string;
}

export interface MCPToolInvocation {
  toolName: string;
  arguments: Record<string, any>;
  timestamp: Date;
}

export interface MCPToolResult {
  invocation: MCPToolInvocation;
  result?: any;
  error?: string;
  duration: number;
}

export interface MCPServerConfig {
  name: string;
  version: string;
  description?: string;
}
