import React, { useEffect } from 'react';
import SectionHeader from '@/components/common/SectionHeader';
import GlassPanel from '@/components/common/GlassPanel';
import { useVoiceStore } from '@/stores/voiceStore';

const VoiceOpsPage: React.FC = () => {
  const { devices, stats, calls, hydrate, startCall, finishCall } = useVoiceStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Voice" title="自动化通话中枢" description="检测设备、监控统计并查看通话记录" />

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassPanel>
          <p className="text-sm text-[#A8B2D1]">音频设备</p>
          <ul className="mt-4 space-y-2 text-sm text-white">
            {devices.map((device) => (
              <li key={device.id} className="rounded-xl border border-white/10 px-3 py-2 flex items-center justify-between">
                <span>{device.name}</span>
                <span className="text-xs text-[#6B7A99]">{device.type}{device.is_virtual ? ' · 虚拟' : ''}</span>
              </li>
            ))}
          </ul>
        </GlassPanel>

        <GlassPanel>
          <p className="text-sm text-[#A8B2D1]">统计</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white">
            <div>
              <p className="text-xs text-[#6B7A99]">今日通话</p>
              <p className="text-3xl">{stats?.today ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-[#6B7A99]">平均时长</p>
              <p className="text-3xl">{stats?.avg_duration ?? 0}s</p>
            </div>
            <div>
              <p className="text-xs text-[#6B7A99]">累计时长</p>
              <p className="text-3xl">{stats?.total_duration ?? 0}s</p>
            </div>
            <div>
              <p className="text-xs text-[#6B7A99]">接通率</p>
              <p className="text-3xl">{stats ? `${stats.answer_rate * 100}%` : '--'}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2 text-xs text-[#6B7A99]">
            <button
              type="button"
              className="rounded-xl border border-white/10 px-3 py-2 text-white"
              onClick={() => startCall('测试来电')}
            >
              模拟来电
            </button>
            {calls[0] && calls[0].status === 'active' && (
              <button
                type="button"
                className="rounded-xl border border-white/10 px-3 py-2 text-white"
                onClick={() => finishCall(calls[0].id, '自动总结完成')}
              >
                结束当前
              </button>
            )}
          </div>
        </GlassPanel>

        <GlassPanel>
          <p className="text-sm text-[#A8B2D1]">通话记录</p>
          <div className="mt-3 space-y-2 text-sm text-white max-h-64 overflow-y-auto">
            {calls.map((call) => (
              <div key={call.id} className="rounded-xl border border-white/10 px-3 py-2">
                <p className="font-semibold">{call.contact}</p>
                <p className="text-xs text-[#6B7A99]">{call.channel} · {call.duration_seconds}s · {call.status}</p>
              </div>
            ))}
            {calls.length === 0 && <p className="text-xs text-[#6B7A99]">暂无通话</p>}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};

export default VoiceOpsPage;
