import React, { useEffect, useState } from 'react';
import SectionHeader from '@/components/common/SectionHeader';
import GlassPanel from '@/components/common/GlassPanel';
import { useAssistantStore } from '@/stores/assistantStore';

const CommandCenterPage: React.FC = () => {
  const { tasks, activeTask, hydrate, plan, complete, loading } = useAssistantStore();
  const [query, setQuery] = useState('整理本周销售报表并通知销售群');

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="AI Assistant" title="指挥官入口" description="自然语言 → 计划 → 执行 → 汇报" />

      <GlassPanel>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <textarea
            className="flex-1 rounded-2xl border border-white/10 bg-[#050714] p-4 text-sm text-white outline-none"
            rows={3}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type="button"
            className="rounded-2xl bg-gradient-to-r from-[#FFB800] to-[#FF8A00] px-6 py-3 text-sm font-semibold text-[#050714] disabled:opacity-50"
            onClick={() => plan(query)}
            disabled={loading}
          >
            {loading ? '规划中...' : '生成计划'}
          </button>
        </div>
        {activeTask && (
          <div className="mt-4 space-y-3">
            {activeTask.steps.map((step) => (
              <div key={step.id} className="rounded-xl border border-white/10 bg-[#050714]/50 px-4 py-3 text-sm text-white">
                <p className="font-semibold">{step.description}</p>
                <p className="text-xs text-[#6B7A99]">状态：{step.status}</p>
                {step.result && <p className="text-xs text-[#A8B2D1] mt-1">{step.result}</p>}
              </div>
            ))}
            {activeTask.status !== 'completed' && (
              <button
                type="button"
                className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white"
                onClick={() => complete(activeTask.id, '已同步到工作流并通知群组')}
              >
                标记完成
              </button>
            )}
          </div>
        )}
      </GlassPanel>

      <GlassPanel>
        <p className="text-sm text-[#A8B2D1]">历史任务</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-xl border border-white/10 bg-[#050714]/40 px-4 py-3 text-sm text-white">
              <p className="font-semibold">{task.query}</p>
              <p className="text-xs text-[#6B7A99]">意图：{task.intent} · 状态：{task.status}</p>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
};

export default CommandCenterPage;
