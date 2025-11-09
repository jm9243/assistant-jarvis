import { describe, it, expect } from 'vitest';
import { useWorkflowStore } from '@/stores/workflowStore';
import type { INode } from '@/types';

describe('workflowStore', () => {
  it('creates default workflow when ensureWorkflow called', () => {
    const workflow = useWorkflowStore.getState().ensureWorkflow();
    expect(workflow).toBeDefined();
    expect(useWorkflowStore.getState().workflows.length).toBeGreaterThan(0);
  });

  it('adds node and updates history', () => {
    const store = useWorkflowStore.getState();
    store.ensureWorkflow();
    const node: INode = {
      id: 'n1',
      type: 'click',
      label: 'Click',
      config: {},
      position: { x: 0, y: 0 },
    };
    useWorkflowStore.getState().addNode(node);
    const current = useWorkflowStore.getState().currentWorkflow;
    expect(current?.nodes.some((n) => n.id === 'n1')).toBe(true);
  });
});
