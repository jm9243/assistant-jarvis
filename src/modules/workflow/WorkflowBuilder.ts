import { Workflow, WorkflowNode, WorkflowEdge, Variable } from './types';

export class WorkflowBuilder {
  private workflow: Workflow;

  constructor(id: string, name: string, description: string = '') {
    this.workflow = {
      id,
      name,
      description,
      version: '1.0.0',
      nodes: [],
      edges: [],
      variables: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  }

  addNode(node: WorkflowNode): this {
    if (this.workflow.nodes.some((n) => n.id === node.id)) {
      throw new Error(`Node with id ${node.id} already exists`);
    }
    this.workflow.nodes.push(node);
    this.workflow.metadata.updatedAt = new Date();
    return this;
  }

  addEdge(source: string, target: string, condition?: string): this {
    const sourceNode = this.workflow.nodes.find((n) => n.id === source);
    const targetNode = this.workflow.nodes.find((n) => n.id === target);

    if (!sourceNode || !targetNode) {
      throw new Error('Source or target node not found');
    }

    const edge: WorkflowEdge = {
      id: `edge_${source}_${target}_${Date.now()}`,
      source,
      target,
      condition,
    };

    this.workflow.edges.push(edge);
    this.workflow.metadata.updatedAt = new Date();
    return this;
  }

  addVariable(variable: Variable): this {
    if (this.workflow.variables.some((v) => v.name === variable.name)) {
      throw new Error(`Variable ${variable.name} already exists`);
    }
    this.workflow.variables.push(variable);
    this.workflow.metadata.updatedAt = new Date();
    return this;
  }

  removeNode(nodeId: string): this {
    this.workflow.nodes = this.workflow.nodes.filter((n) => n.id !== nodeId);
    this.workflow.edges = this.workflow.edges.filter(
      (e) => e.source !== nodeId && e.target !== nodeId
    );
    this.workflow.metadata.updatedAt = new Date();
    return this;
  }

  removeEdge(edgeId: string): this {
    this.workflow.edges = this.workflow.edges.filter((e) => e.id !== edgeId);
    this.workflow.metadata.updatedAt = new Date();
    return this;
  }

  build(): Workflow {
    this.validateWorkflow();
    return { ...this.workflow };
  }

  private validateWorkflow(): void {
    if (this.workflow.nodes.length === 0) {
      throw new Error('Workflow must have at least one node');
    }

    // Validate all edges reference existing nodes
    for (const edge of this.workflow.edges) {
      const sourceExists = this.workflow.nodes.some((n) => n.id === edge.source);
      const targetExists = this.workflow.nodes.some((n) => n.id === edge.target);

      if (!sourceExists || !targetExists) {
        throw new Error(`Edge references non-existent nodes: ${edge.id}`);
      }
    }
  }
}
