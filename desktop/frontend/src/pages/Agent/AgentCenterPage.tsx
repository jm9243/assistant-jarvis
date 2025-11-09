import React, { useEffect, useMemo, useState } from 'react';
import SectionHeader from '@/components/common/SectionHeader';
import GlassPanel from '@/components/common/GlassPanel';
import { useAgentStore } from '@/stores/agentStore';

const AgentCenterPage: React.FC = () => {
  const {
    agents,
    templates,
    chatLog,
    activeAgentId,
    hydrate,
    selectAgent,
    sendMessage,
    createAgent,
  } = useAgentStore();
  const [message, setMessage] = useState('');
  const [agentForm, setAgentForm] = useState({ name: '', type: 'basic' });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const activeAgent = useMemo(() => agents.find((agent) => agent.id === activeAgentId) ?? null, [agents, activeAgentId]);

  const handleSend = async () => {
    if (!message.trim()) return;
    await sendMessage(message.trim());
    setMessage('');
  };

  const handleCreateAgent = async () => {
    if (!agentForm.name.trim()) return;
    await createAgent(agentForm);
    setAgentForm({ name: '', type: 'basic' });
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Agent Center"
        title="多智能体驾驶舱"
        description="管理模板、监控状态并与 Agent 协作对话"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassPanel>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#A8B2D1]">已注册 Agent</p>
            <button
              type="button"
              className="rounded-lg border border-white/10 px-3 py-1 text-xs text-white"
              onClick={handleCreateAgent}
            >
              新建
            </button>
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-white/10 px-3 py-2 text-xs text-[#A8B2D1] flex gap-2">
              <input
                className="flex-1 bg-transparent outline-none"
                placeholder="Agent 名称"
                value={agentForm.name}
                onChange={(event) => setAgentForm((prev) => ({ ...prev, name: event.target.value }))}
              />
              <select
                className="rounded-lg bg-[#050714] px-2 py-1 text-white text-xs"
                value={agentForm.type}
                onChange={(event) => setAgentForm((prev) => ({ ...prev, type: event.target.value }))}
              >
                <option value="basic">基础</option>
                <option value="react">ReAct</option>
                <option value="research">Research</option>
              </select>
            </div>
            {agents.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => selectAgent(agent.id)}
                className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                  agent.id === activeAgentId
                    ? 'border-[#FFB800]/60 bg-[#FFB800]/10'
                    : 'border-white/10 bg-[#050714]/40'
                }`}
              >
                <p className="text-white">{agent.name}</p>
                <p className="text-xs text-[#6B7A99]">{agent.type.toUpperCase()} · {agent.status}</p>
              </button>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#FFB800]">对话面板</p>
              <p className="text-sm text-[#A8B2D1]">{activeAgent ? activeAgent.name : '请选择一个 Agent'}</p>
            </div>
          </div>
          <div className="mt-4 h-64 overflow-y-auto space-y-3 pr-2 text-sm text-white">
            {chatLog.length === 0 && (
              <p className="text-xs text-[#6B7A99]">等待输入...</p>
            )}
            {chatLog.map((messageItem, index) => (
              <div key={`${messageItem.timestamp}-${index}`} className="rounded-xl border border-white/10 bg-[#050714]/60 px-3 py-2">
                <p className="text-xs text-[#6B7A99]">{messageItem.role}</p>
                <p>{messageItem.content}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <input
              className="flex-1 rounded-xl border border-white/10 bg-[#050714] px-4 py-3 text-sm text-white outline-none"
              placeholder="请输入指令..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <button
              type="button"
              className="rounded-xl bg-gradient-to-r from-[#FFB800] to-[#FF8A00] px-4 py-3 text-sm font-semibold text-[#050714]"
              onClick={handleSend}
              disabled={!activeAgentId}
            >
              发送
            </button>
          </div>
        </GlassPanel>
      </div>

      <GlassPanel>
        <p className="text-xs uppercase tracking-[0.3em] text-[#FFB800]">模板库</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {templates.map((template) => (
            <div key={template.id} className="rounded-xl border border-white/10 bg-[#050714]/50 px-4 py-3 text-sm text-white">
              <p className="font-semibold">{template.name}</p>
              <p className="text-xs text-[#6B7A99] mt-1">{template.description}</p>
              <p className="mt-2 text-xs text-[#A8B2D1]">推荐工具：{template.recommended_tools.join(', ') || '—'}</p>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
};

export default AgentCenterPage;
