import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type OnEdgesChange,
  type OnNodesChange,
  type Connection,
  type Edge,
  type Node,
} from 'reactflow';
import 'reactflow/dist/style.css';

import NodeLibraryPanel from '@/components/workflow/NodeLibraryPanel';
import NodeInspector from '@/components/workflow/NodeInspector';
import { NODE_DEFINITIONS, buildNodeInstance } from '@/types/nodes';
import { useWorkflowStore } from '@/stores/workflowStore';
import type { INode as WorkflowNode, IEdge as WorkflowEdge } from '@/types';

const WorkflowDesignerPage: React.FC = () => {
  const current = useWorkflowStore((state) => state.currentWorkflow);
  const ensureWorkflow = useWorkflowStore((state) => state.ensureWorkflow);
  const setNodes = useWorkflowStore((state) => state.setNodes);
  const setEdges = useWorkflowStore((state) => state.setEdges);
  const addNode = useWorkflowStore((state) => state.addNode);
  const updateNode = useWorkflowStore((state) => state.updateNode);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);
  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  const setSelectedNode = useWorkflowStore((state) => state.setSelectedNode);
  const undo = useWorkflowStore((state) => state.undo);
  const redo = useWorkflowStore((state) => state.redo);

  const workflow = current ?? ensureWorkflow();

  const rfNodes = workflow.nodes as unknown as Node[];
  const rfEdges = workflow.edges as unknown as Edge[];

  const selectedNode = useMemo(() => workflow.nodes.find((node) => node.id === selectedNodeId) ?? null, [workflow.nodes, selectedNodeId]);

  const onNodesChange = useCallback<OnNodesChange>((changes) => {
    const next = applyNodeChanges(changes, rfNodes);
    setNodes(next as unknown as WorkflowNode[]);
  }, [rfNodes, setNodes]);

  const onEdgesChange = useCallback<OnEdgesChange>((changes) => {
    const next = applyEdgeChanges(changes, rfEdges);
    setEdges(next as unknown as WorkflowEdge[]);
  }, [rfEdges, setEdges]);

  const onConnect = useCallback((connection: Connection) => {
    const next = addEdge(connection, rfEdges);
    setEdges(next as unknown as WorkflowEdge[]);
  }, [rfEdges, setEdges]);

  const handleAddNode = (definition: (typeof NODE_DEFINITIONS)[number]) => {
    const position = { x: 200 + Math.random() * 200, y: 200 + Math.random() * 200 };
    const instance = buildNodeInstance(definition, position);
    addNode(instance);
    setSelectedNode(instance.id);
  };

  const onSelectionChange = useCallback((params: { nodes?: Node[] }) => {
    const first = params.nodes && params.nodes[0];
    setSelectedNode(first?.id ?? null);
  }, [setSelectedNode]);

  return (
    <div className="flex h-full bg-[#050714] text-white">
      <NodeLibraryPanel definitions={NODE_DEFINITIONS} onAdd={handleAddNode} />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/5 bg-[#050714]/80 px-6 py-3 text-sm text-[#A8B2D1]">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[#FFB800]">Workflow Studio</p>
            <h2 className="text-lg text-white">{workflow.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="rounded-lg border border-white/10 px-3 py-2 text-xs" onClick={undo}>撤销</button>
            <button type="button" className="rounded-lg border border-white/10 px-3 py-2 text-xs" onClick={redo}>重做</button>
            <button type="button" className="rounded-lg border border-white/10 px-3 py-2 text-xs">导出 JSON</button>
            <button type="button" className="rounded-lg bg-gradient-to-r from-[#FFB800] to-[#FF8A00] px-4 py-2 text-xs font-semibold text-[#050714]">保存工作流</button>
          </div>
        </header>
        <div className="flex flex-1">
          <div className="relative flex-1">
            <div className="flex items-center justify-between border-b border-white/5 bg-[#050714] px-6 py-3 text-xs text-[#A8B2D1]">
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-white/10 px-3 py-1">23 个节点可用</span>
                <span className="rounded-full border border-white/10 px-3 py-1">定位策略：AXUI / OCR / Image</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <button className="rounded-lg border border-white/10 px-3 py-1">缩小</button>
                <button className="rounded-lg border border-white/10 px-3 py-1">放大</button>
                <button className="rounded-lg border border-white/10 px-3 py-1">适配画布</button>
              </div>
            </div>
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onSelectionChange={onSelectionChange}
              onConnect={onConnect}
              fitView
            >
              <Background gap={16} color="#1F2442" />
              <Controls className="!bg-[#0B1024]/80 !text-white" />
              <MiniMap className="!bg-[#0B1024]" />
            </ReactFlow>
          </div>
          <NodeInspector
            node={selectedNode}
            onUpdate={(updates) => {
              if (!selectedNode) return;
              updateNode(selectedNode.id, updates);
            }}
            onDelete={() => {
              if (!selectedNode) return;
              deleteNode(selectedNode.id);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default WorkflowDesignerPage;
