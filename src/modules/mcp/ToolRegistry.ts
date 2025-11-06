import { MCPTool, MCPToolInvocation, MCPToolResult } from './types';

export class ToolRegistry {
  private tools: Map<string, MCPTool> = new Map();
  private invocationHistory: MCPToolInvocation[] = [];
  private listeners: Map<string, Set<Function>> = new Map();

  registerTool(tool: MCPTool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool ${tool.name} already registered`);
    }
    this.tools.set(tool.name, tool);
    this.emit('toolRegistered', tool);
  }

  unregisterTool(name: string): boolean {
    const result = this.tools.delete(name);
    if (result) {
      this.emit('toolUnregistered', name);
    }
    return result;
  }

  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  getAllTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  async invokeTool(name: string, args: Record<string, any>): Promise<MCPToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }

    const invocation: MCPToolInvocation = {
      toolName: name,
      arguments: args,
      timestamp: new Date(),
    };

    const startTime = Date.now();
    this.invocationHistory.push(invocation);

    try {
      this.emit('toolInvoked', invocation);

      const result = await tool.handler(args);
      const duration = Date.now() - startTime;

      const toolResult: MCPToolResult = {
        invocation,
        result,
        duration,
      };

      this.emit('toolCompleted', toolResult);
      return toolResult;
    } catch (error) {
      const duration = Date.now() - startTime;

      const toolResult: MCPToolResult = {
        invocation,
        error: error instanceof Error ? error.message : String(error),
        duration,
      };

      this.emit('toolFailed', toolResult);
      return toolResult;
    }
  }

  getInvocationHistory(): MCPToolInvocation[] {
    return [...this.invocationHistory];
  }

  clearInvocationHistory(): void {
    this.invocationHistory = [];
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
