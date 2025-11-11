import { useCallback, useState, useRef, useEffect, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useWorkflowStore } from '@/stores/workflowStore';
import { NodeLibraryPanel } from '@/components/workflow/NodeLibraryPanel';
import { NodeInspector } from '@/components/workflow/NodeInspector';
import { NodeDefinition } from '@/types/nodes';
import { INode } from '@/types';

// 扩展 Window 接口以支持全局拖拽状态
declare global {
  interface Window {
    __draggedNode?: NodeDefinition;
  }
}

function WorkflowDesignerContent() {
  const navigate = useNavigate();
  const { currentWorkflow, saveWorkflow, isDirty, updateNode, deleteNode } = useWorkflowStore();

  const [nodes, setNodes, onNodesChange] = useNodesState(currentWorkflow?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(currentWorkflow?.edges || []);
  const [selectedNode, setSelectedNode] = useState<INode | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node as INode);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      
      // 尝试从 dataTransfer 获取数据（浏览器）
      let nodeDefinition: NodeDefinition | null = null;
      try {
        const nodeData = event.dataTransfer.getData('application/reactflow');
        if (nodeData) {
          nodeDefinition = JSON.parse(nodeData);
        }
      } catch (e) {
        console.log('Failed to get data from dataTransfer');
      }

      // 如果 dataTransfer 失败，使用全局状态（Tauri）
      if (!nodeDefinition && (window as any).__draggedNode) {
        nodeDefinition = (window as any).__draggedNode;
      }

      if (!nodeDefinition) return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: INode = {
        id: `${nodeDefinition.type}_${Date.now()}`,
        type: nodeDefinition.type,
        position,
        data: {
          label: nodeDefinition.label,
          description: nodeDefinition.description,
          config: nodeDefinition.defaultConfig,
        },
      };

      setNodes((nds) => nds.concat(newNode));
      
      // 清理全局状态
      window.__draggedNode = undefined;
    },
    [reactFlowInstance, setNodes]
  );

  // 添加双击添加节点的功能（Tauri 兼容）
  const addNodeToCenter = useCallback(
    (nodeDefinition: NodeDefinition) => {
      if (!reactFlowInstance) return;

      // 获取画布中心位置
      const { x, y, zoom } = reactFlowInstance.getViewport();
      const centerX = (window.innerWidth / 2 - x) / zoom;
      const centerY = (window.innerHeight / 2 - y) / zoom;

      const newNode: INode = {
        id: `${nodeDefinition.type}_${Date.now()}`,
        type: nodeDefinition.type,
        position: { x: centerX - 100, y: centerY - 50 }, // 居中偏移
        data: {
          label: nodeDefinition.label,
          description: nodeDefinition.description,
          config: nodeDefinition.defaultConfig,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  // 监听双击添加节点事件
  useEffect(() => {
    const handleAddNode = (event: CustomEvent) => {
      addNodeToCenter(event.detail);
    };

    window.addEventListener('addNodeToCanvas', handleAddNode as EventListener);
    return () => {
      window.removeEventListener('addNodeToCanvas', handleAddNode as EventListener);
    };
  }, [addNodeToCenter]);

  const handleSave = async () => {
    await saveWorkflow();
  };

  const handleNodeUpdate = (nodeId: string, updates: Partial<INode>) => {
    updateNode(nodeId, updates);
    setNodes((nds) =>
      nds.map((node) => (node.id === nodeId ? { ...node, ...updates } : node))
    );
    if (selectedNode?.id === nodeId) {
      setSelectedNode((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const handleNodeDelete = (nodeId: string) => {
    deleteNode(nodeId);
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* 顶部工具栏 */}
      <div className="h-14 bg-jarvis-panel/30 border-b border-white/5 flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <button className="btn-ghost" onClick={() => navigate('/dashboard')}>
            ← 返回
          </button>
          <div className="border-l border-white/10 h-6" />
          <input
            type="text"
            value={currentWorkflow?.name || '未命名工作流'}
            className="input w-64"
            placeholder="工作流名称"
            readOnly
          />
          <span className="text-xs text-jarvis-text-secondary">
            v{currentWorkflow?.version || '1.0.0'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {isDirty && <span className="text-xs text-yellow-400">● 未保存</span>}
          <button className="btn-secondary" onClick={handleSave}>
            💾 保存
          </button>
          <button className="btn-primary">🚀 发布</button>
        </div>
      </div>

      {/* 主要内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧节点库 */}
        <div className="w-72 bg-jarvis-panel/30 border-r border-white/5">
          <NodeLibraryPanel />
        </div>

        {/* 中间画布 */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
            className="bg-jarvis-space"
          >
            <Background color="#FFB800" gap={16} size={1} />
            <Controls className="bg-jarvis-panel border border-white/10 rounded-lg" />
            <MiniMap
              className="bg-jarvis-panel border border-white/10 rounded-lg"
              nodeColor="#FFB800"
            />
          </ReactFlow>
        </div>

        {/* 右侧配置面板 */}
        <div className="w-80 bg-jarvis-panel/30 border-l border-white/5">
          <NodeInspector
            node={selectedNode}
            onUpdate={handleNodeUpdate}
            onDelete={handleNodeDelete}
          />
        </div>
      </div>
    </div>
  );
}

export function WorkflowDesignerPage() {
  return (
    <ReactFlowProvider>
      <WorkflowDesignerContent />
    </ReactFlowProvider>
  );
}
