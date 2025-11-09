import React, { useEffect } from 'react';
import SectionHeader from '@/components/common/SectionHeader';
import GlassPanel from '@/components/common/GlassPanel';
import { useMultiAgentStore } from '@/stores/multiAgentStore';

const MultiAgentStudioPage: React.FC = () => {
  const { orchestrations, meetings, hydrate } = useMultiAgentStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Multi-Agent" title="协同拓扑" description="可视化组织结构与会议轮次" />

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassPanel>
          <p className="text-sm text-[#A8B2D1]">组织结构</p>
          <div className="mt-4 space-y-3 text-sm text-white">
            {orchestrations.map((orch) => (
              <div key={orch.id} className="rounded-xl border border-white/10 bg-[#050714]/50 px-4 py-3">
                <p className="font-semibold">{orch.name}</p>
                <p className="text-xs text-[#6B7A99]">模式：{orch.mode}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#A8B2D1]">
                  {orch.participants.map((participant) => (
                    <span key={participant.id} className="rounded-full border border-white/10 px-2 py-1">
                      {participant.role}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {orchestrations.length === 0 && <p className="text-xs text-[#6B7A99]">暂无组织</p>}
          </div>
        </GlassPanel>

        <GlassPanel>
          <p className="text-sm text-[#A8B2D1]">会议记录</p>
          <div className="mt-3 space-y-2 text-sm text-white max-h-72 overflow-y-auto">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="rounded-xl border border-white/10 px-4 py-3">
                <p className="font-semibold">{meeting.topic}</p>
                <p className="text-xs text-[#6B7A99]">轮次 {meeting.round}/{meeting.max_rounds} · {meeting.status}</p>
              </div>
            ))}
            {meetings.length === 0 && <p className="text-xs text-[#6B7A99]">暂无会议</p>}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};

export default MultiAgentStudioPage;
