import { Workflow, ExecutionContext, ExecutionStep, ExecutionStatus } from './types';

export class WorkflowEngine {
  private listeners: Map<string, Set<Function>> = new Map();

  async execute(workflow: Workflow, variables: Record<string, any> = {}): Promise<ExecutionContext> {
    const executionId = `exec_${Date.now()}`;
    const context: ExecutionContext = {
      workflowId: workflow.id,
      executionId,
      variables: new Map(Object.entries(variables)),
      currentNode: '',
      executionHistory: [],
    };

    this.emit('executionStarted', { executionId, workflowId: workflow.id });

    try {
      // Find start node (typically the first node with no incoming edges)
      const startNode = this.findStartNode(workflow);
      if (!startNode) {
        throw new Error('No start node found in workflow');
      }

      await this.executeNode(workflow, startNode.id, context);

      this.emit('executionCompleted', { executionId, context });
    } catch (error) {
      this.emit('executionFailed', { executionId, error });
      throw error;
    }

    return context;
  }

  private async executeNode(workflow: Workflow, nodeId: string, context: ExecutionContext): Promise<void> {
    const node = workflow.nodes.find((n) => n.id === nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    context.currentNode = nodeId;

    const step: ExecutionStep = {
      nodeId,
      startTime: new Date(),
      status: 'running',
    };

    try {
      this.emit('nodeStarted', { nodeId, executionId: context.executionId });

      // Execute node based on type
      switch (node.type) {
        case 'action':
          await this.executeAction(node.config, context);
          break;
        case 'condition':
          await this.evaluateCondition(node.config, context);
          break;
        case 'loop':
          await this.executeLoop(node.config, context);
          break;
        case 'wait':
          await this.executeWait(node.config, context);
          break;
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      step.status = 'completed';
      step.endTime = new Date();

      this.emit('nodeCompleted', { nodeId, executionId: context.executionId });

      // Find next node
      const nextNodeId = this.findNextNode(workflow, nodeId);
      if (nextNodeId) {
        await this.executeNode(workflow, nextNodeId, context);
      }
    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : String(error);
      step.endTime = new Date();

      this.emit('nodeFailed', { nodeId, executionId: context.executionId, error });
      throw error;
    }

    context.executionHistory.push(step);
  }

  private async executeAction(config: Record<string, any>, context: ExecutionContext): Promise<void> {
    // Placeholder for action execution
    console.log('Executing action:', config);
  }

  private async evaluateCondition(config: Record<string, any>, context: ExecutionContext): Promise<void> {
    // Placeholder for condition evaluation
    console.log('Evaluating condition:', config);
  }

  private async executeLoop(config: Record<string, any>, context: ExecutionContext): Promise<void> {
    // Placeholder for loop execution
    console.log('Executing loop:', config);
  }

  private async executeWait(config: Record<string, any>, context: ExecutionContext): Promise<void> {
    const duration = config.duration || 1000;
    return new Promise((resolve) => setTimeout(resolve, duration));
  }

  private findStartNode(workflow: Workflow) {
    const incomingEdges = new Set(workflow.edges.map((e) => e.target));
    return workflow.nodes.find((n) => !incomingEdges.has(n.id));
  }

  private findNextNode(workflow: Workflow, nodeId: string): string | null {
    const edge = workflow.edges.find((e) => e.source === nodeId);
    return edge ? edge.target : null;
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
