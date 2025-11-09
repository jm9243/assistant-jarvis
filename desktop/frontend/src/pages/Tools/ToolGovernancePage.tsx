import React, { useEffect, useMemo, useState } from 'react';
import SectionHeader from '@/components/common/SectionHeader';
import GlassPanel from '@/components/common/GlassPanel';
import { useToolStore } from '@/stores/toolStore';

const chipStyle = 'rounded-full border px-3 py-1 text-xs transition';

const ToolGovernancePage: React.FC = () => {
  const { tools, approvals, audits, kpi, hydrate, registerTool } = useToolStore();
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [toolForm, setToolForm] = useState({ name: '', description: '', type: 'workflow' });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    tools.forEach((tool) => {
      map.set(tool.type, (map.get(tool.type) ?? 0) + 1);
    });
    return Array.from(map.entries());
  }, [tools]);

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchCategory = category === 'all' || tool.type === category;
      const lowerKeyword = keyword.trim().toLowerCase();
      const matchKeyword = lowerKeyword.length === 0
        || tool.name.toLowerCase().includes(lowerKeyword)
        || (tool.description ?? '').toLowerCase().includes(lowerKeyword);
      return matchCategory && matchKeyword;
    });
  }, [tools, keyword, category]);

  const handleRegister = async () => {
    if (!toolForm.name.trim()) return;
    await registerTool({
      name: toolForm.name,
      description: toolForm.description || '未填写描述',
      type: toolForm.type,
      approval_required: false,
      enabled: true,
    });
    setToolForm({ name: '', description: '', type: 'workflow' });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Tools"
        title="工具商店 · 治理面板"
        description="浏览工具、追踪审批与审计，确保调用合规"
        actions={(
          <div className="flex flex-wrap gap-2">
            <input
              className="rounded-2xl border border-white/10 bg-[#050714] px-4 py-2 text-sm text-white placeholder:text-[#6B7A99]"
              placeholder="搜索工具 / 描述关键词"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            <button
              type="button"
              className="rounded-2xl bg-gradient-to-r from-[#FFB800] to-[#FF8A00] px-4 py-2 text-sm font-semibold text-[#050714]"
              onClick={() => setShowForm(true)}
            >
              + 注册工具
            </button>
          </div>
        )}
      />

      <GlassPanel>
        <div className="flex flex-wrap gap-2 text-xs text-[#6B7A99]">
          <button
            type="button"
            className={`${chipStyle} ${category === 'all' ? 'border-[#FFB800]/50 bg-[#FFB800]/10 text-white' : 'border-white/10 text-[#A8B2D1]'}`}
            onClick={() => setCategory('all')}
          >
            全部 ({tools.length})
          </button>
          {categories.map(([type, count]) => (
            <button
              type="button"
              key={type}
              className={`${chipStyle} ${category === type ? 'border-[#FFB800]/50 bg-[#FFB800]/10 text-white' : 'border-white/10 text-[#A8B2D1]'}`}
              onClick={() => setCategory(type)}
            >
              {type} ({count})
            </button>
          ))}
        </div>
      </GlassPanel>

      <div className="grid gap-4 lg:grid-cols-4">
        <GlassPanel>
          <p className="text-xs uppercase tracking-[0.3em] text-[#FFB800]">调用量</p>
          <p className="mt-2 text-3xl text-white">{kpi?.calls ?? 0}</p>
          <p className="text-xs text-[#6B7A99]">累计调用</p>
        </GlassPanel>
        <GlassPanel>
          <p className="text-xs uppercase tracking-[0.3em] text-[#FFB800]">成功率</p>
          <p className="mt-2 text-3xl text-[#00F5A0]">{kpi ? `${Math.round(kpi.success_rate * 100)}%` : '--'}</p>
          <p className="text-xs text-[#6B7A99]">自动审批优先</p>
        </GlassPanel>
        <GlassPanel>
          <p className="text-xs uppercase tracking-[0.3em] text-[#FFB800]">平均耗时</p>
          <p className="mt-2 text-3xl text-white">{kpi?.avg_duration ?? 0}ms</p>
          <p className="text-xs text-[#6B7A99]">近24h聚合</p>
        </GlassPanel>
        <GlassPanel>
          <p className="text-xs uppercase tracking-[0.3em] text-[#FFB800]">待审批</p>
          <p className="mt-2 text-3xl text-[#FFB800]">{approvals.filter((item) => item.status === 'pending').length}</p>
          <p className="text-xs text-[#6B7A99]">需要人工确认</p>
        </GlassPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <p className="mb-3 text-sm text-[#A8B2D1]">工具卡片 · {filteredTools.length}</p>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
            {filteredTools.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-[#6B7A99]">
                未找到匹配的工具
              </div>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <GlassPanel>
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-[#FFB800]">审批队列</p>
              <span className="text-xs text-[#6B7A99]">{approvals.length} 条</span>
            </div>
            <div className="mt-3 space-y-2 text-sm text-white max-h-60 overflow-y-auto pr-1">
              {approvals.map((approval) => (
                <div key={approval.id} className="rounded-xl border border-white/10 bg-[#050714]/50 px-3 py-2">
                  <p className="font-medium">{approval.reason}</p>
                  <p className="text-xs text-[#6B7A99]">状态：{approval.status}</p>
                </div>
              ))}
              {approvals.length === 0 && <p className="text-xs text-[#6B7A99]">暂无审批请求</p>}
            </div>
          </GlassPanel>
          <GlassPanel>
            <p className="text-xs uppercase tracking-[0.3em] text-[#FFB800]">审计时间线</p>
            <div className="mt-3 space-y-3 text-xs text-white max-h-64 overflow-y-auto pr-1">
              {audits.map((audit) => (
                <div key={audit.id} className="rounded-xl border border-white/10 px-3 py-2">
                  <p className="font-semibold">{audit.tool_id}</p>
                  <p className="text-[#A8B2D1]">{audit.status} · {audit.duration_ms}ms</p>
                  <p className="text-[#6B7A99]">{audit.created_at}</p>
                </div>
              ))}
              {audits.length === 0 && <p className="text-[#6B7A99]">暂无审计记录</p>}
            </div>
          </GlassPanel>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4 py-8">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#050714] p-6 text-sm text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold">注册工具</p>
              <button type="button" className="text-[#6B7A99]" onClick={() => setShowForm(false)}>关闭</button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="space-y-1">
                <span className="text-xs text-[#6B7A99]">名称</span>
                <input
                  className="w-full rounded-xl border border-white/10 bg-[#0F1328] px-3 py-2"
                  value={toolForm.name}
                  onChange={(event) => setToolForm((prev) => ({ ...prev, name: event.target.value }))}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-[#6B7A99]">类型</span>
                <select
                  className="w-full rounded-xl border border-white/10 bg-[#0F1328] px-3 py-2"
                  value={toolForm.type}
                  onChange={(event) => setToolForm((prev) => ({ ...prev, type: event.target.value }))}
                >
                  <option value="workflow">Workflow</option>
                  <option value="mcp">MCP</option>
                  <option value="http">HTTP</option>
                  <option value="system">System</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs text-[#6B7A99]">描述</span>
                <textarea
                  className="w-full rounded-xl border border-white/10 bg-[#0F1328] px-3 py-2"
                  rows={4}
                  value={toolForm.description}
                  onChange={(event) => setToolForm((prev) => ({ ...prev, description: event.target.value }))}
                />
              </label>
              <button
                type="button"
                className="w-full rounded-xl bg-gradient-to-r from-[#FFB800] to-[#FF8A00] px-4 py-3 text-sm font-semibold text-[#050714]"
                onClick={handleRegister}
              >
                保存工具
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ToolCardProps {
  tool: {
    id: string;
    name: string;
    type: string;
    description?: string;
    approval_required?: boolean;
    enabled?: boolean;
    metadata?: Record<string, unknown>;
  };
}

const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const badgeColor = tool.enabled === false ? 'bg-red-500/20 text-red-200' : 'bg-[#00F5A0]/20 text-[#00F5A0]';
  const approvalLabel = tool.approval_required ? '需审批' : '自动调用';
  return (
    <div className="rounded-2xl border border-white/10 bg-[#050714]/60 p-4 text-sm text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold">{tool.name}</p>
          <p className="text-xs text-[#6B7A99]">{tool.type}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs ${badgeColor}`}>
          {tool.enabled === false ? '已禁用' : '已启用'}
        </span>
      </div>
      <p className="mt-3 text-xs text-[#A8B2D1] min-h-[48px]">{tool.description ?? '暂无描述'}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-[#6B7A99]">
        <span>{approvalLabel}</span>
        <span>调用 {tool.metadata?.calls ?? '--'}</span>
      </div>
      <div className="mt-4 flex gap-2 text-xs">
        <button className="flex-1 rounded-xl border border-white/10 px-3 py-2 text-white">配置</button>
        <button className="flex-1 rounded-xl border border-white/10 px-3 py-2 text-white">测试</button>
        <button className="flex-1 rounded-xl border border-white/10 px-3 py-2 text-white">禁用</button>
      </div>
    </div>
  );
};

export default ToolGovernancePage;
