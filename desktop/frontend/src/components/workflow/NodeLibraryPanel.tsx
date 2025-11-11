import { useState, DragEvent, useEffect } from 'react';
import { NODE_DEFINITIONS, NodeCategory } from '@/types/nodes';

export function NodeLibraryPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<NodeCategory>>(
    new Set(['ui_automation'])
  );
  const onDragStart = (event: DragEvent, nodeDefinition: any) => {
    // 保存到全局状态，因为 Tauri 中 dataTransfer 可能不可用
    window.__draggedNode = nodeDefinition;

    // 尝试设置 dataTransfer（浏览器中有效）
    try {
      event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeDefinition));
      event.dataTransfer.effectAllowed = 'move';
    } catch (e) {
      console.log('dataTransfer not available, using fallback');
    }
  };

  const onDragEnd = () => {
    // 清理
    window.__draggedNode = undefined;
  };

  const onNodeDoubleClick = (nodeDefinition: any) => {
    // 触发自定义事件，让父组件处理
    window.dispatchEvent(
      new CustomEvent('addNodeToCanvas', {
        detail: nodeDefinition,
      })
    );
  };

  useEffect(() => {
    // 清理函数
    return () => {
      window.__draggedNode = undefined;
    };
  }, []);

  const toggleCategory = (category: NodeCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const filteredNodes = NODE_DEFINITIONS.filter((node) =>
    node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const nodesByCategory = filteredNodes.reduce((acc, node) => {
    if (!acc[node.category]) {
      acc[node.category] = [];
    }
    acc[node.category].push(node);
    return acc;
  }, {} as Record<NodeCategory, typeof NODE_DEFINITIONS>);

  const categoryLabels: Record<NodeCategory, string> = {
    ui_automation: 'UI 自动化',
    flow_control: '流程控制',
    integration: '集成',
    file_operation: '文件操作',
    system_operation: '系统操作',
    ai_operation: 'AI 操作',
  };

  const categoryIcons: Record<NodeCategory, string> = {
    ui_automation: '🖱️',
    flow_control: '🔀',
    integration: '🔗',
    file_operation: '📁',
    system_operation: '⚙️',
    ai_operation: '🤖',
  };

  return (
    <div className="h-full flex flex-col">
      {/* 搜索框 */}
      <div className="p-4 border-b border-white/5">
        <input
          type="text"
          placeholder="🔍 搜索节点..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 bg-jarvis-panel border border-white/10 rounded-lg text-sm text-jarvis-text focus:outline-none focus:border-jarvis-primary"
        />
      </div>

      {/* 节点列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {Object.entries(nodesByCategory).map(([category, nodes]) => (
          <div key={category} className="space-y-1">
            {/* 分类标题 */}
            <button
              onClick={() => toggleCategory(category as NodeCategory)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-jarvis-text hover:bg-white/5 rounded-lg transition-colors"
            >
              <span className="flex items-center space-x-2">
                <span>{categoryIcons[category as NodeCategory]}</span>
                <span>{categoryLabels[category as NodeCategory]}</span>
                <span className="text-xs text-jarvis-text-secondary">({nodes.length})</span>
              </span>
              <span className="text-jarvis-text-secondary">
                {expandedCategories.has(category as NodeCategory) ? '▼' : '▶'}
              </span>
            </button>

            {/* 节点列表 */}
            {expandedCategories.has(category as NodeCategory) && (
              <div className="space-y-1 pl-2">
                {nodes.map((node) => (
                  <div
                    key={node.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, node)}
                    onDragEnd={onDragEnd}
                    onDoubleClick={() => onNodeDoubleClick(node)}
                    className="group cursor-move px-3 py-2 bg-jarvis-panel/50 hover:bg-jarvis-panel border border-white/5 hover:border-jarvis-primary/50 rounded-lg transition-all"
                    title="拖拽或双击添加到画布"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{node.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-jarvis-text truncate">
                          {node.label}
                        </div>
                        <div className="text-xs text-jarvis-text-secondary truncate">
                          {node.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {filteredNodes.length === 0 && (
          <div className="text-center py-8 text-jarvis-text-secondary">
            <div className="text-4xl mb-2">🔍</div>
            <div className="text-sm">未找到匹配的节点</div>
          </div>
        )}
      </div>
    </div>
  );
}
