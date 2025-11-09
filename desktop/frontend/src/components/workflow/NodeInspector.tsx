import React, { useEffect, useMemo, useState } from 'react';
import type { INode } from '@/types';

interface NodeInspectorProps {
  node: INode | null;
  onUpdate: (updates: Partial<INode>) => void;
  onDelete: () => void;
}

const NodeInspector: React.FC<NodeInspectorProps> = ({ node, onUpdate, onDelete }) => {
  const [jsonError, setJsonError] = useState<string | null>(null);
  const serializedConfig = useMemo(() => {
    return node ? JSON.stringify(node.config, null, 2) : '';
  }, [node]);
  const [configDraft, setConfigDraft] = useState(serializedConfig);

  useEffect(() => {
    setConfigDraft(serializedConfig);
    setJsonError(null);
  }, [serializedConfig]);

  if (!node) {
    return (
      <aside className="w-72 border-l border-white/5 bg-[#0B1024] p-4 text-sm text-[#6B7A99]">
        <p>选择一个节点以查看配置</p>
      </aside>
    );
  }

  return (
    <aside className="w-72 border-l border-white/5 bg-[#0B1024] p-4 text-sm text-[#A8B2D1]">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-[#FFB800]">节点属性</p>
        <h3 className="text-white">{node.label}</h3>
        <p className="text-xs text-[#6B7A99]">ID: {node.id}</p>
      </div>

      <div className="mt-4 space-y-3">
        <label className="text-xs text-[#6B7A99]">
          节点标题
          <input
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FFB800]"
            value={node.label}
            onChange={(event) => onUpdate({ label: event.target.value })}
          />
        </label>

        <label className="text-xs text-[#6B7A99]">
          JSON 配置
          <textarea
            className="mt-1 h-48 w-full rounded-lg border border-white/10 bg-[#050714] px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#FFB800]"
            value={configDraft}
            onChange={(event) => setConfigDraft(event.target.value)}
            onBlur={() => {
              try {
                const parsed = JSON.parse(configDraft || '{}');
                setJsonError(null);
                onUpdate({ config: parsed });
              } catch (error) {
                setJsonError('JSON 解析失败，请检查格式');
              }
            }}
          />
        </label>
        {jsonError && (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">{jsonError}</p>
        )}

        <button
          type="button"
          onClick={onDelete}
          className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200 transition hover:border-red-400"
        >
          删除节点
        </button>
      </div>
    </aside>
  );
};

export default NodeInspector;
