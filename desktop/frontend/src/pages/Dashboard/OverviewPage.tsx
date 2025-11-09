import React from 'react';
import SectionHeader from '@/components/common/SectionHeader';
import GlassPanel from '@/components/common/GlassPanel';

const heroCards = [
  { label: '进行中工作流', value: '08', trend: '+2', accent: 'text-jarvis-gold' },
  { label: '待处理异常', value: '03', trend: '-1', accent: 'text-jarvis-warning' },
  { label: '系统健康度', value: '99%', trend: '+1%', accent: 'text-jarvis-success' },
];

const activity = [
  { time: '09:42', title: 'RPA-审批流', detail: '完成 · 21 步', status: '完成' },
  { time: '09:15', title: '合同 OCR', detail: '触发执行 · 3 节点', status: '执行中' },
  { time: '08:50', title: 'UI 录制草稿', detail: '自动生成 12 步', status: '草稿' },
];

const OverviewPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="今日看板"
        title="工作流执行概览"
        description="Phase 1 聚焦基础工作流，Agent / 知识库标记即将到来"
        actions={(
          <>
            <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:border-jarvis-gold">
              导入工作流
            </button>
            <button className="rounded-xl bg-gradient-to-r from-jarvis-gold to-[#FF8A00] px-4 py-2 text-sm font-semibold text-[#050714] shadow-jarvis-glow">
              + 新建工作流
            </button>
          </>
        )}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {heroCards.map((card) => (
          <GlassPanel key={card.label}>
            <p className="text-sm text-[#A8B2D1]">{card.label}</p>
            <p className="mt-2 text-4xl font-semibold text-white">{card.value}</p>
            <p className={`text-xs ${card.accent}`}>{card.trend} · 与昨日相比</p>
          </GlassPanel>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <GlassPanel className="col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#A8B2D1]">实时执行</p>
              <p className="text-xs text-[#6B7A99]">同步 FastAPI 引擎日志</p>
            </div>
            <span className="rounded-full border border-jarvis-gold/40 px-3 py-1 text-xs text-jarvis-gold">LIVE</span>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-[#A8B2D1]">
            {activity.map((item) => (
              <li key={item.time} className="flex items-center justify-between rounded-xl border border-white/5 bg-[#050714]/40 px-4 py-3">
                <div>
                  <p className="text-white">{item.title}</p>
                  <p className="text-xs text-[#6B7A99]">{item.detail}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#6B7A99]">{item.time}</p>
                  <p className="text-xs text-jarvis-gold">{item.status}</p>
                </div>
              </li>
            ))}
          </ul>
        </GlassPanel>

        <GlassPanel dashed className="bg-jarvis-gold/5 text-sm text-[#A8B2D1]">
          <p className="text-jarvis-gold">功能即将到来</p>
          <p className="mt-3 text-white text-lg font-semibold">Agent 中心 · 知识库 · 通话协作</p>
          <p className="mt-2 text-xs text-[#6B7A99]">Phase 1 专注工作流闭环，未来版本逐步开放</p>
          <div className="mt-6 space-y-2 text-xs">
            <p>· 多 Agent 会议室</p>
            <p>· 知识库分层检索</p>
            <p>· 智能语音中控</p>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};

export default OverviewPage;
