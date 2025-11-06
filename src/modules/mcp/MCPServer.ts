import { MCPServerConfig } from './types';
import { ToolRegistry } from './ToolRegistry';

export class MCPServer {
  private config: MCPServerConfig;
  private toolRegistry: ToolRegistry;
  private isRunning: boolean = false;

  constructor(config: MCPServerConfig) {
    this.config = config;
    this.toolRegistry = new ToolRegistry();
  }

  start(): void {
    if (this.isRunning) {
      throw new Error('Server already running');
    }
    this.isRunning = true;
    console.log(`MCP Server started: ${this.config.name} v${this.config.version}`);
  }

  stop(): void {
    if (!this.isRunning) {
      throw new Error('Server not running');
    }
    this.isRunning = false;
    console.log('MCP Server stopped');
  }

  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }

  getServerInfo() {
    return {
      name: this.config.name,
      version: this.config.version,
      description: this.config.description,
      running: this.isRunning,
      toolCount: this.toolRegistry.getAllTools().length,
    };
  }

  isServerRunning(): boolean {
    return this.isRunning;
  }
}
