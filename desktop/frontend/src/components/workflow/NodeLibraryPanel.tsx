import React, { useMemo, useState } from 'react';
import type { NodeDefinition, NodeCategory } from '@/types/nodes';
import { NODE_CATEGORY_ORDER } from '@/types/nodes';

interface NodeLibraryPanelProps {
  definitions: NodeDefinition[];
  onAdd: (definition: NodeDefinition) => void;
}

const NodeLibraryPanel: React.FC<NodeLibraryPanelProps> = ({ definitions, onAdd }) => {
  const [keyword, setKeyword] = useState('');
  const categorized = useMemo(() => {
    const map = new Map<NodeCategory, NodeDefinition[]>();
    definitions.forEach((def) => {
      if (keyword && !`${def.label}${def.description}`.toLowerCase().includes(keyword.toLowerCase())) {
        return;
      }
      const list = map.get(def.category) ?? [];
      list.push(def);
      map.set(def.category, list);
    });
    return map;
  }, [definitions, keyword]);

  return (
    <aside className="flex w-64 flex-col border-r border-white/5 bg-[#0B1024] p-4 text-sm text-[#A8B2D1]">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-[#FFB800]">节点库</p>
        <h3 className="text-white">23 种节点</h3>
      </div>
      <input
        className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FFB800]"
        placeholder="搜索节点..."
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
      />
      <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
        {NODE_CATEGORY_ORDER.map((category) => {
          const items = categorized.get(category);
          if (!items || items.length === 0) return null;
          return (
            <div key={category} className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-[#6B7A99]">{category}</p>
              <div className="space-y-2">
                {items.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => onAdd(item)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-white transition hover:border-[#FFB800]"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span>{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <p className="mt-1 text-xs text-[#6B7A99]">{item.description}</p>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default NodeLibraryPanel;
